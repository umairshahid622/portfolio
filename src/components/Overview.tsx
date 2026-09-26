import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Overview() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
        defaults: { ease: "power3.out" },
      });

      tl.from(".overview-tag", {
        y: 20,
        opacity: 0,
        duration: 0.6,
      })
        .from(
          ".overview-heading",
          {
            y: 35,
            opacity: 0,
            duration: 0.85,
          },
          "-=0.3"
        )
        .from(
          ".overview-lead",
          {
            y: 25,
            opacity: 0,
            duration: 0.75,
          },
          "-=0.45"
        )
        .from(
          ".overview-body",
          {
            y: 25,
            opacity: 0,
            duration: 0.75,
            stagger: 0.12,
          },
          "-=0.45"
        )
        .from(
          ".overview-pillar",
          {
            y: 20,
            opacity: 0,
            duration: 0.65,
            stagger: 0.08,
          },
          "-=0.35"
        );
    },
    { scope: sectionRef }
  );

  return (
    <div
      ref={sectionRef}
      id="overview"
      className="w-full min-h-screen snap-start relative flex flex-col justify-center px-6 md:px-12 lg:px-20 py-20 md:py-28 bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-300 overflow-x-hidden"
    >
      {/* Atmospheric lighting orbs */}
      <div className="absolute top-1/4 -right-28 w-96 h-96 bg-brand-orange/10 dark:bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-28 w-96 h-96 bg-brand-green/10 dark:bg-brand-green/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 md:gap-10 relative z-10">
        {/* Section Header Eyebrow */}
        <div className="overview-tag flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-brand-orange font-semibold">
            01 / Overview
          </span>
          <span className="h-px w-16 bg-black/10 dark:bg-white/10" />
        </div>

        {/* Display Title */}
        <div className="overview-heading">
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[0.25px] leading-[0.95] text-[var(--text-color)]">
            Professional <span className="font-heading text-brand-orange">Summary</span>
          </h2>
        </div>

        {/* Two-Column Editorial Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Lead Highlight & Actions */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <p className="overview-lead text-lg sm:text-xl md:text-2xl leading-relaxed font-normal text-[var(--text-color)]">
              Full-Stack Developer with hands-on experience building and shipping modern web and cross-platform mobile applications using{" "}
              <strong className="text-brand-orange font-semibold">
                React, Next.js, Angular, Node.js, and Flutter
              </strong>
              .
            </p>

            <div className="overview-body flex flex-wrap items-center gap-3 pt-1">
              {/* Direct Resume Download Link */}
              <a
                href="/Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand-orange text-white font-medium text-xs sm:text-sm shadow-md shadow-brand-orange/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>View Full Resume (PDF)</span>
              </a>

              {/* Email Contact Link */}
              <a
                href="mailto:shahidumair622@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-xs sm:text-sm text-[var(--text-color)] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <span>Get in touch</span>
                <span className="text-brand-orange">→</span>
              </a>
            </div>

            {/* Quick Context Badges */}
            <div className="overview-body flex flex-wrap gap-2 pt-1 text-xs text-[var(--paragraph-color)] font-mono">
              <span className="px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                📍 Islamabad, Pakistan
              </span>
              <span className="px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                🎓 BS Information Technology (Bahria University)
              </span>
            </div>
          </div>

          {/* Right Column: Detailed Architectural Background */}
          <div className="lg:col-span-6 flex flex-col gap-4 text-sm sm:text-base leading-relaxed text-[var(--paragraph-color)]">
            <p className="overview-body">
              Proven expertise in developing scalable frontend architectures and secure backend systems using{" "}
              <strong className="text-[var(--text-color)] font-semibold">
                Node.js, Express.js, and NestJS
              </strong>
              , delivering high-performance RESTful APIs and seamless user experiences.
            </p>

            <p className="overview-body">
              Strong Dart programming skills with state management (
              <strong className="text-[var(--text-color)] font-medium">GetX, Bloc, Provider</strong>
              ), multi-flavor builds, localization, and Dart isolates. Experienced in integrating third-party APIs, implementing responsive UI/UX designs, writing test cases, and optimizing applications through efficient state management and performance techniques.
            </p>

            <p className="overview-body">
              Strong understanding of database management, authentication systems, and cloud-based solutions, with the ability to deliver end-to-end development. Known for strong analytical thinking, clear communication, and effective collaboration.
            </p>
          </div>
        </div>

        {/* Competency Pillars derived directly from Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-black/10 dark:border-white/10">
          <div className="overview-pillar p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
              Frontend Systems
            </span>
            <span className="text-sm font-semibold text-[var(--text-color)]">
              React &middot; Next.js &middot; Angular
            </span>
            <p className="text-xs text-[var(--paragraph-color)] leading-snug">
              Scalable UI architectures &amp; responsive interfaces
            </p>
          </div>

          <div className="overview-pillar p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
              Backend &amp; APIs
            </span>
            <span className="text-sm font-semibold text-[var(--text-color)]">
              Node.js &middot; Express &middot; NestJS
            </span>
            <p className="text-xs text-[var(--paragraph-color)] leading-snug">
              Secure RESTful services &amp; JWT authentication
            </p>
          </div>

          <div className="overview-pillar p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
              Mobile Engineering
            </span>
            <span className="text-sm font-semibold text-[var(--text-color)]">
              Flutter &middot; Dart &middot; GetX / Bloc
            </span>
            <p className="text-xs text-[var(--paragraph-color)] leading-snug">
              Multi-flavor builds, isolates &amp; localization
            </p>
          </div>

          <div className="overview-pillar p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
              Data &amp; Scale
            </span>
            <span className="text-sm font-semibold text-[var(--text-color)]">
              Databases &middot; Cloud &middot; CI/CD
            </span>
            <p className="text-xs text-[var(--paragraph-color)] leading-snug">
              End-to-end delivery &amp; performance tuning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
