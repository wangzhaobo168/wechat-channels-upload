# Playwright 环境配置

```bash
# 1. 清除 NODE_OPTIONS（必须）
unset NODE_OPTIONS

# 2. 设置 NODE_PATH
export NODE_PATH="D:/soft/node/node_global/node_modules/@playwright/cli/node_modules"

# 3. Node 可执行文件
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.12.0/node.exe"

# 4. 运行脚本
$NODE script.js
```

## 默认配置值

```js
const EXECUTABLE_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\weixin_channels_profile';
const PAGE_URL = 'https://channels.weixin.qq.com/platform/post/create';

const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: EXECUTABLE_PATH,
    headless: false,
    slowMo: 200,
    viewport: { width: 1280, height: 860 },
    args: ['--remote-debugging-port=9223'],
});
```
