# ZenMind 🧠

> An open-source, modern EdrawMind alternative built for cross-platform productivity (Linux, Windows, macOS, and Mobile).

---

## 🌟 Highlights

- **EdrawMind-Style Ribbon Interface**: Familiar tabs (*Home*, *Insert*, *Page Style*, *View*, *AI Assistant*, *Export*) for rapid brainstorming.
- **10+ Structural Layouts**:
  - Radial Mind Map (classic)
  - Logic Charts (Left & Right)
  - Organization Charts
  - Catalog Trees
  - Horizontal & Vertical Timelines
  - Ishikawa Fishbone Diagrams (Cause & Effect)
- **Multi-Format Compatibility Suite (Import & Export)**:
  - **.zenmind**: Native lossless JSON schema
  - **.xmind**: Standard XMind 8 & XMind Zen archives
  - **.md**: Markdown outline trees (Obsidian, Notion, Logseq ready)
  - **.opml**: OPML 2.0 outlines (MindNode, OmniOutliner, Workflowy)
  - **.mm**: FreeMind & Freeplane open XML standard
  - **PNG / SVG / PDF**: High-res raster, infinite vector graphics, and print-ready PDFs
  - **Canvas Drag & Drop**: Drop any supported file directly onto the canvas to load instantly
- **EdrawMind Structural Annotations**:
  - **Boundary Frames**: Highlight node clusters with custom background tints, border dash styles, and titles.
  - **Relationship Lines**: Connect arbitrary nodes across branches with interactive bezier curves and editable labels.
  - **Summary Brackets**: Group sibling branches with curly braces (`{`) and conclusion topics.
  - **Auto-Numbering Schemes**: Hierarchical decimal (`1.`, `1.1.`, `1.1.1.`) or alphabetical prefixes.
- **Mobile & Touch Optimized**:
  - Responsive **Mobile Bottom Navigation Drawer** on viewports `< 768px`.
  - Multi-touch 2-finger pinch-to-zoom and canvas panning.
  - Responsive slide-over drawers for Format Inspector and Outline panel.
- **Rich Media & Attachments**:
  - Image attachments with inline interactive hover resizing handles.
  - LaTeX mathematical equations rendering via KaTeX.
- **Canvas Ergonomics & Navigation**:
  - Format Painter style cloner for 1-click styling transfer.
  - Spacebar quick-pan (`Space + Drag`) across the infinite canvas.
  - Bird's-eye canvas Mini-Map overlay navigator.
  - Double-click empty canvas to spawn independent **Floating Topics**.
- **Task & Progress Tracking**: Interactive todo checkboxes (0%-100%) and P1-P5 priority badges.
- **AI Mind Map Copilot & Multi-Provider Support**:
  - Full mind map expansion and brainstorm suggestions.
  - Built-in support for **Google Gemini** as well as **OpenAI-compatible endpoints** (`/v1/chat/completions`).
  - Seamless connection to local LLMs via **Ollama** (`http://localhost:11434/v1`) and **LM Studio** (`http://localhost:1234/v1`), plus cloud models (OpenAI, Groq, DeepSeek, OpenRouter).
  - Built-in live connection tester and customizable model names.
- **Dedicated Topic Notes**: Docked split-screen Markdown notes editor for comprehensive documentation.
- **Pitch Presentation Mode**: Instant fullscreen branch-by-branch slideshow presentations.
- **Local Folder Tree Import**: Transform any directory structure into an interactive mind map tree.
- **Cross-Platform Ready**: Designed for native desktop packaging via **Tauri v3 Alpha** (Linux, Windows, macOS) and mobile/PWA deployment.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build for production
npm run build
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Tab` | Add Subtopic (Child) |
| `Enter` | Add Topic (Sibling) |
| `Delete` / `Backspace` | Remove Selected Topic |
| `Space + Drag` | Pan Infinite Canvas |
| `Double Click (Canvas)` | Spawn Floating Topic |
| `Double Click (Topic)` | Edit Topic Text |
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Cmd + Y` | Redo |
| `Ctrl + S` / `Cmd + S` | Save File (`.zenmind`) |
| `Ctrl + O` / `Cmd + O` | Open File |

---

## 📄 Architecture & Roadmap

For full technical specifications, architecture decisions, and roadmap, see [`NEXT_STEPS.md`](./NEXT_STEPS.md).

---

## 📜 License

MIT License. Open source and community driven.
