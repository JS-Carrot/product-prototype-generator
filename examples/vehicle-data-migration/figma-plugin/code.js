/* =====================================================================
   数据迁移平台 · 车载数据回传与设备租赁 —— Figma 原型生成器
   运行方式：Figma 桌面端 → 菜单 Plugins → Development → Import plugin from manifest
   生成内容：12 个原生 Frame（客户控制台 6 + 运维后台 5 + 设计说明 1）
   所有图层均为可编辑的 Frame / Text / Rectangle，使用 Auto Layout
   ===================================================================== */

/* ---------- 1. 设计 token（与 HTML 原型同源） ---------- */
const C = {
  navy:'#001529', navy600:'#12395C',
  page:'#F0F2F5', surface:'#FFFFFF',
  border:'#E8E8E8', border2:'#F0F0F0',
  text:'#141414', text2:'#595959', text3:'#8C8C8C',
  primary:'#1677FF', primaryBg:'#E6F4FF', primaryLine:'#91CAFF', primaryText:'#0958D9',
  amber:'#FA8C16', amberBg:'#FFF7E6', amberLine:'#FFD591', amberText:'#D46B08',
  green:'#52C41A', greenBg:'#F6FFED', greenLine:'#B7EB8F', greenText:'#389E0D',
  red:'#FF4D4F', redBg:'#FFF1F0', redLine:'#FFA39E', redText:'#CF1322'
};

const W = 1440, SB = 208, MAIN_W = W - SB, PAD = 24, CW = MAIN_W - PAD * 2; // 1184

/* ---------- 2. 基础工具 ---------- */
function rgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}
function solid(hex, a) {
  return { type: 'SOLID', color: rgb(hex), opacity: a == null ? 1 : a };
}

let FONTS = {
  regular: { family: 'PingFang SC', style: 'Regular' },
  medium: { family: 'PingFang SC', style: 'Medium' },
  semibold: { family: 'PingFang SC', style: 'Semibold' },
  mono: { family: 'SF Mono', style: 'Regular' }
};

async function loadable(cands) {
  for (const f of cands) {
    try { await figma.loadFontAsync(f); return f; } catch (e) { /* 继续尝试 */ }
  }
  throw new Error('找不到可用字体');
}
async function loadFonts() {
  FONTS = {
    regular: await loadable([
      { family: 'PingFang SC', style: 'Regular' },
      { family: 'Inter', style: 'Regular' }
    ]),
    medium: await loadable([
      { family: 'PingFang SC', style: 'Medium' },
      { family: 'PingFang SC', style: 'Regular' },
      { family: 'Inter', style: 'Medium' },
      { family: 'Inter', style: 'Regular' }
    ]),
    semibold: await loadable([
      { family: 'PingFang SC', style: 'Semibold' },
      { family: 'PingFang SC', style: 'Medium' },
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Inter', style: 'Bold' },
      { family: 'Inter', style: 'Regular' }
    ]),
    mono: await loadable([
      { family: 'SF Mono', style: 'Regular' },
      { family: 'Menlo', style: 'Regular' },
      { family: 'Roboto Mono', style: 'Regular' },
      { family: 'Inter', style: 'Regular' }
    ])
  };
}

/* 文本：opts = { w, lh, align, ls } */
function txt(chars, size, weight, color, opts) {
  opts = opts || {};
  const t = figma.createText();
  t.fontName = FONTS[weight] || FONTS.regular;
  t.fontSize = size;
  t.lineHeight = { unit: 'PIXELS', value: opts.lh || Math.round(size * 1.55) };
  t.characters = String(chars);
  t.fills = [solid(color)];
  if (opts.ls != null) t.letterSpacing = { unit: 'PIXELS', value: opts.ls };
  if (opts.w) {
    t.textAutoResize = 'HEIGHT';
    t.resize(opts.w, t.height);
  } else {
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
  }
  if (opts.align) t.textAlignHorizontal = opts.align;
  return t;
}

/* 数值 + 小号单位：如 3 单 / 198.8 TB */
function valueText(v, unit, size, unitSize, color) {
  const s = String(v), u = String(unit || '');
  const t = figma.createText();
  t.fontName = FONTS.semibold;
  t.fontSize = size;
  t.lineHeight = { unit: 'PIXELS', value: Math.round(size * 1.35) };
  t.characters = s + u;
  t.letterSpacing = { unit: 'PIXELS', value: -0.4 };
  t.fills = [solid(color || C.text)];
  if (u) {
    t.setRangeFontSize(s.length, s.length + u.length, unitSize || 13);
    t.setRangeFills(s.length, s.length + u.length, [solid(C.text3)]);
    if (typeof t.setRangeLetterSpacing === 'function') {
      t.setRangeLetterSpacing(s.length, s.length + u.length, { unit: 'PIXELS', value: 0 });
    }
  }
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

/* 通用容器：dir = VERTICAL | HORIZONTAL | NONE */
function mk(name, o) {
  o = o || {};
  const f = figma.createFrame();
  f.name = name;
  const dir = o.dir || 'VERTICAL';
  f.fills = o.bg ? [solid(o.bg, o.bgA)] : [];
  if (o.border) {
    f.strokes = [solid(o.border)];
    f.strokeWeight = 1;
    f.strokeAlign = 'INSIDE';
  }
  if (o.radius) f.cornerRadius = o.radius;
  f.clipsContent = !!o.clip;
  f.resize(o.w || 100, o.h || 100);
  if (dir !== 'NONE') {
    f.layoutMode = dir;
    f.itemSpacing = o.gap || 0;
    f.paddingLeft = o.pl || 0;
    f.paddingRight = o.pr || 0;
    f.paddingTop = o.pt || 0;
    f.paddingBottom = o.pb || 0;
    f.primaryAxisAlignItems = o.align || 'MIN';
    f.counterAxisAlignItems = o.calign || 'MIN';
    const isV = dir === 'VERTICAL';
    const primaryFixed = isV ? o.h != null : o.w != null;
    const counterFixed = isV ? o.w != null : o.h != null;
    f.primaryAxisSizingMode = primaryFixed ? 'FIXED' : 'AUTO';
    f.counterAxisSizingMode = counterFixed ? 'FIXED' : 'AUTO';
  }
  return f;
}
const vstack = (name, o) => mk(name, Object.assign({}, o, { dir: 'VERTICAL' }));
const hstack = (name, o) => mk(name, Object.assign({}, o, { dir: 'HORIZONTAL' }));

/* 绝对定位横线 / 竖线 */
function addLine(parent, side, color) {
  const r = figma.createRectangle();
  r.name = 'divider';
  r.fills = [solid(color)];
  parent.appendChild(r);
  if (parent.layoutMode && parent.layoutMode !== 'NONE') r.layoutPositioning = 'ABSOLUTE';
  if (side === 'BOTTOM' || side === 'TOP') {
    r.resize(parent.width, 1);
    r.x = 0;
    r.y = side === 'BOTTOM' ? Math.max(parent.height - 1, 0) : 0;
  } else {
    r.resize(1, parent.height);
    r.x = side === 'RIGHT' ? Math.max(parent.width - 1, 0) : 0;
    r.y = 0;
  }
  return r;
}

/* ---------- 3. 图标 ---------- */
const ICONS = {
  grid: '<rect x="2.5" y="2.5" width="4.6" height="4.6" rx="1"/><rect x="10.4" y="2.5" width="4.6" height="4.6" rx="1"/><rect x="2.5" y="10.4" width="4.6" height="4.6" rx="1"/><rect x="10.4" y="10.4" width="4.6" height="4.6" rx="1"/>',
  file: '<path d="M4.2 2.5h5.4L13 5.9v9.1H4.2V2.5Z"/><path d="M9.4 2.5v3.6H13M6.3 9h4.6M6.3 11.6h4.6"/>',
  cube: '<path d="M2.6 5.6 9 2.2l6.4 3.4v6.8L9 15.8l-6.4-3.4V5.6Z"/><path d="M2.6 5.6 9 9l6.4-3.4M9 9v6.8"/>',
  box: '<rect x="2" y="5.4" width="14" height="8.2" rx="1"/><path d="M2 8.6h14M5.6 5.4V3.2M12.4 5.4V3.2"/>',
  clock: '<circle cx="9" cy="9" r="6.8"/><path d="M9 5.2v4.2l2.8 1.6"/>',
  search: '<circle cx="8" cy="8" r="5.4"/><path d="M12.2 12.2 15 15"/>',
  plus: '<path d="M9 3.6v10.8M3.6 9h10.8"/>',
  right: '<path d="M6.5 3.5 12 9l-5.5 5.5"/>',
  down: '<path d="M9 3v8.2M5.4 8l3.6 3.6L12.6 8M3.4 14.4h11.2"/>',
  out: '<path d="M8 3.4H3.8v11.2H8M11.4 6 14.8 9l-3.4 3M7 9h7.4"/>',
  in: '<path d="M10 3.4h4.2v11.2H10M6.6 6 3.2 9l3.4 3M11 9H3.6"/>',
  bell: '<path d="M4.6 13.2h8.8l-1.2-1.8V8a3.2 3.2 0 1 0-6.4 0v3.4l-1.2 1.8Z"/><path d="M7.6 15.2h2.8"/>'
};
function icon(name, size, color) {
  const inner = ICONS[name] || ICONS.grid;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
    '" viewBox="0 0 18 18" fill="none" stroke="' + color +
    '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  try {
    const n = figma.createNodeFromSvg(svg);
    n.name = 'icon/' + name;
    return n;
  } catch (e) {
    const r = figma.createRectangle();
    r.resize(size, size);
    r.fills = [];
    return r;
  }
}

/* ---------- 4. 原子组件 ---------- */
const TONE = {
  blue: { bg: C.primaryBg, fg: C.primaryText, bd: C.primaryLine },
  green: { bg: C.greenBg, fg: C.greenText, bd: C.greenLine },
  amber: { bg: C.amberBg, fg: C.amberText, bd: C.amberLine },
  red: { bg: C.redBg, fg: C.redText, bd: C.redLine },
  gray: { bg: '#FAFAFA', fg: C.text3, bd: C.border }
};
function pill(label, tone) {
  const s = TONE[tone] || TONE.gray;
  const f = hstack('status/' + label, { bg: s.bg, border: s.bd, radius: 4, gap: 6, pl: 8, pr: 8, pt: 2, pb: 2 });
  f.counterAxisAlignItems = 'CENTER';
  const dot = figma.createEllipse();
  dot.name = 'dot';
  dot.resize(5, 5);
  dot.fills = [solid(s.fg)];
  f.appendChild(dot);
  f.appendChild(txt(label, 12, 'regular', s.fg));
  return f;
}
function btn(label, kind, iconName) {
  const primary = kind === 'primary';
  const ghost = kind === 'ghost';
  const danger = kind === 'danger';
  const f = hstack('btn/' + label, {
    bg: primary ? C.primary : (danger ? C.surface : C.surface),
    border: primary || ghost ? null : (danger ? '#FFCCC7' : '#D9D9D9'),
    radius: 6, gap: 6, pl: 14, pr: 14, pt: 6, pb: 6
  });
  f.counterAxisAlignItems = 'CENTER';
  const fg = primary ? '#FFFFFF' : (danger ? C.red : C.text);
  if (iconName) f.appendChild(icon(iconName, 14, primary ? '#FFFFFF' : C.text2));
  f.appendChild(txt(label, 13, primary ? 'medium' : 'regular', fg));
  return f;
}
function tag(text) {
  const f = hstack('tag', { bg: '#FAFAFA', border: C.border, radius: 3, pl: 8, pr: 8, pt: 2, pb: 2 });
  f.appendChild(txt(text, 12, 'regular', C.text2));
  return f;
}
function progress(w, pct, color) {
  const t = figma.createFrame();
  t.name = 'progress';
  t.resize(w, 4);
  t.fills = [solid('#F0F0F0')];
  t.cornerRadius = 2;
  t.clipsContent = true;
  const inner = figma.createRectangle();
  inner.resize(Math.max(w * pct / 100, 2), 4);
  inner.fills = [solid(color)];
  inner.cornerRadius = 2;
  inner.x = 0;
  inner.y = 0;
  t.appendChild(inner);
  return t;
}
function progressCell(w, pct, color) {
  const f = hstack('progress-cell', { gap: 8 });
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(progress(w, pct, color));
  f.appendChild(txt(pct + '%', 12, 'mono', C.text2));
  return f;
}
function kv(label, value, width, opts) {
  opts = opts || {};
  const row = hstack('kv', { w: width, gap: 12 });
  row.counterAxisAlignItems = 'MIN';
  row.appendChild(txt(label, 13, 'regular', C.text3, { w: opts.labelW || 96 }));
  row.appendChild(txt(value, 13, opts.mono ? 'mono' : 'regular', C.text, { w: width - (opts.labelW || 96) - 12 }));
  return row;
}

