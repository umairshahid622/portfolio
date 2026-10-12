import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Professional Summary verbatim from Resume.pdf (Single continuous unbroken paragraph)
const OVERVIEW_PARAGRAPH =
  "Full-Stack Developer with hands-on experience building and shipping modern web and cross-platform mobile applications using React, Next.js, Angular, Node.js, and Flutter. Proven expertise in developing scalable frontend architectures and secure backend systems using Node.js, Express.js, and NestJS, delivering high-performance RESTful APIs and seamless user experiences. Strong Dart programming skills with state management (GetX, Bloc, Provider), multi-flavor builds, localization, and Dart isolates. Experienced in integrating third-party APIs, implementing responsive UI/UX designs, writing test cases, and optimizing applications through efficient state management and performance techniques. Strong understanding of database management, authentication systems, and cloud-based solutions, with the ability to deliver end-to-end development. Known for strong analytical thinking, clear communication, and effective collaboration.";

interface OverviewProps {
  embedded?: boolean;
}

export default function Overview({ embedded = false }: OverviewProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drumViewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const touchStartY = useRef(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const container = containerRef.current;
      const viewport = drumViewportRef.current;
      const track = trackRef.current;
      const paragraph = paragraphRef.current;
      if (!section || !container || !viewport || !track || !paragraph) return;

      const existingSt = ScrollTrigger.getById("about-timeline");
      if (existingSt) {
        existingSt.kill(true);
      }

      gsap.set(container, { opacity: 1 });
      gsap.set(track, { y: 0 });

      ScrollTrigger.create({
        id: "about-timeline",
        trigger: embedded ? "#hero-portal-wrapper" : section,
        start: embedded ? "top+=850 top" : "top top",
        end: embedded ? "top+=1950 top" : "+=1100",
        pin: !embedded,
        pinSpacing: !embedded,
        scrub: 0.8,
        anticipatePin: embedded ? 0 : 1,
        invalidateOnRefresh: true,
        onEnter: () => {
          particleBridge.isDarkActive = true;
        },
        onEnterBack: () => {
          particleBridge.isDarkActive = true;
        },
        onLeaveBack: () => {
          particleBridge.overviewProgress = 0.0;
          particleBridge.skillsProgress = 0.0;
          if (!embedded) {
            particleBridge.isDarkActive = false;
            gsap.set(container, { opacity: 0 });
          }
          if (track) {
            track.style.transform = "translate3d(0, 0px, 0)";
          }
        },
        onUpdate: (self) => {
          particleBridge.isDarkActive = true;
          const p = self.progress;

          // 70% Section Height Scroll Threshold:
          // 0% -> 70%: "ABOUT ME" remains fully assembled while the single paragraph rolls through the drum aperture.
          // 70% -> 90%: "ABOUT ME" begins breaking apart into 3D triangles.
          // 90% -> 100%: Particles stay broken and dispersed.
          const breakStart = 0.70;
          const breakEnd = 0.90;

          if (p < breakStart) {
            particleBridge.overviewProgress = 0.0;
          } else if (p < breakEnd) {
            particleBridge.overviewProgress = (p - breakStart) / (breakEnd - breakStart);
          } else {
            particleBridge.overviewProgress = 1.0;
          }
          particleBridge.skillsProgress = 0.0;

          // Rolling the single continuous paragraph:
          // Across the 0.0 -> 0.70 scroll range, the paragraph rolls from top to bottom
          const u = Math.max(0, Math.min(1, p / 0.70));
          const totalHeight = paragraph.scrollHeight;
          const viewHeight = viewport.clientHeight;
          const maxRollDistance = Math.max(0, totalHeight - viewHeight);
          const currentY = -u * maxRollDistance;

          track.style.transform = `translate3d(0, ${currentY.toFixed(1)}px, 0)`;

          // Container smooth fade out near the end of the section (p >= 0.94)
          if (p < 0.94) {
            container.style.opacity = "1";
          } else {
            const fade = Math.max(0, 1 - (p - 0.94) / 0.06);
            container.style.opacity = `${fade}`;
          }
        },
      });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    },
    { scope: sectionRef, dependencies: [embedded] }
  );

  // Direct touch/drag gesture handling for mobile rolling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(deltaY) > 6) {
      window.scrollBy({ top: -deltaY * 0.9, behavior: "auto" });
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    window.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full h-screen h-[100dvh] max-h-screen px-4 sm:px-6 md:px-8 bg-transparent text-earth-cream transition-colors duration-300 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto flex flex-col items-center justify-center relative z-10 px-3 sm:px-6 md:px-8 mt-[12vh] sm:mt-[14vh] md:mt-[16vh]">
        {/* Single Continuous Paragraph Drum Roller */}
        <div
          ref={containerRef}
          className="w-full flex flex-col items-center justify-center will-change-transform pointer-events-auto"
        >
          {/* Drum Roller Viewport (Exactly 6 lines visible: 4 white, upper and 6th dimmed) */}
          <div
            ref={drumViewportRef}
            className="relative w-full max-w-[94vw] xs:max-w-[90vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto h-[204px] sm:h-[228px] md:h-[252px] overflow-hidden select-none"
            style={{
              perspective: "900px",
              perspectiveOrigin: "50% 50%",
              // 6-line cylindrical aperture mask:
              // 0% -> 16.66% (Line 1): Dimmed (0.28 opacity)
              // 18% -> 82% (Lines 2, 3, 4, 5): 4 white lines (1.0 opacity)
              // 83.33% -> 100% (Line 6): Dimmed (0.28 opacity)
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.28) 16.66%, rgba(0,0,0,1) 18.5%, rgba(0,0,0,1) 81.5%, rgba(0,0,0,0.28) 83.33%, rgba(0,0,0,0.25) 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.28) 16.66%, rgba(0,0,0,1) 18.5%, rgba(0,0,0,1) 81.5%, rgba(0,0,0,0.28) 83.33%, rgba(0,0,0,0.25) 100%)",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onWheel={handleWheel}
          >
            {/* Top & Bottom Cylindrical Drum Specular Reflection Rays */}
            <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-earth-cream/25 to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-earth-cream/15 to-transparent pointer-events-none z-10" />

            {/* Rolling Track (Translates the single continuous paragraph vertically) */}
            <div
              ref={trackRef}
              className="w-full will-change-transform"
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Single Continuous Paragraph — 100% Unbroken */}
              <p
                ref={paragraphRef}
                className="text-center font-sans font-medium text-white text-[15px] sm:text-[17px] md:text-[19px] leading-[34px] sm:leading-[38px] md:leading-[42px] tracking-normal px-2 sm:px-6 m-0"
                style={{
                  textShadow: "0 0 22px rgba(254, 250, 224, 0.20)",
                }}
              >
                {OVERVIEW_PARAGRAPH}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
