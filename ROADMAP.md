# ZenMind Product & Technical Roadmap 🗺️

Welcome to the **ZenMind** strategic product and technical roadmap. This document outlines our product vision, milestones delivered, and the upcoming feature pipeline for our open-source, modern EdrawMind alternative.

ZenMind is maintained by **[KYBT Consulting](https://kybtconsulting.com)**, creators of **[Vertaxa EA](https://vertaxa.online)**.

---

## 🎯 Core Product Vision & Guiding Principles

ZenMind is built to deliver an uncompromised mind mapping and visual thinking experience guided by four pillars:

1. **Local-First & Zero Vendor Lock-in**: Your mind maps and notes belong to you. We use open, human-readable formats (`.zenmind`, Markdown, OPML) and never gate your data behind proprietary clouds.
2. **Private & Pluggable AI Copilot**: First-class support for 100% local, offline LLMs (Ollama, LM Studio, vLLM) as well as cloud providers (Gemini, OpenAI, Groq, DeepSeek). Your ideas remain private.
3. **Ultra-Lightweight Native Performance**: Built on **Tauri** and native web standards. Fast launch times, under ~40MB RAM usage, and instant responsiveness without Electron bloat.
4. **EdrawMind & Office Ergonomics**: A familiar, productive ribbon interface paired with an infinite, fluid SVG canvas.

---

## 📍 Release Horizons

```
  v0.1.x (Stabilisation)      v0.2.0 (Near-Term)          v0.3.0 (Mid-Term)           v1.0.0 (Long-Term)
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ • Tabs, New Map      │    │ • Template Gallery   │    │ • Obsidian Vault Link│    │ • Plugin Ecosystem   │
│ • Security & a11y    │───▶│ • Keyboard Nav (Vim) │───▶│ • Voice-to-Map Audio │───▶│ • Tauri Mobile (iOS) │
│ • Format fidelity    │    │ • History Snapshots  │    │ • Tag & Task Filters │    │ • Freehand Canvas    │
│ • Unit tests         │    │ • Rich-Text Callouts │    │ • Focus & Zen Mode   │    │ • PPTX Slide Export  │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

---

## 🟢 v0.1.2 — Stabilisation Release [COMPLETED]

A bug-fix and hardening release that follows a full code review ([`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md)); see [`docs/RELEASE_PLAN_0.1.2.md`](docs/RELEASE_PLAN_0.1.2.md) and the [changelog](CHANGELOG.md).

* [x] Multiple maps in tabs, a New Map action, and reliable unsaved-changes tracking.
* [x] Security hardening: Content Security Policy, narrower desktop permissions, link and imported-content sanitising.
* [x] Notes, links and tags survive OPML and FreeMind export.
* [x] Keyboard shortcuts, auto-numbering, theme and branch-style fixes.
* [x] Accessibility: tab and dialog keyboard support, labelled controls.
* [x] Unit tests in CI.

---

## 🟢 v0.1.0 — Initial Desktop & Web Foundation [COMPLETED]

* [x] **Headless Mathematical SVG Engine**: Dynamic layout trees, logic charts, org charts, fishbone diagrams, and timelines.
* [x] **Unbounded Floating Ideas**: Double-click free placement and custom coordinates anywhere on canvas.
* [x] **EdrawMind UI Suite**: Ribbon toolbar (Home, Insert, Page Style, View, AI), synchronized Outline drawer, and docked Format Inspector.
* [x] **Task & Visual Metadata**: Checkbox completion tracking, progress meters (0%–100%), priority badges (P1–P5), and Markdown notes drawer.
* [x] **Structural Annotations**: Curved bezier relationship lines, boundary frames, summary brackets, and auto-numbering schemes.
* [x] **AI Copilot**: Native integrations for Google Gemini and custom OpenAI-compatible endpoints (Ollama, LM Studio).
* [x] **Multi-Format Interoperability**: Import and export for PNG, SVG, PDF, XMind archives, OPML 2.0, and FreeMind XML.
* [x] **Multi-Platform Desktop & CI/CD**:
  - Fedora 44 RPM and dedicated OCI container.
  - Ubuntu 24.04+ DEB and universal AppImage.
  - macOS Universal DMG (Apple Silicon & Intel).
  - Windows 64-bit MSI and standalone executable.
