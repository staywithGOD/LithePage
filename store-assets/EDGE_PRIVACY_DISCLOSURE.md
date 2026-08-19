# Microsoft Edge Add-ons 隐私披露建议 / Privacy Disclosure Guidance

## 中文

### 单一用途

在用户浏览超长学术 HTML 页面时，本地分析页面结构并应用可撤销的屏幕外渲染优化；翻译仍由 Microsoft Edge 自带网页翻译完成。

### 网站访问说明

扩展需要在普通 HTTP/HTTPS 顶层页面读取当前页面的 DOM 结构、文本长度和元素尺寸，才能识别未知出版社、学校代理地址及新期刊页面，并只在符合条件的长篇文章上应用 CSS。它不读取 Cookie、密码或表单输入，也不处理 PDF、Edge 内部页或扩展页。

### `storage` 权限

仅用于在本机保存全局开关、高级检测开关，以及用户主动设置的按网站偏好。保存内容为设置值和对应网站主机名，不保存论文标题、正文或完整页面网址。

### 数据处理声明

- 网页结构、文字长度和元素尺寸只在本机瞬时处理；
- 当前网站主机名只用于读取或保存用户主动设置的站点偏好；
- 不收集身份、认证、财务、健康或精确位置数据；
- 不出售、不共享、不用于广告、画像、信用评估或与单一用途无关的目的；
- 无广告、分析服务、账户系统、远程代码或开发者服务器通信。

公开提交前，应在 Microsoft Partner Center 中如实填写隐私与权限信息，并提供公开可访问的 HTTPS 隐私政策和支持地址。完整隐私政策正文见仓库根目录 `PRIVACY.md`。

官方参考：[Publish a Microsoft Edge extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)、[Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)。

## English

### Single purpose

When a user views a long academic HTML page, LithePage analyzes the page structure locally and applies reversible off-screen rendering optimizations. Microsoft Edge's built-in page translation continues to handle translation.

### Website-access justification

The extension must read the DOM structure, text length, and element dimensions on ordinary top-level HTTP/HTTPS pages so it can recognize previously unknown publishers, institutional proxy addresses, and new journal templates, and apply CSS only to qualifying long-form articles. It does not read cookies, passwords, or form input, and it does not process PDFs, Edge internal pages, or extension pages.

### `storage` permission

This permission is used only to save the global switch, advanced detection switches, and site preferences explicitly chosen by the user. Stored values consist of settings and the corresponding website hostname; article titles, article text, and complete page URLs are not stored.

### Data-processing declaration

- Page structure, text length, and element dimensions are processed transiently on the user's device.
- The current website hostname is used only to read or save a site preference explicitly chosen by the user.
- Identity, authentication, financial, health, and precise-location data are not collected.
- Data is not sold or shared and is not used for advertising, profiling, credit assessment, or any purpose unrelated to the extension's single purpose.
- The extension contains no advertising, analytics service, account system, remote code, or developer-server communication.

Before public submission, complete the privacy and permissions disclosures accurately in Microsoft Partner Center and provide publicly accessible HTTPS privacy-policy and support URLs. The complete privacy policy is in the repository-root `PRIVACY.md`.

Official references: [Publish a Microsoft Edge extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension) and [Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension).
