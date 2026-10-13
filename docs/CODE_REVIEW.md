# ZenMind Code Review Baseline

Date: 2026-10-13. Scope: everything under `src/` and `src-tauri/` plus build config; the vendored `src/vendor/simple-mind-map` library is excluded except where our code calls into it.
Method: three read-only reviews (engine, services, UI components) plus a review of the tabs commit. The top findings were checked against the code; the rest are marked **plausible** (not reproduced).

Status: **Fixed** = fixed in a later commit. **Open** = not yet addressed.

## Critical / high

| # | Area | Finding | Status |
|---|------|---------|--------|
| 1 | Engine | `getData()` returns a `{layout, root, theme, view}` wrapper; auto-numbering and OPML/FreeMind export treated it as the node tree, so exports emitted a single empty node and numbering could blank the canvas. **Confirmed.** | Fixed (`getTreeData()`) |
| 2 | Engine | `setThemeConfig` replaces the whole theme; `setBranchLineStyle`/`toggleRainbowLines` passed partials and wiped the active theme. **Confirmed.** | Fixed |
| 3 | Engine | Rainbow-lines toggle set a nonexistent theme key; the plugin reads `opt.rainbowLinesConfig.open`. **Confirmed.** | Fixed |
| 4 | Build | `vite.config.ts` inlined `GEMINI_API_KEY` into the client bundle; no `.dockerignore`, so a local `.env` entered the Docker build. **Confirmed.** | Fixed |
| 5 | Services | Clearing the Gemini key in settings left the legacy `zenmind_gemini_api_key` in localStorage, and `getConfig` resurrected it. **Confirmed.** | Fixed |
| 6 | Tabs | Dirty tracking compared the whole wrapper including pan/zoom, so panning could mark a tab dirty or keep it dirty after undo. | Fixed (also: compares a content signature that ignores the layout-only `dir` field, and re-checks on undo/redo) |
| 7 | Services | Format sniffing uses `includes('<opml')` / `includes('<map version=')` on the whole text, so a `.zenmind`/`.md` file mentioning those strings fails to open. **Confirmed.** | Fixed (root-element/extension detection) |
| 8 | Services | Desktop (Tauri) open reads `.xmind` with `readTextFile`; only the web path can parse the zip. Plausible. | Fixed (desktop open reads .xmind as bytes) |
| 9 | Services | AI errors are swallowed and replaced with a generic template map, so users think the AI answered. **Confirmed.** | Fixed (Gemini/OpenAI errors now surface and responses are validated; the offline template remains only when no Gemini key is set) |
| 10 | Services | FreeMind/OPML export drops notes, links and tags and writes raw HTML into OPML notes. **Confirmed.** | Open |
| 11 | Security | Tauri `csp: null` and `fs:default`/`dialog:default` granted in full while API keys live in localStorage. Plausible. | Fixed: restrictive CSP (plus a looser `devCsp` for Vite) in `tauri.conf.json` and as nginx headers; capabilities narrowed to `dialog:allow-open/save` and `fs:allow-read-file/read-dir/write-file`. Corrects the original finding: `fs:default` only granted read access to app folders, but it did not include `write-file`, so desktop Save was probably being denied. Not yet run in a Tauri build |
| 12 | Security | Hyperlinks accept `javascript:`/`data:` URLs (prompt input and imported files). Plausible. | Fixed: links limited to http(s)/mailto/tel; imported and AI-generated maps are sanitised (scripts, event handlers, unsafe URLs removed from node text and notes); KaTeX `trust:false` |

## Medium

