# LithePage 2.0 架构与安全边界 / Architecture and Safety Boundaries

[中文](#中文) · [English](#english)

## 中文

### 单一目的

LithePage 只减少超长学术 HTML 页面屏幕外部分的布局、绘制和合成负担。它不提供翻译、不改变 Chrome 或 Edge 的翻译服务、不上传页面内容，也不删除正文节点。

### 数据流

1. 从 `citation_*`、DOI、`ScholarlyArticle`、`article/main`、正文文字量和几何高度中识别长篇文章；
2. 在正文根内穿透单一主导 wrapper，并递归寻找结构块；
3. 只保留互不具有祖先/后代关系的候选集合；
4. 对尺寸、定位、已有 containment、交互后代、flex/grid 父层和危险祖先做最终过滤；
5. 仅当 8–150 块、文本覆盖 ≥55%、高度覆盖 ≥45% 时启用；
6. 批量写入扩展自有属性和实测占位高度；关闭、导航或打印时恢复。

### 必须保持的不变量

- 任意两个已标记块不互为祖先和后代；
- 最终块数始终为 8–150；
- 所有块属于同一个已验证正文根；
- 普通单块高度不超过约 5.5 个视口；
- atomic 参考区只豁免高度上限，其他安全检查不变；
- atomic 容器和其条目绝不同时标记；
- 结构或覆盖率不足时失败关闭，页面保持原样；
- 强制尝试不绕过结构安全门槛；
- 打印媒体强制完整渲染；
- 不设置 `translate=no`，不故意跳过参考文献翻译。

### 参考文献适配

支持两种高置信度结构族：

- 纯 `OL/UL > LI`；
- 同构 `DIV/P/ARTICLE/role=listitem` 直接条目容器。

判定需要强 References/Bibliography 上下文、至少 80 个条目、至少 8000 字、超过 5.5 个视口、至少 60% 均匀抽样条目含年份或 DOI、条目文字占容器至少 90%，并对最多 25000 个后代执行完整风险扫描。Related references/Further reading 等负向上下文优先否决。

### 延迟加载与 SPA

自动检测失败后才启用 `childList` 有界观察：900 ms 去抖、最多 5 次重检、最长 12 秒。达到 Active、禁用、不支持或超时状态会断开观察，不长期监控页面，也不观察纯文字变化。SPA 路由变化会递增 route epoch、清理旧标记和缓存、重置当前页临时偏好，再重新检测；每次只允许一个评估在途。

### 复杂度上限

- 正文根候选最多 48 个、检查元素最多约 160 个；
- 单次文字采样最多 8000 个文本节点或 400000 字符；
- 结构深度最多 10 层、候选最多 220 个；
- 应用块最多 150 个；
- atomic 候选最多 32 个、后代安全扫描最多 25000 个；
- 稳定 Active 页面没有持续 DOM 扫描。

## English

### Single purpose

LithePage only aims to reduce the layout, paint, and compositing work associated with off-screen portions of long academic HTML pages. It does not provide translation, alter the translation services in Chrome or Edge, upload page content, or remove article nodes.

### Data flow

1. Identify long-form articles from `citation_*` metadata, DOI markers, `ScholarlyArticle`, `article/main`, article text volume, and geometric height.
2. Traverse a single dominant wrapper within the article root and recursively discover structural blocks.
3. Retain only a candidate set in which no block is an ancestor or descendant of another.
4. Apply final filters for size, positioning, existing containment, interactive descendants, flex/grid parent risks, and unsafe ancestors.
5. Activate only when there are 8–150 blocks, text coverage is at least 55%, and height coverage is at least 45%.
6. Batch-write extension-owned attributes and measured placeholder heights; restore full rendering when disabled, on navigation, or for printing.

### Required invariants

- No two marked blocks may be ancestors or descendants of one another.
- The final block count must remain between 8 and 150.
- Every block must belong to the same validated article root.
- An ordinary block may not exceed approximately 5.5 viewport heights.
- An atomic bibliography container is exempt only from the height limit; all other safety checks remain in force.
- An atomic container and its entries are never marked at the same time.
- If structure or coverage is insufficient, detection fails closed and leaves the page unchanged.
- A forced attempt does not bypass structural safety gates.
- Print media forces full rendering to be restored.
- LithePage does not set `translate=no` and does not intentionally skip bibliography translation.

### Bibliography handling

LithePage supports two high-confidence structure families:

- plain `OL/UL > LI` lists;
- containers composed of homogeneous direct entries using `DIV`, `P`, `ARTICLE`, or `role=listitem`.

Detection requires strong References/Bibliography context, at least 80 entries, at least 8,000 characters, a height greater than 5.5 viewports, year or DOI evidence in at least 60% of uniformly sampled entries, and entry text accounting for at least 90% of the container text. LithePage performs a complete risk scan over as many as 25,000 descendants. Negative contexts such as Related references or Further reading take precedence and reject atomic handling.

### Delayed loading and SPAs

A bounded `childList` observer is enabled only after automatic detection fails. It uses a 900 ms debounce, performs no more than five rescans, and runs for no longer than 12 seconds. Observation stops after an Active, disabled, unsupported, or timed-out state. LithePage does not monitor the page indefinitely and does not observe text-only changes.

An SPA route change increments the route epoch, clears old marks and caches, resets the temporary page preference, and starts detection again. Only one evaluation may be in flight at a time.

### Complexity limits

- At most 48 article-root candidates and approximately 160 inspected elements.
- At most 8,000 text nodes or 400,000 characters per text-sampling pass.
- At most 10 structural levels and 220 candidates.
- At most 150 applied blocks.
- At most 32 atomic candidates and 25,000 descendants per safety scan.
- No continuous DOM scanning on a stable Active page.
