# Changelog

All notable changes to ZenMind are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/) (pre-1.0: minor versions may include breaking changes).

## [0.3.2] - 2026-11-10

### Fixed
- **Automatic updates on Fedora and other RPM 6 systems:** Installing an update from the `.rpm` failed with "failed to install package" after asking for your password twice, because RPM 6 rejects packages without an OpenPGP signature by default. ZenMind now verifies the update with its own update signature and then installs it, asking for your password once.
- **Easier recovery when an update can't install:** The update notice now offers a **Copy download link** so you can install the new version yourself.

> **Fedora / `.rpm` users on 0.3.0 or 0.3.1:** those versions can't install this update themselves. Download `ZenMind-0.3.2-1.x86_64.rpm` and install it once with `sudo dnf install ./ZenMind-0.3.2-1.x86_64.rpm`; updates after that install automatically. Windows, macOS, AppImage, and `.deb` users are offered this update as usual.

## [0.3.1] - 2026-11-10

### Added
- **File tab:** A new **File** tab before **Home** groups **New**, **Open**, **Save**, **Save As** (Ctrl+Shift+S), **Rename**, **Export**, **Templates**, and **History**. Home is still the tab shown at startup.
- **Save As** saves a copy under a new name or location, and the tab switches to the new file. **Rename** renames or moves the file on disk (nothing is deleted), and the map title follows.

### Fixed
- **Maps edited on another device now show up:** ZenMind no longer restores open files from its own saved copy at launch. Saved files are reopened from disk, so changes made elsewhere (another device, a sync folder like pCloud or Dropbox, another app) appear. Only maps with unsaved changes are restored from ZenMind's recovery copy.
- **Unsaved edits are never lost to a newer file:** If a file changed elsewhere while you had unsaved edits (after a crash or quit), both open: the file as it is now, and your edits as **"<name> - recovered"**, which saves to a new file so it can't overwrite the newer one.
- **Opening a file that's already open** rereads it if it changed on disk, and asks first if that tab has unsaved changes.
- **Save no longer overwrites imported files:** Saving a map opened from Markdown, XMind, OPML, or FreeMind used to replace that file with ZenMind data. It now asks where to save a `.zenmind` copy.
- **Automatic updates:** Releases now include the signed update files, so ZenMind 0.3.0 and later can update themselves.

### Changed
- The update notice's **What's new** and each GitHub release now show this changelog.

> Files opened in 0.3.0 can't be reopened automatically the first time you start 0.3.1. Open them once with **File › Open**; after that they reopen on their own.

## [0.3.0] - 2026-11-10

### Added
- **Automatic updates (desktop):** ZenMind checks for a new release shortly after starting and shows an **Update available** notice with release notes, download progress, and **Install & restart**. It asks before restarting if any map has unsaved changes. The About dialog adds **Check for updates** and a setting to turn the startup check off. Updates are cryptographically signed and verified before installing, and work for the Windows installers, macOS, AppImage, `.rpm`, and `.deb` (which asks for your system password). The Windows portable ZIP shows a download link instead, so it never installs a second copy.
- **New ZenMind logo:** A "Z" drawn as a connected node graph replaces the default Tauri icon on every installer, the taskbar/dock, and the window, and it now also appears in the app header, the About dialog, and as the web favicon (previously none).

### Changed
- Release builds are now signed for the updater and publish a `latest.json` alongside the installers.
- `npm run icons` regenerates every platform icon from the single source logo, `src/assets/zenmind-logo.svg`.

> **Upgrading:** 0.3.0 is the first version that can update itself, so this one update must be installed manually. Future versions will be offered automatically.

## [0.2.7] - 2026-11-10

### Fixed
- **Unsaved changes lost when closing a tab (desktop):** The Tauri dialog plugin replaces `window.confirm` with an async version, so the "unsaved changes, close anyway?" check always passed and dirty tabs closed without asking. Closing a tab now waits for a native confirmation dialog.
- **Error messages never appeared on desktop:** `alert()` is routed through the dialog plugin's `message` command, which the app's capability did not allow, so AI, export, and import errors failed silently. The `dialog:allow-message` permission is now granted.
- **Gemini requests failing with 404:** The built-in default model `gemini-2.5-flash` has been retired. ZenMind now defaults to Google's `gemini-flash-latest` alias, which always points to the newest Flash model, and moves saved settings off the retired default (models you pinned yourself are kept). The Gemini API is pinned to `v1beta`, which serves these aliases; `@google/genai` 3 otherwise defaults to `v1`, which does not.
- **AI dialog showed a hardcoded "Gemini 2.5 Flash":** The brainstorm screen and provider card now show the configured model, and Test Connection reports which model answered an alias (for example `gemini-flash-latest → gemini-3.8-flash`).
- **Test Connection could hang indefinitely:** It now gives up after 15 seconds with a "try again" message (Gemini and OpenAI-compatible endpoints alike), and AI errors now log the API's message instead of only a stack trace.

### Changed
- **Vite 8** (with `@vitejs/plugin-react` 6): production builds are roughly 7× faster.
- **TypeScript 7:** type checking is roughly 5× faster.
- **lucide-react 1.x**, **`@google/genai` 3**, **jsdom 31**, and `@types/node` 24.
- Removed the unused `motion` and `dotenv` dependencies.
- `vite.config.ts` uses `import.meta.dirname` instead of `__dirname`, ahead of Vite's native config loader becoming the default.

