# 战斗系统 v3 实现任务清单

> **参考**: `BATTLE-DESIGN.md` 对应章节。
> **提交**: 每完成一个 checkbox → `.\check-braces.ps1` → `git commit -m "Phase X.Y: ..."`
> **测试**: 每阶段完成后浏览器打开 `index.html`, 抽角色进入 p4 验证。
> **文件结构**: `js/seed-data.js`(数据+表格+技法库) | `js/game.js`(p1~p3引擎+旧战斗临时保留) | `js/combat.js`(v3战斗全部，新建) | `index.html`(HTML+N引用) | `style.css`

---

## Phase 0: 预备 (文件搭建)

**改动文件**: `index.html`, `js/combat.js`
**前置**: 无

- [ ] 新建 `js/combat.js` (空文件, 写 `// 战斗系统 v3`)
- [ ] `index.html` 在 `js/game.js` 之后加 `<script src="js/combat.js"></script>`
- **验证**: 浏览器打开无报错, `combat.js` 成功加载(Network tab 200)

---

## Phase A: 数值体系重写

**参考设计**: §2
**前置**: Phase 0 完成
**改动文件**: `js/seed-data.js`(常量+辅助函数), `js/combat.js`(新战斗函数)

### A.1 基础数组与查表函数

- [ ] 新增 `idxOrC(v)`: `v<0?3:Math.max(0,Math.min(9,v))`
- [ ] 删除旧 `tableLookup` `STAM_TABLE` `CE_TABLE`

**常量定义**:
- [ ] `STAM_ARR = [30,50,80,120,160,220,300,400,520,700]` (§2.2)
- [ ] `CE_ARR  = [15,30,55,90,140,200,280,400,600,999]` (§2.3, EX→999)
- [ ] `STAM_MUL = [1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.5,0.4]` (§2.5)
- [ ] `CE_MUL   = [1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.45,0.3]` (§2.6)
- [ ] `WIN_BONUS  = [-8,-5,-3,0,4,8,14,20,28,40]` (§2.7)
- [ ] `TECH_BONUS = [-6,-4,-2,0,5,11,18,26,38,55]` (§2.8)
- [ ] `TAIJ_BONUS = [-10,-7,-4,0,5,10,18,28,40,55]` (§2.9)
- [ ] `TECH_CLASH = [-8,-5,-2,0,5,12,20,30,42,55]` (§2.9)
- [ ] `DZ_RATE = [7,5,4,3,2,1.5,1,0.5,0.2,0]` (§2.10)
- [ ] `BF_TALENT = [-1,-1,0,0,1,2,4,6,9,12]` (§2.11)
- [ ] `CE_DRAW_LO = [35,38,42,50,58,68,78,88,94,98]` (§2.4)
- [ ] `ESCAPE_BASE = [-20,-10,-5,0,5,10,18,28,40,55]` (§2.13)
- [ ] `WILL_CLOCK = [1.3,1.2,1.1,1.0,0.9,0.8,0.7,0.6,0.5,0.4]` (§2.3b)

**WILL_RCT 5×10表** (§2.3b):
- [ ] 完美: `[-1,-1,0,0,1,2,3,5,8,12]`
- [ ] 标准: `[-2,-1,0,0,1,2,4,6,8,12]`
- [ ] 代价: `[2,1,1,0,0,0,-1,-2,-3,-5]`
- [ ] 失败: `[3,2,1,0,-1,-2,-4,-6,-8,-12]`
- [ ] 反噬: `[2,1,1,0,-1,-2,-3,-4,-6,-8]`

### A.2 核心数值函数

- [ ] `staminaMax()`: `STAM_ARR[idxOrC(体质)]` × 重伤(×0.6) / 残废(×0.4); **天与不乘系数**
  - 验证: 体质B=160, 体质SSS=520(非832)
- [ ] `ceMax()`: `CE_ARR[idxOrC(总量)]` × 重伤(×0.7) / 残废(×0.5) + 天赋% + 里香戒指(+30); **意志不参与**; 天与→0
  - 验证: 咒力SS=400, EX=999(非∞)
