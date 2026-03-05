import { useRef } from "react";
import HeroSection from "../components/home/HeroSection";
import OverViewSection from "../components/home/OverViewSection";
import ContactMeSection from "../components/home/ContactMeSection";
import ExperienceSection from "../components/home/ExperienceSection";
import CarouselSlider from "../components/home/Carousel/CarouselSlider";
import { user } from "../data/user";
const Home = () => {
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const contactMeRef = useRef<HTMLDivElement | null>(null);
  return (
    <>
      <section className="">
        <HeroSection overViewRef={overviewRef} contactMeRef={contactMeRef} />
      </section>

      <section ref={overviewRef} className="">
        <OverViewSection />
      </section>

      <section className="">
        <ExperienceSection />
        <CarouselSlider items={user.workExperience} />
      </section>

      <section ref={contactMeRef} className="pb-14">
        <ContactMeSection />
      </section>
    </>
  );
};

export default Home;
