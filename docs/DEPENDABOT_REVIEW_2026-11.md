# Dependabot alerts review — November 2026

Reviewed 2026-11-16, after the v0.4.1 release (`main` at `20a661b`). Six alerts were open. **None is exploitable in ZenMind as it is built today**, so no hotfix release is needed. The three `zip` alerts are fixed on this branch by removing `zip` from the build; the other three can be dismissed with a reason.

| Alert | Severity | Package | Version in use | Fixed in | Verdict |
|---|---|---|---|---|---|
| 16 | critical | `zip` (Rust) | 4.6.1 | 9.0.5 | Not reachable; removed from the build on this branch |
| 17 | high | `zip` (Rust) | 4.6.1 | 9.0.0 | Same as 16 |
| 18 | medium | `zip` (Rust) | 4.6.1 | 9.0.0 | Same as 16 |
| 15 | medium | `glib` (Rust) | 0.18.5 | 0.20.0 | Vulnerable code not used; blocked on Tauri |
| 13 | low | `deepmerge` (npm) | 4.3.1 | none | Already mitigated by our shim |
| 1 | low | `quill` (npm) | 2.0.3 | none | Vulnerable code not used |

## `zip` 4.6.1 — alerts 16, 17, 18

**Advisories:** zip cloaking via dual-header inconsistencies leading to arbitrary file overwrite (16); unbounded symlink-target handling exhausting memory during extraction (17); AES entry HMAC bypass on premature EOF (18).

**How it got in:** only through `tauri-plugin-updater` 3.0.0-alpha.3, which depends on `zip = "^4"` as an optional dependency, compiled only for `cfg(target_os = "windows")`, behind the plugin's `zip` feature. The `zip` feature is in the plugin's default features (`default = ["rustls-tls", "system-proxy", "zip"]`).

**Why it wasn't exploitable:**
- The updater verifies every downloaded package against our minisign public key (`Update::download` → `self.verify(&buffer)`) before it is installed or extracted. A malicious archive can only reach `zip` if it is signed with ZenMind's update signing key.
- The Windows updater only calls `extract_zip` when the package bytes *are* a zip (`infer::archive::is_zip`). The Windows entries in `latest.json` are the `.msi` and the NSIS `.exe`, not zips. (`createUpdaterArtifacts` is `true`, not `"v1Compatible"`, set in `src-tauri/tauri.updater.conf.json`, which CI passes with `--config`.) The release's `ZenMind-vX-windows-x64-portable.zip` is a manual download, not an updater artifact, and has no `.sig`.

**Why there's no simple version bump:** `zip` 9.x is outside the plugin's `^4` requirement. Upstream status as of this review:
- `tauri-plugin-updater` 3.0.0-alpha.3 is the latest 3.x release; the `v3` branch of `tauri-apps/plugins-workspace` still has `zip = { version = "4", ... }`.
- The stable 2.x line already moved: 2.14.1 depends on `zip = "^9"`.
- No open upstream issue found asking for the bump on 3.x.

**Fix (applied on this branch) — turn off the updater's `zip` feature**, which removes the crate from the build entirely. In `src-tauri/Cargo.toml`:

```toml
tauri-plugin-updater = { version = "3.0.0-alpha.3", default-features = false, features = ["rustls-tls", "system-proxy"] }
```

What the `zip` feature controls (`zip = ["dep:zip", "dep:tar", "dep:flate2"]`), per platform:
- **Windows:** the `zip` crate, used only for zip-wrapped updates, which we don't publish. `.msi`/`.exe` updates don't touch it.
- **macOS:** nothing. `tar` and `flate2` are non-optional macOS dependencies of the plugin, and `install_inner` (which unpacks `ZenMind_universal.app.tar.gz`) isn't behind the feature. macOS is shipped: v0.4.1 has a universal `.dmg` and `.app.tar.gz` + `.sig`, listed in `latest.json` as `darwin-aarch64` and `darwin-x86_64`.
- **Linux:** `tar`/`flate2`, used only for *compressed* (`.tar.gz`) AppImage updates. Ours are plain `.AppImage` files, and `.deb`/`.rpm` updates don't use it.

Verified on Linux:
- `cargo tree -i zip --target all` finds no `zip`. With `--target aarch64-apple-darwin`, the updater still depends on `tar` and `flate2`.
- `Cargo.lock` drops `zip`, `arbitrary`, and `derive_arbitrary`.
- `cargo check --release` passes.

Dependabot closes alerts 16–18 automatically once this is merged to `main`.

## `glib` 0.18.5 — alert 15

**Advisory:** unsoundness in the `Iterator`/`DoubleEndedIterator` impls for `glib::VariantStrIter`.

**How it gets in:** the Linux GTK stack used by Tauri and wry (`gtk`, `gdk`, `webkit2gtk` 2.0.2, `soup3`, `javascriptcore-rs`, `cairo-rs`, `pango`, `atk`, `gio`, all on gtk-rs 0.18). It can't be upgraded to 0.20 on its own; that needs Tauri/wry to move to newer gtk-rs/webkit bindings.

**Why it isn't exploitable:** ZenMind's Rust code never touches `glib::VariantStrIter` (or `glib` at all directly).

**Action:** dismiss as **vulnerable code not used**. Revisit when Tauri moves its Linux stack to gtk-rs ≥ 0.20.

## `deepmerge` 4.3.1 — alert 13

**Advisory:** `mergeObject()` allows prototype poisoning of returned objects (GHSA-gcqx-w48m-w2h4). No patched release exists.

**How it gets in:** direct dependency, used by the vendored `simple-mind-map` (`index.js`, `Render.js`, `Watermark.js`, `utils/index.js`).

**Why it isn't exploitable:** `vite.config.ts` aliases every `deepmerge` import (`/^deepmerge$/`, which matches all four vendored imports) to `src/shims/deepmerge.js`. The shim strips `__proto__`, `constructor`, and `prototype` keys from all inputs before calling deepmerge (its comment cites this advisory), and is covered by `src/shims/deepmerge.test.ts`. Side effect: legitimate `constructor`/`prototype` keys are dropped too, which doesn't matter for mind-map data.

**Action:** dismiss as **mitigated** (Dependabot's "risk is tolerable" reason, with a comment pointing at the shim).

## `quill` 2.0.3 — alert 1

**Advisory:** XSS through Quill's HTML export (`getSemanticHTML`). No patched release exists.

**How it gets in:** direct dependency, used by the vendored `simple-mind-map` `RichText` and `Formula` plugins for in-place editing.

**Why it isn't exploitable:** nothing in `src/` (including `src/vendor/simple-mind-map`) calls `getSemanticHTML` or otherwise uses Quill's HTML export; node text is sanitized on load (`src/lib/sanitize.ts`).

**Action:** dismiss as **vulnerable code not used**. Re-check if we ever add an HTML export that goes through Quill.

## Remaining steps

- [x] Turn off the updater's `zip` feature in `src-tauri/Cargo.toml` and regenerate `Cargo.lock`.
- [x] Confirm `zip` is gone for all targets and `cargo check` passes on Linux.
- [ ] Let CI build Windows, macOS, and Linux (the next release).
- [ ] Test a self-update from 0.4.1 to the next release on Windows (`.msi`/`.exe`), macOS, Linux AppImage, and `.rpm`/`.deb`.
- [ ] Merge, so Dependabot closes alerts 16–18.
- [ ] Dismiss alerts 15, 13, and 1 on GitHub with the reasons above.
- [ ] Optional: open an issue on `tauri-apps/plugins-workspace` asking for the 3.x updater to depend on `zip` ≥ 9.0.5, as 2.14.1 already does.
