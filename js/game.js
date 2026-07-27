let curPhase=0,curRound=0;
const DIM_NAMES=['体质','体术','咒力总量','咒力效率','咒力操纵','术式性能','天赋','意志','运势','魅力','声望','信用'];
const DIM_LEVELS=['E-','E','D','C','B','A','S','SS','SSS','EX'];
function dimVal(lv){return lv?DIM_LEVELS.indexOf(lv):-1}
function dimLv(n){if(n<0)return'E-';if(n>=DIM_LEVELS.length-1)return'EX+';return DIM_LEVELS[n]}
function dimColor(idx){if(idx>=9)return'#ffffff';if(idx>=8)return'#ffcc00';if(idx>=7)return'#ff2200';if(idx>=6)return'#ff5500';if(idx>=5)return'#cc8844';if(idx>=3)return'#4488aa';if(idx>=2)return'#888888';return'#884444'}
function visibleTraits(){const hidden=['moral_LG','moral_LN','moral_LE','人','咒灵','pers_1','pers_2','pers_3','skill_1','skill_2','skill_3','skill_4','skill_5','skill_6','skill_7','skill_8','skill_9','dom_eff_1','dom_eff_2','dom_eff_3','dom_eff_4','dom_eff_5','dom_eff_6','ctool_1','ctool_2','ctool_3','ctool_4','ctool_5','corp_1','corp_2','corp_3','corp_4','corp_5','corp_6','领域展开','自定义术式','有术式','单类型','双类型','三类型','无术式'];return state.traits.filter(t=>!hidden.includes(t)&&!t.startsWith('era_')&&!t.startsWith('pers_')&&!t.startsWith('skill_')&&!t.startsWith('dom_eff_')&&!t.startsWith('ctool_')&&!t.startsWith('corp_'))}
function initDimensions(){const d={};DIM_NAMES.forEach(k=>d[k]=null);return d}
const state={spinning:false,results:[],traits:[],dimensions:initDimensions(),skills:[],persDrawn:[],drawnSkills:[],targetAngle:0,startAngle:0,startTime:0,duration:0,lastAngle:0,curTab:'wheel',editorOpen:false,introDone:false,combat:{active:false,enemyId:null,stance:null,stamina:0,ce:0,win:0,shield:0,hp:0,enemyStamina:0,enemyCe:0,enemyWin:0,enemyHp:0,clockBK:0,clockLB:0,dangerZone:0,burnout:false,bfCombo:0,domainUsed:false,maxUsed:false,round:0,enemyWnd:0}};
const SKILL_CHAINS={'领域展开':['p2_dt','p2_dn','p2_de1','p2_de2','p2_de3','p2_de4','p2_de5','p2_de6','p2_dname'],'极之番':['p2_max','p2_mname'],'咒骸制作':['p2_corpQ','p2_corpP1','p2_corpP2','p2_corpP3','p2_corpP4','p2_corpP5','p2_corpP6']};
let wheel,particles;

// ========================================================= RENDER =========================================================
function refreshAll(){refreshTopBar();refreshSidebar();refreshRound();refreshRight();refreshTabs();updateBadges();}
function updateCombatUI(){}
// ========================================================= RENDER =========================================================
function refreshAll(){refreshTopBar();refreshSidebar();refreshRound();refreshRight();refreshTabs();updateBadges();}

// Condition check: supports "traitName" (has trait), "dimName|op|level" (e.g. "天赋|>=|A")
function checkCond(cond){
  if(cond===null||cond===undefined)return true;
  if(cond==='')return false;
  if(typeof cond==='string'){
    if(cond.includes('|')){const[p,op,lv]=cond.split('|');const v=dimVal(state.dimensions[p]);const t=dimVal(lv);if(v<0)return false;if(op==='>=')return v>=t;if(op==='<=')return v<=t;if(op==='>')return v>t;if(op==='<')return v<t;if(op==='==')return v===t;return false}
    return state.traits.includes(cond);
  }
  // Array: all conditions must be met (AND logic)
  if(Array.isArray(cond))return cond.every(c=>checkCond(c));
  return true;
}
const ph=()=>DATA.phases[curPhase];
const rd=()=>{var ar=ph().rounds.filter(r=>checkCond(r.cond)).sort((a,b)=>a.order-b.order);return ar.length>0?ar[Math.min(curRound,ar.length-1)]:null};
const activeRounds=()=>ph().rounds.filter(r=>checkCond(r.cond)).sort((a,b)=>a.order-b.order);
const isRoundDone=(r)=>{if(!r)return false;return state.results.some(rr=>rr.roundId===r.id)};
const isPhaseDone=()=>activeRounds().every(r=>isRoundDone(r));

// ========================================================= WHEEL =========================================================
function _dark(h,amt){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return `rgb(${Math.floor(r*(1-amt))},${Math.floor(g*(1-amt))},${Math.floor(b*(1-amt))})`}
// Filter items by conditions and apply weight modifiers
function getFilteredItems(items,rid){
  return items.filter(it=>{
    if(!checkCond(it.cond))return false;
    if(it.filterDrawn){const pool=rid&&rid.startsWith('p1_pers')?state.persDrawn:state.skills;if(pool.includes(it.l))return false}
    return true;
  }).map(it=>{
    let w=it.w||1;
    if(it.wMods){it.wMods.forEach(m=>{if(checkCond(m.cond))w*=m.w})}
    if(it.addMods){it.addMods.forEach(m=>{if(checkCond(m.cond))w+=m.v})}
    return{...it,w:Math.max(0.1,w)};
  });
}
function getFilteredRoundItems(r){if(!r)return[];return getFilteredItems(r.items,r.id)}

function buildWheel(items){
  if(!items||items.length===0){items=[{l:'——',w:1,c:'#333',d:''}]}
  const canvas=document.getElementById('wheelCanvas');
  let w=canvas.parentElement.clientWidth;if(!w)w=Math.min(window.innerWidth*.8,370);const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=w*dpr;canvas.height=w*dpr;canvas.style.width=w+'px';canvas.style.height=w+'px';
  const totalW=items.reduce((s,i)=>s+(i.w||1),0);
  return{canvas,ctx:canvas.getContext('2d'),size:w,dpr,cx:w/2,cy:w/2,radius:w/2-14,
    sectors:items.map(i=>({...i,arc:(i.w||1)/totalW*Math.PI*2})),
    draw(){const ctx=this.ctx,dpr=this.dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,this.size,this.size);
      ctx.beginPath();ctx.arc(this.cx,this.cy,this.radius+6,0,Math.PI*2);ctx.strokeStyle='rgba(212,33,61,0.3)';ctx.lineWidth=3;ctx.shadowBlur=15;ctx.shadowColor='rgba(255,51,102,0.3)';ctx.stroke();ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(this.cx,this.cy,this.radius+2,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;ctx.stroke();
      let a=wheel.angle-Math.PI/2;
      for(let s of this.sectors){const sa=a,ea=a+s.arc;
        ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.arc(this.cx,this.cy,this.radius,sa,ea);ctx.closePath();
        ctx.fillStyle=s.c||'#5a5a5a';ctx.fill();
        ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.arc(this.cx,this.cy,this.radius,sa,ea);ctx.lineTo(this.cx,this.cy);
        ctx.strokeStyle='rgba(201,168,76,0.5)';ctx.lineWidth=.8;ctx.stroke();
        ctx.save();ctx.translate(this.cx,this.cy);ctx.rotate(sa+s.arc/2);ctx.textAlign='right';ctx.fillStyle='#fff';
        const fs=Math.max(9,this.radius*.09);ctx.font=`bold ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=2;ctx.fillText(s.l,this.radius-8,fs*.35);ctx.shadowBlur=0;ctx.restore();a=ea;}
      const grad=ctx.createRadialGradient(this.cx,this.cy,0,this.cx,this.cy,this.radius*.18);
      grad.addColorStop(0,'#1a1a2e');grad.addColorStop(.7,'#0a0a0c');grad.addColorStop(1,'rgba(0,0,0,0.8)');
      ctx.beginPath();ctx.arc(this.cx,this.cy,this.radius*.16,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
      ctx.strokeStyle='rgba(201,168,76,0.6)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#c9a84c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.max(11,this.radius*.1)}px serif`;ctx.fillText('呪',this.cx,this.cy);
    }
  };
}

// ========================================================= PARTICLES =========================================================
class Particle{constructor(x,y,c,s,vx,vy,l){this.x=x;this.y=y;this.c=c;this.s=s;this.vx=vx;this.vy=vy;this.l=l;this.ml=l;this.a=1}update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.vy+=25*dt;this.l-=dt;this.a=Math.max(0,this.l/this.ml);this.s*=.997}get dead(){return this.l<=0}}
class ParticleSystem{constructor(canvas){this.cv=canvas;this.ctx=canvas.getContext('2d');this.parts=[]}
  emit(x,y,n,c,sp,sz,l){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*sp;this.parts.push(new Particle(x,y,c,sz*(.5+Math.random()),Math.cos(a)*s,Math.sin(a)*s-40,l*(.6+Math.random()*.4)))}}
  update(dt){for(let p of this.parts)p.update(dt);this.parts=this.parts.filter(p=>!p.dead)}
  clear(){this.parts=[]}}

