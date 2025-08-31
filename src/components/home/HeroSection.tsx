// HeroSection.tsx
import { motion, stagger, type Variants } from "motion/react";
import { user } from "../../data/user";
import { ScrollIcon } from "../icons/Icons";
import ZoopButton from "../ZoopButton";
import { DELAY, DURATION } from "../../constants/framer-duration";
import type { RefObject } from "react";
import ComputerCanvas from "../canvas/ComputerCanvas";





const HeroSection = ({
  overViewRef,
  contactMeRef,
}: {
  overViewRef: RefObject<HTMLDivElement | null>;
  contactMeRef: RefObject<HTMLDivElement | null>;
}) => {
  const textVariants: Variants = {
    initial: {
      opacity: 0,
      y: 50,
    },
    inView: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION,
        delayChildren: stagger(DELAY),
      },
    },
  };

  return (
    <>
      <motion.div
        variants={textVariants}
        initial="initial"
        whileInView="inView"
        className="space-y-4 relative z-10 px-4"
      >
        <motion.p
          variants={textVariants}
          className="text-xl md:text-3xl font-medium   text-brand-orange tracking-widest uppercase"
        >
          {user.firstName + " " + user.lastName}
        </motion.p>
        <motion.h1 variants={textVariants}>{user.profession}</motion.h1>
        <motion.p variants={textVariants}>{user.titleDescription}</motion.p>
        <div className="flex items-center gap-3">
          <motion.div
            onClick={() => {
              contactMeRef.current?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            variants={textVariants}
            className="w-fit"
          >
            <ZoopButton title="Contact Me" />
          </motion.div>
          <motion.div variants={textVariants} className="w-fit">
            <ZoopButton title="Download Resume" />
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        onClick={() => {
          overViewRef.current?.scrollIntoView({
            behavior: "smooth",
          });
        }}
        initial={{ transform: "translateY(-30px)", opacity: 1 }}
        animate={{ transform: "translateY(0px)", opacity: 0.05 }}
        transition={{
          duration: DURATION + 1,
          repeat: Infinity,
          repeatType: "mirror",
        }}
        className="absolute size-14 bottom-0 right-1/2 z-20 cursor-pointer "
      >
        <ScrollIcon className="size-full" />
      </motion.div>
      <ComputerCanvas />
    </>
  );
};

export default HeroSection;
