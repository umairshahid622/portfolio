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
    accent: "secondary",
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
    accent: "secondary",
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
    accent: "secondary",
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
    accent: "secondary",
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
    accent: "secondary",
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
    accent: "secondary",
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
    accent: "secondary",
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

      // Calculate precise scroll bounds and middle point alignment
      const getCardScrollBounds = () => {
        const cardNodes = cardsTrack.querySelectorAll<HTMLElement>('[data-skill-card="true"]');
        if (cardNodes.length === 0) {
          return { startX: 0, endX: 0, totalScroll: 0 };
        }

        const isMobile = window.innerWidth < 768;
        const firstCard = cardNodes[0];
        const lastCard = cardNodes[cardNodes.length - 1];

        if (isMobile) {
          // On mobile: Calculate the middle point of each card in the slider!
          // startX centers the first card (Card 01) directly in the middle of the viewport
          // endX centers the last card (Card 07) directly in the middle of the viewport
          const halfWinW = window.innerWidth * 0.5;
          const firstCardCenter = firstCard.offsetLeft + firstCard.offsetWidth * 0.5;
          const lastCardCenter = lastCard.offsetLeft + lastCard.offsetWidth * 0.5;

          const startX = halfWinW - firstCardCenter;
          const endX = halfWinW - lastCardCenter;
          const totalScroll = Math.abs(startX - endX);

          return { startX, endX, totalScroll };
        } else {
          // On desktop: Standard horizontal scroll
          const pad = window.innerWidth >= 1024 ? 96 : 64;
          const totalScroll = Math.max(0, cardsTrack.scrollWidth - window.innerWidth + pad);
          return { startX: 0, endX: -totalScroll, totalScroll };
        }
      };

      const existingSt = ScrollTrigger.getById("skills-timeline");
      if (existingSt) {
        existingSt.kill(true);
      }

      // Compute exact scroll progress where the 2nd card leaves the screen
      const getCard2ExitProgress = () => {
        const cardNodes = cardsTrack.querySelectorAll<HTMLElement>('[data-skill-card="true"]');
        if (cardNodes.length >= 2) {
          const card2 = cardNodes[1];
          const bounds = getCardScrollBounds();
          if (bounds.totalScroll > 0) {
            const isMobile = window.innerWidth < 768;
            const card2ExitDist = isMobile
              ? card2.offsetLeft + card2.offsetWidth * 0.5 - (cardNodes[0].offsetLeft + cardNodes[0].offsetWidth * 0.5)
              : card2.offsetLeft + card2.offsetWidth;
            const fraction = Math.min(0.70, Math.max(0.25, card2ExitDist / bounds.totalScroll));
            return 0.14 + fraction * 0.74;
          }
        }
        return 0.46;
      };

      // Set initial x position so the first card is centered immediately
      gsap.set(cardsTrack, { x: () => getCardScrollBounds().startX });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "skills-timeline",
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(3000, getCardScrollBounds().totalScroll * 1.6)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onEnter: () => {
            particleBridge.isDarkActive = true;
            particleBridge.activeWord = "SKILLS";
          },
          onEnterBack: () => {
            particleBridge.isDarkActive = true;
            particleBridge.activeWord = "SKILLS";
          },
          onLeave: () => {
            if (particleBridge.activeWord === "SKILLS") {
              particleBridge.activeWord = "EXPERIENCE";
            }
          },
          onLeaveBack: () => {
            particleBridge.skillsProgress = 0.0;
            particleBridge.skillsSpreadProgress = 0.0;
            particleBridge.activeWord = "ABOUT ME";
            gsap.set(cardsTrack, { x: getCardScrollBounds().startX });
          },
          onUpdate: (self) => {
            const p = self.progress;

            // Phase 1 (0.00 -> 0.06): As Skills enters, triangles form "SKILLS </>" at top-left
            // Phase 2 (0.06 -> breakStart): Title stays fully intact until the 2nd card goes out of the screen
            // Phase 3 (breakStart -> breakEnd): Right after the 2nd card leaves, spiral takes its shape
            // Phase 4 (breakEnd -> 1.00): Spiral remains active around cards as they continue scrolling
            const mergeDuration = 0.06;
            const breakStart = getCard2ExitProgress();
            const breakEnd = Math.min(0.86, breakStart + 0.16);

            if (p < mergeDuration) {
              particleBridge.skillsProgress = p / mergeDuration;
              particleBridge.skillsSpreadProgress = 0.0;
            } else if (p < breakStart) {
              particleBridge.skillsProgress = 1.0;
              particleBridge.skillsSpreadProgress = 0.0;
            } else {
              particleBridge.skillsProgress = 1.0;
              const spreadProgress = Math.min(1.0, (p - breakStart) / (breakEnd - breakStart));
              particleBridge.skillsSpreadProgress = Math.max(0.0, spreadProgress);
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
      // Smoothly glides cards through the center point
      tl.fromTo(
        cardsTrack,
        { x: () => getCardScrollBounds().startX },
        {
          x: () => getCardScrollBounds().endX,
          ease: "none",
          duration: 0.74,
        },
        0.14
      );

      // 3. Comfortable resting hold for final card before unpinning (0.88 -> 1.00)
      tl.to({}, { duration: 0.12 }, 0.88);

      ScrollTrigger.sort();

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
      className="relative w-full h-screen h-[100dvh] min-h-screen bg-transparent text-foreground transition-colors duration-300 flex flex-col justify-end overflow-hidden select-none"
    >
      {/* Accessible Section Heading */}
      <h2 className="sr-only">Skills — Core Technical Domains</h2>

      {/* Horizontal Cards Track Container with overflow-hidden to prevent browser horizontal scrolling */}
      <div
        ref={cardsWrapperRef}
        id="skills-cards-wrapper"
        className="w-full overflow-hidden mt-auto mb-[105px] sm:mb-[125px] md:mb-[135px] relative z-20 will-change-transform opacity-0"
      >
        <div
          ref={trackRef}
          id="skills-cards-track"
          className="flex flex-row items-stretch gap-4 sm:gap-7 md:gap-8 px-4 sm:px-8 md:px-12 w-max will-change-transform"
        >
          {SKILL_CARDS.map((card) => (
            <AppCard
              key={card.id}
              data-skill-card="true"
              accent={card.accent ?? "secondary"}
              className="w-[82vw] max-w-[340px] sm:w-max sm:max-w-[440px] min-h-[280px] sm:min-h-[300px] shrink-0 hover:border-foreground/20 transition-all duration-300 group hover:shadow-2xl hover:shadow-secondary/10"
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
                  <span className="text-[11px] font-sans text-foreground/40 uppercase tracking-wider mr-1">
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
