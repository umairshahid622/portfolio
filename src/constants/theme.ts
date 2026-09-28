import type { ThemeColors, ThemePalette } from "../interfaces/theme";

export const THEME_PALETTE: ThemePalette = {
  moss: "#606c38",       // Olive / Moss Green
  forest: "#283618",     // Dark Moss / Deep Forest Green
  cream: "#fefae0",      // Cornsilk / Warm Cream
  sand: "#dda15e",       // Earth Yellow / Warm Sand
  terracotta: "#bc6c25", // Tiger's Eye / Terracotta / Copper
} as const;

export const THEME_COLORS: Record<"dark" | "light", ThemeColors> = {
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

export const STORAGE_KEY = "portfolio-theme";
