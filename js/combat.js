// 战斗系统 v3
// ========================================================= V3 NUMERICAL =========================================================
function idxOrC(v){var i=v<0?3:Math.max(0,Math.min(9,v));return i}

const _STAM=[30,50,80,120,160,220,300,400,520,700];const _CE=[15,30,55,90,140,200,280,400,600,999];
const _SMUL=[1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.5,0.4];const _CMUL=[1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.45,0.3];
const _WB=[-8,-5,-3,0,4,8,14,20,28,40];const _TB=[-6,-4,-2,0,5,11,18,26,38,55];
const _MJ=[-10,-7,-4,0,5,10,18,28,40,55];const _TJ=[-8,-5,-2,0,5,12,20,30,42,55];
const _DZ=[7,5,4,3,2,1.5,1,0.5,0.2,0];const _BF=[-1,-1,0,0,1,2,4,6,9,12];
const _CE_DL=[35,38,42,50,58,68,78,88,94,98];const _ESC=[-20,-10,-5,0,5,10,18,28,40,55];
const _WC=[1.3,1.2,1.1,1.0,0.9,0.8,0.7,0.6,0.5,0.4];
const _RCT=[[-1,-1,0,0,1,2,3,5,8,12],[-2,-1,0,0,1,2,4,6,8,12],[2,1,1,0,0,0,-1,-2,-3,-5],[3,2,1,0,-1,-2,-4,-6,-8,-12],[2,1,1,0,-1,-2,-3,-4,-6,-8]];
const _RCT_BASE=[[5,30,35,20,10],[3,24,32,25,16],[1,16,28,30,25],[0,8,22,35,35]];

function v3StaminaMax(){var i=idxOrC(dimVal(state.dimensions['体质'])),m=_STAM[i];if(state.traits.indexOf('重伤')>=0)m=Math.floor(m*0.6);if(state.traits.indexOf('残废')>=0)m=Math.floor(m*0.4);return Math.max(1,m)}
function v3CeMax(){if(state.traits.some(function(t){return t.indexOf('天与咒缚')>=0}))return 0;var i=idxOrC(dimVal(state.dimensions['咒力总量'])),m=_CE[i];if(state.traits.indexOf('重伤')>=0)m=Math.floor(m*0.7);if(state.traits.indexOf('残废')>=0)m=Math.floor(m*0.5);if(state.traits.indexOf('半人半咒')>=0)m=Math.floor(m*1.2);if(state.traits.indexOf('特殊受肉体')>=0)m=Math.floor(m*1.15);if(state.traits.indexOf('双面四臂')>=0)m=Math.floor(m*1.3);if(state.results.some(function(r){return r.label==='储存咒力(里香戒指)'}))m+=30;return Math.max(1,m)}
function v3StamCostMul(){var m=_SMUL[idxOrC(dimVal(state.dimensions['体术']))];if(state.traits.some(function(t){return t.indexOf('天与咒缚')>=0}))m=Math.max(0.2,m-0.2);return m}
function v3CeCostMul(){if(state.traits.indexOf('六眼')>=0)return _CMUL[9];return _CMUL[idxOrC(dimVal(state.dimensions['咒力效率']))]}
function v3WinBonus(){return _WB[idxOrC(dimVal(state.dimensions['咒力操纵']))]}
function v3TechWinBonus(){return _TB[idxOrC(dimVal(state.dimensions['术式性能']))]}
function v3ClashBonus(){return _MJ[idxOrC(dimVal(state.dimensions['体术']))]+_TJ[idxOrC(dimVal(state.dimensions['术式性能']))]}
function v3DangerGrowth(){return _DZ[idxOrC(dimVal(state.dimensions['运势']))]}
function v3EnemyDangerGrowth(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 3;return _DZ[idxOrC(dimVal(e.dim['运势']))]}
function v3BfRate(){var r=3+_BF[idxOrC(dimVal(state.dimensions['天赋']))];var l=dimVal(state.dimensions['运势']);if(l>3)r+=Math.floor((l-3)*0.5);if(state.skills.indexOf('黑闪·68虎水平')>=0)r+=4;if(state.traits.indexOf('特殊受肉体')>=0)r+=2;return Math.min(35,Math.max(0,r))}
function v3CeDrawLower(){return _CE_DL[idxOrC(dimVal(state.dimensions['意志']))]}
function v3EscapeRate(){return Math.min(100,50+_ESC[idxOrC(dimVal(state.dimensions['体术']))])}
function v3WillClockMul(){return _WC[idxOrC(dimVal(state.dimensions['意志']))]}
function v3WillRCTMod(result,idx){return _RCT[result][idx]}
function v3CalcDomainDur(idx){return 3+Math.floor(idx/2)}

