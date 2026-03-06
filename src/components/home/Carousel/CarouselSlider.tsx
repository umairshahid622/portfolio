import { useState } from "react";
import { ArrowIcon } from "../../icons/Icons";
import CarouselContent from "./CarouselContent";
import type { WorkExperience } from "../../../types/user.type";
import { AnimatePresence, motion } from "motion/react";

const CarouselSlider = ({ items }: { items: WorkExperience[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) return items.length - 1;
      return prev - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      if (prev === items.length - 1) return 0;
      return prev + 1;
    });
  };

  if (items.length === 0) return null;
  
  return (
    <div className="relative flex min-h-[280px] items-center justify-center rounded-2xl border border-light-border/60 bg-gradient-to-br from-light-bg/80 via-light-bg/40 to-light-bg/10 p-4 shadow-lg shadow-brand-primary/5 dark:border-dark-border/60 dark:from-dark-bg/80 dark:via-dark-bg/40 dark:to-dark-bg/10 dark:shadow-brand-primary/15 lg:h-94 lg:p-6">
      {/* Left arrow */}
      <motion.button
        type="button"
        onClick={handlePrevious}
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        className="absolute z-10 left-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-light-border/70 bg-light-surface/80 p-2 text-muted-foreground shadow-sm backdrop-blur-md hover:border-brand-primary hover:text-brand-primary dark:border-dark-border/70 dark:bg-dark-surface/80"
        aria-label="Previous experience"
      >
        <ArrowIcon className="size-6" />
      </motion.button>

      {/* Right arrow */}
      <motion.button
        type="button"
        onClick={handleNext}
        whileHover={{ scale: 1.05, x: 2 }}
        whileTap={{ scale: 0.95 }}
        className="absolute z-10 right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-light-border/70 bg-light-surface/80 p-2 text-muted-foreground shadow-sm backdrop-blur-md hover:border-brand-primary hover:text-brand-primary dark:border-dark-border/70 dark:bg-dark-surface/80"
        aria-label="Next experience"
      >
        <ArrowIcon className="size-6 rotate-180" />
      </motion.button>

      {/* Slide content */}
      <div className="flex-grow px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <CarouselContent item={items[currentIndex]} num={currentIndex + 1} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CarouselSlider;
