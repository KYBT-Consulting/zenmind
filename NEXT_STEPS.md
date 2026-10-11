# ZenMind: Next Build Steps & Implementation Roadmap

## 1. Overview & Current Baseline

ZenMind has completed **Phase 1**:
- Headless mathematical SVG mind mapping engine internalized into `src/vendor/simple-mind-map/`.
- EdrawMind UI Shell complete: Ribbon toolbar, Format Inspector, Synchronized Outline, Floating Bubble menu, and Status Bar.
- AI integration via Google Gemini 2.5 Flash for topic generation and expansion.
- Repository created and pushed to [github.com/nuts23/zenmind](https://github.com/nuts23/zenmind) under the MIT License.

This document outlines the concrete technical tasks for **Phase 2 through Phase 5**.

---

## 2. Milestone 1: Desktop Native App Integration (Tauri v2)

**Goal**: Transform ZenMind into a native desktop application with tiny binary footprint (~15MB), fast startup, low RAM consumption (~40MB), and native OS capabilities.

### 2.1 Tauri v2 Initialization
- [ ] Configure the Rust toolchain: `rustup default stable`.
- [ ] Install Tauri v2 CLI: `npm install -D @tauri-apps/cli@next @tauri-apps/api@next`.
- [ ] Initialize Tauri in the project:
  ```bash
  npx tauri init
  ```
  - App Name: `ZenMind`
  - Window Title: `ZenMind - Open Source Mind Mapping`
  - Web assets: `../dist`
  - Dev server: `http://localhost:3000`
- [ ] Configure `src-tauri/tauri.conf.json`:
  - Window dimensions: `1280x800` (min `900x600`).
  - App icons (Linux png/svg, Windows `.ico`, macOS `.icns`).
  - Native permissions: file-system, dialog, os.

### 2.2 Native OS File System Integration
- [ ] Implement Tauri file dialog plugin (`@tauri-apps/plugin-dialog` & `@tauri-apps/plugin-fs`).
- [ ] Native file operations:
  - **Open File**: Native file picker with `.zenmind` / `.json` filter.
  - **Save / Save As**: Native save dialog saving directly to disk without browser download prompts.
  - **Dirty State Tracking**: Display asterisk `*` or bullet in title bar when there are unsaved changes.
  - **Auto-Save / Backup**: Configurable periodic backup to app data directory.
  - **Recent Files Menu**: Persist recently opened file paths in local storage.

### 2.3 Automated GitHub Actions CI/CD for Multi-Platform Builds
- [ ] Create `.github/workflows/release.yml`:
  - Trigger: On Git tag push (e.g., `v0.2.0`).
  - **Linux Job** (`ubuntu-latest`): Builds `.deb`, `.AppImage`, and `.tar.gz`.
  - **Windows Job** (`windows-latest`): Builds `.msi` and portable `.exe`.
  - **macOS Job** (`macos-latest`): Builds universal `.dmg` (Apple Silicon M1/M2/M3 + Intel x86_64) without needing a physical Apple device!
  - Automatically publishes binaries to the GitHub Releases page with changelog.

---

## 3. Milestone 2: EdrawMind Feature Depth & Visual Polish

**Goal**: Elevate canvas interactions, animations, and formatting tools to directly match or exceed EdrawMind.

### 3.1 Advanced Mind Map Elements
- [ ] **Floating Topics**:
  - Allow double-clicking on empty canvas area to spawn an independent "Floating Idea" node.
  - Floating nodes can branch into their own subtrees.
- [ ] **Interactive Relationship Lines**:
  - Drag-and-drop relationship links connecting any two arbitrary nodes across branches.
  - Support midpoint control handle dragging for custom bezier curvature.
  - Inline editable relationship label text.
- [ ] **Custom Boundaries (Frames)**:
  - Select subtrees or nodes and wrap them in a styled boundary box.
  - Customize boundary background tint, border dash array, and header label.
- [ ] **Summary Brackets**:
  - Group multiple sibling nodes with curly braces (`{`) or brackets.
  - Attach summary text nodes to the bracket tip.
- [ ] **Rich Node Content**:
  - Node icons / emojis picker.
  - Color-coded priority tags (e.g., `Priority 1`, `In Progress`, `Done`).
  - Image attachments (drag-and-drop images directly onto nodes).

### 3.2 Presentation / Pitch Mode
- [ ] Fullscreen presentation mode:
  - Hide all ribbons, sidebars, and toolbars.
  - Step-by-step traversal: pressing `ArrowRight` or `Space` pans/zooms to the next branch in sequence.
  - Ideal for presenting mind maps as slide replacements.

---

## 4. Milestone 3: Mobile & Touch Support (Tauri Mobile + PWA)

**Goal**: Deliver a first-class mobile experience across smartphones and tablets (Android, iOS, iPadOS).

### 4.1 Responsive Mobile UI Shell
- [ ] **Adaptive Navigation**:
  - On viewports `< 768px`, replace the top Ribbon toolbar with an **EdrawMind Mobile Bottom Drawer**.
  - Quick action floating pill at bottom: `+ Subtopic`, `+ Topic`, `Style`, `Outline`.
- [ ] **Mobile Sheet Drawers**:
  - Format inspector converts to a swipeable bottom sheet (modal bottom sheet).
  - Outline panel converts to a full-screen drawer with quick tap navigation.

### 4.2 Touch Gestures & Interactivity
- [ ] 2-finger pinch-to-zoom with smooth inertial scaling.
- [ ] 2-finger panning across the infinite canvas.
- [ ] Long-press on node to invoke the floating bubble action menu.
- [ ] Touch drag-and-drop to reparent nodes with clear touch drop indicator rings.

### 4.3 PWA & Tauri Mobile Targets
- [ ] Install `vite-plugin-pwa` for zero-install offline web capability:
  - Web App Manifest (`manifest.json`): standalone display, icons, theme colors.
  - Service worker caching for 100% offline functionality.
- [ ] Initialize Tauri Mobile:
  ```bash
  npx tauri android init
  ```

---

## 5. Milestone 4: Multi-Format Compatibility Suite

**Goal**: Seamless interoperability with the broader mind mapping ecosystem.

| Format | Import Support | Export Support | Description |
| :--- | :---: | :---: | :--- |
| **`.zenmind`** | ✅ | ✅ | Native JSON schema (compact & lossless) |
| **`.xmind`** | ✅ | ✅ | Standard XMind 8 & XMind Zen format |
| **Markdown (`.md`)** | ✅ | ✅ | Indented list with headers (Obsidian / Notion ready) |
| **OPML (`.opml`)** | ✅ | ✅ | Outline Processor Markup Language |
| **FreeMind (`.mm`)** | ✅ | ✅ | Legacy FreeMind / Freeplane XML format |
| **PNG / JPG** | — | ✅ | Raster export up to 4K resolution |
| **SVG** | — | ✅ | Infinite vector graphic export |
| **PDF** | — | ✅ | Multi-page / single-page vector document |

---

## 6. Milestone 5: Open Source Governance & Community Launch

**Goal**: Prepare ZenMind for open-source adoption, contributors, and showcase.

- [ ] **Documentation**:
  - Create `CONTRIBUTING.md` with development setup, coding standards, and PR workflows.
  - Create issue templates: Bug Report, Feature Request, New Layout Suggestion.
- [ ] **Demo / Landing Site**:
  - Set up GitHub Pages workflow to deploy the web build automatically from `main` to `https://nuts23.github.io/zenmind`.
- [ ] **Security & Code Quality**:
  - Automated GitHub Actions linting and typechecking on PRs.
  - Dependabot alerts and automated dependency auditing.

---

## 7. Immediate Next Action Item

The logical first step to execute is **Milestone 1 (Tauri v2 Initialization)**:
1. Configure Rust toolchain on your Linux machine (`rustup default stable`).
2. Install Tauri v2 CLI and initialize the `src-tauri` native desktop scaffolding.
3. Test the native Linux desktop build (`cargo tauri dev`).
