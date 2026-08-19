# LithePage 2.0 测试报告

日期：2026-08-19

## Chrome 与 Edge 自动回归：通过

同一套 39 个合成 DOM 场景已分别在本机 Google Chrome 和 Microsoft Edge 151.0.4129.93 中运行，两个通道均为 39/39 通过，合计 **78/78**。覆盖：

- 长论文启用、特定正文根优先、短页/应用页/PDF 安全退出；
- 8/150 块边界、正文覆盖率、单一 wrapper、多层混合细分；
- fixed/sticky/absolute、已有 content-visibility、dialog/iframe/表单等风险拒绝；
- 超长 OL/UL 参考文献原子化及 11 类正负边界；
- 同构 DIV 参考文献原子化、Related references 否决、末条按钮/绝对定位/已有 containment 否决；
- 延迟加载正文的有界观察与合并重检；
- SPA `pushState`/`replaceState` 清理、重新检测及当前页偏好重置；
- 翻译式纯文本 mutation 不触发重新扫描；
- 旧版 `autoEnabled` 和 `siteModes` 设置兼容；
- 大型安全 DOM 初检预算、关闭恢复和打印恢复；
- MV3、2.0.0 版本、最小权限、本地图标、无远程脚本/网络客户端/动态代码执行。

统一执行器：`tests/run-all-regressions.cjs`。

## 真实 Chrome 只读结构核对：完成

当前已打开的真实页面基线：

- RSC HTML 全文：旧版处于 Active，150 块，页面已翻译；目标参考容器为 281 个直接 DIV、约 47,356 字符、约 23,110 px 高、10,528 个后代、抽样引文证据 100%、无表单控件或定位后代。旧版的 98 个子块已有 containment；刷新并加载 2.0 后，新规则预计把该参考容器识别为单个 `reference-div` 原子块。该预期尚未通过真实 v2 安装实测。
- ScienceDirect HTML 全文：旧版处于 Active，29 块。

以上操作仅读取结构与数量，没有读取 Cookie、机构凭据或发送论文内容。

## 尚未完成的公开发布硬门槛

自动回归不能证明 Chrome 或 Edge 自带翻译在所有真实模板上的完整性，也不能证明实际 CPU 或卡顿改善。公开上架前仍需：

- 在真实 Chrome Stable 与 Microsoft Edge 安装 2.0 候选版；
- 核对 ScienceDirect、RSC、ACS、Springer、Wiley、ASME、AIAA；
- 每页比较正文首/中/末和参考文献首/中/末；
- A/B 记录 CPU、主线程长任务、翻译完成时间与滚动帧时间；
- 核对锚点、脚注、Ctrl+F、缩放、打印和 NVDA/键盘导航。

因此本版本状态是：**Chrome 与 Edge 代码级兼容和合成回归已通过，可进入两个浏览器的真实站点候选验收；尚不应宣称“兼容所有文章”或“已证明消除卡顿”。**
