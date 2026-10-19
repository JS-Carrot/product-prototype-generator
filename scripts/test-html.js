/* HTML 交互原型检查器
 * 用法: node test-html.js <index.html>
 * 依赖: jsdom（NODE_PATH 指向已安装目录即可）
 *
 * 检查项:
 *   1. 是否引用外部资源（离线可用性）
 *   2. data-screen / data-go / data-tab 的跳转目标是否都存在
 *   3. 重复 id、JS 引用但 DOM 缺失的 id
 *   4. 标签配平（div / section / table 等）
 *   5. 真实渲染并逐个点击所有 data-act 元素，捕获运行时异常
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

/* jsdom 自动探测：本目录 → 当前项目 → 常见全局安装位置，找不到再提示 */
function loadJsdom() {
  const candidates = [
    'jsdom',
    path.join(__dirname, 'node_modules', 'jsdom'),
    path.join(process.cwd(), 'node_modules', 'jsdom'),
    path.join(os.homedir(), '.workbuddy', 'binaries', 'node', 'workspace', 'node_modules', 'jsdom'),
    '/usr/local/lib/node_modules/jsdom',
    '/opt/homebrew/lib/node_modules/jsdom'
  ];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* 下一个 */ }
  }
  console.error('\n❌ 缺少依赖 jsdom。任选一种方式安装：');
  console.error('   npm i jsdom                                  # 装到当前项目');
  console.error('   NODE_PATH=<jsdom 所在 node_modules> node ' + path.basename(__filename) + ' <file>');
  process.exit(2);
}
const { JSDOM, VirtualConsole } = loadJsdom();

const file = process.argv[2];
if (!file) {
  console.log('用法: node test-html.js <index.html>');
  process.exit(1);
}
const html = fs.readFileSync(path.resolve(file), 'utf8');

let fail = 0;
const bad = (msg) => { fail++; console.log('  ❌ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

/* ---------- 1. 外部资源 ---------- */
console.log('\n[1] 离线可用性');
const ext = [
  ...html.matchAll(/<(?:script|link|img|iframe)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)
].map(m => m[1]);
const cssImport = [...html.matchAll(/@import\s+(?:url\()?["']?(https?:\/\/[^"')]+)/g)].map(m => m[1]);
if (ext.length + cssImport.length === 0) ok('无外部脚本 / 样式 / 图片引用');
else [...ext, ...cssImport].slice(0, 5).forEach(u => bad('外部依赖: ' + u));

/* ---------- 2. 路由引用 ---------- */
console.log('\n[2] 路由一致性');
let screens = new Set([...html.matchAll(/data-screen="([^"]+)"/g)].map(m => m[1]));
const gos = new Set([...html.matchAll(/data-go="([^"]+)"/g)].map(m => m[1]));
const tabs = new Set([...html.matchAll(/data-tab="([^"]+)"/g)].map(m => m[1]));
const backs = (html.match(/data-back/g) || []).length
  + (html.match(/data-act="back"/g) || []).length;

// 兼容两种写法：DOM 上的 data-screen，或 JS 里的 PAGES 路由表
if (!screens.size) {
  const block = html.split(/const PAGES\s*=\s*\{/)[1];
  if (block) {
    const body = block.split(/\n\};/)[0];
    screens = new Set([...body.matchAll(/^\s{2}([a-zA-Z][\w-]*)\s*:/gm)].map(m => m[1]));
  }
}
if (!screens.size) {
  bad('既无 data-screen 容器，也未找到 PAGES 路由表 —— 无法校验路由');
} else {
  ok(screens.size + ' 个页面: ' + [...screens].join(' / '));
}

const missGo = [...gos].filter(x => !screens.has(x));
const missTab = [...tabs].filter(x => !screens.has(x));
missGo.length ? bad('data-go 指向不存在的页面: ' + missGo.join(', ')) : ok('data-go 全部有效（' + gos.size + ' 个目标）');
missTab.length ? bad('data-tab 指向不存在的页面: ' + missTab.join(', ')) : ok('data-tab 全部有效（' + tabs.size + ' 个）');
if (screens.size > 1 && backs === 0) bad('多页但没有任何 data-back 返回按钮');

/* ---------- 3. id 一致性 ---------- */
console.log('\n[3] id 引用');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
dup.length ? bad('重复 id: ' + [...new Set(dup)].join(', ')) : ok(ids.length + ' 个 id 无重复');

const refs = new Set([
  ...[...html.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]),
  ...[...html.matchAll(/getElementById\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1])
]);
const idSet = new Set(ids);
const missRef = [...refs].filter(r => !idSet.has(r));
missRef.length ? bad('JS 引用但 DOM 中不存在的 id: ' + missRef.join(', ')) : ok('JS 引用的 id 全部存在（' + refs.size + ' 个）');

/* ---------- 4. 标签配平 ---------- */
console.log('\n[4] 标签配平');
let unbal = 0;
['div', 'section', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'span', 'button', 'select'].forEach(tag => {
  const o = (html.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
  const c = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (o !== c) { unbal++; bad('<' + tag + '> 开 ' + o + ' / 闭 ' + c + '，差 ' + (o - c)); }
});
if (!unbal) ok('主要标签全部配平');

/* ---------- 5. 真实渲染 + 点击 ---------- */
console.log('\n[5] 运行时与点击');
const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', e => jsErrors.push(String(e && e.message || e)));
vc.on('error', (...a) => jsErrors.push(a.join(' ')));

let dom;
try {
  dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    url: 'file://' + path.resolve(file)
  });
} catch (e) {
  bad('无法解析 HTML: ' + e.message);
  process.exit(1);
}

const w = dom.window;
w.scrollTo = () => {};
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));

setTimeout(() => {
  if (jsErrors.length) jsErrors.slice(0, 3).forEach(e => bad('加载期错误: ' + e.split('\n')[0]));
  else ok('无加载期异常');

  const d = w.document;
  // 统计动作元素
  const acts = [...d.querySelectorAll('[data-act]')];
  const actNames = new Set(acts.map(e => e.getAttribute('data-act')));
  ok('可交互元素 ' + acts.length + ' 个，动作 ' + actNames.size + ' 种');

  // 逐个点击，捕获异常
  let clicked = 0;
  const clickErr = [];
  acts.forEach(el => {
    try {
      el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
      clicked++;
    } catch (e) {
      clickErr.push((el.getAttribute('data-act') || '?') + ' → ' + (e && e.message ? e.message : e));
    }
  });
  if (clickErr.length) {
    clickErr.slice(0, 8).forEach(e => bad('点击异常: ' + e));
  } else {
    ok('点击 ' + clicked + ' 次，无异常');
  }

  // 点击后 DOM 是否还在（防止白屏）
  const view = d.getElementById('view') || d.body;
  if (!view || view.innerHTML.trim().length < 50) bad('点击后页面内容异常（可能白屏）');
  else ok('点击后渲染正常（内容 ' + Math.round(view.innerHTML.length / 1024) + ' KB）');

  console.log('\n' + (fail ? '❌ ' + fail + ' 项未通过' : '✓ 全部通过'));
  process.exit(fail ? 1 : 0);
}, 600);
