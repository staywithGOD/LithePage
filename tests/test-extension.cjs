const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("playwright");

const extensionDir = process.env.LITHEPAGE_EXTENSION_DIR
  ? path.resolve(process.env.LITHEPAGE_EXTENSION_DIR)
  : path.resolve(__dirname, "..");
const browserChannel = process.env.LITHEPAGE_BROWSER_CHANNEL || "chrome";
const contentScript = path.join(extensionDir, "content.js");
const optimizationCss = path.join(extensionDir, "optimization.css");

function articleHtml({ sections = 32, wordsPerSection = 620, interactive = false } = {}) {
  const words = "energy heat transfer turbine combustion efficiency thermal power aerodynamic cooling ";
  const body = Array.from({ length: sections }, (_, index) => {
    const text = words.repeat(Math.ceil(wordsPerSection / words.length));
    return `<section style="min-height:360px"><h2>Section ${index + 1}</h2><p>${text}</p></section>`;
  }).join("");

  return `<!doctype html>
    <html><head>
      <meta name="citation_title" content="A long energy systems article">
      <meta name="citation_doi" content="10.0000/example">
      <meta name="citation_journal_title" content="Energy Test Journal">
      <style>body{margin:0}article{width:900px;margin:auto}section{display:block}</style>
    </head><body>
      <article>${interactive ? "<form><input><button>Submit</button></form>" : ""}${body}</article>
    </body></html>`;
}

async function createCase(browser, { url, html, settings = { autoEnabled: true, siteModes: {} } }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript((initialSettings) => {
    globalThis.__apSmoothMessageListener = null;
    globalThis.__apSmoothStorageListener = null;
    globalThis.chrome = {
      storage: {
        local: {
          get(defaults, callback) {
            callback({ ...defaults, ...initialSettings });
          },
          set() {
            return Promise.resolve();
          }
        },
        onChanged: {
          addListener(listener) {
            globalThis.__apSmoothStorageListener = listener;
          }
        }
      },
      runtime: {
        onMessage: {
          addListener(listener) {
            globalThis.__apSmoothMessageListener = listener;
          }
        }
      }
    };
  }, settings);

  await context.route("**/*", (route) => {
    route.fulfill({ status: 200, contentType: "text/html", body: html });
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: optimizationCss });
  await page.addScriptTag({ path: contentScript });

  return { context, page };
}

async function getStatus(page) {
  return page.evaluate(() => new Promise((resolve) => {
    globalThis.__apSmoothMessageListener({ type: "getStatus" }, null, resolve);
  }));
}

async function send(page, type) {
  return page.evaluate((messageType) => new Promise((resolve) => {
    globalThis.__apSmoothMessageListener({ type: messageType }, null, resolve);
  }), type);
}

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });

  try {
    {
      const { context, page } = await createCase(browser, {
        url: "https://journal.example/article/energy-long-page",
        html: articleHtml()
      });

      await page.waitForFunction(() => document.documentElement.getAttribute("data-ap-smooth-active") === "on", null, { timeout: 6000 });
      const status = await getStatus(page);
      const blockCount = await page.locator("[data-ap-smooth-block='1']").count();

      assert.equal(status.code, "active");
      assert.ok(blockCount >= 8 && blockCount <= 150, `unexpected block count: ${blockCount}`);
      assert.equal(await page.locator("html[data-ap-smooth-active='on']").count(), 1);

      const disabled = await send(page, "disablePage");
      assert.equal(disabled.code, "page-disabled");
      assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 0);
      assert.equal(await page.locator("html[data-ap-smooth-active='on']").count(), 0);

      await page.evaluate(() => {
        globalThis.__apSmoothStorageListener({ autoEnabled: { newValue: true } }, "local");
      });
      await page.waitForTimeout(100);
      assert.equal((await getStatus(page)).code, "page-disabled");

      const forced = await send(page, "forceEnable");
      assert.equal(forced.code, "active");
      assert.ok(await page.locator("[data-ap-smooth-block='1']").count() >= 8);

      await context.close();
    }

    {
      const base = articleHtml();
      const shellText = "recommended navigation related article ".repeat(800);
      const html = base
        .replace("<body>\n      <article>", `<body><main><div id="site-shell">${shellText}</div><article>`)
        .replace("</article>\n    </body>", "</article></main></body>");
      const { context, page } = await createCase(browser, {
        url: "https://publisher.example/science/article/long-page",
        html
      });

      await page.waitForFunction(() => document.documentElement.getAttribute("data-ap-smooth-active") === "on", null, { timeout: 6000 });
      assert.equal(await page.locator("#site-shell [data-ap-smooth-block='1']").count(), 0);
      assert.ok(await page.locator("article [data-ap-smooth-block='1']").count() >= 8);
      await context.close();
    }

    {
      const html = articleHtml().replace(
        "<section style=\"min-height:360px\"><h2>Section 1</h2>",
        "<section id=\"position-risk\" style=\"min-height:360px\"><div style=\"position:absolute\">Overlay</div><h2>Section 1</h2>"
      );
      const { context, page } = await createCase(browser, {
        url: "https://journal.example/article/positioned-overlay",
        html
      });

      await page.waitForFunction(() => document.documentElement.getAttribute("data-ap-smooth-active") === "on", null, { timeout: 6000 });
      assert.equal(await page.locator("#position-risk[data-ap-smooth-block='1']").count(), 0);
      await context.close();
    }

    {
      const html = articleHtml().replaceAll("min-height:360px", "min-height:360px;width:200px");
      const { context, page } = await createCase(browser, {
        url: "https://journal.example/article/unsafe-narrow-layout",
        html
      });

      await page.waitForTimeout(1600);
      const status = await getStatus(page);
      assert.equal(status.code, "unsafe-structure");
      assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 0);
      await context.close();
    }

    {
      const base = articleHtml({ sections: 3, wordsPerSection: 250 });
      const html = base.replace("<body>", "<body><div style=\"min-height:30000px\">Long site shell</div>");
      const { context, page } = await createCase(browser, {
        url: "https://journal.example/article/short-paywalled-page",
        html
      });

      await page.waitForTimeout(1600);
      assert.notEqual((await getStatus(page)).code, "active");
      assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 0);
      await context.close();
    }

    {
      const { context, page } = await createCase(browser, {
        url: "https://journal.example/article/short-page",
        html: articleHtml({ sections: 3, wordsPerSection: 250 })
      });

      await page.waitForTimeout(1600);
      const status = await getStatus(page);
      assert.notEqual(status.code, "active");
      assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 0);
      await context.close();
    }

    {
      const { context, page } = await createCase(browser, {
        url: "https://mail.google.com/article/long-page",
        html: articleHtml()
      });

      await page.waitForTimeout(1600);
      const status = await getStatus(page);
      assert.equal(status.code, "app-page");
      assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 0);
      await context.close();
    }

    {
      const { context, page } = await createCase(browser, {
        url: "https://journal.example/paper.pdf",
        html: articleHtml()
      });

      await page.waitForTimeout(800);
      const status = await getStatus(page);
      assert.equal(status.code, "unsupported");
      assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 0);
      await context.close();
    }

    console.log("PASS: long academic page activates and reverses cleanly");
    console.log("PASS: specific article root wins over a longer site shell");
    console.log("PASS: positioned overlay blocks are excluded and page-off survives setting changes");
    console.log("PASS: filtered coverage and article-root height prevent unsafe activation");
    console.log("PASS: short article, interactive app, and PDF-like URL remain untouched");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
