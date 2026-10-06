import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Overview() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) return;

      if (contentRef.current) {
        gsap.from(contentRef.current.children, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
          y: 36,
          opacity: 0,
          duration: 0.85,
          stagger: 0.15,
          ease: "power3.out",
        });
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full py-24 sm:py-32 lg:py-40 px-5 sm:px-8 md:px-12 bg-earth-black text-earth-cream overflow-hidden transition-colors duration-300 border-t border-earth-cream/10"
    >
      {/* Ambient background glow */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-earth-moss/20 to-earth-sand/15 blur-[120px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-earth-terracotta/20 to-earth-sand/10 blur-[100px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column (Left empty for now as requested) */}
        <div className="lg:col-span-5 w-full min-h-[180px] sm:min-h-[260px] lg:min-h-[440px] flex items-center justify-center relative">
          {/* Reserved for future visual asset */}
        </div>

        {/* Right Column: Overview Text */}
        <div
          ref={contentRef}
          className="lg:col-span-7 flex flex-col justify-center space-y-6 lg:pl-6"
        >          
          {/* Overview description */}
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-earth-cream/90">
            <p>
              Full-Stack Developer with hands-on experience building and shipping modern web and cross-platform mobile applications using
              React, Next.js, Angular, Node.js, and Flutter. Proven expertise in developing scalable frontend architectures and secure backend
              systems using Node.js, Express.js, and NestJS, delivering high-performance RESTful APIs and seamless user experiences. Strong Dart
              programming skills with state management (GetX, Bloc, Provider), multi-flavor builds, localization, and Dart isolates.
            </p>
            <p>
              Experienced in integrating third-party APIs, implementing responsive UI/UX designs, writing test cases, and optimizing applications through efficient
              state management and performance techniques. Strong understanding of database management, authentication systems, and
              cloud-based solutions, with the ability to deliver end-to-end development. Known for strong analytical thinking, clear communication,
              and effective collaboration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
