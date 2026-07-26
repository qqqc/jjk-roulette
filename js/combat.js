// 战斗系统 v3
// ========================================================= V3 NUMERICAL =========================================================
function idxOrC(v){var i=v<0?3:Math.max(0,Math.min(9,v));return i}
const _STAM=[30,50,80,120,160,220,300,400,520,700];const _CE=[15,30,55,90,140,200,280,400,600,999];const _SMUL=[1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.5,0.4];const _CMUL=[1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.45,0.3];
const _WB=[-8,-5,-3,0,4,8,14,20,28,40];const _TB=[-6,-4,-2,0,5,11,18,26,38,55];const _MJ=[-10,-7,-4,0,5,10,18,28,40,55];const _TJ=[-8,-5,-2,0,5,12,20,30,42,55];
const _DZ=[7,5,4,3,2,1.5,1,0.5,0.2,0];const _BF=[-1,-1,0,0,1,2,4,6,9,12];const _CE_DL=[35,38,42,50,58,68,78,88,94,98];const _ESC=[-20,-10,-5,0,5,10,18,28,40,55];
const _WC=[1.3,1.2,1.1,1.0,0.9,0.8,0.7,0.6,0.5,0.4];
const WILL_RCT=[[-1,-1,0,0,1,2,3,5,8,12],[-2,-1,0,0,1,2,4,6,8,12],[2,1,1,0,0,0,-1,-2,-3,-5],[3,2,1,0,-1,-2,-4,-6,-8,-12],[2,1,1,0,-1,-2,-3,-4,-6,-8]];
const RCT_BASE=[[5,30,35,20,10],[3,24,32,25,16],[1,16,28,30,25],[0,8,22,35,35]];

// §5.3 咒力操纵修正 + §2.3b意志修正(5结果×10级)
const RCT_MANIP=[[-2,-2,-1,0,1,3,6,10,15,20],[-3,-2,-1,0,1,3,6,8,10,15],[2,1,1,0,0,0,0,0,0,0],[3,2,1,0,-1,-3,-5,-7,-10,-15],[3,2,1,0,-1,-3,-5,-7,-10,-13]];
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
function v3CalcDomainDur(idx){return 3+Math.floor(idx/2)}
function v3DrawStamina(){var i=idxOrC(dimVal(state.dimensions['体质'])),pool=Math.max(8,Math.floor(6+_STAM[i]*0.04));if(state.traits.indexOf('双面四臂')>=0)pool+=8;return pool}
function v3EnemyDrawStamina(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e)return 8;var i=idxOrC(dimVal(e.dim['体质']));return Math.max(8,Math.floor(6+_STAM[i]*0.04))}
function v3DrawCe(){var mx=v3CeMax(),lo=v3CeDrawLower(),min=Math.floor(mx*lo/100),range=mx-min,num=Math.min(8,Math.max(4,Math.ceil(range/30))),step=Math.floor(range/Math.max(1,num-1))||1,mid=Math.floor(num/2),r=Math.random()*(num+mid),idx=Math.floor(r);if(idx>=num)idx=Math.floor(num/2);return Math.min(mx,min+idx*step)}
function v3EnemyDrawCe(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 100;var v=e.dim['咒力总量'];if(v==='E-')return 0;var i=idxOrC(dimVal(v)),mx=_CE[i];return Math.floor(mx*0.7)}

function staminaMax(){return v3StaminaMax()}function ceMax(){return v3CeMax()}function stamCostMul(){var m=v3StamCostMul();if(state.combat&&state.combat.maxPenalty)m=Math.floor(m*1.5*10)/10;return m}function ceCostMul(){return v3CeCostMul()}function winBonus(){return v3WinBonus()}function techWinBonus(){return v3TechWinBonus()}function clashBonus(){return v3ClashBonus()}function dangerGrowth(){return v3DangerGrowth()}function enemyDangerGrowth(){return v3EnemyDangerGrowth()}function bfRate(){return v3BfRate()}function ceDrawRange(){return v3CeDrawLower()}function escapeRate(){return v3EscapeRate()}function drawStamina(){return v3DrawStamina()}

function normalizeTag(s){return s.replace(/\(.*?\)/g,'').trim()}function hasTrait(t){var n=normalizeTag(t);return state.traits.some(function(x){return normalizeTag(x)===n})||state.skills.some(function(x){return normalizeTag(x)===n})}function isHeavenlyRestricted(){return state.traits.some(function(t){return t.indexOf('天与咒缚')>=0})}

