# Chrome Web Store Privacy 表填写建议 / Privacy Form Guidance

## 中文

### 单一用途

在用户浏览超长学术 HTML 页面时，本地分析页面结构并应用可撤销的屏幕外渲染优化；翻译仍由 Chrome 自带网页翻译完成。

### 权限说明

#### Website access

扩展需要在普通 HTTP/HTTPS 页面上读取当前页面的 DOM 结构、文本长度和元素尺寸，才能识别未知出版社、学校代理地址及新期刊页面，并只在符合条件的长篇文章上应用 CSS。它不读取 Cookie、密码或表单输入，也不处理 PDF、Chrome 内部页或扩展页。

#### storage

仅用于在本机保存全局开关、高级检测开关，以及用户主动设置的按网站偏好。保存内容为设置值和对应网站主机名，不保存论文标题、正文或完整页面网址。

### 数据类型披露

建议保守披露本地处理：

- Website content：是，仅在本机瞬时读取结构、文字长度和尺寸；
- Web browsing activity/current site：是，仅用当前主机名读取或保存用户主动设置的站点偏好；
- Personally identifiable information、authentication information、financial information、health information、location：否。

所有数据均不出售、不共享、不用于广告、画像、信用评估或与单一用途无关的目的。完整隐私政策需在公开发布前托管到 HTTPS URL。

官方填写依据：[Privacy practices](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)、[User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)、[User Data Policy](https://developer.chrome.com/docs/webstore/user_data)。

## English

### Single purpose

When a user views a long academic HTML page, LithePage analyzes the page structure locally and applies reversible off-screen rendering optimizations. Chrome's built-in page translation continues to handle translation.

### Permission justification

#### Website access

The extension must read the DOM structure, text length, and element dimensions on ordinary HTTP/HTTPS pages so it can recognize previously unknown publishers, institutional proxy addresses, and new journal templates, and apply CSS only to qualifying long-form articles. It does not read cookies, passwords, or form input, and it does not process PDFs, Chrome internal pages, or extension pages.

#### `storage`

This permission is used only to save the global switch, advanced detection switches, and site preferences explicitly chosen by the user. Stored values consist of settings and the corresponding website hostname; article titles, article text, and complete page URLs are not stored.

### Data-type disclosure

Use the following conservative disclosure for local processing:

- Website content: **Yes**. Structure, text length, and dimensions are read transiently on the user's device.
- Web browsing activity/current site: **Yes**. The current hostname is used only to read or save a site preference explicitly chosen by the user.
- Personally identifiable information, authentication information, financial information, health information, and location: **No**.

Data is not sold or shared and is not used for advertising, profiling, credit assessment, or any purpose unrelated to the extension's single purpose. Before public release, the complete privacy policy must be hosted at a publicly accessible HTTPS URL.

Official references: [Privacy practices](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/), [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), and [User Data Policy](https://developer.chrome.com/docs/webstore/user_data).
