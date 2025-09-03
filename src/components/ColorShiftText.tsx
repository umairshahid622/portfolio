import { motion, useAnimation, type Variants } from "motion/react";
import { useState } from "react";

interface Props {
  title: string;
}

const ColorShiftText = ({ title }: Props) => {
  const control = useAnimation();
  const [cycleKey, setCycleKey] = useState(0);
  const chars = title.split("");

  const variants: Variants = {
    initial: { color: "var(--text-color)" },
    animate: { color: "var(--color-brand-green)" },
  };

  return (
    <motion.h1
      key={cycleKey}
      initial="initial"
      animate={control}
      whileInView="animate"
      onViewportLeave={() => {
        control.start("initial");
        setCycleKey((prev) => prev + 1);
      }}
    >
      {chars.map((l, i) => (
        <motion.span
          key={i}
          variants={variants}
          transition={{
            ease: "easeInOut",
            delay: 0.15 * i,
          }}
        >
          {l}
        </motion.span>
      ))}
    </motion.h1>
  );
};

export default ColorShiftText;
