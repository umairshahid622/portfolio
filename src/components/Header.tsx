import { motion } from "motion/react";
import ThemeToggler from "./ThemeToggler";
import { transitionDuration } from "../constants/framer_duration";
import { user } from "../utilities/user";

const Header = () => {
  return (
    <header
      className="
        w-full
        p-4
        bg-transparent
        fixed top-0 right-0
      "
    >
      <div
        className="
          flex
          max-w-7xl
          mx-auto
          items-center justify-between relative
          capitalize
        "
      >
        <motion.h4
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: transitionDuration }}
        >
          {user.firstName}'s {" "}
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