- [ ] `stamCostMul()`: `STAM_MUL[idxOrC(体术)]`; 天与→额外 −0.2 (最低0.2)
- [ ] `stamCostBonus()`: 天与咒缚持有者返回 −0.2, 否则返回 0
- [ ] `ceCostMul()`: `CE_MUL[idxOrC(效率)]`; **六眼→直接使用 EX 索引(×0.3)**, 不在 EX 上再乘
- [ ] `winBonus()`: `WIN_BONUS[idxOrC(咒力操纵)]`
- [ ] `techWinBonus()`: `TECH_BONUS[idxOrC(术式性能)]`; 领域展开/极之番在基础上 ×1.5
- [ ] `clashBonus()`: `TAIJ_BONUS[i] + TECH_CLASH[j]` (加法)
- [ ] `dangerGrowth()`: `DZ_RATE[idxOrC(运势)]`
- [ ] `enemyDangerGrowth()`: 查 `ENEMY_TEMPLATES.dim.运势` 同表
- [ ] `bfRate()`: `3 + BF_TALENT[i]` + 运势高于C每级+0.5 + 黑闪标签(+4) + 受肉体(+2); **上限35%**; 六眼不参与
  - 验证: EX天赋(12)+EX运势(3)+标签(4)+受肉体(2)=21%
- [ ] `ceDrawLower()`: `ceMax() × CE_DRAW_LO[idxOrC(意志)] / 100` (§2.4)
- [ ] `escapeRate()`: `50 + ESCAPE_BASE[idxOrC(体术)]`, 上限 100%
- [ ] `willClockMul()`: `WILL_CLOCK[idxOrC(意志)]`
- [ ] `willRCTMod(result, idx)`: 查 WILL_RCT 表
- [ ] `calcDomainDur(idx)`: `3 + floor(idx / 2)`, idx=咒力总量 DIM_LEVELS 索引(0~9)

### A.3 战斗初始化

- [ ] `drawStamina()`: `max(8, floor(6 + staminaMax() × 0.04))` (§2.2)
- [ ] `enemyDrawStamina()`: `max(8, floor(6 + STAM_ARR[idxOrC(ENEMY_TEMPLATES.dim.体质)] × 0.04))` (从敌人维度查表, 不用 hp)
- [ ] `drawCe()`: 下限~上限均分扇区 `min(8, max(4, ceil(范围/30)))`, 中间加权×2
- [ ] `initCombat()`: `hp = staminaMax()`, `ce = drawCe()`, `shield = floor(ce × 0.5)`
- [ ] `initCombat()`: `enemyCe = drawEnemyCe()` (按敌人咒力维度查 §2.4 抽取)
- [ ] `initCombat()`: 初始化所有 state.combat 字段(参考 §8):
  `selfBlocked=false`, `bfZone=false`, `barrierActive=false`, `yourDomainActive=false`, `enemyDomainActive=false`, `domainRemaining=0`, `burnoutAttempts=0`, `maxPenalty=false`, `activeTools=[]`, `enemyDangerZone=0`, `stance=null`, `comboFlags={ao:false,aka:false,kai:false,hachi:false}`
- [ ] 天与咒缚角色: `ce=0`, `ceMax=0`, `shield=0`
- [ ] CE 变化时同步更新 `shield = floor(ce × 0.5)`

---

## Phase B: 轮盘系统 (phase 驱动)

**参考设计**: §1.0~§1.1, §6, §14
**前置**: Phase A 数值函数就绪
**改动文件**: `js/combat.js`(phase状态机+轮盘构建), `index.html`(姿态面板微调)

### B.1 Phase 状态机

- [ ] `state.combat.phase` 完整枚举(§8): `player_stamina → player_stance → player_tech → enemy_stamina → enemy_tech → clash → domain_clash → rct_repair → escape → result → rest`
- [ ] 主线流程: `player_stamina → player_stance → player_tech → enemy_stamina → enemy_tech → clash → (回player_stamina 或 跳result→rest)`
- [ ] 按钮/事件可跳入: `domain_clash`(领域对拼), `rct_repair`(修复熔断), `escape`(逃跑)

