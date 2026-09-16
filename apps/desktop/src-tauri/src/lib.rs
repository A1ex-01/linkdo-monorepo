use serde::Serialize;
use tauri::{command, Emitter, Window};
use tauri_plugin_oauth::start;

#[derive(Serialize)]
pub struct ScreenFrame {
  pub x: f64,
  pub y: f64,
  pub width: f64,
  pub height: f64,
}

#[cfg(target_os = "macos")]
#[command]
fn get_screen_frame(window: Window) -> Result<ScreenFrame, String> {
  let m = window
    .current_monitor()
    .map_err(|e| e.to_string())?
    .ok_or("No monitor found")?;

  let scale = m.scale_factor();
  let work_area = m.work_area();

  Ok(ScreenFrame {
    x: work_area.position.x as f64 / scale,
    y: work_area.position.y as f64 / scale,
    width: work_area.size.width as f64 / scale,
    height: work_area.size.height as f64 / scale,
  })
}

#[cfg(not(target_os = "macos"))]
#[command]
fn get_screen_frame() -> Result<ScreenFrame, String> {
  Err("get_screen_frame is only supported on macOS".to_string())
}

#[command]
async fn start_server(window: Window) -> Result<u16, String> {
  start(move |url| {
    let _ = window.emit("redirect_uri", url);
  })
  .map_err(|err| err.to_string())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_oauth::init())
    .invoke_handler(tauri::generate_handler![start_server, get_screen_frame])
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app_handle, event| {
      if let tauri::RunEvent::ExitRequested { .. } = event {
        let _ = app_handle.emit("app-before-quit", ());
      }
    });
}