/* ---------- 5. 复合组件 ---------- */
function panel(w, title, meta) {
  const p = vstack('panel', { w: w, bg: C.surface, border: C.border, radius: 8, clip: true });
  if (title !== null && title !== undefined) {
    const head = hstack('panel-head', { w: w, h: 52, pl: 18, pr: 18 });
    head.counterAxisAlignItems = 'CENTER';
    head.primaryAxisAlignItems = 'SPACE_BETWEEN';
    head.appendChild(txt(title, 15, 'semibold', C.text));
    if (meta) head.appendChild(txt(meta, 12, 'regular', C.text3));
    addLine(head, 'BOTTOM', C.border2);
    p.appendChild(head);
  }
  return p;
}
function panelBody(p, w, opts) {
  opts = opts || {};
  const b = vstack('panel-body', {
    w: w, gap: opts.gap || 0,
    pt: opts.pad == null ? 18 : opts.pad,
    pb: opts.pad == null ? 18 : opts.pad,
    pl: opts.pad == null ? 18 : opts.pad,
    pr: opts.pad == null ? 18 : opts.pad
  });
  p.appendChild(b);
  return b;
}

function table(cols, rows, opts) {
  opts = opts || {};
  const total = cols.reduce((s, c) => s + c.w, 0);
  const rowH = opts.rowH || 52, headH = 44;
  const wrap = vstack('table', { w: total, bg: C.surface });
  const head = hstack('thead', { w: total, h: headH, bg: '#FAFAFA' });
  cols.forEach(c => {
    const cell = hstack('th', { w: c.w, h: headH, pl: 14, pr: 14 });
    cell.counterAxisAlignItems = 'CENTER';
    cell.primaryAxisAlignItems = c.align === 'RIGHT' ? 'MAX' : 'MIN';
    cell.appendChild(txt(c.label, 12, 'regular', C.text3));
    head.appendChild(cell);
  });
  addLine(head, 'BOTTOM', C.border);
  wrap.appendChild(head);
  rows.forEach((r, ri) => {
    const row = hstack('tr', { w: total, h: rowH });
    // 行级跳转标记：供原型连线阶段识别（link:目标key）
    if (opts.rowKey) row.name = 'link:' + opts.rowKey;
    if (ri < rows.length - 1) addLine(row, 'BOTTOM', C.border2);
    r.forEach((node, ci) => {
      const c = cols[ci];
      const padX = c.pad == null ? 14 : c.pad;
      const cell = hstack('td', { w: c.w, h: rowH, pl: padX, pr: padX });
      cell.counterAxisAlignItems = 'CENTER';
      cell.primaryAxisAlignItems = c.align === 'RIGHT' ? 'MAX' : 'MIN';
      if (node) cell.appendChild(node);
      row.appendChild(cell);
    });
    wrap.appendChild(row);
  });
  return wrap;
}
function tblFooter(w, total, filtered) {
  const f = hstack('table-foot', { w: w, h: 48, pl: 16, pr: 16, bg: C.surface });
  f.primaryAxisAlignItems = 'SPACE_BETWEEN';
  f.counterAxisAlignItems = 'CENTER';
  addLine(f, 'TOP', C.border);
  f.appendChild(txt('共 ' + total + ' 条' + (filtered !== total ? ' · 当前筛选 ' + filtered + ' 条' : ''), 12, 'regular', C.text3));
  const pager = hstack('pager', { gap: 4 });
  ['‹', '1', '›'].forEach((s, i) => {
    const b = hstack('page-btn', {
      bg: i === 1 ? C.primary : C.surface,
      border: i === 1 ? null : C.border,
      radius: 4, pl: 8, pr: 8, pt: 3, pb: 3
    });
    b.appendChild(txt(s, 12, 'mono', i === 1 ? '#FFFFFF' : C.text3));
    pager.appendChild(b);
  });
  f.appendChild(pager);
  return f;
}
function filterBar(w, chips, right) {
  const f = hstack('filter-bar', { w: w, pl: 16, pr: 16, pt: 12, pb: 12, gap: 12 });
  f.counterAxisAlignItems = 'CENTER';
  const group = hstack('chips', { bg: '#F5F5F5', radius: 6, gap: 2, pl: 3, pr: 3, pt: 3, pb: 3 });
  chips.forEach(c => {
    const on = !!c.on;
    const chip = hstack('chip', {
      bg: on ? C.surface : null, radius: 4, gap: 6, pl: 12, pr: 12, pt: 4, pb: 4
    });
    if (on) chip.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.06 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: 'NORMAL' }];
    chip.appendChild(txt(c.label, 13, on ? 'medium' : 'regular', on ? C.text : C.text2));
    if (c.count != null) chip.appendChild(txt(String(c.count), 12, 'mono', on ? C.primary : C.text3));
    group.appendChild(chip);
  });
  f.appendChild(group);
  const spacer = mk('spacer', {});
  spacer.fills = [];
  spacer.layoutGrow = 1;
  f.appendChild(spacer);
  (right || []).forEach(n => f.appendChild(n));
  return f;
}
function searchBox(w, placeholder) {
  const f = hstack('search', { w: w, bg: C.surface, border: '#D9D9D9', radius: 6, pl: 9, pr: 9, pt: 6, pb: 6, gap: 6 });
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(icon('search', 14, '#BFBFBF'));
  f.appendChild(txt(placeholder, 13, 'regular', '#BFBFBF'));
  return f;
}
function selectBox(w, label) {
  const f = hstack('select', { w: w, bg: C.surface, border: '#D9D9D9', radius: 6, pl: 10, pr: 10, pt: 6, pb: 6 });
  f.primaryAxisAlignItems = 'SPACE_BETWEEN';
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(txt(label, 13, 'regular', C.text));
  f.appendChild(txt('▾', 10, 'regular', C.text3));
  return f;
}
function inputBox(w, value, placeholder) {
  const f = hstack('input', { w: w, bg: C.surface, border: '#D9D9D9', radius: 6, pl: 10, pr: 10, pt: 7, pb: 7 });
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(txt(value || placeholder, 13, 'regular', value ? C.text : '#BFBFBF'));
  return f;
}
function notice(text, kind, width) {
  const map = {
    info: { bg: '#F7FBFF', bd: C.primaryLine, fg: C.primaryText },
    amber: { bg: C.amberBg, bd: C.amberLine, fg: '#AD4E00' },
    gray: { bg: '#FAFAFA', bd: C.border, fg: C.text2 }
  }[kind || 'info'];
  const f = hstack('notice', { w: width, bg: map.bg, border: map.bd, radius: 6, pl: 12, pr: 14, pt: 10, pb: 10, gap: 10 });
  f.counterAxisAlignItems = 'MIN';
  f.appendChild(icon('info', 15, map.fg));
  f.appendChild(txt(text, 13, 'regular', map.fg, { w: width - 26 - 15 - 10 }));
  return f;
}

/* 订单生命周期轨道（Signature） */
function rail(steps, cur, width) {
  const f = mk('rail', { w: width, h: 58, dir: 'NONE' });
  const stepW = width / steps.length;
  steps.forEach((s, i) => {
    const x = i * stepW;
    if (i < steps.length - 1) {
      const line = figma.createRectangle();
      line.name = 'rail-line';
      line.resize(stepW - 12, 2);
      line.x = x + 12;
      line.y = 5;
      line.fills = [solid(i < cur ? C.primary : C.border2)];
      f.appendChild(line);
    }
    if (i === cur) {
      const ring = figma.createEllipse();
      ring.name = 'rail-ring';
      ring.resize(22, 22);
      ring.x = x - 5;
      ring.y = -5;
      ring.fills = [];
      ring.strokes = [solid(C.amber, 0.45)];
      ring.strokeWeight = 1;
      f.appendChild(ring);
    }
    const done = i < cur, act = i === cur;
    const dot = figma.createEllipse();
    dot.name = 'rail-dot';
    dot.resize(12, 12);
    dot.x = x;
    dot.y = 0;
    dot.fills = [solid(done ? C.primary : C.surface)];
    dot.strokes = [solid(done ? C.primary : (act ? C.amber : '#D9D9D9'))];
    dot.strokeWeight = 2;
    f.appendChild(dot);

    const lab = txt(s.lab, 13, act ? 'medium' : 'regular', done || act ? C.text : C.text3);
    lab.x = x;
    lab.y = 22;
    f.appendChild(lab);

    const tm = txt(s.time, 11, 'mono', '#BFBFBF');
    tm.x = x;
    tm.y = 42;
    f.appendChild(tm);
  });
  return f;
}

/* 顶栏 */
function topbar(isOps) {
  const f = hstack('topbar', { w: W, h: 56, bg: C.surface, pl: 20, pr: 20, gap: 14 });
  f.counterAxisAlignItems = 'CENTER';

  const brand = hstack('brand', { gap: 10 });
  brand.counterAxisAlignItems = 'CENTER';
  const logo = hstack('logo', { bg: C.primary, radius: 6, w: 28, h: 28 });
  logo.primaryAxisAlignItems = 'CENTER';
  logo.counterAxisAlignItems = 'CENTER';
  try {
    const bolt = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M13.2 1.8 4.4 13.6h5.4l-1.2 8.6 9.2-12.2h-5.6l1-8.2Z" fill="#FFFFFF"/></svg>');
    bolt.name = 'bolt';
    logo.appendChild(bolt);
  } catch (e) { /* 忽略 */ }
  brand.appendChild(logo);

  const titles = vstack('brand-text', { gap: 0 });
  titles.appendChild(txt('数据迁移平台', 15, 'semibold', C.text, { lh: 18 }));
  titles.appendChild(txt('车载数据回传 · 设备租赁', 11, 'regular', C.text3, { lh: 14, ls: 0.4 }));
  brand.appendChild(titles);
  f.appendChild(brand);

  const sw = hstack('portal-switch', { bg: '#F5F5F5', border: C.border, radius: 6, gap: 2, pl: 2, pr: 2, pt: 2, pb: 2 });
  sw.counterAxisAlignItems = 'CENTER';
  [['客户控制台', !isOps], ['运维后台', isOps]].forEach(([lab, on]) => {
    const b = hstack('switch-item', {
      bg: on ? C.surface : null, radius: 4, gap: 6, pl: 12, pr: 12, pt: 4, pb: 4
    });
    b.counterAxisAlignItems = 'CENTER';
    b.appendChild(icon(on ? 'grid' : 'box', 13, on ? C.primary : C.text2));
    b.appendChild(txt(lab, 13, on ? 'medium' : 'regular', on ? C.text : C.text2));
    sw.appendChild(b);
  });
  f.appendChild(sw);

  const sp = mk('spacer', {});
  sp.fills = [];
  sp.layoutGrow = 1;
  f.appendChild(sp);

  const env = hstack('env', { bg: '#FAFAFA', border: C.border, radius: 4, gap: 6, pl: 8, pr: 8, pt: 2, pb: 2 });
  env.counterAxisAlignItems = 'CENTER';
  const dot = figma.createEllipse();
  dot.resize(5, 5);
  dot.fills = [solid(C.green)];
  env.appendChild(dot);
  env.appendChild(txt('生产环境', 12, 'regular', C.text2));
  f.appendChild(env);

  const av = hstack('avatar', { bg: C.primaryBg, radius: 14, w: 28, h: 28 });
  av.primaryAxisAlignItems = 'CENTER';
  av.counterAxisAlignItems = 'CENTER';
  av.appendChild(txt(isOps ? '张' : '周', 12, 'semibold', C.primary));
  f.appendChild(av);

  addLine(f, 'BOTTOM', C.border);
  return f;
}

