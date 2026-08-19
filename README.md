# LithePage 2.0

LithePage 是面向超长学术 HTML 页面的本地渲染优化扩展，同时支持 Google Chrome 与 Microsoft Edge。它智能延后屏幕外正文的布局和绘制；翻译仍由浏览器自带网页翻译完成。

![LithePage 界面演示](store-assets/screenshot-1280x800.png)

> 上图使用合成学术内容展示扩展界面，不包含真实用户数据或受限论文正文。

## 使用

1. 打开论文的 HTML 全文页，等待 LithePage 自动检测。
2. 点击工具栏图标确认显示“流畅模式已开启”。
3. 再使用 Chrome 或 Edge 的“翻译成中文”。
4. 若页面布局或翻译异常，将“当前网站”设为“不在本站开启”，再刷新页面并重新翻译。“临时关闭此页”只在本次页面生命周期内有效。

旧标签页在扩展升级后需要刷新一次。PDF、浏览器内部页面、iframe 阅读器、canvas 阅读器、Shadow DOM 内的全文和部分高度交互式页面不受支持。

## 浏览器支持

- Google Chrome 109 或更高版本；
- Microsoft Edge 109 或更高版本；
- 两个浏览器使用同一套 Manifest V3 源码与权限，分别在 `chrome://extensions` 和 `edge://extensions` 中加载此目录即可。

LithePage 不调用翻译服务，也不依赖 Google 或 Microsoft 的翻译接口，因此 Chrome 与 Edge 的差异只在各自浏览器自带翻译的实际行为。发布前仍需分别完成真实浏览器验收，详见 [BROWSER_SUPPORT.md](BROWSER_SUPPORT.md)。

## 工作原理

浏览器翻译长论文时会修改大量文本节点，可能触发屏幕外内容反复布局、绘制和合成。LithePage 从学术元数据、正文结构、文字量及几何尺寸中识别长篇文章，只给 8–150 个通过安全检查且互不嵌套的正文块设置：

```css
content-visibility: auto;
contain-intrinsic-block-size: auto <实测高度>;
```

正文不足够长、安全分块覆盖不足，或结构风险过高时，扩展保持关闭。强制尝试也不会绕过定位、交互、覆盖率和块数安全门槛。

## 2.0 新增

- 支持严格识别的 `OL/UL` 与同构 `DIV/P` 超长参考文献结构；
- 失败后最多 12 秒的有界延迟加载检测，启用后立即停止；
- SPA 页面导航自动清理旧标记并重新判断；
- 弹窗显示块数、文本覆盖率、检测耗时和参考条目数；
- 本地设置页、双语清单、正式图标和商店材料；
- 保留 1.2 的关闭/恢复、打印恢复和按网站偏好。

## 边界

LithePage 优化浏览器渲染链，不会减少浏览器翻译服务本身的语言计算、网络请求或 DOM 文本修改，所以不同文章与设备的收益会有差异。扩展不删除正文，也不设置 `translate=no`；但浏览器对离屏文本的内部翻译遍历不是公开扩展 API 契约。首次在新平台使用时，请抽查正文与参考文献的开头、中部和结尾。

## 隐私

所有检测均在本机完成。扩展没有广告、分析、远程代码或开发者服务器通信，不上传或保存论文正文。浏览器本地扩展存储仅保存开关及用户主动设置的站点主机名偏好。详见 [PRIVACY.md](PRIVACY.md)。

## 开发与发布状态

2.0.0 的 39 个合成 DOM 场景已分别在 Chrome 与 Edge 运行，合计 78/78 通过。自动测试不能替代浏览器自带翻译完整性、真实 CPU/卡顿、锚点、打印和无障碍验证。公开上架前请完成 [发布清单](store-assets/RELEASE_CHECKLIST.md)。

## 开发与测试

需要 Node.js 20 或更高版本和 pnpm：

```text
pnpm install
pnpm test:chrome
pnpm test:edge
```

测试覆盖文章识别、分块边界、定位/交互风险过滤、超长参考文献、延迟加载、SPA 导航、打印恢复、旧设置兼容及远程代码检查。参见 [TEST_REPORT.md](TEST_REPORT.md) 和 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 反馈与安全

- 一般问题与功能建议：[GitHub Issues](https://github.com/staywithGOD/LithePage/issues)
- 安全问题：[SECURITY.md](SECURITY.md)
- 隐私说明：[PRIVACY.md](PRIVACY.md)

提交问题时不要粘贴付费论文正文、Cookie、登录凭据或机构访问令牌。

## 许可状态

当前仓库尚未选择开源许可证。源代码公开用于审查、测试和协作讨论，但这不自动授予复制、再发布或商业使用权；正式授权方案将在发布前另行确定。
