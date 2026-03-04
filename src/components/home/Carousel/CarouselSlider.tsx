import { useState } from "react";
import { ArrowIcon } from "../../icons/Icons";
import CarouselContent from "./CarouselContent";
import type { WorkExperience } from "../../../types/user.type";

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

    <div className="flex w-full h-96 items-center justify-between">
      <ArrowIcon
        onClick={handlePrevious}
        className="size-10 shrink-0 box-border cursor-pointer"
      />
      <div className="flex-grow px-4">
        <CarouselContent item={items[currentIndex]} />
      </div>
      <ArrowIcon
        onClick={handleNext}
        className="size-10 shrink-0 cursor-pointer rotate-180"
      />
    </div>
  );
};

export default CarouselSlider;
