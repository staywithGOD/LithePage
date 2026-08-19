# LithePage 支持与排障 / Support and Troubleshooting

[中文](#中文) · [English](#english)

## 中文

### 页面没有自动开启

1. 确认当前是 HTML 全文页，而不是 PDF、摘要页或登录墙。
2. 等待页面正文加载完成；初次检测失败后，LithePage 会在最长 12 秒的有界时间内短时重试。
3. 点击“重新检测”。
4. 必要时选择“强制优化此页”。强制模式仍会保留安全门槛。

### 开启后仍然卡

LithePage 只能减少屏幕外布局、绘制和合成压力，无法取消浏览器翻译自身的文本遍历、语言计算或网络时间。请比较弹窗中的块数、覆盖率和检测耗时，并关闭会同时扫描页面的其他扩展做对照。不同网站、文章、浏览器和硬件上的效果会有差异。

### 布局、翻译、锚点或打印异常

立即点击“临时关闭此页”恢复当前 DOM。若需要刷新后重新翻译，请先将当前网站设置为“不在本站开启”，再刷新并执行浏览器翻译。“临时关闭此页”不会在刷新后继续生效。

打印媒体下 LithePage 会自动恢复完整渲染，但仍应在提交或保存 PDF 前检查打印预览。

### 报告问题

建议提供：公开页面网址（如可以）、平台/模板、浏览器和 LithePage 版本、弹窗状态与指标截图、是否启用浏览器翻译、复现步骤。不要粘贴付费论文正文、账号、Cookie 或机构登录信息。

问题入口：[GitHub Issues](https://github.com/staywithGOD/LithePage/issues)

## English

### The page does not activate automatically

1. Confirm that the current page is the full-text HTML article, not a PDF, abstract page, or sign-in wall.
2. Wait for the article body to finish loading. If the initial detection fails, LithePage performs bounded short-term retries for no longer than 12 seconds.
3. Select **“重新检测” (Run detection again)**.
4. If necessary, select **“强制优化此页” (Force an optimization attempt on this page)**. Forced mode still preserves every safety gate.

### The page is still slow after activation

LithePage can only reduce off-screen layout, paint, and compositing pressure. It cannot eliminate the browser translation feature's own text traversal, language processing, or network time. Compare the block count, coverage, and detection time shown in the popup, and test again with other extensions that scan the page disabled. Results vary by website, article, browser, and hardware.

### Layout, translation, anchor, or print problems

Immediately select **“临时关闭此页” (Temporarily disable on this page)** to restore the current DOM. If you need to refresh and translate again, first set the current site to **“不在本站开启” (Never enable on this site)**, then refresh and start browser translation. A temporary page-level disable does not persist after a refresh.

LithePage restores full rendering for print media, but you should still inspect print preview before submitting the document or saving it as a PDF.

### Report a problem

When possible, provide a public page URL, the platform or page template, browser and LithePage versions, a screenshot of the popup status and metrics, whether built-in browser translation was enabled, and reproduction steps. Do not paste paywalled article text, account information, cookies, or institutional sign-in information.

Report issues through [GitHub Issues](https://github.com/staywithGOD/LithePage/issues).