function v3DrawStamina(){var i=idxOrC(dimVal(state.dimensions['体质'])),pool=Math.max(8,Math.floor(6+_STAM[i]*0.04));if(state.traits.indexOf('双面四臂')>=0)pool+=8;return pool}
function v3EnemyDrawStamina(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e)return 8;var i=idxOrC(dimVal(e.dim['体质']));return Math.max(8,Math.floor(6+_STAM[i]*0.04))}
function v3DrawCe(){var mx=v3CeMax(),lo=v3CeDrawLower(),min=Math.floor(mx*lo/100),range=mx-min,num=Math.min(8,Math.max(4,Math.ceil(range/30))),step=Math.floor(range/Math.max(1,num-1))||1,mid=Math.floor(num/2),r=Math.random()*(num+mid),idx=Math.floor(r);if(idx>=num)idx=Math.floor(num/2);return Math.min(mx,min+idx*step)}
function v3EnemyDrawCe(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 100;var v=e.dim['咒力总量'];if(v==='E-')return 0;var i=idxOrC(dimVal(v)),mx=_CE[i],lo=_CE_DL[Math.max(0,Math.min(9,idxOrC(dimVal(e.dim['意志']))))],min=Math.floor(mx*lo/100);if(mx-min<5)return Math.floor(mx*0.8);return Math.floor(min+(mx-min)*0.7)}

function staminaMax(){return v3StaminaMax()}
function ceMax(){return v3CeMax()}
function stamCostMul(){var m=v3StamCostMul();if(state.combat&&state.combat.maxPenalty)m=Math.floor(m*1.5*10)/10;return m}
function ceCostMul(){return v3CeCostMul()}
function winBonus(){return v3WinBonus()}
function techWinBonus(){return v3TechWinBonus()}
function clashBonus(){return v3ClashBonus()}
function dangerGrowth(){return v3DangerGrowth()}
function enemyDangerGrowth(){return v3EnemyDangerGrowth()}
function bfRate(){return v3BfRate()}
function ceDrawRange(){return v3CeDrawLower()}
function escapeRate(){return v3EscapeRate()}

// ========================================================= V3 COMBAT CORE =========================================================
function normalizeTag(s){return s.replace(/\(.*?\)/g,'').trim()}
function hasTrait(t){var n=normalizeTag(t);return state.traits.some(function(x){return normalizeTag(x)===n})||state.skills.some(function(x){return normalizeTag(x)===n})}
function isHeavenlyRestricted(){return state.traits.some(function(t){return t.indexOf('天与咒缚')>=0})}

function v3InitCombat(enemyId){
  var e=ENEMY_TEMPLATES[enemyId];if(!e)return;
  state.traits=state.traits.filter(function(t){return t.indexOf('bt_')!==0&&t.indexOf('enemy_')!==0});
  state.traits.push('enemy_'+enemyId);
  var ce=v3DrawCe();if(isHeavenlyRestricted()){ce=0}
  state.combat={active:true,enemyId:enemyId,stance:null,stamina:0,ce:ce,win:0,shield:Math.floor(ce*0.5),hp:v3StaminaMax(),dangerZone:0,enemyStamina:0,enemyCe:v3EnemyDrawCe(),enemyWin:0,enemyHp:e.hp,enemyDangerZone:0,clockBK:0,clockLB:0,burnout:false,selfBlocked:false,bfCombo:0,bfZone:false,domainUsed:false,yourDomainActive:false,enemyDomainActive:false,domainRemaining:0,burnoutAttempts:0,maxPenalty:false,enemyBlocked:false,barrierActive:false,activeTools:[],comboFlags:{ao:false,aka:false,kai:false,hachi:false},log:[],round:0,phase:'player_stamina',bindLoanUsed:false};
  if(isHeavenlyRestricted()){state.combat.ce=0;state.combat.shield=0}
  updateCombatUI()
}

function v3EndCombat(){
  var keep=['bt_victory','bt_defeat','bt_death','bt_escape','bt_wounded'];
  state.traits=state.traits.filter(function(t){return t.indexOf('bt_')!==0||keep.indexOf(t)>=0});
  state.combat={active:false,enemyId:null,stance:null,stamina:0,ce:0,win:0,shield:0,hp:0,enemyStamina:0,enemyCe:0,enemyWin:0,enemyHp:0,clockBK:0,clockLB:0,dangerZone:0,burnout:false,bfCombo:0,domainUsed:false,enemyBlocked:false,round:0,phase:null};
  updateCombatUI()
}

function initCombat(enemyId){v3InitCombat(enemyId)}
function endCombat(){v3EndCombat()}

function drawStamina(){return v3DrawStamina()}

