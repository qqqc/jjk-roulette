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
function v3TechWinBonus(){return _TB[idxOrC(dimVal(state.dimensions['术式性能']))]+v3PlayerToolTechBonus()}
function v3ClashBonus(){return _MJ[idxOrC(dimVal(state.dimensions['体术']))]+_TJ[idxOrC(dimVal(state.dimensions['术式性能']))]+v3PlayerToolClash()}
function v3DangerGrowth(){return _DZ[idxOrC(dimVal(state.dimensions['运势']))]}
function v3EnemyDangerGrowth(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 3;return _DZ[idxOrC(dimVal(e.dim['运势']))]}
function v3BfRate(){var r=3+_BF[idxOrC(dimVal(state.dimensions['天赋']))];var l=dimVal(state.dimensions['运势']);if(l>3)r+=Math.floor((l-3)*0.5);if(state.skills.indexOf('黑闪·68虎水平')>=0)r+=4;if(state.traits.indexOf('特殊受肉体')>=0)r+=2;r+=v3PlayerToolBfBoost();return Math.min(35,Math.max(0,r))}
function v3EnemyBfRate(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 0;var r=3+_BF[idxOrC(dimVal(e.dim['天赋']))];var l=dimVal(e.dim['运势']);if(l>3)r+=Math.floor((l-3)*0.5);return Math.min(35,Math.max(0,r))}
function v3CeDrawLower(){return _CE_DL[idxOrC(dimVal(state.dimensions['意志']))]}
function v3EscapeRate(){return Math.min(100,50+_ESC[idxOrC(dimVal(state.dimensions['体术']))])}
function v3WillClockMul(){return _WC[idxOrC(dimVal(state.dimensions['意志']))]}
function v3EnemyWinBonus(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 0;var pi=idxOrC(dimVal(e.dim['体术'])),ti=idxOrC(dimVal(e.dim['术式性能']));if(e.dim['咒力总量']==='E-')ti=3;(e.tools||[]).forEach(function(t){if(t.effect==='增幅自身')pi=Math.min(9,pi+1)});return _MJ[pi]+(e.dim['咒力总量']==='E-'?0:_TJ[ti])}
function v3EnemyPhysIdx(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 3;var idx=idxOrC(dimVal(e.dim['体术']));(e.tools||[]).forEach(function(t){if(t.effect==='增幅自身')idx=Math.min(9,idx+1)});return idx}
function v3EnemyToolClash(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.tools)return 0;var s=0;e.tools.forEach(function(t){if(t.bonus&&t.bonus.clash)s+=t.bonus.clash});return s}
function v3EnemyToolStCostPenalty(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.tools)return 0;var s=0;e.tools.forEach(function(t){if(t.bonus&&t.bonus.enemyStCost)s+=t.bonus.enemyStCost});return s}
function v3PlayerToolClash(){if(!state.combat||!state.combat.active)return 0;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3),s=0;tools.forEach(function(r){var l=r.label||'';if(l.indexOf('术式无效')>=0||l.indexOf('天逆鉾')>=0)s+=10;if(l.indexOf('增幅自身')>=0)s+=5;if(l.indexOf('追踪必中')>=0)s+=3;if(l.indexOf('隐密')>=0&&state.combat.round<=1)s+=5});return s}
function v3PlayerToolTechBonus(){if(!state.combat||!state.combat.active)return 0;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3),s=0;tools.forEach(function(r){var l=r.label||'';if(l.indexOf('元素附魔')>=0)s+=6});return s}
function v3PlayerToolStPen(){if(!state.combat||!state.combat.active)return 0;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3),s=0;tools.forEach(function(r){var l=r.label||'';if(l.indexOf('空间干涉')>=0)s+=2});return s}
function v3PlayerToolShieldMul(){if(!state.combat||!state.combat.active)return 1;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3);return tools.some(function(r){(r.label||'').indexOf('防护结界')>=0})?1.3:1}
function v3PlayerToolBfBoost(){if(!state.combat||!state.combat.active)return 0;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3);return tools.some(function(r){(r.label||'').indexOf('诅咒吸收')>=0})?2:0}
function v3PlayerToolCurseBonus(){if(!state.combat||!state.combat.active)return false;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3);return tools.some(function(r){var l=r.label||'';return l.indexOf('灵魂伤害')>=0||l.indexOf('释魂刀')>=0})}
function v3PlayerToolHeal(){if(!state.combat||!state.combat.active)return 0;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3);return tools.some(function(r){(r.label||'').indexOf('治愈')>=0})?8:0}
function v3EnemyBurnoutRecoveryRate(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 10;var wi=e.dim['意志']?dimVal(e.dim['意志']):3;var ci=e.dim['咒力操纵']?dimVal(e.dim['咒力操纵']):3;return 10+(wi-3)*2+(ci-3)}
function v3EnemyStamCostMul(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 1;var m=_SMUL[Math.max(0,Math.min(9,dimVal(e.dim['体术']||'C')))];if(e.dim['咒力总量']==='E-')m=Math.max(0.2,m-0.2);return m}
function v3CalcDomainDur(idx){return 2+Math.floor(idx/3)}
function v3DrawStamina(){var i=idxOrC(dimVal(state.dimensions['体质'])),pool=Math.max(8,Math.floor(6+_STAM[i]*0.04));if(state.traits.indexOf('双面四臂')>=0)pool+=8;if(state.combat&&state.combat.yourDomainActive&&state.combat.domainEffect==='增幅自身')pool=Math.floor(pool*1.5);return pool}
function v3EnemyDrawStamina(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e)return 8;var i=idxOrC(dimVal(e.dim['体质'])),pool=Math.max(8,Math.floor(6+_STAM[i]*0.04));if(state.combat&&state.combat.enemyDomainActive&&state.combat.enemyDomainEffect==='增幅自身')pool=Math.floor(pool*1.5);return pool}
function v3DrawCe(){var mx=v3CeMax(),lo=v3CeDrawLower(),min=Math.floor(mx*lo/100),range=mx-min,num=Math.min(8,Math.max(4,Math.ceil(range/30))),step=Math.floor(range/Math.max(1,num-1))||1,mid=Math.floor(num/2),r=Math.random()*(num+mid),idx=Math.floor(r);if(idx>=num)idx=Math.floor(num/2);return Math.min(mx,min+idx*step)}
function v3EnemyDrawCe(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 0;var v=e.dim['咒力总量'];if(v==='E-')return 0;var mx=v3EnemyCeMax(),willI=e.dim['意志']?dimVal(e.dim['意志']):3,lo=_CE_DL[Math.max(0,Math.min(9,willI))],min=Math.floor(mx*lo/100),range=mx-min,num=Math.min(8,Math.max(4,Math.ceil(range/30))),step=Math.floor(range/Math.max(1,num-1))||1,mid=Math.floor(num/2),r=Math.random()*(num+mid),idx=Math.floor(r);if(idx>=num)idx=Math.floor(num/2);return Math.min(mx,min+idx*step)}

function staminaMax(){return v3StaminaMax()}function ceMax(){return v3CeMax()}function stamCostMul(){var m=v3StamCostMul();if(state.combat&&state.combat.maxPenalty)m=Math.floor(m*1.5*10)/10;return m}function ceCostMul(){return v3CeCostMul()}function winBonus(){return v3WinBonus()}function techWinBonus(){return v3TechWinBonus()}function clashBonus(){return v3ClashBonus()}function dangerGrowth(){return v3DangerGrowth()}function enemyDangerGrowth(){return v3EnemyDangerGrowth()}function bfRate(){return v3BfRate()}function ceDrawRange(){return v3CeDrawLower()}function escapeRate(){return v3EscapeRate()}function drawStamina(){return v3DrawStamina()}

function normalizeTag(s){return s.replace(/\(.*?\)/g,'').trim()}function hasTrait(t){var n=normalizeTag(t);return state.traits.some(function(x){return normalizeTag(x)===n})||state.skills.some(function(x){return normalizeTag(x)===n})}function isHeavenlyRestricted(){return state.traits.some(function(t){return t.indexOf('天与咒缚')>=0})}

