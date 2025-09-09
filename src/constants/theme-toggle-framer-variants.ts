import { stagger, type Variants } from "motion";

export const panelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 25,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      delayChildren: stagger(0.15, { from: "first" }),
    },
  },
  exit: {
    opacity: 0,
    y: 25,
    transition: {
      when: "afterChildren",
      delayChildren: stagger(0.15, { from: "last" }),
    },
  },
};

export const itemVairants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 10,
  },
};
