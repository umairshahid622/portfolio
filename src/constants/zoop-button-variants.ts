import type { Variants } from "motion";

export const DURATION = 0.25;
export const STAGGER = 0.0105;

export const hideTextVariants: Variants = {
  rest: { y: 0 },
  hovered: { y: "-200%" },
};
export const showTextVariants: Variants = {
  rest: { y: "200%" },
  hovered: { y: 0 },
};
