# 战斗系统 v3 实现任务清单

> **参考**: `BATTLE-DESIGN.md` 对应章节。
> **提交**: 每完成一个 checkbox → `.\check-braces.ps1` → `git commit -m "Phase X.Y: ..."`
> **测试**: 每阶段完成后浏览器打开, 抽角色进入 p4 验证。

---

## Phase A: 数值体系重写

**参考设计**: §2

### A.1 查表函数 (删旧建新)

- [ ] 新增 `idxOrC(v)`: `v<0?3:Math.max(0,Math.min(9,v))`
- [ ] 删除 `tableLookup` `STAM_TABLE` `CE_TABLE`

**体力/咒力基础值** (§2.2, §2.3):
- [ ] 定义常量: `STAM_ARR = [30,50,80,120,160,220,300,400,520,700]`
- [ ] 定义常量: `CE_ARR  = [15,30,55,90,140,200,280,400,600,999]`
- [ ] `staminaMax()`: `STAM_ARR[idxOrC(...)]` × 重伤(×0.6) / 残废(×0.4); 天与**不乘系数**
- [ ] `ceMax()`: `CE_ARR[idxOrC(...)]` × 重伤(×0.7) / 残废(×0.5) + 天赋% + 咒具 +30(里香戒指); 天与→0

**体力池公式** (§2.2):
- [ ] `drawStamina()`: `max(8, floor(6 + staminaMax() × 0.04))` (保底8)
- [ ] `enemyStaminaDraw()`: 同上公式, 基于 `ENEMY_TEMPLATES.hp` 查表

**消耗倍率** (§2.5, §2.6):
- [ ] 常量 `STAM_MUL = [1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.5,0.4]`
- [ ] 常量 `CE_MUL = [1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.45,0.3]`
- [ ] `stamCostMul()`: `STAM_MUL[idxOrC(体术)]` + 天与咒缚→额外 −0.2 (最低0.2)
- [ ] `ceCostMul()`: `CE_MUL[idxOrC(效率)]`; 六眼→直接使用 EX 索引(0.3), 不叠加额外系数

**胜率/对拼加值** (§2.7~§2.9):
- [ ] 常量 `WIN_BONUS   = [-8,-5,-3,0,4,8,14,20,28,40]` (咒力操纵)
- [ ] 常量 `TECH_BONUS  = [-6,-4,-2,0,5,11,18,26,38,55]` (术式性能)
- [ ] 常量 `TAIJ_BONUS  = [-10,-7,-4,0,5,10,18,28,40,55]` (体术·对拼)
- [ ] 常量 `TECH_CLASH  = [-8,-5,-2,0,5,12,20,30,42,55]` (术式·对拼)
- [ ] `winBonus()`: `WIN_BONUS[idxOrC(咒力操纵)]`
- [ ] `techWinBonus()`: `TECH_BONUS[idxOrC(术式性能)]`; 领域/极之番 ×1.5
- [ ] `clashBonus()`: `TAIJ_BONUS[i] + TECH_CLASH[j]` (加法, 体术+术式各取索引)

**意志战斗作用** (§2.3b):
- [ ] 常量 `WILL_CLOCK = [1.3,1.2,1.1,1.0,0.9,0.8,0.7,0.6,0.5,0.4]`
- [ ] `willClockMul()`: 索引意志维度, 用于败势时钟推进
- [ ] 常量 `WILL_RCT` 5行×10列 (完美/标准/代价/失败/反噬 各10级)
- [ ] `willRCTMod(result, idx)`: 查表返回各结果修正值

**危险区** (§2.10):
- [ ] 常量 `DZ_RATE = [7,5,4,3,2,1.5,1,0.5,0.2,0]`
- [ ] `dangerGrowth()`: `DZ_RATE[idxOrC(运势)]`
- [ ] `enemyDangerGrowth()`: 查 `ENEMY_TEMPLATES.dim.运势` 同上表
- [ ] 每回合: `dangerZone += dangerGrowth()`, `enemyDangerZone += enemyDangerGrowth()`

**黑闪** (§2.11):
- [ ] 常量 `BF_TALENT = [-1,-1,0,0,1,2,4,6,9,12]`
- [ ] `bfRate()`: 3 + `BF_TALENT[i]` + 运势高于C每级+0.5 + 标签(黑闪+4/受肉体+2)
- [ ] 上限 **35%** (非75%)
- [ ] 六眼不参与黑闪
- [ ] 连击: `currentRate × 1.5` (叠3次, cap 35%)

