# ZenMind 🧠

> An open-source, modern EdrawMind alternative built for cross-platform productivity (Linux, Windows, macOS, and Mobile).
> 
> **[🌐 Try Live Demo](https://kybt-consulting.github.io/zenmind/)** · **[🗺️ Product Roadmap](./ROADMAP.md)** · **[Contributing Guidelines](./CONTRIBUTING.md)** · **[Architecture Spec](./NEXT_STEPS.md)**
>
> Maintained with ❤️ by **[KYBT Consulting](https://kybtconsulting.com)** — makers of **[Vertaxa EA](https://vertaxa.online)**.

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
- **Cross-Platform Ready**: Native desktop releases via **Tauri v3 Alpha** (Linux RPM, Ubuntu DEB, AppImage, macOS Universal DMG, Windows MSI/EXE, and Windows Portable ZIP).

---

## 📦 Desktop Downloads & Linux Packages

> [!NOTE]
> ZenMind desktop packages are currently built against **Tauri v3 Alpha** (`3.0.0-alpha.x`). Because Tauri v3 is an early preview release, compiled OS-specific packages (Windows, macOS, and Linux) may encounter experimental edge cases or platform-specific quirks. If you experience an issue on your OS, please submit an issue on GitHub or try the zero-install [Web Demo](https://kybt-consulting.github.io/zenmind/) or [Docker container](#-self-hosting-with-docker-web-application).

ZenMind binaries and installer bundles are published for every release under [GitHub Releases](https://github.com/KYBT-Consulting/zenmind/releases):

| Platform | Package Format | Installation / Run Command |
| :--- | :--- | :--- |
| **Fedora / RHEL / CentOS** | `.rpm` | `sudo dnf install ./ZenMind-0.1.2-1.x86_64.rpm` |
| **Ubuntu 24.04+ / Debian** | `.deb` | `sudo dpkg -i ./ZenMind_0.1.2_amd64.deb` |
| **Universal Linux** | `.AppImage` | `chmod +x ./ZenMind_0.1.2_amd64.AppImage && ./ZenMind_0.1.2_amd64.AppImage` |
| **Docker (Self-Hosted Web)** | Container Image | `docker compose up -d` (Access via `http://localhost:3000`) |
| **macOS** | `.dmg` | Universal DMG (Apple Silicon M-Series & Intel x86_64) |
| **Windows (Installer)** | `.msi` / `.exe` | Windows 64-bit installer & NSIS setup |
| **Windows (Portable)** | `.zip` | Zero-install standalone ZIP (runs from USB or any folder with local data) |
| **Web Demo** | Browser | [kybt-consulting.github.io/zenmind](https://kybt-consulting.github.io/zenmind/) |

### 🐳 Self-Hosting with Docker (Web Application)

You can self-host ZenMind in your private home lab, NAS, or server using our lightweight, production-ready Nginx container (~25MB):

```bash
# Option 1: Using Docker Compose (Recommended)
docker compose up -d

# Option 2: Build and run with Docker CLI
docker build -t zenmind:latest .
docker run -d -p 3000:80 --name zenmind --restart unless-stopped zenmind:latest
```

Open `http://localhost:3000` in your web browser. All brainstorming and AI capabilities (including local Ollama / LM Studio connections) function natively.

---

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js (v22+ or v26 Current)
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

## 🗺️ Product Roadmap & Specifications

- **[Product & Feature Roadmap](./ROADMAP.md)**: Explore the milestone horizons (v0.2.0 starter templates & keyboard shortcuts, v0.3.0 P2P sync & Obsidian integration, v1.0.0 mobile apps & plugin ecosystem).
- **[Technical Architecture & Specs](./NEXT_STEPS.md)**: Comprehensive architectural decisions, data models, and component documentation.
- **[Contributing Guide](./CONTRIBUTING.md)**: Guidelines on how to propose features, report issues, and submit PRs.

---

## 🏢 About the Maintainer

**ZenMind** is proudly built and maintained by **[KYBT Consulting](https://kybtconsulting.com)**, creators of **[Vertaxa EA](https://vertaxa.online)** (Enterprise Architecture in minutes with AI built-in from the ground up).

---

## 🙏 Acknowledgements & Credits

ZenMind's core mind mapping layout algorithms and SVG engine are based upon the open-source **[simple-mind-map](https://github.com/wanglin2/mind-map)** project by **Wang Lin** ([@wanglin2](https://github.com/wanglin2)), released under the MIT License. We are deeply grateful to Wang Lin and the MindMap contributors for their foundational work.

---

## 📜 License

MIT License. Open source and community driven. See [LICENSE](./LICENSE) for full terms and third-party notices.
