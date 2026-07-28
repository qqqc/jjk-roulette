# NPC 剧情角色系统 · 设计规格书

> v1.0 | 策档先行，怀玉时期为完整范例
> 本文档定义 NPC 系统的数据结构、状态引擎、与现有系统的接口，以及怀玉时期 5 个关键角色的完整配置。

---

## §1. 动机与目标

### 1.1 当前痛点

| 现状 | 问题 |
|------|------|
| 最终敌人只有 1 个模板（`fushiguro_toji_kai`） | 无法根据剧情改变敌人强度、行为、甚至敌友身份 |
| 正典角色仅存在于设计文档中 | 五条、夏油、理子等角色在游戏中没有"实体" |
| 没有队友/盟友系统 | 玩家始终孤身一人面对敌人 |
| p3 时代阶段全为空数组 | 无法体现"穿越时间影响历史"的核心魅力 |
| 剧情选择没有持久后果 | 选了"保护理子"和"暗杀理子"的区别仅存在于标签中，不在角色行为中 |

### 1.2 设计目标

**核心理念：正典角色是一等公民。** 它们不是发完台词就消失的 NPC——它们是 **有状态的、可跨阶段流转的、影响战斗的** 剧情角色。

具体能力：
- 角色从 p3 时代阶段初始化，携带**不同立场**（敌/我/中立）和**关系值**（-100 ~ +100）
- 立场和关系值随剧情选择变化，通过现有的**标签系统**（`state.traits`）驱动
- 当角色是**敌人**时 → 进入 p4 战术战斗，使用该角色的战斗模板
- 当角色是**盟友**时 → 为战斗提供**属性增益**，增益强度受关系值影响
- 角色状态跨 phase 保持（p3 → 后续时代 → p4 → p5 结局）
- 一个角色在不同剧情路线中可以**转换身份**（如甚尔：玩家保护理子 → 敌人 / 玩家暗杀理子 → 盟友）

---

## §2. 系统架构

```
STORY_CHARACTERS (数据层)
    │  定义每个角色的属性、立场模板、探索触发条件
    ↓
state.characterStates + state.relationships (状态层)
    │  运行时存储角色当前立场、生死、关系值
    ↓
标签系统 (标签映射层)
    │  char_* 标签写入 state.traits → 现有 checkCond() 零改动消费
    ↓
applyEffects() 末尾追加 updateCharacterStances()
    │  解析新标签 → 更新角色立场/关系值
    ↓
┌─────────────────────────────────┐
│  剧情阶段 (p3_kai)              │
│  ├─ 初始化角色 (initCharacters) │
│  ├─ 事件轮 → 标签写入 → 立场转换 │
│  └─ 战斗触发 → 查角色立场      │
│       ├─ 敌人 → initCombat() 用模板 │
│       └─ 盟友 → applyAllyBuffs()  │
├─────────────────────────────────┤
│  战斗阶段 (p4)                  │
│  ├─ 敌人数据源扩展 (STORY_CHARACTERS) │
│  ├─ 盟友增益系统 (applyAllyBuffs)    │
│  └─ 战后更新角色状态                  │
├─────────────────────────────────┤
│  结局阶段 (p5)                  │
│  └─ 根据角色最终状态判定结局        │
└─────────────────────────────────┘
```

### 2.1 文件变更清单

| 文件 | 操作 | 行数（约） |
|------|------|-----------|
| `js/seed-data.js` | 新增 `STORY_CHARACTERS` 对象 + 添加怀玉 5 角色 | ~150 |
| `js/game.js` | 新增状态追踪引擎（4 个函数） | ~80 |
| `js/combat.js` | 扩展 `initCombat()` + 新增 `applyAllyBuffs()` | ~50 |

### 2.2 对现有系统的保证

| 系统 | 改动 |
|------|------|
| `ENEMY_TEMPLATES` | **保留不动** — `STORY_CHARACTERS.hostile.combatId` 引用它 |
| `checkCond()` | **零改动** — 角色状态最终体现为 `state.traits` 中的 `char_*` 标签 |
| `applyEffects()` | **仅追加** — 函数末尾新增 `updateCharacterStances()` 调用 |
| 战斗回合流程 | **零改动** — 对拼/出招/体力/时序完全不变 |
| 转盘逻辑 | **零改动** — widget 构建逻辑不变 |
| 其他时代 p3 | **不受影响** — 代码中 `if (!STORY_CHARACTERS[charId]) return` 兜底 |

---

## §3. 数据结构

### 3.1 `STORY_CHARACTERS` — 角色库

顶层的 JS 对象（与 `ENEMY_TEMPLATES` 同级，定义在 `js/seed-data.js`）：