**初始CE抽取** (§2.4):
- [ ] 常量 `CE_DRAW_LO = [35,38,42,50,58,68,78,88,94,98]`
- [ ] `ceDrawLower()`: `ceMax() × CE_DRAW_LO[idxOrC(意志)] / 100`
- [ ] 扇区数: `min(8, max(4, ceil((ceMax() - 下限) / 30)))`
- [ ] `drawCe()`: 从下限~上限均分扇区中随机/转盘抽取

**逃跑率** (§2.13):
- [ ] 常量 `ESCAPE_BASE = [-20,-10,-5,0,5,10,18,28,40,55]`
- [ ] `escapeRate()`: 50 + `ESCAPE_BASE[idxOrC(体术)]`, 上限100%

**领域持续时间** (§4b.1):
- [ ] `calcDomainDur(idx)`: `3 + floor(idx / 2)` (idx=咒力总量 DIM_LEVELS 索引 0~9)

### A.2 战斗初始化

- [ ] `initCombat()`: 初始化 `state.combat` (参考 §8 完整字段列表)
- [ ] 必设: `hp = staminaMax()`, `ce = drawCe()`, `shield = 0`
- [ ] 新增字段初始值: `selfBlocked=false`, `bfZone=false`, `yourDomainActive=false`, `enemyDomainActive=false`, `domainRemaining=0`, `burnoutAttempts=0`, `activeTools=[]`, `enemyDangerZone=0`
- [ ] `enemyHp = ENEMY_TEMPLATES[enemyId].hp`
- [ ] `enemyCe = drawEnemyCe()` (按敌人咒力维度查表抽取)
- [ ] 天与咒缚角色: `ce=0`, `ceMax=0`, `shield=0`

---

## Phase B: 轮盘系统 (phase 驱动)

**参考设计**: §1.0, §1.1, §6, §14

### B.1 Phase 状态机

- [ ] `state.combat.phase` 枚举: `player_stamina → player_stance → player_tech → enemy_stamina → enemy_tech → clash → (回player_stamina)`
- [ ] `roundStamina()`: 设置 `phase='player_stamina'`
- [ ] 每步 transition: 体力轮后→player_stance, 姿势选完后→player_tech, 玩家招耗尽→enemy_stamina, 敌招耗尽→clash

### B.2 咒力抽取轮 (p4_prep)

- [ ] `refreshRound` 检测 `type:'combat_prep'`: 构建 CE 范围轮盘
- [ ] 扇区: 下限~上限均分, 中间加权 ×2
- [ ] 转后: `state.combat.ce = 抽取值`
- [ ] ceMax≤90 时扇区=4(最低), 此为预期设计

### B.3 体力轮 (phase='player_stamina')

- [ ] 构建体力轮: `drawStamina()-3` ~ `drawStamina()+3` 均分, 5~7扇区
- [ ] 中间扇区权重 ×2
- [ ] 转后: `state.combat.stamina = 抽取值`, phase→`player_stance`

### B.4 姿态面板 (phase='player_stance')

- [ ] 体力轮后弹出3卡片: 猛攻/流转/坚牢 (每回合均可重选, 不锁定整场)
- [ ] 点击设 `state.combat.stance`, phase→`player_tech`
- [ ] p4_stance 独立轮次**删除**(姿态集成进交战循环)

### B.5 对拼轮 (phase='clash')

- [ ] 构建对拼轮: 6扇区 (完全压制/有效打击/互伤/招架吃力/被压制/致命互击)
- [ ] 基准伤害: `累计胜率×0.8 + 对拼加值 + random(0~6)` (§10.1)
- [ ] 权重受 DZ bias 修正 (§2.10)
- [ ] 致命互击扇区仅在 DZ≥50% 时出现(替换1扇区)
- [ ] 转后 `resolveDamage()`: HP扣减, 时钟推进
- [ ] 击破时钟: `floor(伤害 ÷ (ENEMY_TEMPLATES.hp上限 ÷ 6))` — 使用上限HP匀速推进
- [ ] 败势时钟: `floor(敌伤害 ÷ (staminaMax() ÷ 6)) × willClockMul()`
- [ ] phase→`player_stamina` (新回合) 或 →`p4_result` (有人倒下)

### B.6 敌人体力轮 (phase='enemy_stamina')

- [ ] 构建敌体力轮: `enemyStaminaDraw()-3` ~ `+3`
- [ ] 玩家代转, 转后 phase→`enemy_tech`

---

## Phase C: 敌人系统 (完全对称)

**参考设计**: §7, §13, §3.7

### C.1 敌人招式轮 (phase='enemy_tech')

