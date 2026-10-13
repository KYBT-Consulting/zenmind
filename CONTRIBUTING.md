# Contributing to ZenMind 🧠

Thank you for your interest in contributing to **ZenMind**! ZenMind is an open-source, modern EdrawMind alternative built for cross-platform mind mapping productivity.

This project is proudly maintained by [KYBT Consulting](https://kybtconsulting.com) — makers of [Vertaxa EA](https://vertaxa.online) — and community contributors.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Coding Standards & Conventions](#coding-standards--conventions)
- [Pull Request Checklist](#pull-request-checklist)

---

## 🤝 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please treat fellow contributors with respect and kindness.

---

## 🛠️ Prerequisites

- **Node.js**: `v22.x+` or `v26.x Current`
- **npm** or **pnpm**
- **Rust Toolchain** *(Optional, only needed for native desktop development)*:
  - Rust `1.85+` (`rustup default stable`)
  - OS-specific build tools:
    - **Fedora / RHEL (`dnf`)**: `sudo dnf install webkit2gtk4.1-devel openssl-devel libappindicator-gtk3-devel librsvg2-devel libxdo-devel rpm-build gcc gcc-c++ make`
    - **Ubuntu 24.04+ / Debian (`apt`)**: `sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf libsoup-3.0-dev libssl-dev rpm build-essential`
    - **macOS**: Xcode Command Line Tools
    - **Windows**: Microsoft C++ Build Tools & WebView2 runtime

---

## 🚀 Development Setup

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/KYBT-Consulting/zenmind.git
   cd zenmind
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Web Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run Native Desktop Dev (Tauri v3 Alpha)**:
   ```bash
   npm run desktop:dev
   ```

5. **Lint and Typecheck**:
   ```bash
   npm run lint
   ```

6. **Unit Tests**:
   ```bash
   npm test
   ```

7. **Production Web Build**:
   ```bash
   npm run build
   ```

---

## 🏗️ Project Architecture

```
zenmind/
├── src/
│   ├── components/
│   │   ├── canvas/          # Mind map SVG canvas and mini-map navigator
│   │   ├── dialogs/         # AI Assistant, Formula (KaTeX), Image, and Export modals
│   │   ├── floating/        # In-canvas floating bubble menu
│   │   ├── inspector/       # Docked Format Inspector sidebar (Style, Tasks, Notes, Structure)
│   │   ├── mobile/          # Responsive mobile bottom navigation bar
│   │   ├── outline/         # Synchronized tree outline panel
│   │   ├── ribbon/          # EdrawMind-style tabbed ribbon toolbar
│   │   └── statusbar/       # Canvas status bar (zoom, topic count, pitch mode)
│   ├── engine/
│   │   └── MindMapEngine.ts # High-level engine API wrapper and callbacks
│   ├── services/
│   │   ├── aiService.ts          # Gemini & OpenAI-compatible LLM abstraction
│   │   ├── desktopFileService.ts # Tauri native direct-to-disk filesystem service
│   │   ├── folderImportService.ts# Folder tree to mind map converter
│   │   └── mindMapFormatService.ts # Universal parser (.zenmind, .xmind, .md, .opml, .mm)
│   ├── vendor/
│   │   └── simple-mind-map/      # Internalized SVG rendering engine
│   ├── App.tsx                   # Top-level workspace shell and state coordinator
│   └── main.tsx                  # React DOM mount point
├── src-tauri/                    # Rust backend and desktop packaging (Tauri v3 Alpha)
├── .github/
│   └── workflows/
│       ├── ci.yml                # Automated linting and typecheck workflow
│       ├── deploy-pages.yml      # Automated web demo deployment to GitHub Pages
│       └── release.yml           # Multi-platform native desktop release matrix
```

---

## 🔄 Development Workflow

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/my-new-feature
   # or
   git checkout -b fix/issue-description
   ```

2. Make your modifications following our code guidelines.

3. Verify that typechecking and bundling pass with zero errors:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add keyboard shortcut for boundary creation"
   ```

5. Push and open a Pull Request against `KYBT-Consulting/zenmind:main`.

---

## 📐 Coding Standards & Conventions

- **TypeScript**: Strict type checking with zero unused variables or implicit `any` types.
- **Tailwind CSS**: Use utility classes consistently.
- **Component Design**: Keep UI components modular, responsive, and accessible.
- **Engine Isolation**: Keep DOM and React concerns decoupled from the core SVG rendering engine in `src/engine/`.
- **Preserve Documentation**: Preserve existing code comments and architectural notes.

---

## ✅ Pull Request Checklist

Before opening your pull request, please make sure you have:

- [ ] Tested your changes locally in the browser (`npm run dev`).
- [ ] Run `npm run lint` and resolved all TypeScript errors.
- [ ] Run `npm test` and kept the tests passing (add tests for logic you change, especially parsing, sanitising and export).
- [ ] Run `npm run build` and verified that Vite bundles without warnings or errors.
- [ ] Kept commit messages informative and formatted using Conventional Commits.
- [ ] Updated documentation or `README.md` if introducing new features or shortcuts.

Looking for something to work on? [`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md) lists known issues and their status, and [`docs/RELEASE_PLAN_0.1.2.md`](docs/RELEASE_PLAN_0.1.2.md) describes the next release.

Thank you for helping make ZenMind the best open-source mind mapping tool! 🚀
