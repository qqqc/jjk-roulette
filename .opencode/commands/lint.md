---
description: 一键深度校验：括号平衡 + SEED_DATA 结构完整性
---

Run both validation scripts sequentially and report combined results:

1. First: `.\check-braces.ps1` — bracket/brace balance and d-string integrity
2. Then: `.\check-data.ps1` — deep validation (duplicate IDs, dimension values, missing fields, phase ordering)

If either fails, locate and fix the issue before proceeding. Report which checks passed and which failed.
