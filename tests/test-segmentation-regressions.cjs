const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("playwright");

const extensionDir = process.env.LITHEPAGE_EXTENSION_DIR
  ? path.resolve(process.env.LITHEPAGE_EXTENSION_DIR)
  : path.resolve(__dirname, "..");
const browserChannel = process.env.LITHEPAGE_BROWSER_CHANNEL || "chrome";
const contentScript = path.join(extensionDir, "content.js");
const optimizationCss = path.join(extensionDir, "optimization.css");

const meaningfulWords = "energy heat transfer turbine combustion efficiency thermal power aerodynamic cooling ";
const excludedNoise = "navigation control hidden metadata synthetic noise ";

function head() {
  return `
    <meta name="citation_title" content="Regression article">
    <meta name="citation_doi" content="10.0000/regression">
    <meta name="citation_journal_title" content="Regression Journal">
    <style>
      body { margin: 0; }
      article { width: 900px; margin: auto; }
      section { display: block; }
    </style>`;
}

function section(index, {
  minHeight = 360,
  repetitions = 55,
  prefix = "",
  suffix = "",
  id = ""
} = {}) {
  return `<section ${id ? `id="${id}"` : ""} style="min-height:${minHeight}px">${prefix}<h2>Section ${index}</h2><p>${meaningfulWords.repeat(repetitions)}</p>${suffix}</section>`;
}

function documentWithArticle(articleBody) {
  return `<!doctype html><html><head>${head()}</head><body><article>${articleBody}</article></body></html>`;
}

function safeSections(count, options = {}) {
  return Array.from({ length: count }, (_, index) => section(index + 1, options)).join("");
}

async function createCase(browser, html, slug) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    globalThis.__apSmoothMessageListener = null;
    globalThis.chrome = {
      storage: {
        local: {
          get(defaults, callback) { callback(defaults); },
          set() { return Promise.resolve(); }
        },
        onChanged: {
          addListener() {}
        }
      },
      runtime: {
        onMessage: {
          addListener(listener) { globalThis.__apSmoothMessageListener = listener; }
        }
      }
    };
  });

  await context.route("**/*", (route) => {
    route.fulfill({ status: 200, contentType: "text/html", body: html });
  });

  const page = await context.newPage();
  await page.goto(`https://journal.example/article/${slug}`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: optimizationCss });
  await page.addScriptTag({ path: contentScript });
  return { context, page };
}

async function getStatus(page) {
  return page.evaluate(() => new Promise((resolve) => {
    globalThis.__apSmoothMessageListener({ type: "getStatus" }, null, resolve);
  }));
}

async function waitForSettledStatus(page, timeoutMs = 4500) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    lastStatus = await getStatus(page);
    if (lastStatus && lastStatus.code !== "checking") return lastStatus;
    await page.waitForTimeout(80);
  }
  return lastStatus;
}

async function blockCount(page) {
  return page.locator("[data-ap-smooth-block='1']").count();
}

