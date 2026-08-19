# Microsoft Edge Add-ons 隐私披露建议

## 单一用途

在用户浏览超长学术 HTML 页面时，本地分析页面结构并应用可撤销的屏幕外渲染优化；翻译仍由 Microsoft Edge 自带网页翻译完成。

## 网站访问说明

扩展需要在普通 HTTP/HTTPS 顶层页面读取当前页面的 DOM 结构、文本长度和元素尺寸，才能识别未知出版社、学校代理地址及新期刊页面，并只在符合条件的长篇文章上应用 CSS。它不读取 Cookie、密码或表单输入，也不处理 PDF、Edge 内部页或扩展页。

## `storage` 权限

仅用于在本机保存全局开关、高级检测开关，以及用户主动设置的按网站偏好。保存内容为设置值和对应网站主机名，不保存论文标题、正文或完整页面网址。

## 数据处理声明

- 网页结构、文字长度和元素尺寸只在本机瞬时处理；
- 当前网站主机名只用于读取或保存用户主动设置的站点偏好；
- 不收集身份、认证、财务、健康或精确位置数据；
- 不出售、不共享、不用于广告、画像、信用评估或与单一用途无关的目的；
- 无广告、分析服务、账户系统、远程代码或开发者服务器通信。

公开提交前，应在 Microsoft Partner Center 中如实填写隐私与权限信息，并提供公开可访问的 HTTPS 隐私政策和支持地址。完整隐私政策正文见仓库根目录 `PRIVACY.md`。

官方参考：[Publish a Microsoft Edge extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)、[Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)。
