# LithePage 2.0 发布清单 / Release Checklist

> 每个复选框同时适用于其中文和英文说明。 / Each checkbox applies to both its Chinese and English text.

## 已完成 / Completed

- [x] Manifest V3；
  Manifest V3.
- [x] 单一用途说明；
  Single-purpose statement.
- [x] 唯一扩展 API 权限为 `storage`；另有普通 HTTP/HTTPS 顶层页面访问以执行本地文章检测，无 `tabs`、Cookie、历史、网络拦截或下载权限；
  `storage` is the only extension API permission. Ordinary top-level HTTP/HTTPS access is used for local article detection; the extension does not request `tabs`, cookies, history, network interception, or download permissions.
- [x] 无远程脚本、动态代码执行、广告、分析或外部请求；
  No remote scripts, dynamic code execution, advertising, analytics, or external requests.
- [x] 16/32/48/128 PNG 图标；
  16/32/48/128 PNG icons.
- [x] 1280×800 功能截图；
  1280×800 feature screenshot.
- [x] 440×280 小型宣传图；
  440×280 small promotional tile.
- [x] 1400×560 Marquee 图；
  1400×560 marquee image.
- [x] 中文与英文商店说明；
  Chinese and English store descriptions.
- [x] 隐私政策、权限说明和支持文档草案；
  Draft privacy policy, permissions explanation, and support documentation.
- [x] 旧版设置兼容；
  Compatibility with settings from the previous version.
- [x] Chrome 与 Edge 各 39/39 自动回归，合计 78/78，覆盖旧安全边界、DIV 参考区、晚加载、SPA、打印和关闭恢复；
  Chrome and Edge each passed 39/39 automated regressions, 78/78 combined, covering established safety boundaries, DIV bibliographies, late loading, SPA navigation, printing, and reversible disablement.
- [x] 上传包根目录包含 `manifest.json`。
  The upload package contains `manifest.json` at its root.

## 公开上架前仍需完成 / Required Before Public Release

- [ ] 为隐私政策和支持文档提供公开 HTTPS URL；
  Provide public HTTPS URLs for the privacy policy and support documentation.
- [ ] 填入真实支持邮箱或支持网站；
  Provide a working support email address or support website.
- [ ] 完成目标市场的正式名称/商标可用性检索；
  Complete a formal name and trademark availability search in the target markets.
- [ ] 开发者账号启用两步验证；
  Enable two-factor authentication on the developer accounts.
- [ ] 真实 Chrome Stable 上至少完成 ScienceDirect、RSC、ACS、Springer、Wiley、ASME、AIAA 的 HTML 全文矩阵；
  Complete the HTML full-text matrix for at least ScienceDirect, RSC, ACS, Springer, Wiley, ASME, and AIAA in real Chrome Stable.
- [ ] 真实 Microsoft Edge 上用内置翻译完成同一组 HTML 全文矩阵；
  Complete the same HTML full-text matrix with built-in translation in real Microsoft Edge.
- [ ] 在真实安装后的 Chrome 中补拍至少一张实际论文页 + 弹窗截图；现有 1280×800 图为准确的界面演示素材，不应作为唯一商店截图；
  Capture at least one real article-page-plus-popup screenshot from an installed Chrome build. The existing 1280×800 image is an accurate interface demonstration and must not be the only store screenshot.
- [ ] 在真实安装后的 Edge 中补拍至少一张实际论文页 + 弹窗截图；
  Capture at least one real article-page-plus-popup screenshot from an installed Edge build.
- [ ] 每页抽查正文首/中/末和参考文献首/中/末的翻译完整性；
  On every page, verify translation completeness at the beginning, middle, and end of both the article body and bibliography.
- [ ] A/B 记录 CPU、长任务、翻译完成时间和滚动卡顿，避免商店中填写未经验证的量化承诺；
  Record A/B CPU usage, long tasks, translation completion time, and scrolling responsiveness; do not publish unverified quantitative claims.
- [ ] 检查目录、脚注、锚点、Ctrl+F、公式/浮层、100%/200% 缩放与打印预览；
  Verify the table of contents, footnotes, anchors, Ctrl+F, equations and overlays, 100%/200% zoom, and print preview.
- [ ] 完成键盘导航，并分别进行至少一次 NVDA + Chrome、NVDA + Edge 抽查；
  Complete keyboard-navigation testing and at least one NVDA check in Chrome and one in Edge.
- [ ] 先以 Private 或 Unlisted 分发给可信测试者，再决定公开。
  Distribute privately or as unlisted to trusted testers before deciding on a public release.

## 上传前命令性检查 / Pre-upload Operational Checks

- 解压 ZIP 后确认第一层直接出现 `manifest.json`；
  After extracting the ZIP, confirm that `manifest.json` appears directly at the first level.
- 分别在全新 Chrome 与 Edge 配置中“加载已解压的扩展”；
  Load the unpacked extension in fresh Chrome and Edge profiles.
- 检查扩展详情页无错误；
  Confirm that the extension details page reports no errors.
- 刷新旧标签页后验证弹窗、设置页和站点偏好；
  Refresh existing tabs, then verify the popup, options page, and site preferences.
- 最后确认 ZIP 版本号、商店文案版本和截图一致。
  Finally, confirm that the ZIP version, store copy, and screenshots are consistent.

官方参考 / Official references：[Chrome Prepare](https://developer.chrome.com/docs/webstore/prepare/)、[Chrome Listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)、[Chrome Images](https://developer.chrome.com/docs/webstore/images)、[Chrome Publish](https://developer.chrome.com/docs/webstore/publish)、[Edge Publish](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)。