### B.2 咒力抽取轮 (p4_prep)

- [ ] `refreshRound` `type:'combat_prep'`: 构建 CE 范围轮盘(4~8扇区)
- [ ] 扇区: 下限~上限均分, 中间加权 ×2
- [ ] 转后: `state.combat.ce = 抽取值`
- [ ] ceMax≤90 时扇区=4(最低)

### B.3 体力轮 (phase='player_stamina')

- [ ] 构建: `drawStamina()-3` ~ `drawStamina()+3` 均分, 5~7扇区, 中间加权×2
- [ ] 转后: `state.combat.stamina = 抽取值`, phase→`player_stance`

### B.4 姿态面板 (phase='player_stance')

- [ ] 体力轮后弹出 3 卡片: 猛攻 / 流转 / 坚牢
- [ ] 每回合均可重选(不锁定整场)
- [ ] 点击设 `state.combat.stance`, phase→`player_tech`
- [ ] **删除** p4_stance 独立轮次(§6: 姿态集成进交战循环)
- [ ] 猛攻/坚牢: 逃跑按钮灰显(不可点击)
- [ ] 流转: 逃跑成功率+10%
- **验证**: 每回合体力轮后姿态面板自动弹出, 选择后正常进入招式轮

### B.5 敌人体力轮 (phase='enemy_stamina')

- [ ] 构建: `enemyDrawStamina()-3` ~ `+3` 均分, 玩家代转
- [ ] 转后: phase→`enemy_tech`

### B.6 对拼轮 (phase='clash')

- [ ] 构建 6 扇区: 完全压制/有效打击/互伤/招架吃力/被压制/致命互击
- [ ] 基准伤害: `累计胜率×0.8 + 对拼加值 + random(0~6)` (§10.1)
- [ ] **DZ bias 计算**: `bias = (敌DZ − 你DZ) / 100` → 乘入各扇区权重(§2.10偏袒表)
- [ ] 致命互击扇区: DZ≥50% 时出现(替换1扇区)
- [ ] 转后: HP 扣减, 时钟推进
- [ ] 击破时钟: `floor(伤害 ÷ (ENEMY_TEMPLATES.hp上限 ÷ 6))` — 上限HP匀速推进
- [ ] 败势时钟: `floor(敌伤害 ÷ (staminaMax() ÷ 6)) × willClockMul()`
- [ ] 未决→`roundStamina()`(新回合); 已决→`p4_result`

### B.7 多回合循环

- [ ] `roundStamina()`: `phase='player_stamina'`, 重置 `win=0, enemyWin=0`
- [ ] 重抽 stamina(玩家+敌人), `dangerZone递增`, `round++`
- [ ] 重置: `bfCombo=0`, `bfZone=false`, `selfBlocked=false`, `comboFlags = {ao:false, aka:false, kai:false, hachi:false}` (§3.4 茈/開前置追踪)
- [ ] `domainRemaining--`(双方各自); 归零→`yourDomainActive=false` / `enemyDomainActive=false`
- [ ] 处理 `maxPenalty`: 检查旗标→生效到 `stamCostMul()`, 回合开始后清除旗标
- [ ] `enemyBlocked` 重置(领域展延效果: 敌方招式轮结束后清除, 非新回合)
- [ ] `barrierActive` 重置(结界术效果: 持续 1 回合, 对拼后清除)
- [ ] 敌人姿态: 新回合前 stanceAI 检查并切换

### B.8 领域对拼轮 (phase='domain_clash')

- [ ] 仅双方都有领域时触发(§4.4)——**领域冲突必对拼, 场上最多只有1个领域**
- [ ] 若对拼前某方已有活跃领域, 对拼输方清空:`yourDomainActive=false` / `enemyDomainActive=false`
- [ ] 构建 4 扇区: 你的领域占上风 / 对方领域占上风 / 领域对消灭 / 精密度僵持
- [ ] 权重由双方精密度差距决定: `精密度 = 术式性能值 + 咒力操纵值 + 领域类型加成 + 结界穿透`
- [ ] **结果 flags**:
  - 占上风→`yourDomainActive=true`, 对方 `burnout=true`, `enemyDomainActive=false`
  - 被压制→`enemyDomainActive=true`, 你 `burnout=true`, `yourDomainActive=false`
  - 对消灭→双方 `burnout=true`, `yourDomainActive=false`, `enemyDomainActive=false`
  - 僵持→本轮平局, 下回合自动再触发对拼

