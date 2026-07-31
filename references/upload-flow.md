# 详细上传流程

## Step 1: 打开发布页 + 登录

```js
await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(3000);
if (page.url().includes('login') || page.url().includes('Login')) {
  console.log('等待扫码登录...');
  await page.waitForURL('**/post/create**', { timeout: 120000 });
  await sleep(2000);
}
```

## Step 2: 上传视频

```js
const videoInput = page.locator('input[type="file"][accept*="video"]').first();
await videoInput.setInputFiles(VIDEO_FILE);
// 等短标题框出现 = 上传完成
await page.waitForSelector('input[placeholder*="短标题"]', { timeout: 300000 });
await sleep(5000);
```

## Step 3: 填短标题

限制：纯文字+空格，≥6字，无标点无特殊符号。

```js
const ti = page.locator('input[placeholder*="短标题"]').first();
await ti.click();
await ti.fill('');
await ti.type(SHORT_TITLE, { delay: 50 });
```

## Step 4: 填描述

```js
// 先点击激活
const clickSels = ['[data-placeholder*="描述"]', '[data-placeholder*="添加描述"]', 'text=添加描述'];
for (const s of clickSels) {
  const el = page.locator(s).first();
  if (await el.isVisible({ timeout: 1500 }).catch(()=>false)) {
    await el.click(); await sleep(1000); break;
  }
}
// 用 keyboard.type 输入
const ed = page.locator('div.input-editor, [data-placeholder*="描述"]').first();
await ed.click(); await sleep(300);
await page.keyboard.type(FULL_DESC, { delay: 20 });
```

## Step 5: 封面上传（条件性）

### 判断逻辑
```js
const COVER_FILE = videoDir + '\\' + baseName + '_cover.jpg';
const hasCover = fs.existsSync(COVER_FILE);
if (!hasCover) { console.log('无封面图，跳过'); return; }
```

### 打开封面弹窗 — 10+ 选择器 + 缩略图兜底

关键教训：页面 DOM 结构的 className 不稳定，必须用多种选择器尝试，不能用单一选择器。

```js
const triggers = [
  '[class*="cover-edit"]',
  '[class*="cover-trigger"]',
  '[class*="cover-wrap"]:not([class*="video-cover"])',  // 实测有效！
  '[class*="cover-area"]',
  'text=编辑封面',
  'text=更换封面',
  'text=上传封面',
  '[class*="cover"] [class*="edit"]',
  '[class*="cover"] [class*="change"]',
  '[class*="cover"] [class*="upload"]',
];
let dialogOpened = false;
for (const s of triggers) {
  if (dialogOpened) break;
  try {
    const el = page.locator(s).first();
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('[5a] 点击:', s);
      await el.click(); await sleep(2000);
      const dlg = page.locator('.weui-desktop-dialog__wrp:not([style*="display: none"])').first();
      if (await dlg.isVisible({ timeout: 2000 }).catch(() => false)) {
        dialogOpened = true;
        console.log('[5a] 弹窗已打开');
      }
    }
  } catch(e) {}
}

// 兜底：点击视频缩略图打开封面弹窗
if (!dialogOpened) {
  const thumbSels = ['[class*="video-cover-container"]', '[class*="video-cover"]',
    '[class*="poster-container"]', 'img[class*="cover"]', 'img[class*="poster"]'];
  for (const s of thumbSels) {
    if (dialogOpened) break;
    try {
      const el = page.locator(s).first();
      if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
        await el.click(); await sleep(2000);
        if (await page.locator('.weui-desktop-dialog__wrp:not([style*="display: none"])').first().isVisible({ timeout: 1500 }).catch(() => false)) {
          dialogOpened = true;
        }
      }
    } catch(e) {}
  }
}
```

### 弹窗内上传 — 3 种方式

```js
let uploaded = false;

// 方式1: single-cover-uploader-wrap 内的隐藏 input（最常用）
try {
  await page.locator('.single-cover-uploader-wrap input[type="file"]').first().setInputFiles(COVER_FILE);
  uploaded = true;
} catch(e) {}

// 方式2: 弹窗内所有 accept=image 的 input
if (!uploaded) {
  const dlgInputs = page.locator('.weui-desktop-dialog__wrp:not([style*="display: none"]) input[type="file"][accept*="image"]');
  const cnt = await dlgInputs.count();
  for (let i = 0; i < cnt; i++) {
    if (uploaded) break;
    try { await dlgInputs.nth(i).setInputFiles(COVER_FILE); uploaded = true; }
    catch(e) {}
  }
}

// 方式3: filechooser 事件
if (!uploaded) {
  try {
    const upText = page.locator('.cover-slider-wrap:has-text("上传封面")').first();
    if (await upText.isVisible({ timeout: 2000 }).catch(() => false)) {
      const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), upText.click()]);
      await fc.setFiles(COVER_FILE);
      uploaded = true;
    }
  } catch(e) {}
}

// 等预览图出现
try { await page.waitForSelector('.single-cover-uploader-wrap .finish-wrap img', { timeout: 15000 }); }
catch(e) { console.log('预览图等待超时'); }
```

### 确认 + 等生成

```js
// 精确：cover-set-footer 内的 primary 按钮（文本"确认"）
await page.locator('.cover-set-footer button.weui-desktop-btn_primary').first().click();
await sleep(3000);

// 等封面生成完成（最多60秒）
for (let i = 0; i < 30; i++) {
  const generating = await page.$$eval('[class*="cover"]', 
    els => els.some(el => (el.innerText||'').includes('生成中'))
  );
  if (!generating) break;
  console.log('封面生成中...');
  await sleep(2000);
}
```

## Step 6: 声明原创

```js
// 1. 勾选原创 checkbox
const cb = page.locator('.declare-original-checkbox .ant-checkbox-input, .declare-original-checkbox input[type="checkbox"]').first();
await cb.click();
await sleep(2000);

// 2. 检查协议弹窗
const proto = page.locator('.original-proto-wrapper .ant-checkbox-input, .original-proto-wrapper input[type="checkbox"]').first();
if (await proto.isVisible({ timeout: 3000 }).catch(()=>false)) {
  await proto.click();  // 勾选协议
  await sleep(1000);
  // 3. 点"声明原创"确认
  await page.locator('button:has-text("声明原创")').first().click();
  await sleep(2000);
}
```

## Step 7: 发表 + 广告分成弹窗

```js
await page.locator('button:has-text("发表"):not([disabled])').first().click();
await sleep(3000);

// 处理广告分成弹窗
const ad = page.locator('text=广告分成').first();
if (await ad.isVisible({ timeout: 3000 }).catch(()=>false)) {
  await page.locator('button:has-text("声明原创")').first().click();
  await sleep(5000);
}
```
