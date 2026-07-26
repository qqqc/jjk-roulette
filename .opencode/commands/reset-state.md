---
description: 清除 localStorage 中的游戏存档，用于测试重置
---

The game stores state in `localStorage` under keys `jjk_state` and `jjk_data`. To reset:

1. Explain that these are browser localStorage entries and cannot be cleared from terminal.
2. Provide the JavaScript snippet that the user can paste into the browser console (F12) to clear them:
   ```js
   localStorage.removeItem('jjk_state');
   localStorage.removeItem('jjk_data');
   location.reload();
   ```
3. Alternatively, tell the user to open `index.html` in the browser, press F12, go to Application > Local Storage, and delete the entries manually.