// ========================================================= V3 COMBAT CORE =========================================================
function initCombat(enemyId){var e=ENEMY_TEMPLATES[enemyId];if(!e)return;state.traits=state.traits.filter(function(t){return t.indexOf('bt_')!==0&&t.indexOf('enemy_')!==0});state.traits.push('enemy_'+enemyId);var ce=v3DrawCe();if(isHeavenlyRestricted())ce=0;state.combat={active:true,enemyId:enemyId,stance:null,stamina:0,ce:ce,win:0,shield:Math.floor(ce*0.5),hp:v3StaminaMax(),dangerZone:0,enemyStamina:0,enemyCe:v3EnemyDrawCe(),enemyWin:0,enemyHp:e.hp,enemyDangerZone:0,clockBK:0,clockLB:0,burnout:false,selfBlocked:false,bfCombo:0,bfZone:false,domainUsed:false,yourDomainActive:false,enemyDomainActive:false,domainRemaining:0,burnoutAttempts:0,maxPenalty:false,enemyBlocked:false,barrierActive:false,activeTools:[],comboFlags:{ao:false,aka:false,kai:false,hachi:false},log:[],round:0,phase:null,bindLoanUsed:false};if(isHeavenlyRestricted()){state.combat.ce=0;state.combat.shield=0}updateCombatUI()}
function endCombat(){var keep=['bt_victory','bt_defeat','bt_death','bt_escape','bt_wounded'];state.traits=state.traits.filter(function(t){return t.indexOf('bt_')!==0||keep.indexOf(t)>=0});state.combat={active:false,enemyId:null,stance:null,stamina:0,ce:0,win:0,shield:0,hp:0,enemyStamina:0,enemyCe:0,enemyWin:0,enemyHp:0,clockBK:0,clockLB:0,dangerZone:0,burnout:false,bfCombo:0,domainUsed:false,enemyBlocked:false,round:0,phase:null};updateCombatUI()}

// ========================================================= V3 BUILD ITEMS =========================================================
function buildCombatItems(forEnemy){return v3BuildCombatItems(forEnemy)}
function v3BuildCombatItems(forEnemy){
  var enemy=ENEMY_TEMPLATES[state.combat.enemyId];if(!enemy)return[];var techs=[],c=state.combat;
  if(!forEnemy){
    techs=techs.concat(TECHNIQUE_LIBRARY.universal);
    TECHNIQUE_LIBRARY.advanced.forEach(function(t){if(t.id==='ct_rev'){if(!hasTrait('反转术式')||!hasTrait('术式反转'))return}else if(!hasTrait(t.match||''))return;techs.push(t)});
    var innateName=null;if(state.skills.indexOf('无下限术式')>=0)innateName='无下限术式';else if(state.skills.indexOf('御厨子')>=0)innateName='御厨子';else{for(var i=0;i<state.skills.length;i++){if(TECHNIQUE_LIBRARY.innate[state.skills[i]]){innateName=state.skills[i];break}}if(!innateName&&state.skills.some(function(s){return TECHNIQUE_LIBRARY.innate[s]}))innateName='_default'}
    if(innateName){var iTechs=TECHNIQUE_LIBRARY.innate[innateName];if(iTechs)iTechs.forEach(function(t){if(t.id==='murasaki'&&!c.comboFlags.ao&&!c.comboFlags.aka)return;if(t.id==='fuga'&&(!c.yourDomainActive||state.skills.indexOf('御厨子')<0))return;techs.push(t)})}
    if(isHeavenlyRestricted())TECHNIQUE_LIBRARY.hrOnly.forEach(function(t){techs.push(t)});
    var smul=v3StamCostMul(),cemul=v3CeCostMul(),wbonus=v3WinBonus()+v3TechWinBonus();
    techs=techs.filter(function(t){if(isHeavenlyRestricted()&&t.ce>0)return false;if(c.burnout&&t.tier&&t.tier.indexOf('atk_ce')>=0&&t.id!=='tech_basic')return false;if(c.burnout&&(t.tier==='ult_ce'||t.tier==='ult'))return false;var st=Math.max(1,Math.floor(t.st*smul)),ce=Math.floor(t.ce*cemul);if(st>c.stamina)return false;if(ce>0&&ce>c.ce)return false;return true});
    var stance=c.stance||'猛攻';techs=techs.map(function(t){var st=Math.max(1,Math.floor(t.st*smul)),ce=Math.floor(t.ce*cemul),win=t.win+wbonus;if(t.tier&&t.tier.indexOf('atk_ce')>=0)win+=v3TechWinBonus();if(c.yourDomainActive&&c.domainEffect==='增幅术式')win=Math.floor(win*2);var w=8;if(stance==='猛攻'){if(t.id==='murasaki'||t.id==='fuga')w=24;else if(t.id==='aka'||t.id==='heavy'||t.id==='tech_full')w=16}else if(stance==='流转'){if(t.tier==='heal'||t.id==='tech_basic')w=16;else if(t.id==='kai')w=20}else if(stance==='坚牢'){if(t.id==='simple_domain'||t.id==='barrier')w=24;else if(t.id==='rct_self')w=16}return{l:t.name,w:w,c:t.c||'#888',d:t.eff||'',_tech:{st:st,ce:ce,win:win,id:t.id,tier:t.tier}}})
    return techs
  }else{
    techs=techs.concat(TECHNIQUE_LIBRARY.universal);if(isHeavenlyRestricted())TECHNIQUE_LIBRARY.hrOnly.forEach(function(t){techs.push(t)});
    (enemy.techniques||[]).forEach(function(tn){var ub=enemy.uniqueTechniques&&enemy.uniqueTechniques[tn];techs.push({id:tn,name:tn,st:ub?ub.st:8,ce:ub?ub.ce:0,win:ub?ub.win:22,tier:'atk',c:'#d84',eff:ub?ub.eff:'',isEnemy:true})});
    return techs.map(function(t){var st=Math.max(1,Math.floor((t.st||8)*1)),ce=Math.floor((t.ce||0)*1),win=t.win||20;return{l:t.name,w:8,c:t.c||'#d84',d:t.eff||'',_tech:{st:st,ce:ce,win:win,id:t.id,tier:t.tier||'atk'}}}).filter(function(t){if(c.enemyBlocked&&t._tech.tier&&t._tech.tier.indexOf('atk_ce')>=0)return false;if(t._tech.st>c.enemyStamina)return false;if(t._tech.ce>c.enemyCe)return false;return true})
  }
}

