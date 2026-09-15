"use client";

type Theme = "light" | "dark";

const storageKey = "linkdo-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme;
    const nextTheme: Theme = currentTheme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="切换明暗主题"
      title="切换明暗主题"
      onClick={toggleTheme}
    >
      <svg className="theme-toggle__sun" aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg className="theme-toggle__moon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M20.6 15.79A9 9 0 1 1 8.21 3.4 7 7 0 0 0 20.6 15.79Z" />
      </svg>
      <span className="sr-only">切换明暗主题</span>
    </button>
  );
}