/* 侧栏 */
const NAV = {
  client: [
    { sec: '工作台' },
    { lab: '概览', icon: 'grid' },
    { sec: '迁移管理' },
    { lab: '我的订单', icon: 'file' },
    { lab: '设备管理', icon: 'cube' }
  ],
  ops: [
    { sec: '设备运营' },
    { lab: '库存概览', icon: 'grid' },
    { lab: '设备库存', icon: 'box' },
    { lab: '订单受理', icon: 'file' },
    { sec: '记录' },
    { lab: '出入库记录', icon: 'clock' }
  ]
};
function sidebar(isOps, activeIdx, height) {
  const f = vstack('sidebar', { w: SB, h: height, bg: C.navy, pt: 18, pl: 8, pr: 8 });
  const items = NAV[isOps ? 'ops' : 'client'];
  let idx = 0;
  items.forEach(it => {
    if (it.sec) {
      const wrapS = hstack('nav-sec', { w: SB - 16, pl: 8, pr: 16, pt: 16, pb: 6 });
      const s = txt(it.sec, 11, 'regular', '#FFFFFF', { ls: 0.8 });
      s.opacity = 0.32;
      wrapS.appendChild(s);
      f.appendChild(wrapS);
      return;
    }
    const on = idx === activeIdx;
    const item = hstack('nav/' + it.lab, {
      w: SB - 16, h: 40, bg: on ? C.navy600 : null, radius: 6, gap: 10, pl: 14, pr: 14
    });
    item.counterAxisAlignItems = 'CENTER';
    if (on) {
      const bar = figma.createRectangle();
      bar.name = 'active-bar';
      bar.resize(2, 18);
      bar.fills = [solid(C.amber)];
      bar.cornerRadius = 1;
      item.appendChild(bar);
      bar.layoutPositioning = 'ABSOLUTE';
      bar.x = -8;
      bar.y = 11;
    }
    const ic = icon(it.icon, 16, on ? '#FFFFFF' : '#FFFFFF');
    if (!on) ic.opacity = 0.66;
    item.appendChild(ic);
    const label = txt(it.lab, 13, on ? 'medium' : 'regular', '#FFFFFF');
    if (!on) label.opacity = 0.66;
    item.appendChild(label);
    f.appendChild(item);
    idx++;
  });

  const sp = mk('spacer', { w: SB - 16 });
  sp.fills = [];
  sp.layoutGrow = 1;
  f.appendChild(sp);

  const foot = vstack('side-foot', { w: SB - 16, pt: 14, pb: 14, pl: 16, pr: 16 });
  addLine(foot, 'TOP', '#FFFFFF');
  const fr = foot.children[0];
  fr.opacity = 0.08;
  const user = hstack('side-user', { gap: 10 });
  user.counterAxisAlignItems = 'CENTER';
  const av = hstack('avatar', { bg: '#FFFFFF', bgA: 0.12, radius: 14, w: 28, h: 28 });
  av.primaryAxisAlignItems = 'CENTER';
  av.counterAxisAlignItems = 'CENTER';
  av.appendChild(txt(isOps ? '张' : '周', 12, 'semibold', '#FFFFFF'));
  user.appendChild(av);
  const ut = vstack('user-text', { gap: 2 });
  ut.appendChild(txt(isOps ? '华东设备运营组' : '示例科技有限公司', 12, 'medium', '#FFFFFF'));
  ut.appendChild(txt(isOps ? '张磊 · 运维工程师' : '周明 · 企业管理员', 11, 'regular', '#FFFFFF'));
  ut.children[1].opacity = 0.45;
  user.appendChild(ut);
  foot.appendChild(user);
  f.appendChild(foot);
  return f;
}

/* 页面头 */
function pageHeader(title, sub, actions, crumb) {
  const h = hstack('page-header', { w: CW });
  h.primaryAxisAlignItems = 'SPACE_BETWEEN';
  h.counterAxisAlignItems = 'MIN';
  const left = vstack('title-block', { gap: 4 });
  if (crumb) left.appendChild(txt(crumb, 12, 'regular', C.text3));
  left.appendChild(txt(title, 20, 'semibold', C.text, { lh: 28 }));
  if (sub) left.appendChild(txt(sub, 13, 'regular', C.text3));
  h.appendChild(left);
  const right = hstack('actions', { gap: 8 });
  (actions || []).forEach(a => right.appendChild(a));
  h.appendChild(right);
  return h;
}

/* 页面外壳：main 高度量出来后再定侧栏高度 */
function screen(name, isOps, activeIdx, header, body) {
  const main = vstack('main', { w: MAIN_W, pt: PAD, pl: PAD, pr: PAD, pb: 32, gap: 16 });
  main.appendChild(header);
  main.appendChild(body);
  const rowH = main.height || 900;
  const row = hstack('body-row', { w: W, h: rowH });
  row.appendChild(sidebar(isOps, activeIdx, rowH));
  row.appendChild(main);
  const s = vstack(name, { w: W, bg: C.page });
  s.appendChild(topbar(isOps));
  s.appendChild(row);
  return s;
}

/* =====================================================================
   6. 业务数据（与 HTML 原型一致）
   ===================================================================== */
const ORDERS = [
  { id: 'DM-20261018-0094', model: '迁移一体机 M3', qty: 2, status: '待确认', tone: 'amber', created: '2026-10-18 17:02', confirmed: '—', project: '智驾路测数据回传' },
  { id: 'DM-20261016-0091', model: '迁移一体机 M3', qty: 1, status: '运输中', tone: 'blue', created: '2026-10-16 15:40', confirmed: '—', project: '路侧感知数据归档' },
  { id: 'DM-20261012-0086', model: '迁移一体机 M5', qty: 2, status: '使用中', tone: 'green', created: '2026-10-12 10:24', confirmed: '2026-10-14 09:10', project: '车联网路测数据回传' },
  { id: 'DM-20261008-0072', model: '车载迁移一体机 L2', qty: 1, status: '归还中', tone: 'amber', created: '2026-10-08 09:12', confirmed: '2026-10-09 11:05', project: '整车路采数据迁移' },
  { id: 'DM-20260921-0058', model: '迁移一体机 M3', qty: 3, status: '已完成', tone: 'gray', created: '2026-09-21 14:05', confirmed: '2026-09-23 09:30', project: '高精地图原始数据归档' },
  { id: 'DM-20260915-0041', model: '迁移一体机 M5', qty: 1, status: '已取消', tone: 'gray', created: '2026-09-15 11:20', confirmed: '—', project: '临时迁移验证' }
];
const DEVICES = [
  { sn: 'DM3-2402-0174', model: '迁移一体机 M3', status: '已锁定', tone: 'blue', wh: '杭州仓', cap: '48 TB', fw: '3.8.2', order: 'DM-20261018-0094', hb: '2026-10-19 16:10' },
  { sn: 'DM3-2402-0175', model: '迁移一体机 M3', status: '已锁定', tone: 'blue', wh: '杭州仓', cap: '48 TB', fw: '3.8.2', order: 'DM-20261018-0094', hb: '2026-10-19 16:10' },
  { sn: 'DM3-2402-0161', model: '迁移一体机 M3', status: '在途', tone: 'blue', wh: '杭州仓', cap: '48 TB', fw: '3.8.2', order: 'DM-20261016-0091', hb: '2026-10-19 15:42' },
  { sn: 'DM5-2401-0087', model: '迁移一体机 M5', status: '使用中', tone: 'green', wh: '杭州仓', cap: '96 TB', fw: '4.1.0', order: 'DM-20261012-0086', hb: '2026-10-19 16:22' },
  { sn: 'DM5-2401-0088', model: '迁移一体机 M5', status: '使用中', tone: 'green', wh: '杭州仓', cap: '96 TB', fw: '4.1.0', order: 'DM-20261012-0086', hb: '2026-10-19 16:20' },
  { sn: 'DM2-2401-0023', model: '车载迁移一体机 L2', status: '待入库', tone: 'amber', wh: '杭州仓', cap: '200 TB', fw: '2.9.4', order: 'DM-20261008-0072', hb: '2026-10-18 14:02' },
  { sn: 'DM3-2402-0121', model: '迁移一体机 M3', status: '在库可用', tone: 'green', wh: '杭州仓', cap: '48 TB', fw: '3.8.2', order: '—', hb: '2026-10-06 10:10' },
  { sn: 'DM3-2402-0164', model: '迁移一体机 M3', status: '已下架', tone: 'gray', wh: '杭州仓', cap: '48 TB', fw: '3.7.6', order: '—', hb: '2026-09-28 10:02' },
  { sn: 'DM5-2401-0090', model: '迁移一体机 M5', status: '维修中', tone: 'red', wh: '杭州仓', cap: '96 TB', fw: '4.1.0', order: '—', hb: '2026-10-11 08:30' },
  { sn: 'DM2-2401-0028', model: '车载迁移一体机 L2', status: '在库可用', tone: 'green', wh: '上海仓', cap: '200 TB', fw: '2.9.4', order: '—', hb: '2026-10-19 16:12' }
];

/* =====================================================================
   7. 页面级小组件
   ===================================================================== */
