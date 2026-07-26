---
description: 引导式添加新的 round 到 SEED_DATA，自动验证括号平衡
agent: general
---

Add a new round to SEED_DATA in `index.html` with the following specifications: $ARGUMENTS

WORKFLOW:
1. First read `index.html` to find the target phase and understand the existing structure.
2. Construct the new round JS object following the exact same patterns as existing rounds:
   - Round: `{id:"pX_YYYY",title:"标题",icon:"🎨",order:N,cond:null|"条件",prop:"属性名",items:[...]}`
   - Item: `{l:"标签",w:N,c:"#RRGGBB",d:"描述",tags:["tag1","tag2"]}`
   - Optional item fields: `dim:{维度名:"等级"}, dimMod:{维度名:"N"}, cond:"条件", filterDrawn:true, wMods:[...]`
3. Insert the new round at the appropriate position within the target phase's rounds array.
4. After editing, IMMEDIATELY run `.\check-braces.ps1` to validate bracket balance.
5. If validation fails, locate and fix the bracket mismatch before saying the task is complete.
6. After validation passes, report the round was successfully added with its id.
