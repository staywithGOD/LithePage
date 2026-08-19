# Chrome Web Store Privacy 表填写建议

## 单一用途

在用户浏览超长学术 HTML 页面时，本地分析页面结构并应用可撤销的屏幕外渲染优化；翻译仍由 Chrome 自带网页翻译完成。

## 权限说明

### Website access

扩展需要在普通 HTTP/HTTPS 页面上读取当前页面的 DOM 结构、文本长度和元素尺寸，才能识别未知出版社、学校代理地址及新期刊页面，并只在符合条件的长篇文章上应用 CSS。它不读取 Cookie、密码或表单输入，也不处理 PDF、Chrome 内部页或扩展页。

### storage

仅用于在本机保存全局开关、高级检测开关，以及用户主动设置的按网站偏好。保存内容为设置值和对应网站主机名，不保存论文标题、正文或完整页面网址。

## 数据类型披露

建议保守披露本地处理：

- Website content：是，仅在本机瞬时读取结构、文字长度和尺寸；
- Web browsing activity/current site：是，仅用当前主机名读取或保存用户主动设置的站点偏好；
- Personally identifiable information、authentication information、financial information、health information、location：否。

所有数据均不出售、不共享、不用于广告、画像、信用评估或与单一用途无关的目的。完整隐私政策需在公开发布前托管到 HTTPS URL。

官方填写依据：[Privacy practices](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)、[User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)、[User Data Policy](https://developer.chrome.com/docs/webstore/user_data)。