```javascript
const STORY_CHARACTERS = {
  fushiguro_toji_kai: {
    id: "fushiguro_toji_kai",
    name: "伏黑甚尔",
    title: "术师杀手",
    type: "human",          // "human" | "curse"
    faction: "佣兵",        // 咒术高专 / 御三家 / 诅咒师 / 咒灵 / 佣兵 / 星浆体
    era: "怀玉时期",

    // === 战斗属性 === (结构与 ENEMY_TEMPLATES 完全兼容)
    dim: {
      体质: "SSS", 体术: "SSS", 咒力总量: "E-", 咒力效率: "E-",
      咒力操纵: "E-", 术式性能: "E-", 意志: "SS", 运势: "D", 天赋: "SS"
    },
    hp: 520,
    tier: "SSS",
    tierColor: "#ffcc00",
    desc: "零咒力的身躯换来了超越人类的极致肉体。结界无法阻挡他——因为他没有咒力。",
    flair: {
      intro: '"术师？那种东西我杀过不少了。"',
      taunt: '"你的极限，我已经看穿了。"',
      fall: '"到头来……还是没能超越你啊……"'
    },
    techniques: ["体术·瞬击", "体术·连破", "五感·先读", "天与暴君·极",
                 "游云·三段打", "天逆鉾·术式破断", "万里锁链·束缚", "重击"],
    // 以下 uniqueTechniques 已与 ENEMY_TEMPLATES 同步 (2026-07-29)
    uniqueTechniques: {
      "体术·瞬击": { st: 4, ce: 0, win: 18 },
      "体术·连破": { st: 7, ce: 0, win: 30 },
      "五感·先读": { st: 3, ce: 0, win: 12 },
      "天与暴君·极": { st: 12, ce: 0, win: 55 },
      "游云·三段打": { st: 8, ce: 0, win: 42 },
      "天逆鉾·术式破断": { st: 6, ce: 0, win: 35 },
      "万里锁链·束缚": { st: 5, ce: 0, win: 28 },
      "重击": { st: 7, ce: 0, win: 32 }
    },
    hasDomain: false,
    stanceAI: {
      default: "猛攻",
      switches: [
        { when: "hp<20%", to: "逃跑" },
        { when: "winGap<-40", to: "流转" },
        { when: "enemyBurnout", to: "猛攻" }
      ]
    },
    baseDmg: 55,
    dmgRange: [25, 50],
    weakTo: ["领域展开"],
    resistTo: [],
    tools: [
      { name: "天逆鉾",   effect: "术式无效", bonus: { clash: 10 } },
      { name: "游云",      effect: "增幅自身", bonus: { physMod: 1 } },
      { name: "万里锁链", effect: "空间干涉", bonus: { enemyStCost: 2 } }
    ],

    // ========== 新字段：NPC 系统专属 ==========

    // 在每个时代中的初始立场 (根据玩家身份分情况)
    defaultStance: {
      咒术师:   "hostile",   // 高专任务与甚尔对立
      诅咒师:   "neutral",   // 可能是竞争对手或雇主
      咒灵:     "hostile",   // 甚尔不杀咒灵但也不合作
      凡人:     "neutral"    // 他不在意凡人
    },
    defaultRelation: {
      咒术师:   -30,
      诅咒师:    10,
      咒灵:     -40,
      凡人:       0
    },

    // 立场模板：定义该角色在不同立场下的效果
    stanceTemplates: {
      hostile: {
        // 引用已有的战斗模板 (兼容 ENEMY_TEMPLATES)
        combatId: "fushiguro_toji_kai",
        // 战斗全局修正 (叠加到敌人模板上)
        combatMods: {},
        // 战斗场景描述
        battleDesc: "术师杀手站在你面前。游云在手中转了三圈——然后静止。"
      },
      neutral: {
        combatId: null,
        combatMods: {},
        battleDesc: "甚尔看了你一眼——没有敌意，但有兴趣。"
      },
      ally: {
        combatId: null,
        combatMods: {},
        // 盟友增益列表 — 每一项在实际效果中被 relationMultiplier() 缩强
        supportEffects: [
          { type: "dimBuff",    dim: "体术",   base: 1,  icon: "👊" }, // 体术+1级 (关系好可加到+2)
          { type: "dmgBoost",   base: 15,                icon: "🗡" }, // 伤害+15
          { type: "sharedTech", tech: "体术·连破",       icon: "⚡" }  // 可选技法
        ],
        battleDesc: "甚尔走到你旁边——没有看你。但你知道，他的方向就是你战斗的方向。"
      },
      dead: {
        combatId: null,
        combatMods: {},
        supportEffects: [],
        battleDesc: null
      }
    },

    // 关键事件 → 立场转换触发器
    stanceTriggers: [
      { event: "protect_riko",       to: "hostile",  relChange: -60 },
      { event: "assassinate_riko",   to: "ally",     relChange: +70 },
      { event: "toji_defeated",      to: "dead",     relChange:   0 },
      { event: "toji_retreated",     to: "neutral",  relChange: -20 },
      { event: "awaken_gojo_kai",    to: "dead",     relChange:   0 }
    ]
  },

  gojo_satoru_kai: {
    // ... 见 §5.2
  },
  geto_suguru_kai: {
    // ... 见 §5.3
  },
  amanai_riko: {
    // ... 见 §5.4
  },
  kuroi_misato: {
    // ... 见 §5.5
  }
};
```

### 3.2 `state.characterStates` — 运行时状态

在 `state` 对象中新增字段（`js/game.js`）：

```javascript
// 在 state 初始化时新增 (game.js 第 9 行 state={...}):
state.characterStates = {},
state.relationships    = {}
```

`characterStates` 结构：

```javascript
{
  "fushiguro_toji_kai": {
    active: true,        // 已加入当前剧情？
    stance: "hostile",   // "hostile" | "neutral" | "ally" | "dead"
    alive: true,         // 是否存活
    tempBuffs: [],       // [可选] 剧情/战斗中的临时 buff(暂留扩展)
    present: true        // [可选] 当前事件轮中是否有戏份
  },
  "gojo_satoru_kai": {
    active: true,
    stance: "ally",
    alive: true
  },
  // ...
}
```

`relationships` 结构：

```javascript
{
  "fushiguro_toji_kai": -50,
  "gojo_satoru_kai":    40,
  "geto_suguru_kai":    30,
  "amanai_riko":        80,
  "kuroi_misato":       50
}
```

---

## §4. 状态引擎

### 4.1 `initCharacters(era)` — 初始化角色

在进入 p3 时代阶段时调用（p3_kai 启动时）。