// ========================================================= V3 COMBAT CORE =========================================================
function initCombat(enemyId){var e=ENEMY_TEMPLATES[enemyId];if(!e)return;state.traits=state.traits.filter(function(t){return t.indexOf('bt_')!==0&&t.indexOf('enemy_')!==0});state.traits.push('enemy_'+enemyId);var ce=v3DrawCe();if(isHeavenlyRestricted())ce=0;var eMaxHp=e.dim&&e.dim['体质']?_STAM[Math.max(0,Math.min(9,dimVal(e.dim['体质'])))]:e.hp;var eSMul=e.shieldMul||0.5;state.combat={active:true,enemyId:enemyId,stance:null,stamina:0,ce:ce,win:0,shield:Math.floor(ce*0.5),hp:v3StaminaMax(),dangerZone:0,enemyStamina:0,enemyCe:0,enemyShield:0,enemyMaxHp:eMaxHp,enemyWin:0,enemyHp:eMaxHp,enemyDangerZone:0,clockBK:0,clockLB:0,burnout:false,enemyBurnout:false,selfBlocked:false,bfCombo:0,bfZone:false,enemyBfCombo:0,enemyBfZone:false,domainUsed:false,yourDomainActive:false,enemyDomainActive:false,domainRemaining:0,enemyDomainRemaining:0,enemyDomainEffect:null,enemyDomainType:null,burnoutAttempts:0,maxPenalty:false,maxUsed:false,enemyBlocked:false,barrierActive:false,activeTools:[],comboFlags:{ao:false,aka:false,kai:false,hachi:false},log:[],round:0,phase:null,bindLoanUsed:false};  if(isHeavenlyRestricted()){state.combat.ce=0;state.combat.shield=0}v3ToolCap();updateCombatUI()}
function endCombat(){var keep=['bt_victory','bt_defeat','bt_death','bt_escape','bt_wounded'];state.traits=state.traits.filter(function(t){return t.indexOf('bt_')!==0||keep.indexOf(t)>=0});state.combat={active:false,enemyId:null,stance:null,stamina:0,ce:0,win:0,shield:0,hp:0,enemyStamina:0,enemyCe:0,enemyShield:0,enemyMaxHp:0,enemyWin:0,enemyHp:0,clockBK:0,clockLB:0,dangerZone:0,burnout:false,enemyBurnout:false,bfCombo:0,enemyBfCombo:0,domainUsed:false,enemyDomainRemaining:0,enemyBlocked:false,round:0,phase:null};updateCombatUI()}

// ========================================================= V3 BUILD ITEMS =========================================================
function buildCombatItems(forEnemy){return v3BuildCombatItems(forEnemy)}
function v3BuildCombatItems(forEnemy){
  var enemy=ENEMY_TEMPLATES[state.combat.enemyId];if(!enemy)return[];var techs=[],c=state.combat;
  if(!forEnemy){
    techs=techs.concat(TECHNIQUE_LIBRARY.universal);
    TECHNIQUE_LIBRARY.advanced.forEach(function(t){if(t.id==='ct_rev'){if(!hasTrait('反转术式')||!hasTrait('术式反转'))return}else if(!hasTrait(t.match||''))return;techs.push(t)});
    var innateName=null;if(state.skills.indexOf('无下限术式')>=0)innateName='无下限术式';else if(state.skills.indexOf('御厨子')>=0)innateName='御厨子';else{for(var i=0;i<state.skills.length;i++){if(TECHNIQUE_LIBRARY.innate[state.skills[i]]){innateName=state.skills[i];break}}if(!innateName&&state.skills.some(function(s){return TECHNIQUE_LIBRARY.innate[s]}))innateName='_default'}
    if(innateName){var iTechs=TECHNIQUE_LIBRARY.innate[innateName];if(iTechs)iTechs.forEach(function(t){if(t.id==='murasaki'&&(!c.comboFlags.ao||!c.comboFlags.aka))return;if(t.id==='fuga'&&(!c.yourDomainActive||state.skills.indexOf('御厨子')<0))return;techs.push(t)})}
    if(isHeavenlyRestricted())TECHNIQUE_LIBRARY.hrOnly.forEach(function(t){techs.push(t)});
    // 领域效果: 强控(敌防御隐藏)
    if(c.yourDomainActive&&c.domainEffect==='强控'){techs=techs.filter(function(t){return t.id!=='simple_domain'&&t.id!=='barrier'})}
    if(c.enemyDomainActive&&c.enemyDomainEffect==='强控'){techs=techs.filter(function(t){return t.id!=='simple_domain'&&t.id!=='barrier'})}
    // 领域类型: 半成品胜率-30%
    if(c.yourDomainActive&&c.domainType==='半成品'){techs=techs.map(function(t){var nt=Object.assign({},t);nt.win=Math.floor(nt.win*0.7);return nt})}
    var smul=v3StamCostMul(),cemul=v3CeCostMul(),wbonus=v3WinBonus()+v3TechWinBonus(),stPen=v3EnemyToolStCostPenalty();
    techs=techs.filter(function(t){if(isHeavenlyRestricted()&&t.ce>0)return false;if(c.burnout&&t.tier&&t.tier.indexOf('atk_ce')>=0&&t.id!=='tech_basic')return false;if(c.burnout&&(t.tier==='ult_ce'||t.tier==='ult'))return false;var st=Math.max(1,Math.floor(t.st*smul)+stPen),ce=Math.floor(t.ce*cemul);if(st>c.stamina)return false;if(ce>0&&ce>c.ce)return false;return true});
    var stance=c.stance||'猛攻';techs=techs.map(function(t){var st=Math.max(1,Math.floor(t.st*smul)+stPen),ce=Math.floor(t.ce*cemul),win=t.win+wbonus;if(t.tier&&t.tier.indexOf('atk_ce')>=0)win+=v3TechWinBonus();if(c.yourDomainActive&&c.domainEffect==='增幅术式')win=Math.floor(win*2);var w=8;if(stance==='猛攻'){if(t.id==='murasaki'||t.id==='fuga')w=24;else if(t.id==='aka'||t.id==='heavy'||t.id==='tech_full')w=16}else if(stance==='流转'){if(t.tier==='heal'||t.id==='tech_basic')w=16;else if(t.id==='kai')w=20}else if(stance==='坚牢'){if(t.id==='simple_domain'||t.id==='barrier')w=24;else if(t.id==='rct_self')w=16;else if(t.id==='heavy'||t.id==='ce_punch')w=Math.floor(w*0.5)}return{l:t.name,w:w,c:t.c||'#888',d:t.eff||'',_tech:{st:st,ce:ce,win:win,id:t.id,tier:t.tier,noBf:t.noBf||false}}})
    return techs
  }else{
    techs=techs.concat(TECHNIQUE_LIBRARY.universal);if(isHeavenlyRestricted())TECHNIQUE_LIBRARY.hrOnly.forEach(function(t){techs.push(t)});
    (enemy.techniques||[]).forEach(function(tn){var ub=enemy.uniqueTechniques&&enemy.uniqueTechniques[tn];techs.push({id:tn,name:tn,st:ub?ub.st:8,ce:ub?ub.ce:0,win:ub?ub.win:22,tier:'atk',c:'#d84',eff:ub?ub.eff:'',isEnemy:true})});
    // 敌人领域作为普通扇区
    if(enemy.hasDomain&&!state.combat.burnout&&!c.enemyBurnout){techs.push({l:'🌐'+enemy.title,st:5,ce:80,win:100,tier:'ult',c:'#80f',isEnemy:true})}
    var eSmul=v3EnemyStamCostMul(),estance=c.enemyStance||'猛攻';return techs.map(function(t){var st=Math.max(1,Math.floor((t.st||8)*eSmul)),ce=Math.floor((t.ce||0)*1);var win=(t.win||20)+v3EnemyWinBonus();if(c.enemyDomainActive&&c.enemyDomainEffect==='增幅术式')win=Math.floor(win*2);var w=t.w||8;if(estance==='猛攻'){if(t.tier==='ult_ce'||t.tier==='ult')w=Math.floor(w*3);else if(t.id==='heavy'||t.id==='tech_full')w=Math.floor(w*2)}else if(estance==='流转'){if(t.tier==='heal'||t.id==='tech_basic')w=Math.floor(w*2)}else if(estance==='坚牢'){if(t.tier==='def')w=Math.floor(w*3);else if(t.tier==='heal')w=Math.floor(w*2);else if(t.id==='heavy'||t.id==='ce_punch')w=Math.floor(w*0.5)}return{l:t.name,w:w,c:t.c||'#d84',d:t.eff||'',_tech:{st:st,ce:ce,win:win,id:t.id,tier:t.tier||'atk',noBf:t.noBf||false}}}).filter(function(t){if(c.enemyCe===0&&t._tech.ce>0)return false;if(c.enemyBurnout&&t._tech.tier&&(t._tech.tier.indexOf('atk_ce')>=0||t._tech.tier==='ult_ce'||t._tech.tier==='ult'))return false;if(c.enemyBlocked&&t._tech.tier&&t._tech.tier.indexOf('atk_ce')>=0)return false;if(t._tech.st>c.enemyStamina)return false;if(t._tech.ce>c.enemyCe)return false;return true})
  }
}

