import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const windowApi = vi.hoisted(() => {
  const setPosition = vi.fn().mockResolvedValue(undefined);
  const setSize = vi.fn().mockResolvedValue(undefined);

  return {
    outerPosition: vi.fn().mockResolvedValue({ x: 1000, y: 500 }),
    outerSize: vi.fn().mockResolvedValue({ width: 686, height: 96 }),
    scaleFactor: vi.fn().mockResolvedValue(2),
    setPosition,
    setSize,
    getCurrentWindow: vi.fn(() => ({
      outerPosition: windowApi.outerPosition,
      outerSize: windowApi.outerSize,
      scaleFactor: windowApi.scaleFactor,
      setPosition: windowApi.setPosition,
      setSize: windowApi.setSize,
    })),
  };
});

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: windowApi.getCurrentWindow,
  LogicalPosition: class LogicalPosition {
    constructor(
      public x: number,
      public y: number,
    ) {}
  },
  LogicalSize: class LogicalSize {
    constructor(
      public width: number,
      public height: number,
    ) {}
  },
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/lib/window-topmost", () => ({
  setWindowTopmost: vi.fn().mockResolvedValue(undefined),
}));

import { useFocusModeTransition } from "./use-focus-mode-transition";

describe("useFocusModeTransition", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("converts dragged physical window bounds to logical bounds before exiting capsule mode", async () => {
    const animationFrames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        animationFrames.push(callback);
        return animationFrames.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(performance, "now").mockReturnValue(0);

    const { result } = renderHook(() => useFocusModeTransition());
    const transition = result.current.exitCapsule();

    await vi.waitFor(() => expect(animationFrames).toHaveLength(1));
    animationFrames.shift()?.(0);

    expect(windowApi.setPosition).toHaveBeenCalledWith(
      expect.objectContaining({ x: 500, y: 250 }),
    );
    expect(windowApi.setSize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 343, height: 48 }),
    );

    await vi.waitFor(() => expect(animationFrames).toHaveLength(1));
    animationFrames.shift()?.(400);
    await transition;
  });
});
