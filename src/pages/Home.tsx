import { useRef } from "react";
import HeroSection from "../components/home/HeroSection";
import OverViewSection from "../components/home/OverViewSection";

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
      <section ref={contactMeRef}>
        <h1>ContactMe</h1>
        <h2>ContactMe</h2>
        <h3>ContactMe</h3>
        <h4>ContactMe</h4>
        <h5>ContactMe</h5>
        <h6>ContactMe</h6>
      </section>
    </>
  );
};

export default Home;
