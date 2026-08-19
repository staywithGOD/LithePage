const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("playwright");

const extensionDir = process.env.LITHEPAGE_EXTENSION_DIR
  ? path.resolve(process.env.LITHEPAGE_EXTENSION_DIR)
  : path.resolve(__dirname, "..");
const browserChannel = process.env.LITHEPAGE_BROWSER_CHANNEL || "chrome";
const contentScript = path.join(extensionDir, "content.js");
const optimizationCss = path.join(extensionDir, "optimization.css");
const words = "energy heat transfer turbine combustion efficiency thermal power aerodynamic cooling ";

function articleHead(extraCss = "") {
  return `
    <meta name="citation_title" content="Atomic bibliography regression">
    <meta name="citation_doi" content="10.0000/atomic-references">
    <meta name="citation_journal_title" content="Energy Regression Journal">
    <style>
      body { margin: 0; }
      article { width: 900px; margin: auto; }
      .body-section { min-height: 900px; }
      #atomic-references > li,
      #risk-references > li,
      #non-reference-list > li { min-height: 120px; }
      ${extraCss}
    </style>`;
}

function bodySections(count = 7) {
  return Array.from({ length: count }, (_, index) => (
    `<section class="body-section"><h2>Section ${index + 1}</h2><p>${words.repeat(35)}</p></section>`
  )).join("");
}

function referenceItems({ count = 511, riskHtml = "", riskIndex = count - 1, listId = "atomic-references" } = {}) {
  return Array.from({ length: count }, (_, index) => {
    const risk = index === riskIndex ? riskHtml : "";
    return `<li id="${listId}-item-${index + 1}"><span>Reference ${index + 1}. ${words.repeat(3)}</span> <a href="https://doi.org/10.0000/${index + 1}">doi</a>${risk}</li>`;
  }).join("");
}

function referenceDocument({
  listId = "atomic-references",
  listClass = "references",
  listAttributes = "",
  role = "doc-bibliography",
  containerId = "bibliography",
  riskHtml = "",
  riskIndex = 510,
  extraCss = ""
} = {}) {
  const items = referenceItems({ count: 511, riskHtml, riskIndex, listId });
  return `<!doctype html><html><head>${articleHead(extraCss)}</head><body><article>
    ${bodySections(7)}
    <section id="${containerId}" ${role ? `role="${role}"` : ""}>
      <h2>${role ? "References" : "Ordered procedure"}</h2>
      <ol id="${listId}" class="${listClass}" ${listAttributes}>${items}</ol>
    </section>
  </article></body></html>`;
}