// ========================================================= V3 BUILD ITEMS =========================================================
function v3BuildCombatItems(forEnemy){
  var enemy=ENEMY_TEMPLATES[state.combat.enemyId];if(!enemy)return[];
  var techs=[];
  if(!forEnemy){
    // 收集
    techs=techs.concat(TECHNIQUE_LIBRARY.universal);
    // advanced: match by trait/skill
    TECHNIQUE_LIBRARY.advanced.forEach(function(t){
      if(t.id==='ct_rev'){if(!hasTrait('反转术式')||!hasTrait('术式反转'))return}
      else if(!hasTrait(t.match||''))return;
      techs.push(t)
    });
    // innate
    var innateName=null;
    if(state.skills.indexOf('无下限术式')>=0)innateName='无下限术式';
    else if(state.skills.indexOf('御厨子')>=0)innateName='御厨子';
    else{for(var i=0;i<state.skills.length;i++){if(TECHNIQUE_LIBRARY.innate[state.skills[i]]){innateName=state.skills[i];break}}
    if(!innateName&&state.skills.some(function(s){return TECHNIQUE_LIBRARY.innate[s]}))innateName='_default'}
    var iTechs=TECHNIQUE_LIBRARY.innate[innateName];
    if(iTechs){
      iTechs.forEach(function(t){
        if(t.id==='murasaki'&&!state.combat.comboFlags.ao&&!state.combat.comboFlags.aka)return;
        if(t.id==='fuga'&&(!state.combat.yourDomainActive||state.skills.indexOf('御厨子')<0))return;
        techs.push(t)
      })
    }
    // HR专属
    if(isHeavenlyRestricted())TECHNIQUE_LIBRARY.hrOnly.forEach(function(t){techs.push(t)});
    // 过滤
    var burnout=state.combat.burnout,smul=v3StamCostMul(),cemul=v3CeCostMul(),wbonus=v3WinBonus()+v3TechWinBonus();
    techs=techs.filter(function(t){
      if(isHeavenlyRestricted()&&t.ce>0)return false;
      if(burnout&&t.tier.indexOf('atk_ce')>=0&&t.id!=='tech_basic')return false;
      if(burnout&&(t.tier==='ult_ce'||t.tier==='ult'))return false;
      var st=Math.max(1,Math.floor(t.st*smul)),ce=Math.floor(t.ce*cemul);
      if(st>state.combat.stamina)return false;
      if(ce>0&&ce>state.combat.ce)return false;
      return true
    });
    // 应用修正
    var stance=state.combat.stance||'猛攻';
    techs=techs.map(function(t){
      var st=Math.max(1,Math.floor(t.st*smul)),ce=Math.floor(t.ce*cemul),win=t.win+wbonus;
      if(t.tier.indexOf('atk_ce')>=0)win+=v3TechWinBonus();
      if(t.id==='murasaki'||t.id==='fuga')win=Math.floor(win*1.5);
      // 姿态权重修正
      var w=8;
      if(stance==='猛攻'){if(t.id==='murasaki'||t.id==='fuga')w=24;else if(t.id==='aka'||t.id==='heavy'||t.id==='tech_full')w=16}
      else if(stance==='流转'){if(t.id==='rct_self'||t.id==='rct_out'||t.id==='tech_basic')w=16;else if(t.id==='kai')w=20}
      else if(stance==='坚牢'){if(t.id==='simple_domain'||t.id==='barrier')w=24;else if(t.id==='rct_self')w=16}
      return{l:t.name,w:w,c:t.c||'#888',d:t.eff||'',_tech:{st:st,ce:ce,win:win,id:t.id,tier:t.tier}}
    })
  }else{
    // 敌人招式
    techs=techs.concat(TECHNIQUE_LIBRARY.universal);
    if(isHeavenlyRestricted())TECHNIQUE_LIBRARY.hrOnly.forEach(function(t){techs.push(t)});
    (enemy.techniques||[]).forEach(function(tn){
      var ub=enemy.uniqueTechniques&&enemy.uniqueTechniques[tn];
      techs.push({id:tn,name:tn,st:ub?ub.st:8,ce:ub?ub.ce:0,win:ub?ub.win:22,tier:'atk',c:'#d84',eff:ub?ub.eff:'',isEnemy:true})
    });
    // 敌人领域作为普通扇区
    if(enemy.hasDomain&&enemy.domain&&!state.combat.enemyBlocked){
      techs.push({l:enemy.domain.name||'领域展开',w:enemy.domain.weight||3,c:'#80f',d:'敌人领域展开',_tech:{st:5,ce:80,win:100,id:'enemy_domain',tier:'ult'},isEnemy:true})
    }
    var eStance=enemy.stanceAI?enemy.stanceAI.default:'猛攻';
    techs=techs.map(function(t){
      var st=Math.max(1,Math.floor((t.st||8)*1)),ce=Math.floor((t.ce||0)*1),win=t.win||20,w=8;
      if(t.isEnemy){var ub=enemy.uniqueTechniques&&enemy.uniqueTechniques[t.name];st=ub?ub.st:8;ce=ub?ub.ce:0;win=ub?ub.win:22}
      return{l:t.name,w:w,c:t.c||'#d84',d:t.eff||'',_tech:{st:st,ce:ce,win:win,id:t.id,tier:t.tier||'atk'}}
    }).filter(function(t){
      if(state.combat.enemyBlocked&&t._tech.tier.indexOf('atk_ce')>=0)return false;
      if(t._tech.st>(state.combat.enemyStamina||0))return false;
      if(t._tech.ce>(state.combat.enemyCe||0))return false;
      return true
    })
  }
  return techs
}

function buildCombatItems(forEnemy){return v3BuildCombatItems(forEnemy)}

