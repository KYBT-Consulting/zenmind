//! Self-update for `.rpm` installs.
//!
//! The updater plugin installs rpm updates with `pkexec rpm -U <file>`. RPM 6 (Fedora 43+)
//! defaults to `%_pkgverify_level all`, which rejects packages without an OpenPGP signature
//! ("does not verify: no signature"), so those updates always failed.
//!
//! Here the plugin still checks for and downloads the update, and `Update::download`
//! verifies it against the updater public key (minisign) before returning the bytes. Only the
//! install step differs: `rpm -U --nosignature`. That skips RPM's own OpenPGP check, which
//! this package can't pass, while RPM still enforces its payload digests, and authenticity is
//! already proven by the updater signature.

use serde::Serialize;
use tauri::ipc::Channel;
use tauri_plugin_updater::UpdaterExt;

/// Same shape as the JS plugin's download events, so the update notice handles both.
#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data", rename_all = "PascalCase")]
pub enum DownloadEvent {
  #[serde(rename_all = "camelCase")]
  Started { content_length: Option<u64> },
  #[serde(rename_all = "camelCase")]
  Progress { chunk_length: usize },
  Finished,
}

/// Whether this build was installed from an rpm (and must update through `install_rpm_update`).
pub fn is_rpm_install() -> bool {
  matches!(
    tauri::utils::platform::bundle_type(),
    Some(tauri::utils::config::BundleType::Rpm)
  )
}

#[tauri::command]
pub async fn install_rpm_update(
  app: tauri::AppHandle,
  on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
  let update = app
    .updater()
    .map_err(|e| e.to_string())?
    .check()
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| "No update is available.".to_string())?;

  // `download` verifies the updater signature before returning the bytes
  let mut started = false;
  let progress = on_event.clone();
  let bytes = update
    .download(
      |chunk_length, content_length| {
        if !started {
          started = true;
          let _ = progress.send(DownloadEvent::Started { content_length });
        }
        let _ = progress.send(DownloadEvent::Progress { chunk_length });
      },
      || {
        let _ = on_event.send(DownloadEvent::Finished);
      },
    )
    .await
    .map_err(|e| e.to_string())?;

  // Private (0700), uniquely named temp dir; removed when `dir` is dropped
  let dir = tempfile::Builder::new()
    .prefix("zenmind-update-")
    .tempdir()
    .map_err(|e| format!("Couldn't create a temporary folder: {e}"))?;
  let package = dir.path().join("zenmind-update.rpm");
  std::fs::write(&package, &bytes).map_err(|e| format!("Couldn't save the update: {e}"))?;

  let status = std::process::Command::new("pkexec")
    .args(["rpm", "-U", "--nosignature"])
    .arg(&package)
    .status()
    .map_err(|e| format!("Couldn't ask for administrator rights (pkexec): {e}"))?;

  match status.code() {
    Some(0) => Ok(()),
    // pkexec: 126 = authorization dismissed or denied, 127 = authentication failed
    Some(126) => Err("The update was not installed: the password prompt was canceled.".into()),
    Some(127) => Err("The update was not installed: authentication failed.".into()),
    _ => Err(format!(
      "The package manager couldn't install the update (rpm exit code {}).",
      status.code().map_or("unknown".to_string(), |c| c.to_string())
    )),
  }
}
