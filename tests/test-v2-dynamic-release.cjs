const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const extensionDir = process.env.LITHEPAGE_EXTENSION_DIR
  ? path.resolve(process.env.LITHEPAGE_EXTENSION_DIR)
  : path.resolve(__dirname, "..");
const browserChannel = process.env.LITHEPAGE_BROWSER_CHANNEL || "chrome";
const contentScript = path.join(extensionDir, "content.js");
const optimizationCss = path.join(extensionDir, "optimization.css");
const words = "energy heat transfer turbine combustion efficiency thermal power aerodynamic cooling ";

function head(extraCss = "") {
  return `
    <meta name="citation_title" content="V2 dynamic regression">
    <meta name="citation_doi" content="10.0000/v2-regression">
    <meta name="citation_journal_title" content="Dynamic Energy Journal">
    <style>
      body { margin: 0; }
      article { width: 900px; margin: auto; }
      .body-section { min-height: 900px; }
      .ref-list > .ref { min-height: 120px; }
      ${extraCss}
    </style>`;
}

function documentHtml(body, extraCss = "") {
  return `<!doctype html><html lang="en"><head>${head(extraCss)}</head><body>${body}</body></html>`;
}

function safeSections(count = 10, prefix = "section", repetitions = 38) {
  return Array.from({ length: count }, (_, index) => (
    `<section id="${prefix}-${index + 1}" class="body-section"><h2>${prefix} ${index + 1}</h2>`
      + `<p>${words.repeat(repetitions)}</p></section>`
  )).join("");
}

function longArticle(id = "article", sectionPrefix = id) {
  return `<article id="${id}">${safeSections(10, sectionPrefix)}</article>`;
}

function divReferenceItems(count = 120, { buttonAt = -1, absoluteAt = -1, contentVisibilityAt = -1 } = {}) {
  return Array.from({ length: count }, (_, index) => {
    const doi = `<a href="https://doi.org/10.0000/div-${index + 1}">doi</a>`;
    const button = index === buttonAt ? "<button type=\"button\">copy citation</button>" : "";
    const style = index === absoluteAt
      ? "position:absolute"
      : index === contentVisibilityAt
        ? "content-visibility:hidden"
        : "";
    return `<div class="ref" role="listitem" id="div-ref-${index + 1}" style="${style}">`
      + `<span>Author ${index + 1}. Reference title ${2000 + (index % 25)}. ${words.repeat(3)}</span>${doi}${button}</div>`;
  }).join("");
}

function divReferenceArticle({ related = false, buttonAt = -1, absoluteAt = -1, contentVisibilityAt = -1 } = {}) {
  const sectionClass = related ? "related-references" : "bibliography";
  const heading = related ? "Related articles" : "References";
  const role = related ? "" : "role=\"doc-bibliography\"";
  return `<article id="div-reference-article">${safeSections(7, "body")}`
    + `<section id="${related ? "related-references" : "references"}" class="${sectionClass}" ${role}>`
    + `<h2>${heading}</h2><div id="div-references" class="ref-list" role="list">`
    + `${divReferenceItems(120, { buttonAt, absoluteAt, contentVisibilityAt })}</div></section></article>`;
}

