/* Figma Plugin API 模拟层：本地跑一遍插件 code.js，抓运行时错误 / 布局溢出 / 原型连线
 * 用法: node run-plugin.js [code.js 路径]
 * 环境变量:
 *   STARTER=1        模拟免费版 createPage 被拒（验证降级路径）
 *   NO_REACTIONS=1   模拟旧版无 setReactionsAsync
 *   LINKS=1          打印连线矩阵
 *   DUMP="01 xxx"    打印指定画板的结构树
 */
const fs = require('fs');
const path = require('path');

const errors = [];
const stats = { frames: 0, texts: 0, rects: 0, svgs: 0 };

let idSeq = 0;
class Node {
  constructor(type) {
    this.id = String(++idSeq);
    this.type = type;
    this.name = '';
    this.children = [];
    this.parent = null;
    this._w = 100;
    this._h = 100;
    this._fills = [];
    this._strokes = [];
    this.strokeWeight = 1;
    this._strokeAlign = 'INSIDE';
    this.cornerRadius = 0;
    this.clipsContent = false;
    this.opacity = 1;
    this.effects = [];
    this.layoutMode = 'NONE';
    this.itemSpacing = 0;
    this.paddingLeft = 0; this.paddingRight = 0; this.paddingTop = 0; this.paddingBottom = 0;
    this._primary = 'AUTO';
    this._counter = 'AUTO';
    this.primaryAxisAlignItems = 'MIN';
    this.counterAxisAlignItems = 'MIN';
    this.layoutGrow = 0;
    this.layoutAlign = 'INHERIT';
    this.layoutPositioning = 'AUTO';
    this.x = 0; this.y = 0;
    this.fontSize = 13;
    this.fontName = null;
    this.characters = '';
    this.textAutoResize = 'WIDTH_AND_HEIGHT';
    this.textAlignHorizontal = 'LEFT';
    this.lineHeight = { unit: 'PIXELS', value: 20 };
    this.letterSpacing = { unit: 'PIXELS', value: 0 };
    this.reactions = [];
    this.flowStartingPoints = type === 'PAGE' ? [] : undefined;
  }
  setReactionsAsync(list) {
    if (process.env.NO_REACTIONS) return Promise.reject(new Error('setReactionsAsync is not a function'));
    if (!Array.isArray(list)) throw new Error('reactions must be array');
    list.forEach(r => {
      if (!r.trigger || r.trigger.type !== 'ON_CLICK') throw new Error('bad trigger');
      const acts = r.actions || (r.action ? [r.action] : null);
      if (!acts) throw new Error('reaction needs actions');
      acts.forEach(a => {
        if (a.type === 'NODE' && !a.destinationId) throw new Error('NAVIGATE without destinationId');
      });
    });
    this.reactions = list;
    return Promise.resolve();
  }
  get width() {
    if (this.type === 'TEXT') return this._textW();
    this._layout(); return this._w;
  }
  get height() {
    if (this.type === 'TEXT') return this._textH();
    this._layout(); return this._h;
  }
  _textW() {
    const fs = this.fontSize || 13;
    let w = 0;
    for (const ch of (this._chars || '')) w += /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(ch) ? fs : fs * 0.56;
    if (this.textAutoResize === 'HEIGHT' && this._w) return this._w;
    return Math.max(w, 4);
  }
  _textH() {
    const lh = (this.lineHeight && this.lineHeight.value) || Math.round((this.fontSize || 13) * 1.5);
    if (this.textAutoResize === 'HEIGHT' && this._w) {
      const lines = Math.max(1, Math.ceil(this._textW() / this._w));
      return lines * lh;
    }
    return lh;
  }
  resize(w, h) {
    if (typeof w !== 'number' || isNaN(w) || typeof h !== 'number' || isNaN(h)) {
      throw new Error('resize 收到非法数值: ' + w + ' x ' + h + ' (' + this.name + ')');
    }
    this._w = w; this._h = h;
    if (this.layoutMode !== 'NONE') {
      this._primary = 'FIXED';
      this._counter = 'FIXED';
    }
  }
  appendChild(child) {
    if (!child || !child.type) throw new Error('appendChild 收到非法节点: ' + child);
    if (child === this) throw new Error('不能 append 自己');
    if (child.parent) child.parent.children = child.parent.children.filter(c => c !== child);
    child.parent = this;
    this.children.push(child);
    if (child.layoutAlign === 'STRETCH') {
      if (this._counter === 'AUTO') throw new Error('父容器 counter 轴为 AUTO 时不能用 STRETCH: ' + child.name);
    }
    return child;
  }
  _layout() {
    if (this.layoutMode === 'NONE') return;
    const kids = this.children.filter(c => c.layoutPositioning !== 'ABSOLUTE');
    const padX = this.paddingLeft + this.paddingRight;
    const padY = this.paddingTop + this.paddingBottom;
    if (this.layoutMode === 'HORIZONTAL') {
      let w = padX, h = 0;
      kids.forEach(c => { w += c.width + (c.layoutGrow ? 0 : 0); h = Math.max(h, c.height); });
      w += this.itemSpacing * Math.max(kids.length - 1, 0);
      if (this._primary === 'AUTO') this._w = w;
      if (this._counter === 'AUTO') this._h = h + padY;
      if (this._w < padX) this._w = padX;
    } else {
      let h = padY, w = 0;
      kids.forEach(c => { h += c.height; w = Math.max(w, c.width); });
      h += this.itemSpacing * Math.max(kids.length - 1, 0);
      if (this._primary === 'AUTO') this._h = h;
      if (this._counter === 'AUTO') this._w = w + padX;
      if (this._h < padY) this._h = padY;
    }
  }
  set layoutMode(v) {
    if (!['NONE', 'HORIZONTAL', 'VERTICAL'].includes(v)) throw new Error('非法 layoutMode: ' + v);
    this._layoutMode = v;
  }
  get layoutMode() { return this._layoutMode; }
  /* 新 API：layoutSizingHorizontal/Vertical 映射到主轴/交叉轴
     纵向容器的主轴是高度，横向容器的主轴是宽度 */
  set layoutSizingHorizontal(v) {
    const val = v === 'FILL' ? 'FIXED' : v;
    if (this.layoutMode === 'VERTICAL') this._counter = val;
    else this._primary = val;
  }
  get layoutSizingHorizontal() {
    return (this.layoutMode === 'VERTICAL' ? this._counter : this._primary) === 'FIXED' ? 'FIXED' : 'AUTO';
  }
  set layoutSizingVertical(v) {
    const val = v === 'FILL' ? 'FIXED' : v;
    if (this.layoutMode === 'VERTICAL') this._primary = val;
    else this._counter = val;
  }
  get layoutSizingVertical() {
    return (this.layoutMode === 'VERTICAL' ? this._primary : this._counter) === 'FIXED' ? 'FIXED' : 'AUTO';
  }
  set primaryAxisSizingMode(v) {
    if (!['FIXED', 'AUTO'].includes(v)) throw new Error('非法 primaryAxisSizingMode: ' + v);
    this._primary = v;
  }
  get primaryAxisSizingMode() { return this._primary; }
  set counterAxisSizingMode(v) {
    if (!['FIXED', 'AUTO'].includes(v)) throw new Error('非法 counterAxisSizingMode: ' + v);
    this._counter = v;
  }
  get counterAxisSizingMode() { return this._counter; }
  set primaryAxisAlignItems(v) {
    if (!['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'].includes(v)) throw new Error('非法 primaryAxisAlignItems: ' + v);
    this._pAlign = v;
  }
  get primaryAxisAlignItems() { return this._pAlign; }
  set counterAxisAlignItems(v) {
    if (!['MIN', 'CENTER', 'MAX', 'BASELINE'].includes(v)) throw new Error('非法 counterAxisAlignItems: ' + v);
    this._cAlign = v;
  }
  get counterAxisAlignItems() { return this._cAlign; }
  set layoutAlign(v) {
    if (!['INHERIT', 'STRETCH'].includes(v)) throw new Error('非法 layoutAlign: ' + v);
    this._layoutAlign = v;
  }
  get layoutAlign() { return this._layoutAlign; }
  set layoutPositioning(v) {
    if (!['AUTO', 'ABSOLUTE'].includes(v)) throw new Error('非法 layoutPositioning: ' + v);
    if (v === 'ABSOLUTE' && this.parent && this.parent.layoutMode === 'NONE') {
      throw new Error('父容器非 auto-layout 时不能绝对定位: ' + this.name);
    }
    this._lp = v;
  }
  get layoutPositioning() { return this._lp; }
  set strokeAlign(v) {
    if (!['INSIDE', 'OUTSIDE', 'CENTER'].includes(v)) throw new Error('非法 strokeAlign: ' + v);
    this._strokeAlign = v;
  }
  get strokeAlign() { return this._strokeAlign; }
  set fills(v) {
    if (!Array.isArray(v)) throw new Error('fills 必须是数组: ' + this.name);
    this._fills = v;
  }
  get fills() { return this._fills; }
  set strokes(v) {
    if (!Array.isArray(v)) throw new Error('strokes 必须是数组');
    this._strokes = v;
  }
  get strokes() { return this._strokes; }
  set characters(v) { this._chars = String(v); }
  get characters() { return this._chars; }
  setRangeFontSize() {}
  setRangeFills() {}
  setRangeLetterSpacing() {}
  findAll() { return []; }
}

