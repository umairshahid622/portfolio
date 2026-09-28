import React, { createContext, useContext, useEffect, useState } from "react";
import type { Theme, ThemeContextType } from "../interfaces";
import { THEME_COLORS, STORAGE_KEY } from "../constants";

export type { Theme, ThemeContextType };

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "dark" || stored === "light") {
        return stored;
      }
      // 2. Check if dark class was already set by the blocking script in index.html
      if (document.documentElement.classList.contains("dark")) {
        return "dark";
      }
      // 3. Fallback to system preference or default dark
      if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const currentColors = THEME_COLORS[theme];
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      root.style.backgroundColor = currentColors.background;
      root.style.color = currentColors.text;
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      root.style.backgroundColor = currentColors.background;
      root.style.color = currentColors.text;
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  }, [theme]);

  // Listen for external storage changes across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const enableTransition = () => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    window.clearTimeout((window as unknown as { _themeTimeout?: number })._themeTimeout);
    (window as unknown as { _themeTimeout?: number })._themeTimeout = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 250);
  };

  const setTheme = (newTheme: Theme) => {
    enableTransition();
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    enableTransition();
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        colors: THEME_COLORS[theme],
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
