const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 380, height: 560 }, colorScheme: "dark" });
    await page.addInitScript(() => {
      globalThis.chrome = {
        storage: {
          local: {
            get(defaults, callback) { callback(defaults); },
            set() { return Promise.resolve(); }
          }
        },
        tabs: {
          query(_query, callback) { callback([{ id: 1 }]); },
          sendMessage(_id, message, callback) {
            callback({
              code: message.type === "getStatus" ? "active" : "active",
              host: "www.sciencedirect.com",
              blocks: 34,
              message: "已优化 34 个内容块"
            });
          }
        },
        runtime: { lastError: null }
      };
    });

    await page.goto(`file:///${path.resolve(__dirname, "../popup.html").replace(/\\/g, "/")}`);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.resolve(__dirname, "../tests/popup-preview.png"), fullPage: true });
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
