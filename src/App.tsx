import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Overview from "./components/Overview";
import Skills from "./components/Skills";
import WorkExperience from "./components/WorkExperience";
import Contact from "./components/Contact";
import ParticleExperienceWrapper from "./components/ParticleExperienceWrapper";
import SmoothCursor from "./components/SmoothCursor";
import CurtainLoader from "./components/CurtainLoader";
import { LoadingProvider } from "./context/LoadingContext";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // Ensure that on initial load or browser refresh, viewport always starts at Hero section
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    ScrollTrigger.clearScrollMemory("manual");

    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      ScrollTrigger.clearScrollMemory("manual");
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadingProvider>
      <CurtainLoader />
      <div className="dark min-h-screen w-full relative bg-earth-forest text-earth-cream overflow-x-clip selection:bg-earth-terracotta selection:text-earth-cream">
        <Header />
        <main className="w-full relative z-10">
          {/* Hero section is completely standalone */}
          <Hero />

          {/* Unified particle experience wrapper for Overview, Skills, Work Experience & Contact */}
          <ParticleExperienceWrapper>
            <Overview />
            <Skills />
            <WorkExperience />
            <Contact />
          </ParticleExperienceWrapper>
        </main>
        <SmoothCursor />
      </div>
    </LoadingProvider>
  );
}
