import type { FC, SVGProps } from "react";

export type Theme = "light" | "dark" | "system";
export type Ctx = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: Omit<Theme, "system">;
};

type IconType = FC<SVGProps<SVGSVGElement>>;

export interface ThemeItems {
  key: Theme;
  title: string;
  icon: IconType;
}
