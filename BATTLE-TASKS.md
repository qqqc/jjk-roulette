# 战斗系统 v3 实现任务清单

> **参考**: `BATTLE-DESIGN.md` 对应章节。
> **提交**: 每完成一个 checkbox → `check-braces.ps1` → `git commit -m "Phase X.Y: ..."`
> **测试**: 每阶段完成后浏览器打开, 抽角色进入 p4 验证。

---

## Phase A: 数值体系修复

**参考设计**: §2 (数值体系)

### A.1 重写数值查表函数
- [ ] 新增 `idxOrC(v)`: `v<0?3:Math.max(0,Math.min(9,v))`
- [ ] 删除 `tableLookup(STAM_TABLE,...)` `STAM_TABLE` `CE_TABLE`
- [ ] 重写 `staminaMax()`: `STAM_ARR[idxOrC(dimVal(state.dimensions['体质']))]` + 天赋/受伤修正
  - **验证**: 体质B(5)→160, 体质SSS(8)+天与咒缚→520×1.6=832
- [ ] 重写 `ceMax()`: `CE_ARR[idxOrC(dimVal(state.dimensions['咒力总量']))]` + 意志% + 天赋% + 咒具 + 受伤修正
  - **验证**: 咒力SS(7)+意志C(3)→400, 咒力EX(9)→∞
- [ ] 重写 `stamCostMul()`: 用 `idxOrC(dimVal(state.dimensions['体术']))` 索引 `[1.6,1.4,1.2,1.0,0.9,0.8,0.7,0.6,0.5,0.4]`
- [ ] 重写 `ceCostMul()`: 用 `idxOrC(dimVal(state.dimensions['咒力效率']))` 索引, 六眼→0.3
- [ ] 重写 `winBonus()`: 用 `idxOrC(dimVal(state.dimensions['咒力操纵']))` 索引 `[-8,-5,-3,0,4,8,14,20,28,40]`
- [ ] 重写 `techWinBonus()`: 用 `idxOrC(dimVal(state.dimensions['术式性能']))` 索引 `[-6,-4,-2,0,5,11,18,26,38,55]`
- [ ] 重写 `clashBonus()`: 用 `idxOrC(dimVal(state.dimensions['体术']))` 索引 `[-5,-3,-1,0,2,3,5,8,12,18]`
- [ ] 重写 `dangerGrowth()`: 用 `idxOrC(dimVal(state.dimensions['运势']))` 索引 `[7,5,4,3,2,1.5,1,0.5,0.2,0]`
- [ ] 重写 `bfRate()`: 全用 `idxOrC`, 上限 `Math.min(75, ...)`
- [ ] 重写 `ceDrawRange()`: 用 `idxOrC(dimVal(state.dimensions['意志']))` 索引 `[35,38,42,50,58,68,78,88,94,98]`
- [ ] 重写 `escapeRate()`: 用 `idxOrC(dimVal(state.dimensions['体术']))` 索引 `[-20,-10,-5,0,5,10,18,28,40,55]`

### A.2 修复战斗初始化
- [ ] `initCombat()`: `state.combat.hp = staminaMax()`
- [ ] `initCombat()`: 调用 `drawCe()` 设置 `state.combat.ce`
- [ ] `combatShieldUpdate()`: `state.combat.shield = Math.floor(state.combat.ce * 0.5)`
- **验证**: 浏览器打开 → p1+p2 抽角色 → p4 → 资源条显示正确 HP/CE (非固定值)

---

## Phase B: 添加缺失的轮盘

**参考设计**: §1.1 (回合详细流程), §14 (扇区规格)

### B.1 咒力抽取轮 (p4_prep)
- [ ] 修改 `refreshRound` `type:'combat_prep'`: 构建 CE 范围轮盘 (5-7 扇区) 而非自动结算
- [ ] 轮盘扇区: `Math.floor(ceMax() * ceDrawRange() / 100)` ~ `ceMax()` 均分
- [ ] 旋转后: 写入 `state.combat.ce`, 显示抽取值
- **验证**: p4_prep 出现可旋转转盘, 扇区标注 CE 值

