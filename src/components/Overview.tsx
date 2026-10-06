import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ParagraphLine {
  id: number;
  content: string | null;
}

const PARAGRAPH_LINES: ParagraphLine[] = [
  // --- Paragraph 1 ---
  {
    id: 1,
    content: "Full-Stack Developer with hands-on experience",
  },
  {
    id: 2,
    content: "building and shipping modern web and cross-platform",
  },
  {
    id: 3,
    content: "mobile applications using React, Next.js, Angular,",
  },
  {
    id: 4,
    content: "Node.js, and Flutter. Proven expertise developing",
  },
  {
    id: 5,
    content: "scalable frontend architectures and secure backend",
  },
  {
    id: 6,
    content: "systems using Node.js, Express.js, and NestJS,",
  },
  {
    id: 7,
    content: "delivering high-performance RESTful APIs and",
  },
  {
    id: 8,
    content: "seamless user experiences. Strong Dart programming",
  },
  {
    id: 9,
    content: "skills with state management (GetX, Bloc, Provider),",
  },
  {
    id: 10,
    content: "multi-flavor builds, localization, and Dart isolates.",
  },
  {
    id: 11,
    content: null, // subtle divider break between paragraphs
  },
  // --- Paragraph 2 ---
  {
    id: 12,
    content: "Experienced in integrating third-party APIs,",
  },
  {
    id: 13,
    content: "implementing responsive UI/UX designs, writing",
  },
  {
    id: 14,
    content: "test cases, and optimizing applications through",
  },
  {
    id: 15,
    content: "efficient state management and performance techniques.",
  },
  {
    id: 16,
    content: "Strong understanding of database management,",
  },
  {
    id: 17,
    content: "authentication systems, and cloud-based solutions,",
  },
  {
    id: 18,
    content: "with the ability to deliver end-to-end development.",
  },
  {
    id: 19,
    content: "Known for strong analytical thinking, clear",
  },
  {
    id: 20,
    content: "communication, and effective collaboration.",
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

  // Radius and angular step tuned for natural body text paragraph line-height
  const radius = isMobile ? 180 : 230;
  const stepAngle = isMobile ? 8.5 : 7.2;

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
      // Allow the last line to roll fully into the white focal zone (reaches center and top of white band)
      const totalRotation = (PARAGRAPH_LINES.length + 1) * stepAngle;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${Math.max(1000, PARAGRAPH_LINES.length * 60)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 3D rotation of the drum around its horizontal X axis (rolls text upward)
      tl.fromTo(
        drum,
        { rotateX: initialRotation },
        {
          rotateX: totalRotation,
          ease: "none",
        }
      );
    },
    { scope: sectionRef, dependencies: [stepAngle, radius] }
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full min-h-screen py-20 sm:py-24 lg:py-28 px-5 sm:px-8 md:px-12 bg-earth-black text-earth-cream overflow-hidden transition-colors duration-300 flex items-center justify-center"
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-earth-moss/20 to-earth-sand/15 blur-[130px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-earth-terracotta/20 to-earth-sand/10 blur-[110px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column (Reserved for future visual asset as requested) */}
        <div className="lg:col-span-5 w-full min-h-[140px] sm:min-h-[200px] lg:min-h-[440px] flex items-center justify-center relative">
          {/* Reserved for future visual asset */}
        </div>

        {/* Right Column: 3D Rolling Paragraph */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start justify-center space-y-5 w-full">
          {/* 3D Rolling Drum Container */}
          <div
            className="w-full relative select-none will-change-transform"
            style={{
              perspective: "950px",
              perspectiveOrigin: "center center",
            }}
          >
            {/* Viewport: Increased height roller with 5 lines pure white in center and dull lines above and below */}
            <div
              className="relative w-full h-[360px] sm:h-[400px] md:h-[450px] select-none"
              style={{
                perspective: "900px",
                perspectiveOrigin: "center center",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.22) 10%, rgba(0,0,0,0.22) calc(50% - 80px), rgba(0,0,0,1) calc(50% - 62px), rgba(0,0,0,1) calc(50% + 62px), rgba(0,0,0,0.22) calc(50% + 80px), rgba(0,0,0,0.22) 90%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.22) 10%, rgba(0,0,0,0.22) calc(50% - 80px), rgba(0,0,0,1) calc(50% - 62px), rgba(0,0,0,1) calc(50% + 62px), rgba(0,0,0,0.22) calc(50% + 80px), rgba(0,0,0,0.22) 90%, transparent 100%)",
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
                    className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center text-center px-2 sm:px-4 pointer-events-none select-none will-change-transform"
                    style={{
                      transform: `rotateX(${-index * stepAngle}deg) translateZ(${radius}px)`,
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    {item.content ? (
                      <p className="text-[13.5px] xs:text-[14px] sm:text-[15px] md:text-[16px] font-sans font-normal text-white tracking-normal leading-relaxed max-w-lg mx-auto">
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
      </div>
    </section>
  );
}
