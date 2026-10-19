/* ==========================================================================
   Figma 插件工具库（模板）
   复制到项目的 code.js 顶部，按需改 C / FONT 常量，然后往下写页面函数。
   已内含四类踩坑处理：免费版 createPage 限制、Reaction 新旧 API、
   宽度溢出、字体回退。
   ========================================================================== */

/* ---------- 1. 设计 token（改这里即可换肤） ---------- */
const C = {
  navy: '#001529', navy600: '#002140',
  page: '#F0F2F5', surface: '#FFFFFF',
  border: '#E8E8E8', border2: '#F0F0F0',
  text: '#141414', text2: '#595959', text3: '#8C8C8C',
  primary: '#1677FF', primaryBg: '#E6F4FF', primaryLine: '#91CAFF',
  amber: '#FA8C16', amberBg: '#FFF7E6', amberLine: '#FFD591',
  green: '#52C41A', greenBg: '#F6FFED', greenLine: '#B7EB8F',
  red: '#FF4D4F', redBg: '#FFF1F0', redLine: '#FFCCC7'
};
const FONT = { cn: 'PingFang SC', mono: 'SF Mono' };
const GAP = 4;                 // 间距基数
const W = 1440;                // 画板宽
const SB = 208;                // 侧栏宽
const PAD = 24;
const CW = W - SB - PAD * 2;   // 内容宽

/* ---------- 2. 基础工具 ---------- */
function rgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255
  };
}
function solid(hex, a) {
  const c = rgb(hex);
  return { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: a == null ? 1 : a };
}

/* 字体加载：找不到时逐级回退，避免整插件因单一字体失败 */
let _fontOk = { cn: false, mono: false };
async function loadFonts() {
  const tries = [
    ['cn', [FONT.cn, 'PingFang HK', 'Heiti SC', 'Inter', 'Roboto']],
    ['mono', [FONT.mono, 'Menlo', 'Roboto Mono', 'Inter']]
  ];
  for (const [key, list] of tries) {
    for (const family of list) {
      for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
        try {
          await figma.loadFontAsync({ family, style });
          _fontOk[key] = family;
          break;
        } catch (e) { /* 试下一个 */ }
      }
      if (_fontOk[key]) break;
    }
  }
}
function fontName(weight, mono) {
  const family = (mono ? _fontOk.mono : _fontOk.cn) || 'Inter';
  const map = { regular: 'Regular', medium: 'Medium', semibold: 'Semi Bold', bold: 'Bold' };
  return { family, style: map[weight] || 'Regular' };
}

/* 统一的 Frame 构造：用 opts 一次写完尺寸/内边距/圆角/背景/边框 */
function mk(name, o) {
  o = o || {};
  const f = figma.createFrame();
  f.name = name;
  f.fills = o.bg ? [solid(o.bg, o.bgA)] : [];
  f.strokes = o.border ? [solid(o.border)] : [];
  if (o.border) { f.strokeWeight = 1; f.strokeAlign = 'INSIDE'; }
  f.cornerRadius = o.radius || 0;
  f.clipsContent = !!o.clip;
  f.layoutMode = o.dir || 'NONE';
  if (o.dir) {
    f.itemSpacing = o.gap || 0;
    f.paddingLeft = f.paddingRight = o.px == null ? 0 : o.px;
    f.paddingTop = f.paddingBottom = o.py == null ? 0 : o.py;
    if (o.pl != null) f.paddingLeft = o.pl;
    if (o.pr != null) f.paddingRight = o.pr;
    if (o.pt != null) f.paddingTop = o.pt;
    if (o.pb != null) f.paddingBottom = o.pb;
    f.primaryAxisAlignItems = o.main || 'MIN';
    f.counterAxisAlignItems = o.cross || 'MIN';
    if (o.w != null && o.w !== 'FILL') {
      f.resize(o.w, o.h || 100);
      f.layoutSizingHorizontal = 'FIXED';
      // 只给宽时，高度保持自适应（否则会被钉在 100）
      f.layoutSizingVertical = o.h == null ? 'AUTO' : 'FIXED';
    }
    if (o.h != null) { f.resize(o.w || 100, o.h); f.layoutSizingVertical = 'FIXED'; }
    if (o.w === 'FILL') f.layoutSizingHorizontal = 'FILL';
  } else {
    if (o.w && o.h) f.resize(o.w, o.h);
  }
  if (o.grow) f.layoutGrow = 1;
  if (o.stretch) f.layoutAlign = 'STRETCH';
  figma.currentPage.appendChild(f);
  return f;
}
function vstack(name, o) { return mk(name, Object.assign({ dir: 'VERTICAL' }, o)); }
function hstack(name, o) { return mk(name, Object.assign({ dir: 'HORIZONTAL', cross: 'CENTER' }, o)); }