## [0.2.6] - 2026-11-10

### Fixed
- **Desktop exports now ask where to save:** Every export format (PNG, SVG, PDF, XMind, Markdown, OPML, FreeMind, JSON, ZenMind) opens the native Save dialog and writes to the chosen location, instead of silently dropping files into `~/Downloads` with no feedback. A toast confirms the saved path, the Export dialog stays open if the Save dialog is cancelled, and exporter failures now show an error instead of failing silently. Document titles are sanitized before being used as file names.
- **`npm run lint` after a local desktop build:** `tsconfig.json` now excludes `src-tauri/target`, `src-tauri/gen`, and `dist`, so type checking no longer trips over generated binary assets.

### Security
- **DOMPurify 3.4.17** (via jsPDF): fixes one critical, one high, and one low severity sanitizer bypass.
- **Vite 6.4.6:** fixes a `server.fs.deny` bypass in the dev server.
- **undici 8.12.4** (test-only, via jsdom): fixes five advisories, including TLS certificate validation bypass and cache poisoning.
- **deepmerge prototype poisoning (GHSA-gcqx-w48m-w2h4):** No upstream fix exists, so the bundled `deepmerge` shim now strips `__proto__`, `constructor`, and `prototype` keys from all merge inputs.

### Changed
- **Tauri v3 alpha.6:** Updated `tauri` and `tauri-runtime-wry` to `3.0.0-alpha.6`, `tauri-build` to `alpha.4`, and the dialog, fs, and log plugins (Rust and JS) to their latest alphas.
- **Minimum Rust version is now 1.95** (required by the new Tauri alphas). This only affects building from source.
- Refreshed remaining npm dependencies within their semver ranges (React 19.3.1, Tailwind CSS 4.3.5, Vitest 5.1.0, and others).

### Known Issues
- `glib < 0.20` (RUSTSEC unsoundness in `VariantStrIter`) remains, pulled in by Tauri's GTK 0.18 stack on Linux; it will be resolved when upstream Tauri moves to newer GTK bindings.

## [0.2.5] - 2026-10-29

### Added
- **About & Version Dialog (`AboutDialog`):** Added clickable version badges (`v0.2.5`) in the Ribbon header and Status Bar, plus an About dialog showing version, runtime environment (`Tauri Native Desktop` vs `Web App`), license, release highlights, and 1-click **Copy Info** diagnostics.
- **Right-Click Context Menus (`CanvasContextMenu`):**
  - Right-click any topic node to edit text, add subtopic/sibling/parent, copy/cut/paste/clone (duplicate), move up/down, fold/unfold subtree, set task progress (`0%`–`100%`) or priority (`P1`–`P5`), attach summary/boundary/relationship/image/hyperlink/notes, or delete.
  - Right-click the canvas background to spawn a floating topic at the cursor position, paste, expand/collapse all branches, expand to level (`L1`/`L2`/`L3`), fit to view, reset zoom, or tidy layout.
- **Expand All, Collapse All & Level Folding Controls:** Added 1-click **Expand All**, **Collapse All**, and **`L1`/`L2`/`L3`** controls in the Ribbon (**Home** and **View** tabs), the **Outline Panel** header, and the **Status Bar**.
- **Interactive Task Progress & Priority Indicators:** Surfaced task completion percentage (`0%`–`100%`) and priority badges (`P1`–`P5`) in the Outline Panel and Floating Bubble Menu, and enabled clicking the progress icon directly on a canvas node to cycle `0% → 25% → 50% → 75% → 100%`.

### Fixed
- **Task percentage & completion icons on canvas nodes:** Registered `0`, `25`, `50`, `75`, and `100` SVG icons under the `progress` icon group in `simple-mind-map` so `progress_0`–`progress_100` render and export properly, and guarded against empty icon sources.
- **Trackpad pinch-to-zoom scaling the entire app:** Isolated trackpad pinch gestures to zoom only the mind map canvas around the pointer instead of scaling the entire application UI (including intercepting WebKitGTK's `"wk-view-zoom-gesture"` on Linux desktop and non-passive `wheel`/`gesture*` listeners).

## [0.2.0] - 2026-10-16

### Added
- **Starter Template Gallery & Custom Templates:** 10 built-in templates across Strategic Planning (SWOT, PESTEL, Porter's Five Forces), Project Management (Eisenhower Matrix, Sprint Roadmap, Risk Assessment), Engineering & Systems (5 Whys, Fishbone Ishikawa, System Architecture), and Organization & Team (Org Chart), plus saving/deleting custom personal templates in `localStorage`.
- **Map Versioning & History Snapshots:** Periodic non-destructive automatic snapshots and manual named checkpoints per document, with a timeline dialog to preview hierarchy and restore to the active map or open in a new tab.
- **Keyboard Mastery & Optional Vim Navigation Mode:** Press `?` to open the Keyboard Shortcuts & Vim Mode cheat-sheet and toggle single-key Vim navigation (`h`/`j`/`k`/`l` spatial movement, `o`/`O` child/sibling creation, `i`/`e` inline edit, `x` delete, `u` undo, `f` fit view).
- **Inline Rich Text Upgrades:** Direct canvas Markdown shortcuts (`**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `==highlight==`, `$formula$`, `[!NOTE]`/`[!WARNING]`), 1-click Text Highlighter Tints, Callout Badges (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`), and a Live KaTeX Formula Preview Popover on the Floating Bubble Menu.
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
