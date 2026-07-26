# 战斗系统 v3 实现任务清单

> **参考**: `BATTLE-DESIGN.md` 对应章节。
> **提交**: 每完成一个 checkbox → `.\check-braces.ps1` → `git commit -m "Phase X.Y: ..."`
> **测试**: 每阶段完成后浏览器打开, 抽角色进入 p4 验证。

---

## Phase A: 数值体系重写

**参考设计**: §2

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
- [ ] `enemyDrawStamina()`: `max(8, floor(6 + ENEMY_TEMPLATES.hp × 0.04))`
- [ ] `drawCe()`: 下限~上限均分扇区 `min(8, max(4, ceil(范围/30)))`, 中间加权×2
- [ ] `initCombat()`: `hp = staminaMax()`, `ce = drawCe()`, `shield = 0`
- [ ] `initCombat()`: 初始化所有 state.combat 字段(参考 §8):
  `selfBlocked=false`, `bfZone=false`, `yourDomainActive=false`, `enemyDomainActive=false`, `domainRemaining=0`, `burnoutAttempts=0`, `activeTools=[]`, `enemyDangerZone=0`, `stance=null`
- [ ] 天与咒缚角色: `ce=0`, `ceMax=0`, `shield=0`

---

## Phase B: 轮盘系统 (phase 驱动)

**参考设计**: §1.0~§1.1, §6, §14

### B.1 Phase 状态机

- [ ] `state.combat.phase` 完整流程: `player_stamina → player_stance → player_tech → enemy_stamina → enemy_tech → clash → (回player_stamina 或 跳p4_result)`
- [ ] 每步 transition 在轮盘旋转后自动切换 phase

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

### B.5 敌人体力轮 (phase='enemy_stamina')

- [ ] 构建: `enemyDrawStamina()-3` ~ `+3` 均分, 玩家代转
- [ ] 转后: phase→`enemy_tech`

### B.6 对拼轮 (phase='clash')

- [ ] 构建 6 扇区: 完全压制/有效打击/互伤/招架吃力/被压制/致命互击
- [ ] 基准伤害: `累计胜率×0.8 + 对拼加值 + random(0~6)` (§10.1)
- [ ] 权重受 DZ bias 修正 (§2.10)
- [ ] 致命互击扇区: DZ≥50% 时出现(替换1扇区)
- [ ] 转后: HP 扣减, 时钟推进
- [ ] 击破时钟: `floor(伤害 ÷ (ENEMY_TEMPLATES.hp上限 ÷ 6))` — 上限HP匀速推进
- [ ] 败势时钟: `floor(敌伤害 ÷ (staminaMax() ÷ 6)) × willClockMul()`
- [ ] 未决→`roundStamina()`(新回合); 已决→`p4_result`

### B.7 多回合循环

- [ ] `roundStamina()`: `phase='player_stamina'`, 重置 `win=0, enemyWin=0`, 重抽 stamina, `dangerZone递增`, `round++`
- [ ] `bfCombo` 在 `roundStamina()` 时重置

---

## Phase C: 敌人系统 (完全对称)

**参考设计**: §3.7, §7, §13

### C.1 `buildCombatItems()` 全面重写

- [ ] **universal**: atk(6,0,10) / heavy(9,0,20) / ce_punch(4,8,24) — 删 ce_blast
- [ ] **advanced**: 按 `normalizeTag()` 匹配 `state.traits/skills`:
  - 简易领域, 领域展延(同时设 selfBlocked), 反转术式·自愈, 反转术式·外放, 结界术, 术式扩张
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

- [ ] `ENEMY_TEMPLATES['fushiguro_toji_kai']`: hp=520, dim 见 §7.1
- [ ] 技法池: 体术·瞬击/连破/先读/暴君·极, 游云·三段打(st:10), 天逆鉾·术式破断(st:8,×1.8), 万里锁链·束缚(st:7), 幽影奇袭(st:6), 重击 (**无"闪避"**)
- [ ] `stanceAI`: default猛攻, hp<20%→逃跑, winGap<-40→流转, enemyBurnout→猛攻
- [ ] `hasDomain=false`

### C.6 敌人姿态 AI (§13.4)

