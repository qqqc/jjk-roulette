## 转盘崩溃问题归因

### 问题模式
页面完全无响应——转盘不显示、按钮不可点击、整个 JS 脚本中断。

### 根本原因
每次都是 SEED_DATA（阶段数据）增删改时，JavaScript 对象字面量的 **括号不匹配** 导致整个 `<script>` 块的 JS 解析失败。

**不是 JSON 格式问题**——SEED_DATA 是 JavaScript 对象字面量，不是 JSON。单引号、尾逗号在 JS 中都合法，但**括号深度必须平衡**。

### 触发场景
- 新增轮次/选项时，`]` 或 `}` 未正确闭合
- 删减轮次/选项时，多删了闭合括号
- 插入轮次在 phase 中间位置时，破坏了 phase 的 `]` 闭合

### 预防措施
1. **Git pre-commit hook 已安装**：`.git/hooks/pre-commit` 自动在每次 commit 前检查 `{}/[]` 平衡。
   - 不平衡 → 阻止 commit，提示"Fix before committing"
   - 紧急情况想强制提交 → `git commit --no-verify`
2. **手动检查**：`check-braces.ps1` 可在 PowerShell 中单独运行。
3. 每次修改 SEED_DATA 后，**建议先 commit 基础改动**，再追加功能代码，方便隔离问题。

### 最易出错的场景
- 在 phase 末尾添加/删除轮次时，容易丢失 phase 的闭合括号 `]}`
- 追加代码到已有 `if(wheel){...}` 块时，容易吃掉闭合 `}`
- 插入轮次在 phase 中间位置时，破坏了 phase 的 `]` 闭合