function initParticles(){const pc=document.getElementById('pCanvas');particles=new ParticleSystem(pc);}

// ========================================================= RENDER =========================================================
function refreshAll(){refreshTopBar();refreshSidebar();refreshRound();refreshRight();refreshTabs();updateBadges();}
function refreshAfterSpin(){refreshTopBar();refreshSidebar();refreshRight();refreshTabs();updateBadges();}
function getCurrentRoundIndex(){const ar=activeRounds();return ar.findIndex(r=>r===rd())}

function refreshTopBar(){
  document.getElementById('topPhase').textContent=ph().icon+' '+ph().name;
  const ar=activeRounds();const renderDots=(id)=>{const el=document.getElementById(id);if(!el)return;el.innerHTML='';const cr=rd();ar.forEach((r,i)=>{if(!r||!cr)return;const d=document.createElement('span');if(isRoundDone(r))d.className='done';if(r.id===cr.id)d.className='cur';d.style.cursor='pointer';d.onclick=()=>goRound(i);el.appendChild(d)})};
  renderDots('topDots');renderDots('centerDots');
}
function refreshSidebar(){
  if(window.innerWidth<768)return;
  const eraIdx=drawnEraIndex();
  const sbPh=document.getElementById('sbPhases');sbPh.innerHTML=DATA.phases.map((p,i)=>{
    const done=p.rounds.length>0&&p.rounds.every(r=>isRoundDone(r)||(r.cond&&!state.traits.includes(r.cond)));
    const isCur=i===curPhase;const isEra=p.cond&&p.cond.startsWith('era_');
    let label='',locked=false;
    if(isEra&&eraIdx>=0){if(i<eraIdx){locked=true;label=' ←跳过'}else if(i>eraIdx&&i>curPhase){locked=true;label=' 🔒'}}
    else if(!isEra&&!phaseAvailable(i)){locked=true;label=' ←跳过'}
    if(i>curPhase&&i>skipToNextAvailablePhase(curPhase+1))locked=true;
    let cls='sb-phase';if(locked&&!isCur)cls+=' locked';if(isCur)cls+=' active';if(done&&!isCur)cls+=' done';
    return `<div class="${cls}" onclick="${locked?'':'switchPhase('+i+')'}"><span class="sp-dot"></span><span class="sp-name">${p.icon} ${p.name}${label}</span></div>`;
  }).join('');
  const sbEv=document.getElementById('sbEvents');const ar=activeRounds();
  sbEv.innerHTML=ar.map((r,i)=>{
    const done=isRoundDone(r);const cur=r.id===rd().id;
    let cls='sb-evt';if(cur)cls+=' cur';if(done)cls+=' done';
    return `<div class="${cls}" onclick="goRound(${i})"><span class="se-dot"></span><span class="se-num">${done?'✓':(i+1)}</span><span class="se-title">${r.icon} ${r.title}</span></div>`;
  }).join('');
}
function refreshRound(){
  const r=rd();if(!r)return;
  const ec=document.getElementById('enemyCard');const cb=document.getElementById('combatBars');const sp=document.getElementById('stancePick');
  if(ec){if(state.combat.active&&r.id&&!r.id.startsWith('p4_enemy')){ec.style.display='block';if(cb)cb.style.display='block';updateCombatUI()}else{ec.style.display='none';if(cb)cb.style.display='none'}}
  if(sp){if(r.type==='stance'){sp.style.display='block';document.getElementById('btnSpin').style.display='none';document.getElementById('btnNext').style.display='none';document.getElementById('resultPanel').style.display='none'}else if(state.combat&&state.combat.phase==='player_stance'){}else{sp.style.display='none'}}
  document.getElementById('roundTitle').innerHTML=`<span style="font-size:18px">${r.icon}</span> 第${getCurrentRoundIndex()+1}转：${r.title}`;
  if(r.type==='combat_ce'){
    document.getElementById('wheelWrap').style.display='block';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🟣 抽取咒力';document.getElementById('btnSpin').disabled=false;
    if(typeof v3BuildCeSectors==='function'){var ceS=v3BuildCeSectors();if(ceS){wheel=buildWheel(ceS);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw()}}
    document.getElementById('moralPick').style.display='none';document.getElementById('inputRound').style.display='none';document.getElementById('btnReroll').style.display='none';document.getElementById('stancePick').style.display='none';return;
  }
  if(r.type==='combat_stamina'){
    if(typeof roundStamina==='function'&&(!state.combat.round||state.combat.stamina<=0))roundStamina();
    document.getElementById('wheelWrap').style.display='block';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='💪 抽取体力';document.getElementById('btnSpin').disabled=false;
    document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';document.getElementById('stancePick').style.display='none';
    if(typeof v3BuildStaminaWheel==='function'){var sw=v3BuildStaminaWheel();if(sw){wheel=buildWheel(sw);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw()}}return;
  }
  if(r.type==='combat_stance'){
    document.getElementById('wheelWrap').style.display='none';document.getElementById('btnSpin').style.display='none';document.getElementById('btnNext').style.display='none';
    document.getElementById('stancePick').style.display='block';document.getElementById('resultPanel').style.display='none';document.getElementById('btnReroll').style.display='none';return;
  }
  if(r.type==='combat_repeatable'){
    document.getElementById('wheelWrap').style.display='block';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🌀 旋转';document.getElementById('btnSpin').disabled=false;
    document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';document.getElementById('stancePick').style.display='none';
    if(typeof v3BuildRoundWheel==='function'){var rw=v3BuildRoundWheel(r.id);if(rw){wheel=buildWheel(rw);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw()}}return;
  }
  if(r.type==='combat_result'){
    const outcome=getResultOutcome();let items=[];const enemy=ENEMY_TEMPLATES[state.combat.enemyId];const eName=enemy?enemy.name:'敌人';
    if(outcome.complete!==undefined){
      items.push({l:'完胜·'+eName+'讨伐',w:outcome.complete||25,c:'#ffcc00',d:'压倒性的胜利!',tags:['bt_victory']});
      items.push({l:'苦战·险胜',w:outcome.bitter||50,c:'#c94',d:'赢了但付出了代价',dimMod:{体质:-1},tags:['bt_victory','bt_wounded']});
      items.push({l:'惨胜·以命换命',w:outcome.heavy||25,c:'#c84',d:'几乎付出了全部',dimMod:{体质:-2,体术:-1},tags:['bt_victory','bt_wounded','重伤']});
    }else{
      items.push({l:'败退·带伤撤离',w:outcome.retreat||30,c:'#c66',d:'拼尽全力逃脱',dimMod:{体质:-1,体术:-1},tags:['bt_defeat','bt_wounded']});
      items.push({l:'惨败·奄奄一息',w:outcome.heavy||25,c:'#c44',d:'被完全击溃',dimMod:{体质:-3,体术:-2,意志:-1},tags:['bt_defeat','bt_wounded','重伤','残废']});
      items.push({l:'殒命·'+eName,w:outcome.death||20,c:'#600',d:'咒术师生涯的终结',tags:['bt_death','殒命·'+eName]});
      items.push({l:eName+'放了你一马',w:outcome.mercy||25,c:'#876',d:'他转身离去了',tags:['bt_escape']});
    }
    wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🎯 终结';document.getElementById('btnNext').style.display='none';return;
  }
  const done=isRoundDone(r);
  if(r.type==='input'){
    document.getElementById('wheelWrap').style.display='none';
    document.getElementById('btnSpin').style.display='none';document.getElementById('btnNext').style.display='none';document.getElementById('btnReroll').style.display='none';document.getElementById('btnPhase').style.display='none';
    document.getElementById('moralPick').style.display='none';document.querySelector('.ptr-label').style.visibility='hidden';
    const ir=document.getElementById('inputRound');ir.style.display='block';
    const inp=document.getElementById('inputName');inp.value='';inp.className='name-input';inp.disabled=false;
    document.getElementById('nameHint').textContent=r.id==='p2_mname'?'记下极之番的真名':'赋予领域真名';
    if(done){const itm=state.results.find(rr=>rr.roundId===r.id);if(itm){inp.value=itm.label||'';inp.disabled=true}document.getElementById('btnInputSubmit').textContent='✅ 已刻印';document.getElementById('btnInputSubmit').disabled=true;document.getElementById('btnInputSkip').style.display='none'}
    else{document.getElementById('btnInputSubmit').textContent='刻 印';document.getElementById('btnInputSubmit').disabled=false;document.getElementById('btnInputSkip').style.display='block'}
    document.getElementById('resultPanel').style.display='none';document.getElementById('btnChar').style.display='none';return;
  }
  if(r.id==='p1_moral'){
    document.getElementById('wheelWrap').style.display='block';document.getElementById('inputRound').style.display='none';document.getElementById('btnSpin').style.display='block';
    const mp=document.getElementById('moralPick');mp.style.display='block';const toggle=document.getElementById('mpToggle');const body=document.getElementById('mpBody');const grid=document.getElementById('mpGrid');
    const items=getFilteredRoundItems(r);
    grid.innerHTML=items.map(it=>{const t=JSON.stringify(it.tags||[]);return`<div class="mp-btn${done?' sel':''}" onclick="selectMoral(this)" data-label="${it.l}" data-color="${it.c}" data-tags='${t}' style="border-left:3px solid ${it.c||'#555'}"><span class="mp-l" style="color:${it.c||'#555'}">${it.l}</span><span class="mp-d">${it.d||''}</span></div>`}).join('');
    if(done){const itm=state.results.find(rr=>rr.roundId===r.id);if(itm){toggle.textContent='✅ 已选择：'+itm.label;toggle.className='mp-toggle sel';body.className='mp-body';document.getElementById('btnReroll').style.display='block'}}
    else{toggle.textContent='📋 点击展开，自选价值观阵营（或直接转转盘）';toggle.className='mp-toggle';body.className='mp-body'}
    wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();
    document.getElementById('resultPanel').style.display='none';document.getElementById('btnSpin').disabled=done;document.getElementById('btnSpin').textContent=done?'✅ 已抽取':'🌀 点击旋转';
    document.getElementById('btnNext').style.display='none';document.getElementById('btnPhase').style.display='none';document.getElementById('btnChar').style.display=isPhaseDone()&&ph().rounds.length>0?'block':'none';return;
  }
  document.getElementById('wheelWrap').style.display='block';document.getElementById('inputRound').style.display='none';document.getElementById('moralPick').style.display='none';
  document.getElementById('btnSpin').style.display='block';
  wheel=buildWheel(getFilteredRoundItems(r));wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();
  document.getElementById('resultPanel').style.display='none';
  document.getElementById('btnSpin').disabled=done;
  document.getElementById('btnSpin').textContent=done?'✅ 已抽取':'🌀 点击旋转';
  document.getElementById('btnNext').style.display='none';
  document.getElementById('btnReroll').style.display='none';
  document.getElementById('btnPhase').style.display='none';
  document.getElementById('btnChar').style.display=isPhaseDone()&&ph().rounds.length>0?'block':'none';
}
function selectStance(s){
  state.combat.stance=s;document.querySelectorAll('.sp-card').forEach(c=>c.classList.toggle('sel',c.dataset.stance===s));
  state.results.push({roundId:'p4_stance',rname:'⚖ 战术姿态',prop:'',label:s,desc:'',c:'#c9a84c',_item:{tags:[],dim:{},dimMod:{}}});
  goNext();
}

