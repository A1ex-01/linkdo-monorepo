"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ResolvedTheme = "light" | "dark";
type Theme = ResolvedTheme | "system";

const STORAGE_KEY = "linkdo-theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved: ResolvedTheme = theme === "system" ? getSystemTheme() : theme;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize from storage / system preference on mount.
  useEffect(() => {
    const stored = readStoredTheme();
    const initial: ResolvedTheme =
      stored === "system" ? getSystemTheme() : stored;
    setResolved(initial);
    setMounted(true);
  }, []);

  // React to system theme changes when the user is on "system".
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readStoredTheme();
    if (stored !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      const next: ResolvedTheme = event.matches ? "dark" : "light";
      setResolved(next);
      applyTheme("system");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    const next: ResolvedTheme = resolved === "dark" ? "light" : "dark";
    setResolved(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    applyTheme(next);
  }, [resolved]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      title={
        resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      {/* Render both icons; toggle visibility based on the current theme. */}
      <IconSun
        className={cn(
          "h-[18px] w-[18px] transition-all",
          mounted && resolved === "dark"
            ? "scale-0 opacity-0"
            : "scale-100 opacity-100",
        )}
      />
      <IconMoon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all",
          mounted && resolved === "dark"
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0",
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
