import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";
import { cn } from "../utils/cn";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface AboutSlide {
  id: number;
  badge: string;
  category: string;
  heading: string;
  paragraph: string;
  tags: string[];
}

const ABOUT_SLIDES: AboutSlide[] = [
  {
    id: 1,
    badge: "01",
    category: "Full-Stack Architecture",
    heading: "Scalable Web & Modern Systems",
    paragraph:
      "Full-Stack Developer with hands-on experience building and shipping modern web and cross-platform mobile apps utilizing React, Next.js, Angular, Node.js, and Flutter across modern production environments. Proven expertise engineering scalable frontend architectures and resilient, secure backend systems powered by Node.js, Express.js, and NestJS to deliver high-performance RESTful APIs.",
    tags: ["React", "Next.js", "Node.js", "NestJS", "Express.js", "TypeScript"],
  },
  {
    id: 2,
    badge: "02",
    category: "Mobile & UI/UX Systems",
    heading: "Fluid Native Performance & State Architecture",
    paragraph:
      "Dedicated to crafting seamless user experiences, responsive layouts, and interactive digital interfaces, with strong Dart programming skills across GetX, Bloc, and Provider. Experienced in multi-flavor builds, international localization, and multi-threaded Dart isolates to deliver fluid, high-performance mobile applications from concept to production.",
    tags: ["Flutter", "Dart", "GetX", "Bloc", "Provider", "Dart Isolates", "UI/UX"],
  },
  {
    id: 3,
    badge: "03",
    category: "Cloud, Quality & Scale",
    heading: "Microservices & End-to-End Product Delivery",
    paragraph:
      "Experienced in seamless third-party API integration, cloud-based microservices, and modern tooling, implementing fluid UI/UX designs, comprehensive unit testing, and rigorous performance optimization. Thorough understanding of relational and NoSQL database management, authentication, and cloud solutions, collaborating effectively with cross-functional teams to build impactful, scalable digital products.",
    tags: ["PostgreSQL", "MongoDB", "Cloud Microservices", "CI/CD", "RESTful APIs"],
  },
];

