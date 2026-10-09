import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ParagraphLine {
  id: number;
  content: string | null;
}

const PARAGRAPH_LINES: ParagraphLine[] = [
  // --- Paragraph 1 ---
  {
    id: 1,
    content: "Full-Stack Developer with hands-on experience building and shipping modern web and cross-platform mobile apps",
  },
  {
    id: 2,
    content: "utilizing React, Next.js, Angular, Node.js, and Flutter across modern production environments.",
  },
  {
    id: 3,
    content: "Proven expertise engineering scalable frontend architectures and resilient, secure backend systems",
  },
  {
    id: 4,
    content: "powered by Node.js, Express.js, and NestJS to deliver high-performance RESTful APIs.",
  },
  {
    id: 5,
    content: "Dedicated to crafting seamless user experiences, responsive layouts, and interactive digital interfaces.",
  },
  {
    id: 6,
    content: "Strong Dart programming skills with state management across GetX, Bloc, and Provider,",
  },
  {
    id: 7,
    content: "experienced in multi-flavor builds, international localization, and multi-threaded Dart isolates.",
  },
  {
    id: 8,
    content: null, // subtle divider break between paragraphs
  },
  // --- Paragraph 2 ---
  {
    id: 9,
    content: "Experienced in seamless third-party API integration, cloud-based microservices, and modern tooling,",
  },
  {
    id: 10,
    content: "implementing fluid UI/UX designs, comprehensive unit testing, and rigorous performance optimization.",
  },
  {
    id: 11,
    content: "Thorough understanding of relational and NoSQL database management, authentication, and cloud solutions,",
  },
  {
    id: 12,
    content: "with the proven ability to deliver end-to-end full-stack development from concept to launch.",
  },
  {
    id: 13,
    content: "Known for strong analytical problem solving, clean maintainable code, and proactive communication,",
  },
  {
    id: 14,
    content: "collaborating effectively with cross-functional teams to build impactful, scalable digital products.",
  },
];

export default function Overview() {
  const sectionRef = useRef<HTMLElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const rollerContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Radius and angular step tuned for wide body text roller
  const radius = isMobile ? 210 : 260;
  const stepAngle = isMobile ? 8.2 : 7.2;

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) return;

      const drum = drumRef.current;
      const section = sectionRef.current;
      const rollerContainer = rollerContainerRef.current;
      if (!drum || !section || !rollerContainer) return;

      // Start with the first 5 lines in the focal reading zone (lines 0-4 centered at line 2)
      const initialRotation = 2 * stepAngle;
      // Roll fully through all 14 lines and roll past the top edge out of the frame
      const totalRotation = (PARAGRAPH_LINES.length + 3) * stepAngle;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${Math.max(1600, PARAGRAPH_LINES.length * 105)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;

            // Phase 1: Early shatter & cosmic dispersal across the full screen (0.06 -> 0.24)
            // Phase 2: Throughout the reading zone (0.24 -> 0.74), particles remain 100% SPREAD across the entire viewport
            const spreadStart = 0.06;
            const spreadEnd = 0.24;

            if (p < spreadStart) {
              particleBridge.overviewProgress = 0.0;
            } else if (p < 0.74) {
              const spreadProgress = (p - spreadStart) / (spreadEnd - spreadStart);
              particleBridge.overviewProgress = Math.min(1.0, Math.max(0.0, spreadProgress));
            } else {
              particleBridge.overviewProgress = 1.0;
            }

            // Phase 3: Only AFTER the roller completes and disappears (at p >= 0.74),
            // particles start merging into "SKILLS" and "</>" earlier!
            const mergeStart = 0.74;
            const mergeEnd = 0.90;

            if (p < mergeStart) {
              particleBridge.skillsProgress = 0.0;
            } else if (p >= mergeEnd) {
              particleBridge.skillsProgress = 1.0;
            } else {
              const mergeProgress = (p - mergeStart) / (mergeEnd - mergeStart);
              particleBridge.skillsProgress = Math.min(1.0, Math.max(0.0, mergeProgress));
            }
          },
        },
      });

      // 1. Full continuous roll through all lines out past the top
      tl.fromTo(
        drum,
        { rotateX: initialRotation },
        {
          rotateX: totalRotation,
          ease: "none",
          duration: 0.74,
        },
        0
      );

      // 2. Disappear smoothly after the final lines finish rolling past
      tl.fromTo(
        rollerContainer,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "power2.inOut",
          duration: 0.08,
        },
        0.66
      );

      // 3. Resting hold so user enjoys the crisply assembled "SKILLS </>" before unpinning
      tl.to({}, { duration: 0.26 }, 0.74);

      const refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);

      return () => clearTimeout(refreshTimer);
    },
    { scope: sectionRef, dependencies: [stepAngle, radius] }
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full h-screen h-[100dvh] max-h-screen py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 bg-transparent text-earth-cream transition-colors duration-300 flex items-center justify-center overflow-hidden select-none"
    >
      <div className="w-full max-w-[94vw] lg:max-w-6xl xl:max-w-7xl mx-auto flex flex-col items-center justify-center relative z-10 px-2 sm:px-4">
        {/* 3D Rolling Drum Container - Shifted downward so while rolling it never intersects with the ABOUT ME constellation text */}
        <div
          ref={rollerContainerRef}
          className="w-full relative select-none will-change-transform flex items-center justify-center mt-6 sm:mt-8 md:mt-10 translate-y-[55px] sm:translate-y-[75px] md:translate-y-[90px]"
          style={{
            perspective: "1150px",
            perspectiveOrigin: "center center",
          }}
        >
          {/* Viewport: Wide roller spanning screen width with 5 lines pure white in center and dull lines above and below */}
          <div
            className="relative w-full max-w-[92vw] lg:max-w-5xl xl:max-w-6xl h-[340px] sm:h-[380px] md:h-[430px] max-h-[52vh] select-none"
            style={{
              perspective: "1100px",
              perspectiveOrigin: "center center",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.22) 8%, rgba(0,0,0,0.22) calc(50% - 114px), rgba(0,0,0,1) calc(50% - 96px), rgba(0,0,0,1) calc(50% + 96px), rgba(0,0,0,0.22) calc(50% + 114px), rgba(0,0,0,0.22) 92%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.22) 8%, rgba(0,0,0,0.22) calc(50% - 114px), rgba(0,0,0,1) calc(50% - 96px), rgba(0,0,0,1) calc(50% + 96px), rgba(0,0,0,0.22) calc(50% + 114px), rgba(0,0,0,0.22) 92%, transparent 100%)",
            }}
          >
            {/* 3D Rotating Drum Container */}
            <div
              ref={drumRef}
              className="absolute inset-0 w-full h-full will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                transform: `rotateX(${2 * stepAngle}deg)`,
              }}
            >
              {PARAGRAPH_LINES.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center text-center px-4 sm:px-6 pointer-events-none select-none will-change-transform"
                  style={{
                    transform: `rotateX(${-index * stepAngle}deg) translateZ(${radius}px)`,
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  {item.content ? (
                    <p className="text-[13.5px] xs:text-[14px] sm:text-[15px] md:text-[16px] font-sans font-normal text-white tracking-normal leading-relaxed w-full max-w-[90vw] lg:max-w-5xl xl:max-w-6xl mx-auto">
                      {item.content}
                    </p>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 my-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
