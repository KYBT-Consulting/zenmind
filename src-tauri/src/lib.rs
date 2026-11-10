#[cfg(target_os = "linux")]
mod rpm_update;

/// How this build installs updates: `"rpm"` for rpm installs (see `rpm_update`), otherwise
/// `"plugin"` (the updater plugin's own installer: Windows, macOS, AppImage, deb).
#[tauri::command]
fn update_install_strategy() -> &'static str {
  #[cfg(target_os = "linux")]
  if rpm_update::is_rpm_install() {
    return "rpm";
  }
  "plugin"
}

/// Windows portable build: a `.portable` marker or `data/` folder next to the exe.
/// Returns the exe directory when running portable.
#[cfg(target_os = "windows")]
fn portable_exe_dir() -> Option<std::path::PathBuf> {
  let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
  (exe_dir.join("data").is_dir() || exe_dir.join(".portable").exists()).then_some(exe_dir)
}

/// Whether this is the Windows portable ZIP build. The portable exe is copied from the
/// bundled build, so it carries the installer's bundle type; the updater must not run
/// the installer for it (that would install a second copy instead of updating this one).
#[tauri::command]
fn is_portable_install() -> bool {
  #[cfg(target_os = "windows")]
  {
    portable_exe_dir().is_some()
  }
  #[cfg(not(target_os = "windows"))]
  {
    false
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  #[cfg(target_os = "windows")]
  if let Some(exe_dir) = portable_exe_dir() {
    let data_dir = exe_dir.join("data");
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

  let builder = tauri::Builder::default()
    .runtime(tauri_runtime_wry::Wry::default())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![
      is_portable_install,
      update_install_strategy,
      #[cfg(target_os = "linux")]
      rpm_update::install_rpm_update
    ]);

  // Self-update (desktop only): checks the signed latest.json on GitHub Releases
  #[cfg(desktop)]
  let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

  // Remember which files the user opened or saved via the file dialogs, so the next
  // launch can reopen them from disk (dialog grants otherwise last one run only).
  // Must be registered after the fs plugin.
  #[cfg(desktop)]
  let builder = builder.plugin(tauri_plugin_persisted_scope::init());

  builder
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      #[cfg(any(
        target_os = "linux",
        target_os = "dragonfly",
        target_os = "freebsd",
        target_os = "openbsd",
        target_os = "netbsd"
      ))]
      #[allow(deprecated)]
      {
        use tauri::Manager;
        if let Some(main_window) = app.get_webview_window("main") {
          let _ = main_window.with_webview(|webview| {
            let Some(wry_webview) = webview.downcast_ref::<tauri_runtime_wry::Webview>() else {
              return;
            };
            use gtk::glib::translate::from_glib_none;
            use gtk::prelude::*;
            use webkit2gtk::WebViewExt;

            let wk_webview = wry_webview.inner();
            wk_webview.set_zoom_level(1.0);

            unsafe {
              let obj_ptr: *mut gtk::glib::gobject_ffi::GObject = wk_webview.as_ptr() as *mut _;
              let zoom_gesture_ptr = gtk::glib::gobject_ffi::g_object_get_data(
                obj_ptr,
                c"wk-view-zoom-gesture".as_ptr(),
              ) as *mut gtk::ffi::GtkGestureZoom;

              if !zoom_gesture_ptr.is_null() {
                // Disconnect WebKitGTK's built-in page-scaling signal handlers on wk-view-zoom-gesture
                gtk::glib::gobject_ffi::g_signal_handlers_disconnect_matched(
                  zoom_gesture_ptr as *mut _,
                  gtk::glib::gobject_ffi::G_SIGNAL_MATCH_DATA,
                  0,
                  0,
                  std::ptr::null_mut(),
                  std::ptr::null_mut(),
                  obj_ptr as *mut _,
                );

                let zoom_gesture: gtk::GestureZoom = from_glib_none(zoom_gesture_ptr);

                let wk_begin = wk_webview.clone();
                zoom_gesture.connect_begin(move |gesture, _seq| {
                  let (cx, cy) = gesture.bounding_box_center().unwrap_or((0.0, 0.0));
                  let js = format!(
                    "window.dispatchEvent(new CustomEvent('zenmind:trackpad-pinch', {{ detail: {{ phase: 'begin', scale: 1, clientX: {cx}, clientY: {cy} }} }}));"
                  );
                  wk_begin.run_javascript(&js, None::<&gtk::gio::Cancellable>, |_| {});
                });

                let wk_change = wk_webview.clone();
                zoom_gesture.connect_scale_changed(move |gesture, scale| {
                  gesture.set_state(gtk::EventSequenceState::Claimed);
                  let (cx, cy) = gesture.bounding_box_center().unwrap_or((0.0, 0.0));
                  let js = format!(
                    "window.dispatchEvent(new CustomEvent('zenmind:trackpad-pinch', {{ detail: {{ phase: 'change', scale: {scale}, clientX: {cx}, clientY: {cy} }} }}));"
                  );
                  wk_change.run_javascript(&js, None::<&gtk::gio::Cancellable>, |_| {});
                });

                let wk_end = wk_webview.clone();
                zoom_gesture.connect_end(move |_gesture, _seq| {
                  let js = "window.dispatchEvent(new CustomEvent('zenmind:trackpad-pinch', { detail: { phase: 'end', scale: 1 } }));";
                  wk_end.run_javascript(js, None::<&gtk::gio::Cancellable>, |_| {});
                });
              }
            }
          });
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