// ========================================================= V3 PHASE STATE MACHINE =========================================================
function roundStamina(){
  var c=state.combat;if(!c||!c.active)return;c.phase='player_stamina';c.win=0;c.enemyWin=0;
  c.stamina=v3DrawStamina();c.enemyStamina=v3EnemyDrawStamina();c.dangerZone+=v3DangerGrowth();c.enemyDangerZone+=v3EnemyDangerGrowth();c.round++;
  c.bfCombo=0;c.bfZone=false;c.selfBlocked=false;c.barrierActive=false;c.comboFlags={ao:false,aka:false,kai:false,hachi:false};c.bindLoanUsed=false;
  if(c.domainRemaining>0){c.domainRemaining--;if(c.domainRemaining<=0){c.yourDomainActive=false;c.enemyDomainActive=false}}
  if(c.maxPenalty){c.maxPenalty=false}
  if(c.enemyId){var e=ENEMY_TEMPLATES[c.enemyId];if(e&&e.stanceAI){var ai=e.stanceAI,sw=ai.switches||[],ns=ai.default;for(var i=0;i<sw.length;i++){var s=sw[i],match=false;if(s.when==='hp<20%'&&c.enemyHp<e.hp*0.2)match=true;if(s.when==='winGap<-40'&&(c.win-c.enemyWin)>40)match=true;if(s.when==='enemyBurnout'&&c.burnout)match=true;if(match){ns=s.to;break}}c.enemyStance=ns}}
  updateCombatUI()
}

// ========================================================= V3 SPIN/STOP OVERRIDE =========================================================
var _origSpin=spin,_origStop=stop;

function showStancePanel(){document.getElementById('btnSpin').style.display='none';document.getElementById('btnNext').style.display='none';document.getElementById('stancePick').style.display='block'}
var _origSelectStance=selectStance;selectStance=function(s){state.combat.stance=s;state.combat.phase='player_tech';document.querySelectorAll('.sp-card').forEach(function(cx){cx.classList.toggle('sel',cx.dataset.stance===s)});document.getElementById('stancePick').style.display='none';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='⚔ 出招';refreshAll();saveState()}

