import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";

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
      }).from(
        ".hero-canvas-container",
        {
          opacity: 0,
          scale: 0.98,
          duration: 1.1,
          ease: "expo.out",
        },
        "-=0.4"
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full relative overflow-x-hidden select-none bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-300"
    >
      {/* Fixed Transparent Navigation Header */}
      <Header />

      {/* Full-Screen Hero Canvas Section */}
      <main className="w-full h-screen min-h-screen relative hero-canvas-container">
        <Hero />
      </main>

      {/* Floating Transparent Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full px-6 md:px-12 py-3 pointer-events-none">
        <div className="pointer-events-auto">
          <Footer />
        </div>
      </div>
    </div>
  );
}
