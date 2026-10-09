import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface SkillCard {
  id: string;
  number: string;
  heading: string;
  summary: string;
  skills: string[];
  accentColor: string;
}

export const SKILL_CARDS: SkillCard[] = [
  {
    id: "frontend",
    number: "01",
    heading: "Frontend Development",
    summary:
      "Engineering scalable frontend architectures, responsive interfaces, and interactive 3D WebGL experiences with modern component systems.",
    skills: [
      "React.js",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Angular",
      "Tailwind CSS",
      "HTML5 / CSS3",
      "Responsive UI/UX",
    ],
    accentColor: "#dda15e",
  },
  {
    id: "mobile",
    number: "02",
    heading: "Mobile Development",
    summary:
      "Building production-grade cross-platform mobile apps with multi-flavor builds, regional localization, and multi-threaded background processing.",
    skills: [
      "Flutter",
      "Dart",
      "Cross-Platform Apps",
      "Reusable Widget Architecture",
      "Multi-Flavor Builds",
      "Localization",
      "Dart Isolates",
    ],
    accentColor: "#bc6c25",
  },
  {
    id: "backend",
    number: "03",
    heading: "Backend Development",
    summary:
      "Architecting resilient RESTful APIs, cloud microservices, and secure authentication systems with high concurrency and data integrity.",
    skills: [
      "Node.js",
      "Express.js",
      "NestJS",
      "RESTful APIs",
      "JSON / RPC",
      "Authentication (JWT)",
      "Supabase Auth",
    ],
    accentColor: "#606c38",
  },
  {
    id: "state-management",
    number: "04",    
    heading: "State Management",
    summary:
      "Managing complex asynchronous client state, predictive UI workflows, and decoupled domain logic across web and mobile applications.",
    skills: [
      "Redux Toolkit",
      "GetX",
      "Bloc",
      "Provider",
      "Zustand",
      "Reactive Streams",
    ],
    accentColor: "#d98236",
  },
  {
    id: "database",
    number: "05",
    heading: "Database Management",
    summary:
      "Designing relational schemas and NoSQL document models with transactional consistency, ACID compliance, and query indexing.",
    skills: [
      "PostgreSQL",
      "MongoDB",
      "MySQL",
      "Firebase Firestore",
      "Supabase",
      "Data Modeling & Optimization",
    ],
    accentColor: "#e6b172",
  },
  {
    id: "devops",
    number: "06",
    heading: "DevOps & Tools",
    summary:
      "Streamlining developer velocity with automated CI/CD pipelines, containerization, strict static code analysis, and cloud deployment.",
    skills: [
      "Git",
      "GitHub",
      "Docker",
      "AWS",
      "CI/CD Pipelines",
      "Version Control",
      "Codacy Static Analysis",
    ],
    accentColor: "#788746",
  },
  {
    id: "performance",
    number: "07",
    heading: "Performance & Optimization",
    summary:
      "Eliminating rendering bottlenecks, minimizing bundle payload, and writing unit test suites for ultra-responsive applications.",
    skills: [
      "Lazy Loading",
      "Code Splitting",
      "Efficient Rendering",
      "Scalability Enhancements",
      "Unit Testing",
      "Code Reviews & Debugging",
    ],
    accentColor: "#b85d1e",
  },
];

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const [, setHorizontalProgress] = useState(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const cardsTrack = trackRef.current;
      const cardsWrapper = cardsWrapperRef.current;
      if (!section || !cardsTrack || !cardsWrapper) return;

      // Horizontal Cards Scroll: begins immediately when section reaches "top top" and pins
      const getTotalScroll = () => {
        const pad = window.innerWidth >= 768 ? 96 : window.innerWidth >= 640 ? 64 : 40;
        return Math.max(0, cardsTrack.scrollWidth - window.innerWidth + pad);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "skills-timeline",
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(3000, getTotalScroll() * 1.6)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onLeaveBack: () => {
            particleBridge.skillsProgress = 0.0;
          },
          onUpdate: (self) => {
            const p = self.progress;
            setHorizontalProgress(p);

            // Phase 1 (0.00 -> 0.12): As Skills enters, particles merge from screen-spread into "SKILLS </>"!
            // Phase 2 (0.12 -> 0.50): Cards scroll horizontally; "SKILLS </>" stays assembled (skillsProgress = 1.0)
            // Phase 3 (0.50 -> 0.85): While cards scroll through later cards, particles take flight into nebula (skillsProgress: 1.0 -> 0.0)
            // Phase 4 (0.85 -> 1.00): Cards reach final cards with particles fully dispersed
            const mergeDuration = 0.12;
            const spreadStart = 0.50;
            const spreadEnd = 0.85;

            if (p < mergeDuration) {
              particleBridge.skillsProgress = p / mergeDuration;
            } else if (p < spreadStart) {
              particleBridge.skillsProgress = 1.0;
            } else if (p > spreadEnd) {
              particleBridge.skillsProgress = 0.0;
            } else {
              const spreadProgress = (p - spreadStart) / (spreadEnd - spreadStart);
              particleBridge.skillsProgress = Math.max(0.0, Math.min(1.0, 1.0 - spreadProgress));
            }

            particleBridge.isDarkActive = true;
          },
        },
      });

      // 1. Cards container is immediately ready in view with constant scrolling and zero delay
      tl.fromTo(
        cardsWrapper,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          duration: 0.05,
        },
        0.0
      );

      // 2. Smooth, constant horizontal translation of cards across viewport with no delay (0.00 -> 0.90)
      tl.to(
        cardsTrack,
        {
          x: () => -getTotalScroll(),
          ease: "none",
          duration: 0.90,
        },
        0.0
      );

      // 3. Comfortable resting hold for final card before unpinning (0.90 -> 1.00)
      tl.to({}, { duration: 0.10 }, 0.90);

      return () => {
        tl.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="relative w-full h-screen h-[100dvh] min-h-screen bg-transparent text-earth-cream transition-colors duration-300 flex flex-col justify-end overflow-hidden select-none -mt-[100vh]"
    >
      {/* Accessible Section Heading */}
      <h2 className="sr-only">Skills — Core Technical Domains</h2>

      {/* Horizontal Cards Track Container */}
      <div
        ref={cardsWrapperRef}
        className="w-full overflow-visible mt-auto mb-[105px] sm:mb-[125px] md:mb-[135px] relative z-20 will-change-transform"
      >
        <div
          ref={trackRef}
          className="flex flex-row items-stretch gap-5 sm:gap-7 md:gap-8 px-5 sm:px-8 md:px-12 w-max will-change-transform"
        >
          {SKILL_CARDS.map((card) => (
            <div
              key={card.id}
              className="w-[320px] sm:w-[380px] md:w-[420px] min-h-[270px] sm:min-h-[290px] shrink-0 rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl transition-all duration-300 group border bg-earth-dark/75 border-earth-cream/10 hover:border-earth-terracotta/40 hover:shadow-2xl hover:shadow-earth-terracotta/10"
            >
              {/* Subtle Ambient Radial Glow */}
              <div
                className="absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none opacity-20 group-hover:opacity-40"
                style={{ backgroundColor: card.accentColor }}
              />

              <div>                
                {/* Heading & Summary */}
                <div className="relative z-10 mt-3.5">
                  <h3 className="font-heading text-2xl sm:text-3xl font-bold text-earth-cream group-hover:text-earth-sand transition-colors tracking-tight">
                    {card.heading}
                  </h3>
                  <p className="text-xs sm:text-sm text-earth-cream/70 leading-relaxed mt-2 line-clamp-3">
                    {card.summary}
                  </p>
                </div>
              </div>

              {/* Core Skills Pill Cloud */}
              <div className="relative z-10 flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-earth-cream/10">
                {card.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] sm:text-xs font-mono px-2.5 py-0.5 rounded-md bg-earth-cream/5 text-earth-cream/90 border border-earth-cream/10 group-hover:border-earth-sand/25 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