// ========================================================= V3 PHASE STATE MACHINE =========================================================
function v3RoundStamina(){
  var c=state.combat;
  if(!c||!c.active)return;
  c.phase='player_tech';
  c.win=0;c.enemyWin=0;
  c.stamina=v3DrawStamina();
  c.enemyStamina=v3EnemyDrawStamina();
  c.dangerZone+=v3DangerGrowth();
  c.enemyDangerZone+=v3EnemyDangerGrowth();
  c.round++;
  c.bfCombo=0;c.bfZone=false;c.selfBlocked=false;c.barrierActive=false;
  c.comboFlags={ao:false,aka:false,kai:false,hachi:false};
  c.bindLoanUsed=false;
  if(c.domainRemaining>0){c.domainRemaining--;if(c.domainRemaining<=0){c.yourDomainActive=false;c.enemyDomainActive=false}}
  if(c.maxPenalty){c.maxPenalty=false}
  // 敌人AI姿态切换
  if(c.enemyId){var e=ENEMY_TEMPLATES[c.enemyId];if(e&&e.stanceAI){var ai=e.stanceAI,sw=ai.switches||[],ns=ai.default;for(var i=0;i<sw.length;i++){var s=sw[i],match=false;if(s.to==='逃跑'&&c.enemyHp<e.hp*0.2)match=true;if(s.to==='流转'&&(c.win-c.enemyWin)>40)match=true;if(s.to==='猛攻'&&c.burnout)match=true;if(match){ns=s.to;break}}c.enemyStance=ns}}
  updateCombatUI()
}

function roundStamina(){v3RoundStamina()}

function v3ResolveDamage(){
  var c=state.combat,enemy=ENEMY_TEMPLATES[c.enemyId];if(!enemy)return{pDmg:0,eDmg:0};
  var pBase=Math.floor(c.win*0.8)+v3ClashBonus()+Math.floor(Math.random()*6);
  var eBase=Math.floor(c.enemyWin*0.8)+Math.floor(Math.random()*6)+enemy.baseDmg+Math.floor(Math.random()*(enemy.dmgRange?enemy.dmgRange[1]-enemy.dmgRange[0]:15));
  // 领域效果
  if(c.yourDomainActive)pBase=Math.floor(pBase*(1.0+0.2));if(c.enemyDomainActive)eBase=Math.floor(eBase*(1.0+0.2));
  // 天与咒缚领域免疫
  if(isHeavenlyRestricted()&&c.enemyDomainActive)pBase=pBase;
  // 姿态修正
  if(c.stance==='猛攻'){pBase=Math.floor(pBase*1.3);eBase=Math.floor(eBase*1.3)}
  if(c.stance==='流转'){pBase=Math.floor(pBase*1.0);eBase=Math.floor(eBase*1.0)}
  if(c.stance==='坚牢'){pBase=Math.floor(pBase*0.7);eBase=Math.floor(eBase*0.7)}
  // 结界术
  if(c.barrierActive)eBase=Math.floor(eBase*0.8);
  // 熔断
  if(c.burnout)pBase=Math.floor(pBase*0.7);
  // 护盾
  if(c.shield>0){var abs=Math.min(c.shield,eBase);c.shield-=abs;eBase-=abs}
  c.hp=Math.max(0,c.hp-Math.max(0,eBase));
  c.enemyHp=Math.max(0,c.enemyHp-Math.max(0,pBase));
  // 时钟
  c.clockBK=Math.min(6,c.clockBK+Math.floor(pBase/(enemy.hp/6)));
  c.clockLB=Math.min(6,c.clockLB+Math.floor(eBase/(v3StaminaMax()/6)*v3WillClockMul()));
  c.shield=Math.floor(c.ce*0.5);
  updateCombatUI();
  return{pDmg:pBase,eDmg:eBase}
}

function resolveDamage(){return v3ResolveDamage()}

function v3CheckCombatEnd(){
  var c=state.combat;if(c.clockBK>=6)return'victory';if(c.clockLB>=6)return'defeat';if(c.hp<=0)return'defeat';if(c.enemyHp<=0)return'victory';return null
}

function checkCombatEnd(){return v3CheckCombatEnd()}

function v3GetResultOutcome(){
  var c=state.combat;
  if(c.clockBK>=6||c.enemyHp<=0){
    var w={complete:25,bitter:50,heavy:25};
    if(c.shield>0){w.complete+=25;w.bitter-=10;w.heavy-=15}
    if(c.hp>v3StaminaMax()*0.9)w.complete+=20;
    if(c.hp>v3StaminaMax()*0.7)w.complete+=10;
    if(c.hp>v3StaminaMax()*0.5)w.complete+=5;
    if(c.hp<v3StaminaMax()*0.25){w.complete-=25;w.heavy+=15}
    if(c.clockLB===0){w.complete+=20;w.bitter-=10;w.heavy-=10}
    if(c.clockLB<=2){w.complete+=8;w.bitter-=4;w.heavy-=4}
    if(c.clockLB>=5){w.complete-=35;w.bitter+=18;w.heavy+=18}
    if(c.round<=3){w.complete+=15;w.bitter-=8;w.heavy-=8}
    if(c.round>12){w.complete-=15;w.bitter+=8;w.heavy+=8}
    if(c.burnout){w.complete-=12;w.bitter+=5;w.heavy+=7}
    w.complete=Math.max(5,w.complete);w.bitter=Math.max(5,w.bitter);w.heavy=Math.max(5,w.heavy);
    return w
  }
  var w={retreat:30,heavy:25,death:30,mercy:5};
  if(c.clockBK<=1){w.retreat-=15;w.death+=10;w.mercy-=3}
  if(c.clockBK>=5){w.retreat+=30;w.heavy-=15;w.death-=10}
  if(c.hp>v3StaminaMax()*0.5){w.retreat+=15;w.death-=10;w.mercy+=3}
  if(c.ce>v3CeMax()*0.5){w.retreat+=8;w.death-=5;w.mercy+=2}
  var charm=dimVal(state.dimensions['魅力']);
  if(charm>=4){w.mercy+=1}if(charm>=5){w.mercy+=2}if(charm>=6){w.mercy+=4}if(charm>=7){w.mercy+=6}if(charm>=8){w.mercy+=8}
  return w
}

