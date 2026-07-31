# 微信视频号视频自动上传工具 · WeChat Channels Upload

> 上传视频到视频号 · 视频号视频批量发布 · 视频号上传自动化

[English README](#english-readme)

---

## 项目简介

这是一个用于 **微信视频号** 的 **视频自动上传 / 发布** 工具（Skill），也就是大家常说的
**视频号上传视频 Skill**、**微信视频号自动发布 Skill**。它基于 **Playwright**
自动化操作微信视频号创作者平台（`channels.weixin.qq.com`），让你可以用脚本把本地视频
**发布到视频号**、实现 **视频号上传** 与 **批量发表视频号视频** 的自动化。

适合自媒体运营、育儿日常记录、vlog 矩阵等需要高频 **上传视频号视频** 的场景。

## 关键词（便于检索 / SEO）

`微信视频号` · `视频号视频` · `上传视频到视频号` · `上传视频号视频` · `视频号上传` ·
`发布视频到视频号` · `视频号批量上传` · `视频号自动发布` · `视频号运营工具` ·
`视频号上传视频 Skill` · `微信视频号自动发布 Skill` · `上传视频到视频号 Skill` · `视频号 Skill` ·
`WeChat Channels` · `Channels Upload` · `视频号脚本` · `视频号自动化`

> 在 GitHub 搜索以上任意关键词（尤其是「上传视频到视频号」「视频号上传」「微信视频号」），
> 都可以找到本项目。

## 功能特性

- 🎬 **上传视频到视频号**：单个或批量把本地 MP4 上传到视频号发布页
- 🏷️ **标题 / 话题优化**：自动填写「短标题」（纯文字，≥6 字）与「描述」（含 `#话题标签`）
- 🖼️ **封面图可选上传**：检测视频目录下的 `_cover.jpg`，有则上传并智能等待封面生成完成
- ✅ **原创声明**：自动勾选原创、确认协议，并处理「广告分成」弹窗
- 🤖 **抗 DOM 变更**：封面弹窗采用 10+ 选择器遍历 + 缩略图兜底，避免单一选择器失效
- 📦 **批量发表视频号视频**：遍历视频文件夹，按 `_data.json` 中的标题与话题自动发布

## 目录结构

```
wechat-channels-upload/
├── SKILL.md                      # 技能定义（触发词、流程、坑位）
├── README.md                     # 本文件
└── references/
    ├── playwright-env.md         # Playwright 环境配置（NODE_PATH / Chromium / 登录态）
    ├── upload-flow.md            # 详细上传流程（7 步：上传→标题→描述→原创→封面→发表）
    └── template-script.js        # 可直接运行的 Playwright 上传脚本模板
```

## 快速开始

### 1. 作为 WorkBuddy 技能使用

将本仓库的 `SKILL.md` 与 `references/` 放入：

```
~/.workbuddy/skills/wechat-channels-upload/
```

然后在对话中说「**上传视频到视频号**」「**视频号上传**」「**发布视频号视频**」等即可触发。

### 2. 作为独立脚本运行（Playwright）

```bash
# 清除 NODE_OPTIONS（必须，否则启动崩溃）
unset NODE_OPTIONS

# 设置 Playwright 的 NODE_PATH
export NODE_PATH="D:/soft/node/node_global/node_modules/@playwright/cli/node_modules"

# 运行上传脚本
node references/template-script.js
```

详细环境配置见 [`references/playwright-env.md`](references/playwright-env.md)，
完整上传流程与选择器策略见 [`references/upload-flow.md`](references/upload-flow.md)。

## 视频目录约定

每个待发布视频放在独立文件夹中，包含：

| 文件 | 说明 |
|------|------|
| `xxx.mp4` | 视频文件 |
| `xxx_data.json` | 元数据，`desc` 字段为「标题文本 #话题1 #话题2」 |
| `xxx_cover.jpg` | （可选）封面图，存在则自动上传 |

## 工作原理

1. 用 `launchPersistentContext` 打开视频号发布页并复用登录态（首次需扫码）
2. 通过 `setInputFiles` 上传视频，等待「短标题」输入框出现即上传完成
3. 逐字 `type` 短标题；用 `keyboard.type` 填写描述与话题标签
4. 勾选原创声明、确认协议
5. 条件性上传封面（等待封面区域就绪 → 多选择器兜底 → 等待「生成中」结束）
6. 点击「发表」完成发布，处理「广告分成」弹窗

## 适用场景

- 自媒体 / 育儿博主：每天 **上传视频号视频** 记录宝宝成长
- 企业视频号：批量 **发布视频到视频号** 做内容矩阵
- 开发者：把视频号上传封装进自动化流水线

---

## English README

# WeChat Channels (视频号) Video Auto-Upload Tool

A Skill for automatically **uploading videos to WeChat Channels (微信视频号)** using Playwright.
Supports batch publishing, cover image upload, title/hashtag optimization, and original-declaration.

**Keywords:** WeChat Channels upload · upload video to Channels · Channels video · 视频号上传 ·
微信视频号 · 上传视频到视频号 Skill · 视频号 Skill · publish to WeChat Channels · WeChat Channels automation.

### Features

- Upload local MP4 to WeChat Channels publish page (`channels.weixin.qq.com`)
- Auto-fill short title and description with hashtags
- Optional cover image upload with "generating" wait
- Auto original-declaration + ad-revenue popup handling
- Resilient cover dialog (10+ selectors + thumbnail fallback)

### Usage

Place `SKILL.md` and `references/` under `~/.workbuddy/skills/wechat-channels-upload/`,
then trigger by saying "upload video to WeChat Channels" / "视频号上传".

Or run the standalone script:

```bash
unset NODE_OPTIONS
export NODE_PATH="<your-playwright-node-path>"
node references/template-script.js
```

## License

MIT © wangzhaobo
