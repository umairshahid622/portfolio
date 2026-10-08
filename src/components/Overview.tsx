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
      if (!drum || !section) return;

      // Start with the first 5 lines in the focal reading zone (lines 0-4 centered at line 2)
      const initialRotation = 2 * stepAngle;
      // Stop symmetrically when the last 5 lines settle in the focal reading zone (lines 9-13 centered at line 11)
      const totalRotation = (PARAGRAPH_LINES.length - 3) * stepAngle;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${Math.max(1000, PARAGRAPH_LINES.length * 60)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;

            // About me text particles stay assembled during the first half of the roller,
            // then smoothly take flight and spread into the cosmic nebula starting in the middle.
            // Phase A (0.0 -> 0.45): Roller starts and rolls through initial lines; "ABOUT ME" text stays assembled
            // Phase B (0.45 -> 0.85): Starting in the middle of the roller, particles spread out into the cosmic nebula
            // Phase C (0.85 -> 1.0): Fully dispersed as roller reaches final lines and settles
            const spreadStart = 0.45;
            const spreadEnd = 0.85;

            if (p < spreadStart) {
              particleBridge.overviewProgress = 0.0;
            } else if (p > spreadEnd) {
              particleBridge.overviewProgress = 1.0;
            } else {
              const spreadProgress = (p - spreadStart) / (spreadEnd - spreadStart);
              particleBridge.overviewProgress = Math.min(1.0, Math.max(0.0, spreadProgress));
            }
          },
        },
      });
      tl.fromTo(
        drum,
        { rotateX: initialRotation },
        {
          rotateX: totalRotation,
          ease: "none",
          duration: 0.9,
        }
      ).to({}, { duration: 0.1 }); // Hold resting state at the end before unpinning

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