function v3BuildPhaseWheel(){
  var c=state.combat,ph=c.phase,items=[];
  if(ph==='player_stamina'){var p=v3DrawStamina(),n=Math.min(7,Math.max(5,Math.floor(p/6)+3));var items=[];for(var i=0;i<n;i++){var v=p-Math.floor(n/2)+i;items.push({l:''+v,w:(i===Math.floor(n/2)?2:1),c:'#aaa'})}return items}
  else if(ph==='player_tech'||ph==='enemy_tech'){var items=v3BuildCombatItems(ph==='enemy_tech');if(!items||items.length===0){showToast(ph==='enemy_tech'?'敌人无可用技法':'无可用技法');return null}return items}
  else if(ph==='enemy_stamina'){var p=v3EnemyDrawStamina(),n=Math.min(7,Math.max(5,Math.floor(p/6)+3));var items=[];for(var i=0;i<n;i++){var v=p-Math.floor(n/2)+i;items.push({l:''+v,w:(i===Math.floor(n/2)?2:1),c:'#d84'})}return items}
  else   if(ph==='clash'){var pW=c.win,eW=c.enemyWin;var names=['完全压制','有效打击','互伤','招架吃力','被压制','致命互击'];var bias=(c.enemyDangerZone-c.dangerZone)/100;var wts=[Math.max(1,Math.floor(3+pW/30)*(1+bias)),Math.max(1,Math.floor(4+pW/20)*(1+bias*0.7)),6,Math.max(1,Math.floor(4+eW/20)*(1-bias*0.5)),Math.max(1,Math.floor(3+eW/30)*(1-bias*0.7)),(c.dangerZone>=50||c.enemyDangerZone>=50)?1:0];var items=[];for(var i=0;i<6;i++){if(wts[i]>0)items.push({l:names[i],w:wts[i],c:['#0f0','#4c8','#888','#c84','#f44','#f80'][i]})}return items}
  else if(ph==='domain_clash'){items=[{l:'你的领域占上风',w:5,c:'#0f0'},{l:'对方领域占上风',w:5,c:'#f44'},{l:'领域对消灭',w:3,c:'#80f'},{l:'精密度僵持',w:2,c:'#888'}]}
  else if(ph==='result'){var out=getResultOutcome();if(out.complete!==undefined)items=[{l:'完胜',w:out.complete,c:'#ff0'},{l:'苦战险胜',w:out.bitter,c:'#c94'},{l:'惨胜',w:out.heavy,c:'#c84'}];else items=[{l:'败退',w:out.retreat,c:'#c66'},{l:'惨败',w:out.heavy,c:'#c44'},{l:'殒命',w:out.death,c:'#600'},{l:'敌人放你一马',w:out.mercy,c:'#876'}]}
  if(items.length===0){showToast('无可用选项');return null}return items
}

