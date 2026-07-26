---
name: jjk-lore
description: Use when creating, modifying, or reviewing SEED_DATA game data in index.html — specifically character identity options, cursed techniques (术式), character traits, settings, timeline events, skill systems, or any JJK canon content. Also use when asked about JJK accuracy or lore consistency of existing game data.
---

# JJK Lore Reference Skill

## When to use

Activate this skill whenever you are:
- Adding new rounds/items to `SEED_DATA` in `index.html`
- Reviewing existing items for canon accuracy
- Asked about whether a character, technique, or setting detail matches JJK canon
- Filling in placeholder/empty rounds (e.g. the era-specific event phases p3_heian through p3_shin, the battle simulation phase p4, or the ending phase p5)

## How to use

1. **Consult the `jjk-lore/` reference directory first.** Use glob(`jjk-lore/**/*`) to find available files, then read the relevant ones.
2. If the local reference doesn't cover the needed information, use `webfetch` to pull from authoritative sources.
3. Only after consulting references, propose edits to SEED_DATA.
4. After editing SEED_DATA, ALWAYS run `.\check-braces.ps1` to validate bracket balance.

## Reference directory structure

The `jjk-lore/` directory is organized as:
- `索引.md` — Top-level quick lookup map (start here)
- `映射表.md` — SEED_DATA fields ↔ JJK canon cross-reference
- `官方设定/` — Rating system, official fanbook Q&A (40+ entries)
- `角色/` — 48 individual character files + 索引.md (one file per character for precise lookup)
- `术式/` — Innate techniques catalog + general skills (domain expansion, black flash, etc.)
- `术语/` — Terminology glossary (咒力, 领域展开, 黑闪, 极之番, 天与咒缚, etc.)
- `时间线/` — Complete story timeline across 9 arcs (0卷 through 新宿决战)

To find a character: glob `角色/*{名字}*` or consult `角色/索引.md` for the faction-based table.
Files should be markdown (`.md`) for best readability by agents.

## Key JJK concepts relevant to the game

The game's SEED_DATA draws from:
- **Identity system (身份奠基)**: 咒术师, 咒灵, 诅咒师, 普通人
- **Curse origin system**: 诅咒诞生自负面情绪/恐惧 — each curse has a specific fear source
- **Power system**: 生得术式 (innate techniques), 领域展开 (domain expansion), 术式反转, 黑闪, 极之番
- **Dimension scale**: E- to EX rating system mirrors JJK's tier system (四级 to 特级)
- **Timeline eras**: 平安时代, 怀玉时期, 0卷时期, 涩谷事变, 死灭回游, 新宿决战
- **Factions**: 咒术高专 (东京/京都), 御三家 (五条/禅院/加茂), 诅咒师, 咒灵

## Authoritative online sources (fallback)

When local references are insufficient:
- 呪術廻戦 Wiki (Fandom): https://jujutsu-kaisen.fandom.com/wiki/
- 萌娘百科 咒术回战: https://zh.moegirl.org.cn/咒术回战
- 百度百科 咒术回战: https://baike.baidu.com/item/咒术回战
