import type { ThemeColors, ThemePalette } from "../interfaces/theme";

export const THEME_PALETTE: ThemePalette = {
  moss: "var(--color-moss)",
  forest: "var(--color-forest)",
  cream: "var(--color-cream)",
  sand: "var(--color-sand)",
  terracotta: "var(--color-terracotta)",
} as const;

export const THEME_COLORS: Record<"dark", ThemeColors> = {
  dark: {
    background: "var(--color-forest)",
    surface: "var(--color-onyx)",
    text: "var(--color-cream)",
    textMuted: "var(--color-sand)",
    accent: "var(--color-terracotta)",
    primary: "var(--color-moss)",
    ...THEME_PALETTE,
  },
} as const;
