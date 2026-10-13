# ZenMind v0.1.2 Release Plan

Status: draft, 2026-10-13. Companion to [`CODE_REVIEW.md`](CODE_REVIEW.md), which holds the full findings and their status.

## Where we are

- `v0.1.0` and `v0.1.1` are tagged. `v0.1.1` (2026-10-13) was a docs/CI release: its `package.json`, `Cargo.toml` and `tauri.conf.json` still say `0.1.0`.
- Since `v0.1.1`, 8 commits (33 files) landed on `main`: multi-document tabs and a New button, plus fixes for most of the code-review baseline (engine data and theme bugs, tab/dirty tracking, security hardening, AI error handling, file-format detection, accessibility, keyboard shortcuts).
- Everything above was verified by `npm run lint`, `npm run build` and manual checks in Chrome against the web build. **Nothing has been run in a built Tauri desktop app**, and the repo has no automated tests.

## Goal of 0.1.2

A stabilisation release: ship the fixes already on `main`, prove the desktop build still works with the new permissions and CSP, close the import/export data-loss items, and add a small test safety net. No new feature work beyond tabs.

## Scope

### Release gates (must pass before tagging)

| # | Item | Why | How to verify |
|---|------|-----|---------------|
| G1 | **Desktop smoke test** on at least Linux and Windows builds | The Tauri CSP, the narrowed capabilities (`fs:allow-read-file/read-dir/write-file`, `dialog:allow-open/save`) and the recursive folder grant have never run in a built app. A wrong permission would break Open/Save silently. `fs:default` did not include write-file, so Save may have been broken in 0.1.0/0.1.1 as well. | Build with `npm run desktop:build`. Open each format, Save, Save As, re-Save, open a folder via Folder Import, open a `.xmind`. Check the devtools console for CSP violations. |
| G2 | **CSP check in the desktop webview** | The policy was only validated against the web build in Chrome. Tauri adds its own `ipc:` origins and injects scripts. | Launch, edit, export PNG/PDF/SVG, use the formula dialog, call an AI endpoint (local Ollama and Gemini). Fix or relax the policy if anything is blocked. |
| G3 | **Version bump and release notes** (done: versions are 0.1.2, `release.yml` body is version-agnostic, `CHANGELOG.md` added; remaining: replace "Unreleased" with the date when tagging) | `release.yml` hard-codes "ZenMind v0.1.0" in the release body. Version fields were never bumped for 0.1.1. | See "Release chores". |
| G4 | `npm run lint` and `npm run build` green in CI on the release commit | Existing CI gate. | CI. |

### Should fix in 0.1.2 (the remaining data-loss and robustness items)

**Status: S1–S6 are done** (commit following this plan; see `CODE_REVIEW.md` for details). The release gates G1–G4 and the release chores remain.

| # | Item (CODE_REVIEW #) | Effort | Notes |
|---|----------------------|--------|-------|
| S1 | **FreeMind/OPML export drops notes, hyperlinks, tags and writes raw HTML into OPML notes** (#10) | M | Data loss on a core promise ("open formats, no lock-in"). Add the fields to `serializeNode`, strip HTML for OPML notes, add round-trip tests. |
| S2 | **Folder import robustness** (#25) | S | Per-directory `try/catch`, an entry/depth cap with a visible "truncated" note, and `join` paths with the native separator. |
| S3 | **Ribbon quick-export buttons have no error handling** (Low) | S | Wrap in the same try/catch the Export dialog uses and show the same error. |
| S4 | **JSON import silently falls back to Markdown on a parse failure** (Low) | S | Surface a parse error for `.zenmind`/`.json` instead of importing garbage as "Imported Document". |
| S5 | **Minimal automated tests** | M | Add Vitest. Cover `sanitize.ts` (links and HTML), `MindMapFormatService` parse/serialise round-trips (OPML, FreeMind, Markdown), and the content-signature normaliser. Add `npm test` to `ci.yml`. These are the areas where recent bugs clustered. |
| S6 | **Navigator minimap scaling** (new, not investigated) | S–M | The viewport box is much larger than the map and the preview is clipped. Reproduce, then fix the box/scale calculation. Drop it from the release if the cause is deep in the vendored plugin. |

### Nice to have (only if time remains)

- Backdrop click closes dialogs (the keyboard path already works).
- Multi-node style change creates one undo step instead of one per node.
- Mobile bottom bar parity with the ribbon (Delete, Notes, Image, Save/Open).
- Remove the unused `setNodeText` helper or give it a caller.

### Explicitly deferred (not in 0.1.2)

- Tightening `style-src 'unsafe-inline'` and `img-src`/`connect-src https:` in the CSP (needs a product decision on user image URLs and arbitrary AI endpoints).
- Sanitising the minimap SVG separately (mitigated by import sanitising plus the CSP).
- Completing `simple-mind-map.d.ts` typings and removing `as any` casts.
- Presentation-mode event de-duplication (no consumers yet) and read-only guards on icon clicks.
- Everything in `ROADMAP.md` for v0.2.0 (templates, vim navigation, history snapshots).

## Suggested order of work

1. **G1/G2 first.** These can invalidate earlier work, so find out early. If Save or Open fails, fix the capability list before anything else.
2. S2, S3, S4 (small, independent).
3. S1 with tests, then S5 (set up Vitest early enough that S1 can use it; S5's other suites can follow).
4. S6 if it reproduces cleanly.
5. Release chores, then tag.

## Release chores

1. Bump `version` to `0.1.2` in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`; refresh `package-lock.json` and `src-tauri/Cargo.lock`.
2. Make `release.yml`'s release body version-agnostic (it currently says "v0.1.0") and add a "What's new" section. Draft:
   - **New:** multiple documents in tabs; New Map (Ctrl/Cmd+N desktop, Alt+N web).
   - **Fixed:** theme and branch-style changes, rainbow branches, floating topics, minimap drag, undo/dirty tracking, keyboard shortcuts on the canvas, auto-numbering, AI errors, file-format detection, desktop `.xmind` open and Save permissions.
   - **Security:** Content Security Policy, narrower desktop permissions, link and imported-content sanitising, API keys no longer bundled into the client.
   - **Accessibility:** tab and dialog keyboard support, labelled controls.
3. Add a `CHANGELOG.md` (none exists) seeded from the list above, and link `docs/CODE_REVIEW.md` from `README.md` or `CONTRIBUTING.md`.
4. Update `ROADMAP.md`: mark 0.1.2 as the stabilisation release and keep v0.2.0 as the next feature milestone.
5. Tag `v0.1.2` from `main` after the gates pass. The `release.yml` workflow builds on tag push (`v*`).

## Go / no-go

Ship when G1–G4 pass and S1, S2 and S5 are done. S3, S4 and S6 can slip to 0.1.3 without blocking the release. If G1 fails and the fix is not quick, hold the release: a broken Save is worse than a late release.

## Risks

- **Tauri v3 is an alpha** (`3.0.0-alpha.x`). Permission identifiers were checked against the plugin sources, but alpha APIs can still change under us. Pin versions and note this in the release.
- **First-ever desktop run of the new CSP.** Budget time to adjust it.
- **Dirty tracking relies on the library's data shape.** The content signature ignores `dir` and empty objects; another library-added field could make fresh tabs look modified. S5's signature tests are the guard.
- **Reviewer findings were not all reproduced.** Items marked "plausible" in `CODE_REVIEW.md` should be reproduced before spending time on them.
