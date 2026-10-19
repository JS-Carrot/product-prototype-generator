---
name: product-prototype-generator
description: |
  双出口产品原型生成：一次需求，产出「可点击的交互 HTML」和「能在 Figma 生成本地图层的插件」。
  以信息架构推导为起点，用 B/C 双轨视觉 token 定调，经反模板评审把关，最后按同一份规格生成两个出口：
  HTML 侧含状态机、路由、弹窗与跨端联动；Figma 侧含 Auto Layout 画板与可点击原型连线。
  触发词：画原型、出可点的原型、交互原型、Figma 稿、后台页面、App 页面、小程序原型。
  无需求简报不生成；反模板评审未通过不出图；未跑验证不算交付。
version: "2.0"
updated: "2026-10-19"
---

# 产品原型生成器

> 结构由信息架构推导决定，视觉由双轨 token 决定，去同质化由反模板评审把关。
> **两个出口都是正式交付物**：HTML 是能点能演的原型，Figma 插件是跑一次就长出原生图层的生成器。

## 一、这套方法的立足点

| 常见做法 | 结果 |
|---|---|
| 直接写页面代码再截图 | 只有外观，点不动，改一版重画一遍 |
| 只出静态设计稿 | 结构信息丢失，开发照着猜 |
| 导出 `.fig` 交付 | 该格式为私有二进制，无对外写入接口，无法程序化生成 |
| **本方法** | 一份规格 → 两个可交付出口，同源同 token，改一处两边同步 |

两个出口的分工：

- **HTML 出口**承载「逻辑」：状态迁移、表单校验、筛选搜索、跨端联动、空态与加载态
- **Figma 出口**承载「结构」：原生可编辑图层、Auto Layout、设计交接与视觉评审

## 二、运行环境

| 依赖 | 必需性 | 用途 | 缺失时 |
|---|---|---|---|
| Node 20+ | 必需 | 跑交付验证脚本 | 视为未验证，不算完成 |
| jsdom | 可选 | HTML 出口的渲染与点击验证 | 脚本自动探测；找不到会提示安装命令 |
| Chrome / Chromium | 可选 | 截图做视觉自查 | 跳过，但需在交付说明中注明未做视觉自查 |
| Figma 桌面端 | 使用方 | 导入并运行插件 | 插件仍可交付，由使用方自行导入 |

全部规则、token、模板、脚本都在本目录内，相对路径引用，整目录可移植。

## 三、九个阶段

| Stage | 名称 | 产出 | 关卡 |
|---|---|---|---|
| 1 | 需求收口 | `brief.md` | 四要素缺一不进 2 |
| 2 | 信息架构 | `ia-draft.md` | 页面三问答不上即删页 |
| 3 | 视觉定轨 | `design-plan.md` | 六项齐全 |
| 4 | 反模板评审 | 评审结论 | 未 PASS 不进 5 |
| 5 | 页面规格 | `spec/*.md` | 每页须有状态与跳转 |
| 6 | HTML 出口 | `index.html` | 验证脚本全绿 |
| 7 | Figma 出口 | `figma-plugin/` | 模拟运行零溢出 |
| 8 | 交付验证 | 校验记录 | 三条命令均通过 |
| 9 | 增量迭代 | 局部补丁 | 禁止整页重做 |

Stage 6 与 7 可并行，但**必须同源**：同一份 token、同一份页面清单、同一套状态机。

---

## Stage 1：需求收口

只问四个问题，缺哪个问哪个：

1. **产品是什么**（一句话）
2. **谁用**（内部员工 / 消费者 —— 这句决定整套视觉走向）
3. **单屏主任务**（用户进来最想完成的那件事）
4. **关键实体**（订单、设备、会员、工单……）

写进 `brief.md`，超过十行说明还没收敛。

## Stage 2：信息架构

做法见 `references/ia-and-spec.md`。核心是从实体生命周期推页面，而不是套现成页面清单。

每个页面必须回答三问：

- 承接上游哪个动作？
- 把用户送去哪？
- 没有它，哪个任务会断？

**三问有一问答不上，就删掉这页。**

## Stage 3：视觉定轨

按 `references/design-tokens.md`：

1. 定轨 `surface: b_end | c_end`（混合产品按页标，不按项目标）
2. 抄对应轨的 token，微调要写理由
3. 定 **1 个记忆点**（服务需求本身，禁止纯装饰）
4. 写出 ASCII 布局草图

## Stage 4：反模板评审

逐条过 `references/design-tokens.md` 第五节。核心是一句话：

> 把设计说明里的产品名换成一个不相关的产品，如果整段描述仍然成立，这就是模板，必须改写。

未 PASS 只回改 `design-plan.md`，不进 Stage 5。

## Stage 5：页面规格

每页一份 `spec/{page-id}.md`，必须含四块：布局、数据、状态、跳转。

**「状态」和「跳转」是硬要求。** 只写布局和组件的规格，产出必然是：HTML 点不动，Figma 没连线。

## Stage 6：HTML 出口

见 `references/html-interaction.md`。硬性要求：

- **单文件**，零外链，双击即开
- 一个状态对象 + 一个路由函数 + 一个渲染函数
- 事件用委托，不用内联 `onclick`
- 每个列表页有空态，每个动作有反馈
- 响应式三档，长编号必须换行

## Stage 7：Figma 出口

见 `references/figma-plugin.md`。从模板起步：

1. 复制 `templates/manifest.json`
2. 复制 `templates/figma-kit.js` 作为 `code.js` 基础层
3. 每页一个 `screenXxx()` 函数
4. 配置连线映射后调用 `boot()`

**连线是默认动作，不是加分项。** 没有连线的插件等于一张截图。

## Stage 8：交付验证

```bash
node scripts/test-html.js index.html
node scripts/run-plugin.js figma-plugin/code.js
```

外加截图自查（能跑 Chrome 时）。三条都要过，截图必须逐张看。详见 `references/verification.md`。

## Stage 9：增量迭代

- 结构变 → 改 `spec/{page}.md` → 两个出口同步
- 视觉变 → 先改 `design-plan.md` 的 token → 两个出口同步
- **禁止**收到意见直接整页重写

---

## 四、硬规则

- 无 `brief.md` → 不推导信息架构
- 页面三问答不上 → 删页，不许凑数
- 反模板评审未 PASS → 不出 HTML、不出插件
- 页面规格缺状态与跳转 → 不进 Stage 6/7
- 验证脚本未全绿 → 不交付
- 不宣称能生成 `.fig`（做不到就直说）
- 中文正文不用 Inter，不用 `#6366F1`，不用紫蓝渐变

## 五、产物结构

```
{project}/
├── brief.md
├── ia-draft.md
├── design-plan.md
├── spec/{page-id}.md
├── index.html                 ← 出口 1：交互原型
└── figma-plugin/
    ├── manifest.json          ← 出口 2：Figma 插件
    ├── code.js
    └── README.md
```

## 六、参考实现

`examples/vehicle-data-migration/` 是完整参考实现（车载数据迁移，11 个页面、双端联动）：

- `vehicle-data-migration.html` —— 交互原型，双击即开
- `figma-plugin/` —— `manifest.json` + `code.js`，导入 Figma 即可运行

两者同源，页面、token、状态机完全一致。**新项目先读它** —— 照着改比从零写快一个数量级，
尤其是布局函数与连线配置的写法。
