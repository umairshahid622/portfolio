import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Overview from "./components/Overview";

// Register GSAP plugins
gsap.registerPlugin(useGSAP);

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".nav-bar", {
        y: -30,
        opacity: 0,
        duration: 0.8,
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full relative select-none overflow-x-hidden bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-300"
    >
      {/* Fixed Transparent Navigation Header */}
      <Header />

      {/* Main Content Sections */}
      <main className="w-full relative flex flex-col overflow-x-hidden">
        <Hero />
        <Overview />
      </main>

      {/* Page Footer */}
      <div className="w-full px-6 md:px-12 py-4 bg-[var(--background-color)] border-t border-black/5 dark:border-white/5">
        <Footer />
      </div>
    </div>
  );
}
