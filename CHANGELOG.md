# Changelog

All notable changes to ZenMind are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/) (pre-1.0: minor versions may include breaking changes).

## [0.2.0] - 2026-10-16

### Added
- **Starter Template Gallery & Custom Templates:** 10 built-in templates across Strategic Planning (SWOT, PESTEL, Porter's Five Forces), Project Management (Eisenhower Matrix, Sprint Roadmap, Risk Assessment), Engineering & Systems (5 Whys, Fishbone Ishikawa, System Architecture), and Organization & Team (Org Chart), plus saving/deleting custom personal templates in `localStorage`.
- **Map Versioning & History Snapshots:** Periodic non-destructive automatic snapshots and manual named checkpoints per document, with a timeline dialog to preview hierarchy and restore to the active map or open in a new tab.
- **Keyboard Mastery & Optional Vim Navigation Mode:** Press `?` to open the Keyboard Shortcuts & Vim Mode cheat-sheet and toggle single-key Vim navigation (`h`/`j`/`k`/`l` spatial movement, `o`/`O` child/sibling creation, `i`/`e` inline edit, `x` delete, `u` undo, `f` fit view).
- **In-Canvas Find & Replace (`Ctrl+F`):** Search topics and notes with match counter, next/previous navigation, single replace, and undoable replace-all.
- **Accessible Hyperlink Dialog & Toast Notifications:** Replaced blocking browser `window.prompt` and `alert` calls with a keyboard-accessible modal dialog and dismissible toast notifications.
- **Session Recovery & Unsaved-Changes Guard:** Automatically persists open tabs to `localStorage` (`zenmind_session_v1`) and warns on `beforeunload` when any tab has unsaved changes.
- **GitHub Issue Templates:** Structured YAML forms for bug reports and feature requests.

### Fixed
- **Opening saved `.zenmind` files:** Fixed `Cannot read properties of undefined (reading 'replace')` crash when opening full-document `.zenmind` files (`{ layout, root, theme, view }`), restoring saved layout, theme, and rainbow lines and guarding `htmlEscape` against missing `data.text`.
- **Dirty tracking & UI synchronization:** Changing layout, theme, branch line style, or rainbow lines now updates dirty state and refreshes the Ribbon and Format Inspector immediately.
- **Destroyed canvas cleanup:** Closing a tab now cancels pending `requestAnimationFrame` and render callbacks in the underlying engine.

## [0.1.2] - 2026-10-13

A stabilisation release following a full code review. Details and status of every finding are in
[`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md).

### Added
- **Multiple maps in tabs.** Open, drag-and-drop and folder import each open a new tab. Every tab keeps its own undo history, zoom and unsaved-changes marker; closing a tab with unsaved changes asks first. Opening a file that is already open switches to its tab.
- **New Map** button and shortcut (Ctrl/Cmd+N in the desktop app, Alt+N in the browser, where Ctrl+N is reserved).
- Unit tests (`npm test`, Vitest) for sanitising, unsaved-changes detection, numbering, folder import and the OPML/FreeMind/JSON formats; run in CI.
- `docs/CODE_REVIEW.md` and `docs/RELEASE_PLAN_0.1.2.md`.

### Fixed
- **Keyboard shortcuts** (Tab, Enter, Delete) did nothing after clicking a topic on the canvas.
- **Export:** OPML and FreeMind export now keep notes, hyperlinks and tags (they were dropped), and read them back on import. OPML/`.mm` exports from a map no longer collapse into a single empty topic. Plain-text topics containing `<` or `>` are no longer stripped on export.
- **Themes:** changing the branch line style no longer resets the theme; Rainbow Branches now works.
- **Auto-numbering** only removes the numbers it added, so topics such as "2024 roadmap" are never altered.
- **Floating topics:** double-click places them at the click point when zoomed or panned, they are selected on creation, and they support undo.
- **Minimap:** the preview shows the whole map at the right proportions and the viewport box can be dragged correctly.
- **Unsaved-changes marker** no longer appears on fresh maps, ignores pan/zoom, clears after undoing back to the saved state, and reacts to title edits.
- **AI:** provider errors are shown instead of silently producing a generic template; malformed responses are validated; "Expand topic" adds children under the selected topic instead of overwriting it; the dialog no longer discards unsaved settings.
- **Opening files:** a `.zenmind` or Markdown file that merely mentions `<opml` opens normally; invalid JSON reports an error instead of importing as text; `.xmind` files open in the desktop app.
- **Desktop:** Save permission added to the app's capabilities (it was missing, so Save was likely denied); folder import grants access to subfolders, skips unreadable folders and caps very large trees with a warning.
- Outline rows select their topic when clicked and highlight by topic, not by matching text; the inspector switches to Notes/Tasks again on repeat requests; the image dialog resets per topic and enforces its 5 MB limit.
- Quick-export buttons in the ribbon report failures; the browser save fallback no longer cancels downloads by revoking the file URL too early.

### Security
- Content Security Policy for the desktop app and recommended headers for the web container.
- Desktop permissions narrowed to open/save dialogs and the specific file operations the app uses.
- Hyperlinks are limited to `http`, `https`, `mailto` and `tel`; imported and AI-generated maps are sanitised (scripts, event handlers and unsafe URLs removed).
- API keys are no longer bundled into the client build (enter them in the AI settings); clearing a Gemini key now removes every stored copy.

### Accessibility
- Tabs and dialogs are keyboard accessible (arrow keys between tabs; dialogs close on Escape, keep focus inside, and restore focus on close); icon-only buttons have labels.

### Known limitations
- Desktop builds use **Tauri v3 Alpha**; the new CSP and permissions have been checked against the plugin sources and the web build but need a full desktop smoke test before release.
- The Content Security Policy still allows inline styles and any `https` image or AI endpoint, because the canvas library and user-supplied URLs need them.

## [0.1.1] - 2026-10-13

### Changed
- Docker image is now a lightweight web (SPA) container; native RPM is bundled in the release workflow.
- Node.js 26 across workflows and containers; Tauri v3 runtime configuration.
- Windows portable package with local data isolation.

### Fixed
- Desktop startup crash on Windows; Rust 2024 `set_var` compliance.

### Documentation
- Roadmap, MIT attribution for the bundled mind map engine, and a Tauri v3 alpha notice.

## [0.1.0] - 2026-10-12

Initial desktop and web release: SVG mind map engine with multiple layouts, ribbon UI with synchronised outline and format inspector, floating topics, task and priority metadata, relationship lines, boundaries and summaries, AI copilot (Gemini and OpenAI-compatible endpoints), PNG/SVG/PDF/XMind/OPML/FreeMind import and export, and desktop packages for Linux, macOS and Windows.