function kpiCard(label, value, unit, foot, sparkIcon) {
  const w = 384;
  const card = vstack('kpi/' + label, { w: w, bg: C.surface, border: C.border, radius: 8, pt: 16, pb: 16, pl: 18, pr: 18, gap: 6 });
  const top = hstack('kpi-top', { w: w - 36 });
  top.primaryAxisAlignItems = 'SPACE_BETWEEN';
  top.appendChild(txt(label, 13, 'regular', C.text2));
  top.appendChild(icon(sparkIcon || 'file', 15, C.text3));
  card.appendChild(top);
  card.appendChild(valueText(value, unit, 24, 13));
  card.appendChild(txt(foot, 12, 'regular', C.text3));
  return card;
}
function sparkline(vals, w, h, color) {
  const max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
  const pts = vals.map((v, i) =>
    ((i / (vals.length - 1)) * w).toFixed(1) + ',' + (h - 3 - ((v - min) / ((max - min) || 1)) * (h - 8)).toFixed(1)
  ).join(' ');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  try { return figma.createNodeFromSvg(svg); } catch (e) {
    const r = figma.createRectangle(); r.resize(w, h); r.fills = []; return r;
  }
}
function tabsRow(w, items, active) {
  const wrap = vstack('tabs', { w: w });
  const row = hstack('tab-row', { w: w, pl: 18, pr: 18, gap: 24 });
  items.forEach((it, i) => {
    const tab = hstack('tab/' + it, { pt: 12, pb: 10 });
    tab.appendChild(txt(it, 14, i === active ? 'medium' : 'regular', i === active ? C.primary : C.text2, { lh: 20 }));
    if (i === active) {
      const line = figma.createRectangle();
      line.fills = [solid(C.primary)];
      tab.appendChild(line);
      line.layoutPositioning = 'ABSOLUTE';
      line.resize(tab.width, 2);
      line.x = 0;
      line.y = tab.height - 2;
    }
    row.appendChild(tab);
  });
  addLine(row, 'BOTTOM', C.border);
  wrap.appendChild(row);
  return wrap;
}
function optCard(name, desc, price, on, w) {
  const c = vstack('opt/' + name, {
    w: w, bg: on ? '#F7FBFF' : C.surface, border: on ? C.primary : C.border, radius: 8, pt: 14, pb: 14, pl: 14, pr: 14, gap: 4
  });
  const head = hstack('opt-head', { w: w - 28, gap: 8 });
  head.primaryAxisAlignItems = 'SPACE_BETWEEN';
  head.appendChild(txt(name, 14, 'semibold', C.text));
  const radio = figma.createEllipse();
  radio.resize(14, 14);
  radio.fills = on ? [solid(C.primary)] : [solid(C.surface)];
  radio.strokes = [solid(on ? C.primary : '#D9D9D9')];
  radio.strokeWeight = on ? 4 : 1;
  head.appendChild(radio);
  c.appendChild(head);
  c.appendChild(txt(desc, 12, 'regular', C.text3, { w: w - 28 }));
  const p = hstack('price', { gap: 4, pt: 6 });
  p.counterAxisAlignItems = 'CENTER';
  p.appendChild(txt(price + ' /台/天', 13, 'semibold', C.primary));
  c.appendChild(p);
  return c;
}
function todoItem(iconName, title, sub, count, tone) {
  const map = {
    blue: { bg: C.primaryBg, fg: C.primary },
    amber: { bg: C.amberBg, fg: C.amber },
    red: { bg: C.redBg, fg: C.red },
    green: { bg: C.greenBg, fg: C.green }
  }[tone || 'blue'];
  const f = hstack('todo', { w: 300, pl: 18, pr: 18, pt: 13, pb: 13, gap: 12 });
  f.counterAxisAlignItems = 'CENTER';
  const box = hstack('todo-icon', { w: 30, h: 30, bg: map.bg, radius: 6 });
  box.primaryAxisAlignItems = 'CENTER';
  box.counterAxisAlignItems = 'CENTER';
  box.appendChild(icon(iconName, 15, map.fg));
  f.appendChild(box);
  const body = vstack('todo-body', { w: 180, gap: 2 });
  body.appendChild(txt(title, 13, 'regular', C.text));
  body.appendChild(txt(sub, 12, 'regular', C.text3, { w: 180 }));
  f.appendChild(body);
  if (count != null) f.appendChild(txt(String(count), 16, 'semibold', C.text));
  else f.appendChild(icon('right', 14, '#BFBFBF'));
  return f;
}
function timeline(items, w) {
  const f = vstack('timeline', { w: w, gap: 16 });
  items.forEach(it => { f.appendChild(timelineItem(it, w)); });
  return f;
}
function timelineItem(it, w) {
  const f = hstack('tl-item', { w: w, gap: 12 });
  f.counterAxisAlignItems = 'MIN';
  const dot = figma.createEllipse();
  dot.resize(7, 7);
  dot.fills = [solid(it.hl ? C.primary : '#D9D9D9')];
  const dotWrap = vstack('dot-wrap', { w: 7, pt: 7 });
  dotWrap.appendChild(dot);
  f.appendChild(dotWrap);
  const body = vstack('tl-body', { w: w - 19, gap: 2 });
  body.appendChild(txt(it.what, 13, 'regular', C.text));
  body.appendChild(txt(it.time, 11, 'mono', C.text3));
  if (it.note) body.appendChild(txt(it.note, 12, 'regular', C.text2));
  f.appendChild(body);
  return f;
}

/* =====================================================================
   8. 十二个页面
   ===================================================================== */
function orderRow(o) {
  const idc = vstack('order-cell', { gap: 2 });
  idc.appendChild(txt(o.id, 13, 'mono', C.text));
  idc.appendChild(txt(o.project, 12, 'regular', C.text3));
  const dev = vstack('dev-cell', { gap: 2 });
  dev.appendChild(txt(o.qty + ' 台', 13, 'regular', C.text));
  dev.appendChild(txt(o.model, 12, 'regular', C.text3));
  const ops = hstack('ops', { gap: 12 });
  ops.appendChild(txt('详情', 12, 'regular', C.primary));
  if (o.status === '运输中') ops.appendChild(txt('确认收货', 12, 'regular', C.primary));
  if (o.status === '使用中') ops.appendChild(txt('申请归还', 12, 'regular', C.primary));
  if (o.status === '待确认') ops.appendChild(txt('取消', 12, 'regular', C.primary));
  return [
    idc,
    dev,
    pill(o.status, o.tone),
    txt(o.created, 12, 'mono', C.text2),
    txt(o.confirmed, 12, 'mono', o.confirmed === '—' ? C.text3 : C.text2),
    ops
  ];
}

/* ---------- 01 客户 · 概览 ---------- */
function screenOverview() {
  const kpis = hstack('kpi-row', { w: CW, gap: 16 });
  kpis.appendChild(kpiCard('进行中订单', '3', '单', '待确认 1 · 运输中 1 · 使用中 1', 'file'));
  kpis.appendChild(kpiCard('在线设备', '2', '台', '数据迁移中 2 台 · 待归还 1 台', 'cube'));
  const k3 = kpiCard('本月已迁移', '198.8', 'TB', '较上月 +21.4%', 'down');
  k3.appendChild(sparkline([12, 18, 15, 26, 31, 28, 42], 112, 26, C.primary));
  kpis.appendChild(k3);

  const left = vstack('col-left', { w: 868, gap: 16 });
  // 进行中的订单
  const oc = panel(868, '进行中的订单', '3 单');
  const ocb = panelBody(oc, 868, { pad: 18 });
  const inner = vstack('order-card', { w: 832, border: C.border, radius: 8, pt: 16, pb: 16, pl: 18, pr: 18, gap: 16 });
  const head = hstack('oc-head', { w: 796 });
  head.primaryAxisAlignItems = 'SPACE_BETWEEN';
  head.counterAxisAlignItems = 'MIN';
  const hl = vstack('oc-meta', { gap: 6 });
  hl.appendChild(txt('DM-20261012-0086', 13, 'mono', C.text));
  const meta = hstack('meta', { gap: 20 });
  ['迁移一体机 M5 × 2 台', '杭州 · 滨江数据中心 A1', '租期至 2026-11-11'].forEach(s =>
    meta.appendChild(txt(s, 12, 'regular', C.text3)));
  hl.appendChild(meta);
  head.appendChild(hl);
  head.appendChild(pill('使用中', 'green'));
  inner.appendChild(head);
  inner.appendChild(rail([
    { lab: '提交订单', time: '10-12 10:24' },
    { lab: '受理发货', time: '10-13 08:00' },
    { lab: '确认收货', time: '10-14 09:10' },
    { lab: '归还中', time: '—' },
    { lab: '已完成', time: '—' }
  ], 2, 796));
  const ii = figma.createRectangle();
  ii.resize(796, 1);
  ii.fills = [solid(C.border2)];
  inner.appendChild(ii);
  const foot = hstack('oc-foot', { w: 796 });
  foot.primaryAxisAlignItems = 'SPACE_BETWEEN';
  foot.counterAxisAlignItems = 'CENTER';
  foot.appendChild(txt('数据迁移进行中，请在租期结束前申请归还', 12, 'regular', C.text3));
  const links = hstack('links', { gap: 12 });
  links.appendChild(txt('订单详情', 12, 'regular', C.primary));
  links.appendChild(txt('设备状态 ›', 12, 'regular', C.primary));
  foot.appendChild(links);
  inner.appendChild(foot);
  ocb.appendChild(inner);
  left.appendChild(oc);

  // 最近订单
  const rec = panel(868, '最近订单', '查看全部 ›');
  const recBody = vstack('rec-body', { w: 868 });
  recBody.appendChild(table(
    [{ w: 230, label: '订单号' }, { w: 120, label: '设备数量' }, { w: 120, label: '订单状态' },
     { w: 160, label: '创建时间' }, { w: 150, label: '确认时间' }, { w: 88, label: '操作', align: 'RIGHT' }],
    ORDERS.slice(0, 4).map(o => [
      txt(o.id, 13, 'mono', C.text),
      txt(o.qty + ' 台', 13, 'regular', C.text),
      pill(o.status, o.tone),
      txt(o.created, 12, 'mono', C.text2),
      txt(o.confirmed, 12, 'mono', C.text3),
      txt('详情', 12, 'regular', C.primary)
    ])
  ));
  rec.appendChild(recBody);
  left.appendChild(rec);

  // 右列
  const right = vstack('col-right', { w: 300, gap: 16 });
  const todo = panel(300, '待办', '3 项');
  const todoBody = vstack('todo-body', { w: 300 });
  todoBody.appendChild(todoItem('in', '待确认收货', 'DM-20261016-0091 · 1 台到货', null, 'blue'));
  todoBody.appendChild(todoItem('clock', '归还提醒', '租期至 2026-11-11 · 剩余 23 天', null, 'amber'));
  todoBody.appendChild(todoItem('bell', '资料待完善', '补全发票抬头，便于月结开票', null, 'red'));
  todo.appendChild(todoBody);
  right.appendChild(todo);

  const quick = panel(300, '快捷入口');
  const qb = panelBody(quick, 300, { pad: 18, gap: 10 });
  [btn('创建迁移订单', 'primary', 'plus'), btn('查看设备状态', 'default', 'cube'), btn('原型演示路径', 'default', 'right')]
    .forEach(b => { b.layoutAlign = 'STRETCH'; qb.appendChild(b); });
  right.appendChild(quick);

  const grid = hstack('grid', { w: CW, gap: 16 });
  grid.counterAxisAlignItems = 'MIN';
  grid.appendChild(left);
  grid.appendChild(right);

  const body = vstack('body', { w: CW, gap: 16 });
  body.appendChild(kpis);
  body.appendChild(grid);

  return screen('01 客户 · 概览', false, 0,
    pageHeader('数据迁移控制台', '示例科技有限公司 · 企业账户 · 华东区',
      [btn('使用指引', 'default'), btn('创建订单', 'primary', 'plus')]),
    body);
}

/* ---------- 02 客户 · 订单列表 ---------- */
function screenOrderList() {
  const p = panel(CW, null);
  p.appendChild(filterBar(CW,
    [
      { label: '全部', count: 6, on: true },
      { label: '待确认', count: 1 },
      { label: '运输中', count: 1 },
      { label: '使用中', count: 1 },
      { label: '归还中', count: 1 },
      { label: '已完成', count: 1 }
    ],
    [searchBox(230, '搜索订单号 / 项目 / 站点')]
  ));
  p.appendChild(table(
    [{ w: 280, label: '订单号' }, { w: 170, label: '设备数量' }, { w: 150, label: '订单状态' },
     { w: 200, label: '创建时间' }, { w: 200, label: '确认时间' }, { w: 184, label: '操作', align: 'RIGHT' }],
    ORDERS.map(orderRow),
    { rowKey: 'orderdetail' }
  ));
  p.appendChild(tblFooter(CW, 6, 6));

  const body = vstack('body', { w: CW });
  body.appendChild(p);
  return screen('02 客户 · 订单列表', false, 1,
    pageHeader('我的订单', '共 6 个订单 · 支持批量迁移与按期归还',
      [btn('导出', 'default', 'down'), btn('创建订单', 'primary', 'plus')]),
    body);
}

