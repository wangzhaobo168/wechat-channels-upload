const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ========== 环境配置 ==========
const EXECUTABLE_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\weixin_channels_profile';
const PAGE_URL = 'https://channels.weixin.qq.com/platform/post/create';
const SS = 'C:\\Users\\Administrator\\AppData\\Local\\Temp';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ========== 视频配置（修改这里） ==========
const BASE_DIR = 'F:\\TRAE Work\\Downloaded99\\ready';
const VIDEO_NAME = '2026-01-21_带宝宝体检_...';  // 修改为实际文件夹名
const VIDEO_FILE = '2026-01-21_带宝宝检测_....mp4';  // 修改为实际文件名

// ========== 标题话题（优化后） ==========
const SHORT_TITLE = '宝宝六个月体检记录';  // 纯文字+空格，≥6字，无标点
const FULL_DESC = '六个月宝宝体检全记录，打针那一刻心疼坏了... #宝宝体检 #宝宝打针 #六个月宝宝 #宝宝成长记 #育儿日常';

// ========== 运行 ==========
(async () => {
  console.log('=== 微信视频号上传 ===');
  console.log('视频: ' + VIDEO_FILE);
  console.log('标题: ' + SHORT_TITLE);

  const VIDEO_PATH = BASE_DIR + '\\' + VIDEO_NAME + '\\' + VIDEO_FILE;
  const COVER_PATH = BASE_DIR + '\\' + VIDEO_NAME + '\\' + VIDEO_FILE.replace('.mp4', '_cover.jpg');
  const hasCover = fs.existsSync(COVER_PATH);
  console.log('封面: ' + (hasCover ? COVER_PATH : '无，跳过'));

  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: EXECUTABLE_PATH, headless: false, slowMo: 200,
    viewport: { width: 1280, height: 860 },
    args: ['--remote-debugging-port=9223'],
  });
  const pages = browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  process.on('SIGTERM', () => { browser.close(); process.exit(0); });
  process.on('SIGINT', () => { browser.close(); process.exit(0); });

  // 1. 打开发布页
  console.log('[1] 打开发布页');
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  if (page.url().includes('login') || page.url().includes('Login')) {
    console.log('[1] 等待扫码...');
    await page.waitForURL('**/post/create**', { timeout: 120000 });
    await sleep(2000);
  }

  // 2. 上传视频
  console.log('[2] 上传视频...');
  await page.locator('input[type="file"][accept*="video"]').first().setInputFiles(VIDEO_PATH);
  await page.waitForSelector('input[placeholder*="短标题"]', { timeout: 300000 });
  console.log('[2] 上传完成');
  await sleep(5000);

  // 3. 短标题
  console.log('[3] 填标题');
  const ti = page.locator('input[placeholder*="短标题"]').first();
  await ti.click(); await ti.fill(''); await ti.type(SHORT_TITLE, { delay: 50 });

  // 4. 描述
  console.log('[4] 填描述');
  for (const s of ['[data-placeholder*="描述"]', '[data-placeholder*="添加描述"]', 'text=添加描述']) {
    try { const el = page.locator(s).first(); if (await el.isVisible({timeout:1500}).catch(()=>false)) { await el.click(); await sleep(1000); break; } } catch(e) {}
  }
  const ed = page.locator('div.input-editor, [data-placeholder*="描述"]').first();
  if (await ed.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ed.click(); await sleep(300);
    await page.keyboard.type(FULL_DESC, { delay: 20 });
  }
  await sleep(1000);
  await page.screenshot({ path: SS + '\\step4_desc.png' });

  // 5. 封面（条件性）
  if (hasCover) {
    console.log('[5] ===== 上传封面 =====');

    // 5a. 打开封面弹窗 — 多种选择器 + 缩略图兜底
    const triggers = [
      '[class*="cover-edit"]',
      '[class*="cover-trigger"]',
      '[class*="cover-wrap"]:not([class*="video-cover"])',
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
    // 兜底：点击视频缩略图
    if (!dialogOpened) {
      console.log('[5a] 尝试视频缩略图...');
      const thumbSels = ['[class*="video-cover-container"]', '[class*="video-cover"]', '[class*="poster-container"]', 'img[class*="cover"]', 'img[class*="poster"]'];
      for (const s of thumbSels) {
        if (dialogOpened) break;
        try {
          const el = page.locator(s).first();
          if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
            await el.click(); await sleep(2000);
            if (await page.locator('.weui-desktop-dialog__wrp:not([style*="display: none"])').first().isVisible({ timeout: 1500 }).catch(() => false)) {
              dialogOpened = true;
              console.log('[5a] 弹窗已打开(缩略图)');
            }
          }
        } catch(e) {}
      }
    }
    if (!dialogOpened) {
      console.log('[5a] !! 无法打开封面弹窗');
      await page.screenshot({ path: SS + '\\step5_no_dialog.png' });
    } else {
      // 5b. 弹窗内上传 — 3种方式
      console.log('[5b] 弹窗内上传封面...');
      let uploaded = false;
      try { await page.locator('.single-cover-uploader-wrap input[type="file"]').first().setInputFiles(COVER_PATH); uploaded = true; console.log('[5b] 方式1上传'); }
      catch(e) { console.log('[5b] 方式1失败:', e.message); }
      if (!uploaded) {
        const dlgInputs = page.locator('.weui-desktop-dialog__wrp:not([style*="display: none"]) input[type="file"][accept*="image"]');
        const cnt = await dlgInputs.count();
        for (let i = 0; i < cnt; i++) {
          if (uploaded) break;
          try { await dlgInputs.nth(i).setInputFiles(COVER_PATH); uploaded = true; console.log('[5b] 方式2上传'); }
          catch(e) {}
        }
      }
      if (!uploaded) {
        try {
          const upText = page.locator('.cover-slider-wrap:has-text("上传封面")').first();
          if (await upText.isVisible({ timeout: 2000 }).catch(() => false)) {
            const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), upText.click()]);
            await fc.setFiles(COVER_PATH); uploaded = true;
            console.log('[5b] 方式3上传(filechooser)');
          }
        } catch(e) { console.log('[5b] 方式3失败:', e.message); }
      }
      if (!uploaded) {
        console.log('[5b] !! 封面上传失败');
      } else {
        await sleep(3000);
        try { await page.waitForSelector('.single-cover-uploader-wrap .finish-wrap img', { timeout: 15000 }); }
        catch(e) { console.log('[5b] 预览图等待超时'); }
        await sleep(2000);
        // 5c. 确认
        console.log('[5c] 点击确认...');
        await page.locator('.cover-set-footer button.weui-desktop-btn_primary').first().click();
        await sleep(3000);
        // 5d. 等待封面生成
        console.log('[5d] 等待封面生成...');
        for (let i = 0; i < 30; i++) {
          const g = await page.$$eval('[class*="cover"]', els => els.some(el => (el.innerText||'').includes('生成中')));
          if (!g) { console.log('[5d] 封面生成完成'); break; }
          console.log('[5d] 封面生成中...');
          await sleep(2000);
        }
      }
    }
  } else {
    console.log('[5] 无封面，跳过');
  }

  // 6. 原创
  console.log('[6] 声明原创');
  const cb = page.locator('.declare-original-checkbox .ant-checkbox-input, .declare-original-checkbox input[type="checkbox"]').first();
  await cb.click(); await sleep(2000);
  const proto = page.locator('.original-proto-wrapper .ant-checkbox-input, .original-proto-wrapper input[type="checkbox"]').first();
  if (await proto.isVisible({ timeout: 3000 }).catch(() => false)) {
    await proto.click(); await sleep(1000);
    await page.locator('button:has-text("声明原创")').first().click();
    await sleep(2000);
  }
  await page.screenshot({ path: SS + '\\step6_ready.png' });

  // 7. 发表
  const pub = page.locator('button:has-text("发表"):not([disabled])').first();
  const pubOk = await pub.isVisible({ timeout: 2000 }).catch(() => false);
  console.log('[7] 发表按钮: ' + (pubOk ? '可用 ✓' : '禁用 ✗'));

  if (pubOk) {
    console.log('[7] 点击发表...');
    await pub.click();
    await sleep(3000);
    // 广告分成弹窗
    try {
      if (await page.locator('text=广告分成').first().isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('[7] 广告分成弹窗 → 声明原创');
        await page.locator('button:has-text("声明原创")').first().click();
        await sleep(5000);
      }
    } catch(e) {}
    await sleep(5000);
    await page.screenshot({ path: SS + '\\step7_done.png' });
    console.log('[7] 发表完成');
  } else {
    console.log('[7] 发表按钮不可用，请检查');
  }

  console.log('\n完成。浏览器保持打开60秒后关闭。');
  await sleep(60000);
  await browser.close();
})();