function makeNode(type, opts) {
  const n = new Node(type);
  if (figma.currentPage) figma.currentPage.appendChild(n);
  if (type === 'TEXT') {
    stats.texts++;
  } else if (type === 'FRAME') {
    stats.frames++;
  } else {
    stats.rects++;
  }
  return n;
}

const page = new Node('PAGE');
page.name = 'Page 1';
page._children = [];

const figma = {
  root: { children: [page] },
  _page: page,
  get currentPage() { return this._page; },
  set currentPage(p) { this._page = p; },
  createPage() {
    if (process.env.STARTER) {
      throw new Error('in createPage: The Starter plan only comes with 3 pages. Upgrade to Professional for unlimited pages: https://www.figma.com/pricing');
    }
    const p = new Node('PAGE');
    p.name = 'Page';
    p.children = [];
    return p;
  },
  createFrame() { return makeNode('FRAME'); },
  createRectangle() { return makeNode('RECT'); },
  createEllipse() { return makeNode('ELLIPSE'); },
  createText() { return makeNode('TEXT'); },
  createNodeFromSvg(svg) {
    stats.svgs++;
    const n = makeNode('FRAME');
    const m = /width="([\d.]+)"[^>]*height="([\d.]+)"/.exec(svg);
    if (m) { n._w = parseFloat(m[1]); n._h = parseFloat(m[2]); }
    n.layoutMode = 'NONE';
    return n;
  },
  async loadFontAsync(font) {
    const ok = ['PingFang SC', 'SF Mono', 'Menlo', 'Inter', 'Roboto Mono'].includes(font.family);
    if (!ok) throw new Error('字体不可用: ' + font.family + ' ' + font.style);
    return null;
  },
  notify(msg, opts) { console.log('  [notify] ' + msg); },
  viewport: { scrollAndZoomIntoView() {} },
  closePlugin() {
    if (typeof global.__onClose === 'function') global.__onClose();
  }
};

