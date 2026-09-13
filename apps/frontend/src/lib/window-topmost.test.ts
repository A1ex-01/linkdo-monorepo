import { describe, expect, it, vi } from "vitest";

const setAlwaysOnTop = vi.fn();

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ setAlwaysOnTop }),
}));

import { setWindowTopmost } from "./window-topmost";

describe("setWindowTopmost", () => {
  it("updates the native window's always-on-top state", async () => {
    await setWindowTopmost(true);

    expect(setAlwaysOnTop).toHaveBeenCalledWith(true);
  });
});