function getResultOutcome(){return v3GetResultOutcome()}

// ========================================================= V3 UI =========================================================
function v3UpdateCombatUI(){
  var ec=document.getElementById('enemyCard');if(!ec)return;
  if(!state.combat||!state.combat.active||!state.combat.enemyId){ec.style.display='none';document.getElementById('combatBars').style.display='none';return}
  ec.style.display='block';document.getElementById('combatBars').style.display='block';
  var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e)return;
  var c=state.combat;
  document.getElementById('ecTier').textContent=e.tier;document.getElementById('ecTier').style.background=e.tierColor;document.getElementById('ecTier').style.color='#1a1a1a';
  document.getElementById('ecName').textContent=e.name;document.getElementById('ecTitle').textContent=e.title;
  var eDimEl=document.getElementById('ecDims');eDimEl.innerHTML='';if(e.dim){Object.keys(e.dim).slice(0,6).forEach(function(k){if(e.dim[k]){var idx=dimVal(e.dim[k]);eDimEl.innerHTML+='<span class="ecd"><span style="color:var(--dim);font-size:9px">'+k+'</span><span style="font-weight:700;color:'+dimColor(idx)+'">'+e.dim[k]+'</span></span>'}})}
  var stEl=document.getElementById('ecStatus'),s='';if(c.clockBK>0)s+='<span class="ecs adv">⚔击破'+c.clockBK+'/6</span>';if(c.clockLB>0)s+='<span class="ecs wnd">💀败势'+c.clockLB+'/6</span>';if(c.round>0)s+='<span class="ecs rnd">第'+c.round+'回合</span>';stEl.innerHTML=s||'<span class="ecs neutral">⚡ 战斗开始</span>';
  var hpPct=Math.max(0,Math.min(100,c.hp/Math.max(1,v3StaminaMax())*100));document.getElementById('cbHpBar').style.width=hpPct+'%';document.getElementById('cbHpVal').textContent=c.hp;
  var shPct=c.shield>0?Math.min(100,c.shield/Math.max(1,c.hp)*100):0;document.getElementById('cbShBar').style.width=shPct+'%';document.getElementById('cbShVal').textContent=Math.floor(c.shield);
  var ceMx=v3CeMax(),cePct=ceMx>0?Math.min(100,c.ce/Math.max(1,ceMx)*100):0;document.getElementById('cbCeBar').style.width=cePct+'%';document.getElementById('cbCeVal').textContent=c.ce+(ceMx>=999?'':'');
  document.getElementById('cbStVal').textContent=c.stamina;document.getElementById('cbWinVal').textContent=c.win;document.getElementById('cbDangerVal').textContent=Math.floor(c.dangerZone)+'%';
  var ehPct=Math.max(0,Math.min(100,c.enemyHp/Math.max(1,e.hp)*100));document.getElementById('cbEhBar').style.width=ehPct+'%';document.getElementById('cbEhVal').textContent=c.enemyHp;
  if(c.burnout){document.getElementById('cbBurnout').style.display='block'}else{document.getElementById('cbBurnout').style.display='none'}
}

function updateCombatUI(){v3UpdateCombatUI()}

function combatShieldUpdate(){if(state.combat&&state.combat.active)state.combat.shield=Math.floor(state.combat.ce*0.5)}

// ========================================================= V3 PHASE HELPERS =========================================================
function v3Spin(){
  if(state.spinning||isRoundDone(rd()))return;var r=rd();
  if(r&&r.id==='p4_action'){
    var c=state.combat;if(!c||!c.active)return;
    // 特殊阶段: RCT修复/逃跑——不重建转盘, 直接spin已有轮盘
    if(state._rctPhase||state._escapePhase){
      var items=wheel.sectors;state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';
      var tw=items.reduce(function(s,se){return s+(se.w||1)},0),rv0=Math.random()*tw,ti0=0;
      for(var jj=0;jj<items.length;jj++){rv0-=items[jj].w||1;if(rv0<=0){ti0=jj;break}}var ca0=0;for(var kk=0;kk<ti0;kk++)ca0+=items[kk].arc;
      state.targetAngle=wheel.angle+(6+Math.floor(Math.random()*4))*Math.PI*2-ca0-items[ti0].arc/2;
      state.startAngle=wheel.angle;state.startTime=performance.now();state.duration=4000+Math.random()*1500;return
    }
    if(!c.round||c.stamina<=0){v3RoundStamina()}
    if(c.phase==='player_stamina'){
      state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';
      document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';
      var pool=v3DrawStamina(),start=pool-3,end=pool+3,items=[];
      for(var i=0;i<6;i++){var val=start+i;items.push({l:''+val,w:Math.abs(3-i)+1,c:'#aaa'})}
      wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;
      var ss=wheel.sectors,tw=ss.reduce(function(s,se){return s+(se.w||1)},0);var rv=Math.random()*tw,ti=0;
      for(var j=0;j<ss.length;j++){rv-=ss[j].w||1;if(rv<=0){ti=j;break}}var ca=0;for(var k=0;k<ti;k++)ca+=ss[k].arc;
      state.targetAngle=wheel.angle+(6+Math.floor(Math.random()*4))*Math.PI*2-ca-ss[ti].arc/2;
      state.startAngle=wheel.angle;state.startTime=performance.now();state.duration=4000+Math.random()*1500;
      return
    }
    // Build combat items and spin
    var items=v3BuildCombatItems(false);if(items.length===0){showToast('无可用技法');return}
    wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;
    // Normal spin
    state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';
    document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';
    var ss=wheel.sectors,tw=ss.reduce(function(s,se){return s+(se.w||1)},0);var rv=Math.random()*tw,ti=0;
    for(var j=0;j<ss.length;j++){rv-=ss[j].w||1;if(rv<=0){ti=j;break}}var ca=0;for(var k=0;k<ti;k++)ca+=ss[k].arc;
    state.targetAngle=wheel.angle+(6+Math.floor(Math.random()*4))*Math.PI*2-ca-ss[ti].arc/2;
    state.startAngle=wheel.angle;state.startTime=performance.now();state.duration=5000+Math.random()*2000;
    return
  }
  spin() // fallback to original
}