- [ ] `buildCombatItems(true)`: 构建敌人技法轮, 过滤同玩家(体力够+CE够+enemyBlocked+姿态)
- [ ] 敌人领域展开作为普通扇区: `ENEMY_TEMPLATES.domain.weight` 控制重量
- [ ] 玩家逐招代转, 每发显示 [−X体 −Y咒 +Z胜] 技法名
- [ ] 体力耗尽或无可负担技法 → phase→`clash`

### C.2 `buildCombatItems` 全面重写

- [ ] universal: atk / heavy / ce_punch (删 ce_blast)
- [ ] advanced: 按 `normalizeTag()` 匹配 state.traits/skills 决定出现
  - 术式反转: 需"反转术式"+"术式反转"两个标签同时存在
  - 领域展延: 使用时设 `selfBlocked=true`
- [ ] innate: 按术式标签分支
  - 无下限: 蒼/赫/茈(combo前置: 本回合用蒼或赫后出现)
  - 御厨子: 解/捌/火焰(始终) + 開(仅 `yourDomainActive && domainName==伏魔御厨子`)
  - 无特殊标签→通用覆盖: 术式·基础/全力/极限
  - 无任何术式标签→不出现术式类技法
- [ ] HR专属: 体术·瞬击/连破/先读/暴君·极
- [ ] 熔断过滤: 隐藏 atk_ce/ult_ce, **术式·基础(id:tech_basic)保留**
- [ ] 天与咒缚: 隐藏所有 ce>0 的技法
- [ ] 体力/CE不足过滤
- [ ] 姿态权重修正 (§3.8): 猛攻×3(极之番/茈/開), 流转×2(反转术式类), 坚牢×3(简易领域/结界术) 等
- [ ] 极之番按钮: 用后隐藏但CE够可再用(不设硬锁)
- [ ] 领域按钮: 用后→熔断, RCT修复后可再显示

### C.3 `normalizeTag()` 模糊匹配

- [ ] `function normalizeTag(s)`: `s.replace(/\(.*?\)/g,'').trim()` — 忽略括号差异
- [ ] `hasTrait(normalized)`: 遍历 `state.traits`/`state.skills` 做 normalizeTag 比较

### C.4 敌人数据 (甚尔)

- [ ] `ENEMY_TEMPLATES['fushiguro_toji_kai']`: hp=520, dim 见 §7.1
- [ ] 技法池: 体术·瞬击, 体术·连破, 五感·先读, 天与暴君·极, 游云·三段打, 天逆鉾·术式破断, 万里锁链·束缚, 重击 (无"闪避")
- [ ] `stanceAI`: default猛攻, switches: hp<20%→逃跑, winGap<-40→流转, enemyBurnout→猛攻
- [ ] hasDomain=false, domain=null

### C.5 敌人姿态 AI (§13.4)

- [ ] 每回合前按 `switches` 顺序检查条件, 首个命中→切换姿态
- [ ] "逃跑"姿态: 敌招式轮后自动触发逃跑轮 (成功→战斗结束, 失败→重回default)

### C.6 删除旧 auto-attack

- [ ] 从 `stop()` / old p4_action 分支删除敌方自动反击代码
- [ ] 敌方仅通过 `phase='enemy_tech'` 由玩家代转行动

---

## Phase D: 按钮系统 (领域/极之番/RCT/逃跑/束缚)

**参考设计**: §3.6, §3.9, §4, §4b, §5, §10.3, §16

### D.1 按钮 HTML + 显示条件

- [ ] 添加 `<div class="btn-combat-row">` 含6按钮
- [ ] 显示条件 (仅 `phase='player_tech'` 可用, 敌人阶段全部灰显):

| 按钮 | 条件 |
|------|------|
| 🌐 领域展开 | 有领域标签 && !domainUsed && !burnout |
| 🔥 极之番 | 有极之番标签 && !burnout (CE节制, 不设硬锁) |
| 🔄 修复熔断 | burnout && 有反转术式标签 |
| 🏃 逃跑 | 流转姿态可用 (猛攻/坚牢灰显, 领域对拼中隐藏) |
| 🔗 束缚·贷 | phase=player_tech && 本回合未用 |
| 🔗 束缚·叠加 | phase=player_tech && 已用束缚·贷(同一回合) |

### D.2 领域展开 + 领域对拼 (§4, §4b)

