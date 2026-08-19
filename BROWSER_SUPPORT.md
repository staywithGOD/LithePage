# 浏览器兼容性

LithePage 以 Manifest V3 和 Chromium 扩展 API 构建，正式支持：

- Google Chrome 109+；
- Microsoft Edge 109+。

Chrome 与 Edge 使用同一套运行源码。扩展调用的 `chrome.storage`、`chrome.tabs`、`chrome.runtime` 和内容脚本机制均属于 Edge Chromium 支持的扩展 API；`minimum_chrome_version` 也是 Microsoft Edge 官方清单支持的 Manifest 字段。

## 本地安装

### Chrome

1. 打开 `chrome://extensions`；
2. 开启“开发者模式”；
3. 选择“加载已解压的扩展”，并选择 LithePage 源码目录。

### Edge

1. 打开 `edge://extensions`；
2. 开启“开发人员模式”；
3. 选择“加载解压缩的扩展”，并选择同一个 LithePage 源码目录。

## 功能边界

LithePage 不提供翻译服务。Chrome 与 Edge 会分别使用各自的内置网页翻译；LithePage 只优化翻译期间的页面布局、绘制和合成压力。因此同一文章在两个浏览器上的翻译时间与完整性可能不同，发布前必须分别抽查正文和参考文献的开头、中部与结尾。

PDF、浏览器内部页、iframe 阅读器、canvas 阅读器、Shadow DOM 内全文以及部分高度交互式页面不受支持。

## 官方兼容性依据

- [Microsoft：Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)
- [Microsoft：Manifest file format for extensions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/manifest-format)
- [Chrome：Manifest file format](https://developer.chrome.com/docs/extensions/mv3/manifest)