// ========================================================= V3 PHASE STATE MACHINE =========================================================
function roundStamina(){
  var c=state.combat;if(!c||!c.active)return;c.phase='player_stamina';c.win=0;c.enemyWin=0;
  c.stamina=v3DrawStamina();c.enemyStamina=v3EnemyDrawStamina();c.dangerZone+=v3DangerGrowth();c.enemyDangerZone+=v3EnemyDangerGrowth();c.round++;
  c.bfCombo=0;c.bfZone=false;c.enemyBfCombo=0;c.enemyBfZone=false;c.selfBlocked=false;c.enemyBlocked=false;c.barrierActive=false;c.comboFlags={ao:false,aka:false,kai:false,hachi:false};c.bindLoanUsed=false;c.maxUsed=false;
  if(c.domainRemaining>0){c.domainRemaining--;if(c.domainRemaining<=0){c.yourDomainActive=false;c.burnout=true}}
  if(c.enemyDomainRemaining>0){c.enemyDomainRemaining--;if(c.enemyDomainRemaining<=0){c.enemyDomainActive=false;c.enemyBurnout=true;showToast('敌领域消退·熔断!')}}
  if(c.enemyBurnout){var e=ENEMY_TEMPLATES[c.enemyId];if(e&&e.dim){var wi=e.dim['意志']?dimVal(e.dim['意志']):3,ci=e.dim['咒力操纵']?dimVal(e.dim['咒力操纵']):3;var rRate=10+(wi-3)*2+(ci-3);if(Math.random()*100<rRate){c.enemyBurnout=false;c.enemyCe=Math.max(0,c.enemyCe-Math.floor(v3EnemyCeMax()*0.3));c.enemyShield=Math.floor(c.enemyCe*(e.shieldMul||0.5));showToast('敌熔断修复!')}}}
  var heal=v3PlayerToolHeal();if(heal>0)c.hp=Math.min(v3StaminaMax(),c.hp+heal);
  if(c.maxPenalty){c.maxPenalty=false}
  if(c.enemyId){var e=ENEMY_TEMPLATES[c.enemyId];if(e&&e.stanceAI){var ai=e.stanceAI,sw=ai.switches||[],ns=ai.default;for(var i=0;i<sw.length;i++){var s=sw[i],match=false;if(s.when==='hp<20%'&&c.enemyHp<e.hp*0.2)match=true;if(s.when==='winGap<-40'&&(c.win-c.enemyWin)>40)match=true;if(s.when==='enemyBurnout'&&c.burnout)match=true;if(match){ns=s.to;break}}c.enemyStance=ns}}
  updateCombatUI()
}

// ========================================================= V3 ROUND-BASED DISPATCH =========================================================
var _origSpin=spin,_origStop=stop,_origGoNext=goNext,_origSelectStance=selectStance;
selectStance=function(s){state.combat.stance=s;state.combat.phase='player_tech';document.querySelectorAll('.sp-card').forEach(function(cx){cx.classList.toggle('sel',cx.dataset.stance===s)});document.getElementById('stancePick').style.display='none';var already=state.results.filter(function(rr){return rr.roundId==='p4_stance'});if(already.length===0)state.results.push({roundId:'p4_stance',rname:'⚖ 姿态',prop:'',label:s,desc:'',c:'#c9a84c',_item:{tags:[],dim:{},dimMod:{}}});var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_ptech'});if(nxt>=0)goRound(nxt);else refreshAll();saveState()}

// 构建函数
function v3BuildStaminaWheel(){var p=v3DrawStamina(),n=Math.min(7,Math.max(5,Math.floor(p/6)+3)),items=[];for(var i=0;i<n;i++){var v=p-Math.floor(n/2)+i;items.push({l:''+v,w:(i===Math.floor(n/2)?2:1),c:'#aaa'})}return items}
function v3BuildCeSectors(){var mx=v3CeMax(),lo=v3CeDrawLower(),min=Math.floor(mx*lo/100),step=Math.max(1,Math.floor((mx-min)/5)),items=[];for(var i=0;i<6;i++){var v=Math.min(mx,min+i*step);items.push({l:''+v,w:Math.abs(3-i)+1,c:'#a0f'})}return items}
function v3BuildEnemyCeWheel(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return[];var mx=v3EnemyCeMax(),willI=e.dim['意志']?dimVal(e.dim['意志']):3,lo=_CE_DL[Math.max(0,Math.min(9,willI))],min=Math.floor(mx*lo/100),step=Math.max(1,Math.floor((mx-min)/5)),items=[];for(var i=0;i<6;i++){var v=Math.min(mx,min+i*step);items.push({l:''+v,w:Math.abs(3-i)+1,c:'#a0f'})}return items}
function v3EnemyCeMax(){var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e||!e.dim)return 100;var v=e.dim['咒力总量'];if(v==='E-')return 0;return _CE[Math.max(0,Math.min(9,dimVal(v)))]}
function v3BuildEstaminaSectors(){var p=v3EnemyDrawStamina(),n=Math.min(7,Math.max(5,Math.floor(p/6)+3)),items=[];for(var i=0;i<n;i++){var v=p-Math.floor(n/2)+i;items.push({l:''+v,w:(i===Math.floor(n/2)?2:1),c:'#d84'})}return items}
function v3BuildClashSectors(){var c=state.combat,pW=c.win,eW=c.enemyWin;c.win=Math.min(200,c.win);c.enemyWin=Math.min(200,c.enemyWin);var bias=(c.enemyDangerZone-c.dangerZone)/100,names=['完全压制','有效打击','互伤','招架吃力','被压制','致命互击'];var wts=[Math.max(1,Math.floor(3+pW/30)*(1+bias)),Math.max(1,Math.floor(4+pW/20)*(1+bias*0.7)),6,Math.max(1,Math.floor(4+eW/20)*(1-bias*0.5)),Math.max(1,Math.floor(3+eW/30)*(1-bias*0.7)),(c.dangerZone>=50||c.enemyDangerZone>=50)?1:0];var items=[];for(var i=0;i<6;i++){if(wts[i]>0)items.push({l:names[i],w:wts[i],c:['#0f0','#4c8','#888','#c84','#f44','#f80'][i]})}return items}
function v3BuildResultSectors(){var out=getResultOutcome();if(out.complete!==undefined)return [{l:'完胜',w:out.complete,c:'#ff0'},{l:'苦战险胜',w:out.bitter,c:'#c94'},{l:'惨胜',w:out.heavy,c:'#c84'}];return [{l:'败退',w:out.retreat,c:'#c66'},{l:'惨败',w:out.heavy,c:'#c44'},{l:'殒命',w:out.death,c:'#600'},{l:'敌人放你一马',w:out.mercy,c:'#876'}]}

function v3BuildRoundWheel(rid){
  var c=state.combat;if(!c||!c.active)return null;
  if(rid==='p4_stamina')return v3BuildStaminaWheel();
  if(rid==='p4_eprep')return v3BuildEnemyCeWheel();
  if(rid==='p4_ptech')return v3BuildCombatItems(false);
  if(rid==='p4_estamina')return v3BuildEstaminaSectors();
  if(rid==='p4_etech')return v3BuildCombatItems(true);
  if(rid==='p4_clash')return v3BuildClashSectors();
  if(rid==='p4_result')return v3BuildResultSectors();
  return null
}

function _startSpin(){if(!wheel)return;var items=wheel.sectors,tw=items.reduce(function(s,se){return s+(se.w||1)},0),rv=Math.random()*tw,ti=0;for(var j=0;j<items.length;j++){rv-=items[j].w||1;if(rv<=0){ti=j;break}}var ca=0;for(var k=0;k<ti;k++)ca+=items[k].arc;state.targetAngle=wheel.angle+(6+Math.floor(Math.random()*4))*Math.PI*2-ca-items[ti].arc/2;state.startAngle=wheel.angle;state.startTime=performance.now();state.duration=4000+Math.random()*1500}

