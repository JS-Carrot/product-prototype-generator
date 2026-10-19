# 交付验证清单

**未跑完这份清单，不算交付。** 顺序固定：语法 → 结构 → 行为 → 视觉。

---

## 一、HTML 出口

```bash
# 1. 语法
node --check <(sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d')
# 或先抽出 script 再 check

# 2. 结构 + 行为
node <skill>/scripts/test-html.js index.html
```

脚本查五项，全绿才算过：

| 项 | 不过说明 |
|---|---|
| 离线可用性 | 有外链，会议室没网就废 |
| 路由一致性 | `data-go` 指向了不存在的页面 |
| id 引用 | JS 拿了不存在的 DOM |
| 标签配平 | 有未闭合标签，样式会错乱 |
| 点击全量 | 某个 `data-act` 一点就抛异常 |

**再做主流程点击**（脚本只扫单点，不扫串联）：

手动走一遍主干：进入 → 前进 3 层 → 每一步返回。确认没有死胡同。

---

## 二、Figma 出口

```bash
node <skill>/scripts/run-plugin.js figma-plugin/code.js
```

| 项 | 期望 |
|---|---|
| 画板数 | 与页面清单一致 |
| 每屏尺寸 | 1440×N（B 端）/ 390×844（C 端），高度合理不虚高 |
| 宽度溢出 | **0 处** |
| 运行时异常 | **0 条** |
| 连线数 | > 0，且目标全部有效 |

再跑两条降级路径：

```bash
STARTER=1 node run-plugin.js code.js        # 免费版无 createPage
NO_REACTIONS=1 node run-plugin.js code.js   # 旧版无 reactions
```

两条都不能崩，只允许提示降级。

---

## 三、视觉自查（必须看图，不能只看退出码）

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,980 --virtual-time-budget=2500 \
  --screenshot=/tmp/a.png "file:///绝对路径/index.html"
```

逐张看，每张问四个问题：

1. 有没有元素被裁切 / 压边 / 重叠？
2. 主操作按钮是否唯一且明显？
3. 文字层级是否 ≤ 4 级？
4. 去掉任何一个装饰，信息会少吗？不会 → 删掉它（减法原则）

**截图常见假象：** Chrome headless 最小宽 500px，`--window-size=390` 会被裁切，看起来像横向溢出，其实是视口限制。移动端用 500 宽验证，或改 `--force-device-scale-factor`。

---

## 四、两端一致性核对

| 核对项 | 方法 |
|---|---|
| 页面数 | HTML 的 `PAGES` 键数 == 插件画板数 |
| 页面名 | HTML 标题 == 画板名（去掉编号） |
| token | 两边同一色值/字号，抽查 3 处 |
| 状态机 | HTML 的状态迁移表 == 插件连线图 |
| 记忆点 | 两端都实现了同一个记忆点 |

**不一致就是 bug**，不是「演示版差异」。

---

## 五、失败排查顺序

| 现象 | 先查 |
|---|---|
| 点击无反应 | `data-act` 是否注册；是否被上层元素挡住（z-index / pointer-events） |
| 点击后白屏 | 渲染函数是否抛错（看 console）；`PAGES` 是否缺 key |
| 样式全乱 | 标签配平；CSS 变量名拼错 |
| 移动端溢出 | 长 ID 未换行；`table-layout:fixed` 缺失；`min-width` 写死 |
| 插件报红 | 报错原文 → 对照 `figma-plugin.md` 的坑表 |
| 画板高度虚高 | 文本未设 `textAutoResize='HEIGHT'`；容器 `primaryAxisSizingMode` 未设 AUTO |
| 连线不生效 | 目标是否是顶层 Frame；是否在连线前加载了字体 |

---

## 六、交付物清单

```
brief.md
ia-draft.md
design-plan.md          （含反模板评审结论）
spec/*.md
index.html              ← 出口 1
figma-plugin/           ← 出口 2
  ├── manifest.json
  ├── code.js
  └── README.md         （导入步骤 + 已知限制）
```

外加一段说明：**能做什么、做不到什么**（`.fig` 无法生成、Figma 只能跳转不能模拟状态、不含 Component）。宁可先说清楚，也别让用户导入后发现落差。
