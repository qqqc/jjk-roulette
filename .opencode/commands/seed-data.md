---
description: 修改 SEED_DATA 游戏数据后自动校验括号平衡
agent: general
---

Modify SEED_DATA in `index.html` based on: $ARGUMENTS

Before editing, first understand the current state:

!`powershell -Command "(Select-String -Path 'index.html' -Pattern 'id:\"p[0-9]' -AllMatches).Matches | ForEach-Object { $_.Value } | Group-Object | ForEach-Object { $_.Name + ' (' + $_.Count + ' rounds)' }"`

!`powershell -Command "(Select-String -Path 'index.html' -Pattern '{l:\"[^\"]' -AllMatches).Matches.Count"`

CRITICAL RULES:
1. SEED_DATA is a JavaScript object literal, NOT JSON. Single quotes and trailing commas are legal.
2. After EVERY edit to SEED_DATA, IMMEDIATELY run `.\check-braces.ps1` to validate bracket balance.
3. If validation fails, fix the brackets before proceeding.
4. NEVER use JSON.stringify or JSON.parse when editing SEED_DATA — work with it as JS source.
5. The data structure is: phases → rounds → items, with items having `l` (label), `w` (weight), `c` (color), `d` (description), `tags`, `dim`, `dimMod`, `cond`, `wMods`, `filterDrawn` fields.
