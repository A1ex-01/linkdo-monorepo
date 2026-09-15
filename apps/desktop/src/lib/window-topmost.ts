import { getCurrentWindow } from "@tauri-apps/api/window";

export async function setWindowTopmost(enabled: boolean): Promise<void> {
  await getCurrentWindow().setAlwaysOnTop(enabled);
}
