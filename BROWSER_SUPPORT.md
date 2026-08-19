# LithePage 浏览器兼容性 / Browser Compatibility

语言 / Language: [中文](#中文) · [English](#english)

<a id="中文"></a>
## 中文

LithePage 以 Manifest V3 和 Chromium 扩展 API 构建，目标兼容：

- Google Chrome 109+；
- Microsoft Edge 109+。

Chrome 与 Edge 使用同一套运行源码。扩展调用的 `chrome.storage`、`chrome.tabs`、`chrome.runtime` 和内容脚本机制均属于 Chromium Edge 支持的扩展 API；`minimum_chrome_version` 也是 Microsoft Edge 官方清单支持的 Manifest 字段。

### 本地安装

#### Chrome

1. 打开 `chrome://extensions`；
2. 开启“开发者模式”；
3. 选择“加载已解压的扩展”，并选择 LithePage 源码目录。

#### Edge

1. 打开 `edge://extensions`；
2. 开启“开发人员模式”；
3. 选择“加载解压缩的扩展”，并选择同一个 LithePage 源码目录。

### 验证状态

同一套 39 个合成 DOM 场景已分别在 Chrome 与 Edge 通道运行，两个通道均通过。它们验证核心算法在两个 Chromium 浏览器中的代码级行为，但不等于已经完成所有真实出版社页面、内置翻译、CPU/滚动性能或无障碍验收。公开上架前仍需分别完成真实浏览器矩阵；详见 [TEST_REPORT.md](TEST_REPORT.md) 和 [发布清单](store-assets/RELEASE_CHECKLIST.md)。

### 功能边界

LithePage 不提供翻译服务。Chrome 与 Edge 会分别使用各自的内置网页翻译；LithePage 只优化翻译期间的页面布局、绘制和合成压力。因此，同一文章在两个浏览器上的翻译时间与完整性可能不同，首次在新平台使用时必须分别抽查正文和参考文献的开头、中部与结尾。

PDF、浏览器内部页面、iframe 阅读器、canvas 阅读器、Shadow DOM 内全文以及部分高度交互式页面不受支持。

### 官方兼容性依据

- [Microsoft：Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)
- [Microsoft：Manifest file format for extensions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/manifest-format)
- [Chrome：Manifest file format](https://developer.chrome.com/docs/extensions/mv3/manifest)

<a id="english"></a>
## English

LithePage is built with Manifest V3 and Chromium extension APIs and targets compatibility with:

- Google Chrome 109+;
- Microsoft Edge 109+.

Chrome and Edge use the same runtime source. The extension relies on `chrome.storage`, `chrome.tabs`, `chrome.runtime`, and content-script mechanisms supported by Chromium Edge. `minimum_chrome_version` is also a Manifest field documented as supported by Microsoft Edge.

### Local installation

#### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose the LithePage source directory.

#### Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose the same LithePage source directory.

### Validation status

The same 39 synthetic DOM scenarios have run successfully in both the Chrome and Edge channels. These runs validate code-level behavior of the core algorithm in both Chromium browsers, but they do not constitute complete acceptance testing for every real publisher page, built-in translation, CPU or scrolling performance, or accessibility. Separate real-browser matrices remain required before a public store release. See [TEST_REPORT.md](TEST_REPORT.md) and the [release checklist](store-assets/RELEASE_CHECKLIST.md).

### Functional boundaries

LithePage does not provide a translation service. Chrome and Edge use their own built-in page translators; LithePage only reduces avoidable layout, painting, and compositing pressure during translation. Translation time and completeness can therefore differ between browsers for the same article. On a new platform, verify the beginning, middle, and end of both the article and its bibliography.

PDF files, internal browser pages, iframe readers, canvas readers, full text inside Shadow DOM, and some highly interactive pages are not supported.

### Official compatibility references

- [Microsoft: Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)
- [Microsoft: Manifest file format for extensions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/manifest-format)
- [Chrome: Manifest file format](https://developer.chrome.com/docs/extensions/mv3/manifest)
