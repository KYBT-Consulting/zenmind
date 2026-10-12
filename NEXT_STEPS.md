# ZenMind: Next Build Steps & Implementation Roadmap

## 1. Overview & Current Baseline

ZenMind has completed **Phase 1**:
- Headless mathematical SVG mind mapping engine internalized into `src/vendor/simple-mind-map/`.
- EdrawMind UI Shell complete: Ribbon toolbar, Format Inspector, Synchronized Outline, Floating Bubble menu, and Status Bar.
- AI integration via Google Gemini 2.5 Flash for topic generation and expansion.
- Repository created and pushed to [github.com/nuts23/zenmind](https://github.com/nuts23/zenmind) under the MIT License.

This document outlines the concrete technical tasks for **Phase 2 through Phase 5**.

---

## 2. Milestone 1: Desktop Native App Integration (Tauri v3 Alpha) [COMPLETED]

**Goal**: Transform ZenMind into a native desktop application with tiny binary footprint (~15MB), fast startup, low RAM consumption (~40MB), and native OS capabilities.

- [x] Configure Rust toolchain & Tauri v3 Alpha (`3.0.0-alpha.4` CLI, `3.0.0-alpha.2` API).
- [x] Initialize native desktop scaffolding in `src-tauri` with Linux, Windows, and macOS target support.
- [x] Implement native filesystem service (`DesktopFileService.ts`) with `tauri-plugin-dialog` & `tauri-plugin-fs` direct-to-disk open/save operations and web fallback.
- [x] Automated CI/CD GitHub Actions workflow (`release.yml` & `ci.yml`) for multi-platform builds (.deb, .AppImage, .msi, .exe, .dmg universal).

---

## 3. Milestone 2: EdrawMind Feature Depth & Visual Polish

**Goal**: Elevate canvas interactions, formatting tools, and node capabilities to match EdrawMind's signature user experience (derived from EdrawMind changelog v6.0–v14.0 review).

### 3.1 Core Topic Metadata & Task Management (EdrawMind v12.4 & v13.0)
- [ ] **Task / Todo Checkboxes & Progress Tracking**:
  - Add checkbox attribute to topics with completion states (`Not Started`, `In Progress`, `Completed`).
  - Progress markers (0%, 25%, 50%, 75%, 100%) and Priority badges (P1, P2, P3) using built-in SVG icon sets.
  - Interactive click-to-toggle directly on the canvas node or via Floating Menu.
- [ ] **Dedicated Topic Notes Drawer / Split-Screen Editor**:
  - Expandable side panel / drawer to view and write comprehensive Markdown notes for the active node.
  - Keeps complex thoughts and meeting notes docked cleanly without cluttering the visual canvas.
- [ ] **Rich Node Content & Attachments**:
  - Node icons / emoji picker (priority, progress, flags, stars from engine icon library).
  - Hyperlinks with preview tooltip and title.
  - Image attachments with inline resizing handle.

### 3.2 Canvas Navigation & Ergonomics (EdrawMind v8.0, v9.0, v10.0)
- [ ] **Format Painter (Style Cloner)**:
  - One-click copy/paste of topic styles (shape, fill color, border width, border color, font styling).
  - Powered by the built-in `Painter` engine plugin; accessible via Ribbon *Home* tab and Floating Bubble menu.
- [ ] **Spacebar Quick-Pan**:
  - Hold `Spacebar` + drag left mouse button to pan smoothly across the infinite canvas (Figma & EdrawMind standard).
- [ ] **Canvas Mini-Map (Bird's Eye Navigator)**:
  - Collapsible thumbnail preview overlay in bottom-right corner showing current viewport bounds over the entire diagram.
  - Powered by the built-in `MiniMap` engine plugin.
- [ ] **Floating Topics**:
  - Double-click on empty canvas area to spawn an independent "Floating Idea" node with its own branching hierarchy.

### 3.3 Structural Annotations & Branch Grouping (EdrawMind v10.0, v11.0)
- [ ] **Interactive Relationship Lines**:
  - Drag-and-drop bezier relationship arrows connecting any two arbitrary nodes across branches.
  - Midpoint handle dragging for curvature adjustment and inline editable label text.
- [ ] **Custom Boundaries (Frames)**:
  - Enclose subtrees or node clusters in a styled bounding frame with custom background tint, stroke dash, and title.
- [ ] **Summary Brackets**:
  - Group sibling branches with curly braces (`{`) and attach summary conclusion topics.
- [ ] **Auto-Numbering Schemes**:
  - Toggle hierarchical numbering prefixes across the map or branches (e.g., `1.`, `1.1.`, `1.1.1.` or `A.`, `B.`, `C.`).

### 3.4 Presentation Mode & Smart Import (EdrawMind v12.0, v12.3.18)
- [ ] **Pitch / Fullscreen Presentation Mode**:
  - Turn mind maps into instant slideshows without exporting to PowerPoint.
  - Step-by-step traversal with `ArrowRight` / `Space` camera zooms smoothly into each branch.
  - Powered by the built-in `Demonstrate` engine plugin.
- [ ] **Local Folder Structure Import (Folder-to-MindMap)**:
  - Select a local directory (via native dialog in Tauri or `<input webkitdirectory>` in web) to automatically generate an organized mind map tree of project files and folders with direct hyperlinks.

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
