import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { useLoading } from "../context/LoadingContext";

export default function CurtainLoader() {
  const { avatarReady, isCurtainComplete, setIsCurtainComplete, setCurtainParting } = useLoading();
  const { progress: dreiProgress } = useProgress();

  const [displayProgress, setDisplayProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const centerContentRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const isOpeningRef = useRef(false);

  // Smoothly increment displayProgress towards target progress
  useEffect(() => {
    // If avatar is not yet ready, cap smooth progression at 90%
    const maxAllowed = avatarReady ? 100 : 90;
    let target = Math.min(Math.max(10, Math.round(dreiProgress)), maxAllowed);

    if (avatarReady) {
      target = 100;
    }

    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= target) {
          if (prev >= 100) clearInterval(interval);
          return prev;
        }
        // Smooth progression: 1 to 2 percent per tick
        const diff = target - prev;
        const step = diff > 30 ? 2 : 1;
        const next = Math.min(prev + step, target);
        return next;
      });
    }, 24);

    return () => clearInterval(interval);
  }, [dreiProgress, avatarReady]);

  // Safety fallback: Never lock user out if network or WebGL hangs
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setDisplayProgress(100);
    }, 5000);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Trigger curtain split reveal when both displayProgress is 100 and avatar is ready
  useEffect(() => {
    if (isOpeningRef.current) return;
    if (displayProgress >= 100 && avatarReady) {
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
              setIsCurtainComplete(true);
            },
          });
          return;
        }

        const tl = gsap.timeline({
          onStart: () => {
            setCurtainParting(true);
          },
          onComplete: () => {
            setIsCurtainComplete(true);
          },
        });

        // 1. Fade out and scale down center loading content
        tl.to(centerContentRef.current, {
          scale: 0.9,
          opacity: 0,
          y: -15,
          filter: "blur(6px)",
          duration: 0.45,
          ease: "power2.inOut",
        });

        // 2. Brighten seam line right before split
        tl.to(
          seamRef.current,
          {
            scaleY: 1.15,
            opacity: 1,
            boxShadow: "0 0 25px rgba(221, 161, 94, 0.9)",
            duration: 0.25,
          },
          "-=0.2"
        );

        // 3. Part the curtain doors smoothly
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

        // 4. Fade out seam line as panels slide away
        tl.to(
          seamRef.current,
          {
            opacity: 0,
            duration: 0.35,
          },
          "<"
        );
      }, 350);

      return () => clearTimeout(delayTimer);
    }
  }, [displayProgress, avatarReady, setCurtainParting, setIsCurtainComplete]);

  if (isCurtainComplete) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9990] overflow-hidden select-none pointer-events-auto"
      aria-label="Loading Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* Left Curtain Panel */}
      <div
        ref={leftPanelRef}
        className="absolute top-0 left-0 w-1/2 h-full bg-[#1b2511] border-r border-earth-sand/20 flex items-center justify-end overflow-hidden will-change-transform"
        style={{
          background:
            "radial-gradient(circle at 100% 50%, #293817 0%, #1e2a12 60%, #141c0c 100%)",
        }}
      >
        {/* Soft atmospheric ambient glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-earth-terracotta/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 rounded-full bg-earth-moss/20 blur-[100px] pointer-events-none" />
      </div>

      {/* Right Curtain Panel */}
      <div
        ref={rightPanelRef}
        className="absolute top-0 right-0 w-1/2 h-full bg-[#1b2511] border-l border-earth-sand/20 flex items-center justify-start overflow-hidden will-change-transform"
        style={{
          background:
            "radial-gradient(circle at 0% 50%, #293817 0%, #1e2a12 60%, #141c0c 100%)",
        }}
      >
        {/* Soft atmospheric ambient glow */}
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-earth-sand/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full bg-earth-terracotta/15 blur-[100px] pointer-events-none" />
      </div>

      {/* Luminous Center Seam Line */}
      <div
        ref={seamRef}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full pointer-events-none z-15 will-change-transform"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, #bc6c25 25%, #dda15e 50%, #bc6c25 75%, transparent 100%)",
          boxShadow: "0 0 16px rgba(188, 108, 37, 0.6)",
        }}
      />

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
