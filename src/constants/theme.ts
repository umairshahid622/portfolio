import type { ThemeColors, ThemePalette } from "../interfaces/theme";

export const THEME_PALETTE: ThemePalette = {
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  tertiary: "var(--color-tertiary)",
  accent: "var(--color-accent)",
  background: "var(--color-background)",
  surface: "var(--color-surface)",
  surfaceDark: "var(--color-surface-dark)",
  foreground: "var(--color-foreground)",
  // Backward compatibility aliases
  moss: "var(--color-secondary)",
  forest: "var(--color-background)",
  cream: "var(--color-foreground)",
  sand: "var(--color-primary)",
  terracotta: "var(--color-tertiary)",
} as const;

export const THEME_COLORS: Record<"dark", ThemeColors> = {
  dark: {
    ...THEME_PALETTE,
    text: "var(--color-foreground)",
    textMuted: "var(--color-text-muted)",
  },
} as const;
