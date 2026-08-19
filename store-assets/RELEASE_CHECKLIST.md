# LithePage 2.0 发布清单

## 已完成

- [x] Manifest V3；
- [x] 单一用途说明；
- [x] 唯一扩展 API 权限为 `storage`；另有普通 HTTP/HTTPS 顶层页面访问以执行本地文章检测，无 `tabs`、Cookie、历史、网络拦截或下载权限；
- [x] 无远程脚本、动态代码执行、广告、分析或外部请求；
- [x] 16/32/48/128 PNG 图标；
- [x] 1280×800 功能截图；
- [x] 440×280 小型宣传图；
- [x] 1400×560 Marquee 图；
- [x] 中文与英文商店说明；
- [x] 隐私政策、权限说明和支持文档草案；
- [x] 旧版设置兼容；
- [x] Chrome 与 Edge 各 39/39 自动回归，合计 78/78，覆盖旧安全边界、DIV 参考区、晚加载、SPA、打印和关闭恢复；
- [x] 上传包根目录包含 `manifest.json`。

## 公开上架前仍需完成

- [ ] 为隐私政策和支持文档提供公开 HTTPS URL；
- [ ] 填入真实支持邮箱或支持网站；
- [ ] 完成目标市场的正式名称/商标可用性检索；
- [ ] 开发者账号启用两步验证；
- [ ] 真实 Chrome Stable 上至少完成 ScienceDirect、RSC、ACS、Springer、Wiley、ASME、AIAA 的 HTML 全文矩阵；
- [ ] 真实 Microsoft Edge 上用内置翻译完成同一组 HTML 全文矩阵；
- [ ] 在真实安装后的 Chrome 中补拍至少一张实际论文页 + 弹窗截图；现有 1280×800 图为准确的界面演示素材，不应作为唯一商店截图；
- [ ] 在真实安装后的 Edge 中补拍至少一张实际论文页 + 弹窗截图；
- [ ] 每页抽查正文首/中/末和参考文献首/中/末的翻译完整性；
- [ ] A/B 记录 CPU、长任务、翻译完成时间和滚动卡顿，避免商店中填写未经验证的量化承诺；
- [ ] 检查目录、脚注、锚点、Ctrl+F、公式/浮层、100%/200% 缩放与打印预览；
- [ ] 完成键盘导航，并分别进行至少一次 NVDA + Chrome、NVDA + Edge 抽查；
- [ ] 先以 Private 或 Unlisted 分发给可信测试者，再决定公开。

## 上传前命令性检查

- 解压 ZIP 后确认第一层直接出现 `manifest.json`；
- 分别在全新 Chrome 与 Edge 配置中“加载已解压的扩展”；
- 检查扩展详情页无错误；
- 刷新旧标签页后验证弹窗、设置页和站点偏好；
- 最后确认 ZIP 版本号、商店文案版本和截图一致。

官方参考：[Chrome Prepare](https://developer.chrome.com/docs/webstore/prepare/)、[Chrome Listing](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)、[Chrome Images](https://developer.chrome.com/docs/webstore/images)、[Chrome Publish](https://developer.chrome.com/docs/webstore/publish)、[Edge Publish](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)。
