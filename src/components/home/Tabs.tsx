import { useState } from "react";
import type { TechnicalSkills } from "../../types/user.type";
import ZoopButton from "../ZoopButton";
import TabItem from "./TabItem";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  items: TechnicalSkills[];
}

const Tabs = ({ items }: Props) => {
  const [activeIndex, setActiveIndex] = useState<number>(1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-2 overflow-hidden flex-wrap">
        {items.map((skill, index) => {
          return (
            <ZoopButton
              className={
                activeIndex === index ? "text-brand-orange" : "text-color hover:text-brand-orange"
              }
              title={skill.title}
              click={() => setActiveIndex((prev: number) => (prev = index))}
              key={skill.title}
            />
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{
            y: 20,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            y: 20,
            opacity: 0,
          }}
        >
          <TabItem icons={items[activeIndex].icons}></TabItem>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Tabs;