export default function Overview() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3D Circular geometry parameters
  const stepAngle = isMobile ? 65 : 48;
  const radius = isMobile ? 440 : 720;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const container = containerRef.current;
      if (!section || !container) return;

      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

      // Pure GSAP 3D Circular Slider positioner
      // Evaluates parametric cylinder arc coordinates for each card based on continuous slide position 's' (0 to 2)
      const updateSliderPosition = (slideProgress: number) => {
        let bestIdx = 0;
        let minDiff = Infinity;

        cards.forEach((card, idx) => {
          const delta = idx - slideProgress; // Slide distance (-1, 0, +1, etc.)
          const angle = delta * stepAngle;   // Angular offset in degrees
          const rad = (angle * Math.PI) / 180;

          // Parametric cylinder arc in 3D:
          // X follows circle perimeter
          // Z recedes into screen depth: Z = 0 at center, Z < 0 as card turns away
          // rotationY angles card tangent to cylinder facing inward toward viewer
          const x = radius * Math.sin(rad);
          const z = radius * (Math.cos(rad) - 1);
          const rotY = -angle * 0.65;

          const dist = Math.abs(delta);
          if (dist < minDiff) {
            minDiff = dist;
            bestIdx = idx;
          }

          // Scale: center card is 1.0, receding cards slightly scale down
          const scale = gsap.utils.clamp(0.78, 1.0, 1.0 - dist * 0.14);

          // Opacity: Center card = 1.0; Adjacent peeked card = 0.28; Far cards = 0.0
          let opacity = 0;
          if (dist < 0.15) {
            opacity = 1.0;
          } else if (dist < 1.0) {
            opacity = gsap.utils.clamp(0.25, 1.0, 1.0 - dist * 0.72);
          } else if (dist < 1.25) {
            opacity = gsap.utils.clamp(0.0, 0.25, (1.25 - dist) * 1.0);
          } else {
            opacity = 0;
          }

          const zIndex = Math.round(100 - dist * 40);

          gsap.set(card, {
            x,
            y: 0,
            z,
            rotationY: rotY,
            scale,
            opacity,
            zIndex,
          });

          card.style.pointerEvents = dist < 0.35 ? "auto" : "none";
        });

        setActiveIndex(bestIdx);
      };

      gsap.set(container, { opacity: 0 });
      updateSliderPosition(0);

      // Kill any previous about-timeline to avoid duplicate pin-spacers
      const existingSt = ScrollTrigger.getById("about-timeline");
      if (existingSt) {
        existingSt.kill(true);
      }

      // GSAP ScrollTrigger timeline for circular rotation with designated reading plateaus
      ScrollTrigger.create({
        id: "about-timeline",
        trigger: section,
        start: "top top",
        end: "+=1700",
        pin: true,
        pinSpacing: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onLeaveBack: () => {
          particleBridge.overviewProgress = 0.0;
          particleBridge.skillsProgress = 0.0;
          gsap.set(container, { opacity: 0 });
          updateSliderPosition(0);
        },
        onUpdate: (self) => {
          const p = self.progress;

          // Phase 1: 0.00 -> 0.10: "ABOUT ME" particle text formed
          // Phase 2: 0.10 -> 0.22: "ABOUT ME" disperses, circular slider fades in
          // Phase 3: 0.22 -> 0.88: Circular slider with reading plateaus and smooth 3D transitions
          // Phase 4: 0.88 -> 1.00: Circular slider fades out before Skills section enters

          if (p < 0.10) {
            particleBridge.overviewProgress = 0.0;
            container.style.opacity = "0";
            updateSliderPosition(0);
          } else if (p < 0.22) {
            const t = (p - 0.10) / 0.12;
            particleBridge.overviewProgress = t;
            container.style.opacity = `${t}`;
            updateSliderPosition(0);
          } else if (p <= 0.88) {
            particleBridge.overviewProgress = 1.0;
            container.style.opacity = "1";

            // Normalized progress across slides (0 to 1)
            const u = (p - 0.22) / 0.66;
            let currentSlide = 0;

            // Piecewise progression with reading pauses at each slide
            if (u < 0.22) {
              // Resting pause at Slide 0
              currentSlide = 0;
            } else if (u < 0.44) {
              // Smooth transition Slide 0 -> Slide 1
              const t = (u - 0.22) / 0.22;
              const ease = t * t * (3 - 2 * t);
              currentSlide = ease * 1.0;
            } else if (u < 0.66) {
              // Resting pause at Slide 1
              currentSlide = 1.0;
            } else if (u < 0.88) {
              // Smooth transition Slide 1 -> Slide 2
              const t = (u - 0.66) / 0.22;
              const ease = t * t * (3 - 2 * t);
              currentSlide = 1.0 + ease * 1.0;
            } else {
              // Resting pause at Slide 2
              currentSlide = 2.0;
            }

            updateSliderPosition(currentSlide);
          } else {
            particleBridge.overviewProgress = 1.0;
            const fadeOut = Math.max(0.0, 1.0 - (p - 0.88) / 0.10);
            container.style.opacity = `${fadeOut}`;
            updateSliderPosition(2.0);
          }

          particleBridge.skillsProgress = 0.0;
        },
      });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    },
    { scope: sectionRef, dependencies: [isMobile, stepAngle, radius] }
  );

  const navigateToSlide = (idx: number) => {
    const st = ScrollTrigger.getById("about-timeline");
    if (!st) return;
    const scrollRange = st.end - st.start;
    // Map idx (0, 1, 2) to midpoint of each slide's reading zone
    const targetProgress =
      idx === 0 ? 0.29 : idx === 1 ? 0.58 : 0.84;
    const targetY = st.start + targetProgress * scrollRange;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full h-screen h-[100dvh] max-h-screen py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 bg-transparent text-earth-cream transition-colors duration-300 flex items-center justify-center overflow-hidden select-none"
    >
      {/* Subtle radial backdrop for contrast against starfield particles */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(10,12,10,0.65)_0%,rgba(5,6,5,0.25)_65%,transparent_100%)] z-0" />

      <div className="w-full max-w-[96vw] lg:max-w-6xl xl:max-w-7xl mx-auto flex flex-col items-center justify-center relative z-10 px-2 sm:px-4">
        {/* Pure GSAP 3D Circular Slider Container */}
        <div
          ref={containerRef}
          className="w-full relative flex flex-col items-center justify-center will-change-transform pointer-events-auto"
        >
          {/* 3D Perspective Stage */}
          <div
            className="relative w-full max-w-4xl min-h-[410px] sm:min-h-[430px] md:min-h-[450px] flex items-center justify-center"
            style={{
              perspective: isMobile ? "900px" : "1300px",
              perspectiveOrigin: "50% 50%",
            }}
          >
            {ABOUT_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (idx !== activeIndex) {
                    navigateToSlide(idx);
                  }
                }}
                className={cn(
                  "absolute inset-0 m-auto",
                  "w-[330px] sm:w-[540px] md:w-[660px] lg:w-[720px] max-w-[92vw] h-fit",
                  "rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8",
                  "bg-[#0c110d]/92 backdrop-blur-2xl border transition-[border-color,box-shadow] duration-300",
                  "will-change-transform",
                  idx === activeIndex
                    ? "border-earth-cream/25 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(254,250,224,0.06)] cursor-default"
                    : "border-earth-cream/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)] cursor-pointer"
                )}
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                {/* Card Header: Category Badge & Slide Number */}
                <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-earth-cream/10 border border-earth-cream/15 text-earth-cream/85 text-[11px] sm:text-xs font-mono tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-earth-terracotta" />
                    {slide.category}
                  </span>
                  <span className="text-xs font-mono text-earth-cream/45 tracking-widest">
                    {slide.badge} / 03
                  </span>
                </div>

                {/* Heading */}
                <h3 className="text-lg sm:text-xl md:text-2xl font-sans font-semibold text-white tracking-tight mb-2.5 sm:mb-3">
                  {slide.heading}
                </h3>

                {/* Full Paragraph Text (Never broken into sentences) */}
                <p className="text-[13.5px] sm:text-[15px] md:text-[16px] font-sans font-normal text-earth-cream/90 leading-relaxed sm:leading-relaxed tracking-normal">
                  {slide.paragraph}
                </p>

                {/* Tech Tags */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-earth-cream/10">
                  {slide.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10.5px] sm:text-[11.5px] font-mono px-2 sm:px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-earth-sand/90"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Navigation: Arrows + Pill Indicators */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 z-20">
            {/* Prev Arrow */}
            <button
              type="button"
              onClick={() => navigateToSlide(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              aria-label="Previous slide"
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-300",
                activeIndex === 0
                  ? "opacity-25 border-earth-cream/10 text-earth-cream/30 cursor-not-allowed"
                  : "opacity-80 hover:opacity-100 bg-earth-cream/10 border-earth-cream/20 text-earth-cream hover:bg-earth-cream/20 cursor-pointer"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Pill Dots */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {ABOUT_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => navigateToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={cn(
                    "group flex items-center gap-1.5 py-1 px-2.5 rounded-full transition-all duration-300 cursor-pointer",
                    idx === activeIndex
                      ? "bg-earth-cream/20 border border-earth-cream/30"
                      : "bg-transparent hover:bg-earth-cream/10 border border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "block rounded-full transition-all duration-300",
                      idx === activeIndex
                        ? "w-5 sm:w-6 h-1.5 bg-earth-terracotta shadow-[0_0_8px_rgba(209,102,68,0.6)]"
                        : "w-2 h-1.5 bg-earth-cream/40 group-hover:bg-earth-cream/70"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-mono transition-colors duration-300",
                      idx === activeIndex
                        ? "text-earth-cream font-medium"
                        : "text-earth-cream/40 group-hover:text-earth-cream/70"
                    )}
                  >
                    {slide.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={() => navigateToSlide(Math.min(ABOUT_SLIDES.length - 1, activeIndex + 1))}
              disabled={activeIndex === ABOUT_SLIDES.length - 1}
              aria-label="Next slide"
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-300",
                activeIndex === ABOUT_SLIDES.length - 1
                  ? "opacity-25 border-earth-cream/10 text-earth-cream/30 cursor-not-allowed"
                  : "opacity-80 hover:opacity-100 bg-earth-cream/10 border-earth-cream/20 text-earth-cream hover:bg-earth-cream/20 cursor-pointer"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
