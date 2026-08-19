(() => {
  "use strict";

  const ROOT_ATTRIBUTE = "data-ap-smooth-active";
  const BLOCK_ATTRIBUTE = "data-ap-smooth-block";
  const BLOCK_KIND_ATTRIBUTE = "data-ap-smooth-kind";
  const SIZE_PROPERTY = "--ap-smooth-intrinsic-block-size";
  const MAX_ROOT_CANDIDATES = 48;
  const MAX_BLOCK_CANDIDATES = 220;
  const MAX_OPTIMIZED_BLOCKS = 150;
  const MIN_OPTIMIZED_BLOCKS = 8;
  const MAX_SEGMENT_DEPTH = 10;
  const TEXT_LENGTH_CAP = 400000;
  const DOMINANT_WRAPPER_TEXT_RATIO = 0.70;
  const MIN_ATOMIC_REFERENCE_ITEMS = 80;
  const MIN_ATOMIC_REFERENCE_TEXT = 8000;
  const MAX_ATOMIC_REFERENCE_DESCENDANTS = 25000;
  const ATOMIC_REFERENCE_ENTRY_RETENTION = 0.90;
  const ATOMIC_REFERENCE_TAG_CONSISTENCY = 0.85;
  const HYDRATION_OBSERVER_WINDOW_MS = 12000;
  const HYDRATION_OBSERVER_DEBOUNCE_MS = 900;
  const MAX_HYDRATION_RECHECKS = 5;
  const REFERENCE_CONTEXT_TOKEN_RE = /(?:^|[-_\s])(?:references?|bibliograph(?:y|ies)|ref[-_\s]?list|reference[-_\s]?list|literature[-_\s]?cited|works[-_\s]?cited)(?:$|[-_\s])/i;
  const NON_REFERENCE_CONTEXT_TOKEN_RE = /(?:^|[-_\s])(?:non[-_\s]?references?|related[-_\s]?(?:articles?|references?)|further[-_\s]?reading|procedure[-_\s]?steps)(?:$|[-_\s])/i;
  const REFERENCE_HEADING_RE = /^(?:\d+(?:\.\d+)*\s*)?(?:references?|bibliograph(?:y|ies)|literature cited|works cited|cited literature|references and notes|notes and references|参考文献|引用文献|références?|referencias?|referências?)\s*[:：]?$/i;
  const REFERENCE_YEAR_RE = /\b(?:18|19|20)\d{2}[a-z]?\b/i;
  const REFERENCE_DOI_RE = /\b10\.\d{4,9}\/[\w.()/:;-]+/i;

  const DEFAULT_SETTINGS = {
    autoEnabled: true,
    hydrationObserverEnabled: true,
    referenceOptimizationEnabled: true,
    siteModes: {}
  };

  const ROOT_SELECTORS = [
    "article",
    "[role='article']",
    "#article-body",
    "#articleBody",
    "#main-article",
    ".article-body",
    ".article__body",
    ".article-content",
    ".articleBody",
    ".c-article-body",
    ".article__sections",
    ".fulltext",
    ".fulltext-view",
    ".NLM_article",
    ".NLM_body",
    ".hlFld-Fulltext",
    "[data-testid='article-body']",
    "main",
    "[role='main']"
  ];

  const SECTION_CHILD_SELECTOR = [
    "section",
    "[role='doc-chapter']",
    "[role='doc-bibliography']",
    ".section",
    ".article-section",
    ".c-article-section",
    ".NLM_sec",
    ".references",
    ".ref-list"
  ].join(",");

  const RISKY_DESCENDANT_SELECTOR = [
    "dialog",
    "iframe",
    "video",
    "canvas",
    "[contenteditable='true']",
    "[role='dialog']",
    "[aria-live]",
    "[popover]",
    "[class*='tooltip' i]",
    "[class*='popover' i]",
    "[class*='modal' i]",
    "[class*='overlay' i]",
    "[class*='lightbox' i]",
    "[class*='zoom' i]"
  ].join(",");

  const EXCLUDED_TAGS = new Set([
    "SCRIPT", "STYLE", "LINK", "META", "TEMPLATE", "NOSCRIPT",
    "HEADER", "NAV", "FOOTER", "ASIDE", "FORM", "DIALOG",
    "INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON",
    "FIGURE", "TABLE", "THEAD", "TBODY", "TR"
  ]);

  const ALWAYS_SKIP_HOSTS = new Set([
    "mail.google.com",
    "docs.google.com",
    "drive.google.com",
    "calendar.google.com",
    "chatgpt.com",
    "claude.ai",
    "www.notion.so",
    "notion.so",
    "www.figma.com",
    "figma.com",
    "www.canva.com",
    "canva.com",
    "app.slack.com",
    "teams.microsoft.com",
    "outlook.live.com",
    "outlook.office.com"
  ]);

  const markedElements = new Set();
  const previousSizes = new WeakMap();
  const scheduledTimers = new Set();

  let settings = { ...DEFAULT_SETTINGS, siteModes: {} };
  let textLengthCache = new WeakMap();
  let atomicReferenceCache = new WeakMap();
  let atomicReferenceDescendantCache = new WeakMap();
  let atomicReferenceEntriesCache = new WeakMap();
  let pageOverride = "auto";
  let scheduleGeneration = 0;
  let documentUrlKey = normalizedDocumentUrl();
  let detectionCache = null;
  let retryObserver = null;
  let retryObserverTimer = null;
  let retryObserverDeadline = 0;
  let retryObserverAttempts = 0;
  let retryDebounceTimer = null;
  let evaluationPromise = null;
  let queuedEvaluationReason = null;
  let scanPasses = 0;
  let routeEpoch = 0;
  let status = {
    code: "checking",
    host: location.hostname,
    blocks: 0,
    message: "正在检测页面",
    metrics: null
  };

  function getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
        resolve({
          autoEnabled: result.autoEnabled !== false,
          hydrationObserverEnabled: result.hydrationObserverEnabled !== false,
          referenceOptimizationEnabled: result.referenceOptimizationEnabled !== false,
          siteModes: result.siteModes && typeof result.siteModes === "object"
            ? result.siteModes
            : {}
        });
      });
    });
  }

  function normalizedDocumentUrl() {
    const routerHash = /^#(?:!\/|\/)/.test(location.hash) ? location.hash : "";
    return `${location.origin}${location.pathname}${location.search}${routerHash}`;
  }

  function setStatus(code, message, blocks = 0, metrics = null) {
    status = {
      code,
      host: location.hostname,
      blocks,
      message,
      metrics
    };
  }

  function isSupportedPage() {
    if (window.top !== window) return false;
    if (!/^https?:$/.test(location.protocol)) return false;
    if (document.contentType !== "text/html") return false;
    if (/\.pdf(?:$|[?#])/i.test(location.pathname + location.search + location.hash)) return false;
    if (document.designMode === "on") return false;
    return true;
  }

  function clearScheduledChecks() {
    for (const timer of scheduledTimers) clearTimeout(timer);
    scheduledTimers.clear();
  }

  function clearOptimization() {
    document.documentElement?.removeAttribute(ROOT_ATTRIBUTE);

    for (const element of markedElements) {
      if (!element) continue;
      element.removeAttribute(BLOCK_ATTRIBUTE);
      element.removeAttribute(BLOCK_KIND_ATTRIBUTE);
      const previous = previousSizes.get(element);
      if (previous && previous.value) {
        element.style.setProperty(SIZE_PROPERTY, previous.value, previous.priority || "");
      } else {
        element.style.removeProperty(SIZE_PROPERTY);
      }
    }

    markedElements.clear();
  }

  function isTextExcludedElement(element) {
    if (!element || EXCLUDED_TAGS.has(element.tagName)) return true;
    return element.matches(
      "[hidden], [aria-hidden='true'], [contenteditable='true'], [role='dialog'], [aria-live], [popover]"
    );
  }

  function sampledTextLength(root) {
    if (!root || isTextExcludedElement(root)) return 0;

    const cached = textLengthCache.get(root);
    if (typeof cached === "number") return cached;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return isTextExcludedElement(node)
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    let total = 0;
    let nodes = 0;
    let node;

    while ((node = walker.nextNode())) {
      nodes += 1;
      if (nodes > 8000) break;
      total += (node.nodeValue || "").trim().length;
      if (total >= TEXT_LENGTH_CAP) {
        total = TEXT_LENGTH_CAP;
        break;
      }
    }

    textLengthCache.set(root, total);
    return total;
  }

  function cappedTextLength(root) {
    return sampledTextLength(root);
  }

  function quickElementTextLength(element) {
    return sampledTextLength(element);
  }

  function semanticScore() {
    let score = 0;
    const citationTitle = document.querySelector("meta[name='citation_title' i]");
    const citationDoi = document.querySelector("meta[name='citation_doi' i], meta[name='dc.identifier' i][content*='doi' i]");
    const journalMeta = document.querySelector(
      "meta[name='citation_journal_title' i], meta[name='prism.publicationName' i], meta[name='dc.type' i][content*='article' i]"
    );

    if (citationTitle) score += 5;
    if (citationDoi) score += 3;
    if (journalMeta) score += 2;
    if (document.querySelector("article, [role='article']")) score += 2;

    const canonical = document.querySelector("link[rel='canonical']")?.href || "";
    if (/(?:doi\.org|\/doi\/|\/article\/|\/science\/article\/|\/full(?:text)?\/)/i.test(location.href + " " + canonical)) {
      score += 1;
    }

    const jsonLdScripts = document.querySelectorAll("script[type='application/ld+json']");
    const jsonLdLimit = Math.min(jsonLdScripts.length, 16);
    for (let index = 0; index < jsonLdLimit; index += 1) {
      if (/\bScholarlyArticle\b/.test((jsonLdScripts[index].textContent || "").slice(0, 30000))) {
        score += 4;
        break;
      }
    }

    return score;
  }

  function rootSelectorWeight(selector) {
    if (selector === "main" || selector === "[role='main']") return 0;
    if (selector === "article" || selector === "[role='article']") return 42000;
    if (selector.startsWith("#")) return 56000;
    return 50000;
  }

  function selectArticleRoot() {
    const candidates = [];
    const seen = new Set();
    let inspectedElements = 0;

    for (let selectorIndex = 0; selectorIndex < ROOT_SELECTORS.length; selectorIndex += 1) {
      const selector = ROOT_SELECTORS[selectorIndex];
      const elements = document.querySelectorAll(selector);
      const selectorInspectLimit = Math.min(elements.length, 18);

      for (let elementIndex = 0; elementIndex < selectorInspectLimit; elementIndex += 1) {
        const element = elements[elementIndex];
        inspectedElements += 1;
        if (inspectedElements > 160) break;
        if (seen.has(element)) continue;
        seen.add(element);
        if (candidates.length >= MAX_ROOT_CANDIDATES) break;

        const textLength = quickElementTextLength(element);
        if (textLength < 3500) continue;

        const paragraphCount = Math.min(element.querySelectorAll("p").length, 300);
        const isGeneral = selector === "main" || selector === "[role='main']";
        const candidateScore = textLength + paragraphCount * 120 + rootSelectorWeight(selector);
        candidates.push({ element, textLength, paragraphCount, candidateScore, isGeneral });
      }

      if (candidates.length >= MAX_ROOT_CANDIDATES || inspectedElements > 160) break;
    }

    const specificCandidates = candidates.filter((candidate) => !candidate.isGeneral);
    for (const candidate of candidates) {
      if (!candidate.isGeneral) continue;
      if (specificCandidates.some((specific) => candidate.element.contains(specific.element))) {
        candidate.candidateScore -= 40000;
      }
    }

    candidates.sort((a, b) => b.candidateScore - a.candidateScore);
    return candidates[0] || null;
  }

  function isTraversalExcluded(element) {
    return isTextExcludedElement(element);
  }

  function isStructurallyExcluded(element) {
    if (isTraversalExcluded(element)) return true;
    if (element.querySelector(RISKY_DESCENDANT_SELECTOR)) return true;
    if (element.querySelectorAll("button, input, textarea, select").length > 6) return true;
    return false;
  }

  function meaningfulDirectChildren(container) {
    const children = [];

    for (const child of container.children) {
      if (children.length >= MAX_BLOCK_CANDIDATES) break;
      if (isTraversalExcluded(child)) continue;

      const textLength = quickElementTextLength(child);
      const hasContentStructure = Boolean(child.querySelector("p, section, figure, table, h2, h3, h4, ol, ul"));
      if (textLength < 80 && !hasContentStructure) continue;
      children.push({ element: child, textLength });
    }

    return children;
  }

  function elementReferenceTokens(element) {
    const className = typeof element.className === "string" ? element.className : "";
    return [
      element.id || "",
      className,
      element.getAttribute("role") || "",
      element.getAttribute("aria-label") || ""
    ].join(" ");
  }

  function isReferenceHeading(element) {
    if (!element?.matches("h1, h2, h3, h4, h5, h6, [role='heading']")) return false;
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    return text.length <= 120 && REFERENCE_HEADING_RE.test(text);
  }

  function hasDirectReferenceContext(element) {
    if (!element) return false;
    if (element.getAttribute("role") === "doc-bibliography") return true;
    const tokens = elementReferenceTokens(element);
    if (NON_REFERENCE_CONTEXT_TOKEN_RE.test(tokens)) return false;
    if (REFERENCE_CONTEXT_TOKEN_RE.test(tokens)) return true;

    const labelledBy = (element.getAttribute("aria-labelledby") || "").trim().split(/\s+/).filter(Boolean);
    for (const id of labelledBy.slice(0, 4)) {
      if (isReferenceHeading(document.getElementById(id))) return true;
    }

    if (isReferenceHeading(element.previousElementSibling)) return true;
    const directHeadings = element.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > [role='heading']");
    const limit = Math.min(directHeadings.length, 4);
    for (let index = 0; index < limit; index += 1) {
      if (isReferenceHeading(directHeadings[index])) return true;
    }

    return false;
  }

  function hasReferenceContext(element, root) {
    const chain = [];
    let current = element;
    for (let depth = 0; current && depth <= 5; depth += 1) {
      chain.push(current);
      if (current === root) break;
      current = current.parentElement;
    }

    if (chain.some((ancestor) => NON_REFERENCE_CONTEXT_TOKEN_RE.test(elementReferenceTokens(ancestor)))) {
      return false;
    }

    return chain.some((ancestor) => hasDirectReferenceContext(ancestor));
  }

  function citationEvidenceRatio(entries) {
    const sampleCount = Math.min(entries.length, 60);
    if (!sampleCount) return 0;

    let matching = 0;
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const entryIndex = sampleCount === 1
        ? 0
        : Math.round(sampleIndex * (entries.length - 1) / (sampleCount - 1));
      const entry = entries[entryIndex];
      const text = (entry.textContent || "").replace(/\s+/g, " ").trim().slice(0, 1200);
      const hasDoiLink = Boolean(entry.querySelector("a[href*='doi.org' i]"));
      if (
        text.length >= 30
        && (REFERENCE_YEAR_RE.test(text) || REFERENCE_DOI_RE.test(text) || hasDoiLink)
      ) {
        matching += 1;
      }
    }

    return matching / sampleCount;
  }

  function hasAtomicReferenceSubtreeRisk(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
    let visited = 0;
    let node;

    while ((node = walker.nextNode())) {
      visited += 1;
      if (visited > MAX_ATOMIC_REFERENCE_DESCENDANTS) return true;
      if (
        node.matches(
          "button, input, textarea, select, form, dialog, iframe, video, canvas, "
          + "[contenteditable='true'], [role='dialog'], [aria-live], [popover]"
        )
      ) {
        return true;
      }

      const style = getComputedStyle(node);
      if (style.position === "fixed" || style.position === "sticky" || style.position === "absolute") {
        return true;
      }
      if (style.contentVisibility && style.contentVisibility !== "visible") return true;
    }

    return false;
  }

  function atomicReferenceEntries(element, root) {
    if (!element || !root?.contains(element) || !settings.referenceOptimizationEnabled) return null;
    if (atomicReferenceEntriesCache.has(element)) return atomicReferenceEntriesCache.get(element);

    const directChildren = Array.from(element.children);
    let result = null;

    if (directChildren.length >= MIN_ATOMIC_REFERENCE_ITEMS) {
      if (element.matches("ol, ul")) {
        if (
          directChildren.every((entry) => entry.tagName === "LI")
          && !element.querySelector("li ol, li ul")
        ) {
          result = { entries: directChildren, kind: "reference-list" };
        }
      } else if (element.matches("div, section, article, [role='doc-bibliography']")) {
        const eligible = directChildren.filter((entry) => (
          entry.matches("div, p, article, [role='listitem'], [role='doc-biblioentry']")
        ));
        const tagCounts = new Map();
        for (const entry of eligible) {
          const signature = entry.getAttribute("role") === "listitem"
            || entry.getAttribute("role") === "doc-biblioentry"
            ? `role:${entry.getAttribute("role")}`
            : entry.tagName;
          tagCounts.set(signature, (tagCounts.get(signature) || 0) + 1);
        }
        const dominantCount = Math.max(0, ...tagCounts.values());
        const consistency = dominantCount / Math.max(directChildren.length, 1);
        const entryText = eligible.reduce((sum, entry) => sum + quickElementTextLength(entry), 0);
        const containerText = Math.max(quickElementTextLength(element), entryText, 1);
        const retention = entryText / containerText;

        if (
          eligible.length >= MIN_ATOMIC_REFERENCE_ITEMS
          && consistency >= ATOMIC_REFERENCE_TAG_CONSISTENCY
          && retention >= ATOMIC_REFERENCE_ENTRY_RETENTION
          && !element.querySelector(":scope > ol, :scope > ul")
        ) {
          result = { entries: eligible, kind: "reference-div" };
        }
      }
    }

    atomicReferenceEntriesCache.set(element, result);
    return result;
  }

  function atomicReferenceInfo(element, root) {
    if (!element || !root?.contains(element) || !settings.referenceOptimizationEnabled) return null;
    if (atomicReferenceCache.has(element)) return atomicReferenceCache.get(element);

    let accepted = null;
    const candidate = atomicReferenceEntries(element, root);

    if (
      candidate
      && quickElementTextLength(element) >= MIN_ATOMIC_REFERENCE_TEXT
      && hasReferenceContext(element, root)
      && citationEvidenceRatio(candidate.entries) >= 0.60
      && !isTerminalRefinementContainer(element)
      && !isStructurallyExcluded(element)
      && !hasAtomicReferenceSubtreeRisk(element)
    ) {
      const rect = element.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight || 0, 600);
      if (Number.isFinite(rect.height) && rect.height > viewportHeight * 5.5) {
        accepted = { kind: candidate.kind, entryCount: candidate.entries.length };
      }
    }

    atomicReferenceCache.set(element, accepted);
    return accepted;
  }

  function isAtomicReferenceList(element, root) {
    return Boolean(atomicReferenceInfo(element, root));
  }

  function findAtomicReferenceDescendant(container, root) {
    const cached = atomicReferenceDescendantCache.get(container);
    if (cached !== undefined) return cached;

    const candidates = [];
    const seen = new Set();
    const addCandidate = (element) => {
      if (!element || seen.has(element) || candidates.length >= 32) return;
      seen.add(element);
      candidates.push(element);
    };
    addCandidate(container);

    const semanticCandidates = container.querySelectorAll([
      "ol", "ul", "[role='doc-bibliography']", ".references", ".bibliography",
      ".ref-list", ".reference-list", "[id='references' i]", "[id='bibliography' i]",
      "[id^='references-' i]", "[id^='bibliography-' i]"
    ].join(","));
    const limit = Math.min(semanticCandidates.length, 32);
    for (let index = 0; index < limit; index += 1) {
      const semantic = semanticCandidates[index];
      addCandidate(semantic);
      for (const child of semantic.children) {
        if (child.children.length >= MIN_ATOMIC_REFERENCE_ITEMS) addCandidate(child);
      }
    }

    const containerText = Math.max(quickElementTextLength(container), 1);
    let best = null;

    for (const candidate of candidates) {
      const info = atomicReferenceInfo(candidate, root);
      if (!info) continue;
      const textLength = quickElementTextLength(candidate);
      const retention = textLength / Math.max(containerText, textLength, 1);
      if (candidate !== container && !hasDirectReferenceContext(container) && retention < DOMINANT_WRAPPER_TEXT_RATIO) {
        continue;
      }
      if (!best || textLength > best.textLength) {
        best = {
          element: candidate,
          textLength,
          atomicReference: true,
          atomicKind: info.kind,
          referenceEntryCount: info.entryCount
        };
      }
    }

    atomicReferenceDescendantCache.set(container, best);
    return best;
  }

  function isTerminalRefinementContainer(element) {
    if (!element?.isConnected || isTraversalExcluded(element)) return true;

    const style = getComputedStyle(element);
    if (style.position === "fixed" || style.position === "sticky" || style.position === "absolute") return true;
    if (style.contentVisibility && style.contentVisibility !== "visible") return true;
    if (style.display === "inline" || style.display.startsWith("table")) return true;
    return false;
  }

  function hasTerminalUnsafeAncestor(element, root, cache) {
    let current = element.parentElement;
    const visited = [];

    while (current) {
      if (cache.has(current)) {
        const cached = cache.get(current);
        for (const ancestor of visited) cache.set(ancestor, cached);
        return cached;
      }

      visited.push(current);
      if (isTerminalRefinementContainer(current)) {
        for (const ancestor of visited) cache.set(ancestor, true);
        return true;
      }
      if (current === root) break;
      current = current.parentElement;
    }

    for (const ancestor of visited) cache.set(ancestor, false);
    return false;
  }

  function candidateLayerMetrics(layer, rootTextLength) {
    const totalText = layer.reduce((sum, item) => sum + item.textLength, 0);
    const rootBasis = Math.max(rootTextLength, 1);
    const layerBasis = Math.max(rootBasis, totalText);
    const coverage = Math.min(totalText / rootBasis, 1);
    const largestShare = layer.length
      ? Math.max(...layer.map((item) => item.textLength)) / layerBasis
      : 1;

    return {
      totalText,
      coverage,
      largestShare,
      count: layer.length
    };
  }

  function candidateLayerScore(layer, rootTextLength, root) {
    if (!layer.length) return -Infinity;

    const { coverage, largestShare, count } = candidateLayerMetrics(layer, rootTextLength);
    const atomicReferences = new Set(
      layer.filter((item) => isAtomicReferenceList(item.element, root))
    );
    const totalText = Math.max(layer.reduce((sum, item) => sum + item.textLength, 0), 1);
    const layerBasis = Math.max(rootTextLength, totalText, 1);
    const regularLargestShare = Math.max(
      0,
      ...layer
        .filter((item) => !atomicReferences.has(item))
        .map((item) => item.textLength / layerBasis)
    );

    if (count < MIN_OPTIMIZED_BLOCKS || count > MAX_OPTIMIZED_BLOCKS) return -Infinity;
    if (coverage < 0.60 || regularLargestShare > 0.72) return -Infinity;

    const countFit = Math.max(0, 48 - Math.abs(count - 36) * 0.75);
    return coverage * 100 + countFit - regularLargestShare * 30;
  }

  function findStructuralSegments(root, rootTextLength) {
    const layerCandidates = [];

    const topSections = [];
    for (const element of root.children) {
      if (topSections.length >= MAX_BLOCK_CANDIDATES) break;
      if (!element.matches(SECTION_CHILD_SELECTOR) || isTraversalExcluded(element)) continue;
      const textLength = quickElementTextLength(element);
      if (textLength >= 80) topSections.push({ element, textLength });
    }

    if (topSections.length) layerCandidates.push(topSections);

    let layer = [{ element: root, textLength: rootTextLength }];

    for (let depth = 0; depth < MAX_SEGMENT_DEPTH; depth += 1) {
      const nextLayer = [];
      let changed = false;

      for (const item of layer) {
        const children = meaningfulDirectChildren(item.element);
        const atomicReference = isAtomicReferenceList(item.element, root);
        const isLarge = item.textLength > Math.max(4500, rootTextLength * 0.10);
        const singleChildRetention = children.length === 1
          ? children[0].textLength / Math.max(item.textLength, children[0].textLength, 1)
          : 0;
        const isDominantSingleWrapper = isLarge
          && children.length === 1
          && singleChildRetention >= DOMINANT_WRAPPER_TEXT_RATIO;
        const shouldSplit = !atomicReference && !isTerminalRefinementContainer(item.element) && (item.element === root
          || (isLarge && children.length >= 2)
          || isDominantSingleWrapper);

        if (shouldSplit && children.length) {
          nextLayer.push(...children);
          changed = true;
        } else if (item.element !== root) {
          nextLayer.push(item);
        }

        if (nextLayer.length >= MAX_BLOCK_CANDIDATES) break;
      }

      if (!nextLayer.length || !changed) break;
      layerCandidates.push(nextLayer.slice(0, MAX_BLOCK_CANDIDATES));
      layer = nextLayer.slice(0, MAX_BLOCK_CANDIDATES);
    }

    let bestLayer = [];
    let bestScore = -Infinity;

    for (const candidate of layerCandidates) {
      const boundedCandidate = candidate.slice(0, MAX_OPTIMIZED_BLOCKS);
      const score = candidateLayerScore(boundedCandidate, rootTextLength, root);
      if (score > bestScore) {
        bestScore = score;
        bestLayer = boundedCandidate;
      }
    }

    return bestLayer;
  }

  function refineStructuralSegments(root, segments) {
    const viewportHeight = Math.max(window.innerHeight || 0, 600);
    const settledElements = new WeakSet();
    let frontier = segments.slice(0, MAX_BLOCK_CANDIDATES);

    for (let depth = 0; depth < MAX_SEGMENT_DEPTH; depth += 1) {
      const nextFrontier = [];
      let changed = false;

      for (let index = 0; index < frontier.length; index += 1) {
        const item = frontier[index];
        if (settledElements.has(item.element)) {
          nextFrontier.push(item);
          continue;
        }

        const atomicReference = findAtomicReferenceDescendant(item.element, root);
        if (atomicReference) {
          nextFrontier.push(atomicReference);
          settledElements.add(atomicReference.element);
          if (atomicReference.element !== item.element || item.atomicReference !== true) changed = true;
          continue;
        }

        const rect = item.element.getBoundingClientRect();
        const needsRefinement = !isTerminalRefinementContainer(item.element)
          && (
            rect.height > viewportHeight * 5.5
            || isStructurallyExcluded(item.element)
            || hasRiskyPositionedDescendant(item.element)
          );

        if (needsRefinement) {
          const children = meaningfulDirectChildren(item.element);
          const remainingItems = frontier.length - index - 1;
          const availableSlots = Math.max(
            0,
            MAX_BLOCK_CANDIDATES - nextFrontier.length - remainingItems
          );
          const selectedChildren = children.slice(0, availableSlots);
          const selectedChildrenText = selectedChildren.reduce(
            (sum, child) => sum + child.textLength,
            0
          );
          const retention = selectedChildrenText
            / Math.max(item.textLength, selectedChildrenText, 1);
          const isSequentialContainer = hasDirectReferenceContext(item.element);
          const usefulPartialSequence = isSequentialContainer
            && selectedChildren.length >= MIN_OPTIMIZED_BLOCKS;

          if (
            selectedChildren.length
            && (retention >= DOMINANT_WRAPPER_TEXT_RATIO || usefulPartialSequence)
          ) {
            nextFrontier.push(...selectedChildren);
            changed = true;
            continue;
          }
        }

        settledElements.add(item.element);
        nextFrontier.push(item);
      }

      frontier = nextFrontier;
      if (!changed) break;
    }

    return frontier;
  }

  function hasRiskyPositionedDescendant(element) {
    const possible = element.querySelectorAll(
      "[style*='position' i], [class*='sticky' i], [class*='fixed' i], [class*='absolute' i]"
    );
    const limit = Math.min(possible.length, 16);

    for (let index = 0; index < limit; index += 1) {
      const position = getComputedStyle(possible[index]).position;
      if (position === "fixed" || position === "sticky" || position === "absolute") return true;
    }

    return false;
  }

  function filterAndMeasureSegments(root, segments, rootTextLength) {
    const viewportHeight = Math.max(window.innerHeight || 0, 600);
    const rootRect = root.getBoundingClientRect();
    const rootWidth = Math.max(rootRect.width, 320);
    const rootHeight = Math.max(rootRect.height, 1);

    const measurements = segments.slice(0, MAX_BLOCK_CANDIDATES).map((item) => {
      const atomicInfo = (item.atomicReference === true || isAtomicReferenceList(item.element, root))
        ? atomicReferenceInfo(item.element, root)
        : null;
      return {
        element: item.element,
        textLength: item.textLength,
        atomicReference: Boolean(atomicInfo),
        atomicKind: atomicInfo?.kind || null,
        referenceEntryCount: atomicInfo?.entryCount || 0,
        rect: item.element.getBoundingClientRect()
      };
    });

    const accepted = [];
    const terminalAncestorCache = new WeakMap();

    for (const measurement of measurements) {
      const { element, rect, atomicReference } = measurement;
      if (!element.isConnected) continue;
      if (isStructurallyExcluded(element)) continue;
      if (hasTerminalUnsafeAncestor(element, root, terminalAncestorCache)) continue;
      if (!Number.isFinite(rect.height) || rect.height < 80) continue;
      if (!atomicReference && rect.height > viewportHeight * 5.5) continue;
      if (rect.width < rootWidth * 0.50) continue;

      const style = getComputedStyle(element);
      const parentStyle = element.parentElement ? getComputedStyle(element.parentElement) : null;
      if (style.position === "fixed" || style.position === "sticky" || style.position === "absolute") continue;
      if (style.contentVisibility && style.contentVisibility !== "visible") continue;
      if (style.display === "inline" || style.display === "contents" || style.display.startsWith("table")) continue;
      if (parentStyle && (parentStyle.display === "flex" || parentStyle.display === "inline-flex" || parentStyle.display === "grid" || parentStyle.display === "inline-grid")) continue;
      if (hasRiskyPositionedDescendant(element)) continue;

      accepted.push({
        element,
        textLength: measurement.textLength,
        height: atomicReference
          ? Math.max(80, Math.min(Math.round(rect.height), Math.round(rootHeight)))
          : Math.max(80, Math.min(Math.round(rect.height), Math.round(viewportHeight * 5.5))),
        atomicReference,
        atomicKind: measurement.atomicKind,
        referenceEntryCount: measurement.referenceEntryCount
      });
    }

    let selected = accepted;
    if (accepted.length > MAX_OPTIMIZED_BLOCKS) {
      const atomic = accepted.filter((item) => item.atomicReference);
      if (atomic.length > MAX_OPTIMIZED_BLOCKS) {
        selected = [];
      } else {
        const regularSlots = MAX_OPTIMIZED_BLOCKS - atomic.length;
        const regular = accepted
          .filter((item) => !item.atomicReference)
          .sort((a, b) => {
            const aBenefit = a.textLength / Math.max(rootTextLength, 1) + a.height / rootHeight;
            const bBenefit = b.textLength / Math.max(rootTextLength, 1) + b.height / rootHeight;
            return bBenefit - aBenefit;
          })
          .slice(0, regularSlots);
        selected = [...atomic, ...regular];
      }
    }

    const acceptedText = selected.reduce((sum, item) => sum + item.textLength, 0);
    const acceptedHeight = selected.reduce((sum, item) => sum + item.height, 0);

    return {
      segments: selected,
      textCoverage: Math.min(acceptedText / Math.max(rootTextLength, 1), 1.2),
      heightCoverage: Math.min(acceptedHeight / rootHeight, 1.2)
    };
  }

  function applySegments(segments) {
    if (segments.length < MIN_OPTIMIZED_BLOCKS) return 0;

    for (const item of segments) {
      const element = item.element;
      if (!previousSizes.has(element)) {
        previousSizes.set(element, {
          value: element.style.getPropertyValue(SIZE_PROPERTY),
          priority: element.style.getPropertyPriority(SIZE_PROPERTY)
        });
      }
    }

    for (const item of segments) {
      const element = item.element;
      element.style.setProperty(SIZE_PROPERTY, `${item.height}px`);
      element.setAttribute(BLOCK_ATTRIBUTE, "1");
      element.setAttribute(BLOCK_KIND_ATTRIBUTE, item.atomicKind || "body");
      markedElements.add(element);
    }

    document.documentElement.setAttribute(ROOT_ATTRIBUTE, "on");
    return markedElements.size;
  }

  function currentSiteMode() {
    if (pageOverride === "on" || pageOverride === "off") return pageOverride;
    return settings.siteModes[location.hostname] || "auto";
  }

  function pageMetrics(rootInfo, score) {
    const root = rootInfo.element;
    const rootTextLength = cappedTextLength(root);
    const rootRect = root.getBoundingClientRect();
    const rootHeight = Math.max(rootRect.height, root.scrollHeight || 0);
    const scrollHeight = Math.max(
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0
    );
    const viewportHeight = Math.max(window.innerHeight || 0, 600);
    const paragraphCount = Math.min(root.querySelectorAll("p").length, 500);

    return {
      root,
      score,
      rootTextLength,
      rootHeight,
      scrollHeight,
      viewportHeight,
      paragraphCount
    };
  }

  function isEligible(metrics, mode) {
    const rootViewportPages = metrics.rootHeight / Math.max(metrics.viewportHeight, 1);
    const longAcademic = metrics.score >= 4
      && metrics.rootTextLength >= 12000
      && metrics.rootHeight >= Math.max(7000, metrics.viewportHeight * 7);
    const veryLongArticle = metrics.score >= 2
      && metrics.rootTextLength >= 20000
      && rootViewportPages >= 10
      && metrics.paragraphCount >= 18;
    const genericLongArticle = metrics.rootTextLength >= 30000
      && rootViewportPages >= 15
      && metrics.paragraphCount >= 25;
    const forcedMinimum = metrics.rootTextLength >= 7000
      && rootViewportPages >= 5
      && metrics.paragraphCount >= 8;

    if (mode === "on") return forcedMinimum;
    return longAcademic || veryLongArticle || genericLongArticle;
  }

  async function evaluatePageImpl(reason = "automatic", evaluationEpoch = routeEpoch) {
    if (!isSupportedPage()) {
      clearOptimization();
      setStatus("unsupported", "此页面类型不支持优化");
      return status;
    }

    settings = await getStoredSettings();
    if (evaluationEpoch !== routeEpoch) return status;

    if (pageOverride === "off") {
      clearOptimization();
      setStatus("page-disabled", "当前页面已临时关闭优化");
      return status;
    }

    const mode = currentSiteMode();

    if (!settings.autoEnabled && pageOverride !== "on") {
      clearOptimization();
      setStatus("disabled", "自动优化已关闭");
      return status;
    }

    if (mode === "off") {
      clearOptimization();
      setStatus("site-disabled", "此网站已关闭优化");
      return status;
    }

    if (mode === "auto" && ALWAYS_SKIP_HOSTS.has(location.hostname)) {
      clearOptimization();
      setStatus("app-page", "交互式应用页面不会自动优化");
      return status;
    }

    if (!CSS.supports("content-visibility", "auto") || !CSS.supports("contain-intrinsic-block-size", "auto 300px")) {
      clearOptimization();
      setStatus("unsupported-browser", "当前浏览器不支持所需的渲染功能");
      return status;
    }

    if (markedElements.size) {
      setStatus("active", `已优化 ${markedElements.size} 个内容块`, markedElements.size, status.metrics);
      return status;
    }

    textLengthCache = new WeakMap();
    atomicReferenceCache = new WeakMap();
    atomicReferenceDescendantCache = new WeakMap();
    atomicReferenceEntriesCache = new WeakMap();

    let metrics = null;
    if (
      detectionCache
      && detectionCache.urlKey === normalizedDocumentUrl()
      && detectionCache.metrics.root?.isConnected
    ) {
      metrics = detectionCache.metrics;
    }

    const score = metrics ? metrics.score : semanticScore();
    const rootInfo = metrics ? { element: metrics.root } : selectArticleRoot();

    if (!rootInfo) {
      clearOptimization();
      setStatus("not-article", "未检测到足够完整的文章正文");
      return status;
    }

    if (!metrics) metrics = pageMetrics(rootInfo, score);
    const safeMetrics = {
      score: metrics.score,
      textLength: metrics.rootTextLength,
      rootHeight: Math.round(metrics.rootHeight),
      scrollHeight: metrics.scrollHeight,
      rootViewportPages: Math.round((metrics.rootHeight / Math.max(metrics.viewportHeight, 1)) * 10) / 10,
      paragraphs: metrics.paragraphCount
    };

    if (!isEligible(metrics, mode)) {
      clearOptimization();
      setStatus("too-short", "检测到文章，但长度不足以安全启用", 0, safeMetrics);
      return status;
    }

    const currentRootTextLength = cappedTextLength(metrics.root);
    const structuralSegments = findStructuralSegments(metrics.root, currentRootTextLength);
    if (!structuralSegments.length) {
      clearOptimization();
      setStatus("unsafe-structure", "文章很长，但未找到至少 8 个安全正文分块", 0, safeMetrics);
      return status;
    }

    const structuralTextBasis = Math.max(
      currentRootTextLength,
      structuralSegments.reduce((sum, item) => sum + item.textLength, 0)
    );
    const refinedSegments = refineStructuralSegments(metrics.root, structuralSegments);
    safeMetrics.candidateBlocks = refinedSegments.length;
    const measurement = filterAndMeasureSegments(metrics.root, refinedSegments, structuralTextBasis);
    safeMetrics.textCoverage = Math.round(measurement.textCoverage * 100);
    safeMetrics.heightCoverage = Math.round(measurement.heightCoverage * 100);
    safeMetrics.atomicReferenceBlocks = measurement.segments.filter((item) => item.atomicReference).length;
    safeMetrics.referenceEntries = measurement.segments.reduce(
      (sum, item) => sum + (item.referenceEntryCount || 0),
      0
    );

    if (
      measurement.segments.length < MIN_OPTIMIZED_BLOCKS
      || measurement.textCoverage < 0.55
      || measurement.heightCoverage < 0.45
    ) {
      clearOptimization();
      setStatus("unsafe-structure", "安全分块后的正文覆盖不足", 0, safeMetrics);
      return status;
    }

    clearOptimization();
    const blocks = applySegments(measurement.segments);
    detectionCache = { urlKey: normalizedDocumentUrl(), metrics };
    setStatus("active", `已优化 ${blocks} 个内容块`, blocks, safeMetrics);
    return status;
  }

  function stopRetryObserver() {
    retryObserver?.disconnect();
    retryObserver = null;
    if (retryObserverTimer) clearTimeout(retryObserverTimer);
    if (retryDebounceTimer) clearTimeout(retryDebounceTimer);
    retryObserverTimer = null;
    retryDebounceTimer = null;
  }

  function retryableStatus() {
    return ["not-article", "too-short", "unsafe-structure", "error"].includes(status.code);
  }

  function runHydrationRecheck(delay = HYDRATION_OBSERVER_DEBOUNCE_MS) {
    if (retryDebounceTimer) clearTimeout(retryDebounceTimer);
    retryDebounceTimer = setTimeout(() => {
      retryDebounceTimer = null;
      if (
        !retryObserver
        || !retryableStatus()
        || Date.now() >= retryObserverDeadline
        || retryObserverAttempts >= MAX_HYDRATION_RECHECKS
      ) {
        return;
      }
      retryObserverAttempts += 1;
      detectionCache = null;
      evaluatePage("hydration");
    }, delay);
  }

  function startRetryObserver() {
    if (
      retryObserver
      || !settings.hydrationObserverEnabled
      || !retryableStatus()
      || !document.documentElement
    ) {
      return;
    }

    retryObserverDeadline = Date.now() + HYDRATION_OBSERVER_WINDOW_MS;
    retryObserverAttempts = 0;
    retryObserver = new MutationObserver((records) => {
      if (!retryObserver || !retryableStatus()) return;

      let structuralChanges = 0;
      for (const record of records) {
        for (const node of [...record.addedNodes, ...record.removedNodes]) {
          if (node.nodeType === Node.ELEMENT_NODE) structuralChanges += 1;
        }
        if (structuralChanges >= 4) break;
      }
      if (!structuralChanges) return;

      // Large bursts are commonly caused by translation or hydration. Allow one
      // cooled-down trailing check instead of repeatedly rescanning the page.
      runHydrationRecheck(records.length > 250 ? 2000 : HYDRATION_OBSERVER_DEBOUNCE_MS);
    });
    retryObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    retryObserverTimer = setTimeout(stopRetryObserver, HYDRATION_OBSERVER_WINDOW_MS + 100);
  }

  function reconcileRetryObserver() {
    if (status.code === "active" || !retryableStatus() || !settings.hydrationObserverEnabled) {
      stopRetryObserver();
      return;
    }
    startRetryObserver();
  }

  async function evaluatePage(reason = "automatic") {
    if (evaluationPromise) {
      queuedEvaluationReason = reason;
      return evaluationPromise;
    }

    const evaluationEpoch = routeEpoch;
    const startedAt = performance.now();
    scanPasses += 1;
    const currentEvaluation = evaluatePageImpl(reason, evaluationEpoch);
    evaluationPromise = currentEvaluation;

    try {
      const result = await currentEvaluation;
      if (evaluationEpoch !== routeEpoch) return status;
      const elapsed = Math.max(0, Math.round(performance.now() - startedAt));
      status.metrics = {
        ...(status.metrics || {}),
        detectionMs: elapsed,
        scanPasses,
        trigger: reason
      };
      reconcileRetryObserver();
      return result;
    } finally {
      evaluationPromise = null;
      const trailingReason = queuedEvaluationReason;
      queuedEvaluationReason = null;
      if (trailingReason) {
        setTimeout(() => evaluatePage(trailingReason), 0);
      }
    }
  }

  function scheduleChecks() {
    clearScheduledChecks();
    const generation = ++scheduleGeneration;

    const run = () => {
      if (generation !== scheduleGeneration) return;
      evaluatePage("automatic").catch(() => {
        setStatus("error", "页面检测发生错误");
      });
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 1400 });
    } else {
      const firstTimer = setTimeout(run, 500);
      scheduledTimers.add(firstTimer);
    }

    for (const delay of [2500, 6500]) {
      const timer = setTimeout(() => {
        scheduledTimers.delete(timer);
        run();
      }, delay);
      scheduledTimers.add(timer);
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;

    if (message.type === "getStatus") {
      sendResponse(status);
      return false;
    }

    if (message.type === "forceEnable") {
      pageOverride = "on";
      evaluatePage("manual").then(sendResponse);
      return true;
    }

    if (message.type === "disablePage") {
      pageOverride = "off";
      stopRetryObserver();
      clearOptimization();
      setStatus("page-disabled", "当前页面已临时关闭优化");
      sendResponse(status);
      return false;
    }

    if (message.type === "resetPage") {
      pageOverride = "auto";
      evaluatePage("manual").then(sendResponse);
      return true;
    }

    if (message.type === "recheck") {
      detectionCache = null;
      clearOptimization();
      evaluatePage("manual").then(sendResponse);
      return true;
    }

    return false;
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (
      !changes.autoEnabled
      && !changes.siteModes
      && !changes.hydrationObserverEnabled
      && !changes.referenceOptimizationEnabled
    ) return;

    getStoredSettings().then((nextSettings) => {
      settings = nextSettings;
      if (changes.referenceOptimizationEnabled) {
        detectionCache = null;
        clearOptimization();
      }
      evaluatePage("manual");
    });
  });

  function handleDocumentNavigation() {
    const nextUrlKey = normalizedDocumentUrl();
    if (nextUrlKey === documentUrlKey) return;

    documentUrlKey = nextUrlKey;
    routeEpoch += 1;
    scanPasses = 0;
    stopRetryObserver();
    detectionCache = null;
    pageOverride = "auto";
    clearOptimization();
    setStatus("checking", "正在检测新页面");
    scheduleChecks();
  }

  window.addEventListener("pageshow", scheduleChecks, { once: true });
  window.addEventListener("popstate", () => setTimeout(handleDocumentNavigation, 0));
  window.addEventListener("hashchange", () => setTimeout(handleDocumentNavigation, 0));

  if (window.navigation?.addEventListener) {
    window.navigation.addEventListener("navigatesuccess", handleDocumentNavigation);
    window.navigation.addEventListener("currententrychange", handleDocumentNavigation);
  }

  setInterval(handleDocumentNavigation, 1500);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleChecks, { once: true });
  } else {
    scheduleChecks();
  }
})();
