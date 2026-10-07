import Header from "./components/Header";
import Hero from "./components/Hero";
import Overview from "./components/Overview";
import Skills from "./components/Skills";
import ParticleExperienceWrapper from "./components/ParticleExperienceWrapper";
import SmoothCursor from "./components/SmoothCursor";
import CurtainLoader from "./components/CurtainLoader";
import { LoadingProvider } from "./context/LoadingContext";

export default function App() {
  return (
    <LoadingProvider>
      <CurtainLoader />
      <div className="min-h-screen w-full relative bg-earth-cream dark:bg-earth-forest text-earth-forest dark:text-earth-cream transition-colors duration-300 overflow-x-clip selection:bg-earth-terracotta selection:text-earth-cream">
        <Header />
        <main className="w-full relative z-10">
          {/* Hero section is completely standalone */}
          <Hero />

          {/* Unified particle experience wrapper for Overview & Skills */}
          <ParticleExperienceWrapper>
            <Overview />
            <Skills />
          </ParticleExperienceWrapper>
        </main>
        <SmoothCursor />
      </div>
    </LoadingProvider>
  );
}
