# Dependabot alerts review — November 2026

Reviewed 2026-11-16, after the v0.4.1 release (`main` at `20a661b`). Six alerts were open. **None is exploitable in ZenMind as it is built today**, so no hotfix release is needed. One of them (`zip`) has a real fix that needs a Rust toolchain; the rest can be dismissed with a reason.

| Alert | Severity | Package | Version in use | Fixed in | Verdict |
|---|---|---|---|---|---|
| 16 | critical | `zip` (Rust) | 4.6.1 | 9.0.5 | Not reachable; remove via updater feature (see below) |
| 17 | high | `zip` (Rust) | 4.6.1 | 9.0.0 | Same as 16 |
| 18 | medium | `zip` (Rust) | 4.6.1 | 9.0.0 | Same as 16 |
| 15 | medium | `glib` (Rust) | 0.18.5 | 0.20.0 | Vulnerable code not used; blocked on Tauri |
| 13 | low | `deepmerge` (npm) | 4.3.1 | none | Already mitigated by our shim |
| 1 | low | `quill` (npm) | 2.0.3 | none | Vulnerable code not used |

## `zip` 4.6.1 — alerts 16, 17, 18

**Advisories:** zip cloaking via dual-header inconsistencies leading to arbitrary file overwrite (16); unbounded symlink-target handling exhausting memory during extraction (17); AES entry HMAC bypass on premature EOF (18).

**How it gets in:** only through `tauri-plugin-updater` 3.0.0-alpha.3, which depends on `zip = "^4"` as an optional dependency, compiled only for `cfg(target_os = "windows")`, behind the plugin's `zip` feature. The `zip` feature is in the plugin's default features (`default = ["rustls-tls", "system-proxy", "zip"]`).

**Why it isn't exploitable:**
- The updater verifies every downloaded package against our minisign public key (`Update::download` → `self.verify(&buffer)`) before it is installed or extracted. A malicious archive can only reach `zip` if it is signed with ZenMind's update signing key.
- The Windows updater only calls `extract_zip` when the package bytes *are* a zip (`infer::archive::is_zip`). Our signed updater artifacts are not zipped: `createUpdaterArtifacts` is `true` (not `"v1Compatible"`), and the v0.4.1 release ships `.exe`, `.msi`, `.AppImage`, `.deb`, and `.rpm` with `.sig` files, no `.zip`/`.tar.gz` updater bundles.

**Why there's no simple version bump:** `zip` 9.x is outside the plugin's `^4` requirement. Upstream status as of this review:
- `tauri-plugin-updater` 3.0.0-alpha.3 is the latest 3.x release; the `v3` branch of `tauri-apps/plugins-workspace` still has `zip = { version = "4", ... }`.
- The stable 2.x line already moved: 2.14.1 depends on `zip = "^9"`.
- No open upstream issue found asking for the bump on 3.x.

**Recommended fix — turn off the updater's `zip` feature**, which removes the crate from the build entirely. In `src-tauri/Cargo.toml`:

```toml
tauri-plugin-updater = { version = "3.0.0-alpha.3", default-features = false, features = ["rustls-tls", "system-proxy"] }
```

Things to confirm when doing this (needs Rust):
1. **macOS:** the same `zip` feature also enables the `tar` and `flate2` dependencies, and the macOS updater's `install_inner` unpacks `.app.tar.gz` with `flate2`/`tar`. Check whether the macOS build still compiles and installs updates without the feature. v0.4.1 published no macOS assets even though `release.yml` has a `universal-apple-darwin` matrix entry, so first check whether macOS is actually shipped.
2. **Linux AppImage:** without `zip`, the updater rejects *compressed* AppImage updates. Ours are uncompressed `.AppImage` files, so this should not matter; confirm an AppImage self-update still works.
3. **Windows:** confirm an `.exe`/`.msi` self-update from 0.4.1 still works.
4. Regenerate `Cargo.lock` so `zip` drops out. Dependabot closes alerts 16–18 automatically once it's gone from the lock file on `main`.

If macOS turns out to need the feature, fall back to dismissing 16–18 as **tolerable risk** with the signing-key explanation above, and ask upstream to move the 3.x updater to `zip` 9.

## `glib` 0.18.5 — alert 15

**Advisory:** unsoundness in the `Iterator`/`DoubleEndedIterator` impls for `glib::VariantStrIter`.

**How it gets in:** the Linux GTK stack used by Tauri and wry (`gtk`, `gdk`, `webkit2gtk` 2.0.2, `soup3`, `javascriptcore-rs`, `cairo-rs`, `pango`, `atk`, `gio`, all on gtk-rs 0.18). It can't be upgraded to 0.20 on its own; that needs Tauri/wry to move to newer gtk-rs/webkit bindings.

**Why it isn't exploitable:** ZenMind's Rust code never touches `glib::VariantStrIter` (or `glib` at all directly).

**Action:** dismiss as **vulnerable code not used**. Revisit when Tauri moves its Linux stack to gtk-rs ≥ 0.20.

## `deepmerge` 4.3.1 — alert 13

**Advisory:** `mergeObject()` allows prototype poisoning of returned objects (GHSA-gcqx-w48m-w2h4). No patched release exists.

**How it gets in:** direct dependency, used by the vendored `simple-mind-map` (`index.js`, `Render.js`, `Watermark.js`, `utils/index.js`).

**Why it isn't exploitable:** `vite.config.ts` aliases every `deepmerge` import to `src/shims/deepmerge.js`, which strips `__proto__`, `constructor`, and `prototype` keys from all inputs before calling deepmerge (its comment cites this advisory), and is covered by `src/shims/deepmerge.test.ts`.

**Action:** dismiss as **mitigated** (Dependabot's "risk is tolerable" reason, with a comment pointing at the shim).

## `quill` 2.0.3 — alert 1

**Advisory:** XSS through Quill's HTML export (`getSemanticHTML`). No patched release exists.

**How it gets in:** direct dependency, used by the vendored `simple-mind-map` `RichText` and `Formula` plugins for in-place editing.

**Why it isn't exploitable:** nothing in `src/` calls `getSemanticHTML` or otherwise uses Quill's HTML export; node text is sanitized on load (`src/lib/sanitize.ts`).

**Action:** dismiss as **vulnerable code not used**. Re-check if we ever add an HTML export that goes through Quill.

## To resume (on a machine with Rust)

- [ ] Change `tauri-plugin-updater` in `src-tauri/Cargo.toml` as shown above, then run `cargo update -p tauri-plugin-updater` (or `cargo tree -i zip` to confirm `zip` is gone).
- [ ] Build the desktop app (`tauri build`) for Windows and Linux; build macOS too if we ship it.
- [ ] Test a self-update from 0.4.1 on each shipped platform.
- [ ] Merge, so Dependabot closes alerts 16–18.
- [ ] Dismiss alerts 15, 13, and 1 on GitHub with the reasons above.
- [ ] Optional: open an issue on `tauri-apps/plugins-workspace` asking for the 3.x updater to depend on `zip` ≥ 9.0.5, as 2.14.1 already does.