// Override spin for combat
var _origSpin=spin;spin=function(){if(rd()&&rd().id==='p4_action')return v3Spin();return _origSpin()}

// ========================================================= V3 STOP OVERRIDE =========================================================
var _origStop=stop;
stop=function(){
  var r=rd();if(!r||r.id!=='p4_action'){_origStop();return}
  state.spinning=false;document.getElementById('btnSpin').disabled=false;document.getElementById('btnSpin').textContent='⚔ 出招';
  var norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;var cum=0,idx=0;
  for(var i=0;i<wheel.sectors.length;i++){cum+=wheel.sectors[i].arc;if(norm<cum){idx=i;break}}
  var item=wheel.sectors[idx],c=state.combat;
  // RCT修复阶段
  if(state._rctPhase){state._rctPhase=false;var label=item.l,c=state.combat;
    if(label.indexOf('完美')>=0){c.burnout=false;c.domainUsed=false;showToast('完美修复!')}
    else if(label.indexOf('标准')>=0){c.burnout=false;c.domainUsed=false;c.ce=Math.max(0,c.ce-15);showToast('标准修复，CE-15')}
    else if(label.indexOf('代价')>=0){c.burnout=false;c.domainUsed=false;c.ce=Math.max(0,c.ce-25);showToast('代价修复')}
    else if(label.indexOf('失败')>=0){c.hp=Math.floor(c.hp*0.7);showToast('修复失败')}
    else if(label.indexOf('反噬')>=0){state.traits=state.traits.filter(function(t){return normalizeTag(t)!=='领域展开'});c.hp=Math.floor(c.hp*0.5);showToast('反噬!')}
    c.phase='player_tech';refreshAll();saveState();return}
  // 逃跑阶段
  if(state._escapePhase){state._escapePhase=false;
    if(item.l.indexOf('成功')>=0){endCombat();showToast('成功脱出!');goNext();return}
    else if(item.l.indexOf('险中')>=0){var cur=dimVal(state.dimensions['体质']);state.dimensions['体质']=dimLv(cur-1);endCombat();showToast('险脱，体质-1');goNext();return}
    else{state.combat._escapeFail=true;c.phase='player_tech';showToast('脱出失败!');refreshAll();saveState();return}}
  // 招式结算
  var tech=item._tech;if(!tech){showToast('无效技法');return}
  var bf=v3BfCheck(tech);
  c.stamina-=tech.st;if(tech.ce>0)c.ce-=tech.ce;c.win+=tech.win;
  if(bf){c.win=Math.floor(c.win*2.5)}if(c.bfZone){c.win+=Math.floor(c.win*0.1)}
  // Track combo
  if(tech.id==='ao')c.comboFlags.ao=true;if(tech.id==='aka')c.comboFlags.aka=true;
  if(tech.id==='kai')c.comboFlags.kai=true;if(tech.id==='hachi')c.comboFlags.hachi=true;
  // Advanced effects
  if(tech.id==='rct_self'){state.traits=state.traits.filter(function(t){return t.indexOf('bt_wnd_')!==0})}
  if(tech.id==='domain_amp'){c.selfBlocked=true;c.enemyBlocked=true}
  if(tech.id==='barrier'){c.barrierActive=true}
  // 领域效果检测
  if(c.yourDomainActive&&c.domainEffect){
    var de=c.domainEffect;
    if(de==='打击灵魂')v3ResolveDamage() // pre-apply? handled in resolveDamage
  }
  // 咒灵易伤
  var enemy=ENEMY_TEMPLATES[c.enemyId],curseMul=1;
  if(enemy&&enemy.type==='curse'){
    if(tech.tier==='heal'||tech.tier==='atk_rct')curseMul=1.5;
    if(tech.id==='rct_out')curseMul=3
    c.win=Math.floor(c.win*curseMul)
  }
  // 体力耗尽或敌人阶段过渡
  if(c.stamina>0){
    // 敌人立即反击(旧版过渡——v3应该走敌人招式轮, 但先保持兼容)
    var eTechs=v3BuildCombatItems(true);if(eTechs.length>0){var eItem=eTechs[Math.floor(Math.random()*eTechs.length)];if(eItem._tech){c.enemyWin+=eItem._tech.win;c.enemyStamina-=eItem._tech.st;if(eItem._tech.ce>0)c.enemyCe-=eItem._tech.ce}}
    var dmg=v3ResolveDamage();var ended=v3CheckCombatEnd();
    updateCombatUI();refreshAll();
    document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='⚔ 再出一招';document.getElementById('btnSpin').disabled=false;
    document.getElementById('resultPanel').style.display='block';document.getElementById('resultPanel').innerHTML='<div class="rp-cat">'+r.icon+' '+r.title+'</div><div class="rp-val" style="color:'+(item.c||'#888')+'">'+item.l+(bf?' ⚡黑闪!':'')+'</div><div class="rp-desc">体力-'+tech.st+' 咒力-'+(tech.ce||0)+' 胜率+'+tech.win+(bf?' ×2.5':'')+' | 造成'+dmg.pDmg+'伤害 受击'+dmg.eDmg+'</div>';
    document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 收手';
    if(bf&&particles&&wheel){particles.emit(wheel.cx,20,50,'#ffcc00',160,3.5,2)}
    saveState();return
  }
  // 过渡到敌人阶段
  var dmg=v3ResolveDamage();var ended=v3CheckCombatEnd();
  if(ended){var ri=activeRounds().findIndex(function(rx){return rx.id==='p4_result'});if(ri>=0){goRound(ri);refreshAll()}return}
  refreshAll();saveState()
}