### B.2 体力轮 (p4_action mode='stamina')
- [ ] 新增 `state.combat.mode` 字段
- [ ] `roundStamina()` 改为设置 mode='stamina' 而非直接赋值
- [ ] `refreshRound` 中: mode='stamina' 时构建体力轮 (5-7 扇区)
- [ ] 轮盘扇区: `drawStamina() - 3` ~ `drawStamina() + 3`, 均分
- [ ] 旋转后: `state.combat.stamina = 抽取值`, mode 切换为 'technique'
- **验证**: 每回合先转体力轮, 再进入招式选择

### B.3 对拼轮 (mode='clash')
- [ ] 玩家收手或体力耗尽 → mode='clash'
- [ ] `refreshRound` 中: mode='clash' 时构建对拼轮 (6-8 扇区)
- [ ] 每扇区显示: 你的伤害 / 敌方伤害 (基准×[0.7~1.3])
- [ ] 旋转后: 调用 `resolveDamage()`, 推进时钟, 检查胜负
- [ ] 胜负已决 → `goRound(p4_result_index)`
- [ ] 未决 → `roundStamina()` → mode 回到 'stamina'
- **验证**: 收手后出现对拼转盘 → HP/时钟更新 → 未死则新回合体力轮

---

## Phase C: 敌人招式轮 + 流程修复

**参考设计**: §1.1, §7, §13

### C.1 敌人招式轮
- [ ] 玩家收手后, mode='clash' 之前, 插入 mode='enemy_tech'
- [ ] `refreshRound` 中: mode='enemy_tech' 时构建 enemy 技法轮盘
- [ ] 敌人技法通过 `buildCombatItems(true)` 生成, 过滤敌人体力/CE
- [ ] 玩家代转 1 次 → 结算敌人胜率 → mode='clash'
- **验证**: 收手 → 敌人招式轮(可转) → 对拼轮

### C.2 修复敌人行动频率
- [ ] 从 `stop()` 的 p4_action 分支中**删除**敌方自动反击代码 (原 line ~1735 enemy auto-attack)
- [ ] 敌方仅在 mode='enemy_tech' 时行动 1 次
- **验证**: 玩家出 3 招 → 只吃 1 次敌方反击

### C.3 修复多回合循环
- [ ] 对拼后未决 → `roundStamina()` 重置本回合状态 → mode='stamina'
- [ ] `roundStamina()`: `state.combat.win=0`, `state.combat.enemyWin=0`, stamina 重抽, dangerZone 递增, round++
- **验证**: 非碾压情况下可打 3+ 回合

---

## Phase D: 领域/极之番/RCT/逃跑按钮

**参考设计**: §3.6, §4, §5, §10.3, §16

### D.1 添加按钮 HTML 元素
- [ ] 在 index.html 的 combat-bars div 下方添加 `<div class="btn-combat-row">`
- [ ] 包含按钮: `🌐 领域展开` `🔥 极之番` `🔄 修复熔断` `🏃 逃跑`
- [ ] `refreshRound` 中按条件显示/隐藏按钮 (参考 §16)
- **验证**: DOM 中按钮存在, 条件正确显示/隐藏

### D.2 领域展开按钮 (§4)
- [ ] 点击 → `domainUsed=true` → 消耗 CE→ 敌人有领域→领域对拼; 无→直接命中
- [ ] 直接命中: 击破时钟+2, 敌方HP扣减, 玩家 `burnout=true`, 护盾归零
- [ ] 领域对拼: Phase 1 精密度判定显示 → Phase 2 对拼转盘(4-5扇区) → Phase 3 决着
- **验证**: 甚尔(无领域)→点击→击破+2+熔断; 有领域敌人→完整三阶段

### D.3 极之番按钮 (§3.6)
- [ ] 点击 → `maxUsed=true` → 消耗 CE → 胜率+ (经修正) → 击破+1
- [ ] 下回合 `stamCostMul` 额外 ×1.5 (通过 `state.combat.maxPenalty` 标记)
- **验证**: 极之番 1 次后消失, 下回合消耗显示上升

