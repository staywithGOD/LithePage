const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const extensionDir = root;
const assetDir = path.join(root, "store-assets");
const popupPath = path.join(extensionDir, "popup.html").replace(/\\/g, "/");

async function renderPopup(browser) {
  const context = await browser.newContext({ viewport: { width: 384, height: 600 }, deviceScaleFactor: 2 });
  await context.addInitScript(() => {
    const activeStatus = {
      code: "active",
      host: "journal.example",
      blocks: 42,
      message: "已优化 42 个内容块",
      metrics: {
        textCoverage: 91,
        heightCoverage: 88,
        detectionMs: 74,
        candidateBlocks: 42,
        atomicReferenceBlocks: 1,
        referenceEntries: 281
      }
    };
    globalThis.chrome = {
      storage: {
        local: {
          get(defaults, callback) { callback({ ...defaults, siteModes: {} }); },
          set(_value, callback) { callback?.(); }
        }
      },
      tabs: {
        query(_query, callback) { callback([{ id: 1 }]); },
        sendMessage(_id, message, callback) {
          callback(message.type === "getStatus" ? activeStatus : activeStatus);
        }
      },
      runtime: {
        lastError: null,
        openOptionsPage() {}
      }
    };
  });
  const page = await context.newPage();
  await page.goto(`file:///${popupPath}`);
  await page.waitForTimeout(250);
  const output = path.join(assetDir, "popup-2x.png");
  await page.locator("body").screenshot({ path: output });
  await context.close();
  return output;
}

