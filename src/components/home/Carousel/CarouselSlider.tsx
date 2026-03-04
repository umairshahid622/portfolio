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
    <div className="relative min-h-[260px] lg:h-96 flex items-center justify-center">
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.25 }}
        className="absolute left-0 top-1/2 -translate-y-1/2"
      >
        <ArrowIcon
          onClick={handlePrevious}
          className="size-10 shrink-0 box-border cursor-pointer"
        />
      </motion.div>
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.25 }}
        className="absolute right-0 top-1/2 -translate-y-1/2"
      >
        <ArrowIcon
          onClick={handleNext}
          className="size-10 shrink-0 box-border cursor-pointer rotate-180"
        />
      </motion.div>
      <div className="flex-grow px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <CarouselContent item={items[currentIndex]} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CarouselSlider;
