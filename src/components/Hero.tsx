import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";
import { useLoading } from "../context/LoadingContext";
import AvatarCanvas from "./AvatarCanvas";
import TextSpiralWrap from "./TextSpiralWrap";
import BackgroundParticles from "./BackgroundParticles";
import AtmosphericVeils from "./AtmosphericVeils";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { isDark } = useTheme();

  let curtainParting = true;
  let isCurtainComplete = false;
  try {
    const loading = useLoading();
    curtainParting = loading.curtainParting;
    isCurtainComplete = loading.isCurtainComplete;
  } catch {
    // Graceful fallback when outside LoadingProvider
  }

  const hasAnimatedRef = useRef(false);

  // 1: The Text Popout with 0 space between them (inner letters behind 3D avatar)
  // 2: Both Umair and Shahid separate to their current position
  // 3: Then the Full Stack Engineer line pops out
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set([".hero-popout-umair", ".hero-popout-shahid", ".hero-popout-role"], {
          opacity: 1,
          scale: 1,
          x: 0,
        });
        return;
      }

      // If already animated, keep in final position and never repeat
      if (hasAnimatedRef.current) {
        gsap.set([".hero-popout-umair", ".hero-popout-shahid", ".hero-popout-role"], {
          opacity: 1,
          scale: 1,
          x: 0,
        });
        return;
      }

      // Keep hidden until curtain begins parting
      if (!curtainParting) {
        gsap.set([".hero-popout-umair", ".hero-popout-shahid", ".hero-popout-role"], {
          opacity: 0,
          scale: 0.2,
        });
        return;
      }

      hasAnimatedRef.current = true;

      const umairEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-umair");
      const shahidEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-shahid");
      const roleEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-role");

      if (!umairEl || !shahidEl || !roleEl) return;

      // Measure gap between elements to achieve exact 0px space between them at center
      gsap.set([umairEl, shahidEl], { x: 0, scale: 1 });
      const umairRect = umairEl.getBoundingClientRect();
      const shahidRect = shahidEl.getBoundingClientRect();
      const shiftX = Math.max(0, (shahidRect.left - umairRect.right) / 2);

      // Synchronize with curtain reveal: start as curtains open wide enough (~0.75s after parting start)
      // or immediately if curtain is already complete
      const startDelay = isCurtainComplete ? 0.1 : 0.75;

      const tl = gsap.timeline({
        delay: startDelay,
      });

      if (typeof window !== "undefined") {
        (window as any).__heroTimeline = tl;
      }

      // Initialize at timeline time 0:
      // Umair and Shahid start joined at the center with 0 space between them, hidden
      tl.set(
        umairEl,
        {
          x: shiftX,
          scale: 0.2,
          opacity: 0,
          transformOrigin: "center center",
        },
        0
      );

      tl.set(
        shahidEl,
        {
          x: -shiftX,
          scale: 0.2,
          opacity: 0,
          transformOrigin: "center center",
        },
        0
      );

      tl.set(
        roleEl,
        {
          scale: 0.2,
          opacity: 0,
          transformOrigin: "center center",
        },
        0
      );

      // 1: The Text Popout with 0 space between them at the center (behind 3D character)
      tl.to([umairEl, shahidEl], {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(2.2)",
      });

      // Brief hold so user appreciates the connected name
      tl.to({}, { duration: 0.3 });

      // 2: Both Umair and Shahid separate to their current position
      tl.to(
        umairEl,
        {
          x: 0,
          duration: 0.85,
          ease: "power3.inOut",
        }
      );
      tl.to(
        shahidEl,
        {
          x: 0,
          duration: 0.85,
          ease: "power3.inOut",
        },
        "<" // Part symmetrically at the exact same moment
      );

      // 3: Then the Full Stack Engineer line popout
      tl.to(
        roleEl,
        {
          scale: 1,
          opacity: 1,
          duration: 0.55,
          ease: "back.out(2)",
        },
        "-=0.1" // Starts as Umair and Shahid settle into flanking positions
      );
    },
    { scope: containerRef, dependencies: [curtainParting] }
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-12 px-5 sm:px-8 md:px-12 overflow-hidden bg-earth-cream dark:bg-earth-forest text-earth-forest dark:text-earth-cream transition-colors duration-300"
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-[0.03] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Atmospheric Moving Particles (Glowing rings, bokeh orbs & golden motes) */}
      <BackgroundParticles className="absolute inset-0 pointer-events-none z-0" count={20} />

      {/* Atmospheric SVG Veils, Self-Drawing Bubble Spirals & Randomly Popping GSAP Bubbles */}
      <AtmosphericVeils className="absolute inset-0 pointer-events-none z-0" />

      {/* 3D Avatar Character Layer - z-20 so inner letters are behind the character during popout */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <AvatarCanvas isDark={isDark} />
      </div>

      {/* Main Hero Content - z-10 so it emerges from behind the 3D character */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center my-auto z-10 px-4 sm:px-6 md:px-8">
        <h1 className="w-full flex items-center justify-between select-none">
          {/* Left Wing: Umair */}
          <div className="flex-1 flex justify-end overflow-visible pr-2 sm:pr-4 md:pr-8 lg:pr-10">
            <span
              style={{ opacity: 0 }}
              className="hero-popout-umair block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-earth-forest dark:text-earth-cream leading-none text-right will-change-transform"
            >
              <TextSpiralWrap>Umair</TextSpiralWrap>
            </span>
          </div>

          {/* Central Corridor for 3D Character */}
          <div
            className="w-36 shrink-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* Right Wing: Shahid */}
          <div className="flex-1 flex justify-start overflow-visible pl-2 sm:pl-4 md:pl-8 lg:pl-10">
            <span
              style={{ opacity: 0 }}
              className="hero-popout-shahid block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-earth-terracotta via-earth-moss to-earth-terracotta dark:from-earth-sand dark:via-earth-terracotta dark:to-earth-sand leading-none text-left will-change-transform"
            >
              <TextSpiralWrap>Shahid</TextSpiralWrap>
            </span>
          </div>
        </h1>
      </div>

      {/* Bottom Middle: Full-Stack Engineer - z-30 in front of ground shadow */}
      <div className="w-full flex items-center justify-center z-30 overflow-visible pb-4">
        <h2
          style={{ opacity: 0 }}
          className="hero-popout-role text-xl sm:text-2xl md:text-3xl font-semibold text-earth-forest/90 dark:text-earth-cream/90 tracking-tight text-center will-change-transform"
        >
          <TextSpiralWrap strokeWidth={2}>Full-Stack Engineer</TextSpiralWrap>
        </h2>
      </div>
    </section>
  );
}
