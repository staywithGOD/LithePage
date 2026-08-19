# LithePage 2.0 测试报告 / Test Report

日期：2026-08-19

## 中文

### Chrome 与 Edge 自动回归：通过

同一套 39 个合成 DOM 场景已分别在本机 Google Chrome 151.0.7922.138 和 Microsoft Edge 151.0.4129.93 中运行，两个通道均为 39/39 通过，合计 **78/78**。测试在真实浏览器渲染引擎中加载合成页面并注入内容脚本，同时模拟必要的扩展 API；这不等同于加载完整扩展或调用浏览器自带翻译。覆盖：

- 长论文启用、特定正文根优先、短页/应用页/PDF 安全退出；
- 8/150 块边界、正文覆盖率、单一 wrapper、多层混合细分；
- fixed/sticky/absolute、已有 content-visibility、dialog/iframe/表单等风险拒绝；
- 超长 OL/UL 参考文献原子化及 11 类正负边界；
- 同构 DIV 参考文献原子化、Related references 否决、末条按钮/绝对定位/已有 containment 否决；
- 延迟加载正文的有界观察与合并重检；
- SPA `pushState`/`replaceState` 清理、重新检测及当前页偏好重置；
- 翻译式纯文本 mutation 不触发重新扫描；
- 旧版 `autoEnabled` 和 `siteModes` 设置兼容；
- 大型安全 DOM 初检预算、关闭恢复和打印恢复；
- MV3、2.0.0 版本、最小权限、本地图标、无远程脚本/网络客户端/动态代码执行。

统一执行器：`tests/run-all-regressions.cjs`。

### 真实 Chrome 只读结构核对：完成

当前已打开的真实页面基线：

- RSC HTML 全文：旧版处于 Active，150 块，页面已翻译；目标参考容器为 281 个直接 DIV、约 47,356 字符、约 23,110 px 高、10,528 个后代、抽样引文证据 100%、无表单控件或定位后代。旧版的 98 个子块已有 containment；刷新并加载 2.0 后，新规则预计把该参考容器识别为单个 `reference-div` 原子块。该预期尚未通过真实 v2 安装实测。
- ScienceDirect HTML 全文：旧版处于 Active，29 块。

以上操作仅读取结构与数量，没有读取 Cookie、机构凭据或发送论文内容。

### 尚未完成的公开发布硬门槛

自动回归不能证明 Chrome 或 Edge 自带翻译在所有真实模板上的完整性，也不能证明实际 CPU 或卡顿改善。公开上架前仍需：

- 在真实 Chrome Stable 与 Microsoft Edge 安装 2.0 候选版；
- 核对 ScienceDirect、RSC、ACS、Springer、Wiley、ASME、AIAA；
- 每页比较正文首/中/末和参考文献首/中/末；
- A/B 记录 CPU、主线程长任务、翻译完成时间与滚动帧时间；
- 核对锚点、脚注、Ctrl+F、缩放、打印和 NVDA/键盘导航。

因此本版本状态是：**Chrome 与 Edge 代码级兼容和合成回归已通过，可进入两个浏览器的真实站点候选验收；尚不应宣称“兼容所有文章”或“已证明消除卡顿”。**

## English

Date: 2026-08-19

### Chrome and Edge automated regressions: passed

The same 39 synthetic DOM scenarios ran in local Google Chrome 151.0.7922.138 and Microsoft Edge 151.0.4129.93. Each channel passed 39/39 scenarios, for a combined **78/78**. These tests load synthetic pages in the real browser rendering engines, inject the content script, and mock the required extension APIs; they do not load the complete extension or invoke either browser's built-in translation. Coverage includes:

- activation on long papers, preference for a specific article root, and safe exit on short pages, app pages, and PDF-like URLs;
- the 8/150 block boundaries, text coverage, single-wrapper layouts, and mixed-depth refinement;
- rejection of fixed, sticky, and absolute positioning, existing `content-visibility`, dialogs, iframes, and forms;
- atomic handling of very long OL/UL bibliographies and 11 positive/negative boundary cases;
- atomic handling of structurally consistent DIV bibliographies, rejection of Related references, and rejection of trailing buttons, absolute positioning, or existing containment;
- bounded observation and coalesced rechecks for late-loaded article content;
- cleanup and re-evaluation after SPA `pushState` and `replaceState` navigation, including reset of page-level preferences;
- protection against rescans caused by translation-like text-only mutations;
- compatibility with legacy `autoEnabled` and `siteModes` settings;
- initial-detection budgeting on a large safe DOM, reversible disablement, and print restoration; and
- Manifest V3, version 2.0.0, least privilege, local icons, and absence of remote scripts, network clients, or dynamic code execution.

Unified runner: `tests/run-all-regressions.cjs`.

### Read-only inspection of real Chrome page structure: completed

Baseline observations from pages that were already open:

- RSC HTML full text: the previous version was Active with 150 blocks and the page was translated. The target reference container had 281 direct DIV children, approximately 47,356 characters, approximately 23,110 px of height, 10,528 descendants, 100% sampled citation evidence, and no form controls or positioned descendants. Ninety-eight child blocks already had containment from the previous version. After a refresh with 2.0 loaded, the new rule is expected to recognize this container as one `reference-div` atomic block. This expectation has not yet been verified with a real v2 installation.
- ScienceDirect HTML full text: the previous version was Active with 29 blocks.

These inspections read only page structure and counts. They did not read cookies or institutional credentials, and no article content was transmitted.

### Outstanding hard gates before public store release

Automated regressions cannot establish the completeness of Chrome or Edge built-in translation across real publisher templates, nor can they establish actual CPU or responsiveness improvements. Before public release:

- install the 2.0 candidate in real Chrome Stable and Microsoft Edge;
- validate ScienceDirect, RSC, ACS, Springer, Wiley, ASME, and AIAA;
- compare the beginning, middle, and end of both the article body and bibliography on every page;
- record A/B CPU usage, main-thread long tasks, translation completion time, and scroll-frame timing; and
- verify anchors, footnotes, Ctrl+F, zoom, printing, and NVDA/keyboard navigation.

Release status: **code-level Chrome/Edge compatibility and synthetic regressions have passed. The build may proceed to real-site candidate validation in both browsers, but it must not yet claim compatibility with every article or proven elimination of lag.**
