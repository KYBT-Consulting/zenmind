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
- **Rich Mind Map Primitives**: Summaries (curly braces), Boundaries (outer frames), Relationship lines, Floating topics, Notes, and Hyperlinks.
- **Bi-Directional Outline Sync**: Split-screen Notion-style hierarchical outline synchronized with the canvas.
- **Context Floating Bubble Toolbar**: Rapidly add subtopics (`Tab`), siblings (`Enter`), colors, and shapes directly over selected nodes.
- **Format Inspector Sidebar**: Fine-grained styling for shapes, branch bezier curves, rainbow branch palettes, and harmonious theme presets.
- **AI-Powered Brainstorming**: Powered by Google Gemini 2.5 Flash to generate full mind maps from prompts or expand subtopics automatically.
- **Multi-Format Export**: PNG, SVG (vector), PDF, Markdown, and JSON.
- **Cross-Platform Ready**: Designed for native desktop packaging via **Tauri v2** (Linux, Windows, macOS) and mobile/PWA deployment.

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
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Cmd + Y` | Redo |
| `Ctrl + S` / `Cmd + S` | Save File (`.zenmind`) |
| `Ctrl + O` / `Cmd + O` | Open File |
| `Double Click` / `Space` | Edit Topic Text |

---

## 📄 Architecture & Roadmap

For full technical specifications, architecture decisions, and roadmap, see [`zenmind-architecture-plan.md`](./zenmind-architecture-plan.md).

---

## 📜 License

MIT License. Open source and community driven.
