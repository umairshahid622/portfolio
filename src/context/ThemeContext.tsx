import React, { createContext, useContext, useEffect } from "react";
import type { Theme, ThemeContextType } from "../interfaces";
import { THEME_COLORS } from "../constants";

export type { Theme, ThemeContextType };

const permanentThemeContext: ThemeContextType = {
  theme: "dark",
  isDark: true,
  colors: THEME_COLORS.dark,
  setTheme: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(permanentThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  }, []);

  return (
    <ThemeContext.Provider value={permanentThemeContext}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