function refreshRight(){
  if(window.innerWidth<768)return;
  const vt=visibleTraits();
  const tg={基本:[],价值观:[],性格:[],体质:[],其他特质:[]};
  const persRe=/^(乐观|沉默寡言|冲动|理性至上|老好人|固执|佛系|好胜|慵懒|勤奋|多疑|豁达|病娇|讨好型人格|强迫症|毒舌|健忘|中二病|社恐|工作狂|洁癖|自来熟|悲观|完美主义|路痴|话痨|腹黑|傲娇|吐槽)$/;
  vt.forEach(t=>{if(t.startsWith('价值观·'))tg.价值观.push(t);else if(persRe.test(t))tg.其他特质.push(t);else if(t.startsWith('等级·'))tg.基本.push(t);else if(/^(半人|特殊|希姆利亚|星浆体|双生子|六眼|双面|天与)/.test(t))tg.体质.push(t);else if(/^(正义|温柔|守护|苦行|导师|殉道|邻家|医者|理想|摆渡|捐助|侠客|叛逆|独行|揭发|民间|戒律|官僚|执行|保守|契约|旁观|实用|游荡|交易|均衡|享乐|捣蛋|浪人|即兴|破坏|独裁|幕后|审判|征税|血统|佣兵|投毒|敲诈|叛徒|操纵|疯子|破坏狂|猎杀|纵火|施虐)/.test(t))tg.性格.push(t);else tg.基本.push(t)});
  let th='';
  Object.entries(tg).forEach(([gn,gts])=>{if(gts.length){th+=`<div style="font-size:9px;color:var(--dim);padding:4px 12px 0;letter-spacing:1px">${gn==='基本'?'📋 基本':gn==='价值观'?'⚖️ 价值观':gn==='性格'?'🎭 性格':gn==='其他特质'?'🏷️ 其他特质':'🧬 体质'}</div><div class="rp-traits" style="padding:2px 12px 4px">${gts.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`}});
  if(tg.价值观.length&&tg.性格.length){const vn=tg.价值观.map(t=>t.replace('价值观·','')).join(' / ');th+=`<div style="font-size:9px;color:var(--dim);padding:4px 12px 0;letter-spacing:1px">🔗 价值观→性格</div><div class="rp-traits" style="padding:2px 12px 4px"><span style="font-size:10px;color:var(--gold)">${vn}</span><span style="color:var(--dim)"> → </span>${tg.性格.map(t=>`<span class="tag">${t}</span>`).join(' ')}</div>`}
  document.getElementById('rpTraits').innerHTML=th||'<span class="empty">✨ 旋转转盘以生成角色特质</span>';
  let dh='';const groups={体能:['体质','体术'],咒力:['咒力总量','咒力效率','咒力操纵'],战斗:['术式性能','天赋'],属性:['意志','运势','魅力','声望','信用']};
  Object.entries(groups).forEach(([gn,gks])=>{dh+=`<div style="font-size:9px;color:var(--dim);padding:6px 8px 0;letter-spacing:1px">${gn}</div>`;gks.forEach(k=>{const v=state.dimensions[k];const lv=v||'——';const idx=dimVal(v);const pct=idx<0?0:Math.min(100,(idx+1)/DIM_LEVELS.length*100);const clr=dimColor(idx);dh+=`<div style="display:flex;align-items:center;gap:6px;font-size:10px;padding:2px 8px"><span style="width:34px;color:var(--dim)">${k}</span><span style="width:24px;text-align:right;font-weight:700;color:${clr};font-size:10px">${lv}</span><span style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.06)"><span style="display:block;height:100%;border-radius:2px;background:${clr};width:${pct}%"></span></span></div>`})});
  document.getElementById('rpDims').innerHTML=dh||'<span class="empty">📊 抽取维度轮次以解锁评级</span>';
  const ds=displaySkills();document.getElementById('rpSkills').innerHTML=ds.length?ds.map(s=>`<span class="tag">${s}</span>`).join(''):'<span class="empty">尚未抽取</span>';
  document.getElementById('rpHist').innerHTML=state.results.length?state.results.map(r=>{const ri=activeRounds().findIndex(ar=>ar.id===r.roundId);return`<div class="rh" style="border-left-color:${r.c||'#5a5a5a'};cursor:pointer" onclick="${ri>=0?'goRound('+ri+')':''}"><span class="rhd" style="background:${r.c||'#5a5a5a'}"></span><span style="color:var(--dim);font-size:9px">${r.rname}:</span><span style="font-weight:600;font-size:10px">${r.label}</span></div>`}).join(''):'<span class="empty" style="padding:4px">🎯 暂无事件记录</span>';
}
function refreshTabs(){
  const tp=document.getElementById('tvPerson'),th=document.getElementById('tvHist');
  const vt=visibleTraits();
  let ph='<div class="tab-card"><h4>👤 角色特质</h4>';
  const tg={基本:[],价值观:[],性格:[],体质:[],其他特质:[]};
  vt.forEach(t=>{if(t.startsWith('价值观·'))tg.价值观.push(t);else if(/^(乐观|沉默寡言|冲动|理性至上|老好人|固执|佛系|好胜|慵懒|勤奋|多疑|豁达|病娇|讨好型人格|强迫症|毒舌|健忘|中二病|社恐|工作狂|洁癖|自来熟|悲观|完美主义|路痴|话痨|腹黑|傲娇|吐槽)$/.test(t))tg.其他特质.push(t);else if(t.startsWith('等级·'))tg.基本.push(t);else if(/^(半人|特殊|希姆利亚|星浆体|双生子|六眼|双面|天与)/.test(t))tg.体质.push(t);else if(/^(正义|温柔|守护|苦行|导师|殉道|邻家|医者|理想|摆渡|捐助|侠客|叛逆|独行|揭发|民间|戒律|官僚|执行|保守|契约|旁观|实用|游荡|交易|均衡|享乐|捣蛋|浪人|即兴|破坏|独裁|幕后|审判|征税|血统|佣兵|投毒|敲诈|叛徒|操纵|疯子|破坏狂|猎杀|纵火|施虐)/.test(t))tg.性格.push(t);else tg.基本.push(t)});
  let hasAny=false;
  Object.entries(tg).forEach(([gn,gts])=>{if(gts.length){hasAny=true;ph+=`<div style="font-size:9px;color:var(--dim);padding:4px 0 0;letter-spacing:1px">${gn==='基本'?'📋 基本':gn==='价值观'?'⚖️ 价值观':gn==='性格'?'🎭 性格':gn==='其他特质'?'🏷️ 其他特质':'🧬 体质'}</div><div class="tags">${gts.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`}});
  if(tg.价值观.length&&tg.性格.length){const vn=tg.价值观.map(t=>t.replace('价值观·','')).join(' / ');hasAny=true;ph+=`<div style="font-size:9px;color:var(--dim);padding:4px 0 0;letter-spacing:1px">🔗 价值观→性格</div><div class="tags"><span style="font-size:10px;color:var(--gold)">${vn}</span><span style="color:var(--dim)"> → </span>${tg.性格.map(t=>`<span class="tag">${t}</span>`).join(' ')}</div>`}
  if(!hasAny)ph+='暂无特质';
  ph+='<h4 style="margin-top:10px">📊 维度表</h4><div class="dim-mob">';
  const groups={体能:['体质','体术'],咒力:['咒力总量','咒力效率','咒力操纵'],战斗:['术式性能','天赋'],属性:['意志','运势','魅力','声望','信用']};
  Object.entries(groups).forEach(([gn,gks])=>{ph+=`<div style="font-size:9px;color:var(--dim);padding:4px 0;letter-spacing:1px">${gn}</div>`;gks.forEach(k=>{const v=state.dimensions[k];const lv=v||'——';const idx=dimVal(v);const pct=idx<0?0:Math.min(100,(idx+1)/DIM_LEVELS.length*100);const clr=dimColor(idx);ph+=`<div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:2px 0"><span style="width:36px;color:var(--dim)">${k}</span><span style="width:24px;text-align:right;font-weight:700;color:${clr}">${lv}</span><span style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.06)"><span style="display:block;height:100%;border-radius:2px;background:${clr};width:${pct}%"></span></span></div>`})});
  ph+='</div>';
  const ds=displaySkills();ph+='<h4 style="margin-top:10px">📜 技能/术式</h4><div class="tags">'+(ds.length?ds.map(s=>`<span class="tag">${s}</span>`).join(''):'暂无技能')+'</div>';
  ph+='</div>';tp.innerHTML=ph;
  th.innerHTML=state.results.length?`<div class="th-list">${state.results.map(r=>{const ri=activeRounds().findIndex(ar=>ar.id===r.roundId);return`<div class="th" style="border-left-color:${r.c||'#5a5a5a'};cursor:pointer" onclick="${ri>=0?'goRound('+ri+')':''}"><span class="thd" style="background:${r.c||'#5a5a5a'}"></span><div class="thb"><span class="thl">${r.rname}</span><span class="thv">${r.label}</span><span class="thdesc">${r.desc||''}</span></div></div>`}).join('')}</div>`:'<div class="empty">暂无事件记录</div>';
}
function updateBadges(){
  const bh=document.getElementById('btbH'),bp=document.getElementById('btbP');
  bh.style.display=state.results.length&&state.curTab!=='hist'?'flex':'none';if(bh.style.display!=='none')bh.textContent=state.results.length;
  bp.style.display=state.traits.length&&state.curTab!=='person'?'flex':'none';if(bp.style.display!=='none')bp.textContent=state.traits.length;
}

