import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Ctx, Theme } from "../types/theme.type";

export const ThemeContext = createContext<Ctx | null>(null);

const getSystem = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const getInitial = (): Theme =>
    (localStorage.getItem("theme") as Theme | null) ?? "system";
  const [theme, setTheme] = useState<Theme>(getInitial);

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystem());

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    setSystemTheme(mql.matches ? "dark" : "light");
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const effective = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", effective === "dark");
    localStorage.setItem("theme", theme);
    setMounted(true);
  }, [effective, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, resolved: systemTheme }),
    [theme, systemTheme]
  );

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