```javascript
function initCharacters(era) {
  // 找到所有属于这一时代的角色
  Object.values(STORY_CHARACTERS).forEach(char => {
    if (char.era !== era) return;

    const playerId = state.traits.includes('咒术师') ? '咒术师'
                   : state.traits.includes('诅咒师') ? '诅咒师'
                   : state.traits.includes('咒灵')   ? '咒灵'
                   : '凡人';

    const stance  = char.defaultStance[playerId]  || 'neutral';
    const rel     = char.defaultRelation[playerId] || 0;

    state.characterStates[char.id] = {
      active:  true,
      stance:  stance,
      alive:   true
    };
    state.relationships[char.id] = rel;

    // 写入立场标签 (供 checkCond 消费)
    applyCharTags(char.id, stance, true);
  });
}
```

### 4.2 `updateCharacterStances(tags)` — 立场更新

在 `applyEffects()` 末尾调用，解析 story 轮中产生的 `char_*` / `rel_*` / `story_*` 标签。

```javascript
function updateCharacterStances(tags) {
  if (!tags || !tags.length) return;

  // 第一步：关系值变动
  tags.forEach(tag => {
    // rel_toji_+30 → relations["fushiguro_toji_kai"] += 30
    const relMatch = tag.match(/^rel_(\w+)_([+-]\d+)$/);
    if (relMatch) {
      const charId = aliasToId(relMatch[1]);  // "toji" → "fushiguro_toji_kai"
      const change = parseInt(relMatch[2]);
      if (charId && state.relationships[charId] !== undefined) {
        state.relationships[charId] = clamp(
          state.relationships[charId] + change, -100, 100
        );
      }
    }
  });

  // 第二步：立场触发器检查
  tags.forEach(tag => {
    Object.values(STORY_CHARACTERS).forEach(char => {
      if (!state.characterStates[char.id]) return;
      char.stanceTriggers.forEach(trigger => {
        if (tag === trigger.event) {
          // 更新立场
          state.characterStates[char.id].stance = trigger.to;
          if (trigger.to === 'dead') state.characterStates[char.id].alive = false;
          // 更新关系值
          if (trigger.relChange !== 0) {
            const current = state.relationships[char.id] || 0;
            state.relationships[char.id] = clamp(current + trigger.relChange, -100, 100);
          }
          // 更新标签 (同步到 state.traits)
          applyCharTags(char.id, trigger.to, state.characterStates[char.id].alive);
        }
      });
    });
  });
}
```

### 4.3 `applyCharTags(charId, stance, alive)` — 标签同步

```javascript
// 标签命名规范
// char_{alias}_ally     → 角色是队友
// char_{alias}_enemy    → 角色是敌人
// char_{alias}_dead     → 角色已死
// char_{alias}_alive    → 角色存活
// char_{alias}_neutral  → 角色中立

function applyCharTags(charId, stance, alive) {
  const alias = idToAlias(charId);  // "fushiguro_toji_kai" → "toji"

  // 移除全部旧立场标签
  const oldTags = state.traits.filter(t =>
    t.startsWith(`char_${alias}_`) && !t.startsWith(`char_${alias}_alive`)
  );
  oldTags.forEach(t => {
    const idx = state.traits.indexOf(t);
    if (idx >= 0) state.traits.splice(idx, 1);
  });

  // 添加新立场标签
  const stanceMap = { hostile: 'enemy', ally: 'ally', neutral: 'neutral', dead: 'dead' };
  const newTag = `char_${alias}_${stanceMap[stance] || stance}`;
  if (!state.traits.includes(newTag)) state.traits.push(newTag);

  // 同步生死标签
  const aliveTag = `char_${alias}_alive`;
  const deadTag  = `char_${alias}_dead`;
  if (alive) {
    const di = state.traits.indexOf(deadTag);
    if (di >= 0) state.traits.splice(di, 1);
    if (!state.traits.includes(aliveTag)) state.traits.push(aliveTag);
  } else {
    const ai = state.traits.indexOf(aliveTag);
    if (ai >= 0) state.traits.splice(ai, 1);
    if (!state.traits.includes(deadTag)) state.traits.push(deadTag);
  }
}

// 别名映射 (简写的英文名 → 完整的 character ID)
const _CHAR_ALIAS = {
  toji: "fushiguro_toji_kai",
  gojo:  "gojo_satoru_kai",
  geto:  "geto_suguru_kai",
  riko:  "amanai_riko",
  kuroi: "kuroi_misato"
};
function aliasToId(alias) { return _CHAR_ALIAS[alias] || null }
function idToAlias(id) {
  for (const [a, i] of Object.entries(_CHAR_ALIAS)) { if (i === id) return a; }
  return id;
}
```

### 4.4 `relationMultiplier(rel)` — 关系值 → 增益倍率

```javascript
// 关系值影响盟友增益的强度
function relationMultiplier(rel) {
  if (rel >= 80)  return 2.0;   // 🔥 挚友
  if (rel >= 50)  return 1.6;   // 💚 友好
  if (rel >= 20)  return 1.3;   // 🙂 善意
  if (rel >= -20) return 1.0;   // 😐 中立
  if (rel >= -50) return 0.6;   // 😒 冷淡
  if (rel >= -80) return 0.4;   // 😠 不情愿
  return 0;                      // 💔 仇恨 (他们拒绝帮你)
}
```

---

## §5. 角色配置 · 怀玉时期范例

### 5.1 伏黑甚尔 (fushiguro_toji_kai)

| 维度 | 值 |
|------|-----|
| **阵营** | 佣兵 |
| **默认立场**(玩家是咒术师) | hostile |
| **默认立场**(玩家是诅咒师) | neutral |
| **默认立场**(玩家是凡人) | neutral |
| **初始关系**(咒术师) | -30 |
| **初始关系**(诅咒师) | +10 |

| 事件 | 立场转换 | 关系值变化 |
|------|---------|-----------|
| `protect_riko` (保护理子) | hostile | -60 |
| `assassinate_riko` (暗杀理子) | ally | +70 |
| `toji_defeated` (击败甚尔) | dead | 0 |
| `toji_retreated` (甚尔撤离) | neutral | -20 |
| `awaken_gojo_kai` (五条觉醒) | dead | 0 |

