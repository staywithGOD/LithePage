# Microsoft Edge 发布说明

LithePage 的 Manifest V3 运行代码同时面向 Chrome 与 Chromium Edge。Microsoft 官方说明 Chrome 扩展 API 与受支持 Manifest 字段可与 Edge 代码兼容；当前项目没有 `update_url`、远程代码或浏览器专属身份/支付 API。

同一运行包可提交到 Microsoft Edge Add-ons，但商店账号、隐私资料、截图和验收记录需要独立准备。

公开发布前必须完成：

- 在 `edge://extensions` 加载解压缩目录并确认无清单错误；
- 使用 Edge 自带翻译验证至少 ScienceDirect、RSC、ACS、Springer、Wiley、ASME 与 AIAA；
- 对每页检查正文与参考文献开头、中部、结尾；
- 对比关闭/开启 LithePage 时的 CPU、长任务、滚动和翻译完成时间；
- 检查锚点、脚注、Ctrl+F、缩放、打印、键盘与 NVDA；
- 补拍真实 Edge 页面与弹窗截图；
- 在 Microsoft Partner Center 填写独立隐私和支持 URL。

官方依据：

- [Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)
- [Manifest file format for extensions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/manifest-format)
- [Publish a Microsoft Edge extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)