### B.9 RCT 修复轮 (phase='rct_repair')

- [ ] 点击修复按钮→进入此 phase
- [ ] 构建 5 扇区: 完美/标准/代价/失败/反噬
- [ ] 扇区权重 = 概率(经累积风险表§5.4→操纵修正§5.3→意志修正§2.3b 叠加+归一化后)
- [ ] 转后: 按 §5.2 效果执行(完美/标准/代价→熔断清零+domainUsed重置; 失败→保持; 反噬→移除领域标签)
- [ ] `burnoutAttempts` 累加

### B.10 逃跑轮 (phase='escape')

- [ ] 点击逃跑/敌人 stanceAI 触发→进入此 phase
- [ ] 构建 3 扇区: 成功脱出/险中脱出/脱出失败
- [ ] 概率: 成功=50%+escapeRate(), 险脱=25%, 失败=25%−escapeRate()
- [ ] 转后: 按 §10.3 效果执行

### B.11 胜负轮 (phase='result')

- [ ] 击破/败势时钟满或 HP 归零→进入此 phase
- [ ] 按 §10.2 动态权重构建扇区(完胜/苦战/惨胜/败退/惨败/殒命/放一马)
- [ ] 胜方: 条件偏移表(剩余HP/败势段数/回合数/熔断)累加
- [ ] 败方: 放一马基准 5% + 魅力加成(最高+8%)
- [ ] 转后跳转 `p4_rest`

### B.12 休整轮 (phase='rest')

- [ ] 胜负轮后→进入此 phase
- [ ] 构建 4 扇区: 充分/短暂/勉强/恶化 (SEED_DATA items 驱动)
- [ ] 转后: 按 F.2 恢复 HP/CE, 或体质 dimMod−1

---

## Phase C: 敌人系统 + 技法库更新

**参考设计**: §3.7, §7, §13
**前置**: Phase A 数值函数 + Phase B.1 状态机就绪
**改动文件**: `js/seed-data.js`(TECHNIQUE_LIBRARY+ENEMY_TEMPLATES), `js/combat.js`(buildCombatItems+敌人逻辑)

### C.0 技法库更新 (TECHNIQUE_LIBRARY in js/seed-data.js)

- [ ] **删除**: `ce_blast` (通用池), 束缚强化·贷, 束缚叠加 (已转按钮)
- [ ] **更新值**: 茈 st:4/ce:100/win:100, 開 st:3/ce:50/win:90; 解st:1, 捌st:2, 火焰st:2
- [ ] **刪除**: `咒骸出击` 整行 (p2 有但战斗不支持)
- [ ] **更新**: 术式反转加 `cond:"反转术式"`, 领域展延 eff 加"自身术式也禁用"
- [ ] 咒力放出: 从通用池移出 → 仅限拥有对应术式标签时 buildCombatItems 动态添加

**更新后 TECHNIQUE_LIBRARY 核对清单**:
| 分类 | 应保留的技法 | 应删除的 |
|------|-------------|---------|
| universal | atk, heavy, ce_punch | ce_blast |
| advanced | 简易领域, 领域展延, 反转术式·自愈, 反转术式·外放, 术式反转, 结界术, 术式扩张, corpse(咒骸) | 束缚强化·贷, 束缚叠加 |
| innate.无下限 | 蒼(20,30), 赫(35,55), 茈(100,100) | — |
| innate.御厨子 | 解(12,22), 捌(22,45), 火焰(18,35), 開(50,90) | — |
| innate._default | 术式·基础(15,22), 全力(28,40), 极限(45,65) | — |

### C.1 `buildCombatItems()` 全面重写

**执行顺序**: ①收集 ②过滤(§3.7所有规则) ③姿态权重修正(§3.8表) ④返回最终列表

