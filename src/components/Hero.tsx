import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";
import AvatarCanvas from "./AvatarCanvas";

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
          {/* Status badge */}
          <div className="hero-status-pill inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-earth-forest/10 dark:border-earth-cream/15 bg-earth-forest/5 dark:bg-earth-surface/50 backdrop-blur-md mb-6 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-earth-terracotta dark:bg-earth-sand opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-earth-terracotta dark:bg-earth-sand" />
            </span>
            <span className="text-xs font-mono font-medium tracking-wide text-earth-moss dark:text-earth-sand uppercase">
              Available for Full-Time &amp; Projects
            </span>
          </div>

          {/* Intro line */}
          <div className="overflow-hidden mb-2">
            <p className="hero-heading-line text-sm sm:text-base font-mono uppercase tracking-[0.25em] text-earth-moss dark:text-earth-sand font-semibold">
              Hi! I am
            </p>
          </div>

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
              Full-Stack Engineer &amp; Creative Technologist
            </h2>
          </div>

          {/* Narrative description */}
          <p className="hero-description text-base sm:text-lg text-earth-forest/80 dark:text-earth-cream/75 max-w-xl leading-relaxed mb-8">
            Engineering scalable web applications with clean architectures, intuitive user
            interfaces, and interactive 3D digital experiences that engage and inspire.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="hero-cta-group flex flex-wrap items-center gap-4 mb-8">
            <a
              href="#projects"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-earth-terracotta to-earth-sand hover:from-earth-sand hover:to-earth-terracotta text-earth-cream dark:text-earth-forest font-bold text-sm tracking-wide shadow-lg shadow-earth-terracotta/25 hover:shadow-earth-terracotta/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 group cursor-pointer"
            >
              <span>Explore Projects</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>

            <a
              href="/Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl border border-earth-forest/20 dark:border-earth-cream/20 hover:border-earth-terracotta text-earth-forest dark:text-earth-cream bg-earth-forest/5 dark:bg-earth-forest/40 hover:bg-earth-terracotta/10 backdrop-blur-md font-semibold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download CV</span>
            </a>
          </div>

          {/* Tech Stack Pills */}
          <div className="w-full pt-4 border-t border-earth-forest/10 dark:border-earth-cream/10">
            <span className="text-[11px] font-mono uppercase tracking-widest text-earth-moss dark:text-earth-sand/80 block mb-3">
              Core Technologies &amp; Tools
            </span>
            <div className="flex flex-wrap gap-2">
              {TECH_BADGES.map((tech) => (
                <span
                  key={tech}
                  className="hero-tech-badge px-3 py-1 rounded-lg text-xs font-mono font-medium bg-earth-forest/5 dark:bg-earth-surface/60 border border-earth-forest/10 dark:border-earth-cream/10 text-earth-forest/80 dark:text-earth-cream/85 hover:border-earth-terracotta/40 hover:text-earth-terracotta dark:hover:text-earth-sand transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Seamless 3D Avatar (No box/frame) */}
        <div className="hero-avatar-box w-full lg:w-1/2 h-[480px] sm:h-[560px] lg:h-[640px] xl:h-[700px] relative flex items-center justify-center">
          {/* Subtle ambient organic glow behind the character */}
          <div className="absolute w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] rounded-full bg-gradient-to-tr from-earth-moss/25 via-earth-terracotta/15 to-earth-sand/20 blur-3xl -z-10 pointer-events-none" />

          {/* Borderless 3D Canvas */}
          <AvatarCanvas isDark={isDark} />
        </div>
      </div>

      {/* Bottom Scroll Down Hint */}
      <div className="hero-scroll-indicator w-full flex flex-col items-center justify-center pt-8 pb-2 z-10 pointer-events-none">
        <a
          href="#about"
          className="pointer-events-auto flex flex-col items-center gap-2 text-earth-moss/80 dark:text-earth-sand/80 hover:text-earth-forest dark:hover:text-earth-cream transition-colors group cursor-pointer"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.25em]">
            Scroll Down
          </span>
          <div className="w-5 h-8 rounded-full border border-earth-moss/40 dark:border-earth-sand/40 group-hover:border-earth-terracotta dark:group-hover:border-earth-sand flex items-start justify-center p-1 transition-colors">
            <div className="w-1 h-2 rounded-full bg-earth-terracotta dark:bg-earth-sand animate-bounce" />
          </div>
        </a>
      </div>
    </section>
  );
}