spin=function(){if(state.spinning)return;var r=rd();if(!r)return _origSpin();var rt=r.type||'';
if(rt==='combat_ce'||rt==='combat_stamina'||rt==='combat_repeatable'||rt==='combat_result'){
  if(state._rctPhase||state._escapePhase){state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';_startSpin();return}
  if(rt==='combat_repeatable'){var items=v3BuildRoundWheel(r.id);if(!items||items.length===0){showToast('无可用技法');return}wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();}
  if(rt!=='combat_repeatable'){var items=v3BuildRoundWheel(r.id);if(!items){state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';_startSpin();return}wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();}
  state.spinning=true;document.getElementById('btnSpin').disabled=true;document.getElementById('btnSpin').textContent='⏳ 旋转中…';document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';_startSpin();return}
return _origSpin()}

goNext=function(){var c=state.combat;var r=rd();if(r&&r.type==='combat_repeatable'&&c&&c.active){var rid=r.id;
  if(rid==='p4_ptech'){c.phase='player_tech';var items=v3BuildCombatItems(false);if(!items||items.length===0){showToast('无可用技法→敌阶段');c.phase='enemy_stamina';var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_estamina'});if(nxt>=0)goRound(nxt);return}wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='⚔ 出招';document.getElementById('btnNext').style.display='none';return}
  if(rid==='p4_etech'){c.phase='enemy_tech';var items=v3BuildCombatItems(true);if(!items||items.length===0){c.phase='clash';var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_clash'});if(nxt>=0)goRound(nxt);return}wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🌀 敌出招';document.getElementById('btnNext').style.display='none';return}
  if(rid==='p4_clash'){c.phase='result';var already=state.results.filter(function(rr){return rr.roundId===rid});if(already.length===0)state.results.push({roundId:rid,rname:'⚡ 对拼',prop:'',label:'结算完成',desc:'',c:'#ff0',_item:{tags:[],dim:{},dimMod:{}}});var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_result'});if(nxt>=0)goRound(nxt);return}
  return}
_origGoNext()}

stop=function(){
  var r=rd();if(!r)return _origStop();var rt=r.type||'',rid=r.id||'';
  if(rt==='combat_ce'){if(rid==='p4_eprep'){_v3HandleEnemyPrepStop(r)}else{_v3HandlePrepStop(r)}return}
  if(state._rctPhase){state._rctPhase=false;v3RCTResult(wheel.sectors[0].l);refreshAll();saveState();return}
  if(state._escapePhase){state._escapePhase=false;v3EscapeResult(wheel.sectors[0].l);refreshAll();saveState();return}
  if(rt!=='combat_stamina'&&rt!=='combat_stance'&&rt!=='combat_repeatable'&&rt!=='combat_result')return _origStop();
  state.spinning=false;document.getElementById('btnSpin').disabled=false;document.getElementById('btnSpin').textContent='🌀 旋转';
  var norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;var cum=0,idx=0;for(var i=0;i<wheel.sectors.length;i++){cum+=wheel.sectors[i].arc;if(norm<cum){idx=i;break}}
  var item=wheel.sectors[idx],c=state.combat,val=parseInt(item.l);
  if(rt==='combat_stamina'&&!isNaN(val)){c.stamina=val;c.phase='player_tech';refreshAll();saveState();showToast('体力:'+val);var already=state.results.filter(function(rr){return rr.roundId===rid});if(already.length===0)state.results.push({roundId:rid,rname:'💪 体力抽取',prop:'',label:'体力:'+val,desc:'',c:'#aaa',_item:{tags:[],dim:{},dimMod:{}}});var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_stance'});if(nxt>=0)goRound(nxt);return}
  if(rt==='combat_repeatable'){
    if(rid==='p4_ptech'){var tech=item._tech;if(!tech){showToast('无效技法');return}
      c.stamina=Math.max(0,c.stamina-tech.st);if(tech.ce>0){c.ce=Math.max(0,c.ce-tech.ce);c.shield=Math.floor(c.ce*0.5*v3PlayerToolShieldMul())}c.win+=tech.win;if(c.bfZone){c.win+=10}
      var isBF=false;var isAtk=tech.tier&&tech.tier.indexOf('atk')>=0&&!tech.noBf;if(isAtk&&Math.random()*100<v3BfRate()&&c.bfCombo<3){isBF=true;c.bfCombo=Math.min(3,c.bfCombo+1);c.stamina+=5;c.ce+=12;var bfWin=Math.floor(v3BfRate()*2.5);c.win+=Math.max(1,bfWin);c.log.push('[T'+c.round+'] ⚡黑闪!')}
      if(tech.id==='ao')c.comboFlags.ao=true;if(tech.id==='aka')c.comboFlags.aka=true;
      if(tech.id==='rct_self')state.traits=state.traits.filter(function(t){return t.indexOf('bt_wnd_')!==0});if(tech.id==='domain_amp'){c.selfBlocked=true;c.enemyBlocked=true}if(tech.id==='barrier')c.barrierActive=true;
      var rp=document.getElementById('resultPanel');rp.style.display='block';rp.style.borderLeft='';rp.style.background='';rp.className='result-panel';if(tech.tier==='ult'||tech.tier==='ult_ce')rp.classList.add('bfx-ult');else if(tech.tier&&tech.tier.indexOf('atk_ce')>=0)rp.classList.add('bfx-atk-ce');var bfExtra=isBF?' ⚡黑闪! ':'';
      rp.innerHTML='<div class="rp-cat">⚔ 出招'+bfExtra+'</div><div class="rp-val" style="color:'+(isBF?'#ff0':(item.c||'#888'))+'">'+item.l+'</div><div class="rp-desc">-'+tech.st+'体 -'+tech.ce+'咒 +'+tech.win+'胜 | 剩体力:'+c.stamina+'</div>';
      c.log.push('[T'+c.round+'] '+item.l+': -'+tech.st+'体 +'+tech.win+'胜');
      if(isBF){var ring=document.querySelector('.cv-vs-ring');if(ring){ring.classList.add('bf-flash');setTimeout(function(){ring.classList.remove('bf-flash')},500)}showToast('⚡黑闪!')}
      var avail=v3BuildCombatItems(false);if(c.stamina<=0||!avail||avail.length===0){c.phase='enemy_stamina';var doneAlready=state.results.filter(function(rr){return rr.roundId==='p4_ptech'});if(doneAlready.length===0)state.results.push({roundId:'p4_ptech',rname:'⚔ 出招',prop:'',label:'完毕',desc:'',c:'#888',_item:{tags:[],dim:{},dimMod:{}}});showToast('体力耗尽→敌阶段');var eNxt=activeRounds().findIndex(function(rx){return rx.id==='p4_estamina'});if(eNxt>=0)goRound(eNxt);else updateCombatUI();saveState();return}
      document.getElementById('btnSpin').style.display='none';document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 下一招';updateCombatUI();saveState();return}
    if(rid==='p4_estamina'&&!isNaN(val)){c.enemyStamina=val;c.phase='enemy_tech';showToast('敌体力:'+val);var already=state.results.filter(function(rr){return rr.roundId===rid});if(already.length===0)state.results.push({roundId:rid,rname:'👤 敌体力抽取',prop:'',label:'敌体力:'+val,desc:'',c:'#d84',_item:{tags:[],dim:{},dimMod:{}}});refreshAll();saveState();var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_etech'});if(nxt>=0)goRound(nxt);return}
    if(rid==='p4_etech'){var tech=item._tech;if(!tech){showToast('无效技法');return}var isEDomain=tech.tier==='ult'&&item.l&&item.l.indexOf('🌐')>=0;if(isEDomain){var enemy=ENEMY_TEMPLATES[c.enemyId];if(!enemy||!enemy.hasDomain){showToast('敌人无领域');return}c.enemyStamina=Math.max(0,c.enemyStamina-tech.st);c.enemyCe-=tech.ce;c.enemyShield=Math.floor(c.enemyCe*0.5);c.log.push('[T'+c.round+'] 🌐 '+item.l);if(c.yourDomainActive){c.phase='domain_clash';showToast('🌐领域对拼!');refreshAll();saveState();return}if(hasTrait('简易领域')||hasTrait('弥虚葛笼')){c.enemyDomainActive=true;c.enemyDomainRemaining=v3CalcDomainDur(idxOrC(dimVal(enemy.dim['咒力总量'])));c.enemyDomainEffect=enemy.domain?enemy.domain.effect:null;c.enemyDomainType=enemy.domain?enemy.domain.type:'封闭式';showToast('敌领域展开! 简易领域抵消必中');refreshAll();saveState();return}c.enemyDomainActive=true;c.enemyDomainRemaining=v3CalcDomainDur(idxOrC(dimVal(enemy.dim['咒力总量'])));c.enemyDomainEffect=enemy.domain?enemy.domain.effect:null;c.enemyDomainType=enemy.domain?enemy.domain.type:'封闭式';showToast('敌领域展开!');refreshAll();saveState();return}c.enemyStamina=Math.max(0,c.enemyStamina-tech.st);if(tech.ce>0){c.enemyCe-=tech.ce;c.enemyShield=Math.floor(c.enemyCe*0.5)}c.enemyWin+=tech.win;if(c.enemyBfZone){c.enemyWin+=10}c.log.push('[T'+c.round+'] 👤 '+item.l+': -'+tech.st+'体 +'+tech.win+'胜');var eBF=false;var eIsAtk=tech.tier&&tech.tier.indexOf('atk')>=0&&!tech.noBf;if(eIsAtk&&Math.random()*100<v3EnemyBfRate()&&c.enemyBfCombo<3){eBF=true;c.enemyBfCombo=Math.min(3,c.enemyBfCombo+1);c.enemyStamina+=5;c.enemyCe+=12;var eBfWin=Math.floor(v3EnemyBfRate()*2.5);c.enemyWin+=Math.max(1,eBfWin);c.enemyBfZone=true;c.log.push('[T'+c.round+'] 👤⚡黑闪!');showToast('👤⚡黑闪!')}var erp=document.getElementById('resultPanel');erp.style.display='block';erp.className='result-panel enemy-result';erp.innerHTML='<div class="rp-cat">🗡 敌出招'+(eBF?' 👤⚡黑闪!':'')+'</div><div class="rp-val" style="color:#d84">'+item.l+'</div><div class="rp-desc">-'+tech.st+'体 | 剩体力:'+c.enemyStamina+'</div>';var eAvail=v3BuildCombatItems(true);if(c.enemyStamina<=0||!eAvail||eAvail.length===0){c.phase='clash';var doneAlready=state.results.filter(function(rr){return rr.roundId==='p4_etech'});if(doneAlready.length===0)state.results.push({roundId:'p4_etech',rname:'🗡 敌出招',prop:'',label:'完毕',desc:'',c:'#d84',_item:{tags:[],dim:{},dimMod:{}}});showToast('敌体力耗尽→对拼');var eNxt=activeRounds().findIndex(function(rx){return rx.id==='p4_clash'});if(eNxt>=0)goRound(eNxt);else updateCombatUI();saveState();return}document.getElementById('btnSpin').style.display='none';document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 下一招';updateCombatUI();saveState();return}
    if(rid==='p4_clash'){v3ClashResult(idx);var ended=checkCombatEnd();if(ended){document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 胜负';updateCombatUI();saveState();return}// 清理round results→回到p4_stamina
      state.results=state.results.filter(function(rr){return['p4_stamina','p4_stance','p4_ptech','p4_estamina','p4_etech','p4_clash'].indexOf(rr.roundId)<0});
      roundStamina();var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_stamina'});if(nxt>=0)goRound(nxt);refreshAll();saveState();return}
    return}
  if(rt==='combat_result'){v3HandleResult(item.l);refreshAll();saveState();return}
  if(rid==='p4_rest'){var c=state.combat;if(item.l.indexOf('充分')>=0){c.hp=v3StaminaMax();c.ce=v3CeMax()}else if(item.l.indexOf('短暂')>=0){c.hp=Math.floor(v3StaminaMax()*0.6);c.ce=Math.floor(v3CeMax()*0.5)}else if(item.l.indexOf('勉强')>=0){c.hp=Math.floor(v3StaminaMax()*0.3)}updateCombatUI()}
  _origStop()
}
function _v3HandlePrepStop(r){
  state.spinning=false;var norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;var cum=0,idx=0;
  for(var i=0;i<wheel.sectors.length;i++){cum+=wheel.sectors[i].arc;if(norm<cum){idx=i;break}}
  var ceVal=parseInt(wheel.sectors[idx].l)||v3DrawCe();state.combat.ce=ceVal;state.combat.shield=Math.floor(ceVal*0.5);state.combat.prepped=true;
  updateCombatUI();refreshAll();
  document.getElementById('wheelWrap').style.display='none';document.getElementById('btnSpin').style.display='none';
  document.getElementById('resultPanel').style.display='block';
  document.getElementById('resultPanel').innerHTML='<div class="rp-cat">'+r.icon+' '+r.title+'</div><div class="rp-val" style="color:#a0f">初始咒力: '+ceVal+'</div><div class="rp-desc">体力上限: '+state.combat.hp+'</div>';
  document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 进入战斗';saveState();
  // 标记p4_prep完成以便goNext跳跃
  var already=state.results.filter(function(rr){return rr.roundId===r.id});if(already.length===0)state.results.push({roundId:r.id,rname:r.icon+' '+r.title,prop:'',label:'咒力:'+ceVal,desc:'',c:'#a0f',_item:{tags:[],dim:{},dimMod:{}}});
}
function _v3HandleEnemyPrepStop(r){
  state.spinning=false;var norm=(-wheel.angle)%(Math.PI*2);if(norm<0)norm+=Math.PI*2;var cum=0,idx=0;
  for(var i=0;i<wheel.sectors.length;i++){cum+=wheel.sectors[i].arc;if(norm<cum){idx=i;break}}
  var ceVal=parseInt(wheel.sectors[idx].l)||0;var enemy=ENEMY_TEMPLATES[state.combat.enemyId];state.combat.enemyCe=ceVal;state.combat.enemyShield=Math.floor(ceVal*(enemy?enemy.shieldMul||0.5:0.5));
  updateCombatUI();
  var rp=document.getElementById('resultPanel');rp.style.display='block';rp.className='result-panel enemy-result';
  rp.innerHTML='<div class="rp-cat">'+r.icon+' '+r.title+'</div><div class="rp-val" style="color:#a0f">敌初始咒力: '+ceVal+'</div><div class="rp-desc">护盾: '+Math.floor(ceVal*0.5)+'</div>';
  document.getElementById('btnNext').style.display='block';document.getElementById('btnNext').textContent='→ 继续';saveState();
  var already=state.results.filter(function(rr){return rr.roundId===r.id});if(already.length===0)state.results.push({roundId:r.id,rname:r.icon+' '+r.title,prop:'',label:'敌咒力:'+ceVal,desc:'',c:'#d84',_item:{tags:[],dim:{},dimMod:{}}});
}
function _v3AutoBuildEnemyTech(){var items=v3BuildCombatItems(true);if(!items||items.length===0){state.combat.phase='clash';showToast('敌人无可出招→对拼');refreshAll();return}wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🌀 敌人出招';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';updateCombatUI()}
function v3BfCheck(tech){return false} // 黑闪改为扇区, 此函数废弃
function checkCombatEnd(){var c=state.combat;if(c.clockBK>=6)return'victory';if(c.clockLB>=6)return'defeat';if(c.hp<=0)return'defeat';if(c.enemyHp<=0)return'victory';return null}
function getResultOutcome(){
  var c=state.combat;if(c.clockBK>=6||c.enemyHp<=0){var w={complete:25,bitter:50,heavy:25};if(c.shield>0){w.complete+=25;w.bitter-=10;w.heavy-=15}if(c.hp>v3StaminaMax()*0.9)w.complete+=20;if(c.hp>v3StaminaMax()*0.7)w.complete+=10;if(c.hp<v3StaminaMax()*0.25){w.complete-=25;w.heavy+=15}if(c.clockLB===0){w.complete+=20;w.bitter-=10}if(c.clockLB>=5){w.complete-=35;w.bitter+=18}if(c.round<=3){w.complete+=15;w.bitter-=8}if(c.round>12){w.complete-=15;w.bitter+=8}if(c.burnout){w.complete-=12;w.bitter+=5}w.complete=Math.max(5,w.complete);w.bitter=Math.max(5,w.bitter);w.heavy=Math.max(5,w.heavy);return w}
  var w={retreat:30,heavy:25,death:30,mercy:5};if(c.clockBK<=1){w.retreat-=15;w.death+=10}if(c.clockBK>=5){w.retreat+=30;w.death-=10}if(c.hp>v3StaminaMax()*0.5){w.retreat+=15;w.death-=10;w.mercy+=3}if(c.ce>v3CeMax()*0.5){w.retreat+=8;w.death-=5;w.mercy+=2}  var charm=dimVal(state.dimensions['魅力']);if(charm>=4)w.mercy+=1;if(charm>=5)w.mercy+=2;if(charm>=6)w.mercy+=4;if(charm>=7)w.mercy+=6;if(charm>=8)w.mercy+=8;return w}
function v3ClashResult(idx){var c=state.combat,enemy=ENEMY_TEMPLATES[c.enemyId],mult=[1.3,1.1,1.0,0.9,0.7,2.0][idx],eMult=[0.7,0.9,1.0,1.1,1.3,2.0][idx];
  c.win=Math.min(200,c.win);c.enemyWin=Math.min(200,c.enemyWin);
  var pBase=Math.floor(c.win*0.8)+v3ClashBonus()+Math.floor(Math.random()*6);
  var eBase=Math.floor(c.enemyWin*0.8)+enemy.baseDmg+Math.floor(Math.random()*6)+v3EnemyToolClash();
  // 领域必中效果
  if(c.yourDomainActive)pBase=Math.floor(pBase*(1.0+0.2));if(c.enemyDomainActive)eBase=Math.floor(eBase*(1.0+0.2));
  // 天与咒缚·领域特例: 零咒力→敌必中失效
  if(isHeavenlyRestricted()&&c.enemyDomainActive)pBase=Math.floor(c.win*0.8)+v3ClashBonus()+Math.floor(Math.random()*6);
  // 天逆鉾
  var hasToge=false;if(isHeavenlyRestricted()){if(state.results.some(function(rr){return rr.label==='术式无效(天逆鉾)'}))hasToge=true}if(hasToge)pBase+=15;if(hasToge&&c.enemyDomainActive){c.domainRemaining=Math.max(0,c.domainRemaining-2);if(c.domainRemaining<=0){c.enemyDomainActive=false;showToast('天逆鉾斩裂结界!')}}
  // 领域效果: 打击灵魂 +8
  if(c.yourDomainActive&&c.domainEffect==='打击灵魂')pBase+=8;
  // 领域效果: 自动攻击(对拼两次取高)
  if(c.yourDomainActive&&c.domainEffect==='自动攻击'){var pB2=Math.floor(c.win*0.8)+v3ClashBonus()+Math.floor(Math.random()*6);pBase=Math.max(pBase,pB2)}
  // 领域效果: 增幅自身(体力轮×1.5——在drawStamina时应用)
  if(!c.yourDomainActive||c.domainEffect!=='增幅自身'){}// handled in drawStamina
  // 领域类型: 半成品无必中
  if(c.yourDomainActive&&c.domainType==='半成品')pBase=Math.floor(pBase/1.2);
  // 敌领域效果: 打击灵魂/自动攻击
  if(c.enemyDomainActive&&c.enemyDomainEffect==='打击灵魂')eBase+=8;
  if(c.enemyDomainActive&&c.enemyDomainEffect==='自动攻击'){var eB2=Math.floor(c.enemyWin*0.8)+enemy.baseDmg+Math.floor(Math.random()*6)+v3EnemyToolClash();eBase=Math.max(eBase,eB2)}
  if(c.enemyDomainActive&&c.enemyDomainType==='半成品')eBase=Math.floor(eBase/1.2);
  // 姿态修正
  if(c.stance==='猛攻'){pBase=Math.floor(pBase*1.3);eBase=Math.floor(eBase*1.3)}if(c.stance==='坚牢'){pBase=Math.floor(pBase*0.7);eBase=Math.floor(eBase*0.7)}
  if(c.enemyStance==='猛攻'){eBase=Math.floor(eBase*1.3);pBase=Math.floor(pBase*1.3)}if(c.enemyStance==='坚牢'){eBase=Math.floor(eBase*0.7);pBase=Math.floor(pBase*0.7)}
  // 结界术
  if(c.barrierActive)eBase=Math.floor(eBase*0.8);if(c.burnout)pBase=Math.floor(pBase*0.7);if(c.enemyBurnout)eBase=Math.floor(eBase*0.7);
  // 逃跑失败惩罚
  if(c._escapeFail){eBase=Math.floor(eBase*1.3);c._escapeFail=false}
  // 咒灵易伤(RCT克制)
  var isCurse=enemy.type==='curse';if(isCurse){var curseMul=1.5;if(v3PlayerToolCurseBonus())curseMul=1.8;pBase=Math.floor(pBase*curseMul)}
  var pDmg=Math.floor(pBase*mult),eDmg=Math.floor(eBase*eMult);var shAbs=0,shAbsE=0;
  if(c.enemyShield>0){var absE=Math.min(c.enemyShield,pDmg);c.enemyShield-=absE;pDmg-=absE;shAbsE=absE}
  if(c.shield>0){var abs=Math.min(c.shield,eDmg);c.shield-=abs;eDmg-=abs;shAbs=abs}
  c.hp=Math.max(0,c.hp-Math.max(0,eDmg));c.enemyHp=Math.max(0,c.enemyHp-Math.max(0,pDmg));
  c.clockBK=Math.min(6,c.clockBK+Math.floor(pDmg/(c.enemyMaxHp/6)));c.clockLB=Math.min(6,c.clockLB+Math.floor(eDmg/(v3StaminaMax()/6)*v3WillClockMul()));
  c.shield=Math.floor(c.ce*0.5*v3PlayerToolShieldMul());c.enemyShield=Math.floor(c.enemyCe*(enemy.shieldMul||0.5));updateCombatUI();var clashClass=idx===0?'bfx-crushing':idx===1?'bfx-hitting':idx===4?'bfx-defeated':idx===5?'bfx-deadly':'';var vsEl=document.getElementById('combatVS');if(clashClass&&vsEl)vsEl.classList.add(clashClass);setTimeout(function(){var vs=document.getElementById('combatVS');if(vs)vs.classList.remove('bfx-crushing','bfx-hitting','bfx-defeated','bfx-deadly')},800);
  var rp=document.getElementById('resultPanel');rp.style.display='block';rp.className='result-panel';if(idx===0)rp.classList.add('bfx-crushing');if(idx===5)rp.classList.add('bfx-deadly');
  rp.innerHTML='<div class="rp-cat">⚔ 对拼结果</div><div class="rp-val">你:'+pDmg+'伤害 | 敌:'+eDmg+'伤害'+(shAbs>0?' (🛡护盾吸收:'+shAbs+')':'')+'</div><div class="rp-desc">击破:'+c.clockBK+'/6 败势:'+c.clockLB+'/6</div>';  c.log.push('[T'+c.round+' CLASH] 你:'+pDmg+' 敌:'+eDmg+' BK:'+c.clockBK+' LB:'+c.clockLB);if(c.burnout)c.log.push('[T'+c.round+'] ⚠ 熔断')
}
function v3DomainClashResult(idx){var c=state.combat;if(idx===0){c.yourDomainActive=true;c.enemyDomainActive=false;c.domainRemaining=v3CalcDomainDur(idxOrC(dimVal(state.dimensions['咒力总量'])));showToast('领域占上风!')}else if(idx===1){c.enemyDomainActive=true;c.yourDomainActive=false;c.burnout=true;var enemy=ENEMY_TEMPLATES[c.enemyId];c.enemyDomainRemaining=3;if(enemy&&enemy.dim)c.enemyDomainRemaining=v3CalcDomainDur(idxOrC(dimVal(enemy.dim['咒力总量'])));c.enemyDomainEffect=enemy&&enemy.domain?enemy.domain.effect:null;c.enemyDomainType=enemy&&enemy.domain?enemy.domain.type:'封闭式';showToast('对方领域占优')}else if(idx===2){c.burnout=true;c.yourDomainActive=false;c.enemyDomainActive=false;showToast('领域对消灭!')}else{showToast('僵持，下回合再拼')}c.phase='player_tech';updateCombatUI()}
function v3RCTResult(label){var c=state.combat;if(label.indexOf('完美')>=0){c.burnout=false;c.domainUsed=false;showToast('完美修复!')}else if(label.indexOf('标准')>=0){c.burnout=false;c.domainUsed=false;c.ce=Math.max(0,c.ce-15);showToast('标准修复，CE-15')}else if(label.indexOf('代价')>=0){c.burnout=false;c.domainUsed=false;c.ce=Math.max(0,c.ce-25);showToast('代价修复')}else if(label.indexOf('失败')>=0){c.hp=Math.floor(c.hp*0.7);showToast('修复失败')}else if(label.indexOf('反噬')>=0){state.traits=state.traits.filter(function(t){return normalizeTag(t)!=='领域展开'});c.hp=Math.floor(c.hp*0.5);showToast('反噬!')}c.phase='player_tech';updateCombatUI()}
function v3EscapeResult(label){var c=state.combat;if(label.indexOf('成功')>=0){endCombat();showToast('成功脱出!');var ri=activeRounds().findIndex(function(rx){return rx.id==='p4_rest'});if(ri>=0)goRound(ri)}else if(label.indexOf('险中')>=0){var cur=dimVal(state.dimensions['体质']);state.dimensions['体质']=dimLv(cur-1);endCombat();showToast('险脱，体质-1');var ri=activeRounds().findIndex(function(rx){return rx.id==='p4_rest'});if(ri>=0)goRound(ri)}else{c._escapeFail=true;c.phase='player_tech';showToast('脱出失败!')}}
function v3HandleResult(label){var c=state.combat;if(label.indexOf('完胜')>=0||label.indexOf('苦战')>=0||label.indexOf('惨胜')>=0){if(label.indexOf('完胜')>=0){c.hp=v3StaminaMax();c.ce=v3CeMax()}else if(label.indexOf('苦战')>=0){c.hp=Math.floor(v3StaminaMax()*0.6)}else{c.hp=Math.floor(v3StaminaMax()*0.3)}}else{if(label.indexOf('败退')>=0){c.hp=Math.floor(v3StaminaMax()*0.3)}else if(label.indexOf('惨败')>=0){c.hp=Math.floor(v3StaminaMax()*0.1)}else if(label.indexOf('殒命')>=0){c.hp=0}else{c.hp=Math.floor(v3StaminaMax()*0.2)}}
  document.getElementById('btnCombatRow').style.display='none';var ri=activeRounds().findIndex(function(rx){return rx.id==='p4_rest'});if(ri>=0)goRound(ri);endCombat()}

// F.5 咒具上限(最多3件)——在initCombat初始化时约束
function v3ToolCap(){if(!state.combat||!state.combat.activeTools)return;var count=0;var tools=state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0});state.combat.activeTools=tools.slice(0,3)}

// F.6 战斗日志——已嵌入stop/v3ClashResult

// F.7 Debug面板——?debug参数创建测试区域
(function(){if(window.location.search.indexOf('debug')>=0){var db=document.createElement('div');db.id='debugPanel';db.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:200;background:#111;color:#fff;padding:8px;font-size:10px;max-height:120px;overflow-y:auto';document.body.appendChild(db);setInterval(function(){if(state.combat&&state.combat.active&&state.combat.log){db.innerHTML=state.combat.log.slice(-8).join('<br>')}},1000)}}());

// ========================================================= V3 BUTTONS =========================================================
function updateBtnRow(){var b=document.getElementById('btnCombatRow'),c=state.combat;if(!b)return;if(!c||!c.active||c.phase!=='player_tech'){b.style.display='none';return}b.style.display='flex';document.getElementById('bcDomain').style.display=(c.burnout||c.domainUsed||!hasTrait('领域展开'))?'none':'inline-block';document.getElementById('bcMax').style.display=(c.burnout||c.maxUsed||!hasTrait('极之番'))?'none':'inline-block';document.getElementById('bcRCT').style.display=(c.burnout&&hasTrait('反转术式'))?'inline-block':'none';document.getElementById('bcEscape').style.display=(c.stance==='流转')?'inline-block':'none';document.getElementById('bcBindLoan').style.display=(c.bindLoanUsed||!hasTrait('束缚'))?'none':'inline-block';document.getElementById('bcBindStack').style.display=(!c.bindLoanUsed||!hasTrait('束缚'))?'none':'inline-block';var dn=state.results.filter(function(r){return r.roundId&&r.roundId.indexOf('_dname')>=0}).pop();document.getElementById('bcDomain').textContent='🌐 '+(dn?dn.label:'领域展开');var mn=state.results.filter(function(r){return r.roundId&&r.roundId.indexOf('_mname')>=0}).pop();document.getElementById('bcMax').textContent='🔥 '+(mn?mn.label:'极之番')}
function bDomain(){var c=state.combat;if(!c||c.burnout||c.domainUsed){showToast('无法展开领域');return}c.ce-=80;c.domainUsed=true;
  // 从p2标签读取领域效果和类型
  c.domainEffect=null;c.domainType='封闭式';
  state.skills.forEach(function(s){if(s.indexOf('打击灵魂')>=0)c.domainEffect='打击灵魂';if(s.indexOf('强控')>=0)c.domainEffect='强控';if(s.indexOf('规则')>=0)c.domainEffect='规则';if(s.indexOf('自动攻击')>=0)c.domainEffect='自动攻击';if(s.indexOf('增幅自身')>=0)c.domainEffect='增幅自身';if(s.indexOf('增幅术式')>=0)c.domainEffect='增幅术式'});
  state.results.forEach(function(r){if(r.label&&r.label.indexOf('开放式')>=0)c.domainType='开放式';if(r.label&&r.label.indexOf('半成品')>=0)c.domainType='半成品';if(r.label&&r.label.indexOf('自由调控')>=0)c.domainType='自由调控'});
  var enemy=ENEMY_TEMPLATES[c.enemyId];if(enemy&&enemy.hasDomain){c.phase='domain_clash';showToast('领域对拼!');document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🌀 旋转';refreshAll();saveState()}else{c.yourDomainActive=true;c.domainRemaining=v3CalcDomainDur(idxOrC(dimVal(state.dimensions['咒力总量'])));showToast('领域展开!');var dw=document.getElementById('wheelWrap');if(dw){dw.classList.add('domain-expanding');setTimeout(function(){dw.classList.remove('domain-expanding')},800)}var bd=document.getElementById('bcDomain');if(bd){bd.classList.add('bfx-activate');setTimeout(function(){bd.classList.remove('bfx-activate')},600)}refreshAll();saveState();updateCombatUI()}}
function bMax(){var c=state.combat;if(!c||c.burnout||c.maxUsed){showToast(c.maxUsed?'极之番已使用':'熔断中无法使用极之番');return}if(c.ce<80){showToast('咒力不足(需80)');return}c.ce-=80;c.win+=Math.floor(70*(1+v3TechWinBonus()/100));c.maxPenalty=true;c.maxUsed=true;showToast('极之番!');var bw=document.getElementById('bcMax');if(bw){bw.classList.add('bfx-activate');setTimeout(function(){bw.classList.remove('bfx-activate')},600)}updateCombatUI()}
function bRCT(){var c=state.combat;if(!c||!c.burnout){showToast('不在熔断状态');return}var att=c.burnoutAttempts||0,idx=Math.min(att,3),base=RCT_BASE[idx],manip=idxOrC(dimVal(state.dimensions['咒力操纵'])),will=idxOrC(dimVal(state.dimensions['意志']));  var ps=[0,0,0,0,0];for(var i=0;i<5;i++)ps[i]=Math.max(0,base[i]+RCT_MANIP[i][manip]+WILL_RCT[i][will]);ps[4]=Math.max(3,ps[4]);var sum=ps[0]+ps[1]+ps[2]+ps[3]+ps[4];if(sum!==100){var rem=100;for(var j=0;j<4;j++){ps[j]=Math.round(ps[j]/sum*100);rem-=ps[j]}ps[4]=Math.max(0,rem)}var items=[];var names=['完美修复','标准修复','代价修复','修复失败','反噬'];for(var k=0;k<5;k++)items.push({l:names[k],w:ps[k],c:['#ff0','#8a4','#c84','#888','#f44'][k]});c.burnoutAttempts=att+1;wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('wheelWrap').style.display='block';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🔮 修复';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';state._rctPhase=true}
function bEscape(){var c=state.combat;if(c.stance!=='流转'){showToast('仅流转姿态可逃跑');return}if(c.domainType==='开放式'){showToast('开放式领域劣势后不可逃跑');return}var er=v3EscapeRate();var items=[{l:'成功脱出',w:Math.max(er,1),c:'#4c8'},{l:'险中脱出',w:25,c:'#888'},{l:'脱出失败',w:Math.max(100-er-25,1),c:'#c44'}];wheel=buildWheel(items);wheel.angle=0;state.targetAngle=0;initParticles();wheel.draw();document.getElementById('wheelWrap').style.display='block';document.getElementById('btnSpin').style.display='block';document.getElementById('btnSpin').textContent='🏃 逃跑';document.getElementById('btnSpin').disabled=false;document.getElementById('resultPanel').style.display='none';document.getElementById('btnNext').style.display='none';state._escapePhase=true}
function bBindLoan(){var c=state.combat;c.stamina=Math.max(0,c.stamina-5);c.win+=25;c.bindLoanUsed=true;var bl=document.getElementById('bcBindLoan');if(bl){bl.classList.add('bfx-activate');setTimeout(function(){bl.classList.remove('bfx-activate')},500)}if(c.stamina<=0){c.phase='enemy_tech';showToast('体力耗尽→敌人阶段');var already=state.results.filter(function(rr){return rr.roundId==='p4_ptech'});if(already.length===0)state.results.push({roundId:'p4_ptech',rname:'⚔ 出招',prop:'',label:'完毕',desc:'',c:'#888',_item:{tags:[],dim:{},dimMod:{}}});var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_estamina'});if(nxt>=0)goRound(nxt);saveState();return}updateCombatUI();updateBtnRow()}
function bBindStack(){var c=state.combat;c.stamina=Math.max(0,c.stamina-9);c.dangerZone+=10;c.win+=50;var bs=document.getElementById('bcBindStack');if(bs){bs.classList.add('bfx-activate');setTimeout(function(){bs.classList.remove('bfx-activate')},500)}if(c.stamina<=0){c.phase='enemy_tech';showToast('体力耗尽→敌人阶段');var already=state.results.filter(function(rr){return rr.roundId==='p4_ptech'});if(already.length===0)state.results.push({roundId:'p4_ptech',rname:'⚔ 出招',prop:'',label:'完毕',desc:'',c:'#888',_item:{tags:[],dim:{},dimMod:{}}});var nxt=activeRounds().findIndex(function(rx){return rx.id==='p4_estamina'});if(nxt>=0)goRound(nxt);saveState();return}updateCombatUI();updateBtnRow()}

// ========================================================= V3 UI =========================================================
function updateCombatUI(){
  var vs=document.getElementById('combatVS');if(!vs)return;if(!state.combat||!state.combat.active||!state.combat.enemyId){vs.style.display='none';updateBtnRow();return}
  vs.style.display='block';var e=ENEMY_TEMPLATES[state.combat.enemyId];if(!e)return;var c=state.combat;
  document.getElementById('cvRound').textContent='⚔ 第'+c.round+'回合';
  var phaseMap={'player_stamina':'体力抽取','player_tech':'出招阶段','enemy_stamina':'敌体力','enemy_tech':'敌出招','clash':'⚔对拼','domain_clash':'🌐领域对拼','result':'胜负判定'};document.getElementById('cvPhase').textContent=phaseMap[c.phase]||c.phase||'';
  // 玩家维度 (字母等级)
  var combatDims=['体质','体术','咒力总量','咒力效率','咒力操纵','术式性能','运势','天赋','意志'];var pDimEl=document.getElementById('cvPDims'),pDH='';
  var dimAbbr={咒力总量:'咒总量',咒力效率:'咒效率',咒力操纵:'咒操纵',术式性能:'术性能'};
  combatDims.forEach(function(k){var v=state.dimensions[k];if(!v)return;var clr=dimColor(dimVal(v));var abbr=dimAbbr[k]||k.slice(0,2);pDH+='<span class="cv-dt"><span class="cv-dk">'+abbr+'</span><span style="color:'+clr+';font-weight:900">'+v+'</span></span>'});
  if(pDimEl){pDimEl.innerHTML=pDH||'<span style="color:var(--dim)">--</span>';pDimEl.style.fontSize='8px'}
  // 敌人名字+维度
  var eDimEl=document.getElementById('cvEDims'),eDH='<span style="display:block;color:#fff;font-weight:800;font-size:11px;line-height:1.3">'+e.name+'</span><span style="display:block;color:var(--dim);font-size:8px;margin-bottom:3px">'+e.title+'</span>';
  combatDims.forEach(function(k){var v=e.dim?e.dim[k]:null;if(!v)return;var clr=dimColor(dimVal(v));var abbr=dimAbbr[k]||k.slice(0,2);eDH+='<span class="cv-dt"><span class="cv-dk">'+abbr+'</span><span style="color:'+clr+';font-weight:900">'+v+'</span></span>'});
  if(eDimEl){eDimEl.innerHTML=eDH||'<span style="color:var(--dim)">--</span>';eDimEl.style.fontSize='8px'}
  // 咒具行
  var pToolEl=document.getElementById('cvPTools'),pTH='';state.results.filter(function(r){return r.prop&&r.prop.indexOf('咒具')>=0}).slice(0,3).forEach(function(r){var l=r.label||'';var eff='';if(l.indexOf('术式无效')>=0||l.indexOf('天逆鉾')>=0)eff='对拼+10';if(l.indexOf('增幅自身')>=0)eff='对拼+5';if(l.indexOf('追踪必中')>=0)eff='对拼+3';if(l.indexOf('元素附魔')>=0)eff='术式胜率+6';if(l.indexOf('精神扰乱')>=0)eff='敌胜率减半';if(l.indexOf('空间干涉')>=0)eff='敌体+2';if(l.indexOf('隐密')>=0)eff='首回对拼+5';if(l.indexOf('诅咒吸收')>=0)eff='黑闪+2%';if(l.indexOf('治愈')>=0)eff='回复8HP';if(l.indexOf('防护结界')>=0)eff='护盾×1.3';if(l.indexOf('储存咒力')>=0)eff='CE+30';pTH+='<span class="cv-tool" title="'+eff+'">'+l+'</span>'});
  if(pToolEl)pToolEl.innerHTML=pTH;
  var eToolEl=document.getElementById('cvETools'),eTH='';(e.tools||[]).forEach(function(t){eTH+='<span class="cv-tool" title="'+t.effect+'">'+t.name+'('+t.effect+')</span>'});
  if(eToolEl)eToolEl.innerHTML=eTH;
  // 玩家条
  var stMx=v3StaminaMax(),hpPct=Math.max(0,Math.min(100,c.hp/Math.max(1,stMx)*100));document.getElementById('cvHpBar').style.width=hpPct+'%';document.getElementById('cvHpVal').textContent=c.hp;
  var shPct=c.shield>0?Math.min(100,c.shield/Math.max(1,c.hp)*100):0;document.getElementById('cvShBar').style.width=shPct+'%';document.getElementById('cvShVal').textContent=Math.floor(c.shield);
  var ceMx=v3CeMax(),cePct=ceMx>0?Math.min(100,c.ce/Math.max(1,ceMx)*100):0;document.getElementById('cvCeBar').style.width=cePct+'%';document.getElementById('cvCeVal').textContent=c.ce;
  document.getElementById('cvStVal').textContent=c.stamina;document.getElementById('cvWinVal').textContent=c.win;document.getElementById('cvDZVal').textContent=Math.floor(c.dangerZone)+'%';
  // 敌人条
  var eHpPct=Math.max(0,Math.min(100,c.enemyHp/Math.max(1,c.enemyMaxHp)*100));document.getElementById('cvEHpBar').style.width=eHpPct+'%';document.getElementById('cvEHpVal').textContent=c.enemyHp;
  var eShPct=(c.enemyShield||0)>0?Math.min(100,(c.enemyShield||0)/Math.max(1,c.enemyHp)*100):0;document.getElementById('cvEShBar').style.width=eShPct+'%';document.getElementById('cvEShVal').textContent=Math.floor(c.enemyShield||0);
  var eCeMx=v3EnemyCeMax(),eCePct=eCeMx>0?Math.min(100,c.enemyCe/Math.max(1,eCeMx)*100):0;document.getElementById('cvECeBar').style.width=eCePct+'%';document.getElementById('cvECeVal').textContent=c.enemyCe;
  document.getElementById('cvEStVal').textContent=c.enemyStamina;document.getElementById('cvEWinVal').textContent=c.enemyWin;document.getElementById('cvEDZVal').textContent=Math.floor(c.enemyDangerZone)+'%';
  // 姿态 & 熔断 & 领域徽章
  document.getElementById('cvStanceBadge').textContent=c.stance?(c.stance==='猛攻'?'🔥猛攻':c.stance==='流转'?'🌊流转':'⛰坚牢'):'⚖未定';document.getElementById('cvStanceBadge').style.display=c.stance?'inline-block':'none';
  document.getElementById('cvBurnoutBadge').style.display=(c.burnout||c.enemyBurnout)?'inline-block':'none';
  if(c.burnout)document.getElementById('cvBurnoutBadge').textContent='⚠熔断';
  else if(c.enemyBurnout)document.getElementById('cvBurnoutBadge').textContent='⚠敌熔断';
  document.getElementById('cvDomainBadge').style.display=(c.yourDomainActive||c.enemyDomainActive)?'inline-block':'none';
  if(c.yourDomainActive){var dEff=c.domainEffect||'增幅术式';var dType=c.domainType||'封闭式';document.getElementById('cvDomainBadge').textContent='🌐 你: '+dType+'·'+dEff+' 剩'+c.domainRemaining+'回合';document.getElementById('cvDomainBadge').title=dType+'领域: '+dEff+'效果'}
  else if(c.enemyDomainActive){var edEff=c.enemyDomainEffect||'强控';var edType=c.enemyDomainType||'封闭式';document.getElementById('cvDomainBadge').textContent='🌐 敌: '+edType+'·'+edEff+' 剩'+c.enemyDomainRemaining+'回合';document.getElementById('cvDomainBadge').title='敌'+edType+'领域: '+edEff+'效果'}
  // 偏袒显示
  var bias=((c.enemyDangerZone||0)-(c.dangerZone||0))/100,bb=document.getElementById('cvBias');bb.style.display=bias!==0?'inline-block':'none';bb.textContent=bias>=0?'⚖偏袒你+'+Math.round(bias*100)/100:'⚖偏袒敌-'+Math.round(Math.abs(bias)*100)/100;
  // 时钟
  document.getElementById('cvBK').textContent=c.clockBK;document.getElementById('cvLB').textContent=c.clockLB;
  // 卡片特殊 state
  var pc=document.getElementById('cvPlayer'),ecEl=document.getElementById('cvEnemy');pc.classList.toggle('exhausted',c.stamina<=0);pc.classList.toggle('burnout',c.burnout);ecEl.classList.toggle('exhausted',c.enemyStamina<=0);pc.classList.toggle('lethal',c.clockBK>=5);ecEl.classList.toggle('lethal',c.clockLB>=5);var vsEl=document.getElementById('combatVS');if(vsEl){vsEl.classList.toggle('edge-danger',c.clockLB>=5);vsEl.classList.toggle('edge-advantage',c.clockBK>=5)}
  // 辉光
  document.querySelectorAll('.cv-card-glow').forEach(function(gl){gl.classList.toggle('on',true)});
  updateBtnRow();
  var logHtml='';if(c.log&&c.log.length)logHtml=c.log.slice(-20).map(function(l){return'<div class="rh">'+l+'</div>'}).join('');
  var rpSec=document.getElementById('rpCombatLogSec'),rpEl=document.getElementById('rpCombatLog');if(rpSec&&rpEl){rpSec.style.display=logHtml?'block':'none';rpEl.innerHTML=logHtml}
  var cvLog=document.getElementById('cvLog'),cvBody=document.getElementById('cvLogBody');if(cvLog&&cvBody){cvLog.style.display=logHtml?'block':'none';cvBody.innerHTML=logHtml}
}

// ========================================================= V3 SECTOR LABELS =========================================================
(function patchBuildWheel(){if(typeof buildWheel!=='function')return;var _orig=buildWheel;buildWheel=function(items){var w=_orig(items),orig=w.draw;w.draw=function(){orig.call(this);var ctx=this.ctx,a=this.angle-Math.PI/2;for(var i=0;i<this.sectors.length;i++){var s=this.sectors[i],sa=a,ea=a+s.arc;if(!s._tech)continue;ctx.save();ctx.translate(this.cx,this.cy);ctx.rotate(sa+s.arc/2);ctx.textAlign='right';
  var fs1=Math.max(11,this.radius*.07);ctx.font='bold '+fs1+'px sans-serif';ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=4;ctx.fillStyle='#fff';ctx.fillText(s.l,this.radius-12,fs1*.3);ctx.shadowBlur=0;
  var fs2=Math.max(8,this.radius*.04);ctx.font=fs2+'px sans-serif';ctx.shadowColor='rgba(0,0,0,0.85)';ctx.shadowBlur=3;
  ctx.fillStyle='#ccc';ctx.fillText('-'+s._tech.st+'体',this.radius-12,-fs2*1.6);
  ctx.fillStyle='#a8f';ctx.fillText('-'+s._tech.ce+'咒',this.radius-12-ctx.measureText('-'+s._tech.st+'体 ').width,-fs2*1.6);
  ctx.fillStyle='#ff0';ctx.fillText('+'+s._tech.win,this.radius-12-ctx.measureText('-'+s._tech.st+'体 -'+s._tech.ce+'咒 ').width,-fs2*1.6);
  ctx.shadowBlur=0;ctx.restore();a=ea}};return w}})();