async function createCase(browser, { html, slug }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    globalThis.__apSmoothMessageListener = null;
    globalThis.chrome = {
      storage: {
        local: {
          get(defaults, callback) { callback(defaults); },
          set() { return Promise.resolve(); }
        },
        onChanged: { addListener() {} }
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

async function send(page, type) {
  return page.evaluate((messageType) => new Promise((resolve) => {
    globalThis.__apSmoothMessageListener({ type: messageType }, null, resolve);
  }), type);
}

async function waitForSettledStatus(page, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let status = null;
  while (Date.now() < deadline) {
    status = await getStatus(page);
    if (status && status.code !== "checking") return status;
    await page.waitForTimeout(80);
  }
  return status;
}

async function markedCount(page) {
  return page.locator("[data-ap-smooth-block='1']").count();
}

async function assertNonAtomicResult(page, listSelector) {
  const status = await waitForSettledStatus(page);
  assert.equal(await page.locator(`${listSelector}[data-ap-smooth-block='1']`).count(), 0, "unsafe/non-reference list was atomized");
  const count = await markedCount(page);
  if (status.code === "active") {
    assert.ok(count >= 8 && count <= 150, `active result must remain within 8-150 blocks, got ${count}`);
    assert.equal(await page.locator("[data-ap-smooth-block='1'] [data-ap-smooth-block='1']").count(), 0);
  } else {
    assert.equal(count, 0, `inactive result must not leave marked blocks, got ${count}`);
  }
}

async function runCase(name, body) {
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
    failures.push(await runCase("511-item pure reference OL is one atomic block with stable intrinsic height", async () => {
      const { context, page } = await createCase(browser, {
        html: referenceDocument(),
        slug: "atomic-511-pure-references"
      });
      try {
        const status = await waitForSettledStatus(page);
        assert.equal(status.code, "active");
        assert.equal(await markedCount(page), 8, "7 body sections + 1 atomic bibliography should hit the minimum boundary exactly");
        assert.equal(await page.locator("#atomic-references[data-ap-smooth-block='1']").count(), 1);
        assert.equal(await page.locator("#atomic-references > li[data-ap-smooth-block='1']").count(), 0);
        assert.equal(await page.locator("#bibliography[data-ap-smooth-block='1']").count(), 0);
        assert.ok(status.metrics.textCoverage >= 55, `text coverage: ${status.metrics.textCoverage}`);
        assert.ok(status.metrics.heightCoverage >= 45, `height coverage: ${status.metrics.heightCoverage}`);
        assert.equal(await page.locator("[data-ap-smooth-block='1'] [data-ap-smooth-block='1']").count(), 0);

        const sizing = await page.locator("#atomic-references").evaluate((element) => ({
          rectHeight: element.getBoundingClientRect().height,
          intrinsic: Number.parseFloat(element.style.getPropertyValue("--ap-smooth-intrinsic-block-size")),
          contentVisibility: getComputedStyle(element).contentVisibility
        }));
        assert.equal(sizing.contentVisibility, "auto");
        assert.ok(sizing.intrinsic > 800 * 5.5, `atomic fallback height was unexpectedly clamped: ${sizing.intrinsic}`);
        assert.ok(Math.abs(sizing.intrinsic - sizing.rectHeight) / Math.max(sizing.rectHeight, 1) < 0.05,
          `intrinsic height ${sizing.intrinsic} does not preserve measured height ${sizing.rectHeight}`);

        await page.emulateMedia({ media: "print" });
        const printStyle = await page.locator("#atomic-references").evaluate((element) => ({
          contentVisibility: getComputedStyle(element).contentVisibility,
          intrinsic: getComputedStyle(element).containIntrinsicBlockSize
        }));
        assert.equal(printStyle.contentVisibility, "visible");
        assert.ok(printStyle.intrinsic.includes("none"), `print intrinsic size was not cleared: ${printStyle.intrinsic}`);

        await page.emulateMedia({ media: "screen" });
        assert.equal(await page.locator("#atomic-references").evaluate((element) => getComputedStyle(element).contentVisibility), "auto");

        const disabled = await send(page, "disablePage");
        assert.equal(disabled.code, "page-disabled");
        assert.equal(await markedCount(page), 0);
        assert.equal(await page.locator("html[data-ap-smooth-active='on']").count(), 0);
        assert.equal(await page.locator("#atomic-references").evaluate((element) => getComputedStyle(element).contentVisibility), "visible");
        assert.equal(await page.locator("#atomic-references").evaluate((element) => element.style.getPropertyValue("--ap-smooth-intrinsic-block-size")), "");
      } finally {
        await context.close();
      }
    }));

    const riskCases = [
      { name: "button", riskHtml: "<button type=\"button\">copy</button>" },
      { name: "iframe", riskHtml: "<iframe title=\"reference preview\"></iframe>" },
      { name: "dialog", riskHtml: "<dialog>reference dialog</dialog>" },
      { name: "absolute descendant", riskHtml: "<span style=\"position:absolute\">absolute</span>" },
      { name: "fixed descendant", riskHtml: "<span style=\"position:fixed\">fixed</span>" },
      { name: "sticky descendant", riskHtml: "<span style=\"position:sticky\">sticky</span>" },
      { name: "existing content-visibility on list", listAttributes: "style=\"content-visibility:auto;contain-intrinsic-size:auto 60000px\"" },
      {
        name: "existing content-visibility on last item",
        riskHtml: "<span class=\"already-contained\">contained</span>",
        extraCss: ".already-contained { content-visibility: auto; contain-intrinsic-size: auto 120px; }"
      }
    ];

    for (const risk of riskCases) {
      failures.push(await runCase(`reference OL with ${risk.name} is never atomized`, async () => {
        const { context, page } = await createCase(browser, {
          html: referenceDocument({
            listId: "risk-references",
            riskHtml: risk.riskHtml || "",
            listAttributes: risk.listAttributes || "",
            extraCss: risk.extraCss || ""
          }),
          slug: `risk-${risk.name.replaceAll(" ", "-")}`
        });
        try {
          await assertNonAtomicResult(page, "#risk-references");
        } finally {
          await context.close();
        }
      }));
    }

    failures.push(await runCase("a related-references ancestor vetoes an inner reference-list class", async () => {
      const items = referenceItems({ count: 511, listId: "related-reference-list" });
      const html = `<!doctype html><html><head>${articleHead()}</head><body><article>
        ${bodySections(7)}
        <section class="related-references">
          <h2>Related references</h2>
          <ol id="related-reference-list" class="reference-list">${items}</ol>
        </section>
      </article></body></html>`;
      const { context, page } = await createCase(browser, {
        html,
        slug: "related-references-negative-context"
      });
      try {
        await assertNonAtomicResult(page, "#related-reference-list");
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase("a 511-item non-reference ordered list is not atomized", async () => {
      const { context, page } = await createCase(browser, {
        html: referenceDocument({
          listId: "non-reference-list",
          listClass: "procedure-steps",
          role: "",
          containerId: "procedure"
        }),
        slug: "non-reference-ordered-list"
      });
      try {
        await assertNonAtomicResult(page, "#non-reference-list");
      } finally {
        await context.close();
      }
    }));
  } finally {
    await browser.close();
  }

  const failed = failures.filter(Boolean).length;
  if (failed) {
    console.error(`\n${failed} v1.2 atomic-reference regression case(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll v1.2 atomic-reference regression cases passed.");
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
