"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type StyleTheme = "default" | "twitter" | "vercel";

interface StyleThemeContextType {
  styleTheme: StyleTheme;
  setStyleTheme: (theme: StyleTheme) => void;
}

const StyleThemeContext = createContext<StyleThemeContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "linkdo-style-theme";
const DEFAULT_STYLE_THEME: StyleTheme = "default";

function getInitialTheme(): StyleTheme {
  if (typeof window === "undefined") return DEFAULT_STYLE_THEME;
  
  const stored = localStorage.getItem(STORAGE_KEY) as StyleTheme | null;
  if (stored && ["default", "twitter", "vercel"].includes(stored)) {
    return stored;
  }
  return DEFAULT_STYLE_THEME;
}

export function StyleThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize with the actual stored value immediately
  const [styleTheme, setStyleThemeState] = useState<StyleTheme>(getInitialTheme);

  // Sync with document.documentElement.dataset.theme on mount
  useEffect(() => {
    // Ensure the data-theme attribute matches our state
    document.documentElement.dataset.theme = styleTheme;
  }, [styleTheme]);

  const setStyleTheme = (theme: StyleTheme) => {
    setStyleThemeState(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  };

  return (
    <StyleThemeContext.Provider value={{ styleTheme, setStyleTheme }}>
      {children}
    </StyleThemeContext.Provider>
  );
}

export function useStyleTheme() {
  const context = useContext(StyleThemeContext);
  if (context === undefined) {
    throw new Error("useStyleTheme must be used within a StyleThemeProvider");
  }
  return context;
}