/* 文本：默认宽度自适应，传 w 则固定宽 + 高度自适应（用于正文换行） */
function txt(chars, size, weight, color, o) {
  o = o || {};
  const t = figma.createText();
  t.name = o.name || ('t/' + String(chars).slice(0, 12));
  t.fontName = fontName(weight, o.mono);
  t.characters = String(chars);
  t.fontSize = size || 13;
  t.fills = [solid(color || C.text)];
  if (o.lh) t.lineHeight = { unit: 'PIXELS', value: o.lh };
  if (o.ls != null) t.letterSpacing = { unit: 'PIXELS', value: o.ls };
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height); t.layoutSizingHorizontal = 'FIXED'; }
  if (o.stretch) t.layoutAlign = 'STRETCH';
  figma.currentPage.appendChild(t);
  return t;
}

/* 按钮 / 状态标签 */
function btn(label, kind) {
  const primary = kind === 'primary';
  const danger = kind === 'danger';
  const f = hstack('btn/' + label, {
    bg: primary ? C.primary : C.surface,
    border: primary || kind === 'ghost' ? null : (danger ? C.redLine : '#D9D9D9'),
    radius: 6, gap: 6, pl: 14, pr: 14, pt: 6, pb: 6
  });
  f.appendChild(txt(label, 13, primary ? 'medium' : 'regular', primary ? '#FFFFFF' : (danger ? C.red : C.text)));
  return f;
}
const TONE = {
  blue: { bg: C.primaryBg, bd: C.primaryLine, fg: C.primary },
  green: { bg: C.greenBg, bd: C.greenLine, fg: '#389E0D' },
  amber: { bg: C.amberBg, bd: C.amberLine, fg: '#AD4E00' },
  red: { bg: C.redBg, bd: C.redLine, fg: C.red },
  gray: { bg: '#FAFAFA', bd: C.border, fg: C.text2 }
};
function pill(label, tone) {
  const s = TONE[tone] || TONE.gray;
  const f = hstack('status/' + label, { bg: s.bg, border: s.bd, radius: 4, gap: 6, pl: 8, pr: 8, pt: 2, pb: 2 });
  const dot = figma.createEllipse();
  dot.resize(5, 5);
  dot.fills = [solid(s.fg)];
  f.appendChild(dot);
  f.appendChild(txt(label, 12, 'regular', s.fg));
  return f;
}

/* ---------- 3. 表格（列宽自适应 + 行级跳转标记） ---------- */
function table(cols, rows, opts) {
  opts = opts || {};
  const total = cols.reduce((s, c) => s + c.w, 0);
  const rowH = opts.rowH || 52, headH = 44;
  const wrap = vstack('table', { w: total, bg: C.surface });
  const head = hstack('thead', { w: total, h: headH, bg: '#FAFAFA' });
  cols.forEach(c => {
    const cell = hstack('th', { w: c.w, h: headH, pl: 14, pr: 14 });
    cell.primaryAxisAlignItems = c.align === 'RIGHT' ? 'MAX' : 'MIN';
    cell.appendChild(txt(c.label, 12, 'regular', C.text3));
    head.appendChild(cell);
  });
  wrap.appendChild(head);
  rows.forEach((r, ri) => {
    const row = hstack('tr', { w: total, h: rowH });
    if (opts.rowKey) row.name = 'link:' + opts.rowKey;   // 供连线阶段识别
    if (ri < rows.length - 1) {
      const line = figma.createRectangle();
      line.name = 'divider';
      line.resize(total, 1);
      line.fills = [solid(C.border2)];
      row.appendChild(line);
      line.layoutPositioning = 'ABSOLUTE';
      line.x = 0; line.y = rowH - 1;
    }
    r.forEach((node, ci) => {
      const c = cols[ci];
      if (!c) return;                                   // 列数不匹配时跳过，不崩
      const padX = c.pad == null ? 14 : c.pad;
      const cell = hstack('td', { w: c.w, h: rowH, pl: padX, pr: padX });
      cell.primaryAxisAlignItems = c.align === 'RIGHT' ? 'MAX' : 'MIN';
      if (node) cell.appendChild(node);
      row.appendChild(cell);
    });
    wrap.appendChild(row);
  });
  return wrap;
}

/* ---------- 4. 画板外壳（顶栏 + 侧栏 + 内容） ---------- */
function screen(name, opts) {
  const main = vstack('main', { w: W - SB, pt: PAD, pl: PAD, pr: PAD, pb: 32, gap: 16 });
  (opts.body || []).forEach(n => main.appendChild(n));
  const rowH = main.height || 900;
  const row = hstack('body-row', { w: W, h: rowH });
  if (opts.sidebar) {
    const sb = opts.sidebar;
    sb.resize(SB, rowH);
    sb.layoutSizingVertical = 'FIXED';
    row.appendChild(sb);
  }
  row.appendChild(main);
  const s = vstack(name, { w: W, bg: C.page });
  if (opts.topbar) {
    const tb = opts.topbar;
    tb.resize(W, 56);
    s.appendChild(tb);
  }
  s.appendChild(row);
  return s;
}

