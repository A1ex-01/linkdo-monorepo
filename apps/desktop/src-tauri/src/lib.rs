use serde::Serialize;
use tauri::{command, Emitter, Manager, Window};  // 加了 Manager
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
        .setup(|app| {
            let app_handle = app.handle().clone();

            app.get_webview_window("main")
                .expect("no window named 'main'")
                .on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        app_handle.emit("app-before-quit", ()).unwrap();

                        let handle = app_handle.clone();
                        std::thread::spawn(move || {
                            std::thread::sleep(std::time::Duration::from_millis(500));
                            handle.exit(0);
                        });
                    }
                });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_server, get_screen_frame])
        // ↓ 把 .run() 改成这样
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // Cmd+Q 走这里
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();

                app_handle.emit("app-before-quit", ()).unwrap();

                let handle = app_handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    handle.exit(0);
                });
            }
        });
}