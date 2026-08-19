# Changelog / 更新日志

## 2.0.0 — 2026-08-19

### 中文

- 产品更名为 LithePage，并加入正式图标、状态徽章、设置页和本地化清单。
- 新增严格的同构 DIV/P 超长参考文献识别。
- 新增有界延迟加载观察与 SPA 路由重新检测。
- 弹窗增加覆盖率、检测耗时和参考条目指标。
- 补充隐私、权限、支持、商店上架和发布检查材料。
- 同一套 Manifest V3 运行代码支持 Chrome 与 Microsoft Edge，并在两个浏览器通道完成 78 项合成回归。
- 唯一扩展 API 权限为 `storage`；保留普通 HTTP/HTTPS 顶层页面访问以执行本地文章检测，无远程代码或外部请求。

### English

- Renamed the product to LithePage and added production icons, status badges, an options page, and localized manifest metadata.
- Added strict detection for long, structurally consistent DIV/P bibliographies.
- Added bounded late-load observation and SPA route re-evaluation.
- Added popup metrics for coverage, detection time, and bibliography entry counts.
- Added privacy, permissions, support, store-submission, and release-check documentation.
- Shipped one Manifest V3 runtime for Google Chrome and Microsoft Edge, with 78 synthetic regression executions across the two browser channels.
- Kept `storage` as the only extension API permission; ordinary top-level HTTP/HTTPS access remains necessary for local article detection, with no remote code or external requests.

## 1.2.0

### 中文

- 新增严格识别的超长 OL/UL 参考文献原子块。
- 改进单一 wrapper、混合深度结构及 8–150 块边界。

### English

- Added strict atomic-block detection for very long OL/UL bibliographies.
- Improved single-wrapper and mixed-depth segmentation while preserving the 8–150 block boundary.
