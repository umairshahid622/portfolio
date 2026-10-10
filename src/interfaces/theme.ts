export type Theme = "dark";

export interface ThemePalette {
  moss: string;
  forest: string;
  cream: string;
  sand: string;
  terracotta: string;
}

export interface ThemeColors extends ThemePalette {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  primary: string;
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
