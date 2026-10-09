import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";
import {
  AppCard,
  AppCardNumber,
  AppCardTitle,
  AppCardSummary,
  AppCardPill,
  AppCardFooter,
  type CardAccent,
} from "./AppCard";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface SkillCard {
  id: string;
  number: string;
  heading: string;
  summary: string;
  skills: string[];
  accent?: CardAccent;
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
    accent: "moss",
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
    accent: "moss",
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
    accent: "moss",
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
    accent: "moss",
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
    accent: "moss",
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
    accent: "moss",
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
    accent: "moss",
  },
];

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const cardsTrack = trackRef.current;
      const cardsWrapper = cardsWrapperRef.current;
      if (!section || !cardsTrack || !cardsWrapper) return;

      // Horizontal Cards Scroll: begins after skill text finishes merging
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

            // Phase 1 (0.00 -> 0.14): As Skills enters, particles merge from screen-spread into "SKILLS </>"!
            // Phase 2 (0.14 -> 0.55): Cards scroll horizontally; "SKILLS </>" stays assembled (skillsProgress = 1.0)
            // Phase 3 (0.55 -> 0.85): While cards scroll through later cards, particles take flight into nebula (skillsProgress: 1.0 -> 0.0)
            // Phase 4 (0.85 -> 1.00): Cards reach final cards with particles fully dispersed
            const mergeDuration = 0.14;
            const spreadStart = 0.55;
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

      // 1. Cards container fades into view at start
      tl.fromTo(
        cardsWrapper,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          duration: 0.06,
        },
        0.0
      );

      // 2. Horizontal translation begins strictly after skill text is merged (0.14 -> 0.88)
      tl.to(
        cardsTrack,
        {
          x: () => -getTotalScroll(),
          ease: "none",
          duration: 0.74,
        },
        0.14
      );

      // 3. Comfortable resting hold for final card before unpinning (0.88 -> 1.00)
      tl.to({}, { duration: 0.12 }, 0.88);

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
            <AppCard
              key={card.id}
              accent={card.accent ?? "moss"}
              className="w-max max-w-[80vw] min-h-[280px] sm:min-h-[300px] shrink-0 hover:border-earth-cream/20 transition-all duration-300 group hover:shadow-2xl hover:shadow-earth-moss/10"
            >
              <div className="w-full min-w-0">
                {/* Number & Heading */}
                <div className="flex items-start sm:items-baseline justify-between gap-3 sm:gap-4 mb-1">
                  <div className="flex items-baseline gap-3 sm:gap-4 min-w-0 whitespace-nowrap">
                    <AppCardNumber>{card.number}</AppCardNumber>
                    <AppCardTitle className="whitespace-normal sm:whitespace-nowrap">
                      {card.heading}
                    </AppCardTitle>
                  </div>
                </div>

                {/* Role Summary with exact theme border-l-2 */}
                <AppCardSummary className="w-0 min-w-full mt-2.5 mb-3 line-clamp-3">
                  {card.summary}
                </AppCardSummary>
              </div>

              {/* Core Skills Pill Cloud */}
              <AppCardFooter className="w-0 min-w-full">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] font-sans text-earth-cream/40 uppercase tracking-wider mr-1">
                    Skills:
                  </span>
                  {card.skills.map((skill, sIdx) => (
                    <AppCardPill key={sIdx}>{skill}</AppCardPill>
                  ))}
                </div>
              </AppCardFooter>
            </AppCard>
          ))}
        </div>
      </div>
    </section>
  );
}