**盟友增益**：
| 效果 | base | 倍率 2.0 (rel≥80) | 倍率 1.0 (rel=0) | 倍率 0.4 (rel=-60) |
|------|------|------------------|-----------------|-------------------|
| 体术维度 +N | 1 | +2 级 | +1 级 | 无 |
| 伤害 +N% | 15 | +30% | +15% | +6% |
| 共享技法 | 体术·连破 | 体术·连破 | 体术·连破 | 体术·连破 |

### 5.2 五条悟·怀玉 (gojo_satoru_kai)

```javascript
gojo_satoru_kai: {
  id: "gojo_satoru_kai",
  name: "五条悟",
  title: "最强·高二",
  type: "human",
  faction: "咒术高专",
  era: "怀玉时期",
  dim: { 体质: "A", 体术: "A", 咒力总量: "SSS", 咒力效率: "EX",
         咒力操纵: "A", 术式性能: "SS", 意志: "A", 运势: "A", 天赋: "EX" },
  hp: 600,
  tier: "SSS",
  tierColor: "#4488ff",
  desc: "东京咒术高专二年生。五条家的六眼继承者。觉醒前只会使用无下限术式的'苍'和无限防御。",
  flair: {
    intro: '"天上天下——唯我独尊。"',
    taunt: '"太弱了——还有谁？"',
    fall: '"……我被这种东西打败？"'
  },
  techniques: ["苍", "无下限·无限防御", "苍·最大输出"],
  uniqueTechniques: {
    "苍": { st: 6, ce: 40, win: 45 },
    "无下限·无限防御": { st: 10, ce: 90, win: 0, eff: "本回合免伤" },
    "苍·最大输出": { st: 10, ce: 65, win: 60 }
  },
  hasDomain: false,  // 怀玉时期还不能展开领域
  stanceAI: { default: "猛攻" },
  baseDmg: 70,
  dmgRange: [35, 65],
  weakTo: ["天与咒缚"],
  resistTo: [],
  tools: [],
  defaultStance: {
    咒术师: "ally", 诅咒师: "hostile", 咒灵: "hostile", 凡人: "neutral"
  },
  defaultRelation: {
    咒术师: 20, 诅咒师: -40, 咒灵: -60, 凡人: 0
  },
  stanceTemplates: {
    hostile: {
      combatId: "gojo_satoru_kai",
      combatMods: {},
      battleDesc: "五条悟摘下了墨镜。六眼锁定了你。'我是最强的——但是你知道这一点，不是吗？'"
    },
    neutral: {
      combatId: null,
      combatMods: {},
      battleDesc: "五条看了你一眼——他的六眼在你身上停了一秒，然后移开了。"
    },
    ally: {
      combatId: null,
      combatMods: {},
      supportEffects: [
        { type: "dimBuff",  dim: "咒力效率", base: 1,  icon: "🔮" },
        { type: "dmgBoost", base: 25,                  icon: "💣" },
        { type: "sharedTech", tech: "苍",               icon: "🌀" }
      ],
      battleDesc: "五条站在你身边。'别拖我后腿。'——他说这话的时候在笑。"
    },
    dead: { combatId: null, combatMods: {}, supportEffects: [], battleDesc: null }
  },
  stanceTriggers: [
    { event: "protect_riko",        to: "ally",    relChange: +30 },
    { event: "assassinate_riko",    to: "hostile", relChange: -70 },
    { event: "awaken_gojo_kai",     to: "ally",    relChange:  0  },  // 立场不变，战力升级
    { event: "gojo_fatally_wounded", to: "dead",    relChange:  0  }
  ]
}
```

### 5.3 夏油杰·怀玉 (geto_suguru_kai)

```javascript
geto_suguru_kai: {
  id: "geto_suguru_kai",
  name: "夏油杰",
  title: "咒灵操术师·高二",
  type: "human",
  faction: "咒术高专",
  era: "怀玉时期",
  dim: { 体质: "A", 体术: "A", 咒力总量: "SS", 咒力效率: "A",
         咒力操纵: "SS", 术式性能: "SS", 意志: "A", 运势: "C", 天赋: "SS" },
  hp: 480,
  tier: "SS",
  tierColor: "#dd8855",
  desc: "东京咒术高专二年生。咒灵操术使用者。可操使数百只咒灵——但此刻他看着天平的倾斜。",
  flair: {
    intro: '"理念之争——只能用术式来回答。"',
    taunt: '"让我看看你值不值得我召唤特级咒灵。"',
    fall: '"……这就是——我的极限。"'
  },
  techniques: ["咒灵召来", "复数咒灵", "特级咒灵·解放", "结界术"],
  uniqueTechniques: {
    "咒灵召来": { st: 5, ce: 20, win: 25 },
    "复数咒灵": { st: 8, ce: 40, win: 38 },
    "特级咒灵·解放": { st: 12, ce: 60, win: 55 },
    "结界术": { st: 6, ce: 30, win: 0, eff: "减敌30%伤害" }
  },
  hasDomain: false,
  stanceAI: { default: "流转" },
  baseDmg: 50,
  dmgRange: [30, 55],
  weakTo: ["天与咒缚"],
  resistTo: [],
  tools: [],
  defaultStance: {
    咒术师: "ally", 诅咒师: "hostile", 咒灵: "hostile", 凡人: "neutral"
  },
  defaultRelation: {
    咒术师: 20, 诅咒师: -30, 咒灵: -80, 凡人: 5
  },
  stanceTemplates: {
    hostile: {
      combatId: "geto_suguru_kai",
      combatMods: {},
      battleDesc: "夏油站在那里——数十只咒灵环绕着他。'保护谁？——有资格的人。'"
    },
    neutral: {
      combatId: null,
      combatMods: {},
      battleDesc: "夏油在远处看着。他的表情很平静——也许在思考什么。"
    },
    ally: {
      combatId: null,
      combatMods: {},
      supportEffects: [
        { type: "dimBuff",   dim: "咒力操纵", base: 1,  icon: "🔧" },
        { type: "dmgReduce", base: 15,                    icon: "🛡" },
        { type: "sharedTech", tech: "结界术",              icon: "🧱" }
      ],
      battleDesc: "夏油向你点了点头。咒灵群在他的身后展开——你的阵地不需要担心了。"
    },
    dead: { combatId: null, combatMods: {}, supportEffects: [], battleDesc: null }
  },
  stanceTriggers: [
    { event: "protect_riko",        to: "ally",    relChange: +25 },
    { event: "assassinate_riko",    to: "hostile", relChange: -60 },
    { event: "geto_shaken",         to: "neutral", relChange: -40 },
    { event: "geto_fallen",         to: "hostile", relChange: -100 },
    { event: "geto_stopped",        to: "ally",    relChange: +15 }
  ]
}
```