async function createCase(browser, { html, slug, storedSettings = {} }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript((stored) => {
    globalThis.__apSmoothMessageListener = null;
    globalThis.__storageGetCalls = 0;
    globalThis.chrome = {
      storage: {
        local: {
          get(defaults, callback) {
            globalThis.__storageGetCalls += 1;
            callback({ ...defaults, ...stored });
          },
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
  }, storedSettings);

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

async function waitForStatus(page, predicate, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  let status = null;
  while (Date.now() < deadline) {
    status = await getStatus(page);
    if (predicate(status)) return status;
    await page.waitForTimeout(60);
  }
  throw new Error(`Timed out waiting for status; last status=${JSON.stringify(status)}`);
}

async function waitForSettledStatus(page, timeoutMs = 6000) {
  return waitForStatus(page, (status) => status && status.code !== "checking", timeoutMs);
}

async function assertActiveInvariants(page, status) {
  assert.equal(status.code, "active");
  const count = await page.locator("[data-ap-smooth-block='1']").count();
  assert.ok(count >= 8 && count <= 150, `active block count must stay within 8-150, got ${count}`);
  assert.equal(await page.locator("[data-ap-smooth-block='1'] [data-ap-smooth-block='1']").count(), 0,
    "marked blocks must never be nested");
  assert.equal(await page.locator("html[data-ap-smooth-active='on']").count(), 1);
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

function compareVersions(left, right) {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta) return Math.sign(delta);
  }
  return 0;
}

(async () => {
  const failures = [];

  failures.push(await runCase("v2 manifest is cross-browser, least-privilege, complete, and upgrade-safe", async () => {
    const manifestPath = path.join(extensionDir, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.equal(manifest.manifest_version, 3);
    assert.match(manifest.version, /^2\.\d+\.\d+$/);
    assert.ok(compareVersions(manifest.version, "1.2.0") > 0, `version did not advance from 1.2.0: ${manifest.version}`);
    assert.deepEqual(manifest.permissions, ["storage"]);
    assert.equal("host_permissions" in manifest, false);
    assert.equal("background" in manifest, false);
    assert.equal("externally_connectable" in manifest, false);
    assert.equal("web_accessible_resources" in manifest, false);
    assert.equal(manifest.minimum_chrome_version, "109");

    for (const locale of ["zh_CN", "en"]) {
      const messages = JSON.parse(fs.readFileSync(
        path.join(extensionDir, "_locales", locale, "messages.json"), "utf8"
      ));
      assert.equal(messages.extensionName.message, "LithePage");
      assert.doesNotMatch(messages.extensionDescription.message, /Chrome|Microsoft Edge/i,
        `${locale} manifest description must remain browser-neutral`);
    }

    assert.equal(manifest.content_scripts.length, 1);
    const script = manifest.content_scripts[0];
    assert.deepEqual(script.matches, ["http://*/*", "https://*/*"]);
    assert.deepEqual(script.js, ["content.js"]);
    assert.deepEqual(script.css, ["optimization.css"]);
    assert.equal(script.run_at, "document_start");
    assert.equal(script.all_frames, false);
    assert.equal(script.world, "ISOLATED");

    for (const relativePath of [
      "content.js", "optimization.css", "popup.html", "popup.js", "popup.css",
      "options.html", "options.js", "options.css"
    ]) {
      assert.ok(fs.existsSync(path.join(extensionDir, relativePath)), `missing package file: ${relativePath}`);
    }
    for (const size of [16, 32, 48, 128]) {
      const icon = manifest.icons?.[String(size)];
      assert.ok(icon, `manifest icon ${size} is missing`);
      assert.ok(fs.existsSync(path.join(extensionDir, icon)), `icon file is missing: ${icon}`);
    }

    const readme = fs.readFileSync(path.join(extensionDir, "README.md"), "utf8");
    assert.ok(readme.includes(manifest.version), "README does not identify the shipped version");

    const shippedJavaScript = ["content.js", "popup.js", "options.js"]
      .map((name) => fs.readFileSync(path.join(extensionDir, name), "utf8"))
      .join("\n");
    const popupHtml = fs.readFileSync(path.join(extensionDir, "popup.html"), "utf8");
    assert.doesNotMatch(shippedJavaScript, /\b(?:eval|Function)\s*\(/, "dynamic code execution is not allowed");
    assert.doesNotMatch(shippedJavaScript, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/,
      "the extension must not add network clients");
    assert.doesNotMatch(popupHtml, /<(?:script|link)\b[^>]+(?:src|href)=["']https?:/i,
      "popup contains a remote script or stylesheet");
    assert.ok(fs.statSync(contentScript).size < 120_000,
      `content script exceeds the 120KB review budget: ${fs.statSync(contentScript).size}`);
  }));

  const browser = await chromium.launch({ channel: browserChannel, headless: true });

  try {
    failures.push(await runCase("late-loaded article activates through a bounded, coalesced observer check", async () => {
      const { context, page } = await createCase(browser, {
        html: documentHtml("<main id=\"loading-shell\"><p>Loading article…</p></main>"),
        slug: "late-loaded-article"
      });
      try {
        await waitForSettledStatus(page);
        await page.waitForTimeout(2900);
        const callsBefore = await page.evaluate(() => globalThis.__storageGetCalls);
        const startedAt = Date.now();
        await page.evaluate((article) => {
          document.body.innerHTML = article;
        }, longArticle("late-article", "late-section"));

        const status = await waitForStatus(page, (candidate) => candidate?.code === "active", 3000);
        const elapsed = Date.now() - startedAt;
        await assertActiveInvariants(page, status);
        assert.ok(elapsed < 3000, `observer recheck exceeded 3s budget: ${elapsed}ms`);
        const callsAfter = await page.evaluate(() => globalThis.__storageGetCalls);
        assert.ok(callsAfter - callsBefore <= 2,
          `one mutation burst caused too many evaluations: ${callsAfter - callsBefore}`);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase("SPA pushState replaces the article, clears page override, and marks only the new route", async () => {
      const { context, page } = await createCase(browser, {
        html: documentHtml(longArticle("spa-a", "spa-a-section")),
        slug: "spa-route-a"
      });
      try {
        const initial = await waitForStatus(page, (candidate) => candidate?.code === "active");
        await assertActiveInvariants(page, initial);
        const disabled = await send(page, "disablePage");
        assert.equal(disabled.code, "page-disabled");
        assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 0);

        await page.evaluate((article) => {
          document.body.innerHTML = article;
          history.pushState({ route: "b" }, "", "/article/spa-route-b");
        }, longArticle("spa-b", "spa-b-section"));

        const next = await waitForStatus(page, (candidate) => candidate?.code === "active", 4000);
        await assertActiveInvariants(page, next);
        assert.equal(new URL(page.url()).pathname, "/article/spa-route-b");
        assert.equal(await page.locator("#spa-a").count(), 0);
        assert.ok(await page.locator("#spa-b [data-ap-smooth-block='1']").count() >= 8);

        const disabledAgain = await send(page, "disablePage");
        assert.equal(disabledAgain.code, "page-disabled");
        await page.evaluate((article) => {
          document.body.innerHTML = article;
          history.replaceState({ route: "c" }, "", "/article/spa-route-c");
        }, longArticle("spa-c", "spa-c-section"));
        const replaced = await waitForStatus(page, (candidate) => candidate?.code === "active", 4000);
        await assertActiveInvariants(page, replaced);
        assert.equal(new URL(page.url()).pathname, "/article/spa-route-c");
        assert.equal(await page.locator("#spa-b").count(), 0);
        assert.ok(await page.locator("#spa-c [data-ap-smooth-block='1']").count() >= 8);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase("safe DIV bibliography is one atomic block and restores for print/disable", async () => {
      const { context, page } = await createCase(browser, {
        html: documentHtml(divReferenceArticle()),
        slug: "div-reference-bibliography"
      });
      try {
        const status = await waitForStatus(page, (candidate) => candidate?.code === "active");
        await assertActiveInvariants(page, status);
        assert.equal(await page.locator("[data-ap-smooth-block='1']").count(), 8);
        assert.equal(await page.locator("#div-references[data-ap-smooth-block='1']").count(), 1);
        assert.equal(await page.locator("#div-references[data-ap-smooth-kind='reference-div']").count(), 1);
        assert.equal(await page.locator("#div-references > .ref[data-ap-smooth-block]").count(), 0);
        assert.equal(await page.locator("#references[data-ap-smooth-block]").count(), 0);

        const dimensions = await page.locator("#div-references").evaluate((element) => ({
          actual: element.getBoundingClientRect().height,
          intrinsic: Number.parseFloat(element.style.getPropertyValue("--ap-smooth-intrinsic-block-size")),
          visibility: getComputedStyle(element).contentVisibility
        }));
        assert.equal(dimensions.visibility, "auto");
        assert.ok(dimensions.intrinsic > 800 * 5.5);
        assert.ok(Math.abs(dimensions.intrinsic - dimensions.actual) / Math.max(dimensions.actual, 1) < 0.05);

        await page.emulateMedia({ media: "print" });
        assert.equal(await page.locator("#div-references").evaluate((element) => getComputedStyle(element).contentVisibility), "visible");
        await page.emulateMedia({ media: "screen" });
        assert.equal(await page.locator("#div-references").evaluate((element) => getComputedStyle(element).contentVisibility), "auto");

        const disabled = await send(page, "disablePage");
        assert.equal(disabled.code, "page-disabled");
        assert.equal(await page.locator("[data-ap-smooth-block]").count(), 0);
        assert.equal(await page.locator("[data-ap-smooth-kind]").count(), 0);
        assert.equal(await page.locator("#div-references").evaluate((element) => element.style.getPropertyValue("--ap-smooth-intrinsic-block-size")), "");
      } finally {
        await context.close();
      }
    }));

    for (const variant of [
      { name: "negative related-references context", options: { related: true } },
      { name: "interactive button in the last entry", options: { buttonAt: 119 } },
      { name: "absolute positioning in the last entry", options: { absoluteAt: 119 } },
      { name: "existing content-visibility in the last entry", options: { contentVisibilityAt: 119 } }
    ]) {
      failures.push(await runCase(`DIV bibliography refuses atomic mode for ${variant.name}`, async () => {
        const { context, page } = await createCase(browser, {
          html: documentHtml(divReferenceArticle(variant.options)),
          slug: `div-reference-risk-${variant.name.replaceAll(" ", "-")}`
        });
        try {
          const status = await waitForSettledStatus(page);
          assert.equal(await page.locator("#div-references[data-ap-smooth-block='1']").count(), 0);
          assert.equal(await page.locator("#div-references[data-ap-smooth-kind='reference-div']").count(), 0);
          const count = await page.locator("[data-ap-smooth-block='1']").count();
          if (status.code === "active") {
            assert.ok(count >= 8 && count <= 150);
            assert.equal(await page.locator("[data-ap-smooth-block='1'] [data-ap-smooth-block='1']").count(), 0);
          } else {
            assert.equal(count, 0);
          }
        } finally {
          await context.close();
        }
      }));
    }

    failures.push(await runCase("translation-like text mutation flood does not trigger rescans or disturb marks", async () => {
      const translatedBody = `<article id="translation-article">${Array.from({ length: 10 }, (_, sectionIndex) => (
        `<section class="body-section" id="translation-${sectionIndex + 1}"><h2>Section ${sectionIndex + 1}</h2><p>`
          + `${Array.from({ length: 140 }, (_, wordIndex) => `<span>term-${sectionIndex}-${wordIndex} ${words}</span>`).join("")}`
          + `</p></section>`
      )).join("")}</article>`;
      const { context, page } = await createCase(browser, {
        html: documentHtml(translatedBody),
        slug: "translation-mutation-flood"
      });
      try {
        const status = await waitForStatus(page, (candidate) => candidate?.code === "active");
        await assertActiveInvariants(page, status);
        await page.waitForTimeout(7000);
        const before = await page.evaluate(() => ({
          storageCalls: globalThis.__storageGetCalls,
          markedIds: Array.from(document.querySelectorAll("[data-ap-smooth-block='1']"), (element) => element.id)
        }));

        await page.evaluate(() => {
          document.documentElement.classList.add("translated-ltr");
          document.documentElement.lang = "zh-CN";
          for (const span of document.querySelectorAll("#translation-article span")) {
            span.textContent = `译文 ${span.textContent}`;
          }
        });
        await page.waitForTimeout(2500);

        const after = await page.evaluate(() => ({
          storageCalls: globalThis.__storageGetCalls,
          markedIds: Array.from(document.querySelectorAll("[data-ap-smooth-block='1']"), (element) => element.id),
          rootActive: document.documentElement.getAttribute("data-ap-smooth-active")
        }));
        assert.deepEqual(after.markedIds, before.markedIds);
        assert.equal(after.rootActive, "on");
        assert.equal(after.storageCalls, before.storageCalls,
          "translation-only DOM flood unexpectedly caused a new evaluation");
        assert.equal(await page.locator("[data-ap-smooth-block='1'] [data-ap-smooth-block='1']").count(), 0);
      } finally {
        await context.close();
      }
    }));

    failures.push(await runCase("legacy v1 settings remain honored after the v2 upgrade", async () => {
      const globallyDisabled = await createCase(browser, {
        html: documentHtml(longArticle("legacy-global")),
        slug: "legacy-global-disabled",
        storedSettings: { autoEnabled: false, siteModes: {} }
      });
      try {
        const status = await waitForSettledStatus(globallyDisabled.page);
        assert.equal(status.code, "disabled");
        assert.equal(await globallyDisabled.page.locator("[data-ap-smooth-block]").count(), 0);
      } finally {
        await globallyDisabled.context.close();
      }

      const siteDisabled = await createCase(browser, {
        html: documentHtml(longArticle("legacy-site")),
        slug: "legacy-site-disabled",
        storedSettings: { autoEnabled: true, siteModes: { "journal.example": "off" } }
      });
      try {
        const status = await waitForSettledStatus(siteDisabled.page);
        assert.equal(status.code, "site-disabled");
        assert.equal(await siteDisabled.page.locator("[data-ap-smooth-block]").count(), 0);
      } finally {
        await siteDisabled.context.close();
      }
    }));

    failures.push(await runCase("large safe DOM stays inside the initial detection performance budget", async () => {
      const largeBody = `<article id="performance-article">${Array.from({ length: 150 }, (_, index) => (
        `<section class="body-section" id="perf-${index + 1}"><h2>Section ${index + 1}</h2>`
          + `<p>${Array.from({ length: 35 }, (__, spanIndex) => `<span>${spanIndex} ${words}</span>`).join("")}</p></section>`
      )).join("")}</article>`;
      const startedAt = Date.now();
      const { context, page } = await createCase(browser, {
        html: documentHtml(largeBody),
        slug: "performance-budget"
      });
      try {
        const status = await waitForStatus(page, (candidate) => candidate?.code === "active", 5000);
        const elapsed = Date.now() - startedAt;
        await assertActiveInvariants(page, status);
        assert.ok(elapsed < 5000, `initial detection exceeded the 5s release budget: ${elapsed}ms`);
        assert.ok(await page.locator("[data-ap-smooth-block='1']").count() <= 150);
      } finally {
        await context.close();
      }
    }));
  } finally {
    await browser.close();
  }

  const failed = failures.filter(Boolean).length;
  if (failed) {
    console.error(`\n${failed} v2 dynamic/release regression case(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll v2 dynamic/release regression cases passed.");
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
