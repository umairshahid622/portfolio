import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";
import { useLoading } from "../context/LoadingContext";
import AvatarCanvas from "./AvatarCanvas";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { isDark } = useTheme();

  let curtainParting = true;
  try {
    const loading = useLoading();
    curtainParting = loading.curtainParting;
  } catch {
    // Graceful fallback when outside LoadingProvider
  }

  // Entrance animations using GSAP, synchronized with CurtainLoader reveal
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) return;

      // Keep hidden until curtain begins parting
      if (!curtainParting) {
        gsap.set(".hero-heading-line", { opacity: 0, y: 40 });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.25, // Synchronized with curtain parting reveal
      });

      tl.to(".hero-heading-line", {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.9,
      });
    },
    { scope: containerRef, dependencies: [curtainParting] }
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-12 px-5 sm:px-8 md:px-12 overflow-hidden bg-earth-cream dark:bg-earth-forest text-earth-forest dark:text-earth-cream transition-colors duration-300"
    >
      {/* Ambient background lighting and subtle gradients */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top-right terracotta warm glow */}
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-earth-terracotta/15 to-earth-sand/20 dark:from-earth-terracotta/20 dark:to-earth-sand/10 blur-[130px]" />

        {/* Center-left moss green organic glow */}
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-earth-moss/15 dark:from-earth-moss/30 to-transparent blur-[140px]" />

        {/* Bottom subtle glow */}
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-earth-terracotta/10 blur-[150px]" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* 3D Avatar Character Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <AvatarCanvas isDark={isDark} />
      </div>

      {/* Main Hero Content - Flanking the 3D Character */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center my-auto z-10 px-4 sm:px-6 md:px-8">
        <h1 className="w-full flex items-center justify-between select-none">
          {/* Left Wing: Umair */}
          <div className="flex-1 flex justify-end overflow-hidden pr-2 sm:pr-4 md:pr-8 lg:pr-10">
            <span className="hero-heading-line block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-earth-forest dark:text-earth-cream leading-none text-right">
              Umair
            </span>
          </div>

          {/* Central Corridor for 3D Character */}
          <div
            className="w-36 shrink-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* Right Wing: Shahid */}
          <div className="flex-1 flex justify-start overflow-hidden pl-2 sm:pl-4 md:pl-8 lg:pl-10">
            <span className="hero-heading-line block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-earth-terracotta via-earth-moss to-earth-terracotta dark:from-earth-sand dark:via-earth-terracotta dark:to-earth-sand leading-none text-left">
              Shahid
            </span>
          </div>
        </h1>
      </div>

      {/* Bottom Middle: Full-Stack Engineer */}
      <div className="w-full flex items-center justify-center z-10 overflow-hidden pb-4">
        <h2 className="hero-heading-line text-xl sm:text-2xl md:text-3xl font-semibold text-earth-forest/90 dark:text-earth-cream/90 tracking-tight text-center">
          Full-Stack Engineer
        </h2>
      </div>
    </section>
  );
}