function articleHtml(iconData) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#eef3f4;color:#182b35;font-family:Segoe UI,Arial,sans-serif}
    .browser{height:70px;background:#fff;border-bottom:1px solid #dce6e8;padding:15px 28px;display:flex;align-items:center;gap:16px}
    .dots{display:flex;gap:7px}.dots i{width:10px;height:10px;border-radius:50%;background:#c8d5d8}.address{flex:1;height:38px;border-radius:19px;background:#f1f5f6;color:#71858d;padding:10px 18px;font-size:13px}
    .shell{display:grid;grid-template-columns:220px minmax(0,1fr) 420px;gap:22px;max-width:1280px;margin:0 auto;padding:26px}
    .toc{color:#6d8089;font-size:12px;line-height:2.2}.toc strong{color:#1a7565;display:block;margin-bottom:4px}.toc span{display:block;border-left:2px solid #d8e4e5;padding-left:13px}.toc .on{border-color:#24b596;color:#153e39;font-weight:700}
    article{background:#fff;border:1px solid #dbe5e7;border-radius:14px;padding:34px 42px;box-shadow:0 16px 45px rgba(19,51,60,.06)}
    .journal{color:#16816d;font-size:11px;font-weight:800;letter-spacing:.12em}.tag{float:right;padding:5px 9px;border-radius:99px;background:#e4f8f2;color:#147765;font-size:10px;font-weight:700}
    h1{font-family:Georgia,serif;font-size:27px;line-height:1.25;margin:13px 0 12px;color:#142630}.authors{color:#647880;font-size:12px}.abstract{margin:25px 0;padding:18px 20px;border-left:3px solid #29b899;background:#f4fbf9}.abstract strong{display:block;margin-bottom:8px}.abstract p,p{font-family:Georgia,serif;font-size:13px;line-height:1.75;color:#364c55}.translated{margin-top:7px;color:#1d7567;font-family:Segoe UI,Arial,sans-serif;font-size:12px}.flow{display:flex;gap:8px;margin:20px 0}.flow span{flex:1;padding:12px 8px;border-radius:8px;background:#edf8f5;color:#176c5c;text-align:center;font-size:10px;font-weight:700}.flow b{align-self:center;color:#55ac9c}.refs{height:130px;overflow:hidden;mask-image:linear-gradient(#000,transparent)}.refs i{display:block;height:12px;margin:10px 0;border-radius:5px;background:#e9eff0}
    .right{position:relative}.badge{display:flex;align-items:center;gap:9px;margin-bottom:12px;color:#507078;font-size:11px}.badge img{width:25px;height:25px}.badge strong{color:#1b7565}
  </style></head><body>
    <div class="browser"><div class="dots"><i></i><i></i><i></i></div><div class="address">journal.example / article / efficient-thermal-systems</div></div>
    <div class="shell"><aside class="toc"><strong>IN THIS ARTICLE</strong><span>Abstract</span><span class="on">1. Introduction</span><span>2. Method</span><span>3. Results</span><span>4. Discussion</span><span>References · 281</span></aside>
    <article><span class="tag">HTML FULL TEXT</span><div class="journal">JOURNAL OF THERMAL ENERGY</div><h1>Adaptive flow control for high-efficiency thermal systems</h1><div class="authors">A. Researcher · B. Engineer · C. Scientist</div>
      <div class="abstract"><strong>Abstract</strong><p>Long academic pages require repeated layout and painting when translated text changes line wrapping and section height.</p><div class="translated">超长学术页面在翻译文本改变换行与章节高度时，可能触发重复布局与绘制。</div></div>
      <h2>1. Introduction</h2><p>We present a structure-aware rendering strategy for long-form scientific HTML. The method preserves the document while deferring work for distant off-screen sections.</p>
      <div class="flow"><span>文章识别</span><b>›</b><span>安全分块</span><b>›</b><span>按需渲染</span></div>
      <h2>References</h2><div class="refs">${Array.from({length:8},(_,i)=>`<i style="width:${88-i*3}%"></i>`).join("")}</div>
    </article><aside class="right"><div class="badge"><img src="${iconData}"><span><strong>LithePage 已开启</strong><br>浏览器自带翻译保持不变</span></div><div id="popup-slot"></div></aside></div>
  </body></html>`;
}

async function renderScreenshot(browser, popupFile) {
  const icon = `data:image/png;base64,${fs.readFileSync(path.join(extensionDir, "icons/icon-48.png")).toString("base64")}`;
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(articleHtml(icon), { waitUntil: "load" });
  const base = path.join(assetDir, "screenshot-base.png");
  await page.screenshot({ path: base });
  await page.close();

  const popup = await sharp(popupFile).resize({ width: 384 }).png().toBuffer();
  const metadata = await sharp(popup).metadata();
  await sharp(base)
    .composite([{ input: popup, left: 870, top: 142 }])
    .png()
    .toFile(path.join(assetDir, "screenshot-1280x800.png"));
  fs.rmSync(base);
  return metadata.height;
}

function promoSvg(width, height, iconData, wide = false) {
  const titleSize = wide ? 66 : 32;
  const left = wide ? 120 : 28;
  const iconSize = wide ? 150 : 86;
  const textLeft = left + iconSize + (wide ? 48 : 20);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#071722"/><stop offset=".58" stop-color="#0C3140"/><stop offset="1" stop-color="#087B69"/></linearGradient><radialGradient id="g"><stop stop-color="#42E1BC" stop-opacity=".34"/><stop offset="1" stop-color="#42E1BC" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" rx="${wide?0:22}" fill="url(#b)"/><circle cx="${width*.82}" cy="${height*.08}" r="${height*.7}" fill="url(#g)"/><image href="${iconData}" x="${left}" y="${(height-iconSize)/2}" width="${iconSize}" height="${iconSize}"/><text x="${textLeft}" y="${height*.43}" fill="#F2FBF8" font-family="Segoe UI,Arial" font-size="${titleSize}" font-weight="750">LithePage</text><text x="${textLeft}" y="${height*.62}" fill="#88E5D0" font-family="Segoe UI,Microsoft YaHei,Arial" font-size="${wide?28:15}">长篇学术网页渲染优化</text><text x="${textLeft}" y="${height*.76}" fill="#A5BAC2" font-family="Segoe UI,Microsoft YaHei,Arial" font-size="${wide?21:11}">屏幕外按需渲染 · 浏览器自带翻译</text></svg>`;
}

async function renderPromos() {
  const iconData = `data:image/png;base64,${fs.readFileSync(path.join(extensionDir, "icons/icon-128.png")).toString("base64")}`;
  await sharp(Buffer.from(promoSvg(440, 280, iconData))).png().toFile(path.join(assetDir, "promo-small-440x280.png"));
  await sharp(Buffer.from(promoSvg(1400, 560, iconData, true))).png().toFile(path.join(assetDir, "promo-marquee-1400x560.png"));
}

(async () => {
  fs.mkdirSync(assetDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const popup = await renderPopup(browser);
    await renderScreenshot(browser, popup);
    await renderPromos();
  } finally {
    await browser.close();
  }
  console.log("LithePage store assets rendered.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
