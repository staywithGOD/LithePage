(() => {
  "use strict";

  const DEFAULT_SETTINGS = {
    autoEnabled: true,
    hydrationObserverEnabled: true,
    referenceOptimizationEnabled: true,
    siteModes: {}
  };

  const elements = {
    autoEnabled: document.getElementById("autoEnabled"),
    hydrationObserverEnabled: document.getElementById("hydrationObserverEnabled"),
    referenceOptimizationEnabled: document.getElementById("referenceOptimizationEnabled"),
    siteMode: document.getElementById("siteMode"),
    currentHost: document.getElementById("currentHost"),
    statusDot: document.getElementById("statusDot"),
    statusTitle: document.getElementById("statusTitle"),
    statusDetail: document.getElementById("statusDetail"),
    recheck: document.getElementById("recheck"),
    pageToggle: document.getElementById("pageToggle"),
    metricsCard: document.getElementById("metricsCard"),
    metricBlocks: document.getElementById("metricBlocks"),
    metricCoverage: document.getElementById("metricCoverage"),
    metricTime: document.getElementById("metricTime"),
    metricReferences: document.getElementById("metricReferences"),
    openOptions: document.getElementById("openOptions")
  };

  let activeTabId = null;
  let currentStatus = null;
  let currentHost = "";
  let settings = { ...DEFAULT_SETTINGS, siteModes: {} };

  function getSettings() {
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

  function saveSettings(next) {
    settings = next;
    return chrome.storage.local.set(next);
  }

  function getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  }

  function sendMessage(type) {
    return new Promise((resolve) => {
      if (!activeTabId) {
        resolve(null);
        return;
      }

      chrome.tabs.sendMessage(activeTabId, { type }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(response || null);
      });
    });
  }

  function statusPresentation(status) {
    if (!status) {
      return {
        tone: "off",
        title: "此页面无法使用",
        detail: "PDF、浏览器设置页和扩展页面不受支持。"
      };
    }

    if (status.code === "active") {
      return {
        tone: "active",
        title: "流畅模式已开启",
        detail: `${status.blocks} 个正文内容块正在按需渲染。`
      };
    }

    if (["too-short", "not-article", "unsafe-structure", "app-page"].includes(status.code)) {
      return {
        tone: "warning",
        title: "当前页面未自动开启",
        detail: status.message
      };
    }

    if (["disabled", "site-disabled", "page-disabled"].includes(status.code)) {
      return {
        tone: "off",
        title: "流畅模式已关闭",
        detail: status.message
      };
    }

    if (status.code === "checking") {
      return {
        tone: "checking",
        title: "正在检查当前页面",
        detail: "检测文章长度和页面结构…"
      };
    }

    return {
      tone: "warning",
      title: "当前页面未启用",
      detail: status.message || "页面不符合自动优化条件。"
    };
  }

  function renderStatus(status) {
    currentStatus = status;
    currentHost = status?.host || "";

    const view = statusPresentation(status);
    elements.statusDot.className = `status-dot ${view.tone}`;
    elements.statusTitle.textContent = view.title;
    elements.statusDetail.textContent = view.detail;
    elements.currentHost.textContent = currentHost || "不支持的页面";

    elements.siteMode.disabled = !currentHost;
    elements.recheck.disabled = !status;
    elements.pageToggle.disabled = !status;

    if (currentHost) {
      elements.siteMode.value = settings.siteModes[currentHost] || "auto";
    }

    if (status?.code === "active") {
      elements.pageToggle.textContent = "临时关闭此页";
      elements.pageToggle.classList.remove("primary");
    } else if (status?.code === "page-disabled") {
      elements.pageToggle.textContent = "恢复自动判断";
      elements.pageToggle.classList.add("primary");
    } else {
      elements.pageToggle.textContent = "强制优化此页";
      elements.pageToggle.classList.add("primary");
    }

    const metrics = status?.metrics || null;
    elements.metricsCard.hidden = !metrics;
    if (metrics) {
      elements.metricBlocks.textContent = String(status.blocks || metrics.candidateBlocks || 0);
      elements.metricCoverage.textContent = Number.isFinite(metrics.textCoverage)
        ? `${metrics.textCoverage}%`
        : "—";
      elements.metricTime.textContent = Number.isFinite(metrics.detectionMs)
        ? `${metrics.detectionMs} ms`
        : "—";
      elements.metricReferences.textContent = metrics.referenceEntries
        ? String(metrics.referenceEntries)
        : metrics.atomicReferenceBlocks
          ? `${metrics.atomicReferenceBlocks} 区`
          : "0";
    }
  }

  async function refreshStatus() {
    renderStatus(await sendMessage("getStatus"));
  }

  elements.autoEnabled.addEventListener("change", async () => {
    await saveSettings({
      ...settings,
      autoEnabled: elements.autoEnabled.checked
    });
    setTimeout(refreshStatus, 120);
  });

  for (const key of ["hydrationObserverEnabled", "referenceOptimizationEnabled"]) {
    elements[key].addEventListener("change", async () => {
      await saveSettings({ ...settings, [key]: elements[key].checked });
      setTimeout(refreshStatus, 120);
    });
  }

  elements.siteMode.addEventListener("change", async () => {
    if (!currentHost) return;

    const siteModes = { ...settings.siteModes };
    const mode = elements.siteMode.value;
    if (mode === "auto") delete siteModes[currentHost];
    else siteModes[currentHost] = mode;

    await saveSettings({ ...settings, siteModes });
    setTimeout(refreshStatus, 120);
  });

  elements.recheck.addEventListener("click", async () => {
    elements.recheck.disabled = true;
    renderStatus(await sendMessage("recheck"));
    elements.recheck.disabled = false;
  });

  elements.pageToggle.addEventListener("click", async () => {
    let type = "forceEnable";
    if (currentStatus?.code === "active") type = "disablePage";
    else if (currentStatus?.code === "page-disabled") type = "resetPage";
    renderStatus(await sendMessage(type));
  });

  elements.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

  (async () => {
    settings = await getSettings();
    elements.autoEnabled.checked = settings.autoEnabled;
    elements.hydrationObserverEnabled.checked = settings.hydrationObserverEnabled;
    elements.referenceOptimizationEnabled.checked = settings.referenceOptimizationEnabled;

    const tab = await getActiveTab();
    activeTabId = tab?.id || null;
    await refreshStatus();
  })();
})();