// ========================================================= ACTIONS =========================================================
function showToast(msg){const c=document.getElementById('toastContainer'),d=document.createElement('div');d.className='toast';d.textContent=msg;c.appendChild(d);setTimeout(()=>d.remove(),2000)}
function applyEffects(item){
  if(item.tags){item.tags.forEach(t=>{if(!state.traits.includes(t))state.traits.push(t)})}
  if(item.dim){for(const[k,v]of Object.entries(item.dim)){const idx=dimVal(v);if(idx>=0)state.dimensions[k]=v}}
  if(item.dimMod){for(const[k,v]of Object.entries(item.dimMod)){const cur=dimVal(state.dimensions[k]);const nv=cur+v;state.dimensions[k]=dimLv(nv)}}
  if(item.addDims){item.addDims.forEach(k=>{if(!DIM_NAMES.includes(k)){DIM_NAMES.push(k);state.dimensions[k]=null}})}
}
function phaseAvailable(i){const p=DATA.phases[i];if(!p||!p.cond)return true;return checkCond(p.cond)}
function drawnEraIndex(){for(let i=0;i<DATA.phases.length;i++){if(DATA.phases[i].cond&&DATA.phases[i].cond.startsWith('era_')&&checkCond(DATA.phases[i].cond))return i}return -1}
function skipToNextAvailablePhase(from){for(let i=from;i<DATA.phases.length;i++){if(phaseAvailable(i))return i}return from}
function switchPhase(i){
  if(state.spinning)return;
  if(i>curPhase&&!isPhaseDone()){showToast('当前阶段未完成，无法进入下一阶段');return}
  i=skipToNextAvailablePhase(i);
  if(DATA.phases[curPhase]&&DATA.phases[curPhase].id==='p4')endCombat();
  curPhase=i;curRound=0;refreshAll();wheel.angle=0;state.targetAngle=0;wheel.draw();document.getElementById('resultPanel').style.display='none';
  document.getElementById('phaseMenu').style.display='none';
}
function togglePhaseMenu(){
  const el=document.getElementById('phaseMenu');
  if(el.style.display==='none'){
    el.style.display='block';
    const list=document.getElementById('pmList');
    const eraIdx=drawnEraIndex();
    list.innerHTML=DATA.phases.map((p,i)=>{
      const done=p.rounds.length>0&&p.rounds.every(r=>isRoundDone(r)||(r.cond&&!state.traits.includes(r.cond)));
      const isCur=i===curPhase;const isEra=p.cond&&p.cond.startsWith('era_');
      let label='',locked=false;
      if(isEra&&eraIdx>=0){if(i<eraIdx){locked=true;label=' ←跳过'}else if(i>eraIdx&&i>curPhase){locked=true;label=' 🔒'}}
      else if(!isEra&&!phaseAvailable(i)){locked=true;label=' ←跳过'}
      if(i>curPhase&&i>skipToNextAvailablePhase(curPhase+1))locked=true;
      let cls='pm-item';if(locked&&!isCur)cls+=' locked';if(isCur)cls+=' active';if(done&&!isCur)cls+=' done';
      return `<div class="${cls}" onclick="${locked?'':'switchPhase('+i+')'}"><span class="pm-dot"></span><span>${p.icon} ${p.name}</span>${label}</div>`;
    }).join('');
  }else{el.style.display='none'}
}
function goRound(i){
  if(state.spinning)return;const ar=activeRounds();
  if(i>=ar.length){showToast('该轮次不存在');return}
  // 已完成的轮次：跳转并显示历史结果+重抽按钮
  if(isRoundDone(ar[i])){
    curRound=i;refreshAll();wheel.angle=0;state.targetAngle=0;wheel.draw();
    const rr=state.results.find(r=>r.roundId===ar[i].id);
    if(rr){const panel=document.getElementById('resultPanel');panel.style.display='block';panel.style.borderLeft=`4px solid ${rr.c||'#333'}`;panel.innerHTML=`<div class="rp-cat">${rr.rname}</div><div class="rp-val" style="color:${rr.c||'#333'}">${rr.label}</div><div class="rp-desc">${rr.desc||''}</div>`;document.getElementById('btnReroll').style.display='block'}
    return;
  }
  // 禁止跳过：只能抽第一个未完成的轮次
  const firstUndone=ar.findIndex(r=>!isRoundDone(r));
  if(i>firstUndone){showToast('请按顺序抽取');return}
  curRound=i;refreshAll();wheel.angle=0;state.targetAngle=0;wheel.draw();document.getElementById('resultPanel').style.display='none';
}
function rebuildSkills(){state.skills=[];state.results.forEach(rr=>{if(rr.roundId&&(/(_skill|_eff|_de)\d+$/.test(rr.roundId)||rr.roundId.endsWith('_tech_h')||rr.roundId.endsWith('_tech_c'))&&rr.label)state.skills.push(rr.label)})}
function rebuildPers(){state.persDrawn=[];state.results.forEach(rr=>{if(rr.roundId&&/_pers\d+$/.test(rr.roundId)&&rr.label)state.persDrawn.push(rr.label)})}
function displaySkills(){
  const result=[],added=new Set();
  const chainKeys=Object.keys(SKILL_CHAINS);
  const allSkillRe=/(_skill\d+$|_tech_[hc]$|_eff\d+$)/;
  const nameRe=/(_dname$|_mname$)/;
  const corpRe=/(_corpQ$|_corpP\d+$)/;
  // Grouped chain skills
  for(const[main,ids]of Object.entries(SKILL_CHAINS)){
    const mainRR=state.results.find(r=>r.label===main);if(!mainRR)continue;
    const subs=[];
    ids.forEach(cid=>{
      const sr=state.results.find(r=>r.roundId===cid);if(sr&&sr.label&&sr.label!=='(跳过)')subs.push(sr.label);
    });
    result.push({main,subs});
    added.add(main);subs.forEach(s=>added.add(s));
  }
  // Standalone skills
  state.results.forEach(r=>{
    if(!r.label||r.label==='(跳过)')return;
    if(added.has(r.label))return;
    if(r.roundId==='p2_corpQ'||r.roundId==='p2_skn')return;
    if(allSkillRe.test(r.roundId)&&!added.has(r.label)&&!chainKeys.includes(r.label)){
      result.push(r.label);added.add(r.label);
    }
  });
  // Names not already in chains
  state.results.forEach(r=>{
    if(nameRe.test(r.roundId)&&r.label&&r.label!=='(跳过)'&&!added.has(r.label)){
      result.push(r.label);added.add(r.label);
    }
  });
  return result.flatMap(g=>{
    if(typeof g==='string')return g;
    if(g.subs&&g.subs.length)return `▸ ${g.main}：${g.subs.join('、')}`;
    return g.main;
  });
}
function submitInput(){
  const r=rd();if(!r||r.type!=='input')return;
  const inp=document.getElementById('inputName');const v=inp.value.trim();
  const min=r.inputMin||1,max=r.inputMax||20;
  if(v.length<min||v.length>max){showToast(`请输入${min}-${max}字`);return};
  state.results.push({roundId:r.id,rname:`${r.icon} ${r.title}`,prop:r.prop,label:v,desc:'',c:'#c9a84c',_item:{tags:[],dim:{},dimMod:{}}});
  document.getElementById('btnInputSubmit').disabled=true;
  document.getElementById('btnInputSubmit').textContent='✅ 已刻印';
  inp.disabled=true;
  document.getElementById('btnInputSkip').style.display='none';
  const panel=document.getElementById('resultPanel');panel.style.display='block';panel.style.borderLeft='4px solid #c9a84c';
  panel.innerHTML=`<div class="rp-cat">${r.icon} ${r.title}</div><div class="rp-val" style="color:#c9a84c">${v}</div>`;
  const ar=activeRounds();const undone=ar.filter(rr=>!isRoundDone(rr));
  if(undone.length>0)document.getElementById('btnNext').style.display='block';
  document.getElementById('btnReroll').style.display='block';
  if(isPhaseDone()&&curPhase<DATA.phases.length-1)document.getElementById('btnPhase').style.display='block';
  document.getElementById('btnChar').style.display=isPhaseDone()&&ph().rounds.length>0?'block':'none';
  refreshAfterSpin();saveState();
}
function toggleMoral(){
  const body=document.getElementById('mpBody');
  body.classList.toggle('open');
}
function selectMoral(el){
  const r=rd();if(!r||r.id!=='p1_moral'||isRoundDone(r))return;
  const label=el.dataset.label,color=el.dataset.color,tags=JSON.parse(el.dataset.tags||'[]');
  state.results.push({roundId:r.id,rname:`${r.icon} ${r.title}`,prop:r.prop,label,desc:'',c:color,_item:{tags,dim:{},dimMod:{}}});
  if(tags.length)tags.forEach(t=>{if(!state.traits.includes(t))state.traits.push(t)});
  document.querySelectorAll('.mp-btn').forEach(b=>{b.classList.add('sel');b.onclick=null});
  document.getElementById('mpBody').classList.remove('open');
  const toggle=document.getElementById('mpToggle');
  toggle.textContent='✅ 已选择：'+label;
  toggle.className='mp-toggle sel';
  document.getElementById('btnSpin').style.display='none';
  const panel=document.getElementById('resultPanel');panel.style.display='block';panel.style.borderLeft=`4px solid ${color}`;
  panel.innerHTML=`<div class="rp-cat">${r.icon} ${r.title}</div><div class="rp-val" style="color:${color}">${label}</div>`;
  document.getElementById('btnNext').style.display='block';
  document.getElementById('btnReroll').style.display='block';
  refreshAfterSpin();saveState();
}
function skipInput(){
  const r=rd();if(!r||r.type!=='input'||isRoundDone(r))return;
  state.results.push({roundId:r.id,rname:`${r.icon} ${r.title}`,prop:r.prop,label:'(跳过)',desc:'',c:'#555',_item:{tags:[],dim:{},dimMod:{}}});
  document.getElementById('btnInputSubmit').disabled=true;
  document.getElementById('btnInputSkip').style.display='none';
  refreshAfterSpin();saveState();
  goNext();
}
function goNext(){
  const ar=activeRounds();for(let i=0;i<ar.length;i++){if(!isRoundDone(ar[i])&&ar[i].id!==rd().id){curRound=i;break}}
  refreshAll();wheel.angle=0;state.targetAngle=0;wheel.draw();document.getElementById('resultPanel').style.display='none';
}
function goNextPhase(){const next=skipToNextAvailablePhase(curPhase+1);if(next>curPhase&&next<DATA.phases.length)switchPhase(next)}
function reroll(){
  if(state.spinning)return;const r=rd();if(!r||!isRoundDone(r))return;
  const idx=state.results.findIndex(rr=>rr.roundId===r.id);if(idx<0)return;
  state.results.splice(idx);
  state.traits=[];state.dimensions=initDimensions();state.skills=[];state.persDrawn=[];
  state.results.forEach(rr=>{if(rr._item)applyEffects(rr._item)});
  rebuildSkills();rebuildPers();
  if(curPhase===DATA.phases.findIndex(p=>p.id==='p4')&&state.combat.enemyId){
    var oc=state.combat;state.combat={active:true,enemyId:oc.enemyId,stance:oc.stance||"猛攻",stamina:0,ce:oc.ce,win:0,shield:Math.floor(oc.ce*0.5),hp:oc.hp,enemyStamina:0,enemyCe:oc.enemyCe,enemyWin:0,enemyHp:oc.enemyHp||ENEMY_TEMPLATES[oc.enemyId].hp,clockBK:oc.clockBK||0,clockLB:oc.clockLB||0,dangerZone:oc.dangerZone||0,enemyDangerZone:oc.enemyDangerZone||0,burnout:false,bfCombo:0,domainUsed:false,enemyBlocked:false,round:oc.round||0,phase:null,log:oc.log||[],comboFlags:{ao:false,aka:false,kai:false,hachi:false},bindLoanUsed:false};
    updateCombatUI();
  }
  refreshAll();wheel.angle=0;state.targetAngle=0;wheel.draw();
  document.getElementById('resultPanel').style.display='none';
  document.getElementById('btnNext').style.display='none';document.getElementById('btnReroll').style.display='none';showToast('🔄 已重抽');
}
function saveState(){
  try{localStorage.setItem('jjk_state',JSON.stringify({curPhase,curRound,results:state.results,traits:state.traits,dimensions:state.dimensions,introDone:state.introDone}))}catch(e){}
}
function resetGame(){
  if(state.spinning)return;
  if(state.results.length>0&&!confirm('确定重置本轮？所有已抽取结果和角色特质将清除。'))return;
  state.results=[];state.traits=[];state.dimensions=initDimensions();state.skills=[];state.persDrawn=[];
  endCombat();
  curPhase=0;curRound=0;state.targetAngle=0;wheel.angle=0;
  localStorage.removeItem('jjk_state');
  refreshAll();wheel.draw();document.getElementById('resultPanel').style.display='none';
  document.getElementById('btnNext').style.display='none';document.getElementById('btnReroll').style.display='none';showToast('↺ 已重置');
}
function spin(){
  if(state.spinning||isRoundDone(rd()))return;state.spinning=true;
  document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';
  document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';
  particles.clear();
  const ss=wheel.sectors,tw=ss.reduce((s,se)=>s+(se.w||1),0);let r=Math.random()*tw,ti=0;
  for(let i=0;i<ss.length;i++){r-=ss[i].w||1;if(r<=0){ti=i;break}}
  const arc=ss[ti].arc,j=(Math.random()-.5)*arc*.6;let ca=0;for(let i=0;i<ti;i++)ca+=ss[i].arc;
  state.targetAngle=wheel.angle+(6+Math.floor(Math.random()*4))*Math.PI*2-ca-arc/2+j;
  state.startAngle=wheel.angle;state.startTime=performance.now();state.duration=5000+Math.random()*2000;
}
function stop(){
  state.spinning=false;document.getElementById('btnSpin').disabled=false;document.getElementById('btnSpin').textContent='✅ 已抽取';
  let norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;let cum=0,idx=0;
  for(let i=0;i<wheel.sectors.length;i++){cum+=wheel.sectors[i].arc;if(norm<cum){idx=i;break}}
  const item=wheel.sectors[idx];
  let autoTags=item.tags||[];
  const rid=rd().id||'';
  if(rid.startsWith('p1_ps_')||rid.startsWith('p1_pers')){if(!autoTags.includes(item.l))autoTags=[...autoTags,item.l]}
  state.results.push({roundId:rid,rname:`${rd().icon} ${rd().title}`,prop:rd().prop,label:item.l,desc:item.d||'',c:item.c||'#5a5a5a',_item:{tags:autoTags,dim:item.dim||{},dimMod:item.dimMod||{}}});
  applyEffects({...item, tags: autoTags});
  if(/_pers\d+$/.test(rid)&&item.l&&!state.persDrawn.includes(item.l))state.persDrawn.push(item.l);
  // track skills & drawn skills
  if(rd().id&&rd().id.startsWith('p2_skill')&&!/_\d/.test(rd().id)&&item.l!=='0'){/*技巧数量轮，记录N*/}
  if(rd().id&&(/_skill\d+$/.test(rd().id)||/_eff\d+$/.test(rd().id)||/_de\d+$/.test(rd().id)||/_tech_h$/.test(rd().id)||/_tech_c$/.test(rd().id))&&item.l){state.skills.push(item.l)}
  if(item.l==='极之番'&&!state.traits.includes('极之番'))state.traits.push('极之番');
  if(item.l==='极之番'){const rr=state.results[state.results.length-1];if(rr&&rr._item&&!rr._item.tags.includes('极之番'))rr._item.tags.push('极之番')}
  const chain=SKILL_CHAINS[item.l];if(chain){const co=rd().order;chain.forEach((cid,i)=>{const sub=ph().rounds.find(r=>r.id===cid);if(sub&&!isRoundDone(sub)){sub._origOrder=sub._origOrder||sub.order;sub.order=co+0.0001*(i+1)}})}
  // ---- COMBAT HANDLING ----
  if(rid==='p4_enemy'){
    if(autoTags.includes('battle_avoided')){endCombat()}else{const etag=autoTags.find(t=>t.startsWith('enemy_'));if(etag)initCombat(etag.replace('enemy_',''))}
  }else if(rid==='p4_prep'){
    state.combat.prepped=true;updateCombatUI();
  }else if(rid==='p4_action'){
    let bf=false;const tech=item._tech;if(tech){bf=tryBlackFlash();resolveTechSpin(item,false);
    if(bf){state.combat.win=Math.floor(state.combat.win*2.5)}const eTechs=buildCombatItems(true);if(eTechs.length>0){const eItem=eTechs[Math.floor(Math.random()*eTechs.length)];if(eItem._tech){resolveTechSpin(eItem,true)}}}
    const dmg=resolveDamage();combatShieldUpdate();const ended=checkCombatEnd();
    if(!ended&&state.combat.stamina>0){state.combat.bfCombo=0;updateCombatUI();refreshAll();document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='⚔ 再出一招';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='block';document.getElementById('resultPanel').innerHTML='<div class="rp-cat">'+rd().icon+' '+rd().title+'</div><div class="rp-val" style="color:'+(item.c||'#888')+'">'+item.l+(bf?' ⚡黑闪!':'')+'</div><div class="rp-desc">体力-'+(tech?tech.st:'?')+' 咒力-'+(tech&&tech.ce?tech.ce:'0')+' 胜率+'+(tech?tech.win:'?')+(bf?' ×2.5':'')+' | 造成'+dmg.pDmg+'伤害 受击'+dmg.eDmg+'</div>';document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 收手';document.getElementById('btnReroll').style.display='none';saveState();return}
    if(ended){goRound(activeRounds().findIndex(r=>r.id==='p4_result'));refreshAll();return}updateCombatUI();roundStamina();refreshAll();return;
  }else if(rid==='p4_result'){endCombat()}
  // ---- END COMBAT ----
  const panel=document.getElementById('resultPanel');panel.style.display='block';panel.style.borderLeft=`4px solid ${item.c||'#5a5a5a'}`;
  let panelHTML=`<div class="rp-cat">${rd().icon} ${rd().title}</div><div class="rp-val" style="color:${item.c||'#5a5a5a'};text-shadow:0 0 12px ${item.c||'#5a5a5a'}66">${item.l}</div><div class="rp-desc">${item.d||''}</div>`;
  panel.innerHTML=panelHTML;
  particles.emit(wheel.cx,20,50,item.c||'#ff3050',160,3.5,2);particles.emit(wheel.cx,20,25,'#ffcc00',110,2.5,1.4);
  const ar_undone=activeRounds().filter(r=>!isRoundDone(r));
  if(ar_undone.length>0){document.getElementById('btnNext').style.display='block'}else{document.getElementById('btnNext').style.display='none'}
  document.getElementById('btnReroll').style.display='block';
  if(isPhaseDone()&&curPhase<DATA.phases.length-1){document.getElementById('btnPhase').style.display='block'}
  document.getElementById('btnChar').style.display=isPhaseDone()&&ph().rounds.length>0?'block':'none';
  refreshAfterSpin();
  saveState();
}
function centerClick(){if(state.spinning)return;const r=rd();if(r&&r.type==='input'){if(isRoundDone(r)){showToast('已命名，请点击「→ 下一轮」或左侧选择下一项');return}submitInput();return}if(isRoundDone(rd())){showToast('已抽取，请点击「→ 下一轮」或左侧选择下一项');return}spin()}
function setTab(tab){
  state.curTab=tab;document.querySelectorAll('.btm-tabs .bt').forEach(b=>b.classList.toggle('active',b.dataset.t===tab));
  document.querySelectorAll('.tab-view').forEach(v=>v.classList.remove('on'));
  if(tab!=='wheel'){const v=document.getElementById(tab==='person'?'tvPerson':'tvHist');if(v)v.classList.add('on')}
  updateBadges();
}

// ========================================================= EDITOR =========================================================
let _editorTimer=0;
function toggleEditor(){
  state.editorOpen=!state.editorOpen;
  document.getElementById('edOverlay').style.display=state.editorOpen?'block':'none';
  document.getElementById('edPanel').classList.toggle('open',state.editorOpen);
  if(state.editorOpen){clearTimeout(_editorTimer);_doRender()}
  else{clearTimeout(_editorTimer);document.getElementById('edBody').innerHTML=''}
}
function renderEditor(){
  if(!state.editorOpen)return;
  clearTimeout(_editorTimer);
  _editorTimer=setTimeout(()=>{_doRender()},300);
}
function _doRender(){
  const body=document.getElementById('edBody');let h='';
  DATA.phases.forEach((p,pi)=>{
    h+=`<div class="ep-phase"><div class="ep-phase-header"><span>${p.icon||'◆'}</span><input value="${p.name}" onchange="DATA.phases[${pi}].name=this.value" style="font-weight:700;width:140px" /></div>`;
    p.rounds.forEach((r,ri)=>{
      h+=`<div class="ep-round"><div class="ep-round-header">
        #<input type="number" min="1" value="${r.order||ri+1}" style="width:40px" onchange="DATA.phases[${pi}].rounds[${ri}].order=parseInt(this.value)||1" />
        icon:<input value="${r.icon||''}" style="width:40px" onchange="DATA.phases[${pi}].rounds[${ri}].icon=this.value" />
        title:<input value="${r.title}" onchange="DATA.phases[${pi}].rounds[${ri}].title=this.value" />
        cond:<input value="${r.cond||''}" onchange="DATA.phases[${pi}].rounds[${ri}].cond=this.value||null" style="width:60px" />
        prop:<input value="${r.prop||''}" onchange="DATA.phases[${pi}].rounds[${ri}].prop=this.value" style="width:50px;font-size:9px" />
        type:<input value="${r.type||''}" onchange="DATA.phases[${pi}].rounds[${ri}].type=this.value||null" style="width:40px;font-size:9px" placeholder="input" />
      </div>`;
  if(r.type==='origin'){
    document.getElementById('wheelWrap').style.display='none';
    document.getElementById('btnSpin').style.display='none';document.getElementById('btnNext').style.display='none';document.getElementById('btnReroll').style.display='none';document.getElementById('btnPhase').style.display='none';
    document.getElementById('moralPick').style.display='none';document.getElementById('inputRound').style.display='none';
    const op=document.getElementById('originPick');op.style.display='block';
    if(done){op.querySelectorAll('.op-card').forEach(c=>{c.style.pointerEvents='none';c.style.opacity='.5'});op.querySelector('.op-card.active').style.opacity='1';op.querySelector('.opc-hint').textContent='✅ 已选择'}
    document.getElementById('resultPanel').style.display='none';document.getElementById('btnChar').style.display='none';return;
  }
  if(r.type==='input'){
        h+=`<div class="ep-item" style="font-size:10px;color:var(--dim)">输入模式: min=<input class="w" type="number" min="1" max="50" value="${r.inputMin||2}" onchange="DATA.phases[${pi}].rounds[${ri}].inputMin=parseInt(this.value)||2" /> max=<input class="w" type="number" min="1" max="50" value="${r.inputMax||8}" onchange="DATA.phases[${pi}].rounds[${ri}].inputMax=parseInt(this.value)||8" /></div>`;
      }else{
      r.items.forEach((it,ii)=>{
        h+=`<div class="ep-item"><input value="${it.l}" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].l=this.value" /> w:<input class="w" type="number" min="0" max="100" value="${it.w||1}" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].w=parseInt(this.value)||1" /> <input type="color" value="${it.c||'#5a5a5a'}" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].c=this.value" /><div style="flex-basis:100%"><textarea rows="2" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].d=this.value">${it.d||''}</textarea></div><div class="tag-row">${(it.tags||[]).map((t,ti)=>`<span class="tag-chip">${t}<span class="x" onclick="DATA.phases[${pi}].rounds[${ri}].items[${ii}].tags.splice(${ti},1);renderEditor()">×</span></span>`).join('')}<input value="" placeholder="+标签" style="width:50px" onkeydown="if(event.key==='Enter'){const v=this.value.trim();if(v){if(!DATA.phases[${pi}].rounds[${ri}].items[${ii}].tags)DATA.phases[${pi}].rounds[${ri}].items[${ii}].tags=[];DATA.phases[${pi}].rounds[${ri}].items[${ii}].tags.push(v);renderEditor();}}" /></div><span style="font-size:9px;color:var(--dim);cursor:pointer" onclick="const e=document.getElementById('dt${pi}_${ri}_${ii}');e.style.display=e.style.display==='none'?'block':'none'">[+ 条件/维度/权重]</span><div id="dt${pi}_${ri}_${ii}" style="display:none;margin-top:4px;padding:6px;background:rgba(255,255,255,.02);border-radius:6px;font-size:10px">`;
        const dim=it.dim||{},dimMod=it.dimMod||{},cond=it.cond||'',wMods=it.wMods||[];
        h+=`维度设置: ${Object.entries(dim).map(([k,v])=>`<span>${k}:<input value="${v}" style="width:30px" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].dim=DATA.phases[${pi}].rounds[${ri}].items[${ii}].dim||{};DATA.phases[${pi}].rounds[${ri}].items[${ii}].dim['${k}']=this.value"/></span>`).join(' ')} <select onchange="const v=this.value;if(v){const d=DATA.phases[${pi}].rounds[${ri}].items[${ii}].dim||{};d[v]='C';DATA.phases[${pi}].rounds[${ri}].items[${ii}].dim=d;renderEditor()}"><option value="">+维</option>${DIM_NAMES.filter(n=>!dim[n]).map(n=>`<option>${n}</option>`).join('')}</select><br>`;
        h+=`维度增减: ${Object.entries(dimMod).map(([k,v])=>`<span>${k}:<input type="number" value="${v}" style="width:30px" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].dimMod=DATA.phases[${pi}].rounds[${ri}].items[${ii}].dimMod||{};DATA.phases[${pi}].rounds[${ri}].items[${ii}].dimMod['${k}']=parseInt(this.value)||0"/></span>`).join(' ')} <select onchange="const v=this.value;if(v){const d=DATA.phases[${pi}].rounds[${ri}].items[${ii}].dimMod||{};d[v]=0;DATA.phases[${pi}].rounds[${ri}].items[${ii}].dimMod=d;renderEditor()}"><option value="">+维</option>${DIM_NAMES.filter(n=>!dimMod[n]).map(n=>`<option>${n}</option>`).join('')}</select><br>`;
        h+=`条件: <input value="${cond}" style="width:200px" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].cond=this.value||null" placeholder="如:天赋|>=|A"/>`;
        h+=`<br>权重修改: ${wMods.map((m,mi)=>`当<input value="${m.cond||''}" style="width:100px" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].wMods[${mi}].cond=this.value"/>×<input type="number" step="0.5" value="${m.w||1}" style="width:30px" onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].wMods[${mi}].w=parseFloat(this.value)||1"/>`).join(' ')} <button style="font-size:9px" onclick="if(!DATA.phases[${pi}].rounds[${ri}].items[${ii}].wMods)DATA.phases[${pi}].rounds[${ri}].items[${ii}].wMods=[];DATA.phases[${pi}].rounds[${ri}].items[${ii}].wMods.push({cond:'',w:1});renderEditor()">+规则</button>`;
        h+=`<br><label style="font-size:9px"><input type="checkbox" ${it.filterDrawn?'checked':''} onchange="DATA.phases[${pi}].rounds[${ri}].items[${ii}].filterDrawn=this.checked;renderEditor()" /> filterDrawn（去重）</label>`;
        h+=`</div><div class="ep-actions"><button class="del" onclick="DATA.phases[${pi}].rounds[${ri}].items.splice(${ii},1);renderEditor()">✕ 删除</button></div></div>`;
      });
      h+=`<div class="ep-actions" style="margin-top:6px"><button onclick="DATA.phases[${pi}].rounds[${ri}].items.push({l:'新选项',w:1,c:'#5a5a5a',d:'',tags:[],dim:{},dimMod:{}});renderEditor()">+ 添加选项</button><button class="del" onclick="DATA.phases[${pi}].rounds.splice(${ri},1);renderEditor()">✕ 删除轮次</button></div>`;
      }
    });
    h+=`<div class="ep-actions"><button onclick="DATA.phases[${pi}].rounds.push({id:'p'+(pi+1)+'_'+Date.now(),title:'新轮次',icon:'◆',order:DATA.phases[${pi}].rounds.length+1,cond:null,prop:'',items:[{l:'选项1',w:1,c:'#5a5a5a',d:'',tags:[],dim:{},dimMod:{}}]});renderEditor()">+ 添加轮次</button></div></div>`;
  });
  h+=`<div class="ep-actions" style="padding:10px 0"><button onclick="DATA.phases.push({id:'p'+(DATA.phases.length+1),name:'新阶段',icon:'◆',rounds:[]});renderEditor()">+ 添加阶段</button></div>`;
  body.innerHTML=h;
}
function edSave(){
  localStorage.setItem('jjk_data',JSON.stringify(DATA));
  const r=rd();if(!r){curRound=0}
  refreshAll();showToast('💾 已保存');
}
function edExport(){
  const blob=new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='data.json';a.click();
}
function edImport(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=e=>{const f=e.target.files[0];if(f){const fr=new FileReader();fr.onload=ev=>{try{DATA=JSON.parse(ev.target.result);edSave();showToast('📤 已导入')}catch(x){showToast('导入失败：JSON格式错误')}};fr.readAsText(f)}};
  inp.click();
}
function edReset(){if(confirm('重置为默认数据？所有未保存修改将丢失。')){DATA=JSON.parse(JSON.stringify(SEED_DATA));localStorage.removeItem('jjk_data');refreshAll();wheel=buildWheel(rd().items);wheel.angle=0;wheel.draw();toggleEditor();showToast('🗑 已重置')}}
function charCard(){
  const cv=document.createElement('canvas');cv.width=600;cv.height=Math.min(2400,520+state.results.length*22+DIM_NAMES.length*20+state.skills.length*20);
  const ctx=cv.getContext('2d');ctx.fillStyle='#0a0a0c';ctx.fillRect(0,0,cv.width,cv.height);
  // watermark seals
  ctx.save();ctx.globalAlpha=.03;ctx.font='bold 80px serif';ctx.fillStyle='#c9a84c';ctx.fillText('呪',40,160);ctx.fillText('術',450,160);ctx.fillText('封',40,cv.height-40);ctx.fillText('解',450,cv.height-40);ctx.restore();
  // gold border
  ctx.strokeStyle='#c9a84c';ctx.lineWidth=2;ctx.strokeRect(8,8,cv.width-16,cv.height-16);
  ctx.fillStyle='#c9a84c';ctx.font='bold 22px serif';ctx.textAlign='center';ctx.fillText('🎴 咒术转盘 · 角色卡',300,36);
  ctx.strokeStyle='#c9a84c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(60,48);ctx.lineTo(540,48);ctx.stroke();
  let y=70;
  ctx.fillStyle='#9a9490';ctx.font='bold 13px sans-serif';ctx.textAlign='left';ctx.fillText('📋 基本信息',30,y);y+=20;
  const props=ph().rounds.map(r=>r.prop).filter(Boolean);const vals={};state.results.forEach(r=>{if(r.prop)vals[r.prop]=r.label});
  ctx.font='12px sans-serif';
  props.forEach((k,i)=>{ctx.fillStyle='#888';ctx.fillText(k+':',30+(i%2)*280,y);ctx.fillStyle='#e0d8d0';ctx.fillText(vals[k]||'——',30+(i%2)*280+50,y);if(i%2===1)y+=18});
  if(props.length%2===1)y+=18;y+=10;
  const vt=visibleTraits();
  if(vt.length){ctx.fillStyle='#9a9490';ctx.font='bold 13px sans-serif';ctx.fillText('🏷️ 特质',30,y);y+=20;ctx.font='11px sans-serif';let tx=30;vt.forEach(t=>{const w=ctx.measureText(t).width+16;if(tx+w>570){tx=30;y+=20}ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(tx,y-14,w,20);ctx.fillStyle='#ccc';ctx.fillText(t,tx+8,y);tx+=w+4});y+=28}
  ctx.fillStyle='#9a9490';ctx.font='bold 13px sans-serif';ctx.fillText('📊 维度表',30,y);y+=20;
  DIM_NAMES.forEach(k=>{const v=state.dimensions[k];const lv=v||'——';const idx=dimVal(v);const pct=idx<0?0:Math.min(100,(idx+1)/DIM_LEVELS.length*100);const clr=dimColor(idx);ctx.fillStyle='#888';ctx.font='10px sans-serif';ctx.fillText(k,30,y);ctx.fillStyle=clr;ctx.font='bold 10px sans-serif';ctx.fillText(lv,66,y);ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(90,y-8,480,8);ctx.fillStyle=clr;ctx.fillRect(90,y-8,480*pct/100,8);y+=16});
  // legend
  y+=4;ctx.fillStyle='#666';ctx.font='8px sans-serif';ctx.fillText('E-  E   D   C   B   A   S  SS SSS EX',100,y);y+=5;
  for(let i=0;i<10;i++){ctx.fillStyle=dimColor(i);ctx.fillRect(100+i*25,y,22,4)}y+=12;
  const dsk=displaySkills();if(dsk.length){y+=4;ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(570,y);ctx.stroke();y+=8;ctx.fillStyle='#9a9490';ctx.font='bold 13px sans-serif';ctx.fillText('📜 技能/术式',30,y);y+=18;ctx.font='11px sans-serif';dsk.forEach(s=>{ctx.fillStyle='#ccc';ctx.fillText('• '+s,30,y);y+=16})}
  y+=8;ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(570,y);ctx.stroke();y+=10;
  // 事件历史
  ctx.fillStyle='#9a9490';ctx.font='bold 13px sans-serif';ctx.fillText('📋 事件历史',30,y);y+=18;
  state.results.forEach(r=>{ctx.fillStyle='#888';ctx.font='10px sans-serif';ctx.fillText(r.rname,30,y);ctx.fillStyle='#e0d8d0';ctx.font='bold 10px sans-serif';ctx.fillText(r.label,30+ctx.measureText(r.rname).width+8,y);y+=16});
  // Footer
  ctx.fillStyle='#555';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('咒术转盘 · JJK Roulette | '+new Date().toLocaleDateString(),300,cv.height-14);
  // Download
  cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='角色卡.png';a.click();showToast('📸 角色卡已保存')});
}