/* ---------- 03 客户 · 创建订单 ---------- */
function screenOrderCreate() {
  const leftPanel = panel(868, null);
  const b = panelBody(leftPanel, 868, { pad: 18, gap: 24 });

  // 步骤条
  const steps = hstack('steps', { w: 832, gap: 10 });
  steps.counterAxisAlignItems = 'CENTER';
  ['设备与租期', '迁移配置', '确认提交'].forEach((s, i) => {
    const st = hstack('step/' + s, { gap: 8 });
    st.counterAxisAlignItems = 'CENTER';
    const n = hstack('step-n', {
      w: 22, h: 22, radius: 11,
      bg: i === 0 ? C.primary : C.surface,
      border: i === 0 ? null : '#D9D9D9'
    });
    n.primaryAxisAlignItems = 'CENTER';
    n.counterAxisAlignItems = 'CENTER';
    n.appendChild(txt(String(i + 1), 12, 'mono', i === 0 ? '#FFFFFF' : C.text3));
    st.appendChild(n);
    st.appendChild(txt(s, 13, i === 0 ? 'medium' : 'regular', i === 0 ? C.text : C.text3));
    steps.appendChild(st);
    if (i < 2) {
      const line = figma.createRectangle();
      line.resize(24, 1);
      line.fills = [solid(C.border)];
      steps.appendChild(line);
    }
  });
  b.appendChild(steps);

  // 型号
  const sec1 = vstack('sec-model', { w: 832, gap: 12 });
  sec1.appendChild(txt('设备型号   按单站点数据量选择，可混合下单', 14, 'semibold', C.text));
  const opts = hstack('opts', { w: 832, gap: 12 });
  opts.appendChild(optCard('迁移一体机 M3', '便携单机 · 20–50 TB 单站点回传', '¥60', true, 269));
  opts.appendChild(optCard('迁移一体机 M5', '双节点 · 50–100 TB 批量回传', '¥110', false, 269));
  opts.appendChild(optCard('车载迁移一体机 L2', '车载加固 · 边采边传，200 TB', '¥260', false, 269));
  sec1.appendChild(opts);
  b.appendChild(sec1);

  // 数量与租期
  const sec2 = vstack('sec-qty', { w: 832, gap: 12 });
  sec2.appendChild(txt('数量与租期', 14, 'semibold', C.text));
  const row2 = hstack('row2', { w: 832, gap: 24 });
  row2.counterAxisAlignItems = 'MIN';
  const qtyCol = vstack('qty', { w: 404, gap: 6 });
  qtyCol.appendChild(txt('设备数量', 13, 'regular', C.text2));
  const stepper = hstack('stepper', { w: 118, h: 34, border: '#D9D9D9', radius: 6 });
  stepper.counterAxisAlignItems = 'CENTER';
  ['−', '2', '+'].forEach((s, i) => {
    const c = hstack('st', { w: i === 1 ? 54 : 32, h: 34, bg: C.surface });
    c.primaryAxisAlignItems = 'CENTER';
    c.counterAxisAlignItems = 'CENTER';
    c.appendChild(txt(s, i === 1 ? 13 : 15, i === 1 ? 'mono' : 'regular', i === 1 ? C.text : C.text2));
    if (i === 1) {
      c.strokes = [solid(C.border)];
      c.strokeWeight = 1;
      c.strokeAlign = 'INSIDE';
    }
    stepper.appendChild(c);
  });
  qtyCol.appendChild(stepper);
  qtyCol.appendChild(txt('当前迁移一体机 M3 可租 5 台，超出可登记排队', 12, 'regular', C.text3));
  row2.appendChild(qtyCol);

  const dayCol = vstack('days', { w: 404, gap: 10 });
  dayCol.appendChild(txt('租期', 13, 'regular', C.text2));
  const radios = hstack('radios', { gap: 18, h: 20 });
  radios.counterAxisAlignItems = 'CENTER';
  ['30 天', '60 天', '90 天'].forEach((d, i) => {
    const r = hstack('radio', { gap: 7 });
    r.counterAxisAlignItems = 'CENTER';
    const dot = figma.createEllipse();
    dot.resize(14, 14);
    dot.fills = i === 0 ? [solid(C.primary)] : [solid(C.surface)];
    dot.strokes = [solid(i === 0 ? C.primary : '#D9D9D9')];
    dot.strokeWeight = i === 0 ? 4 : 1;
    r.appendChild(dot);
    r.appendChild(txt(d, 13, 'regular', C.text));
    radios.appendChild(r);
  });
  dayCol.appendChild(radios);
  dayCol.appendChild(txt('到期前 3 天可申请续租或归还', 12, 'regular', C.text3));
  row2.appendChild(dayCol);
  sec2.appendChild(row2);
  b.appendChild(sec2);

  // 交付信息
  const sec3 = vstack('sec-deliver', { w: 832, gap: 12 });
  sec3.appendChild(txt('交付信息', 14, 'semibold', C.text));
  sec3.appendChild(txt('交付站点', 13, 'regular', C.text2));
  sec3.appendChild(inputBox(832, '杭州 · 滨江数据中心 A1'));
  sec3.appendChild(txt('期望到货日期', 13, 'regular', C.text2));
  sec3.appendChild(selectBox(832, '2026-10-21（最快）'));
  sec3.appendChild(txt('华东区顺丰陆运，通常在受理后 24–48 小时送达', 12, 'regular', C.text3));
  b.appendChild(sec3);

  // 底部
  const foot = hstack('wiz-foot', { w: 832 });
  foot.primaryAxisAlignItems = 'SPACE_BETWEEN';
  foot.counterAxisAlignItems = 'CENTER';
  foot.appendChild(btn('取消', 'default'));
  foot.appendChild(btn('下一步', 'primary'));
  b.appendChild(foot);

  // 右侧摘要
  const right = vstack('col-right', { w: 300, gap: 16 });
  const sum = panel(300, '订单摘要');
  const sb = panelBody(sum, 300, { pad: 18, gap: 0 });
  [['设备型号', '迁移一体机 M3'], ['设备数量', '2 台'], ['租期', '30 天'], ['预估数据量', '36 TB'],
   ['设备租金', '¥3,600'], ['数据服务费', '¥737']].forEach(([k, v]) => {
    const r = hstack('sum-line', { w: 264 });
    r.primaryAxisAlignItems = 'SPACE_BETWEEN';
    r.appendChild(txt(k, 13, 'regular', C.text2));
    r.appendChild(txt(v, 13, 'regular', C.text));
    r.paddingTop = 7; r.paddingBottom = 7;
    sb.appendChild(r);
  });
  addLine(sb, 'BOTTOM', C.border2);
  const tot = hstack('total', { w: 264, pt: 12 });
  tot.primaryAxisAlignItems = 'SPACE_BETWEEN';
  tot.counterAxisAlignItems = 'MAX';
  tot.appendChild(txt('预估合计', 13, 'regular', C.text2));
  tot.appendChild(txt('¥4,337', 20, 'semibold', C.amber));
  sb.appendChild(tot);
  sb.appendChild(txt('含 3 台备机保障服务。最终以运维受理后账单为准，月结客户按实际用量结算。', 12, 'regular', C.text3, { w: 264 }));
  right.appendChild(sum);

  const tip = panel(300, '交付说明');
  const tb = panelBody(tip, 300, { pad: 18 });
  tb.appendChild(txt('· 设备含防震箱、线缆与上电套件\n· 受理后 24–48 小时送达\n· 归还时使用同箱寄回，运费由平台承担', 12, 'regular', C.text2, { w: 264, lh: 20 }));
  right.appendChild(tip);

  const grid = hstack('grid', { w: CW, gap: 16 });
  grid.counterAxisAlignItems = 'MIN';
  grid.appendChild(leftPanel);
  grid.appendChild(right);

  const body = vstack('body', { w: CW });
  body.appendChild(grid);

  return screen('03 客户 · 创建订单', false, 1,
    pageHeader('创建迁移订单', '选择设备与租期，提交后由运维受理并发货',
      [btn('我的订单', 'default')], '‹ 返回 / 我的订单'),
    body);
}

/* ---------- 04 客户 · 订单详情 ---------- */
function screenOrderDetail() {
  const metrics = hstack('metrics', { w: CW, border: C.border, radius: 8, bg: C.surface });
  const cols = [237, 237, 237, 237, 236];
  const data = [
    ['订单号', 'DM-20261012-0086'],
    ['设备数量', '2 台'],
    ['订单状态', '使用中'],
    ['创建时间', '2026-10-12 10:24'],
    ['确认时间', '2026-10-14 09:10']
  ];
  data.forEach((d, i) => {
    const m = vstack('metric/' + d[0], { w: cols[i], pt: 14, pb: 14, pl: 16, pr: 16, gap: 6 });
    m.appendChild(txt(d[0], 12, 'regular', C.text3));
    if (i === 2) m.appendChild(pill('使用中', 'green'));
    else m.appendChild(txt(d[1], i === 1 ? 18 : 13, i === 1 ? 'semibold' : (i === 0 ? 'mono' : 'mono'), C.text));
    if (i < 4) addLine(m, 'RIGHT', C.border2);
    metrics.appendChild(m);
  });

  const left = vstack('col-left', { w: 868, gap: 16 });
  const p = panel(868, null);
  const railWrap = vstack('rail-wrap', { w: 868, pt: 18, pb: 6, pl: 18, pr: 18 });
  railWrap.appendChild(txt('订单进度', 12, 'regular', C.text3));
  const r2 = vstack('rail-inner', { w: 832, pt: 14 });
  r2.appendChild(rail([
    { lab: '提交订单', time: '10-12 10:24' },
    { lab: '受理发货', time: '10-13 08:00' },
    { lab: '确认收货', time: '10-14 09:10' },
    { lab: '归还中', time: '—' },
    { lab: '已完成', time: '—' }
  ], 2, 832));
  railWrap.appendChild(r2);
  p.appendChild(railWrap);

  const nWrap = vstack('notice-wrap', { w: 868, pl: 18, pr: 18, pb: 16 });
  nWrap.appendChild(notice('数据迁移进行中，请在租期结束前申请归还。', 'amber', 832));
  p.appendChild(nWrap);

  p.appendChild(tabsRow(868, ['设备清单 2', '订单信息', '操作日志 4'], 0));
  p.appendChild(table(
    [{ w: 200, label: '设备 SN' }, { w: 140, label: '型号' }, { w: 120, label: '设备状态' },
     { w: 170, label: '容量使用' }, { w: 150, label: '最后心跳' }, { w: 88, label: '操作', align: 'RIGHT' }],
    [
      ['DM5-2401-0087', '迁移一体机 M5', '使用中', 31, '2026-10-19 16:22'],
      ['DM5-2401-0088', '迁移一体机 M5', '使用中', 28, '2026-10-19 16:20']
    ].map(d => [
      txt(d[0], 12, 'mono', C.text),
      txt(d[1], 13, 'regular', C.text),
      pill(d[2], 'green'),
      progressCell(88, d[3], C.amber),
      txt(d[4], 12, 'mono', C.text3),
      hstack('ops', { gap: 12 })
    ].map((n, i) => {
      if (i === 5) {
        n.appendChild(txt('详情', 12, 'regular', C.primary));
        n.appendChild(txt('更换', 12, 'regular', C.primary));
      }
      return n;
    }))
  ));
  left.appendChild(p);

  const right = vstack('col-right', { w: 300, gap: 16 });
  const task = panel(300, '迁移任务');
  const tb = panelBody(task, 300, { pad: 16 });
  const tr1 = hstack('task-row', { w: 268 });
  tr1.primaryAxisAlignItems = 'SPACE_BETWEEN';
  tr1.appendChild(txt('已迁移', 13, 'regular', C.text2));
  tr1.appendChild(txt('56.8 / 192 TB', 13, 'regular', C.text));
  tb.appendChild(tr1);
  const barWrap = vstack('bar-wrap', { w: 268, pt: 8, pb: 12 });
  barWrap.appendChild(progress(268, 30, C.amber));
  tb.appendChild(barWrap);
  [['目标区域', '华东1（杭州）'], ['数据源', '车载采集硬盘'], ['结算', '¥11,460']].forEach(([k, v]) => {
    const r = hstack('kv', { w: 268 });
    r.primaryAxisAlignItems = 'SPACE_BETWEEN';
    r.paddingTop = 5; r.paddingBottom = 5;
    r.appendChild(txt(k, 13, 'regular', C.text2));
    r.appendChild(txt(v, 12, 'regular', C.text));
    tb.appendChild(r);
  });
  right.appendChild(task);

  const ret = panel(300, '归还信息');
  const rb = panelBody(ret, 300, { pad: 16 });
  rb.appendChild(txt('归还地址：杭州市滨江区江陵路 88 号 3 号仓\n收货人：张磊 · 0571-8888 6621', 12, 'regular', C.text2, { w: 268, lh: 20 }));
  rb.appendChild(txt('租期至 2026-11-11，逾期按日计费', 12, 'regular', C.amber));
  right.appendChild(ret);

  const grid = hstack('grid', { w: CW, gap: 16 });
  grid.counterAxisAlignItems = 'MIN';
  grid.appendChild(left);
  grid.appendChild(right);

  const body = vstack('body', { w: CW, gap: 16 });
  body.appendChild(metrics);
  body.appendChild(grid);

  return screen('04 客户 · 订单详情', false, 1,
    pageHeader('DM-20261012-0086', '迁移一体机 M5 × 2 台 · 创建于 2026-10-12 10:24',
      [btn('申请更换设备', 'default'), btn('申请归还', 'primary')], '‹ 返回 / 我的订单'),
    body);
}

