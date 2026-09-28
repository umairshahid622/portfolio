import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

export const THEME_PALETTE = {
  moss: "#606c38",       // Olive / Moss Green
  forest: "#283618",     // Dark Moss / Deep Forest Green
  cream: "#fefae0",      // Cornsilk / Warm Cream
  sand: "#dda15e",       // Earth Yellow / Warm Sand
  terracotta: "#bc6c25", // Tiger's Eye / Terracotta / Copper
} as const;

export const THEME_COLORS = {
  dark: {
    background: "#283618", // Dark Moss / Deep Forest Green
    surface: "#1f2a13",
    text: "#fefae0",       // Cornsilk / Warm Cream
    textMuted: "#dda15e",  // Warm Sand
    accent: "#bc6c25",     // Terracotta
    primary: "#606c38",    // Olive / Moss Green
    ...THEME_PALETTE,
  },
  light: {
    background: "#fefae0", // Cornsilk / Warm Cream
    surface: "#f5f0d0",
    text: "#283618",       // Dark Moss / Deep Forest Green
    textMuted: "#606c38",  // Olive / Moss Green
    accent: "#bc6c25",     // Terracotta
    primary: "#dda15e",    // Warm Sand
    ...THEME_PALETTE,
  },
} as const;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: (typeof THEME_COLORS)[Theme];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "portfolio-theme";

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

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
