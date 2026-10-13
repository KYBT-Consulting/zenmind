# ZenMind Code Review Baseline

Date: 2026-10-13. Scope: everything under `src/` and `src-tauri/` plus build config; the vendored `src/vendor/simple-mind-map` library is excluded except where our code calls into it.
Method: three read-only reviews (engine, services, UI components) plus a review of the tabs commit. The top findings were checked against the code; the rest are marked **plausible** (not reproduced).

Status: **Fixed** = fixed in the commit following this document. **Open** = not yet addressed.

## Critical / high

| # | Area | Finding | Status |
|---|------|---------|--------|
| 1 | Engine | `getData()` returns a `{layout, root, theme, view}` wrapper; auto-numbering and OPML/FreeMind export treated it as the node tree, so exports emitted a single empty node and numbering could blank the canvas. **Confirmed.** | Fixed (`getTreeData()`) |
| 2 | Engine | `setThemeConfig` replaces the whole theme; `setBranchLineStyle`/`toggleRainbowLines` passed partials and wiped the active theme. **Confirmed.** | Fixed |
| 3 | Engine | Rainbow-lines toggle set a nonexistent theme key; the plugin reads `opt.rainbowLinesConfig.open`. **Confirmed.** | Fixed |
| 4 | Build | `vite.config.ts` inlined `GEMINI_API_KEY` into the client bundle; no `.dockerignore`, so a local `.env` entered the Docker build. **Confirmed.** | Fixed |
| 5 | Services | Clearing the Gemini key in settings left the legacy `zenmind_gemini_api_key` in localStorage, and `getConfig` resurrected it. **Confirmed.** | Fixed |
| 6 | Tabs | Dirty tracking compared the whole wrapper including pan/zoom, so panning could mark a tab dirty or keep it dirty after undo. | Fixed |
| 7 | Services | Format sniffing uses `includes('<opml')` / `includes('<map version=')` on the whole text, so a `.zenmind`/`.md` file mentioning those strings fails to open. **Confirmed.** | Open |
| 8 | Services | Desktop (Tauri) open reads `.xmind` with `readTextFile`; only the web path can parse the zip. Plausible. | Open |
| 9 | Services | AI errors are swallowed and replaced with a generic template map, so users think the AI answered. **Confirmed.** | Open |
| 10 | Services | FreeMind/OPML export drops notes, links and tags and writes raw HTML into OPML notes. **Confirmed.** | Open |
| 11 | Security | Tauri `csp: null` and `fs:default`/`dialog:default` granted in full while API keys live in localStorage. Plausible. | Open |
| 12 | Security | Hyperlinks accept `javascript:`/`data:` URLs (prompt input and imported files). Plausible. | Open |

## Medium

| # | Area | Finding | Status |
|---|------|---------|--------|
| 13 | Engine | Minimap viewport drag calls the background-pan handlers (5x sensitivity) instead of `onViewBox*`. **Confirmed.** | Open |
| 14 | Engine | `screenToCanvasPos` ignores pan/zoom, so double-click floating topics land in the wrong place when zoomed/panned. **Confirmed.** | Open |
| 15 | Engine | `insertFloatingNode` mutates data directly: no undo, no `data_change`, so the tab is not marked dirty. Plausible. | Open |
| 16 | Engine | `setNodeText` runs user text through `stripHtml` (drops `<b>`-like text, decodes entities) and re-wraps without escaping. Plausible. | Open |
| 17 | Engine | Auto-numbering regex strips real leading words (`2024 roadmap`, `A plan`) and drops rich-text formatting. **Confirmed.** | Open |
| 18 | Engine | Shortcut gate (`customCheckEnableShortcut`) only allows `document.body`/edit targets; keys may be ignored while the canvas container has focus. Plausible; Tab also failed on the original code in manual testing. | Open |
| 19 | UI | Image dialog keeps state from the previous topic (mounted, returns null when closed); Attach can copy topic A's image to B. **Confirmed.** | Open |
| 20 | UI | Outline rows have no click-to-select; highlight compares text (duplicates all highlight); index keys. **Confirmed.** | Open |
| 21 | UI | Inspector ignores a repeated "open Notes/Tasks" request (effect keyed on `initialTab`). **Confirmed.** | Open |
| 22 | UI | AI dialog's reload effect depends on `activeNode` and can wipe unsaved config edits; AI "expand" may nest children instead of adding siblings. Plausible. | Open |
| 23 | UI | Image "max 5MB" not enforced; uploads inlined as base64 with no type/size/error handling. **Confirmed.** | Open |
| 24 | Tabs | Same file can be opened in two tabs (saves overwrite each other); the baseline snapshot uses a fixed 500 ms timer; replacing the pristine tab leaks engine/view/callback entries; title edits do not mark dirty; canvas `focus()` on tab activation steals focus; Ctrl+N is reserved in browsers and fires while typing. Plausible. | Open |
| 25 | Services | Folder import has no per-directory error handling or size cap; child paths joined with `/` onto native paths. Plausible. | Open |

## Low

- Quick export buttons in the ribbon have no error handling (the Export dialog does). Plausible.
- State update on every `node_tree_render_end`, and the minimap recomputes the full SVG every 400 ms. Plausible.
- Tabs and icon-only buttons lack roles/aria-labels; dialogs lack Escape-to-close and focus trap. **Confirmed.**
- `FloatingBubbleMenu` calls a hook after an early return. Works today (no crash observed in manual testing); a lint violation.
- Mobile bottom bar offers fewer actions than the ribbon. Plausible.
- Web save fallback revokes the blob URL immediately after `click()`. Plausible.
- JSON import accepts anything with `.content`/`.data` and falls back to markdown on a parse failure. Plausible.
- `simple-mind-map.d.ts` omits most of the API used, hiding wrong calls behind `any`.
- Dev-only: destroyed engines log `appendChild of null` / `rbox` errors when a tab closes or React StrictMode remounts.

## Notes on reviewer accuracy

Some reviewer line numbers were wrong (e.g. cited lines past the end of `folderImportService.ts`), and one claim was overstated (the hooks-order issue was reported as a crash). Items marked plausible should be reproduced before fixing.
