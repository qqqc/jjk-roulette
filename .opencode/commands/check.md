---
description: 运行括号平衡校验，每次修改 SEED_DATA 后执行
---

First, show a quick summary of the current SEED_DATA state:

!`powershell -Command "(Select-String -Path 'index.html' -Pattern 'id:\"p[0-9]' -AllMatches).Matches | ForEach-Object { $_.Value } | Group-Object | ForEach-Object { $_.Name + ' (' + $_.Count + ' rounds)' }"`

!`powershell -Command "(Select-String -Path 'index.html' -Pattern '{l:\"[^\"]' -AllMatches).Matches.Count"`

Then run `.\check-braces.ps1` and report the result. If it fails, locate and fix the bracket mismatch in `index.html`'s `SEED_DATA` section before doing anything else.