- [ ] **universal**: atk(6,0,10) / heavy(9,0,20) / ce_punch(4,8,24) — 删 ce_blast
- [ ] **advanced**: 按 `normalizeTag()` 匹配 `state.traits/skills`:
  - 简易领域, 领域展延(同时设 selfBlocked), 反转术式·自愈, 反转术式·外放, 结界术(**使用后设 `barrierActive=true`**), 术式扩张
  - 术式反转: 需"反转术式"+"术式反转" 两个标签同时存在
- [ ] **innate**: 按术式标签分支:
  - 无下限: 蒼(2,20,30)+赫(3,35,55) + 茈(4,100,100, combo:本回合用蒼or赫后出现)
  - 御厨子: 解(1,12,22)+捌(2,22,45)+火焰(2,18,35) + 開(3,50,90, only `yourDomainActive && domainName==伏魔御厨子`)
  - 有术式标签但非特殊列表→通用覆盖: 术式·基础(3,15,22)/全力(4,28,40)/极限(5,45,65)
  - **无任何术式标签→不出现术式类技法**
- [ ] **HR专属**: 体术·瞬击(4,0,18)/连破(7,0,30)/先读(3,0,12)/暴君·极(12,0,55)
- [ ] **熔断过滤**: 隐藏 atk_ce/ult_ce; 保留 `术式·基础(id:tech_basic)`
- [ ] **天与咒缚**: 隐藏所有 ce>0 技法
- [ ] **体力/CE不足**: 所需 > 当前池 → 隐藏
- [ ] **姿态权重修正** (§3.8): 猛攻×3(极之番/茈/開), 流转×2(反转术式类/术式·基础), 坚牢×3(简易领域/结界术) 等
- [ ] 咒力放出仅限对应术式标签出现(非通用)

### C.2 `normalizeTag()` 模糊匹配

- [ ] `function normalizeTag(s)`: `s.replace(/\(.*?\)/g,'').trim()`
- [ ] `hasTrait(normalized)`: 遍历 `state.traits`/`state.skills` 做 normalizeTag 比较

### C.3 敌人招式轮 (phase='enemy_tech')

- [ ] `buildCombatItems(true)`: 构建敌人技法轮, 过滤规则同玩家
- [ ] 敌人领域作为普通扇区: `ENEMY_TEMPLATES.domain.weight` 控制
- [ ] 玩家逐招代转, 每发显示 `[−X体 −Y咒 +Z胜] 技法名`
- [ ] 体力耗尽或无技法→`phase='clash'`

### C.4 删除旧 auto-attack

- [ ] 从 `stop()` / p4_action 分支删除敌方自动反击
- [ ] 敌方仅通过 `phase='enemy_tech'` 由玩家代转

### C.5 敌人·甚尔数据 (§7.1)

- [ ] `ENEMY_TEMPLATES['fushiguro_toji_kai']`: `type:'human'`, hp=520, dim 见 §7.1
- [ ] 技法池: 体术·瞬击/连破/先读/暴君·极, 游云·三段打(st:10), 天逆鉾·术式破断(st:8,×1.8), 万里锁链·束缚(st:7), 幽影奇袭(st:6), 重击 (**无"闪避"**)
- [ ] `stanceAI`: default猛攻, hp<20%→逃跑, winGap<-40→流转, enemyBurnout→猛攻
- [ ] `hasDomain=false`

### C.6 敌人姿态 AI (§13.4)

- [ ] 每回合前按 `switches` 顺序检查条件
- [ ] "逃跑"姿态: 敌招式轮后自动触发逃跑轮(成功→结束, 失败→回default)

---

## Phase D: 按钮系统

**参考设计**: §3.6, §3.9, §4, §4b, §5, §10.3, §16
**前置**: Phase B 所有轮盘 + Phase C 敌人系统就绪
**改动文件**: `js/combat.js`(按钮逻辑+领域+修复+束缚), `index.html`(按钮HTML)

### D.1 按钮 HTML + 条件显示

- [ ] 添加 `<div class="btn-combat-row">` 含 **6 个按钮**
- [ ] 仅 `phase='player_tech'` 可用, 敌人阶段全部灰显