- [ ] 点击→消耗 80CE → `burnout=true` → 敌人有领域→**领域对拼轮**; 无→**直接覆盖**
- [ ] **直接覆盖**: `yourDomainActive=true`, `domainRemaining=calcDomainDur()`, 必中效果(+0.2倍率), 领域效果(p2抽取)
- [ ] **领域对拼** (双方都有领域):
  1. 精密度判定: `术式性能+咒力操纵+领域类型加成+结界穿透`
  2. 对拼轮(4扇区): 占上风/被压制/对消灭/僵持, 权重由精密度差距决定
  3. 赢方领域覆盖战场, 输方熔断
- [ ] 领域覆盖期间: 战斗流程不变, 领域方享额外优势(§4b.2~4b.3)
- [ ] `domainRemaining` 每回合 −1, 归零→`yourDomainActive=false`
- [ ] 领域方不可再展开领域 (已在熔断)

### D.3 极之番按钮 (§3.6)

- [ ] 点击→消耗 80CE → 胜率+70 (经术式性能×1.5) → 不设硬锁
- [ ] 使用后: 下回合 `stamCostMul` ×1.5 (`state.combat.maxPenalty`)
- [ ] `maxPenalty` 在新回合体力轮后、招式轮前生效, 回合结束清除

### D.4 RCT 修复模型 (§5)

- [ ] 点击→构建修复轮 (5扇区: 完美/标准/代价/失败/反噬)
- [ ] 概率计算顺序: 累积风险表(§5.4)→咒力操纵修正(§5.3)→意志修正(§2.3b)
- [ ] **归一化**: 五者之和≠100%→按比例缩放, 余数归反噬
- [ ] 反噬最低保底 3%
- [ ] 完美/标准/代价成功后: `burnout=false`, **`domainUsed=false`** (重置)
- [ ] `burnoutAttempts` 累加, 第5次起沿用第4次数据
- [ ] 反噬: 永久失去领域展开 (从 traits/skills 中移除领域标签)

### D.5 逃跑按钮 (§10.3, §13.4)

- [ ] 点击→构建逃跑轮 (3扇区: 成功/险脱/失败)
- [ ] 成功: 50% + `escapeRate()` (上限100%), 战斗结束无伤
- [ ] 险脱: 25%, 战斗结束, 体质−1
- [ ] 失败: 25% − `escapeRate()`, 继续战斗, **下轮对拼你受击伤害 ×1.3**
- [ ] 敌人逃跑: stanceAI切到"逃跑"→敌招式轮后自动触发逃跑轮

### D.6 束缚按钮 (§3.9)

- [ ] 束缚·贷: 体力−5, 胜率+25; 体力≤0→本回合招式轮强制结束 (被动跳转到敌人阶段)
- [ ] 束缚·叠加: 需先使用束缚·贷, 体力−9, DZ+10%, 胜率+50
- [ ] 两按钮各限每回合1次, 不设违约后果
- [ ] 束缚不出现于招式轮盘中 (已转为按钮)

### D.7 天与咒缚·领域特例 (§4b.6)

- [ ] `isHeavenlyRestricted()`: 检查天与咒缚标签
- [ ] 敌方领域活跃 + 玩家零咒力: 必中效果(+0.2倍率)不生效
- [ ] 持有天逆鉾: 对拼轮+15对拼值; 胜利时缩短领域持续2回合

---

## Phase E: 战术深度

**参考设计**: §2.11~§2.12, §3.7~§3.8, §11.3, §12

### E.1 黑闪系统 (§2.11~§2.12)

- [ ] `bfCombo` 在 `roundStamina()` 重置, 在触发时 +1
- [ ] 连击概率: `currentRate × 1.5` (叠 max 3次, cap 35%)
- [ ] **Zone 效果**: 触发后 `bfZone=true`, 本回合胜率+10%, CE消耗−2
- [ ] `bfZone` 在回合结束(`roundStamina`)时重置为 false

### E.2 咒灵易伤 (§11.3)

- [ ] 伤害结算时: 若 `enemy.type==='curse'` 且 `tier==='heal'/'atk_rct'` → 伤害 ×1.5
- [ ] `rct_out` 叠加: 对咒灵 ×1.5 ×2 = ×3.0
- [ ] `rct_self` 对咒灵不产生伤害 (自愈不是攻击)

### E.3 姿态重选 + 逃跑约束 (§1.1②, §3.8)

- [ ] 每回合体力轮后弹出姿态面板, stance 不锁定整场
- [ ] 猛攻/坚牢: 逃跑按钮灰显, 不可点击
- [ ] 流转: 逃跑成功率+10%

### E.4 Combo + 领域前置 (§3.7)

