import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLoading } from "../context/LoadingContext";
import { cn } from "../utils/cn";

gsap.registerPlugin(ScrollTrigger);

export default function CurtainLoader() {
  const { isCurtainComplete, setIsCurtainComplete, setCurtainParting } = useLoading();
  const { progress: dreiProgress } = useProgress();

  const [displayProgress, setDisplayProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const centerContentRef = useRef<HTMLDivElement>(null);
  const leftBorderRef = useRef<HTMLDivElement>(null);
  const rightBorderRef = useRef<HTMLDivElement>(null);
  const isOpeningRef = useRef(false);

  // Smoothly increment displayProgress towards target progress
  useEffect(() => {
    const target = Math.min(Math.max(20, Math.round(dreiProgress)), 100);

    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= target) {
          if (prev >= 100) clearInterval(interval);
          return prev;
        }
        // Smooth progression
        const diff = target - prev;
        const step = diff > 20 ? 3 : 1;
        const next = Math.min(prev + step, target);
        return next;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [dreiProgress]);

  // Safety fallback: Never lock user out if network or WebGL hangs
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setDisplayProgress(100);
    }, 5000);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Prevent scrolling when the loader is appeared / active
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isCurtainComplete) {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);

      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      const preventScroll = (e: Event) => {
        e.preventDefault();
      };

      const preventKeys = (e: KeyboardEvent) => {
        if (
          [
            "Space",
            "PageUp",
            "PageDown",
            "End",
            "Home",
            "ArrowLeft",
            "ArrowUp",
            "ArrowRight",
            "ArrowDown",
          ].includes(e.code)
        ) {
          e.preventDefault();
        }
      };

      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("keydown", preventKeys, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
        window.removeEventListener("keydown", preventKeys);
      };
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  }, [isCurtainComplete]);

  // Trigger curtain split reveal when displayProgress is 100
  useEffect(() => {
    if (isOpeningRef.current) return;
    if (displayProgress >= 100) {
      isOpeningRef.current = true;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Small delay so user sees 100% and "Ready"
      const delayTimer = setTimeout(() => {
        if (prefersReducedMotion) {
          setCurtainParting(true);
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
              document.body.style.overflow = "";
              document.documentElement.style.overflow = "";
              window.scrollTo(0, 0);
              ScrollTrigger.clearScrollMemory("manual");
              setIsCurtainComplete(true);
              requestAnimationFrame(() => {
                window.scrollTo(0, 0);
                ScrollTrigger.clearScrollMemory("manual");
                ScrollTrigger.refresh();
              });
            },
          });
          return;
        }

        const tl = gsap.timeline({
          onStart: () => {
            setCurtainParting(true);
          },
          onComplete: () => {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
            window.scrollTo(0, 0);
            ScrollTrigger.clearScrollMemory("manual");
            setIsCurtainComplete(true);
            requestAnimationFrame(() => {
              window.scrollTo(0, 0);
              ScrollTrigger.clearScrollMemory("manual");
              ScrollTrigger.refresh();
            });
          },
        });

        if (typeof window !== "undefined") {
          (window as any).__curtainTimeline = tl;
        }

        // 1. Fade out and scale down center loading content
        tl.to(centerContentRef.current, {
          scale: 0.9,
          opacity: 0,
          y: -15,
          filter: "blur(6px)",
          duration: 0.45,
          ease: "power2.inOut",
        });

        // 2. Brighten and intensify borders right before parting
        tl.to(
          [leftBorderRef.current, rightBorderRef.current],
          {
            boxShadow:
              "0 0 12px rgba(221, 161, 94, 0.75), 0 0 3px rgba(255, 255, 255, 0.6)",
            duration: 0.25,
          },
          "-=0.2"
        );

        // 3. Part the curtain doors smoothly - borders travel with them all the way to screen edges
        tl.to(
          leftPanelRef.current,
          {
            xPercent: -100,
            duration: 1.15,
            ease: "power4.inOut",
          },
          "-=0.1"
        );

        tl.to(
          rightPanelRef.current,
          {
            xPercent: 100,
            duration: 1.15,
            ease: "power4.inOut",
          },
          "<" // Start at same time as left panel
        );
      }, 350);

      return () => clearTimeout(delayTimer);
    }
  }, [displayProgress, setCurtainParting, setIsCurtainComplete]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-[9990] overflow-hidden select-none transition-[visibility] duration-0",
        isCurtainComplete
          ? "pointer-events-none opacity-0 invisible"
          : "pointer-events-auto opacity-100 visible"
      )}
      aria-label="Loading Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* Left Curtain Panel */}
      <div
        ref={leftPanelRef}
        className="curtain-panel-left absolute top-0 left-0 w-1/2 h-full will-change-transform"
      >
        {/* Soft atmospheric ambient glow container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-earth-terracotta/15 blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-72 h-72 rounded-full bg-earth-moss/20 blur-[100px]" />
        </div>

        {/* Luminous Right Border - attached to and travels with Left Door */}
        <div
          ref={leftBorderRef}
          className="curtain-luminous-border absolute top-0 right-0 w-[1px] h-full pointer-events-none z-10 will-change-transform"
        />
      </div>

      {/* Right Curtain Panel */}
      <div
        ref={rightPanelRef}
        className="curtain-panel-right absolute top-0 right-0 w-1/2 h-full will-change-transform"
      >
        {/* Soft atmospheric ambient glow container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-earth-sand/15 blur-[120px]" />
          <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full bg-earth-terracotta/15 blur-[100px]" />
        </div>

        {/* Luminous Left Border - attached to and travels with Right Door */}
        <div
          ref={rightBorderRef}
          className="curtain-luminous-border absolute top-0 left-0 w-[1px] h-full pointer-events-none z-10 will-change-transform"
        />
      </div>

      {/* Center Loader Content - Loading Progress Only */}
      <div
        ref={centerContentRef}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-6 text-center"
      >
        {/* Large Minimalist Progress Counter */}
        <div className="flex items-baseline justify-center">
          <span className="text-7xl sm:text-9xl font-black font-heading text-earth-cream tracking-tight tabular-nums drop-shadow-2xl">
            {displayProgress}
          </span>
          <span className="text-3xl sm:text-5xl font-heading font-bold text-earth-sand ml-2">
            %
          </span>
        </div>        
      </div>
    </div>
  );
}