/* ---------- 05 客户 · 设备列表 ---------- */
function screenDeviceList() {
  const p = panel(CW, null);
  p.appendChild(filterBar(CW,
    [{ label: '全部', count: 9, on: true }, { label: '使用中', count: 2 }, { label: '在途', count: 3 },
     { label: '待归还', count: 1 }, { label: '已回库', count: 3 }],
    [searchBox(220, '搜索设备 SN / 订单号')]
  ));
  p.appendChild(table(
    [{ w: 240, label: '设备 SN' }, { w: 150, label: '设备状态' }, { w: 260, label: '容量使用' },
     { w: 220, label: '所属订单' }, { w: 200, label: '最后心跳' }, { w: 114, label: '操作', align: 'RIGHT' }],
    DEVICES.slice(0, 7).map(d => {
      const sn = vstack('sn', { gap: 2 });
      sn.appendChild(txt(d.sn, 12, 'mono', C.text));
      sn.appendChild(txt(d.model, 12, 'regular', C.text3));
      return [
        sn,
        pill(d.status, d.tone),
        progressCell(96, d.status === '使用中' ? 31 : 0, C.amber),
        txt(d.order, 12, 'mono', C.text),
        txt(d.hb, 12, 'mono', C.text3),
        (function () {
          const o = hstack('ops', { gap: 12 });
          o.appendChild(txt('详情', 12, 'regular', C.primary));
          return o;
        })()
      ];
    }),
    { rowKey: 'devicedetail' }
  ));
  p.appendChild(tblFooter(CW, 9, 9));

  const body = vstack('body', { w: CW });
  body.appendChild(p);
  return screen('05 客户 · 设备列表', false, 2,
    pageHeader('设备管理', '共 9 台设备 · 数据迁移中 2 台', [btn('导出清单', 'default', 'down')]),
    body);
}

/* ---------- 06 / 11 设备详情（客户 / 运维） ---------- */
function screenDeviceDetail(isOps) {
  const metrics = hstack('metrics', { w: CW, border: C.border, radius: 8, bg: C.surface });
  [['已迁移数据', '29.6', 'TB'], ['实时速率', '1.24', 'Gbps'], ['设备温度', '41', '°C'], ['固件版本', '4.1.0', '']]
    .forEach((d, i) => {
      const m = vstack('metric/' + d[0], { w: 296, pt: 14, pb: 14, pl: 16, pr: 16, gap: 6 });
      m.appendChild(txt(d[0], 12, 'regular', C.text3));
      if (i === 3) m.appendChild(txt(d[1], 15, 'mono', C.text));
      else m.appendChild(valueText(d[1], ' ' + d[2], 18, 12));
      if (i < 3) addLine(m, 'RIGHT', C.border2);
      metrics.appendChild(m);
    });

  const left = vstack('col-left', { w: 868, gap: 16 });
  const capPanel = panel(868, '容量与迁移进度', '29.6 / 96 TB');
  const cb = panelBody(capPanel, 868, { pad: 18 });
  cb.appendChild(progress(832, 31, C.amber));
  const legend = hstack('legend', { w: 832, pt: 6 });
  legend.primaryAxisAlignItems = 'SPACE_BETWEEN';
  legend.appendChild(txt('已用 31%', 12, 'regular', C.text3));
  legend.appendChild(txt('剩余 66.4 TB', 12, 'regular', C.text3));
  cb.appendChild(legend);

  // 容量趋势图
  const chartW = 832, chartH = 150;
  const vals = [0, 4.2, 9.1, 14.8, 21.3, 25.6, 29.6];
  const maxV = 48, padY = 20;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * chartW;
    const y = chartH - padY - (v / maxV) * (chartH - padY * 2);
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + chartW + '" height="' + chartH + '" viewBox="0 0 ' + chartW + ' ' + chartH + '">' +
    [0, 1, 2, 3].map(i => '<line x1="0" x2="' + chartW + '" y1="' + (padY + i * (chartH - padY * 2) / 3).toFixed(1) + '" y2="' + (padY + i * (chartH - padY * 2) / 3).toFixed(1) + '" stroke="#F0F0F0" stroke-width="1"/>').join('') +
    '<polyline points="' + pts + '" fill="none" stroke="' + C.amber + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  try {
    const chart = figma.createNodeFromSvg(svg);
    chart.name = 'chart/容量趋势';
    const cw = vstack('chart-wrap', { w: 832, pt: 16 });
    cw.appendChild(chart);
    cb.appendChild(cw);
  } catch (e) { /* 跳过图表 */ }
  const cl = hstack('chart-legend', { w: 832, gap: 16, pt: 8 });
  cl.appendChild(txt('● 累计迁移量（TB）', 12, 'regular', C.amber));
  cl.appendChild(txt('近 7 天 · 每 24h 采样', 12, 'regular', C.text3));
  cb.appendChild(cl);
  left.appendChild(capPanel);

  const ev = panel(868, '设备事件');
  const eb = panelBody(ev, 868, { pad: 18 });
  eb.appendChild(timeline([
    { what: '心跳上报', time: '2026-10-19 16:22', note: '速率 1.24 Gbps · 温度 41°C', hl: true },
    { what: '迁移任务分片完成', time: '2026-10-18 02:10', note: '分片 12/36 校验通过' },
    { what: '网络抖动', time: '2026-10-17 23:40', note: '重传 3 次后恢复，无数据丢失' },
    { what: '设备上线', time: '2026-10-14 09:10', note: '固件 4.1.0 · 自检通过' }
  ], 832));
  left.appendChild(ev);

  const right = vstack('col-right', { w: 300, gap: 16 });
  const info = panel(300, '设备信息');
  const ib = panelBody(info, 300, { pad: 16, gap: 10 });
  [['设备型号', '迁移一体机 M5'], ['额定容量', '96 TB'], ['所在仓库', '杭州仓'], ['部署位置', '杭州 · 滨江 A1'],
   ['上线时间', '2026-10-14'], ['固件版本', '4.1.0'], ['归属订单', 'DM-20261012-0086']].forEach(([k, v]) => {
    const r = hstack('kv', { w: 268 });
    r.counterAxisAlignItems = 'MIN';
    r.appendChild(txt(k, 13, 'regular', C.text3, { w: 96 }));
    r.appendChild(txt(v, 13, 'regular', k === '归属订单' ? C.primary : C.text, { w: 160 }));
    ib.appendChild(r);
  });
  right.appendChild(info);

  const quick = panel(300, '快捷操作');
  const qb = panelBody(quick, 300, { pad: 16, gap: 8 });
  const acts = isOps
    ? [['远程重启', 'default'], ['转维修', 'default'], ['报废登记', 'danger']]
    : [['重启诊断', 'default'], ['提交工单', 'default'], ['联系运维', 'default']];
  acts.forEach(([lab, kind]) => {
    const b = btn(lab, kind);
    b.layoutAlign = 'STRETCH';
    qb.appendChild(b);
  });
  right.appendChild(quick);

  const grid = hstack('grid', { w: CW, gap: 16 });
  grid.counterAxisAlignItems = 'MIN';
  grid.appendChild(left);
  grid.appendChild(right);

  const body = vstack('body', { w: CW, gap: 16 });
  body.appendChild(metrics);
  body.appendChild(grid);

  return screen(isOps ? '11 运维 · 设备状态' : '06 客户 · 设备详情', isOps, isOps ? 1 : 2,
    pageHeader('DM5-2401-0087   ' + (isOps ? '在库可用' : '使用中'), '迁移一体机 M5 · 杭州 · 滨江 A1',
      isOps ? [btn('下架', 'primary'), btn('报修', 'default')] : [btn('报障', 'default'), btn('申请更换', 'primary')],
      isOps ? '‹ 返回 / 设备库存' : '‹ 返回 / 设备管理'),
    body);
}