| # | Area | Finding | Status |
|---|------|---------|--------|
| 13 | Engine | Minimap viewport drag calls the background-pan handlers (5x sensitivity) instead of `onViewBox*`. **Confirmed.** | Fixed |
| 14 | Engine | `screenToCanvasPos` ignores pan/zoom, so double-click floating topics land in the wrong place when zoomed/panned. **Confirmed.** | Fixed |
| 15 | Engine | `insertFloatingNode` mutates data directly: no undo, no `data_change`, so the tab is not marked dirty. Plausible. | Fixed (now an `INSERT_CHILD_NODE` command) |
| 16 | Engine | `setNodeText` runs user text through `stripHtml` (drops `<b>`-like text, decodes entities) and re-wraps without escaping. Plausible. | Fixed (text is escaped, not stripped; no UI path calls `setNodeText` currently) |
| 17 | Engine | Auto-numbering regex strips real leading words (`2024 roadmap`, `A plan`) and drops rich-text formatting. **Confirmed.** | Fixed (prefixes are tracked per topic uid and removed exactly; works on rich-text HTML) |
| 18 | Engine | Shortcut gate (`customCheckEnableShortcut`) only allows `document.body`/edit targets; keys may be ignored while the canvas container has focus. Plausible; Tab also failed on the original code in manual testing. | Fixed: the focused canvas container is now accepted as a shortcut target; Tab/Enter/Delete work after clicking a topic (they did not before, including on the original code) |
| 19 | UI | Image dialog keeps state from the previous topic (mounted, returns null when closed); Attach can copy topic A's image to B. **Confirmed.** | Fixed |
| 20 | UI | Outline rows have no click-to-select; highlight compares text (duplicates all highlight); index keys. **Confirmed.** | Fixed (click/Enter selects, uid-based highlight) |
| 21 | UI | Inspector ignores a repeated "open Notes/Tasks" request (effect keyed on `initialTab`). **Confirmed.** | Fixed (tab request counter) |
| 22 | UI | AI dialog's reload effect depends on `activeNode` and can wipe unsaved config edits; AI "expand" may nest children instead of adding siblings. Plausible. | Fixed (effect keyed on uid; expand now inserts siblings under the topic via `addChildTopics`. The old code also overwrote the parent's text) |
| 23 | UI | Image "max 5MB" not enforced; uploads inlined as base64 with no type/size/error handling. **Confirmed.** | Fixed (5MB and image-type checks, read errors) |
| 24 | Tabs | Same file can be opened in two tabs (saves overwrite each other); the baseline snapshot uses a fixed 500 ms timer; replacing the pristine tab leaks engine/view/callback entries; title edits do not mark dirty; canvas `focus()` on tab activation steals focus; Ctrl+N is reserved in browsers and fires while typing. Plausible. | Fixed: same-path files focus the existing tab; baseline is taken at first render (not a timer) and ignores library-added empty objects such as `imgMap`; replaced tabs are cleaned up; title edits mark dirty; tab activation only takes focus when nothing else has it; the web build uses Alt+N (browsers reserve Ctrl+N), the desktop app Ctrl/Cmd+N. Same-file dedupe is by path, so it applies to desktop opens only |
| 25 | Services | Folder import has no per-directory error handling or size cap; child paths joined with `/` onto native paths. Plausible. | Open |
| 26 | Engine | `insertFloatingNode` looked up the new node through `renderer.nodeList`, which does not exist in the library, so the new floating topic was never auto-selected (same class of bug as the outline selection). **Confirmed.** | Fixed |

## Low

- Quick export buttons in the ribbon have no error handling (the Export dialog does). Plausible. **Open (skipped with import/export work).**
- State update on every `node_tree_render_end`, and the minimap recomputes the full SVG every 400 ms. Plausible. **Fixed:** active-node updates are skipped when unchanged; the minimap redraws on map/view change events (coalesced) instead of polling.
- Tabs and icon-only buttons lack roles/aria-labels; dialogs lack Escape-to-close and focus trap. **Confirmed. Fixed:** tablist/tab roles with arrow-key navigation, aria-labels on icon buttons, and `useDialogA11y` (role=dialog, Escape, focus trap, focus restore) on the four dialogs. Backdrop-click-to-close was not added.
- `FloatingBubbleMenu` calls a hook after an early return. Works today (no crash observed in manual testing); a lint violation. **Fixed.**
- Mobile bottom bar offers fewer actions than the ribbon. Plausible.
- Web save fallback revokes the blob URL immediately after `click()`. Plausible. **Fixed** (delayed revoke, anchor attached to the DOM).
- JSON import accepts anything with `.content`/`.data` and falls back to markdown on a parse failure. Plausible.
- `simple-mind-map.d.ts` omits most of the API used, hiding wrong calls behind `any`.
- Engine timers are now cancelled in `destroy()`.
- The minimap preview looks mis-scaled in the navigator (viewport box much larger than the map). Not investigated.
- Dev-only: destroyed engines log `appendChild of null` / `rbox` errors when a tab closes or React StrictMode remounts.

## Security notes

- The minimap preview injects the library's rendered SVG with `dangerouslySetInnerHTML`. Imported text is sanitised at load and the CSP blocks inline handlers, but the SVG itself is not separately sanitised.
- `style-src` allows `'unsafe-inline'` (the canvas library and Tailwind rely on inline styles) and `img-src`/`connect-src` allow any https origin (user-supplied image URLs and AI endpoints). Tightening those needs a product decision.
- Capabilities and the CSP have been checked against the plugin sources and, for the CSP, a production build in Chrome. They have not been exercised in a built Tauri app.

## Notes on reviewer accuracy

Some reviewer line numbers were wrong (e.g. cited lines past the end of `folderImportService.ts`), and one claim was overstated (the hooks-order issue was reported as a crash). Items marked plausible should be reproduced before fixing.
