#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  #[cfg(target_os = "windows")]
  {
    if let Ok(exe_path) = std::env::current_exe() {
      if let Some(exe_dir) = exe_path.parent() {
        let data_dir = exe_dir.join("data");
        let portable_marker = exe_dir.join(".portable");
        if data_dir.is_dir() || portable_marker.exists() {
          if !data_dir.exists() {
            let _ = std::fs::create_dir_all(&data_dir);
          }
          if std::env::var_os("WEBVIEW2_USER_DATA_FOLDER").is_none() {
            // SAFETY: Invoked early at process startup on the main thread before any background threads are spawned.
            unsafe {
              std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &data_dir);
            }
          }
        }
      }
    }
  }

  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
