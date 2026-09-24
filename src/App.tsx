import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AvatarCanvas from "./components/AvatarCanvas";

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
      })
        .from(
          ".hero-tag",
          {
            scale: 0.85,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.4"
        )
        .from(
          ".hero-title",
          {
            y: 40,
            opacity: 0,
            duration: 0.9,
          },
          "-=0.3"
        )
        .from(
          ".hero-subtitle",
          {
            y: 20,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        )
        .from(
          ".avatar-container",
          {
            scale: 0.92,
            opacity: 0,
            duration: 1.1,
            ease: "expo.out",
          },
          "-=0.6"
        )
        .from(
          ".avatar-hint",
          {
            y: 15,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.4"
        );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col justify-between relative px-6 md:px-12 py-6 overflow-hidden select-none bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-300"
    >
      

      {/* Navigation Header */}
      <Header />

      {/* Main Avatar Presentation Area */}
      <main className="w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center my-6 z-10">
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