// ========================================================= LOOP =========================================================
let lft=performance.now();
function loop(t){
  const dt=Math.min((t-lft)/1000,.1);lft=t;
  if(state.spinning){const p=Math.min((t-state.startTime)/state.duration,1),e=1-Math.pow(1-p,3);wheel.angle=state.startAngle+(state.targetAngle-state.startAngle)*e;if(p>=1){wheel.angle=state.targetAngle;wheel.draw();stop()}}
  if(particles){particles.update(dt);if(wheel){const pc=document.getElementById('pCanvas'),pctx=particles.ctx,sw=wheel.size;pc.width=wheel.canvas.width;pc.height=wheel.canvas.height;pctx.setTransform(wheel.dpr,0,0,wheel.dpr,0,0);pctx.clearRect(0,0,sw,sw);for(let p of particles.parts){pctx.save();pctx.globalAlpha=p.a;pctx.fillStyle=p.c;pctx.shadowBlur=p.s*4;pctx.shadowColor=p.c;pctx.beginPath();pctx.arc(p.x,p.y,p.s,0,Math.PI*2);pctx.fill();pctx.restore()}}}
  if(wheel)wheel.draw();
  if(wheel&&wheel.sectors&&wheel.sectors.length){const ctx=wheel.ctx,dpr=wheel.dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const ss=wheel.sectors;let norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;let cum=0,idx=0;for(let i=0;i<ss.length;i++){cum+=ss[i].arc;if(norm<cum){idx=i;break}}let sa=wheel.angle-Math.PI/2;for(let i=0;i<idx;i++)sa+=ss[i].arc;ctx.beginPath();ctx.moveTo(wheel.cx,wheel.cy);ctx.arc(wheel.cx,wheel.cy,wheel.radius+3,sa,sa+ss[idx].arc);ctx.closePath();ctx.strokeStyle='rgba(255,48,80,.45)';ctx.lineWidth=3;ctx.stroke();
const pl=document.getElementById('ptrLabel');if(pl){const s=ss[idx];pl.textContent=s?('🔻 '+s.l):'';pl.style.color='#fff';pl.style.borderColor='rgba(255,255,255,.3)';pl.style.textShadow='0 0 10px rgba(255,255,255,.5)';pl.style.visibility=s?'visible':'hidden'}}
  requestAnimationFrame(loop);
}

