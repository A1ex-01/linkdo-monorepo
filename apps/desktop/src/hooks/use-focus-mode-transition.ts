import { setWindowTopmost } from "@/lib/window-topmost";
import { invoke } from "@tauri-apps/api/core";
import {
  getCurrentWindow,
  LogicalPosition,
  LogicalSize,
} from "@tauri-apps/api/window";
import { useCallback, useRef } from "react";

const ANIMATION_DURATION_MS = 400;

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 850;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FocusModeConfig {
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
}

export interface FocusModeTransitionReturn {
  isAnimating: boolean;
  enterSidebar: () => Promise<void>;
  exitSidebar: () => Promise<void>;
  enterCapsule: () => Promise<void>;
  exitCapsule: () => Promise<void>;
}

export function useFocusModeTransition(): FocusModeTransitionReturn {
  const isAnimatingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const getCurrentBounds = useCallback(async (): Promise<WindowBounds> => {
    const win = getCurrentWindow();
    const [pos, size] = await Promise.all([
      win.outerPosition(),
      win.outerSize(),
    ]);
    return {
      x: pos.x,
      y: pos.y,
      width: size.width,
      height: size.height,
    };
  }, []);

  const animateWindow = useCallback(
    async (from: WindowBounds, to: FocusModeConfig): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = performance.now();

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const rawProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
          const t = easeInOutCubic(rawProgress);

          const win = getCurrentWindow();
          win.setSize(
            new LogicalSize(
              Math.round(lerp(from.width, to.targetWidth, t)),
              Math.round(lerp(from.height, to.targetHeight, t)),
            ),
          );
          win.setPosition(
            new LogicalPosition(
              Math.round(lerp(from.x, to.targetX, t)),
              Math.round(lerp(from.y, to.targetY, t)),
            ),
          );

          if (rawProgress < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            rafRef.current = null;
            isAnimatingRef.current = false;
            resolve();
          }
        };

        rafRef.current = requestAnimationFrame(tick);
      });
    },
    [],
  );

  const enterSidebar = useCallback(async () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const current = await getCurrentBounds();

    let screenFrame: ScreenFrame;
    try {
      screenFrame = await invoke<ScreenFrame>("get_screen_frame");
    } catch {
      isAnimatingRef.current = false;
      return;
    }

    await animateWindow(current, {
      targetX: screenFrame.x,
      targetY: screenFrame.y,
      targetWidth: 343,
      targetHeight: screenFrame.height,
    });
  }, [animateWindow, getCurrentBounds]);

  const exitSidebar = useCallback(async () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const current = await getCurrentBounds();

    await animateWindow(current, {
      targetX: 0,
      targetY: 0,
      targetWidth: DEFAULT_WIDTH,
      targetHeight: DEFAULT_HEIGHT,
    });
  }, [animateWindow, getCurrentBounds]);

  const enterCapsule = useCallback(async () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const current = await getCurrentBounds();

    let screenFrame: ScreenFrame;
    try {
      screenFrame = await invoke<ScreenFrame>("get_screen_frame");
    } catch {
      isAnimatingRef.current = false;
      return;
    }

    await setWindowTopmost(true);
    await animateWindow(current, {
      targetX: screenFrame.x,
      targetY: screenFrame.y,
      targetWidth: 343,
      targetHeight: 48,
    });
  }, [animateWindow, getCurrentBounds]);

  const exitCapsule = useCallback(async () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const current = await getCurrentBounds();

    await animateWindow(current, {
      targetX: 0,
      targetY: 0,
      targetWidth: 343,
      targetHeight: DEFAULT_HEIGHT,
    });
    await setWindowTopmost(false);
  }, [animateWindow, getCurrentBounds]);

  return {
    isAnimating: isAnimatingRef.current,
    enterSidebar,
    exitSidebar,
    enterCapsule,
    exitCapsule,
  };
}