async function runCase(browser, name, body) {
  try {
    await body();
    console.log(`PASS: ${name}`);
    return null;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.stack || error);
    return error;
  }
}

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const failures = [];

  try {
    failures.push(await runCase(browser, "single-child wrapper chains drill down to article sections", async () => {
      const nested = `<div id="wrapper-1"><div id="wrapper-2"><div id="wrapper-3">${safeSections(32)}</div></div></div>`;
      const { context, page } = await createCase(browser, documentWithArticle(nested), "single-wrapper-chain");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        const count = await blockCount(page);
        assert.ok(count >= 8 && count <= 150, `unexpected block count: ${count}`);
        assert.equal(await page.locator("#wrapper-1[data-ap-smooth-block], #wrapper-2[data-ap-smooth-block], #wrapper-3[data-ap-smooth-block]").count(), 0);
        assert.ok(await page.locator("section[data-ap-smooth-block='1']").count() >= 8);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "a risky nested section does not prevent traversal to safe sibling sections", async () => {
      const unsafe = section(1, {
        id: "unsafe-tooltip",
        suffix: "<span class=\"reference-tooltip\">tooltip</span>"
      });
      const nested = `<div id="outer-wrapper"><div id="inner-wrapper">${unsafe}${safeSections(31)}</div></div>`;
      const { context, page } = await createCase(browser, documentWithArticle(nested), "wrapper-with-risky-leaf");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        assert.equal(await page.locator("#unsafe-tooltip[data-ap-smooth-block='1']").count(), 0);
        const count = await blockCount(page);
        assert.ok(count >= 8 && count <= 150, `unexpected block count: ${count}`);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "nested control/hidden text cannot make a short article eligible", async () => {
      const noisySections = Array.from({ length: 8 }, (_, index) => {
        const noise = excludedNoise.repeat(90);
        return `<section style="min-height:920px"><h2>Short ${index + 1}</h2><p>brief visible text</p><button><span>${noise}</span></button><div aria-hidden="true"><span>${noise}</span></div><div hidden><span>${noise}</span></div></section>`;
      }).join("");
      const { context, page } = await createCase(browser, documentWithArticle(noisySections), "excluded-text-noise");
      try {
        const status = await waitForSettledStatus(page);
        assert.notEqual(status.code, "active");
        assert.equal(await blockCount(page), 0);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "meaningful text in nested inline elements still counts", async () => {
      const nestedInline = Array.from({ length: 8 }, (_, index) => (
        `<section style="min-height:920px"><h2>Inline ${index + 1}</h2><p><span><em>${meaningfulWords.repeat(35)}</em></span></p></section>`
      )).join("");
      const { context, page } = await createCase(browser, documentWithArticle(nestedInline), "nested-inline-text");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        assert.equal(await blockCount(page), 8);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "minimum block boundary remains eight", async () => {
      const seven = await createCase(browser, documentWithArticle(safeSections(7, { minHeight: 1100, repetitions: 35 })), "seven-blocks");
      try {
        assert.notEqual((await waitForSettledStatus(seven.page)).code, "active");
        assert.equal(await blockCount(seven.page), 0);
      } finally {
        await seven.context.close();
      }

      const eight = await createCase(browser, documentWithArticle(safeSections(8, { minHeight: 920, repetitions: 35 })), "eight-blocks");
      try {
        assert.equal((await waitForSettledStatus(eight.page)).code, "active");
        assert.equal(await blockCount(eight.page), 8);
      } finally {
        await eight.context.close();
      }
    }));

    failures.push(await runCase(browser, "articles just over the maximum are capped at 150 blocks", async () => {
      const many = safeSections(151, { minHeight: 90, repetitions: 2 });
      const { context, page } = await createCase(browser, documentWithArticle(many), "one-hundred-fifty-one-blocks");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        assert.equal(await blockCount(page), 150);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "a very long reference list is partially segmented within the 150-block budget", async () => {
      const references = Array.from({ length: 320 }, (_, index) => (
        `<li style="min-height:120px"><span>Reference ${index + 1}. ${meaningfulWords.repeat(3)}</span></li>`
      )).join("");
      const bibliography = `<section id="bibliography"><ol id="long-references" class="references">${references}</ol></section>`;
      const html = documentWithArticle(`${safeSections(12, { minHeight: 920, repetitions: 35 })}${bibliography}`);
      const { context, page } = await createCase(browser, html, "long-reference-list");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        assert.equal(await blockCount(page), 150);
        assert.equal(await page.locator("#bibliography[data-ap-smooth-block], #long-references[data-ap-smooth-block]").count(), 0);
        assert.ok(await page.locator("#long-references > li[data-ap-smooth-block='1']").count() >= 100);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "positioned/hidden leaves remain unmarked while safe siblings activate", async () => {
      const risky = [
        section(1, { id: "absolute-self", prefix: "", suffix: "", minHeight: 920 }).replace("style=\"min-height:920px\"", "style=\"min-height:920px;position:absolute\""),
        section(2, { id: "absolute-child", minHeight: 920, suffix: "<span style=\"position:absolute\">overlay</span>" }),
        section(3, { id: "hidden-content-visibility", minHeight: 920 }).replace("style=\"min-height:920px\"", "style=\"min-height:920px;content-visibility:hidden;contain-intrinsic-size:900px\"")
      ].join("");
      const html = documentWithArticle(`${risky}${safeSections(12, { minHeight: 920, repetitions: 35 })}`);
      const { context, page } = await createCase(browser, html, "safety-leaves");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        assert.equal(await page.locator("#absolute-self[data-ap-smooth-block], #absolute-child[data-ap-smooth-block], #hidden-content-visibility[data-ap-smooth-block]").count(), 0);
        const count = await blockCount(page);
        assert.ok(count >= 8 && count <= 150, `unexpected block count: ${count}`);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "selective fallback refines only rejected ScienceDirect-like wrappers", async () => {
      const riskyChildren = Array.from({ length: 8 }, (_, index) => (
        `<div class="risk-leaf" style="min-height:350px"><p>${meaningfulWords.repeat(2)}</p>${index === 0 ? "<span class=\"reference-tooltip\">tooltip</span>" : ""}</div>`
      )).join("");
      const riskyWrapper = `<section id="risky-wrapper">${riskyChildren}</section>`;

      const tallWrappers = Array.from({ length: 5 }, (_, wrapperIndex) => {
        const leaves = Array.from({ length: 48 }, (_, leafIndex) => (
          `<div class="refined-leaf" data-parent="${wrapperIndex}" style="min-height:110px"><p>${meaningfulWords.repeat(2)}</p><span>${leafIndex}</span></div>`
        )).join("");
        return `<section class="tall-wrapper" id="tall-${wrapperIndex}">${leaves}</section>`;
      }).join("");

      const shortRejected = `<section id="too-short" style="height:40px"><p>short</p></section>`;
      const acceptedSiblings = Array.from({ length: 16 }, (_, index) => (
        `<section class="accepted-sibling" id="accepted-${index}" style="min-height:400px"><div class="accepted-inner"><p>${meaningfulWords.repeat(12)}</p></div></section>`
      )).join("");

      const html = documentWithArticle(`${riskyWrapper}${tallWrappers}${shortRejected}${acceptedSiblings}`);
      const { context, page } = await createCase(browser, html, "selective-sciencedirect-fallback");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        assert.ok(status.metrics.textCoverage >= 55, `text coverage: ${status.metrics.textCoverage}`);
        assert.ok(status.metrics.heightCoverage >= 45, `height coverage: ${status.metrics.heightCoverage}`);

        const count = await blockCount(page);
        assert.ok(count >= 8 && count <= 150, `unexpected block count: ${count}`);
        assert.equal(await page.locator(".accepted-sibling[data-ap-smooth-block='1']").count(), 16);
        assert.equal(await page.locator(".accepted-sibling [data-ap-smooth-block='1']").count(), 0);
        assert.equal(await page.locator(".tall-wrapper[data-ap-smooth-block], #risky-wrapper[data-ap-smooth-block], #too-short[data-ap-smooth-block]").count(), 0);
        assert.ok(await page.locator(".refined-leaf[data-ap-smooth-block='1']").count() > 0);
        assert.equal(await page.locator(".risk-leaf:first-child[data-ap-smooth-block='1']").count(), 0);
        assert.equal(await page.locator("[data-ap-smooth-block='1'] [data-ap-smooth-block='1']").count(), 0);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "selective fallback remains fail-closed when rejected tall blocks only contain short leaves", async () => {
      const acceptedSiblings = safeSections(8, { minHeight: 400, repetitions: 12 });
      const unhelpfulTallWrappers = Array.from({ length: 4 }, (_, wrapperIndex) => {
        const leaves = Array.from({ length: 100 }, (_, leafIndex) => (
          `<div class="too-short-leaf" data-parent="${wrapperIndex}" style="height:50px"><p>${meaningfulWords.repeat(3)} ${leafIndex}</p></div>`
        )).join("");
        return `<section class="unhelpful-tall">${leaves}</section>`;
      }).join("");

      const html = documentWithArticle(`${unhelpfulTallWrappers}${acceptedSiblings}`);
      const { context, page } = await createCase(browser, html, "fallback-short-leaves-fail-closed");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "unsafe-structure");
        assert.equal(await blockCount(page), 0);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "selective refinement never tunnels through a terminal absolute-positioned parent", async () => {
      const absoluteLeaves = Array.from({ length: 20 }, (_, index) => (
        `<div class="absolute-descendant-leaf" style="min-height:300px"><p>${meaningfulWords.repeat(15)} ${index}</p></div>`
      )).join("");
      const terminalAbsolute = `<section id="terminal-absolute" style="position:absolute;left:0;width:900px">${absoluteLeaves}</section>`;
      const safeButInsufficient = safeSections(16, { minHeight: 500, repetitions: 11 });
      const html = documentWithArticle(`${terminalAbsolute}${safeButInsufficient}`);
      const { context, page } = await createCase(browser, html, "terminal-absolute-refinement");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "unsafe-structure");
        assert.equal(await page.locator("#terminal-absolute [data-ap-smooth-block='1']").count(), 0);
        assert.equal(await blockCount(page), 0);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase(browser, "terminal positioning on the selected article root also fails closed", async () => {
      const html = documentWithArticle(safeSections(32)).replace(
        "<article>",
        "<article id=\"terminal-root\" style=\"position:absolute;left:0;width:900px\">"
      );
      const { context, page } = await createCase(browser, html, "terminal-article-root");
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "unsafe-structure");
        assert.equal(await page.locator("#terminal-root [data-ap-smooth-block='1']").count(), 0);
        assert.equal(await blockCount(page), 0);
      } finally {
        await context.close();
      }
    }));
  } finally {
    await browser.close();
  }

  const failed = failures.filter(Boolean).length;
  if (failed) {
    console.error(`\n${failed} segmentation regression case(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll segmentation regression cases passed.");
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