- [ ] 每回合前按 `switches` 顺序检查条件
- [ ] "逃跑"姿态: 敌招式轮后自动触发逃跑轮(成功→结束, 失败→回default)

---

## Phase D: 按钮系统

**参考设计**: §3.6, §3.9, §4, §4b, §5, §10.3, §16

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
- [ ] 敌人有领域→**领域对拼轮**; 无→**直接覆盖**
- [ ] **直接覆盖**: `yourDomainActive=true`, `domainRemaining=calcDomainDur()`, 必中(+0.2倍率) + 领域效果(p2抽取)
- [ ] **领域对拼** (双方都有领域):
  1. 精密度判定: 术式性能+咒力操纵+领域类型加成+结界穿透
  2. 对拼轮(4扇区): 占上风/被压制/对消灭/僵持
  3. 赢方覆盖战场, 输方熔断
- [ ] 领域覆盖: 流程不变, 领域方享必中+领域效果(§4b.2~§4b.3)
- [ ] `domainRemaining` 每回合−1; 归零→`yourDomainActive=false`
- [ ] 我方领域活跃时: 開(御厨子)出现

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
- [ ] 反噬: 永久失去领域展开(移除标签)

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

### E.3 姿态重选 (§1.1②, §3.8)

- [ ] 每回合体力轮后弹出姿态面板, stance 不锁定整场
- [ ] 猛攻/坚牢: 逃跑按钮灰显
- [ ] 流转: 逃跑成功率+10%

### E.4 Combo + 领域前置 (§3.7)

- [ ] 茈: 本回合已用蒼 or 赫→出现 (每回合重置)
- [ ] 開: `yourDomainActive && domainName==='伏魔御厨子'` →出现
- [ ] Combo 状态在招式轮内追踪, `roundStamina()` 时重置

### E.5 天赋修正 (§12)

- [ ] 半人半咒: `ceMax ×1.2`
- [ ] 特殊受肉体: `ceMax ×1.15`, `bfRate +2%`
- [ ] 星浆体: `hp ×1.25`
- [ ] 双生子: 有领域→术式性能 +2级
- [ ] 六眼: `ceCostMul` 强制 EX(×0.3), 不在 EX 上再乘
- [ ] 双面四臂: `stamina池 +8`, `ceMax ×1.3`
- [ ] 天与咒缚: `ceMax=0`, `ce=0`, 禁咒力技法, `stamCostMul 额外−0.2`, 领域必中免疫

### E.6 极之番 debuff (§3.6)

- [ ] 使用后→`state.combat.maxPenalty = true`
- [ ] `stamCostMul()` 检测→额外 ×1.5
- [ ] 下回合体力轮前清除

---

## Phase F: UI & 打磨

**参考设计**: §9~§17

### F.1 轮盘扇区标注 (§15)

- [ ] 技法扇区三行: 技法名 / −X体 −Y咒 / +Z胜
- [ ] 黑闪触发: 扇区名追加 ⚡
- [ ] 无消耗项: 显示 −0

### F.2 战后休整 (§6.3)

- [ ] 充分: `hp=staminaMax()`, `ce=ceMax()`, 重伤清除
- [ ] 短暂: `hp=floor(staminaMax()×0.6)`, `ce=floor(ceMax()×0.5)`
- [ ] 勉强: `hp=floor(staminaMax()×0.3)`
- [ ] 恶化: 体质 `dimMod −1`

### F.3 DZ 显示 + 偏袒 (§2.10, §10.1)

- [ ] 资源条: `cbDZBar/cbDZVal`(你DZ+增速) + `cbEDZBar/cbEDZVal`(敌DZ+增速)
- [ ] 对拼轮上方: `⚖ 偏袒 +X → 你 (敌DZ% − 你DZ%)`
- [ ] DZ bias: `bias = (敌DZ−你DZ)/100` → 乘入各扇区权重
- [ ] 致命互击扇区: DZ≥50% 出现

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

1. **每阶段 commit**: `git add index.html && .\check-braces.ps1 && git commit -m "Phase X.Y: desc"`
2. **参考设计**: 改动前查 `BATTLE-DESIGN.md` 对应 §
3. **测试**: 浏览器打开 → p1+p2 抽取到关键维度 → p4 验证
4. **疑问**: 存疑记录到 commit message 或对话中, 不跳过
