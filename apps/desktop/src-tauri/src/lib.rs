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

#[command]
fn get_screen_frame(window: Window) -> Result<ScreenFrame, String> {
  let m = window
    .current_monitor()
    .map_err(|e| e.to_string())?
    .ok_or("No monitor found")?;

  let scale = m.scale_factor();
  let work_area = m.work_area();

  Ok(logical_screen_frame(
    work_area.position.x,
    work_area.position.y,
    work_area.size.width,
    work_area.size.height,
    scale,
  ))
}

fn logical_screen_frame(x: i32, y: i32, width: u32, height: u32, scale: f64) -> ScreenFrame {
  ScreenFrame {
    x: x as f64 / scale,
    y: y as f64 / scale,
    width: width as f64 / scale,
    height: height as f64 / scale,
  }
}

#[command]
async fn start_server(window: Window) -> Result<u16, String> {
  start(move |url| {
    let _ = window.emit("redirect_uri", url);
  })
  .map_err(|err| err.to_string())
}

#[cfg(test)]
mod tests {
  use super::logical_screen_frame;

  #[test]
  fn converts_physical_work_area_to_logical_coordinates() {
    let frame = logical_screen_frame(300, 150, 2880, 1800, 1.5);

    assert_eq!(frame.x, 200.0);
    assert_eq!(frame.y, 100.0);
    assert_eq!(frame.width, 1920.0);
    assert_eq!(frame.height, 1200.0);
  }
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
