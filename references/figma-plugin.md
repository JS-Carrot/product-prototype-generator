# Figma 插件施工规范

目标：跑一次，在当前文件里长出**原生可编辑图层**（不是图片、不是嵌入网页）。

---

## 一、文件与起步

```
figma-plugin/
├── manifest.json
└── code.js
```

`manifest.json` 用 `templates/manifest.json`，两个字段最关键：

- `"main": "code.js"`
- `"networkAccess": { "allowedDomains": ["none"] }` —— 声明不联网，导入时不吓人

`code.js` 从 `templates/figma-kit.js` 起步。它已经写好 token、`mk/vstack/hstack/txt/table/btn/pill`、`wirePrototype`、`boot`，你只需要写页面函数。

```js
// code.js 结构
// 1. 粘贴 figma-kit.js
// 2. 写组件（侧栏、顶栏、页头、表格行…）
// 3. 每页一个 screenXxx()，返回一个 Frame
// 4. 配 WIRE
// 5. boot(() => [screenA(), screenB(), ...])
```

---

## 二、Auto Layout 要点

| 需求 | 写法 |
|---|---|
| 容器方向 | `frame.layoutMode = 'VERTICAL' / 'HORIZONTAL'` |
| 主/交叉轴对齐 | `primaryAxisAlignItems` / `counterAxisAlignItems` |
| 间距与内边距 | `itemSpacing` / `paddingLeft` 等四向分别设 |
| 子元素撑满父级 | 子 `layoutGrow = 1`（主轴）或 `layoutAlign = 'STRETCH'`（交叉轴） |
| 固定宽 | `frame.resize(w, h)` 后设 `layoutSizingHorizontal = 'FIXED'` |
| 文本换行 | `textAutoResize = 'HEIGHT'` + `resize(w, h)` |
| 绝对定位 | 父必须 auto layout，子设 `layoutPositioning = 'ABSOLUTE'` 再改 x/y |

**顺序很重要**：先 `appendChild` 再设 `layoutSizing*`，否则 Figma 会按旧父级计算。

---

## 三、踩过的坑（都是真机跑出来的）

| 坑 | 报错 / 现象 | 处理 |
|---|---|---|
| **免费版 page 限制** | `in createPage: The Starter plan only comes with 3 pages` | try/catch，失败复用 `figma.currentPage`（`boot()` 已内置） |
| **重跑堆叠** | 每次运行都在同一位置再叠一层 | 复用页面时按已有内容底部偏移；交付文档写明先删旧画板 |
| **STRETCH 报错** | `layoutAlign STRETCH is not allowed here` | 父容器必须是 auto layout 且交叉轴 `FIXED` 宽度 |
| **阴影缺 spread** | 效果对象不合法 | `{type:'DROP_SHADOW', ..., spread: 0, visible:true, blendMode:'NORMAL'}` |
| **旧版无 setRangeLetterSpacing** | 直接抛错中断整个插件 | `typeof x === 'function'` 能力检测后再调 |
| **字体缺失** | `Cannot load font` 整插件失败 | 逐级回退：PingFang SC → PingFang HK → Heiti SC → Inter |
| **文本宽度算错** | 布局看起来正常，导出后溢出 | 文本节点给固定宽时，宽度要扣掉同级 icon 和 gap |
| **表格列宽合计超容器** | 内容压到边框外 | 列宽合计 = 容器内宽；用验证脚本查 |
| **Reaction 新旧 API 不同** | `setReactionsAsync` 参数结构不对 | 先试 `{trigger, actions:[...]}`，失败回退 `{trigger, action}` |
| **`.fig` 生成不了** | — | 私有二进制无写入 SDK；只能插件或 Sketch 中转 |

---

## 四、原型连线（默认要做）

命名约定（`wirePrototype` 靠名字识别）：

| 节点名 | 含义 |
|---|---|
| `nav/我的订单` | 侧栏导航项 |
| `btn/创建订单` | 按钮 |
| `switch-item` | 顶栏视角切换（按文案匹配） |
| `link:orderdetail` | 整行可点（`table(..., {rowKey:'orderdetail'})`） |

配置：

```js
WIRE.screens = { '01 客户 · 概览': 'overview', '02 客户 · 订单列表': 'orders' };
WIRE.nav     = { '概览': 'overview', '我的订单': 'orders' };
WIRE.btn     = { '01 客户 · 概览': { '创建迁移订单': 'create' } };
WIRE.switch  = { '客户控制台': 'overview', '运维后台': 'ops' };
```

**必须做的三件事：**

1. 连线前 `await loadFonts()`，否则画板尺寸没算出来，定位会错
2. 目标画板必须是页面顶层 Frame（嵌在别的 Frame 里不能作为跳转目标）
3. 新建页面时设 `flowStartingPoints`，Present 才有入口；复用用户页面时**不要覆盖**

---

## 五、验证

```bash
node <skill>/scripts/run-plugin.js figma-plugin/code.js
```

输出：画板数与尺寸、节点统计、宽度溢出、运行时异常。

```bash
STARTER=1 node run-plugin.js code.js        # 免费版降级路径
NO_REACTIONS=1 node run-plugin.js code.js   # 旧版无连线 API
LINKS=1 node run-plugin.js code.js          # 打印连线矩阵
```

**模拟层的边界：它挡得住 API 误用和布局溢出，挡不住 Figma 版本差异。** 真机跑出红字，按报错改字段，不要重写架构。

---

## 六、交付给用户的话术

1. 这不是 `.fig` 文件，是插件 —— 在 Figma 桌面端 `Plugins → Development → Import plugin from manifest…`
2. 跑完自动生成 N 个画板，已连好 M 处跳转，按 `▶` 演示
3. 免费版不能新建 page，会落在当前页（已做降级）
4. 不含 Component：状态标签/按钮目前是 Frame，要组件化就选中 `btn/*` 一键 Create Component
5. 重跑会生成新画板，旧的不迁移 —— 先删旧的