| 按钮 | 显示条件 |
|------|---------|
| 🌐 领域展开·\<名\> | 有领域标签 && !domainUsed && !burnout |
| 🔥 极之番·\<名\> | 有极之番标签 && !burnout (CE 80 节制, 不设硬锁) |
| 🔄 修复熔断 | burnout && 有反转术式标签 |
| 🏃 逃跑 | 流转姿态可用 (猛攻/坚牢灰显, 领域对拼隐藏) |
| 🔗 束缚·贷 | 本回合未用 |
| 🔗 束缚·叠加 | 已用束缚·贷 (同一回合) |

### D.2 束缚按钮 (§3.9)

- [ ] 束缚·贷: 体力−5, 胜率+25; 体力≤0→本回合招式轮强制结束
- [ ] 束缚·叠加: 体力−9, DZ+10%, 胜率+50; 需先点束缚·贷
- [ ] 两按钮各限每回合 1 次, 不设违约后果

### D.3 领域展开 + 对拼 (§4, §4b)

- [ ] 点击→消耗 80CE → `burnout=true`
- [ ] 若敌人领域已活跃(`enemyDomainActive=true`)→必须走**领域对拼**(不允许直接覆盖)
- [ ] 敌人有领域标签但未活跃→**领域对拼轮**; 无领域→**直接覆盖**
- [ ] **直接覆盖**: `yourDomainActive=true`, `domainRemaining=calcDomainDur(咒力总量idx)`, 必中(+0.2倍率) + 领域效果(p2抽取)
- [ ] **领域对拼** (双方都有领域→B.8):
  1. 精密度判定: 术式性能+咒力操纵+领域类型加成+结界穿透
  2. 进入 `phase='domain_clash'` → 调用 B.8 对拼轮
  3. B.8 中 flags: 占上风→`yourDomainActive=true` 对方熔断; 被压制→`enemyDomainActive=true` 你熔断; 对消灭→双方熔断+无领域; 僵持→下回合再拼
- [ ] 领域覆盖: 流程不变, 领域方享必中+领域效果(§4b.2~§4b.3)
- [ ] `domainRemaining` 每回合−1(在 B.7 中); 归零→`yourDomainActive=false`
- [ ] 我方领域活跃时: 開(御厨子)自动出现在 buildCombatItems 中

### D.3b 领域效果实现 (§4b.3, p2_de1-6 抽取)

- [ ] `state.combat.domainEffect` 在领域覆盖时从 p2 标签读取(`p2_de1`~`p2_de6`), 写入效果类型
- [ ] 打击灵魂(虎杖): 对拼轮领域方伤害基准 +8
- [ ] 强控(五条): 敌技法轮中防御类(简易领域/结界术)隐藏(在 C.1 buildCombatItems 中过滤)
- [ ] 规则(日车): 敌技法轮随机 1 个技法类型封锁(在 C.1 中随机隐藏)
- [ ] 自动攻击(宿儺): 对拼轮多转 1 次, 取伤害高的那次
- [ ] 增幅自身(秤): 体力轮抽取结果 ×1.5 (在 B.3 drawStamina 后乘)
- [ ] 增幅术式(乙骨): 所有术式类技法胜率 ×2 (在 winBonus 中叠加)

### D.3c 领域类型实现 (§4b.4, p2_dt 抽取)

- [ ] `state.combat.domainType` 在领域覆盖时从 p2 标签读取
- [ ] 封闭式(+0): 基准, 无特殊规则
- [ ] 开放式(+8 精密度): 我方展开时对拼+8; 劣势后**不可逃跑**(D.6 增加判断)
- [ ] 半成品(−6 精密度): 我方展开时对拼−6; **必中效果不生效**(+0.2 不叠加); 领域内胜率−30%
- [ ] 开放封闭自由调控: 每回合可选模式(在姿态选择时增加选项)

### D.4 极之番按钮 (§3.6)

