import { useRef } from "react";
import HeroSection from "../components/home/HeroSection";
import OverViewSection from "../components/home/OverViewSection";
import ContactMeSection from "../components/home/ContactMeSection";

const Home = () => {
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const contactMeRef = useRef<HTMLDivElement | null>(null);
  return (
    <>
      <section className="">
        <HeroSection overViewRef={overviewRef} contactMeRef={contactMeRef} />
      </section>
      <section ref={overviewRef} className="px-4">
        <OverViewSection />
      </section>
      <section ref={contactMeRef} className="px-4">
          <ContactMeSection />
      </section>
    </>
  );
};

export default Home;
