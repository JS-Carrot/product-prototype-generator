# HTML 交互原型施工规范

目标：**单文件、零依赖、双击即开、真能点。**

---

## 一、文件骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>…</title>
  <style>/* token → 组件 → 响应式，全内联 */</style>
</head>
<body>
  <div id="app"></div>
  <div id="mask" hidden></div>   <!-- 弹窗遮罩 -->
  <div id="toast" hidden></div>
  <script>/* 数据 → 组件 → 页面 → 路由 → 事件 */</script>
</body>
</html>
```

禁止：CDN、Google Fonts、外链图片、外部 JS。**离线可用是硬指标**（客户会议室经常没网）。

---

## 二、三层结构

```js
/* 1. 数据层：唯一可变状态 */
const DB = {
  orders: [...],      // 实体
  devices: [...],
};
const ui = {
  page: 'overview',
  params: {},
  filters: {},        // 各页筛选条件
  selected: new Set()
};

/* 2. 渲染层：纯函数，输入状态输出 HTML 字符串 */
const PAGES = {
  overview: () => `...`,
  orders: () => `...`
};

/* 3. 行为层：改状态 → 重渲染 */
function go(page, params) { ui.page = page; ui.params = params || {}; render(); }
function render() {
  document.getElementById('app').innerHTML = shell(PAGES[ui.page]());
  // 只在需要时绑定非委托类事件（input/blur 等）
}
```

**规则：**
- 渲染函数不改状态，行为函数不拼 HTML
- 全量重渲染优先（几百个节点无性能问题），别过早做增量
- 只保留必要的事件监听，重渲染会清掉子节点上的监听 → **一律用委托**

---

## 三、事件委托（唯一正确姿势）

```js
const ACT = {
  go:      el => go(el.dataset.go, { id: el.dataset.id }),
  back:    () => history.length ? go(ui.prev) : go('home'),
  filter:  el => { ui.filters.status = el.dataset.f; render(); },
  submit:  () => { /* 改 DB → toast → go */ },
  cancel:  () => closeModal()
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (!fn) { console.warn('未注册动作:', el.dataset.act); return; }
  fn(el, e);
});
```

**反例**：HTML 里写 `onclick="go('x')"`。它会让「点击检查脚本」扫不到，也让 CSP 失效、后续改成组件时全部重写。

---

## 四、跨页状态机

多端联动项目的核心。数据变更必须走一个函数，不要散落在各处：

```js
function setOrderStatus(order, next) {
  order.status = next;
  order.updatedAt = now();
  addLog(order, '状态变更', next);
  // 副作用：状态改变带动设备与库存
  if (next === '运输中') order.devices.forEach(sn => setDeviceStatus(sn, '在途'));
  if (next === '已完成') order.devices.forEach(sn => setDeviceStatus(sn, '在库可用'));
}
```

**检查点：** 每个状态是否有出口？另一端的待办角标会不会跟着变？如果两端各改各的，联动就是假的。

---

## 五、状态三件套

每个列表/详情都要有：

| 状态 | 实现 |
|---|---|
| 正常 | 主渲染 |
| 空 | `Empty` 组件：说明 + 一个能脱离空态的动作（清筛选/新建） |
| 加载 | 骨架屏，首次进入延迟 400–700ms 再出内容（演示时显得真实） |

动作反馈：成功用 toast（2s 自动消失），失败用行内提示，**不要用 alert**。

---

## 六、CSS 关键约定

```css
:root{
  --primary:#1677FF; --page:#F0F2F5; --surface:#fff;
  --border:#E8E8E8; --text:#141414; --text3:#8C8C8C;
  --r-md:8px; --sp:4px;
}
*{box-sizing:border-box}
body{margin:0;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;
     background:var(--page);color:var(--text);-webkit-font-smoothing:antialiased}
.mono{font-family:"SF Mono",Menlo,monospace;font-variant-numeric:tabular-nums}
```

响应式三档（B 端）：

```css
@media (max-width:1180px){ /* 双栏收单栏 */ }
@media (max-width:900px){ /* 侧栏改抽屉，加遮罩 */ }
@media (max-width:720px){ /* 表格转卡片：thead 隐藏，td 用 ::before 出标签 */ }
```

C 端用固定 390 宽居中壳 + `box-shadow` 模拟机身，不要做真自适应。

---

## 七、踩过的坑（按出现频率排）

| 坑 | 现象 | 解法 |
|---|---|---|
| **长 ID 不换行** | 手机上订单号/SN 被截断 | `word-break:break-all` 或 `.mono{overflow-wrap:anywhere}` |
| **移动端表格右侧溢出** | 卡片式表格超出屏幕 | `table-layout:fixed` + `td{white-space:normal}` |
| **进子页没返回** | 用户卡死在详情页 | 每个非首页都要有 `data-act="back"`，且 tabbar 常驻或返回可点 |
| **动作没注册** | 点了没反应 | 渲染时输出的 `data-act` 必须在 `ACT` 里存在（脚本会查） |
| **模板字符串漏转义** | 数据里有引号导致 HTML 断裂 | 统一 `esc()` 处理用户可见文本 |
| **div 未闭合** | 局部样式错乱 | 交付前跑标签配平检查 |
| **JS 引用不存在 id** | 运行时报 null | 交付前跑 id 引用检查 |

---

## 八、验证（必须跑）

```bash
node <skill>/scripts/test-html.js index.html
```

五项：离线资源 / 路由目标 / id 引用 / 标签配平 / 真实点击全量。

**注意：** jsdom 不做真实布局，量不出横向溢出 —— 溢出要和截图一起看。

```bash
# 截图（macOS Chrome）
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,980 --virtual-time-budget=2500 \
  --screenshot=/tmp/shot.png "file:///绝对路径/index.html"
```

**Chrome headless 最小窗口宽 500px**：`--window-size=390` 会被裁切，看起来像布局错，其实是视口假象。移动端验证用 `500`。
