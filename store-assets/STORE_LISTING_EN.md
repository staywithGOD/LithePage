# Chrome Web Store listing (English)

## Name

LithePage

## Short description

Detects long academic HTML pages and defers off-screen rendering while Chrome keeps handling translation.

## Detailed description

LithePage is a conservative, local rendering optimizer for long academic HTML pages. It combines scholarly metadata, document structure, text length, and page geometry. It activates only when it can identify enough safe, non-overlapping content blocks.

LithePage is not a translation service. Chrome's built-in page translation still handles translation. LithePage aims to reduce avoidable off-screen layout, paint, and compositing work while long papers are being translated or scrolled.

Key features:

- Detects long academic HTML pages without a publisher allowlist.
- Handles common section layouts, nested article wrappers, and high-confidence long bibliography structures.
- Shows page status, optimized block count, text coverage, detection time, and bibliography entry count.
- Offers page-level, site-level, and global controls.
- Performs bounded retries for late-loaded article content and stops observing once active.
- Restores full rendering for print media.

Compatibility:

LithePage works from page structure rather than domain names. Whether a page activates depends on its length, DOM structure, and interactive components. PDF documents, iframe readers, canvas readers, full text hosted inside Shadow DOM, paginated documents, and highly interactive full-text viewers are not supported.

Results and limitations:

Results vary by website, article, hardware, and Chrome version. LithePage cannot promise to eliminate every CPU spike, delay, or scroll jump. On a new platform, verify the beginning, middle, and end of the article and bibliography. If anything looks wrong, set the current site to “Never enable,” then refresh before translating again. Page-only disablement does not persist across a reload.

Privacy:

All analysis runs locally. LithePage contains no ads, analytics, remote code, or developer-server communication. It does not upload or store article text. Chrome local extension storage contains only settings and site preferences explicitly chosen by the user.