### 5.4 天内理子 (amanai_riko)

> **非战斗角色** — 理子没有战斗模板。她的作用在于关系值系统：高关系值影响其他角色的行为和最终结局。

```javascript
amanai_riko: {
  id: "amanai_riko",
  name: "天内理子",
  title: "星浆体",
  type: "human",
  faction: "星浆体",
  era: "怀玉时期",
  dim: { 体质: "D", 体术: "E", 咒力总量: "C", 咒力效率: "D",
         咒力操纵: "E-", 术式性能: "E-", 意志: "A", 运势: "C", 天赋: "E-" },
  hp: 80,
  tier: "D",
  tierColor: "#ffaa44",
  desc: "14岁的少女。被天元选为星浆体——她的身体将承载天元的不朽。",
  // 无战斗字段
  hasDomain: false,
  stanceAI: { default: "逃跑" },
  baseDmg: 0, dmgRange: [0, 0],
  weakTo: [], resistTo: [],
  tools: [],
  techniques: [],
  uniqueTechniques: {},
  defaultStance: {
    咒术师: "neutral", 诅咒师: "neutral", 咒灵: "neutral", 凡人: "neutral"
  },
  defaultRelation: {
    咒术师: 10, 诅咒师: -10, 咒灵: -30, 凡人: 20
  },
  stanceTemplates: {
    hostile:  { combatId: null, combatMods: {}, supportEffects: [], battleDesc: null },
    neutral:  { combatId: null, combatMods: {}, supportEffects: [], battleDesc: null },
    ally: {
      combatId: null,
      combatMods: {},
      supportEffects: [
        { type: "dimBuff",  dim: "意志",   base: 1,  icon: "💫" },
        { type: "healRate", base: 10,                 icon: "💚" }
      ],
      battleDesc: "理子在你身后——你能感觉到她的视线。她相信你。"
    },
    dead:    { combatId: null, combatMods: {}, supportEffects: [], battleDesc: null }
  },
  stanceTriggers: [
    { event: "protect_riko",      to: "ally",    relChange: +40 },
    { event: "assassinate_riko",  to: "dead",    relChange: -100 },
    { event: "riko_saved",        to: "ally",    relChange: +80 },
    { event: "riko_accepts_fate", to: "neutral", relChange: 0 },
    { event: "riko_refused",      to: "ally",    relChange: +60 },
    { event: "you_became_star",   to: "ally",    relChange: +100 },
    { event: "riko_flees",        to: "ally",    relChange: +70 }
  ]
}
```

### 5.5 黑井美里 (kuroi_misato)

> **辅助角色** — 有轻度战斗能力但主要是理子的守护者。可以与理子形成协同增益。

```javascript
kuroi_misato: {
  id: "kuroi_misato",
  name: "黑井美里",
  title: "星浆体随从",
  type: "human",
  faction: "星浆体",
  era: "怀玉时期",
  dim: { 体质: "C", 体术: "C", 咒力总量: "D", 咒力效率: "C",
         咒力操纵: "C", 术式性能: "E-", 意志: "S", 运势: "D", 天赋: "D" },
  hp: 120,
  tier: "C",
  tierColor: "#4488aa",
  desc: "天内理子的侍从兼守护者。如果理子是星——她愿意做理子身后的黑暗。",
  hasDomain: false,
  stanceAI: { default: "坚牢" },
  baseDmg: 25,
  dmgRange: [15, 30],
  weakTo: [],
  resistTo: [],
  tools: [],
  techniques: ["防御姿态", "舍身守护"],
  uniqueTechniques: {
    "防御姿态": { st: 5, ce: 0, win: 0, eff: "减50%伤害" },
    "舍身守护": { st: 10, ce: 0, win: 35 }
  },
  defaultStance: {
    咒术师: "neutral", 诅咒师: "hostile", 咒灵: "hostile", 凡人: "neutral"
  },
  defaultRelation: {
    咒术师: 5, 诅咒师: -20, 咒灵: -40, 凡人: 5
  },
  stanceTemplates: {
    hostile: {
      combatId: "kuroi_misato",
      combatMods: {},
      battleDesc: "黑井挡在你面前。她的眼神告诉你——她不会让。"
    },
    neutral: {
      combatId: null,
      combatMods: {},
      battleDesc: "黑井站在理子身边。她打量着你——在判断你是敌人还是朋友。"
    },
    ally: {
      combatId: null,
      combatMods: {},
      supportEffects: [
        { type: "dimBuff",  dim: "体质",   base: 1,  icon: "🏋️" },
        { type: "shield",   base: 20,                 icon: "🛡" }  // 额外护盾值
      ],
      battleDesc: "黑井护在你和理子之间。她的防御姿态不需要咒力——只需要决心。"
    },
    dead: { combatId: null, combatMods: {}, supportEffects: [], battleDesc: null }
  },
  stanceTriggers: [
    { event: "protect_riko",      to: "ally",    relChange: +40 },
    { event: "assassinate_riko",  to: "hostile", relChange: -100 },
    { event: "save_kuroi",        to: "ally",    relChange: +80 },
    { event: "riko_dead",         to: "dead",    relChange: 0 }
  ]
}
```