- [ ] 点击→消耗 80CE → 胜率+70 (术式性能 ×1.5)
- [ ] 不设硬性次数锁; CE 80 为自然节制
- [ ] 使用后设 `maxPenalty=true`; 下回合 `stamCostMul ×1.5`
- [ ] `maxPenalty` 在新回合体力轮时清除
- [ ] 领域 vs 极之番 Tooltip: "领域胜率+100/熔断锁术式" "极之番胜率+70/仅锁体力"

### D.5 RCT 修复熔断 (§5)

- [ ] 点击→构建修复轮 (5扇区: 完美/标准/代价/失败/反噬)
- [ ] **概率叠加顺序**: 累积风险表(§5.4) → 咒力操纵修正(§5.3) → 意志修正(§2.3b)
- [ ] **归一化**: 五者之和≠100%→按比例缩放, 余数归反噬
- [ ] 反噬最低保底 3%
- [ ] 完美/标准/代价成功: `burnout=false`, **`domainUsed=false`** (重置!)
- [ ] `burnoutAttempts` 累加; 第5次起沿用第4次数据
- [ ] 反噬: 永久失去领域展开 → `state.traits = state.traits.filter(t => normalizeTag(t) !== '领域展开')`

### D.6 逃跑按钮 (§10.3)

- [ ] 点击→构建逃跑轮 (3扇区: 成功/险脱/失败)
- [ ] 成功: `50% + escapeRate()`, 无伤结束
- [ ] 险脱: 25%, 结束, 体质−1
- [ ] **失败**: 25%−escapeRate(), 战斗继续, **下轮对拼你受击伤害 ×1.3**

### D.7 天与咒缚·领域特例 (§4b.6)

- [ ] `isHeavenlyRestricted()`: 检查标签
- [ ] 敌领域活跃 + 零咒力: 必中效果(+0.2倍率)不生效
- [ ] 天逆鉾: 对拼轮+15对拼值; 胜利时缩短领域 2 回合

---

## Phase E: 战术深度

**参考设计**: §2.11~§2.12, §3.7~§3.8, §11.3, §12
**前置**: Phase C buildCombatItems + Phase D 按钮就绪
**改动文件**: `js/combat.js`(黑闪/咒灵易伤/combo/天赋/极番debuff)

### E.1 黑闪系统 (§2.11~§2.12)

- [ ] `bfCombo` 在 `roundStamina()` 重置; 触发时 +1
- [ ] 连击概率: `currentRate × 1.5` (叠 max 3次, cap **35%**)
  - 例: 基础21% → 31.5% → cap35%
- [ ] **Zone 效果**: 触发后 `bfZone=true`, 本回合胜率+10%, CE消耗−2
- [ ] `bfZone` 在 `roundStamina()` 时重置

### E.2 咒灵易伤 (§11.3)

- [ ] 伤害结算: `enemy.type==='curse'` → RCT技法 ×1.5
- [ ] `rct_out` 叠加: ×1.5→×3.0
- [ ] `rct_self` 对咒灵不产生伤害(自愈)

### E.3 Combo + 领域前置 (§3.7)

- [ ] 茈: 本回合已用蒼 or 赫→出现 (每回合重置)
- [ ] 開: `yourDomainActive && domainName==='伏魔御厨子'` →出现
- [ ] Combo 状态在招式轮内追踪, `roundStamina()` 时重置

### E.4 天赋修正 (§12)

- [ ] 半人半咒: `ceMax ×1.2`
- [ ] 特殊受肉体: `ceMax ×1.15`, `bfRate +2%`
- [ ] 星浆体: `hp ×1.25`
- [ ] 双生子: 有领域→术式性能 +2级
- [ ] 六眼: `ceCostMul` 强制 EX(×0.3), 不在 EX 上再乘
- [ ] 双面四臂: `ceMax ×1.3`; `drawStamina()` 末尾 `if (双面四臂) pool += 8` (加在公式后，非公式内)
- [ ] 天与咒缚: `ceMax=0`, `ce=0`, 禁咒力技法, `stamCostMul 额外−0.2`, 领域必中免疫

### E.5 极之番 debuff (§3.6)

- [ ] 使用后→`state.combat.maxPenalty = true`
- [ ] `stamCostMul()` 检测→额外 ×1.5
- [ ] 下回合体力轮前清除

