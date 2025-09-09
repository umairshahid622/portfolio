import { motion } from "motion/react";
import {
  DURATION,
  hideTextVariants,
  showTextVariants,
  STAGGER,
} from "../constants/zoop-button-variants";

interface Props {
  title: string;
  click?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const ZoopButton = ({ title, click, className, type }: Props) => {
  const chars = title.split("");
  const renderChar = (ch: string) => (ch === " " ? "\u00A0" : ch);
  return (
    <motion.button
      onClick={click}
      type={type}
      initial="rest"
      whileHover="hovered"
      className={`
        ${className}
        inline-flex
        transition-colors
        h-12
        px-6
        
        border-2 border-light-border rounded-lg
        items-center justify-center dark:border-dark-border relative
      `}
    >
      <div
        className="
          overflow-hidden
        "
      >
        {chars.map((l, i) => {
          return (
            <motion.span
              variants={hideTextVariants}
              transition={{
                duration: DURATION,
                ease: "easeInOut",
                delay: STAGGER * i,
              }}
              key={i}
              className="
                inline-block
              "
            >
              {renderChar(l)}
            </motion.span>
          );
        })}
      </div>
      <div
        className="
          overflow-hidden
          absolute
        "
      >
        {chars.map((l, i) => {
          return (
            <motion.span
              variants={showTextVariants}
              transition={{
                duration: DURATION,
                ease: "easeInOut",
                delay: STAGGER * i,
              }}
              key={i}
              className="
                inline-block
              "
            >
              {renderChar(l)}
            </motion.span>
          );
        })}
      </div>
    </motion.button>
  );
};

export default ZoopButton;
