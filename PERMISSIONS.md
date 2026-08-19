# 权限说明 / Permissions

[中文](#中文) · [English](#english)

## 中文

### `storage`

仅在本机保存全局开关、高级检测开关，以及用户主动选择的按网站偏好。保存按网站偏好时会保存主机名；不会保存标题、正文或完整网址。

### 普通网页访问（`http://*/*`、`https://*/*`）

LithePage 需要在普通网页中读取 DOM 结构、文字长度和元素尺寸，才能对未知出版社、独立学会站点、期刊迁移页面及学校代理地址进行同一套结构检测。固定域名白名单会漏掉这些页面，也无法区分同一网站内的全文页、搜索页、登录页和 PDF。

扩展只在顶层 HTML 页面运行，不处理浏览器内部页、扩展页或 PDF，不读取 Cookie、密码或网络请求，也不上传网页内容。

### 明确未请求

`tabs`、`history`、`cookies`、`webRequest`、`downloads`、`scripting`、剪贴板、地理位置和通知权限均未请求。扩展包不含远程可执行代码。

## English

### `storage`

This permission is used only to store global controls, advanced detection controls, and site preferences that the user explicitly selects in browser-local extension storage. A saved site preference includes the hostname; LithePage does not store the page title, article text, or full URL.

### Access to ordinary webpages (`http://*/*`, `https://*/*`)

LithePage must read DOM structure, text length, and element dimensions on ordinary webpages so that the same structural detection can cover unknown publishers, independent society websites, migrated journal pages, and institutional proxy addresses. A fixed domain allowlist would miss these pages and could not distinguish full-text articles, search pages, sign-in pages, and PDFs on the same website.

The extension runs only on top-level HTML pages. It does not process browser-internal pages, extension pages, or PDFs; read cookies, passwords, or network requests; or upload webpage content.

### Explicitly not requested

LithePage does not request `tabs`, `history`, `cookies`, `webRequest`, `downloads`, `scripting`, clipboard, geolocation, or notification permissions. The extension package contains no remotely hosted executable code.
