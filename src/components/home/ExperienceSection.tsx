import { motion } from "motion/react";
import { user } from "../../data/user";
import ColorShiftText from "../ColorShiftText";
import CarouselSlider from "./carousel/CarouselSlider";
import { DELAY, DURATION } from "../../constants/framer-duration";
import RoundedBorderText from "../RoundedBorderText";


const ExperienceSection = () => {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-3">
      <RoundedBorderText text={`What I've done so far`}/>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <ColorShiftText title="Work Experience" />
            <p className="max-w-2xl text-sm text-muted-foreground">
              A snapshot of the roles where I&apos;ve built real products,
              shipped features, and learned from working with teams.
            </p>
          </div>          
        </div>

        <div className="h-px w-16 rounded-full bg-gradient-to-r from-brand-primary to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: DURATION, delay: DELAY + 0.05 }}
        className="relative"
      >
        <div className="pointer-events-none absolute inset-x-4 -top-6 -bottom-6 -z-10 rounded-3xl bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/10 blur-3xl" />
        <CarouselSlider items={user.workExperience} />
      </motion.div>
    </div>
  );
};

export default ExperienceSection;