function _startSpin(){var items=wheel.sectors,tw=items.reduce(function(s,se){return s+(se.w||1)},0),rv=Math.random()*tw,ti=0;for(var j=0;j<items.length;j++){rv-=items[j].w||1;if(rv<=0){ti=j;break}}var ca=0;for(var k=0;k<ti;k++)ca+=items[k].arc;state.targetAngle=wheel.angle+(6+Math.floor(Math.random()*4))*Math.PI*2-ca-items[ti].arc/2;state.startAngle=wheel.angle;state.startTime=performance.now();state.duration=4000+Math.random()*1500}
function _spinExisting(){state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';_startSpin()}

spin=function(){if(state.spinning||isRoundDone(rd()))return;var r=rd();if(!r||r.id!=='p4_action')return _origSpin();var c=state.combat;if(!c||!c.active)return;if(state._rctPhase||state._escapePhase){_spinExisting();return}var items=v3BuildPhaseWheel();if(!items)return;wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';_startSpin()}

stop=function(){
  var r=rd();if(!r){_origStop();return}
  if(r.type==='combat_prep'){_v3HandlePrepStop(r);return}
  if(r.id!=='p4_action'){_origStop();return}state.spinning=false;document.getElementById('btnSpin').disabled=false;document.getElementById('btnSpin').textContent='🌀 旋转';
  var norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;var cum=0,idx=0;for(var i=0;i<wheel.sectors.length;i++){cum+=wheel.sectors[i].arc;if(norm<cum){idx=i;break}}
  var item=wheel.sectors[idx],c=state.combat,ph=c.phase,val=parseInt(item.l);
  if(state._rctPhase){state._rctPhase=false;v3RCTResult(item.l);refreshAll();saveState();return}
  if(state._escapePhase){state._escapePhase=false;v3EscapeResult(item.l);refreshAll();saveState();return}
  if(ph==='player_stamina'&&!isNaN(val)){c.stamina=val;c.phase='player_stance';showStancePanel();refreshAll();saveState();return}
  if(ph==='enemy_stamina'&&!isNaN(val)){c.enemyStamina=val;c.phase='enemy_tech';showToast('敌体力:'+val);_v3AutoBuildEnemyTech();return}
  if(ph==='player_tech'){var tech=item._tech;if(!tech){showToast('无效技法');return}var bf=v3BfCheck(tech);c.stamina-=tech.st;if(tech.ce>0)c.ce-=tech.ce;c.win+=tech.win;if(bf){c.win=Math.floor(c.win*2.5)}if(c.bfZone){c.win+=10}if(tech.id==='ao')c.comboFlags.ao=true;if(tech.id==='aka')c.comboFlags.aka=true;if(tech.id==='rct_self')state.traits=state.traits.filter(function(t){return t.indexOf('bt_wnd_')!==0});if(tech.id==='domain_amp'){c.selfBlocked=true;c.enemyBlocked=true}if(tech.id==='barrier')c.barrierActive=true;var rp=document.getElementById('resultPanel');rp.style.display='block';rp.innerHTML='<div class="rp-cat">'+r.icon+' '+r.title+'</div><div class="rp-val" style="color:'+(item.c||'#888')+'">'+item.l+(bf?' ⚡黑闪!':'')+'</div><div class="rp-desc">-'+tech.st+'体 | +'+tech.win+'胜'+(bf?'×2.5':'')+' | 剩体力:'+c.stamina+'</div>';if(c.stamina<=0){c.phase='enemy_stamina';showToast('体力耗尽→敌人阶段');_v3AutoBuildEnemyStamina();refreshAll();saveState();return}refreshAll();saveState();return}
  if(ph==='enemy_tech'){var tech=item._tech;if(!tech){showToast('无效技法');return}c.enemyStamina-=tech.st;if(tech.ce>0)c.enemyCe-=tech.ce;c.enemyWin+=tech.win;showToast('敌:'+item.l+' (-'+tech.st+'体)');if(c.enemyStamina<=0){c.phase='clash';showToast('敌人招尽→对拼轮');refreshAll();saveState();return}_v3AutoBuildEnemyTech();refreshAll();saveState();return}
  if(ph==='clash'){v3ClashResult(idx);var ended=checkCombatEnd();if(ended){c.phase='result';refreshAll();saveState();return}c.phase='player_stamina';roundStamina();c.phase='player_stamina';refreshAll();saveState();return}
  if(ph==='domain_clash'){v3DomainClashResult(idx);refreshAll();saveState();return}
  if(ph==='result'){v3HandleResult(item.l);refreshAll();saveState();return}
}

function _v3AutoBuildEnemyStamina(){var c=state.combat,p=v3EnemyDrawStamina(),items=[];for(var i=0;i<6;i++){var v=p-3+i;items.push({l:''+v,w:Math.abs(3-i)+1,c:'#d84'})}wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🌀 敌人·体力轮';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none'}
function _v3HandlePrepStop(r){
  state.spinning=false;var norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;var cum=0,idx=0;
  for(var i=0;i<wheel.sectors.length;i++){cum+=wheel.sectors[i].arc;if(norm<cum){idx=i;break}}
  var ceVal=parseInt(wheel.sectors[idx].l)||v3DrawCe();state.combat.ce=ceVal;state.combat.shield=Math.floor(ceVal*0.5);state.combat.prepped=true;
  updateCombatUI();refreshAll();
  document.getElementById('wheelWrap').style.display='none';document.getElementById('btnSpin').style.display='none';
  document.getElementById('resultPanel').style.display='block';
  document.getElementById('resultPanel').innerHTML='<div class="rp-cat">'+r.icon+' '+r.title+'</div><div class="rp-val" style="color:#a0f">初始咒力: '+ceVal+'</div><div class="rp-desc">体力上限: '+state.combat.hp+'</div>';
  document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 进入战斗';saveState()
}
function _v3AutoBuildEnemyTech(){var items=v3BuildCombatItems(true);if(!items||items.length===0){state.combat.phase='clash';showToast('敌人无可出招→对拼');refreshAll();return}wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🌀 敌人出招';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none'}
function v3BfCheck(tech){var c=state.combat,rate=Math.min(35,v3BfRate()+c.bfCombo*v3BfRate()*0.5);if(Math.random()*100<rate){c.bfCombo=Math.min(3,c.bfCombo+1);c.stamina+=5;c.ce+=12;c.bfZone=true;return true}return false}
function checkCombatEnd(){var c=state.combat;if(c.clockBK>=6)return'victory';if(c.clockLB>=6)return'defeat';if(c.hp<=0)return'defeat';if(c.enemyHp<=0)return'victory';return null}
function getResultOutcome(){
  var c=state.combat;if(c.clockBK>=6||c.enemyHp<=0){var w={complete:25,bitter:50,heavy:25};if(c.shield>0){w.complete+=25;w.bitter-=10;w.heavy-=15}if(c.hp>v3StaminaMax()*0.9)w.complete+=20;if(c.hp>v3StaminaMax()*0.7)w.complete+=10;if(c.hp<v3StaminaMax()*0.25){w.complete-=25;w.heavy+=15}if(c.clockLB===0){w.complete+=20;w.bitter-=10}if(c.clockLB>=5){w.complete-=35;w.bitter+=18}if(c.round<=3){w.complete+=15;w.bitter-=8}if(c.round>12){w.complete-=15;w.bitter+=8}if(c.burnout){w.complete-=12;w.bitter+=5}w.complete=Math.max(5,w.complete);w.bitter=Math.max(5,w.bitter);w.heavy=Math.max(5,w.heavy);return w}
  var w={retreat:30,heavy:25,death:30,mercy:5};if(c.clockBK<=1){w.retreat-=15;w.death+=10}if(c.clockBK>=5){w.retreat+=30;w.death-=10}if(c.hp>v3StaminaMax()*0.5){w.retreat+=15;w.death-=10;w.mercy+=3}if(c.ce>v3CeMax()*0.5){w.retreat+=8;w.death-=5;w.mercy+=2}var charm=dimVal(state.dimensions['魅力']);if(charm>=4)w.mercy+=1;if(charm>=5)w.mercy+=2;if(charm>=6)w.mercy+=4;if(charm>=7)w.mercy+=6;if(charm>=8)w.mercy+=8;return w}
function v3ClashResult(idx){var c=state.combat,enemy=ENEMY_TEMPLATES[c.enemyId],mult=[1.3,1.1,1.0,0.9,0.7,2.0][idx],eMult=[0.7,0.9,1.0,1.1,1.3,2.0][idx];var pBase=Math.floor(c.win*0.8)+v3ClashBonus()+Math.floor(Math.random()*6);var eBase=Math.floor(c.enemyWin*0.8)+enemy.baseDmg+Math.floor(Math.random()*6);if(c.yourDomainActive)pBase=Math.floor(pBase*1.2);if(c.enemyDomainActive)eBase=Math.floor(eBase*1.2);if(isHeavenlyRestricted()&&c.enemyDomainActive)pBase=pBase;if(mult===2.0&&eMult===2.0){}if(c.stance==='猛攻'){pBase=Math.floor(pBase*1.3);eBase=Math.floor(eBase*1.3)}if(c.stance==='坚牢'){pBase=Math.floor(pBase*0.7);eBase=Math.floor(eBase*0.7)}if(c.barrierActive)eBase=Math.floor(eBase*0.8);if(c.burnout)pBase=Math.floor(pBase*0.7);if(c._escapeFail){eBase=Math.floor(eBase*1.3);c._escapeFail=false}var pDmg=Math.floor(pBase*mult),eDmg=Math.floor(eBase*eMult);if(c.shield>0){var abs=Math.min(c.shield,eDmg);c.shield-=abs;eDmg-=abs}c.hp=Math.max(0,c.hp-Math.max(0,eDmg));c.enemyHp=Math.max(0,c.enemyHp-Math.max(0,pDmg));c.clockBK=Math.min(6,c.clockBK+Math.floor(pDmg/(enemy.hp/6)));c.clockLB=Math.min(6,c.clockLB+Math.floor(eDmg/(v3StaminaMax()/6)*v3WillClockMul()));c.shield=Math.floor(c.ce*0.5);updateCombatUI();var rp=document.getElementById('resultPanel');rp.style.display='block';rp.innerHTML='<div class="rp-cat">⚔ 对拼结果</div><div class="rp-val">你:'+pDmg+'伤害 | 敌:'+eDmg+'伤害</div><div class="rp-desc">击破:'+c.clockBK+'/6 败势:'+c.clockLB+'/6</div>'}
function v3DomainClashResult(idx){var c=state.combat;if(idx===0){c.yourDomainActive=true;c.enemyDomainActive=false;c.burnout=true;showToast('领域占上风!')}else if(idx===1){c.enemyDomainActive=true;c.yourDomainActive=false;c.burnout=true;showToast('对方领域占优')}else if(idx===2){c.burnout=true;c.yourDomainActive=false;c.enemyDomainActive=false;showToast('领域对消灭!')}else{showToast('僵持，下回合再拼')}c.phase='player_tech';updateCombatUI()}
function v3RCTResult(label){var c=state.combat;if(label.indexOf('完美')>=0){c.burnout=false;c.domainUsed=false;showToast('完美修复!')}else if(label.indexOf('标准')>=0){c.burnout=false;c.domainUsed=false;c.ce=Math.max(0,c.ce-15);showToast('标准修复，CE-15')}else if(label.indexOf('代价')>=0){c.burnout=false;c.domainUsed=false;c.ce=Math.max(0,c.ce-25);showToast('代价修复')}else if(label.indexOf('失败')>=0){c.hp=Math.floor(c.hp*0.7);showToast('修复失败')}else if(label.indexOf('反噬')>=0){state.traits=state.traits.filter(function(t){return normalizeTag(t)!=='领域展开'});c.hp=Math.floor(c.hp*0.5);showToast('反噬!')}c.phase='player_tech';updateCombatUI()}
function v3EscapeResult(label){var c=state.combat;if(label.indexOf('成功')>=0){endCombat();showToast('成功脱出!');goNext()}else if(label.indexOf('险中')>=0){var cur=dimVal(state.dimensions['体质']);state.dimensions['体质']=dimLv(cur-1);endCombat();showToast('险脱，体质-1');goNext()}else{c._escapeFail=true;c.phase='player_tech';showToast('脱出失败!')}}
function v3HandleResult(label){var c=state.combat;if(label.indexOf('完胜')>=0){c.hp=v3StaminaMax();c.ce=v3CeMax()}else if(label.indexOf('苦战')>=0){c.hp=Math.floor(v3StaminaMax()*0.6)}else if(label.indexOf('惨胜')>=0){c.hp=Math.floor(v3StaminaMax()*0.3)}else if(label.indexOf('败退')>=0){c.hp=Math.floor(v3StaminaMax()*0.3)}else if(label.indexOf('惨败')>=0){c.hp=Math.floor(v3StaminaMax()*0.1)}else if(label.indexOf('殒命')>=0){c.hp=0}else{c.hp=Math.floor(v3StaminaMax()*0.2)}endCombat();var ri=activeRounds().findIndex(function(rx){return rx.id==='p4_rest'});if(ri>=0)goRound(ri)}

// ========================================================= V3 BUTTONS =========================================================
function updateBtnRow(){var b=document.getElementById('btnCombatRow'),c=state.combat;if(!b)return;if(!c||!c.active||c.phase!=='player_tech'){b.style.display='none';return}b.style.display='flex';document.getElementById('bcDomain').style.display=(c.burnout||c.domainUsed)?'none':'inline-block';document.getElementById('bcMax').style.display=c.burnout?'none':'inline-block';document.getElementById('bcRCT').style.display=(c.burnout&&hasTrait('反转术式'))?'inline-block':'none';document.getElementById('bcEscape').style.display=(c.stance==='流转')?'inline-block':'none';document.getElementById('bcBindLoan').style.display=c.bindLoanUsed?'none':'inline-block';document.getElementById('bcBindStack').style.display=c.bindLoanUsed?'inline-block':'none'}
function bDomain(){var c=state.combat;if(!c||c.burnout||c.domainUsed){showToast('无法展开领域');return}c.ce-=80;c.burnout=true;c.domainUsed=true;var enemy=ENEMY_TEMPLATES[c.enemyId];if(enemy&&enemy.hasDomain){c.phase='domain_clash';showToast('领域对拼!');document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🌀 旋转';refreshAll();saveState()}else{c.yourDomainActive=true;c.domainRemaining=v3CalcDomainDur(idxOrC(dimVal(state.dimensions['咒力总量'])));showToast('领域展开!');refreshAll();saveState();updateCombatUI()}}
function bMax(){var c=state.combat;if(!c||c.burnout){showToast('熔断中无法使用极之番');return}if(c.ce<80){showToast('咒力不足(需80)');return}c.ce-=80;c.win+=Math.floor(70*(1+v3TechWinBonus()/100));c.maxPenalty=true;showToast('极之番!');updateCombatUI()}
function bRCT(){var c=state.combat;if(!c||!c.burnout){showToast('不在熔断状态');return}var att=c.burnoutAttempts||0,idx=Math.min(att,3),base=RCT_BASE[idx],manip=idxOrC(dimVal(state.dimensions['咒力操纵'])),will=idxOrC(dimVal(state.dimensions['意志']));var ps=[0,0,0,0,0];for(var i=0;i<5;i++)ps[i]=Math.max(0,base[i]+WILL_RCT[i][manip]+WILL_RCT[i][will]);ps[4]=Math.max(3,ps[4]);var sum=ps[0]+ps[1]+ps[2]+ps[3]+ps[4];if(sum!==100){var rem=100;for(var j=0;j<4;j++){ps[j]=Math.round(ps[j]/sum*100);rem-=ps[j]}ps[4]=Math.max(0,rem)}var items=[];var names=['完美修复','标准修复','代价修复','修复失败','反噬'];for(var k=0;k<5;k++)items.push({l:names[k],w:ps[k],c:['#ff0','#8a4','#c84','#888','#f44'][k]});c.burnoutAttempts=att+1;wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('wheelWrap').style.display='block';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🔮 修复';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';state._rctPhase=true}
function bEscape(){var c=state.combat;if(c.stance!=='流转'){showToast('仅流转姿态可逃跑');return}var er=v3EscapeRate();var items=[{l:'成功脱出',w:Math.max(er,1),c:'#4c8'},{l:'险中脱出',w:25,c:'#888'},{l:'脱出失败',w:Math.max(100-er-25,1),c:'#c44'}];wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('wheelWrap').style.display='block';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🏃 逃跑';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';state._escapePhase=true}
function bBindLoan(){var c=state.combat;c.stamina=Math.max(0,c.stamina-5);c.win+=25;c.bindLoanUsed=true;if(c.stamina<=0){c.phase='enemy_stamina';showToast('体力耗尽→敌人阶段');_v3AutoBuildEnemyStamina();refreshAll();saveState();return}updateCombatUI();updateBtnRow()}
function bBindStack(){var c=state.combat;c.stamina=Math.max(0,c.stamina-9);c.dangerZone+=10;c.win+=50;if(c.stamina<=0){c.phase='enemy_stamina';showToast('体力耗尽→敌人阶段');_v3AutoBuildEnemyStamina();refreshAll();saveState();return}updateCombatUI();updateBtnRow()}

// ========================================================= V3 UI =========================================================
function updateCombatUI(){
  var ec=document.getElementById('enemyCard');if(!ec)return;if(!state.combat||!state.combat.active||!state.combat.enemyId){ec.style.display='none';var b=document.getElementById('combatBars');if(b)b.style.display='none';updateBtnRow();return}
  ec.style.display='block';var b=document.getElementById('combatBars');if(b)b.style.display='block';var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e)return;var c=state.combat;
  document.getElementById('ecTier').textContent=e.tier;document.getElementById('ecTier').style.background=e.tierColor;document.getElementById('ecTier').style.color='#1a1a1a';document.getElementById('ecName').textContent=e.name;document.getElementById('ecTitle').textContent=e.title;
  var hpPct=Math.max(0,Math.min(100,c.hp/Math.max(1,v3StaminaMax())*100));document.getElementById('cbHpBar').style.width=hpPct+'%';document.getElementById('cbHpVal').textContent=c.hp;
  var shPct=c.shield>0?Math.min(100,c.shield/Math.max(1,c.hp)*100):0;document.getElementById('cbShBar').style.width=shPct+'%';document.getElementById('cbShVal').textContent=Math.floor(c.shield);
  var ceMx=v3CeMax(),cePct=ceMx>0?Math.min(100,c.ce/Math.max(1,ceMx)*100):0;document.getElementById('cbCeBar').style.width=cePct+'%';document.getElementById('cbCeVal').textContent=c.ce;
  document.getElementById('cbStVal').textContent=c.stamina;document.getElementById('cbWinVal').textContent=c.win;document.getElementById('cbDangerVal').textContent=Math.floor(c.dangerZone)+'%';
  var ehPct=Math.max(0,Math.min(100,c.enemyHp/Math.max(1,e.hp)*100));document.getElementById('cbEhBar').style.width=ehPct+'%';document.getElementById('cbEhVal').textContent=c.enemyHp;
  if(c.burnout){document.getElementById('cbBurnout').style.display='block'}else{document.getElementById('cbBurnout').style.display='none'}updateBtnRow()
}

// ========================================================= V3 SECTOR LABELS =========================================================
(function patchBuildWheel(){if(typeof buildWheel!=='function')return;var _orig=buildWheel;buildWheel=function(items){var w=_orig(items),orig=w.draw;w.draw=function(){orig.call(this);var ctx=this.ctx,a=this.angle-Math.PI/2;for(var i=0;i<this.sectors.length;i++){var s=this.sectors[i],sa=a,ea=a+s.arc;if(!s._tech)continue;ctx.save();ctx.translate(this.cx,this.cy);ctx.rotate(sa+s.arc/2);ctx.textAlign='right';ctx.fillStyle='#999';var fs2=Math.max(7,this.radius*.06);ctx.font=fs2+'px sans-serif';ctx.fillText('-'+s._tech.st+'体 -'+s._tech.ce+'咒 +'+s._tech.win,this.radius-8,-fs2*.5);ctx.restore();a=ea}};return w}})();
