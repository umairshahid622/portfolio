import { motion, type Variants } from "motion/react";
import { DURATION, STAGGER } from "../constants/zoopButton";

const ZoopButton = ({ title }: { title: string }) => {
  const hideTextVariants: Variants = {
    rest: { y: 0 },
    hovered: { y: "-200%" },
  };
  const showTextVariants: Variants = {
    rest: { y: "200%" },
    hovered: { y: 0 },
  };

  return (
    <motion.button
      initial="rest"
      whileHover="hovered"
      className="
        h-12 px-6
        inline-flex items-center justify-center
        border-2 border-light-border dark:border-dark-border
        rounded-lg
      relative
      "
    >
      <div className="overflow-hidden">
        {title.split("").map((l, i) => {
          return (
            <motion.span
              className="inline-block"
              variants={hideTextVariants}
              transition={{
                duration: DURATION,
                ease: "easeInOut",
                delay: STAGGER * i,
              }}
              key={i}
            >
              {l}
            </motion.span>
          );
        })}
      </div>
      <div className="absolute overflow-hidden">
        {title.split("").map((l, i) => {
          return (
            <motion.span
              className="inline-block"
              variants={showTextVariants}
              transition={{
                duration: DURATION,
                ease: "easeInOut",
                delay: STAGGER * i,
              }}
              key={i}
            >
              {l}
            </motion.span>
          );
        })}
      </div>
      {/* <motion.div variants={hideTextVariants} className="leading-none">
        {title}
      </motion.div>
      <motion.div
        variants={showTextVariants}
        className="leading-none absolute top-1/2 -translate-y-1/2"
      >
        {title}
      </motion.div> */}
      {/* <motion.div variants={hideTextVariants} className="leading-none">
        {title.split("").map((l, i) => {
          return <span className="inline-block" key={i}>{l}</span>;
        })}
      </motion.div>
      <motion.div variants={showTextVariants} className="leading-none absolute inset-0">
        {title.split("").map((l, i) => {
          return <span className="inline-block" key={i}>{l}</span>;
        })}
      </motion.div> */}
    </motion.button>
  );
};

export default ZoopButton;