---

## Phase F: UI & 打磨

**参考设计**: §9~§17
**前置**: Phase B~E 功能就绪
**改动文件**: `js/combat.js`(扇区标注/休整/DZ偏袒/放一马/咒具上限/日志/debug), `index.html`(DZ条元素/偏袒标注行)

### F.1 轮盘扇区标注 (§15)

- [ ] 技法扇区三行: 技法名 / −X体 −Y咒 / +Z胜
- [ ] 黑闪触发: 扇区名追加 ⚡
- [ ] 无消耗项: 显示 −0

### F.2 战后休整 (§6.3)

- [ ] 充分: `hp=staminaMax()`, `ce=ceMax()`, 重伤清除
- [ ] 短暂: `hp=floor(staminaMax()×0.6)`, `ce=floor(ceMax()×0.5)`
- [ ] 勉强: `hp=floor(staminaMax()×0.3)`
- [ ] 恶化: 体质 `dimMod −1`

### F.3 DZ 显示 + 偏袒标注 (§2.10)

- [ ] 资源条: `cbDZBar/cbDZVal`(你DZ+增速) + `cbEDZBar/cbEDZVal`(敌DZ+增速)
- [ ] 对拼轮上方显示: `⚖ 偏袒 +X → 你 (敌DZ% − 你DZ%)`
- [ ] 偏袒为负时箭头反向, 红色标注
- [ ] 致命互击扇区: DZ≥50% 出现(视觉加红提示)

> DZ bias 计算已在 B.6 对拼轮中实现, F.3 仅负责界面显示。

### F.4 放一马 (§10.2)

- [ ] 败北基准: 放一马偏移 = **5%** (非25%)
- [ ] 魅力加成: 最高+8% (SSS+)

### F.5 咒具上限 (§11.1)

- [ ] `activeTools`: 按抽取顺序取前 3 件生效
- [ ] 超出 3 件仅视觉, 不叠加数值
- [ ] 同种不叠加, 取最高等级

### F.6 战斗日志

- [ ] `state.combat.log = []`
- [ ] 每发结算 push: `[Turn T] 技法名: ±消耗 X胜 (⚡黑闪)`
- [ ] p4_result 面板追加折叠日志

### F.7 Debug 面板 (§17)

- [ ] `?debug` → 侧边栏底部测试面板
- [ ] 预设按钮: 随机SSS/B/D角色 → 直跳p4
- [ ] 手动维度下拉框 + [生成并进入p4]

---

## 实施约定

1. **每阶段 commit**: `git add js/ index.html style.css && .\check-braces.ps1 && git commit -m "Phase X.Y: desc"`
2. **参考设计**: 改动前查 `BATTLE-DESIGN.md` 对应 §
3. **测试**: 浏览器打开 `index.html` → p1+p2 抽取角色 → p4 验证
4. **疑问**: 存疑记录到 commit message 或对话中, 不跳过
5. **追踪**: 每个 checkbox 完成后立即 commit, commit 后用 ✓ 标记

## 关键验证参考值

| 场景 | 预期 | 计算 |
|------|------|------|
| 体质C(体力轮) | pool=10 | `max(8, floor(6+120×0.04))` |
| 体质EX(体力轮) | pool=34 | `max(8, floor(6+700×0.04))` |
| 天与咒缚+体术SSS | 暴君·极=4体 | `12×(0.6-0.2)` |
| 六眼+効率EX | 茈消耗30CE | `100×0.3` (EX索引, 不叠) |
| CE上限SSS | ceMax=600 | 基础600+天赋修正 |
| CE上限EX | ceMax=999 | EX max value (非∞) |
| 黑闪率最大值 | 21%→35% | `3+12+3+4+2=25%`(卡21%), 连击 cap35% |
| 甚尔hp/体力池 | hp=520, pool=26 | `max(8, floor(6+520×0.04))` |
| 领域持续时间(EX) | 7回合 | `3+floor(9/2)` |
| 放一马基准 | 5% | 魅力最高+8% |
| 咒具上限 | 3件 | 超出仅视觉 |
