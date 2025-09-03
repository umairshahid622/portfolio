import { useState } from "react";
import type { TechnicalSkills } from "../../types/user.type";
import ZoopButton from "../ZoopButton";
import TabItem from "./TabItem";

interface Props {
  items: TechnicalSkills[];
}

const Tabs = ({ items }: Props) => {
  const [activeIndex, setActiveIndex] = useState(1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-2 overflow-hidden flex-wrap">
        {items.map((skill, index) => {
          return (
            <ZoopButton
              color={activeIndex === index ? 'text-brand-orange' :'text-color'}
              title={skill.title}
              click={() => setActiveIndex((prev: any) => (prev = index))}
              key={skill.title}
            />
          );
        })}
      </div>
      <div>
        <TabItem icons={items[activeIndex].icons}></TabItem>
      </div>
    </div>
  );
};

export default Tabs;
