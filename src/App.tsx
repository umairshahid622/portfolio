import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Overview from "./components/Overview";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Lenis smooth scroll synchronized with GSAP ScrollTrigger
  useEffect(() => {
    // Respect user's motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    // Synchronize Lenis scroll updates with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Synchronize with GSAP's central RAF ticker
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Smoothly scroll to in-page anchors (e.g., #overview)
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement as HTMLElement, {
            offset: 0,
            duration: 1.2,
          });
        }
      }
    };

    // Expose lenis instance globally for programmatic control if needed
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    return () => {
      delete (window as unknown as { lenis?: Lenis }).lenis;
      document.removeEventListener("click", handleAnchorClick);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, []);

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
      className="min-h-screen w-full relative select-none bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-300"
    >
      {/* Fixed Transparent Navigation Header */}
      <Header />

      {/* Main Content Sections */}
      <main className="w-full relative flex flex-col">
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
