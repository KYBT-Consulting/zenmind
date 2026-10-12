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
- [x] **Task / Todo Checkboxes & Progress Tracking**:
  - Add checkbox attribute to topics with completion states (`Not Started`, `In Progress`, `Completed`).
  - Progress markers (0%, 25%, 50%, 75%, 100%) and Priority badges (P1–P5) using built-in SVG icon sets.
  - Interactive click-to-toggle directly on the canvas node or via Floating Menu / Inspector.
- [x] **Dedicated Topic Notes Drawer / Split-Screen Editor**:
  - Dedicated docked Notes tab in Format Inspector to view and write comprehensive Markdown notes for the active node with auto-save.
  - Keeps complex thoughts and meeting notes docked cleanly without modal dialogs cluttering the canvas.
- [x] **Rich Node Content & Attachments**:
  - Image attachments with inline resizing handle via `ImageDialog` and `NodeImgAdjust`.
  - LaTeX mathematical formulas rendering via `FormulaDialog` and `katex`.

### 3.2 Canvas Navigation & Ergonomics (EdrawMind v8.0, v9.0, v10.0)
- [x] **Format Painter (Style Cloner)**:
  - One-click copy/paste of topic styles (shape, fill color, border width, border color, font styling).
  - Powered by the built-in `Painter` engine plugin; accessible via Ribbon *Home* tab, Floating Bubble menu, and Status Bar.
- [x] **Spacebar Quick-Pan**:
  - Hold `Spacebar` + drag left mouse button to pan smoothly across the infinite canvas (Figma & EdrawMind standard).
- [x] **Canvas Mini-Map (Bird's Eye Navigator)**:
  - Collapsible thumbnail preview overlay in bottom-right corner showing current viewport bounds over the entire diagram.
  - Powered by the built-in `MiniMap` engine plugin with interactive draggable viewport rectangle.
- [x] **Floating Topics**:
  - Double-click on empty canvas area or click Floating Topic in Ribbon/Insert to spawn an independent "Floating Idea" node with its own branching hierarchy.

### 3.3 Structural Annotations & Branch Grouping (EdrawMind v10.0, v11.0)
- [x] **Interactive Relationship Lines**:
  - Drag-and-drop bezier relationship arrows connecting any two arbitrary nodes across branches.
  - Midpoint handle dragging for curvature adjustment and inline editable label text.
- [x] **Custom Boundaries (Frames)**:
  - Enclose subtrees or node clusters in a styled bounding frame with custom background tint, stroke dash, and title.
- [x] **Summary Brackets**:
  - Group sibling branches with curly braces (`{`) and attach summary conclusion topics.
- [x] **Auto-Numbering Schemes**:
  - Toggle hierarchical numbering prefixes across the map or branches (e.g., `1.`, `1.1.`, `1.1.1.` or `A.`, `B.`, `C.`).

### 3.4 Presentation Mode & Smart Import (EdrawMind v12.0, v12.3.18)
- [x] **Pitch / Fullscreen Presentation Mode**:
  - Turn mind maps into instant slideshows without exporting to PowerPoint.
  - Step-by-step traversal with `ArrowRight` / `Space` camera zooms smoothly into each branch.
  - Powered by the built-in `Demonstrate` engine plugin.
- [x] **Local Folder Structure Import (Folder-to-MindMap)**:
  - Select a local directory (via native dialog in Tauri or `<input webkitdirectory>` in web) to automatically generate an organized mind map tree of project files and folders with direct hyperlinks.

---

## 4. Milestone 3: Mobile & Touch Support (Tauri Mobile + PWA) [COMPLETED]

**Goal**: Deliver a first-class mobile experience across smartphones and tablets (Android, iOS, iPadOS).

### 4.1 Responsive Mobile UI Shell
- [x] **Adaptive Navigation**:
  - On viewports `< 768px`, replace desktop status bar with a **Responsive Mobile Bottom Navigation Drawer** (`MobileBottomBar.tsx`).
  - Quick action floating pill at bottom: `Subtopic`, `Topic`, `Fit`, `Style`, `Outline`, `AI`, `Undo/Redo`.
- [x] **Mobile Sheet Drawers**:
  - Format inspector converts to a smooth slide-over drawer with full touch scrolling.
  - Outline panel converts to a full slide-over drawer with tap-to-focus navigation.

### 4.2 Touch Gestures & Interactivity
- [x] 2-finger pinch-to-zoom with smooth inertial scaling via `TouchEvent` engine plugin.
- [x] 2-finger panning across the infinite canvas.
- [x] Context floating bubble menu for rapid direct-manipulation node styling.

---

## 5. Milestone 4: Multi-Format Compatibility Suite [COMPLETED]

**Goal**: Seamless interoperability with the broader mind mapping ecosystem.

- [x] Unified `MindMapFormatService.ts` parsing and exporting across all standard industry formats.
- [x] Canvas drag-and-drop drop zone with visual glassmorphism target overlay.
- [x] Expanded multi-format `ExportDialog.tsx` with high-res PNG, crisp SVG, print PDF, XMind archives, OPML 2.0, FreeMind XML, and native ZenMind projects.
- [x] Multi-format desktop file filters integrated into `DesktopFileService.ts`.

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

## 5.1 AI Copilot & Multi-Provider Architecture [COMPLETED]

- [x] Dual-engine provider abstraction supporting **Google Gemini** & **OpenAI-Compatible** APIs.
- [x] Ready presets for local LLMs: **Ollama** (`http://localhost:11434/v1`) & **LM Studio** (`http://localhost:1234/v1`).
- [x] Cloud alternatives: **OpenAI**, **Groq**, **DeepSeek**, and **OpenRouter**.
- [x] Real-time diagnostic ping / connection tester in the AI settings modal.
- [x] Prompt generation for full map brainstorming and active-node tree expansion.

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

The next milestone to complete is **Milestone 5 (Open Source Governance & Release)**:
1. Create `CONTRIBUTING.md` and GitHub issue templates (`.github/ISSUE_TEMPLATE/`).
2. Add GitHub Pages automated demo deployment workflow (`.github/workflows/deploy-pages.yml`).
