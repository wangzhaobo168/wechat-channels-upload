---
name: wechat-channels-upload
description: 微信视频号视频自动上传工具。支持上传视频到视频号、批量发表视频号视频、视频号上传与发布到视频号平台。基于 Playwright 自动化，支持封面图可选上传、标题话题优化、短标题限制处理、原创声明。触发词：上传视频到视频号、视频号视频、上传视频号视频、视频号上传、微信视频号、发布视频、批量上传、视频号上传视频 Skill、微信视频号自动发布 Skill、WeChat Channels、channels upload。适用：自媒体运营、育儿日常、vlog 矩阵自动发布。
---

# 微信视频号自动上传

## 环境准备

- `unset NODE_OPTIONS`（必须，否则启动崩溃）
- NODE_PATH: `D:/soft/node/node_global/node_modules/@playwright/cli/node_modules`
- Node: `C:/Users/Administrator/.workbuddy/binaries/node/versions/22.12.0/node.exe`
- Chromium: `C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe`
- 登录态: `C:/Users/Administrator/AppData/Local/Temp/weixin_channels_profile`
- 发布页: `https://channels.weixin.qq.com/platform/post/create`

详见 `references/playwright-env.md`

## 视频元数据解析

每个视频文件夹含 `_data.json`，从 `desc` 字段提取原标题和话题标签：
```python
import json, os
for f in os.listdir(video_dir):
    if f.endswith('_data.json'):
        d = json.load(open(os.path.join(video_dir, f), encoding='utf-8'))
        print(d['desc'])  # "标题文本 #话题1 #话题2"
```

## 标题优化规则

**短标题（input[placeholder*="短标题"]）：**
- 纯文字 + 空格，≥6字
- **禁止**：逗号、句号、感叹号、特殊符号、表情
- 从原标题提取核心含义，控制在6-15字

**描述（div.input-editor）：**
- 保留原标题作为首句
- 追加 4-6 个优化话题标签（替换原始标签）
- 可以添加一段有吸引力的描述文案
- 话题标签参考：`#人类幼崽 #宝宝日常 #带娃日常 #记录宝宝的点点滴滴 #萌娃日常 #小吃货 #宝宝辅食` 等

## 封面上传（条件判断）

检查视频目录是否含 `_cover.jpg` 文件：
- **有封面** → 打开弹窗 → 上传 → 等预览 → 点确认 → 等生成完成
- **无封面** → 跳过，使用视频默认封面

封面弹窗流程见 `references/upload-flow.md`

## 上传脚本模板

见 `references/template-script.js`

核心流程（每步之间 sleep 足够时间）：
1. 打开发布页 → 等扫码登录（如需要）
2. 上传视频 → 等 `input[placeholder*="短标题"]` 出现
3. 填短标题 → type() 逐字输入
4. 填描述 → 点击描述区域激活 → keyboard.type()
5. 封面 → 有则上传弹窗，无则跳过
6. 声明原创 → checkbox → 协议 checkbox → 确认按钮
7. 发表 → 处理可能出现的"广告分成"弹窗（点击"声明原创"）

## 关键坑位

| 问题 | 解决方案 |
|------|----------|
| NODE_OPTIONS 冲突 | 先 `unset NODE_OPTIONS` |
| 大文件上传超时 | timeout 设 300s |
| 封面弹窗打不开 | 必须用 10+ 种选择器遍历（见 upload-flow.md），不能用单一选择器。实测 `[class*="cover-wrap"]:not([class*="video-cover"])` 有效 |
| 封面上传后"生成中" | 必须先等生成完成再点原创，否则发表被禁用 |
| 封面上传方式 | 3 种：single-cover-uploader-wrap input / 弹窗内所有 image input / filechooser 事件 |
| 封面弹窗确认按钮 | `.cover-set-footer button.weui-desktop-btn_primary` 文本"确认" |
| 隐藏 file input | `.single-cover-uploader-wrap input[type="file"]` display:none 也可 setInputFiles |
| 广告分成弹窗 | 点发表后检测 "广告分成" 文字 → 点 "声明原创" 按钮 |
| 原创协议弹窗 | `.original-proto-wrapper` 内 checkbox + 确认按钮 |
| 短标题格式错误 | 不能有标点/特殊符号，纯文字+空格 |
| 关闭浏览器不释放锁 | 用 `context.close()` 而非 kill 进程 |
