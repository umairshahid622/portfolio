import { motion, type Variants } from "motion/react";
import { useTheme } from "../../hooks/useTheme";
import type { SkillIcon } from "../../types/user.type";
import { DURATION } from "../../constants/framer-duration";

interface Props {
  icons: SkillIcon[];
}

const TabItem = ({ icons }: Props) => {
  const { resolved } = useTheme();

  const variants: Variants = {
    inital: { y: 0 },
    animate: { y: 10 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="flex flex-wrap items-center justify-center gap-4"
    >
      {icons.map((icon, index) => {
        return (
          <motion.a
            variants={variants}
            initial="initial"
            animate="animate"
            transition={{
              duration: DURATION + 1,
              repeat: Infinity,
              delay: Math.random() * 1,
              repeatType: "mirror",
            }}
            key={index}
            className="border-2 border-light-border dark:border-dark-border rounded-lg size-14 md:size-20 p-3 cursor-pointer relative"
          >
            <img
              className="size-full"
              src={resolved === "dark" ? icon.darkIconPath : icon.iconPath}
              alt=""
            />
          </motion.a>
        );
      })}
    </motion.div>
  );
};

export default TabItem;