// ========================================================= V3 BUTTONS =========================================================
function updateBtnRow(){
  var b=document.getElementById('btnCombatRow'),c=state.combat;if(!b)return;
  if(!c||!c.active||!c.phase){b.style.display='none';return}
  var vis=c.phase==='player_tech';
  b.style.display=vis?'flex':'none';if(!vis)return;
  document.getElementById('bcDomain').style.display=(c.burnout||c.domainUsed)?'none':'inline-block';
  document.getElementById('bcMax').style.display=c.burnout?'none':'inline-block';
  document.getElementById('bcRCT').style.display=(c.burnout&&hasTrait('反转术式'))?'inline-block':'none';
  var esc=document.getElementById('bcEscape');esc.style.display=(c.stance==='流转')?'inline-block':'none';
  document.getElementById('bcBindLoan').style.display=c.bindLoanUsed?'none':'inline-block';
  document.getElementById('bcBindStack').style.display=c.bindLoanUsed?'inline-block':'none'
}

function bDomain(){
  var c=state.combat;if(!c||c.burnout||c.domainUsed){showToast('无法展开领域');return}
  c.ce-=80;c.burnout=true;c.domainUsed=true;
  var enemy=ENEMY_TEMPLATES[c.enemyId];
  if(enemy&&enemy.hasDomain){c.phase='domain_clash';showToast('领域对拼!')}
  else{c.yourDomainActive=true;c.domainRemaining=v3CalcDomainDur(idxOrC(dimVal(state.dimensions['咒力总量'])));showToast('领域展开!')}
  updateCombatUI();updateBtnRow()
}

function bMax(){
  var c=state.combat;if(!c||c.burnout){showToast('熔断中无法使用极之番');return}
  if(c.ce<80){showToast('咒力不足(需80)');return}
  c.ce-=80;c.win+=Math.floor(70*(1+v3TechWinBonus()/100));c.maxPenalty=true;showToast('极之番!')
  updateCombatUI();updateBtnRow()
}

function bRCT(){
  var c=state.combat;if(!c||!c.burnout){showToast('不在熔断状态');return}
  var att=c.burnoutAttempts||0,idx=Math.min(att,3);
  var base=_RCT_BASE[idx],manip=idxOrC(dimVal(state.dimensions['咒力操纵'])),will=idxOrC(dimVal(state.dimensions['意志']));
  var ps=[0,0,0,0,0];for(var i=0;i<5;i++)ps[i]=Math.max(0,base[i]+_RCT[i][manip]+_RCT[i][will]);ps[4]=Math.max(3,ps[4]);
  var sum=ps[0]+ps[1]+ps[2]+ps[3]+ps[4];if(sum!==100){var rem=100;for(var j=0;j<4;j++){ps[j]=Math.round(ps[j]/sum*100);rem-=ps[j]}ps[4]=Math.max(0,rem)}
  var names=['完美修复','标准修复','代价修复','修复失败','反噬'],items=[];
  for(var k=0;k<5;k++)items.push({l:names[k],w:ps[k],c:['#ff0','#8a4','#c84','#888','#f44'][k]});
  c.burnoutAttempts=att+1;
  wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();
  document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🔮 修复';document.getElementById('btnSpin').disabled=false;
  document.getElementById('wheelWrap').style.display='block';
  document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';
  state._rctPhase=true
}