/* ---------- 07 运维 · 库存概览 ---------- */
function screenOpsOverview() {
  const kpis = hstack('kpi-row', { w: CW, gap: 16 });
  kpis.appendChild(kpiCard('在库可用', '10', '台', '杭州 7 · 上海 2 · 广州 1', 'box'));
  kpis.appendChild(kpiCard('已出库', '5', '台', '使用中 2 · 在途 3 · 锁定 0', 'out'));
  kpis.appendChild(kpiCard('待处理', '4', '项', '待受理 1 · 待入库 1 · 维修 1', 'bell'));

  const left = vstack('col-left', { w: 868, gap: 16 });
  const wh = panel(868, '仓库分布', '设备库存 ›');
  const wb = vstack('wh-body', { w: 868 });
  const hrow = hstack('wh-head', { w: 868, h: 38, pl: 18, pr: 18, bg: '#FAFAFA' });
  [200, 140, 140, 140, 212].forEach((cw, idx) => {
    const c = hstack('wh-cell', { w: cw });
    c.appendChild(txt(['仓库', '在库可用', '已出库', '待入库', '容量占用'][idx], 12, 'regular', C.text3));
    hrow.appendChild(c);
  });
  addLine(hrow, 'BOTTOM', C.border);
  wb.appendChild(hrow);
  [['杭州仓', '10 台', '5 台', '1 台', 78], ['上海仓', '4 台', '0 台', '0 台', 46], ['广州仓', '1 台', '0 台', '0 台', 18]]
    .forEach((r, ri) => {
      const row = hstack('wh-row', { w: 868, h: 48, pl: 18, pr: 18 });
      row.counterAxisAlignItems = 'CENTER';
      const cells = [r[0], r[1], r[2], r[3]];
      cells.forEach((v, idx) => {
        const c = hstack('wh-cell', { w: [200, 140, 140, 140][idx] });
        c.counterAxisAlignItems = 'CENTER';
        c.appendChild(txt(v, idx === 0 ? 13 : 12, idx === 0 ? 'regular' : 'mono', C.text));
        row.appendChild(c);
      });
      const barCell = hstack('bar-cell', { w: 212, gap: 8 });
      barCell.counterAxisAlignItems = 'CENTER';
      barCell.appendChild(progress(96, r[4], C.primary));
      barCell.appendChild(txt(r[4] + '%', 12, 'mono', C.text2));
      row.appendChild(barCell);
      if (ri < 2) addLine(row, 'BOTTOM', C.border2);
      wb.appendChild(row);
    });
  wh.appendChild(wb);
  left.appendChild(wh);

  const mv = panel(868, '最近出入库', '全部记录 ›');
  const mvb = vstack('mv-body', { w: 868 });
  mvb.appendChild(table(
    [{ w: 200, label: '时间' }, { w: 110, label: '类型' }, { w: 200, label: '设备 SN' },
     { w: 238, label: '关联订单' }, { w: 120, label: '操作人' }],
    [
      ['2026-10-18 14:20', '入库', 'DM2-2401-0023', 'DM-20261008-0072', '张磊'],
      ['2026-10-17 09:20', '出库', 'DM3-2402-0161', 'DM-20261016-0091', '张磊'],
      ['2026-10-06 10:15', '上架', 'DM3-2402-0121', 'DM-20260921-0058', '李倩'],
      ['2026-10-04 16:00', '入库', 'DM3-2402-0123', 'DM-20260921-0058', '张磊'],
      ['2026-09-28 10:02', '下架', 'DM3-2402-0164', '—', '李倩']
    ].map(r => [
      txt(r[0], 12, 'mono', C.text3),
      pill(r[1], r[1] === '入库' ? 'amber' : r[1] === '出库' ? 'blue' : r[1] === '上架' ? 'green' : 'gray'),
      txt(r[2], 12, 'mono', C.text),
      txt(r[3], 12, 'mono', C.text3),
      txt(r[4], 13, 'regular', C.text)
    ])
  ));
  mv.appendChild(mvb);
  left.appendChild(mv);

  const right = vstack('col-right', { w: 300, gap: 16 });
  const todo = panel(300, '待处理事项', '按优先级');
  const tb = vstack('todo-body', { w: 300 });
  tb.appendChild(todoItem('file', '待受理订单', '客户已提交，需确认库存并出库', 1, 'blue'));
  tb.appendChild(todoItem('in', '待入库设备', '客户已寄回，等待签收与检测', 1, 'amber'));
  tb.appendChild(todoItem('clock', '检测中设备', '检测通过后需恢复上架', 1, 'amber'));
  tb.appendChild(todoItem('bell', '维修中设备', '超过 7 天未修复将触发库存预警', 1, 'red'));
  todo.appendChild(tb);
  right.appendChild(todo);

  const grid = hstack('grid', { w: CW, gap: 16 });
  grid.counterAxisAlignItems = 'MIN';
  grid.appendChild(left);
  grid.appendChild(right);

  const body = vstack('body', { w: CW, gap: 16 });
  body.appendChild(kpis);
  body.appendChild(grid);

  return screen('07 运维 · 库存概览', true, 0,
    pageHeader('库存概览', '华东设备运营组 · 20 台在册设备 · 数据截至 16:24',
      [btn('库存报表', 'default', 'down'), btn('管理库存', 'primary')]),
    body);
}

/* ---------- 08 运维 · 设备库存 ---------- */
function screenInventory() {
  const p = panel(CW, null);
  p.appendChild(filterBar(CW,
    [{ label: '全部', count: 20, on: true }, { label: '在库可用', count: 10 }, { label: '已出库', count: 5 },
     { label: '待入库', count: 1 }, { label: '维修', count: 1 }, { label: '已下架', count: 3 }],
    [selectBox(132, '全部型号'), selectBox(120, '全部仓库'), searchBox(200, '搜索 SN / 订单号')]
  ));
  p.appendChild(table(
    [{ w: 40, label: '', pad: 12 }, { w: 220, label: '设备 SN' }, { w: 130, label: '状态' }, { w: 110, label: '仓库' },
     { w: 100, label: '容量' }, { w: 100, label: '固件' }, { w: 230, label: '所属订单' },
     { w: 170, label: '最后心跳' }, { w: 84, label: '操作', align: 'RIGHT' }],
    DEVICES.map(d => {
      const cb = figma.createRectangle();
      cb.resize(15, 15);
      cb.cornerRadius = 3;
      cb.fills = [solid(C.surface)];
      cb.strokes = [solid('#D9D9D9')];
      cb.strokeWeight = 1;
      const sn = vstack('sn', { gap: 2 });
      sn.appendChild(txt(d.sn, 12, 'mono', C.text));
      sn.appendChild(txt(d.model, 12, 'regular', C.text3));
      const act = d.status === '在库可用' ? '下架'
        : d.status === '已下架' ? '上架'
        : d.status === '待入库' ? '入库检测'
        : d.status === '维修中' ? '修复上架' : '详情';
      return [
        cb,
        sn,
        pill(d.status, d.tone),
        txt(d.wh, 13, 'regular', C.text),
        txt(d.cap, 12, 'mono', C.text),
        txt(d.fw, 12, 'mono', C.text3),
        txt(d.order, 12, 'mono', d.order === '—' ? C.text3 : C.primary),
        txt(d.hb, 12, 'mono', C.text3),
        txt(act, 12, 'regular', C.primary)
      ];
    })
  ));
  p.appendChild(tblFooter(CW, 20, 20));

  const body = vstack('body', { w: CW });
  body.appendChild(p);
  return screen('08 运维 · 设备库存', true, 1,
    pageHeader('设备库存', '共 20 台 · 在库可用 10 台 · 待入库 1 台',
      [btn('导出', 'default', 'down'), btn('设备入库', 'primary', 'plus')]),
    body);
}

/* ---------- 09 运维 · 订单受理 ---------- */
function screenOpsOrders() {
  const p = panel(CW, null);
  p.appendChild(filterBar(CW,
    [{ label: '全部', count: 6, on: true }, { label: '待受理', count: 1 }, { label: '运输中', count: 1 },
     { label: '待入库', count: 1 }, { label: '已完成', count: 1 }],
    [searchBox(220, '搜索订单号 / 项目')]
  ));
  p.appendChild(table(
    [{ w: 260, label: '订单号' }, { w: 150, label: '客户' }, { w: 180, label: '设备' },
     { w: 120, label: '状态' }, { w: 150, label: '创建时间' }, { w: 150, label: '确认时间' },
     { w: 174, label: '操作', align: 'RIGHT' }],
    ORDERS.map(o => {
      const idc = vstack('order-cell', { gap: 2 });
      idc.appendChild(txt(o.id, 13, 'mono', C.text));
      idc.appendChild(txt(o.project, 12, 'regular', C.text3));
      const ops = hstack('ops', { gap: 12 });
      if (o.status === '待确认') ops.appendChild(txt('受理发货', 12, 'regular', C.primary));
      if (o.status === '归还中') ops.appendChild(txt('登记入库', 12, 'regular', C.primary));
      ops.appendChild(txt('查看', 12, 'regular', C.primary));
      return [
        idc,
        txt('示例科技有限公司', 13, 'regular', C.text),
        vstack('dev', { gap: 2 }),
        pill(o.status, o.tone),
        txt(o.created, 12, 'mono', C.text2),
        txt(o.confirmed, 12, 'mono', o.confirmed === '—' ? C.text3 : C.text2),
        ops
      ].map((n, idx) => {
        if (idx === 2) {
          n.appendChild(txt(o.qty + ' 台', 13, 'regular', C.text));
          n.appendChild(txt(o.model, 12, 'regular', C.text3));
        }
        return n;
      });
    })
  ));
  p.appendChild(tblFooter(CW, 6, 6));

  const body = vstack('body', { w: CW });
  body.appendChild(p);
  return screen('09 运维 · 订单受理', true, 2,
    pageHeader('订单受理', '客户订单在这里受理、发货与登记归还', [btn('导出', 'default', 'down')]),
    body);
}

/* ---------- 10 运维 · 出入库记录 ---------- */
function screenMovements() {
  const p = panel(CW, null);
  p.appendChild(filterBar(CW,
    [{ label: '全部', count: 6, on: true }, { label: '入库', count: 2 }, { label: '出库', count: 1 },
     { label: '上架', count: 2 }, { label: '下架', count: 1 }],
    [searchBox(220, '搜索 SN / 订单 / 操作人')]
  ));
  p.appendChild(table(
    [{ w: 200, label: '时间' }, { w: 110, label: '类型' }, { w: 220, label: '设备 SN' },
     { w: 260, label: '关联订单' }, { w: 120, label: '操作人' }, { w: 274, label: '备注' }],
    [
      ['2026-10-18 14:20', '入库', 'DM2-2401-0023', 'DM-20261008-0072', '张磊', '客户寄回，待检测'],
      ['2026-10-17 09:20', '出库', 'DM3-2402-0161', 'DM-20261016-0091', '张磊', '杭州仓 → 苏州 · 顺丰 SF7788990011'],
      ['2026-10-06 10:15', '上架', 'DM3-2402-0121', 'DM-20260921-0058', '李倩', '检测通过，恢复可用'],
      ['2026-10-06 10:12', '上架', 'DM3-2402-0123', 'DM-20260921-0058', '李倩', '检测通过，调拨上海仓'],
      ['2026-10-04 16:00', '入库', 'DM3-2402-0121', 'DM-20260921-0058', '张磊', '批量归还 3 台'],
      ['2026-09-28 10:02', '下架', 'DM3-2402-0164', '—', '李倩', '固件低于基线，暂停出租']
    ].map(r => [
      txt(r[0], 12, 'mono', C.text),
      pill(r[1], r[1] === '入库' ? 'amber' : r[1] === '出库' ? 'blue' : r[1] === '上架' ? 'green' : 'gray'),
      txt(r[2], 12, 'mono', C.text),
      txt(r[3], 12, 'mono', C.text3),
      txt(r[4], 13, 'regular', C.text),
      txt(r[5], 12, 'regular', C.text2)
    ])
  ));
  p.appendChild(tblFooter(CW, 6, 6));

  const body = vstack('body', { w: CW });
  body.appendChild(p);
  return screen('10 运维 · 出入库记录', true, 3,
    pageHeader('出入库记录', '全量设备流转流水，按时间倒序', [btn('导出流水', 'default', 'down')]),
    body);
}