### D.4 RCT 修复按钮 (§5)
- [ ] 点击 → 构建修复轮 (5 扇区, 概率经 §5.3 修正)
- [ ] 累积风险: 每次尝试 `state.combat.rctAttempts++`, 反噬基础 +5%
- **验证**: 熔断时按钮可见, 转后结果生效

### D.5 逃跑按钮 (§10.3)
- [ ] 点击 → 构建逃跑轮 (3 扇区)
- [ ] 领域对拼中 `btn-combat.escape` 隐藏
- **验证**: 逃跑成功结束战斗, 失败继续

---

## Phase E: 战术深度修复

**参考设计**: §2.11-2.12, §3.7-3.8

### E.1 黑闪连击修复
- [ ] `bfCombo` 在 `roundStamina()` 时重置, 在 `tryBlackFlash()` 触发时 +1
- [ ] 删除 `resolveTechSpin()` 中的 `bfCombo=0`
- [ ] 连击加成: 触发率 = bfRate() + bfCombo × bfRate(), 上限 75%
- **验证**: 连续触发黑闪时概率递增显示, 新回合重置

### E.2 一次性技法强制
- [ ] `ult`/`ult_ce` tier 技法使用后在 `state.combat` 中标记
- [ ] `buildCombatItems`: 检查标记, 已用从池中移除
- [ ] 领域展开/极之番按钮: 二次点击 toast "本场战斗已使用"
- **验证**: 茈/開/术式极限/天与暴君·极 只能用 1 次

### E.3 熔断触发与过滤
- [ ] 领域展开后: `state.combat.burnout = true`
- [ ] `buildCombatItems`: burnout 时过滤规则见 §3.7
- **验证**: 熔断后招式轮仅显示非术式技法

### E.4 极之番 debuff
- [ ] `state.combat.maxPenalty = true` — 在 `roundStamina()` 时检查, 下回合生效
- [ ] `stamCostMul()` 检测此标记, 额外 ×1.5, 回合结束后清除
- **验证**: 极之番使用后下回合技法体力消耗可见上升

---

## Phase F: UI & 打磨

**参考设计**: §9, §14-16

### F.1 轮盘扇区显示技法消耗 (§15)
- [ ] 修改 `buildWheel` `draw()`: 技法名下方追加两行小字 `−X体 −Y咒` 和 `+Z胜`
- [ ] 黑闪触发时: 技法名后加 `⚡`
- **验证**: 招式轮每扇区可见消耗数字

### F.2 战后休整恢复 HP/CE
- [ ] p4_rest 结果应用:
  - 充分休整: `state.combat.hp = staminaMax()`, `ce = ceMax()`, 重伤标签清除
  - 短暂休整: `hp = staminaMax()*0.6`, `ce = ceMax()*0.5`
  - 勉强支撑: `hp = staminaMax()*0.3`
- **验证**: 休整后资源条数值回升

### F.3 战斗日志
- [ ] 新增 `state.combat.log = []` 数组
- [ ] 每回合结算后 push 事件字符串 (技法名 + 伤害 + 状态)
- [ ] 在 p4_result 结果面板中追加折叠日志
- **验证**: 战斗结束后可展开查看回合记录

### F.4 dangerZone 纳入结算 (§A.5)
- [ ] dangerZone ≥ 30%: 敌人暴击率 +15% (对拼伤害 ×1.3)
- [ ] dangerZone ≥ 60%: 敌人暴击率 +30% (对拼伤害 ×1.5)
- **验证**: 高危险区时对拼轮敌伤害明显偏高

---

## 实施约定

1. **每阶段 commit**: `git add index.html && .\check-braces.ps1 && git commit -m "Phase X.Y: desc"`
2. **参考设计**: 改动前查 `BATTLE-DESIGN.md` 对应 §
3. **测试**: 浏览器打开 → p1+p2 抽取到关键维度 → p4 验证
4. **疑问**: 存疑记录到 commit message 或对话中, 不跳过