/* ---------- 5. 原型连线 ---------- */
/* 配置示例：
   WIRE = {
     screens: { '01 概览': 'overview', '02 列表': 'list' },
     nav:     { '概览': 'overview', '列表': 'list' },
     btn:     { '01 概览': { '新建': 'create' } },
     switch:  { '工作台': 'overview', '管理台': 'admin' }
   }
   节点命名约定：导航 nav/文案、按钮 btn/文案、整行 link:目标key、切换项 switch-item */
const WIRE = { screens: {}, nav: {}, btn: {}, switch: {} };

function nodeText(n) {
  let s = '';
  (n.children || []).forEach(c => {
    if (c.type === 'TEXT') s += c.characters || '';
    else s += nodeText(c);
  });
  return s;
}

/* Reaction 兼容两代 API：新 actions 数组 / 旧单 action */
function setNav(node, destId) {
  if (!node || typeof node.setReactionsAsync !== 'function') return Promise.resolve(false);
  const trigger = { type: 'ON_CLICK' };
  const action = {
    type: 'NODE', destinationId: destId, navigation: 'NAVIGATE',
    transition: null, preserveScrollPosition: false
  };
  return node.setReactionsAsync([{ trigger: trigger, actions: [action] }])
    .then(() => true)
    .catch(() => node.setReactionsAsync([{ trigger: trigger, action: action }])
      .then(() => true)
      .catch(() => false));
}

function wirePrototype(frames) {
  const byKey = {};
  frames.forEach(fr => {
    const k = WIRE.screens[fr.name];
    if (k) byKey[k] = fr;
  });
  const tasks = [];
  frames.forEach(fr => {
    const sk = WIRE.screens[fr.name];
    if (!sk) return;
    const btnMap = WIRE.btn[fr.name] || {};
    (function walk(n) {
      const nm = n.name || '';
      let dest = null;
      if (nm.indexOf('nav/') === 0) dest = WIRE.nav[nm.slice(4)];
      else if (nm.indexOf('btn/') === 0) dest = btnMap[nm.slice(4)];
      else if (nm === 'switch-item') dest = WIRE.switch[nodeText(n).trim()] || null;
      else if (nm.indexOf('link:') === 0) dest = nm.slice(5);
      if (dest && dest !== sk && byKey[dest]) tasks.push([n, byKey[dest].id]);
      (n.children || []).forEach(walk);
    })(fr);
  });
  return Promise.all(tasks.map(t => setNav(t[0], t[1])))
    .then(rs => ({ total: tasks.length, ok: rs.filter(Boolean).length }));
}

/* ---------- 6. 主流程骨架（含免费版降级） ---------- */
async function boot(buildFrames) {
  try {
    await loadFonts();

    // 免费版 Starter 计划最多 3 个 page
    let page = null, createdNew = false;
    try {
      page = figma.createPage();
      page.name = '原型 v1';
      figma.currentPage = page;
      createdNew = true;
    } catch (e) {
      page = figma.currentPage;
      figma.notify('当前计划无法新建 page，改用当前页面承载', { timeout: 4000 });
    }

    const frames = buildFrames();

    // 复用用户页面时，排到已有内容下方
    let startY = 0;
    if (!createdNew) {
      try {
        let bottom = 0;
        figma.currentPage.children.forEach(n => {
          if (frames.indexOf(n) > -1) return;
          bottom = Math.max(bottom, n.y + n.height);
        });
        if (bottom > 0) startY = bottom + 240;
      } catch (e) { /* 忽略 */ }
    }

    let x = 0, y = startY, col = 0, rowH = 0;
    frames.forEach(fr => {
      const lab = txt(fr.name, 13, 'medium', C.text3);
      lab.x = x; lab.y = y;
      fr.x = x; fr.y = y + 26;
      if (col === 0) { col = 1; rowH = fr.height; x = W + 120; }
      else { col = 0; y += 26 + Math.max(rowH, fr.height) + 160; x = 0; }
    });

    const wired = await wirePrototype(frames).catch(() => ({ total: 0, ok: 0 }));

    try {
      const first = frames[0];
      if (createdNew && first && figma.currentPage.flowStartingPoints) {
        figma.currentPage.flowStartingPoints = [{ nodeId: first.id, name: first.name }];
      }
    } catch (e) { /* 旧版不支持 */ }

    figma.viewport.scrollAndZoomIntoView(frames);
    let msg = '已生成 ' + frames.length + ' 个画板';
    if (wired.ok) msg += '，已连好 ' + wired.ok + ' 处跳转，按 ▶ 演示';
    figma.notify(msg, { timeout: 6000 });
    figma.closePlugin();
  } catch (e) {
    figma.notify('生成失败：' + (e && e.message ? e.message : e), { error: true, timeout: 10000 });
    console.error(e);
    figma.closePlugin();
  }
}
