import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface WordItem {
  text: string;
  bold?: boolean;
}

const PARAGRAPH_1: WordItem[] = [
  { text: "Proven" },
  { text: "expertise" },
  { text: "in" },
  { text: "developing" },
  { text: "scalable" },
  { text: "frontend" },
  { text: "architectures" },
  { text: "and" },
  { text: "secure" },
  { text: "backend" },
  { text: "systems" },
  { text: "using" },
  { text: "Node.js,", bold: true },
  { text: "Express.js,", bold: true },
  { text: "and", bold: true },
  { text: "NestJS,", bold: true },
  { text: "delivering" },
  { text: "high-performance" },
  { text: "RESTful" },
  { text: "APIs" },
  { text: "and" },
  { text: "seamless" },
  { text: "user" },
  { text: "experiences." },
];

const PARAGRAPH_2: WordItem[] = [
  { text: "Strong" },
  { text: "Dart" },
  { text: "programming" },
  { text: "skills" },
  { text: "with" },
  { text: "state" },
  { text: "management" },
  { text: "(GetX,", bold: true },
  { text: "Bloc,", bold: true },
  { text: "Provider),", bold: true },
  { text: "multi-flavor" },
  { text: "builds," },
  { text: "localization," },
  { text: "and" },
  { text: "Dart" },
  { text: "isolates." },
  { text: "Experienced" },
  { text: "in" },
  { text: "integrating" },
  { text: "third-party" },
  { text: "APIs," },
  { text: "implementing" },
  { text: "responsive" },
  { text: "UI/UX" },
  { text: "designs," },
  { text: "writing" },
  { text: "test" },
  { text: "cases," },
  { text: "and" },
  { text: "optimizing" },
  { text: "applications" },
  { text: "through" },
  { text: "efficient" },
  { text: "state" },
  { text: "management" },
  { text: "and" },
  { text: "performance" },
  { text: "techniques." },
];

const PARAGRAPH_3: WordItem[] = [
  { text: "Strong" },
  { text: "understanding" },
  { text: "of" },
  { text: "database" },
  { text: "management," },
  { text: "authentication" },
  { text: "systems," },
  { text: "and" },
  { text: "cloud-based" },
  { text: "solutions," },
  { text: "with" },
  { text: "the" },
  { text: "ability" },
  { text: "to" },
  { text: "deliver" },
  { text: "end-to-end" },
  { text: "development." },
  { text: "Known" },
  { text: "for" },
  { text: "strong" },
  { text: "analytical" },
  { text: "thinking," },
  { text: "clear" },
  { text: "communication," },
  { text: "and" },
  { text: "effective" },
  { text: "collaboration." },
];

