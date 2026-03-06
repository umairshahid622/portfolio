import { useRef } from "react";
import HeroSection from "../components/home/HeroSection";
import OverViewSection from "../components/home/OverViewSection";
import ContactMeSection from "../components/home/ContactMeSection";
import ExperienceSection from "../components/home/ExperienceSection";
const Home = () => {
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const contactMeRef = useRef<HTMLDivElement | null>(null);
  return (
    <>
      <section>
        <HeroSection overViewRef={overviewRef} contactMeRef={contactMeRef} />
      </section>

      <section ref={overviewRef}>
        <OverViewSection />
      </section>

      <section>
        <ExperienceSection />        
      </section>  

      <section ref={contactMeRef} className="pb-14">
        <ContactMeSection />
      </section>
    </>
  );
};

export default Home;