---

## §6. 战斗系统集成

### 6.1 扩展 `initCombat()` — 兼容 STORY_CHARACTERS

修改 `js/combat.js` 中的 `initCombat()` 函数。

**核心逻辑**：先查 `STORY_CHARACTERS`，有则从中提取战斗数据；如果没有，回退到 `ENEMY_TEMPLATES`。

```javascript
// 在 initCombat() 开头注入

function initCombat(enemyId) {
  // 优先从 STORY_CHARACTERS 中获取
  var storyChar = STORY_CHARACTERS[enemyId];
  var combatTemplate;

  if (storyChar) {
    // 从角色故事状态中构建战斗模板
    combatTemplate = buildEnemyFromStoryChar(storyChar);
  } else {
    // 回退到旧模板
    combatTemplate = ENEMY_TEMPLATES[enemyId];
  }

  if (!combatTemplate) return;
  var e = combatTemplate;

  // ... 后面的逻辑与现有代码一致，只是将 ENEMY_TEMPLATES[enemyId] 替换为 e
  state.traits = state.traits.filter(function(t) {
    return t.indexOf('bt_') !== 0 && t.indexOf('enemy_') !== 0;
  });
  state.traits.push('enemy_' + enemyId);
  // ... 其余不变
}

// 新函数：从 STORY_CHARACTERS 中构建战斗模板
function buildEnemyFromStoryChar(char) {
  // 基准数据直接复用 STORY_CHARACTERS 的字段
  // 结构与 ENEMY_TEMPLATES 完全兼容
  var t = {
    id: char.id,
    name: char.name,
    title: char.title,
    type: char.type,
    dim: Object.assign({}, char.dim),
    hp: char.hp,
    tier: char.tier,
    tierColor: char.tierColor,
    desc: char.desc,
    flair: char.flair,
    techniques: char.techniques.slice(),
    uniqueTechniques: Object.assign({}, char.uniqueTechniques),
    hasDomain: char.hasDomain,
    stanceAI: Object.assign({}, char.stanceAI),
    baseDmg: char.baseDmg,
    dmgRange: char.dmgRange.slice(),
    weakTo: char.weakTo.slice(),
    resistTo: char.resistTo.slice(),
    tools: char.tools.map(function(t) { return Object.assign({}, t); })
  };

  // 上下修正：根据角色当前状态调整
  var cs = state.characterStates[char.id];
  if (cs && !cs.alive) return null;  // 已死的角色不能战斗
  var hostileTpl = char.stanceTemplates.hostile;
  if (hostileTpl && hostileTpl.combatMods) {
    // 关系越差 → 敌人越强？ (可选设计)
  }

  return t;
}
```

### 6.2 盟友增益系统

在 `initCombat()` 完成后立即调用 `applyAllyBuffs()`。

```javascript
// 在 initCombat() 完成初始化后、进入战斗循环前调用

function applyAllyBuffs(c) {
  if (!c || !c.active) return;

  c.allyDmgBoost    = 0;   // 伤害加成
  c.allyDmgReduce   = 0;   // 伤害减免
  c.allyHealRate    = 0;   // 恢复率加成
  c.allyShieldBonus = 0;   // 额外护盾
  c.bonusTechniques = [];  // 盟友共享的技法
  c.tempDims        = {};  // 临时维度加成

  Object.values(STORY_CHARACTERS).forEach(function(char) {
    var cs = state.characterStates[char.id];
    if (!cs || cs.stance !== 'ally' || !cs.alive) return;

    var effs = char.stanceTemplates.ally.supportEffects;
    var rel  = state.relationships[char.id] || 0;
    var mult = relationMultiplier(rel);

    effs.forEach(function(eff) {
      if (eff.type === 'dimBuff') {
        var boost = Math.floor(eff.base * mult);
        c.tempDims[eff.dim] = (c.tempDims[eff.dim] || 0) + boost;
      } else if (eff.type === 'dmgBoost') {
        c.allyDmgBoost += Math.floor(eff.base * mult);
      } else if (eff.type === 'dmgReduce') {
        c.allyDmgReduce += Math.floor(eff.base * mult);
      } else if (eff.type === 'healRate') {
        c.allyHealRate += Math.floor(eff.base * mult);
      } else if (eff.type === 'shield') {
        c.allyShieldBonus += Math.floor(eff.base * mult);
      } else if (eff.type === 'sharedTech') {
        c.bonusTechniques.push(eff.tech);
      }
    });
  });

  // 将共享技法加入到玩家可选技法中（在 buildCombatItems 中消费 c.bonusTechniques）
  // 维度加成
  for (var dim in c.tempDims) {
    var curV = dimVal(state.dimensions[dim]);
    state.dimensions[dim] = dimLv(curV + c.tempDims[dim]);
  }

  if (c.allyShieldBonus > 0) c.shield += c.allyShieldBonus;
}
```

### 6.3 战后更新角色状态

战斗结束时，根据结果更新相关角色的立场和关系。