export default function Overview() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


      // 2. Word-by-word left-to-right color wipe scrub
      const fills = rightColRef.current?.querySelectorAll<HTMLElement>(".word-fill");
      if (!fills || fills.length === 0) return;

      if (prefersReducedMotion) {
        gsap.set(fills, { clipPath: "inset(0 0% 0 0)" });
        return;
      }

      const mm = gsap.matchMedia();

      // Desktop: Freeze the entire overview view in place while user scrolls through text reveal
      mm.add("(min-width: 1024px)", () => {
        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=1200",
            pin: true,
            pinSpacing: true,
            scrub: true,
            fastScrollEnd: true,
            preventOverlaps: true,
            invalidateOnRefresh: true,
          },
        });

        fills.forEach((fill) => {
          scrubTl.to(fill, {
            clipPath: "inset(0 0% 0 0)",
            duration: 1,
            ease: "none",
          });
        });
      });

      // Mobile / Tablet portrait: Natural scroll reveal without viewport overflow
      mm.add("(max-width: 1023px)", () => {
        const scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: rightColRef.current,
            start: "top 75%",
            end: "bottom 60%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        fills.forEach((fill) => {
          scrubTl.to(fill, {
            clipPath: "inset(0 0% 0 0)",
            duration: 1,
            ease: "none",
          });
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <div
      ref={sectionRef}
      id="overview"
      className="w-full min-h-screen lg:h-screen relative flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-20 pb-12 lg:pt-24 lg:pb-16 bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-300"
    >
      {/* Atmospheric lighting orbs - GPU layer isolated to prevent expensive rasterization on scroll */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu will-change-transform">
        <div className="absolute top-1/4 -right-28 w-96 h-96 bg-brand-orange/10 dark:bg-brand-orange/15 rounded-full blur-3xl transform-gpu will-change-transform" />
        <div className="absolute bottom-1/4 -left-28 w-96 h-96 bg-brand-green/10 dark:bg-brand-green/15 rounded-full blur-3xl transform-gpu will-change-transform" />
      </div>

      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 md:gap-10 relative z-10">
        {/* Section Header Eyebrow */}
        <div className="overview-tag flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-brand-orange font-semibold">
            01 / Overview
          </span>
          <span className="h-px w-16 bg-black/10 dark:bg-white/10" />
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

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Direct Resume Download Link */}
              <a
                href="/Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="overview-btn inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand-orange text-white font-medium text-xs sm:text-sm shadow-md shadow-brand-orange/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
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
                className="overview-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-xs sm:text-sm text-[var(--text-color)] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <span>Get in touch</span>
                <span className="text-brand-orange">→</span>
              </a>
            </div>

            {/* Quick Context Badges */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-[var(--paragraph-color)] font-mono">
              <span className="overview-badge px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                📍 Islamabad, Pakistan
              </span>
              <span className="overview-badge px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                🎓 BS Information Technology (Bahria University)
              </span>
            </div>

            {/* Competency Pillars moved below empty space in first column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-black/10 dark:border-white/10 mt-1">
              <div className="overview-pillar p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
                  Frontend Systems
                </span>
                <span className="text-sm font-semibold text-[var(--text-color)]">
                  React &middot; Next.js &middot; Angular
                </span>
                <p className="text-xs text-[var(--paragraph-color)] leading-snug">
                  Scalable UI architectures &amp; responsive interfaces
                </p>
              </div>

              <div className="overview-pillar p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
                  Backend &amp; APIs
                </span>
                <span className="text-sm font-semibold text-[var(--text-color)]">
                  Node.js &middot; Express &middot; NestJS
                </span>
                <p className="text-xs text-[var(--paragraph-color)] leading-snug">
                  Secure RESTful services &amp; JWT authentication
                </p>
              </div>

              <div className="overview-pillar p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
                  Mobile Engineering
                </span>
                <span className="text-sm font-semibold text-[var(--text-color)]">
                  Flutter &middot; Dart &middot; GetX / Bloc
                </span>
                <p className="text-xs text-[var(--paragraph-color)] leading-snug">
                  Multi-flavor builds, isolates &amp; localization
                </p>
              </div>

              <div className="overview-pillar p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-orange font-semibold">
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

          {/* Right Column: Detailed Architectural Background with Left-to-Right Word Fill */}
          <div
            ref={rightColRef}
            className="overview-right-col lg:col-span-6 flex flex-col gap-4 text-sm sm:text-base leading-relaxed"
          >

            {/* Paragraph 1 */}
            <p className="leading-relaxed">
              {PARAGRAPH_1.map((item, idx) => (
                <span key={`p1-${idx}`} className="relative inline-block mr-[0.28em] whitespace-nowrap">
                  <span
                    className={
                      item.bold
                        ? "font-semibold text-[var(--text-color)] opacity-25"
                        : "text-[var(--paragraph-color)] opacity-30"
                    }
                  >
                    {item.text}
                  </span>
                  <span
                    className={`word-fill absolute inset-0 select-none pointer-events-none whitespace-nowrap ${
                      item.bold
                        ? "font-semibold text-brand-orange"
                        : "text-[var(--text-color)]"
                    }`}
                    style={{ clipPath: "inset(0 100% 0 0)" }}
                  >
                    {item.text}
                  </span>
                </span>
              ))}
            </p>

            {/* Paragraph 2 */}
            <p className="leading-relaxed">
              {PARAGRAPH_2.map((item, idx) => (
                <span key={`p2-${idx}`} className="relative inline-block mr-[0.28em] whitespace-nowrap">
                  <span
                    className={
                      item.bold
                        ? "font-semibold text-[var(--text-color)] opacity-25"
                        : "text-[var(--paragraph-color)] opacity-30"
                    }
                  >
                    {item.text}
                  </span>
                  <span
                    className={`word-fill absolute inset-0 select-none pointer-events-none whitespace-nowrap ${
                      item.bold
                        ? "font-semibold text-brand-orange"
                        : "text-[var(--text-color)]"
                    }`}
                    style={{ clipPath: "inset(0 100% 0 0)" }}
                  >
                    {item.text}
                  </span>
                </span>
              ))}
            </p>

            {/* Paragraph 3 */}
            <p className="leading-relaxed">
              {PARAGRAPH_3.map((item, idx) => (
                <span key={`p3-${idx}`} className="relative inline-block mr-[0.28em] whitespace-nowrap">
                  <span
                    className={
                      item.bold
                        ? "font-semibold text-[var(--text-color)] opacity-25"
                        : "text-[var(--paragraph-color)] opacity-30"
                    }
                  >
                    {item.text}
                  </span>
                  <span
                    className={`word-fill absolute inset-0 select-none pointer-events-none whitespace-nowrap ${
                      item.bold
                        ? "font-semibold text-brand-orange"
                        : "text-[var(--text-color)]"
                    }`}
                    style={{ clipPath: "inset(0 100% 0 0)" }}
                  >
                    {item.text}
                  </span>
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
