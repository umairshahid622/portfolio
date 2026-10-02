import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";
import AvatarCanvas from "./AvatarCanvas";
import AppButton from "./AppButton";

gsap.registerPlugin(useGSAP);

const TECH_BADGES = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Three.js",
  "Tailwind CSS",
  "PostgreSQL",
];

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { isDark } = useTheme();

  // Entrance animations using GSAP
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) return;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.2,
      });

      tl.from(".hero-status-pill", {
        y: -20,
        opacity: 0,
        duration: 0.7,
      })
        .from(
          ".hero-heading-line",
          {
            y: 40,
            opacity: 0,
            stagger: 0.12,
            duration: 0.9,
          },
          "-=0.4"
        )
        .from(
          ".hero-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          ".hero-cta-group",
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          ".hero-tech-badge",
          {
            scale: 0.85,
            opacity: 0,
            stagger: 0.05,
            duration: 0.5,
          },
          "-=0.4"
        )
        .from(
          ".hero-avatar-box",
          {
            scale: 0.92,
            opacity: 0,
            duration: 1.1,
            ease: "expo.out",
          },
          "-=0.9"
        )
        .from(
          ".hero-scroll-indicator",
          {
            y: 15,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.3"
        );
    },
    { scope: containerRef }
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

      {/* Main Hero Content: Two-column layout on desktop, stacked on mobile */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14 my-auto">
        {/* Left Column: Typography, Narrative, and Calls-to-Action */}
        <div className="w-full lg:w-1/2 flex flex-col items-start z-10">





          {/* Main Name Heading */}
          <div className="overflow-hidden mb-4">
            <h1 className="hero-heading-line text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black tracking-tight text-earth-forest dark:text-earth-cream leading-[1.05]">
              Umair{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-earth-terracotta via-earth-moss to-earth-terracotta dark:from-earth-sand dark:via-earth-terracotta dark:to-earth-sand">
                Shahid
              </span>
            </h1>
          </div>
          {/* Subheading / Title */}
          <div className="overflow-hidden mb-6">
            <h2 className="hero-heading-line text-xl sm:text-2xl md:text-3xl font-semibold text-earth-forest/90 dark:text-earth-cream/90 tracking-tight">
              Full-Stack Engineer
            </h2>
          </div>
          
        </div>
      </div>      
    </section>
  );
}