```javascript
// 在 v3HandleResult 函数末尾添加

function updateCharAfterCombat(resultLabel) {
  var enemyId = state.combat.enemyId;
  var storyChar = STORY_CHARACTERS[enemyId];
  if (!storyChar) return;

  var cs = state.characterStates[enemyId];
  if (!cs) return;

  if (resultLabel.includes('完胜') || resultLabel.includes('苦战') || resultLabel.includes('惨胜')) {
    // 玩家胜 → 敌方角色死亡
    cs.stance = 'dead';
    cs.alive  = false;
    applyCharTags(enemyId, 'dead', false);
  } else if (resultLabel.includes('败退') || resultLabel.includes('惨败')) {
    // 玩家败 → 关系值恶化
    state.relationships[enemyId] = clamp((state.relationships[enemyId] || 0) - 30, -100, 100);
  } else if (resultLabel.includes('放你一马')) {
    // 敌人放过 → 关系值微妙变化
    state.relationships[enemyId] = clamp((state.relationships[enemyId] || 0) - 10, -100, 100);
  }
}
```

---

## §7. 集成到 p3_kai 的事件轮

### 7.1 事件轮中的标签系统

p3_kai 的所有 round item 使用以下标签影响角色：

```javascript
// 示例：p3_kai_shot 枪响分叉轮
{
  id: "p3_kai_shot",
  title: "枪响·分叉",
  order: 8,
  items: [
    // 保护理子 → 甚尔敌人、五条夏油队友
    {
      l: "推开理子，挡住子弹",
      w: 2,
      c: "#44cc44",
      d: "你比甚尔更快。理子被扑倒在地——子弹打入你身后的石柱。",
      tags: [
        "protect_riko",       // → 触发 stanceTriggers: toji→hostile, gojo→ally, geto→ally
        "rel_riko_+40",       // → 关系值变动
        "rel_gojo_+20",
        "rel_geto_+15",
        "怀玉_理子_存活",
        "怀玉_F8_看破"
      ]
    },
    // 暗杀理子 → 甚尔队友、五条夏油敌人
    {
      l: "与甚尔联手，枪杀理子",
      w: 1,
      c: "#661122",
      d: "你和甚尔对了一下眼神。子弹穿透了理子——五条的怒吼在结界里爆炸。",
      tags: [
        "assassinate_riko",   // → 触发 stanceTriggers: toji→ally, gojo→hostile, geto→hostile
        "rel_toji_+70",
        "rel_gojo_-80",
        "rel_geto_-70",
        "怀玉_理子_死亡",
        "怀玉_夏油_动摇"
      ]
    },
    // 旁观
    {
      l: "站在原地——不干预",
      w: 2,
      c: "#888866",
      d: "你看着甚尔扣下扳机。五条和夏油来不及。理子倒下。一切按照原剧情发生了。",
      tags: [
        "怀玉_理子_死亡",
        "怀玉_夏油_动摇",
        "rel_gojo_-15",
        "rel_geto_-15"
      ]
    }
  ]
}
```

### 7.2 初始化时机

在 `switchPhase()` 中，当进入 p3 时代阶段时，触发角色初始化：

```javascript
// 在 switchPhase() 函数中 phase 切换时：
if (DATA.phases[i].id === 'p3_kai' && !state.characterStates._initialized_kai) {
  initCharacters('怀玉时期');
  state.characterStates._initialized_kai = true;
}
```

或采用更简洁的方式：在 `applyEffects()` 末尾检查是否需要初始化：

```javascript
// 在 applyEffects() 末尾
if (state.traits.includes('era_怀玉时期') && !state.characterStates._initialized_kai) {
  initCharacters('怀玉时期');
  state.characterStates._initialized_kai = true;
}
```

---

## §8. p4 敌人轮整合

目前 p4 的索敌轮 (`p4_enemy`) 只有一个选项（甚尔）。引入 NPC 系统后，索敌轮变成动态的：

```javascript
// p4_enemy 改为动态轮 — 根据角色状态生成敌人选项
{
  id: "p4_enemy",
  title: "索敌·遭遇判定",
  icon: "👁",
  order: 1,
  prop: "敌人",
  items: buildEnemyItems() // 改为函数调用 (需要在游戏初始化时求值)
}

// 或者用更简单的写法：在 wheel 构建函数中动态替换
function buildEnemyItems() {
  var items = [];
  // 遍历活跃的角色，找出所有 hostile 且 alive 的
  for (var id in state.characterStates) {
    var cs = state.characterStates[id];
    if (cs.stance === 'hostile' && cs.alive) {
      var char = STORY_CHARACTERS[id];
      if (char && char.stanceTemplates.hostile.combatId) {
        items.push({
          l: char.name + '·' + char.title,
          w: 12,
          c: char.tierColor,
          d: char.desc,
          tags: ['enemy_' + char.stanceTemplates.hostile.combatId]
        });
      }
    }
  }
  // 如果没有剧情敌人 → 默认甚尔 (兜底)
  if (items.length === 0) {
    items.push({
      l: "伏黑甚尔·天与暴君",
      w: 12,
      c: "#ffcc00",
      d: "天与咒缚的极致——零咒力换来了超越人类的肉体。",
      tags: ["enemy_fushiguro_toji_kai"]
    });
  }
  return items;
}
```

### 8.1 如果多个敌人都处于 hostile 状态

转盘上出现多个敌对角色选项（如甚尔 + 夏油同时敌对），玩家靠转盘随机遭遇。这是**有意为之的设计**——不是所有敌人都能一个一个打，命运也需要参与。

如果 p4_enemy 转出了某个敌人，但该敌人已经 dead → 自动触发 `battle_avoided`。

---

## §9. p5 结局系统集成

结局轮根据**最终角色状态**生成可能的结局：

```javascript
// p5 的 items 用 cond 检查角色标签
{ cond: ["char_riko_alive", "char_toji_dead", "char_geto_ally"],
  l: "守护者·结局", ... },
{ cond: ["char_riko_dead", "char_gojo_ally", "char_geto_shaken"],
  l: "未能抵达的明日·结局", ... },
{ cond: ["char_toji_ally", "char_gojo_dead"],
  l: "术师杀手·终局", ... },
{ cond: ["char_geto_fallen", "char_geto_stopped"],
  l: "摇摇欲坠的天平·结局", ... }
```

