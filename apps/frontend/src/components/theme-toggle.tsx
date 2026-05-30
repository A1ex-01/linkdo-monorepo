"use client";

import { cn } from "@/lib/utils";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useMount } from "ahooks";
import { useTheme } from "next-themes";
import { useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useMount(() => {
    setMounted(true);
  });

  if (!mounted) {
    return (
      <button
        className={cn(
          "text-atext-450 hover:bg-muted flex size-9 items-center justify-center rounded-lg transition-colors",
          className,
        )}
      >
        <span className="size-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "text-atext-450 hover:bg-muted flex size-9 items-center justify-center rounded-lg transition-colors",
        className,
      )}
      title={
        resolvedTheme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {resolvedTheme === "dark" ? (
        <IconSun className="size-5" strokeWidth={2} />
      ) : (
        <IconMoon className="size-5" strokeWidth={2} />
      )}
    </button>
  );
}