- [ ] 茈: 本回合已使用蒼或赫→出现 (每回合重置)
- [ ] 開: `yourDomainActive && domainName==='伏魔御厨子'` →出现
- [ ] Combo 状态在招式轮内追踪, 体力轮重置

### E.5 天赋修正 (§12)

- [ ] 半人半咒: `ceMax ×1.2`
- [ ] 特殊受肉体: `ceMax ×1.15`, `bfRate + 0.02`
- [ ] 星浆体: `hp ×1.25`
- [ ] 双生子: 有领域时 `术式性能 +2级`
- [ ] 六眼: `ceCostMul` 用 EX 索引(×0.3), 不在 EX 上再乘
- [ ] 双面四臂: `stamina池 +8`, `ceMax ×1.3`
- [ ] 天与咒缚: `ceMax=0`, `ce=0`, 禁用咒力技法, `stamCostMul 额外−0.2`, 对领域必中免疫

### E.6 极之番 debuff (§3.6)

- [ ] 使用后设 `state.combat.maxPenalty = true`
- [ ] `stamCostMul()` 检测此旗标→额外 ×1.5
- [ ] 新回合体力轮时清除旗标

### E.7 咒力放出 (生得术式, 非通用)

- [ ] 石流龙术式标签持有者→可在技法池中添加咒力放出技法
- [ ] 通用池已删除此技法 (§3.2)

---

## Phase F: UI & 打磨

**参考设计**: §9~§17

### F.1 轮盘扇区标注 (§15)

- [ ] 技法扇区三行: 技法名 / −X体 −Y咒 / +Z胜
- [ ] 黑闪触发: 扇区名追加 ⚡
- [ ] 无消耗项: 显示 −0

### F.2 战后休整恢复 (§6.3)

- [ ] 充分: `hp=staminaMax()`, `ce=ceMax()`, 重伤标签清除
- [ ] 短暂: `hp=floor(staminaMax()×0.6)`, `ce=floor(ceMax()×0.5)`
- [ ] 勉强: `hp=floor(staminaMax()×0.3)`
- [ ] 恶化: 体质 `dimMod −1` (永久写入 state.dimensions)

### F.3 DZ 显示 + 偏袒 (§2.10, §10.1)

- [ ] 资源条: `cbDZBar/cbDZVal` (你的DZ+增速) + `cbEDZBar/cbEDZVal` (敌DZ+增速)
- [ ] 对拼轮上方显示: `⚖ 偏袒 +X → 你 (敌DZ% − 你DZ%)` (偏袒负则红标)
- [ ] DZ bias 公式: `bias = (敌DZ−你DZ)/100` → 乘入各扇区权重
- [ ] 致命互击扇区: DZ≥50% 才出现

### F.4 放一马概率 (§10.2)

- [ ] 败北基准表: 放一马偏移 = **5%** (非 25%)
- [ ] 魅力加成最高 +8% (SSS+)
- [ ] 附带彩蛋说明 tooltip

### F.5 咒具叠加限制 (§11.1)

- [ ] `activeTools`: 按 p2 抽取顺序取前 3 件生效
- [ ] 超出 3 件仅保留视觉, 不叠加战斗数值
- [ ] 同种咒具不叠加, 仅取最高等级

### F.6 领域 vs 极之番 Tooltip (§3.6)

- [ ] 领域按钮 tooltip: "胜率+100, 熔断后术式全锁 — 体术流首选"
- [ ] 极之番按钮 tooltip: "胜率+70, 仅锁体力 — 术式依赖型保底"

### F.7 战斗日志

- [ ] 新增 `state.combat.log = []`
- [ ] 每发结算后 push: `[回合T] 技法名: ±消耗, X胜 (⚡黑闪)`
- [ ] p4_result 面板追加折叠日志

### F.8 Debug 面板 (§17)

- [ ] `?debug` URL 参数 → 侧边栏底部测试面板
- [ ] 预设按钮: 随机 SSS/B/D 角色 → 直接跳 p4
- [ ] 手动维度下拉框: 体质/体术/咒力总量/效率/操纵/性能/意志/运势/天赋/术式/高级技巧
- [ ] [生成并进入 p4] 按钮

---

## 实施约定

1. **每阶段 commit**: `git add index.html && .\check-braces.ps1 && git commit -m "Phase X.Y: desc"`
2. **参考设计**: 改动前查 `BATTLE-DESIGN.md` 对应 §
3. **测试**: 浏览器打开 → p1+p2 抽取到关键维度 → p4 验证
4. **疑问**: 存疑记录到 commit message 或对话中, 不跳过
