import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "./components/Header";
import HeroOverviewPortal from "./components/HeroOverviewPortal";
import Skills from "./components/Skills";
import WorkExperience from "./components/WorkExperience";
import Contact from "./components/Contact";
import ParticleExperienceWrapper from "./components/ParticleExperienceWrapper";
import SmoothCursor from "./components/SmoothCursor";
import CurtainLoader from "./components/CurtainLoader";
import { LoadingProvider } from "./context/LoadingContext";
import { initLenis, destroyLenis } from "./utils/lenis";

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

    const lenis = initLenis();

    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      lenis?.scrollTo(0, { immediate: true });
      ScrollTrigger.clearScrollMemory("manual");
      ScrollTrigger.refresh();
    }, 50);

    return () => {
      clearTimeout(timer);
      destroyLenis();
    };
  }, []);

  return (
    <LoadingProvider>
      <CurtainLoader />
      <div className="dark min-h-screen w-full relative bg-earth-forest text-earth-cream overflow-x-clip selection:bg-earth-terracotta selection:text-earth-cream">
        <Header />
        <main className="w-full relative z-10">
          {/* Unified particle experience wrapper for Hero portal, Overview, Skills, Work Experience & Contact */}
          <ParticleExperienceWrapper>
            <HeroOverviewPortal />
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