* [x] **Live Web Demo**: Automated continuous deployment to [GitHub Pages](https://kybt-consulting.github.io/zenmind/).

---

## 🟢 v0.2.0 — Power User & Canvas Depth [COMPLETED]

**Target**: Q2 2026

### 1. Starter Template Gallery
* [x] 1-click starter template library with visual previews:
  - **Strategic Planning**: SWOT Analysis, PESTEL, Porter's Five Forces.
  - **Project Management**: Eisenhower Priority Matrix, Sprint Roadmap, Risk Assessment.
  - **Engineering & Systems**: Root Cause (5 Whys), Fishbone Ishikawa, System Architecture.
  - **Organization & Team**: Org Chart with avatars and job titles.
* [x] Ability to save any custom mind map as a reusable personal template.

### 2. Canvas Ergonomics & Keyboard Mastery
* [x] **Full Keyboard Navigation**:
  - Spatial arrow key navigation across parent, sibling, and child nodes (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`).
  - Optional **Vim Mode** navigation (`h`, `j`, `k`, `l`, `o` for new child, `O` for sibling).
  - Configurable keyboard shortcut mapping dialog.
* [x] **Inline Rich Text Upgrades**:
  - Direct canvas Markdown shortcuts (e.g. `**bold**`, `*italic*`, `` `code` ``).
  - Live preview popover for KaTeX mathematical formulas.
  - Text highlighter tints and callout badges.

### 3. Map Versioning & Undo Tree
* [x] **Autosave Snapshots**: Periodic non-destructive project snapshots stored locally.
* [x] **History Timeline Drawer**: Visual slider to inspect earlier revision states and roll back changes.

### 4. Context Menus, Tree Folding & Version Tracking
* [x] **Right-Click Context Menus**: Full topic and canvas background right-click menus with clipboard, duplicate, reordering, task progress, priority, and branch folding.
* [x] **Expand / Collapse Controls**: 1-click Expand All, Collapse All, and Level 1–3 folding across the Ribbon, Outline Panel, and Status Bar.
* [x] **About & Version Diagnostics**: In-app version badge and About dialog with runtime/environment copy support.

---

## 🔵 v0.3.0 — Personal Knowledge Management (PKM) & Focus Workflows

**Target**: Q3 2026

### 1. Personal Knowledge Management (PKM) Integration
* [ ] **Local Obsidian Vault Integration**:
  - Convert Obsidian note folders and tags into dynamic ZenMind visual branches.
  - Link individual topics directly to `.md` notes in local Obsidian vaults with URI scheme support (`obsidian://open?vault=...`).
* [ ] **Voice-to-Map Audio Notes**:
  - Real-time voice dictation with automatic branch clustering powered by Web Speech API and local Whisper models.

### 2. Focus Mode & Advanced Filtering
* [ ] **Branch Hoisting / Focus Mode**: Drill down into any sub-branch as a temporary root to focus on complex subtrees without visual clutter.
* [ ] **Tag, Priority & Task Filter View**: Filter or dim topics on the canvas and outline by priority (`P1`–`P5`), completion status (`0%`–`100%`), or custom tags.

---

## 🟣 v1.0.0 — Extensibility, Mobile & Enterprise Ecosystem

**Target**: Late 2026 / 2027

### 1. Plugin & Extension Architecture
* [ ] Safe sandboxed JavaScript/Wasm plugin API.
* [ ] Custom node decorators, themes, and ribbon menu contributions.
* [ ] Custom AI prompt workflows and local tool automation.

### 2. Native Mobile & Tablet Applications
* [ ] Native **iOS** and **iPadOS** packages via Tauri v3 Mobile with Apple Pencil stylus annotation support.
* [ ] Native **Android** packages via Tauri v3 Mobile with touch gesture optimization.

### 3. Hybrid Freehand Whiteboard Mode
* [ ] Seamless switching between structured hierarchical mind maps and unstructured infinite canvas.
* [ ] Sticky notes, freehand drawing with vector smoothing, and shape primitives.

### 4. Advanced Export Suite
* [ ] Microsoft PowerPoint (`.pptx`) export: Automatically convert branch hierarchies into structured presentation slide decks.
* [ ] Multi-page high-resolution print PDF with clickable node hyperlinks and vector embedded fonts.

---

## 🗳️ How Features are Prioritized & How to Contribute

ZenMind is community-guided. We prioritize roadmap development through open GitHub discussions:

1. **Request a Feature**: Open a [Feature Request](https://github.com/KYBT-Consulting/zenmind/issues/new?template=feature_request.yml) on GitHub.
2. **Community Voting**: We gauge interest through thumbs-up (`👍`) reactions on feature proposals.
3. **RFC Process**: Substantial architectural changes (such as the plugin system or CRDT sync) will be published as Request for Comments (RFCs) in GitHub Discussions.
4. **Pick Up an Issue**: Check out issues tagged with [`good first issue`](https://github.com/KYBT-Consulting/zenmind/issues?q=label%3A%22good+first+issue%22) and see [`CONTRIBUTING.md`](./CONTRIBUTING.md) to get started!

---

*Last Updated: October 2026* | Maintained by **[KYBT Consulting](https://kybtconsulting.com)**
