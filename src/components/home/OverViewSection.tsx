import { motion } from "motion/react";
import { user } from "../../data/user";
import ColorShiftText from "../ColorShiftText";
import { DELAY, DURATION } from "../../constants/framer-duration";
import Tabs from "./Tabs";

const OverViewSection = () => {
  return (
    <div className="w-full space-y-6">
      <div>
        <p>Introduction</p>
        <ColorShiftText title={"OverView."}/>
        <p className="max-w-2xl">{user.professionDescription}</p>
      </div>
      <div className="space-y-6">
        <motion.h4
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: DURATION, delay: DELAY }}
          className="text-center"
        >
          Technical Skills
        </motion.h4>
        <Tabs items={user.technicalSkills} />
      </div>
    </div>
  );
};

export default OverViewSection;
