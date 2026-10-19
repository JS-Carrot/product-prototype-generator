# 产品原型生成器

一次需求 → **可点击的交互 HTML** + **能在 Figma 生成原生图层的插件**。

一份规格驱动两个出口：逻辑放 HTML，结构放 Figma，token 与页面清单同源，改一处两边同步。

## 安装

```bash
# 用户级：所有项目可用
git clone git@github.com:JS-Carrot/product_skills.git \
  ~/.workbuddy/skills/product-prototype-generator

# 项目级：仅当前项目可用
git clone git@github.com:JS-Carrot/product_skills.git \
  <你的项目>/.workbuddy/skills/product-prototype-generator
```

Agent 会自动发现这两个目录下的 `SKILL.md`。触发方式：直接说「画原型」「出个能点的原型」，或点名 `product-prototype-generator`。

无需安装任何依赖。`scripts/test-html.js` 会用到 `jsdom`，脚本已内置探测，缺失时给出安装命令。

## 快速开始

```bash
# 验证 HTML 原型
node scripts/test-html.js path/to/index.html

# 验证 Figma 插件
node scripts/run-plugin.js path/to/figma-plugin/code.js

# 降级路径（免费版计划 / 旧版 Figma）
STARTER=1 node scripts/run-plugin.js code.js
NO_REACTIONS=1 node scripts/run-plugin.js code.js
```

`run-plugin.js` 只需 Node；`test-html.js` 需要 `jsdom`（脚本自动探测，缺失时提示安装命令）。

## 一键同步

把这个仓库当工作副本改内容时，一条命令完成提交 + 并远程 + 推送：

```bash
bash scripts/sync.sh                     # 自动生成提交信息
bash scripts/sync.sh "fix: 调整列表间距"   # 指定提交信息
SYNC_BRANCH=dev bash scripts/sync.sh     # 指定分支（默认当前分支）
```

三步：提交本地改动 → `rebase` 并入远程新提交 → 推送。本地与远程改到同一处时，脚本会自动 `git rebase --abort` 回滚并以退出码 1 退出，**不会留下冲突残留，也不会推送半成品**。

也可拷到任意 Git 仓库的 `scripts/` 目录下直接使用。

## 九个阶段

| Stage | 做什么 | 产出 |
|---|---|---|
| 1 | 需求收口 | `brief.md` |
| 2 | 信息架构 | `ia-draft.md` |
| 3 | 视觉定轨 | `design-plan.md` |
| 4 | 反模板评审 | 结论 PASS |
| 5 | 页面规格 | `spec/*.md` |
| 6 | HTML 出口 | `index.html` |
| 7 | Figma 出口 | `figma-plugin/` |
| 8 | 交付验证 | 校验记录 |
| 9 | 增量迭代 | 局部补丁 |

## 目录

```
SKILL.md                    流程与关卡
references/
  ia-and-spec.md            信息架构推导 + 页面规格模板（含状态与跳转）
  design-tokens.md          B/C 双轨 token + 反模板评审清单
  html-interaction.md       HTML 施工规范 + 踩坑表
  figma-plugin.md           Figma 插件规范 + API 坑表
  verification.md           交付前必跑清单
templates/
  manifest.json             插件清单
  figma-kit.js              插件基础层（token/布局/表格/连线/降级）
scripts/
  test-html.js              HTML 结构与点击检查
  run-plugin.js             Figma API 模拟层
  sync.sh                   一键同步（提交 + 并远程 + 推送）
examples/
  vehicle-data-migration/    完整参考实现（车载数据迁移，11 页双端）
```

## 已知边界

- **不生成 `.fig`**：私有二进制格式，无对外写入接口
- **HTML 与 Figma 是两份产物**：逻辑改在 HTML，视觉改在插件，靠同源规格保持一致
- **Figma 插件不含组件**：输出到 Frame 层，组件化需后续手动或用 variant 二次开发
- **Figma 原型只能跳转**：不模拟数据变化，状态逻辑只在 HTML 版生效

## License

[MIT](LICENSE) © 2026 JS-Carrot

可自由使用、修改、分发、商用，保留版权声明即可。