// ========================================================= INIT =========================================================
function selectOrigin(type){
  if(type!=='穿越者'){showToast(type+'暂未开放');return}
  state.introDone=true;
  const r=rd();if(!r)return;
  state.results.push({roundId:r.id,rname:`${r.icon} ${r.title}`,prop:r.prop,label:'穿越者',desc:'',c:'#c9a84c',_item:{tags:[],dim:{},dimMod:{}}});
  document.getElementById('originPick').style.display='none';
  saveState();
  refreshAfterSpin();
  goNext();
}
function introToast(type){showToast(type+'暂未开放')}
(function init(){
  const db=document.getElementById('dotsBg');for(let i=0;i<20;i++){const d=document.createElement('div');d.className='dot';d.style.left=Math.random()*100+'%';d.style.width=d.style.height=(1.5+Math.random()*3)+'px';d.style.animationDuration=(10+Math.random()*20)+'s';d.style.animationDelay=Math.random()*20+'s';d.style.background=Math.random()<.5?'var(--glow)':'var(--gold)';db.appendChild(d)}
  document.querySelectorAll('.btm-tabs .bt').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.t)));
  // load saved state
  try{const s=JSON.parse(localStorage.getItem('jjk_state'));if(s){curPhase=s.curPhase||0;curRound=s.curRound||0;if(curPhase>=DATA.phases.length){curPhase=0;curRound=0}state.results=s.results||[];state.traits=s.traits||[];state.dimensions=s.dimensions||initDimensions();  state.introDone=s.introDone||false}}catch(e){}
  if(state.introDone&&curPhase===0){curPhase=1;curRound=0}
  setTimeout(()=>{if(DATA.phases[curPhase]&&DATA.phases[curPhase].id==='p4'){const etg=state.traits.find(t=>t.startsWith('enemy_'));if(etg&&typeof initCombat==='function')initCombat(etg.replace('enemy_',''))}refreshAll();requestAnimationFrame(loop)},100);
  window.addEventListener('resize',()=>{if(!rd())return;if(wheel){wheel=buildWheel(getFilteredRoundItems(rd()));initParticles();wheel.draw()}refreshSidebar();refreshRight()});
})();