---

## §10. 标签速查

### 10.1 角色立场标签 (char_*)

| 标签 | 含义 | 生产方 |
|------|------|--------|
| `char_toji_ally` | 甚尔队友 | `updateCharStances()` |
| `char_toji_enemy` | 甚尔敌人 | `updateCharStances()` |
| `char_toji_dead` | 甚尔已死 | `updateCharStances()` |
| `char_toji_neutral` | 甚尔中立 | `updateCharStances()` |
| `char_gojo_ally` | 五条队友 | `updateCharStances()` |
| `char_gojo_enemy` | 五条敌人 | `updateCharStances()` |
| `char_geto_ally` | 夏油队友 | `updateCharStances()` |
| `char_geto_enemy` | 夏油敌人 | `updateCharStances()` |
| `char_riko_ally` | 理子支持 | `updateCharStances()` |
| `char_riko_dead` | 理子已死 | `updateCharStances()` |
| `char_kuroi_ally` | 黑井支持 | `updateCharStances()` |

### 10.2 关系值标签 (rel_*)

| 标签 | 作用 |
|------|------|
| `rel_toji_+30` | 甚尔关系 +30 |
| `rel_gojo_-20` | 五条关系 -20 |
| `rel_riko_+40` | 理子关系 +40 |
| `rel_geto_-50` | 夏油关系 -50 |

这些标签在 `updateCharacterStances()` 中被消费后**不保留**在 `state.traits` 中（避免污染）。关系值仅存储在 `state.relationships` 中。

### 10.3 剧情标记标签 (story_* / 怀玉_*)

沿用 GYOK-DESIGN.md 的标签体系（`怀玉_理子_存活`、`怀玉_五条_完整觉醒` 等），这些是剧情标记，不直接被 NPC 系统消费，但通过 `stanceTriggers[].event` 映射为角色立场变化。

---

## §11. 实施优先级

| 优先级 | 任务 | 文件 | 产出 |
|--------|------|------|------|
| **P0** | STORY_CHARACTERS 数据 + 怀玉 5 角色 | `seed-data.js` | 角色库就绪，可供引擎引用 |
| **P0** | 状态引擎 (init/update/tags 4 个函数) | `game.js` | 角色状态可追踪 |
| **P1** | 战斗集成 (initCombat 扩展 + applyAllyBuffs) | `combat.js` | 敌人/盟友功能上线 |
| **P1** | p3_kai 事件轮填充 | `seed-data.js` | 怀玉时期可游玩 |
| **P2** | p4 动态敌人轮 | `seed-data.js` | 多个可能的敌人 |
| **P2** | p5 结局系统 | `seed-data.js` | 基于角色状态的结局 |
| **P3** | 后续时代的角色（高专/涩谷/新宿） | `seed-data.js` | 扩大游戏深度 |

### 建议实现顺序

1. 先在 `seed-data.js` 中放下 `STORY_CHARACTERS` 对象（5 个角色）
2. 在 `game.js` 中添加 4 个引擎函数（initCharacters、updateCharacterStances、applyCharTags、relationMultiplier）
3. 在 `applyEffects()` 末尾添加 `updateCharacterStances()` 调用
4. 在 `combat.js` 中修改 `initCombat()` + 添加 `applyAllyBuffs()`
5. 在 `switchPhase()` 或 `applyEffects()` 中添加时代进入时的角色初始化
6. 用一次手动验证：p3_kai 的事件轮（已有 GYOK-DESIGN.md 中的完整设计）
7. 所有改动完成后运行 `.\check-braces.ps1`

---

## 附录A：关系值影响速查

| 关系值范围 | 倍率 | 盟友增益强度 | 描述 |
|-----------|------|------------|------|
| 80 ~ 100  | 2.0x | 满强度 | 挚友 / 恋人 / 生死之交 |
| 50 ~ 79   | 1.6x | 强强度 | 友好 / 战友 / 互相信任 |
| 20 ~ 49   | 1.3x | 中强度 | 善意 / 熟人 / 有好感 |
| -19 ~ 19  | 1.0x | 基准线 | 中立 / 陌生人 / 无所谓 |
| -50 ~ -20 | 0.6x | 弱强度 | 冷淡 / 不情愿帮助 |
| -80 ~ -51 | 0.4x | 微强度 | 不情愿 / 被迫帮忙 |
| -100 ~ -81 | 0x | 无效 | 仇恨 / 拒绝帮助你 |

## 附录B：盟友增益效果类型

| type | 效果 | 示例值 (base) | 受倍率影响 |
|------|------|-------------|-----------|
| `dimBuff` | 临时维度等级 +N | 1 | ✅ 是 |
| `dmgBoost` | 伤害加成 +N% | 15 | ✅ 是 |
| `dmgReduce` | 伤害减免 +N% | 15 | ✅ 是 |
| `healRate` | 恢复率 +N% | 10 | ✅ 是 |
| `shield` | 额外护盾值 +N | 20 | ✅ 是 |
| `sharedTech` | 可选技法添加 | "体术·连破" | ❌ 固定 |

## 附录C：跨时代角色状态保留

同一角色可能在后续时代再次出现。例如：
- 甚尔在怀玉时期可以死/活 → 活着的甚尔可能在涩谷时期作为第三方出现
- 夏油在怀玉时期的堕落/阻止/死亡 → 影响 0 卷时期百鬼夜行是否发生
- 理子在怀玉时期的死活 → 影响天元的稳定性，进而影响涩谷/死灭的结界状态

跨时代保留通过 `state.characterStates` 全局单例实现，不受 phase 切换影响。

---

*终*
