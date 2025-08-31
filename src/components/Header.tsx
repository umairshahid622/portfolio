import { motion } from "motion/react";
import ThemeToggler from "./ThemeToggler";
import { DELAY, DURATION } from "../constants/framer-duration";

const Header = () => {
  return (
    <header
      className="
        z-50
        w-full
        bg-light-bg
        dark:bg-dark-bg
        shadow-sm
        fixed top-0 right-0
      "
    >
      <div
        className="
          flex
          max-w-7xl
          mx-auto py-6
          px-4
          items-center justify-between relative capitalize
        "
      >
        <motion.h4
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION, delay: DELAY }}
        >
          <span
            className="
              text-brand-orange
            "
          >
            Porfolio
          </span>
        </motion.h4>
        <ThemeToggler></ThemeToggler>
      </div>
    </header>
  );
};

export default Header;