/* ---------- 00 设计说明 ---------- */
function screenNotes() {
  const f = vstack('00 设计说明', { w: W, bg: C.surface, pt: 56, pl: 64, pr: 64, pb: 56, gap: 8 });
  f.appendChild(txt('数据迁移平台 · 车载数据回传与设备租赁', 32, 'semibold', C.text, { lh: 44 }));
  f.appendChild(txt('交互原型 · v1.0 · 2026-10-19 · 客户控制台 6 屏 + 运维后台 5 屏', 14, 'regular', C.text3));

  const hr = figma.createRectangle();
  hr.resize(W - 128, 1);
  hr.fills = [solid(C.border)];
  f.appendChild(hr);

  const cols = hstack('cols', { w: W - 128, gap: 48, pt: 24 });
  cols.counterAxisAlignItems = 'MIN';

  // 色板
  const c1 = vstack('col/colors', { w: 300, gap: 10 });
  c1.appendChild(txt('色板', 15, 'semibold', C.text));
  [['主色', C.primary, '#1677FF'], ['强调橙', C.amber, '#FA8C16'], ['深色侧栏', C.navy, '#001529'],
   ['页面底色', C.page, '#F0F2F5'], ['描边', C.border, '#E8E8E8'], ['正文', C.text, '#141414'],
   ['次要文字', C.text3, '#8C8C8C'], ['成功', C.green, '#52C41A'], ['危险', C.red, '#FF4D4F']]
    .forEach(([n, hex, label]) => {
      const r = hstack('swatch', { gap: 10 });
      r.counterAxisAlignItems = 'CENTER';
      const sq = figma.createRectangle();
      sq.resize(20, 20);
      sq.cornerRadius = 4;
      sq.fills = [solid(hex)];
      if (hex === '#FFFFFF' || hex === '#F0F2F5') {
        sq.strokes = [solid(C.border)];
        sq.strokeWeight = 1;
      }
      r.appendChild(sq);
      r.appendChild(txt(n, 12, 'regular', C.text, { w: 84 }));
      r.appendChild(txt(label, 11, 'mono', C.text3));
      c1.appendChild(r);
    });
  cols.appendChild(c1);

  // 文字层级
  const c2 = vstack('col/type', { w: 300, gap: 10 });
  c2.appendChild(txt('文字层级', 15, 'semibold', C.text));
  [['页面标题', '20 / Semibold', 20, 'semibold'], ['区块标题', '15 / Semibold', 15, 'semibold'],
   ['正文', '13 / Regular', 13, 'regular'], ['辅助文字', '12 / Regular', 12, 'regular'],
   ['数据', '12 / Mono', 12, 'mono'], ['指标值', '24 / Semibold', 24, 'semibold']]
    .forEach(([n, spec, size, w]) => {
      const r = hstack('type-row', { w: 300 });
      r.primaryAxisAlignItems = 'SPACE_BETWEEN';
      r.counterAxisAlignItems = 'CENTER';
      r.paddingTop = 6; r.paddingBottom = 6;
      r.appendChild(txt(n, size, w, C.text));
      r.appendChild(txt(spec, 11, 'mono', C.text3));
      c2.appendChild(r);
    });
  c2.appendChild(txt('字体：PingFang SC；数据用 SF Mono。间距基数 4，圆角 button 6 / card 8。', 12, 'regular', C.text3, { w: 300, lh: 20 }));
  cols.appendChild(c2);

  // 状态机
  const c3 = vstack('col/flow', { w: 520, gap: 10 });
  c3.appendChild(txt('主流程状态机', 15, 'semibold', C.text));
  const flow = vstack('flow', { w: 520, gap: 8 });
  [
    ['1', '客户创建订单', '订单：待确认 · 设备：已锁定', 'amber'],
    ['2', '运维受理发货', '订单：运输中 · 设备：在途', 'blue'],
    ['3', '客户确认收货', '订单：使用中 · 设备：使用中', 'green'],
    ['4', '客户申请归还', '订单：归还中 · 设备：待入库', 'amber'],
    ['5', '运维入库检测 → 上架', '订单：已完成 · 设备：在库可用', 'gray']
  ].forEach(([n, t, s, tone]) => {
    const r = hstack('flow-row', { w: 520, gap: 10 });
    r.counterAxisAlignItems = 'CENTER';
    const idx = hstack('idx', { w: 20, h: 20, radius: 10, bg: TONE[tone].bg, border: TONE[tone].bd });
    idx.primaryAxisAlignItems = 'CENTER';
    idx.counterAxisAlignItems = 'CENTER';
    idx.appendChild(txt(n, 11, 'mono', TONE[tone].fg));
    r.appendChild(idx);
    r.appendChild(txt(t, 13, 'medium', C.text, { w: 190 }));
    r.appendChild(txt(s, 12, 'regular', C.text3, { w: 290 }));
    flow.appendChild(r);
  });
  c3.appendChild(flow);
  c3.appendChild(txt('两端的订单与设备状态由同一状态机驱动：运维操作会直接改变客户端看到的状态，反之亦然。', 12, 'regular', C.text3, { w: 520, lh: 20 }));
  cols.appendChild(c3);

  f.appendChild(cols);
  return f;
}

/* =====================================================================
   8.5 原型连线：把静态 Frame 接成可点击跳转的 Prototype
   ===================================================================== */
const SCREEN_KEYS = {
  '01 客户 · 概览': 'overview',
  '02 客户 · 订单列表': 'orders',
  '03 客户 · 创建订单': 'create',
  '04 客户 · 订单详情': 'orderdetail',
  '05 客户 · 设备列表': 'devices',
  '06 客户 · 设备详情': 'devicedetail',
  '07 运维 · 库存概览': 'ops',
  '08 运维 · 设备库存': 'inventory',
  '09 运维 · 订单受理': 'opsorders',
  '10 运维 · 出入库记录': 'movements',
  '11 运维 · 设备状态': 'opsdevice'
};

/* 侧栏导航：按文案映射目标页 */
const NAV_ROUTES = {
  '概览': 'overview',
  '我的订单': 'orders',
  '设备管理': 'devices',
  '库存概览': 'ops',
  '设备库存': 'inventory',
  '订单受理': 'opsorders',
  '出入库记录': 'movements'
};

/* 按钮：按「所在页面 + 按钮文案」映射，避免同名按钮串页 */
const BTN_ROUTES = {
  '01 客户 · 概览': { '创建迁移订单': 'create', '创建订单': 'create', '查看设备状态': 'devices', '原型演示路径': 'orders' },
  '02 客户 · 订单列表': { '创建订单': 'create' },
  '03 客户 · 创建订单': { '取消': 'orders', '下一步': 'orderdetail', '我的订单': 'orders' },
  '04 客户 · 订单详情': { '申请归还': 'devices', '申请更换设备': 'devices', '我的订单': 'orders' },
  '06 客户 · 设备详情': { '申请更换': 'devices' },
  '07 运维 · 库存概览': { '管理库存': 'inventory', '库存报表': 'movements' }
};

function nodeText(n) {
  let s = '';
  (n.children || []).forEach(c => {
    if (c.type === 'TEXT') s += c.characters || '';
    else s += nodeText(c);
  });
  return s;
}

/* 兼容两代 Reaction 结构：新 API 用 actions 数组，旧版用单个 action */
function setNav(node, destId) {
  if (!node || typeof node.setReactionsAsync !== 'function') return Promise.resolve(false);
  const trigger = { type: 'ON_CLICK' };
  const action = {
    type: 'NODE',
    destinationId: destId,
    navigation: 'NAVIGATE',
    transition: null,
    preserveScrollPosition: false
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
    const k = SCREEN_KEYS[fr.name];
    if (k) byKey[k] = fr;
  });

  const tasks = [];
  frames.forEach(fr => {
    const sk = SCREEN_KEYS[fr.name];
    if (!sk) return;
    const btnMap = BTN_ROUTES[fr.name] || {};
    (function walk(n) {
      const nm = n.name || '';
      let dest = null;
      if (nm.indexOf('nav/') === 0) {
        dest = NAV_ROUTES[nm.slice(4)];
      } else if (nm.indexOf('btn/') === 0) {
        dest = btnMap[nm.slice(4)];
      } else if (nm === 'switch-item') {
        const t = nodeText(n);
        if (t.indexOf('客户控制台') > -1) dest = 'overview';
        else if (t.indexOf('运维后台') > -1) dest = 'ops';
      } else if (nm.indexOf('link:') === 0) {
        dest = nm.slice(5);
      }
      if (dest && dest !== sk && byKey[dest]) tasks.push([n, byKey[dest].id]);
      (n.children || []).forEach(walk);
    })(fr);
  });

  return Promise.all(tasks.map(t => setNav(t[0], t[1]))).then(rs => ({
    total: tasks.length,
    ok: rs.filter(Boolean).length
  }));
}

/* =====================================================================
   9. 主流程
   ===================================================================== */
(async function () {
  try {
    await loadFonts();
    // 免费版 Starter 计划最多 3 个 page，createPage 可能被拒；失败则降级为复用当前页
    let page, createdNew = false;
    try {
      page = figma.createPage();
      page.name = '数据迁移平台 · 原型 v1';
      figma.currentPage = page;
      createdNew = true;
    } catch (pageErr) {
      page = figma.currentPage;
      figma.notify('当前计划无法新建 page，改用当前页面承载原型', { timeout: 4000 });
    }

    const frames = [
      screenNotes(),
      screenOverview(),
      screenOrderList(),
      screenOrderCreate(),
      screenOrderDetail(),
      screenDeviceList(),
      screenDeviceDetail(false),
      screenOpsOverview(),
      screenInventory(),
      screenOpsOrders(),
      screenMovements(),
      screenDeviceDetail(true)
    ];

    // 双列排布，列间距 120，行间距 160
    // 复用用户页面时，把整块内容放到已有内容下方，避免重叠
    let startY = 0;
    if (!createdNew) {
      try {
        const mine = frames.indexOf ? frames : [];
        let bottom = 0;
        figma.currentPage.children.forEach(n => {
          if (mine.indexOf(n) > -1) return;
          bottom = Math.max(bottom, n.y + n.height);
        });
        if (bottom > 0) startY = bottom + 240;
      } catch (stackErr) { /* 取不到时按 0 处理 */ }
    }

    let x = 0, y = startY, col = 0, rowH = 0;
    const GAP_X = 120, GAP_Y = 160;
    frames.forEach(fr => {
      const label = txt(fr.name, 13, 'medium', C.text3);
      label.name = 'label/' + fr.name;
      label.x = x;
      label.y = y;
      fr.x = x;
      fr.y = y + 26;
      if (col === 0) {
        col = 1;
        rowH = fr.height;
        x = W + GAP_X;
      } else {
        col = 0;
        y = y + 26 + Math.max(rowH, fr.height) + GAP_Y;
        x = 0;
      }
    });

    // 原型连线：侧栏导航 / 页面按钮 / 表格整行点击
    let wired = { total: 0, ok: 0 };
    try {
      wired = await wirePrototype(frames);
    } catch (wireErr) {
      console.error(wireErr);
    }

    // 把客户概览设为原型起点，Present 时直接从这里进入
    // 仅在新建页面时设置：复用用户页面时不覆盖已有起点
    try {
      const ov = frames.filter(f => SCREEN_KEYS[f.name] === 'overview')[0];
      if (createdNew && ov && figma.currentPage.flowStartingPoints) {
        figma.currentPage.flowStartingPoints = [{ nodeId: ov.id, name: '客户控制台 · 概览' }];
      }
    } catch (flowErr) { /* 旧版本不支持，忽略 */ }

    figma.viewport.scrollAndZoomIntoView(frames);
    let msg = '已生成 ' + frames.length + ' 个页面 Frame' + (createdNew ? '' : '（位于当前页面）');
    if (wired.ok) msg += '，已连好 ' + wired.ok + ' 处跳转，按 ▶ 演示';
    else if (wired.total) msg += '，当前 Figma 版本不支持自动连线，可手动添加';
    figma.notify(msg, { timeout: 6000 });
    figma.closePlugin();
  } catch (e) {
    figma.notify('生成失败：' + (e && e.message ? e.message : e), { error: true, timeout: 10000 });
    console.error(e);
    figma.closePlugin();
  }
})();