global.figma = figma;

process.on('unhandledRejection', e => { errors.push('unhandledRejection: ' + (e && e.stack || e)); });

const closed = new Promise(res => { global.__onClose = res; });

const target = process.argv[2] ? path.resolve(process.argv[2]) : path.join(process.cwd(), 'code.js');
if (!fs.existsSync(target)) {
  console.log('❌ 找不到插件代码: ' + target);
  process.exit(1);
}

try {
  const code = fs.readFileSync(target, 'utf8');
  // eslint-disable-next-line no-new-func
  const fn = new Function('figma', code);
  fn(figma);
} catch (e) {
  errors.push('同步异常: ' + e.stack);
}

const timeout = new Promise(res => setTimeout(() => res('timeout'), 8000));

(async () => {
  const r = await Promise.race([closed, timeout]);
  if (r === 'timeout') {
    console.log('\n❌ 插件未在 8 秒内结束（可能卡住或报错）');
    if (errors.length) errors.forEach(e => console.log('  ' + e));
    process.exit(1);
  }
  const screens = figma.currentPage.children.filter(n => n.type === 'FRAME' || n.type === 'SECTION');

  console.log('\n页面数：' + screens.length);
  screens.forEach(s => {
    const w = s.width, h = s.height;
    console.log('  ' + s.name.padEnd(22) + ' ' + Math.round(w) + ' × ' + Math.round(h));
  });
  console.log('\n节点统计：frame ' + stats.frames + ' / text ' + stats.texts + ' / shape ' + stats.rects + ' / svg ' + stats.svgs);

  if (errors.length) {
    console.log('\n❌ 运行时错误 ' + errors.length + ' 条：');
    errors.slice(0, 10).forEach(e => console.log('  ' + e));
    process.exit(1);
  }
  if (process.env.DUMP) {
    const t = screens.find(x => x.name.indexOf(process.env.DUMP) === 0);
    if (t) {
      console.log('\n--- 结构 ---');
      (function walk(n, d) {
        if (d > 3) return;
        console.log('  '.repeat(d) + (n.name || n.type) + '  ' + Math.round(n.width) + '×' + Math.round(n.height) + ' mode=' + (n.layoutMode || 'NONE'));
        (n.children || []).forEach(c => walk(c, d + 1));
      })(t, 0);
    }
  }
  // 结构校验：子元素宽度超出容器
  const over = [];
  screens.forEach(sc => {
    (function walk(n) {
      const kids = (n.children || []).filter(c => c.layoutPositioning !== 'ABSOLUTE');
      if (n.layoutMode === 'VERTICAL' && n._counter === 'FIXED' && kids.length) {
        const padX = n.paddingLeft + n.paddingRight;
        kids.forEach(c => {
          if (c.layoutAlign === 'STRETCH') return;
          if (c.width > n.width - padX + 1) {
            over.push(sc.name + ' › ' + n.name + ' 内 ' + c.name + ' 宽 ' + Math.round(c.width) + ' > 可用 ' + Math.round(n.width - padX));
          }
        });
      }
      if (n.layoutMode === 'HORIZONTAL' && n._primary === 'FIXED' && kids.length) {
        const padX = n.paddingLeft + n.paddingRight;
        const total = kids.reduce((a, c) => a + c.width, 0) + n.itemSpacing * (kids.length - 1) + padX;
        if (total > n.width + 1 && !kids.some(c => c.layoutGrow)) {
          over.push(sc.name + ' › ' + n.name + ' 横向超宽 ' + Math.round(total) + ' > ' + Math.round(n.width));
        }
      }
      kids.forEach(walk);
    })(sc);
  });
  if (over.length) {
    console.log('\n⚠ 宽度溢出 ' + over.length + ' 处：');
    [...new Set(over)].slice(0, 18).forEach(x => console.log('  · ' + x));
  } else {
    console.log('\n✓ 未发现宽度溢出');
  }

  console.log('\n✓ 插件执行完成，无运行时异常');

  // 连线矩阵校验
  if (process.env.LINKS) {
    const byId = {};
    (function walk(n) {
      byId[n.id] = n;
      (n.children || []).forEach(walk);
    })(figma.currentPage);
    const targets = {};
    let total = 0;
    screens.forEach(sc => {
      (function walk(n) {
        (n.reactions || []).forEach(r => {
          (r.actions || [r.action]).forEach(a => {
            const dst = byId[a.destinationId];
            const line = sc.name.slice(0, 2) + ' ' + (n.name || n.type) + ' → ' + (dst ? dst.name : '❌ 目标不存在');
            (targets[sc.name] = targets[sc.name] || []).push(line);
            total++;
          });
        });
        (n.children || []).forEach(walk);
      })(sc);
    });
    console.log('\n--- 连线清单（' + total + ' 条）---');
    Object.keys(targets).forEach(k => {
      console.log(k + '：' + targets[k].length + ' 条');
      targets[k].slice(0, 8).forEach(l => console.log('   ' + l));
    });
    const bad = Object.values(targets).flat().filter(l => l.indexOf('❌') > -1);
    console.log(bad.length ? '❌ 无效目标 ' + bad.length + ' 条' : '✓ 全部目标有效');
  }
})();
