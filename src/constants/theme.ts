import type { ThemeColors, ThemePalette } from "../interfaces/theme";

export const THEME_PALETTE: ThemePalette = {
  moss: "var(--color-moss)",
  forest: "var(--color-forest)",
  cream: "var(--color-cream)",
  sand: "var(--color-sand)",
  terracotta: "var(--color-terracotta)",
} as const;

export const THEME_COLORS: Record<"dark" | "light", ThemeColors> = {
  dark: {
    background: "var(--color-forest)",
    surface: "var(--color-onyx)",
    text: "var(--color-cream)",
    textMuted: "var(--color-sand)",
    accent: "var(--color-terracotta)",
    primary: "var(--color-moss)",
    ...THEME_PALETTE,
  },
  light: {
    background: "var(--color-cream)",
    surface: "var(--color-sand)",
    text: "var(--color-forest)",
    textMuted: "var(--color-moss)",
    accent: "var(--color-terracotta)",
    primary: "var(--color-sand)",
    ...THEME_PALETTE,
  },
} as const;

export const STORAGE_KEY = "portfolio-theme";
