(() => {
  "use strict";

  const defaults = {
    autoEnabled: true,
    hydrationObserverEnabled: true,
    referenceOptimizationEnabled: true,
    siteModes: {}
  };
  const ids = ["autoEnabled", "hydrationObserverEnabled", "referenceOptimizationEnabled"];
  const saved = document.getElementById("saved");

  function showSaved(message = "设置已保存") {
    saved.textContent = message;
    setTimeout(() => { saved.textContent = ""; }, 1800);
  }

  chrome.storage.local.get(defaults, (settings) => {
    for (const id of ids) document.getElementById(id).checked = settings[id] !== false;
  });

  for (const id of ids) {
    document.getElementById(id).addEventListener("change", (event) => {
      chrome.storage.local.set({ [id]: event.target.checked }, showSaved);
    });
  }

  document.getElementById("clearSiteModes").addEventListener("click", () => {
    chrome.storage.local.set({ siteModes: {} }, () => showSaved("按网站偏好已清除"));
  });
})();