function bEscape(){
  var c=state.combat;if(c.stance!=='流转'){showToast('仅流转姿态可逃跑');return}
  var er=v3EscapeRate(),items=[{l:'成功脱出',w:Math.max(er,1),c:'#4c8'},{l:'险中脱出',w:25,c:'#888'},{l:'脱出失败',w:Math.max(100-er-25,1),c:'#c44'}];
  wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();
  document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🏃 逃跑';document.getElementById('btnSpin').disabled=false;
  document.getElementById('wheelWrap').style.display='block';
  document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';
  state._escapePhase=true
}

function bBindLoan(){
  var c=state.combat;c.stamina=Math.max(0,c.stamina-5);c.win+=25;c.bindLoanUsed=true;
  if(c.stamina<=0){c.phase='enemy_stamina';showToast('体力耗尽，回合结束')}
  updateCombatUI();updateBtnRow()
}

function bBindStack(){
  var c=state.combat;c.stamina=Math.max(0,c.stamina-9);c.dangerZone+=10;c.win+=50;
  if(c.stamina<=0){c.phase='enemy_stamina';showToast('体力耗尽，回合结束')}
  updateCombatUI();updateBtnRow()
}

// ========================================================= V3 TACTICAL DEPTH =========================================================
function v3BfCheck(tech){
  var c=state.combat,rate=Math.min(35,v3BfRate()+c.bfCombo*v3BfRate()*0.5);
  if(Math.random()*100<rate){c.bfCombo=Math.min(3,c.bfCombo+1);c.stamina+=5;c.ce+=12;c.bfZone=true;return true}return false
}

function v3ApplyCurseDMG(tech,baseDmg){
  var enemy=ENEMY_TEMPLATES[state.combat.enemyId];if(!enemy||enemy.type!=='curse')return baseDmg;
  if(tech.tier==='heal')return Math.floor(baseDmg*1.5);
  if(tech.id==='rct_out')return Math.floor(baseDmg*3);
  return baseDmg
}

// ========================================================= V3 UI POLISH =========================================================
function v3UpdateCombatUI(){
  var ec=document.getElementById('enemyCard');if(!ec)return;
  if(!state.combat||!state.combat.active||!state.combat.enemyId){ec.style.display='none';var b=document.getElementById('combatBars');if(b)b.style.display='none';updateBtnRow();return}
  ec.style.display='block';var b=document.getElementById('combatBars');if(b)b.style.display='block';
  var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e)return;
  var c=state.combat;
  document.getElementById('ecTier').textContent=e.tier;document.getElementById('ecTier').style.background=e.tierColor;document.getElementById('ecTier').style.color='#1a1a1a';
  document.getElementById('ecName').textContent=e.name;document.getElementById('ecTitle').textContent=e.title;
  var hpPct=Math.max(0,Math.min(100,c.hp/Math.max(1,v3StaminaMax())*100));document.getElementById('cbHpBar').style.width=hpPct+'%';document.getElementById('cbHpVal').textContent=c.hp;
  var shPct=c.shield>0?Math.min(100,c.shield/Math.max(1,c.hp)*100):0;document.getElementById('cbShBar').style.width=shPct+'%';document.getElementById('cbShVal').textContent=Math.floor(c.shield);
  var ceMx=v3CeMax(),cePct=ceMx>0?Math.min(100,c.ce/Math.max(1,ceMx)*100):0;document.getElementById('cbCeBar').style.width=cePct+'%';document.getElementById('cbCeVal').textContent=c.ce;
  document.getElementById('cbStVal').textContent=c.stamina;document.getElementById('cbWinVal').textContent=c.win;document.getElementById('cbDangerVal').textContent=Math.floor(c.dangerZone)+'%';
  var ehPct=Math.max(0,Math.min(100,c.enemyHp/Math.max(1,e.hp)*100));document.getElementById('cbEhBar').style.width=ehPct+'%';document.getElementById('cbEhVal').textContent=c.enemyHp;
  if(c.burnout){document.getElementById('cbBurnout').style.display='block'}else{document.getElementById('cbBurnout').style.display='none'}
  updateBtnRow()
}

function updateCombatUI(){v3UpdateCombatUI()}

// ========================================================= V3 SECTOR LABELS =========================================================
var _v3BuildWheel=null;
(function patchBuildWheel(){
  if(typeof buildWheel!=='function')return;
  _v3BuildWheel=buildWheel;
  buildWheel=function(items){
    var w=_v3BuildWheel(items),orig=w.draw;
    w.draw=function(){
      orig.call(this);
      if(!items||items.length===0)return;
      var ctx=this.ctx,dpr=this.dpr,a=this.angle-Math.PI/2;
      for(var i=0;i<this.sectors.length;i++){
        var s=this.sectors[i],sa=a,ea=a+s.arc;if(!s._tech)continue;
        ctx.save();ctx.translate(this.cx,this.cy);ctx.rotate(sa+s.arc/2);ctx.textAlign='right';ctx.fillStyle='#999';
        var fs2=Math.max(7,this.radius*.06);
        ctx.font=fs2+'px sans-serif';
        var txt='-'+s._tech.st+'体 -'+s._tech.ce+'咒 +'+s._tech.win;
        ctx.fillText(txt,this.radius-8,-fs2*.5);ctx.restore();a=ea
      }
    };
    return w
  }
})();
