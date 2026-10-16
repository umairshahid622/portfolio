import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";

import { cn } from "../utils/cn";
import {
  AppCard,
  AppCardNumber,
  AppCardTitle,
  AppCardBadge,
  AppCardSummary,
  AppCardPill,
  AppCardFooter,
  type CardAccent,
} from "./AppCard";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface WorkExperienceItem {
  id: string;
  number: string;
  role: string;
  company: string;
  location: string;
  period: string;
  domain: string;
  summary: string;
  bullets: string[];
  skills: string[];
  accent: CardAccent;
  badgeAccent: CardAccent;
  roleColorClass: string;
  bulletDotClass: string;
  periodBadgeClass: string;
}

export const WORK_EXPERIENCES: WorkExperienceItem[] = [
  {
    id: "axian-group",
    number: "01",
    role: "Junior Flutter Developer",
    company: "Axian Group",
    location: "Islamabad, Pakistan",
    period: "Oct 2025 – Mar 2026",
    domain: "Fintech & Mobile Development",
    summary:
      "Engineered scalable cross-platform fintech mobile solutions with real-time transaction processing, secure authentication boundaries, and responsive state architecture.",
    bullets: [
      "Developed a cross-platform fintech mobile application using Flutter, ensuring scalability, performance, and seamless user experience.",
      "Integrated secure RESTful APIs supporting financial transactions, authentication, and real-time synchronization across platforms.",
      "Implemented state management using GetX, along with validations and optimized UI rendering, improving performance, security, and overall stability.",
    ],
    skills: ["Flutter", "Dart", "GetX", "RESTful APIs", "Fintech", "Security", "Real-Time Sync"],
    accent: "primary",
    badgeAccent: "secondary",
    roleColorClass: "text-primary",
    bulletDotClass: "bg-secondary text-secondary shadow-[0_0_8px_currentColor]",
    periodBadgeClass: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    id: "bx-technologies",
    number: "02",
    role: "Front-End Developer",
    company: "BX Technologies",
    location: "Islamabad, Pakistan",
    period: "Apr 2024 – Oct 2024",
    domain: "Interactive Web & Motion UI",
    summary:
      "Built high-performance, responsive React web applications featuring fluid Framer Motion animations and rigorous render-tree performance optimizations.",
    bullets: [
      "Developed high-performance web applications using React.js with modern libraries ensuring scalability and responsive interfaces.",
      "Implemented Framer Motion animations delivering smooth transitions, enhancing user engagement and application interactivity.",
      "Optimized performance through lazy loading, code splitting, and efficient rendering improving speed and user experience.",
    ],
    skills: ["React.js", "TypeScript", "JavaScript", "Framer Motion", "Lazy Loading", "Code Splitting", "Responsive UI"],
    accent: "secondary",
    badgeAccent: "tertiary",
    roleColorClass: "text-secondary",
    bulletDotClass: "bg-tertiary text-tertiary shadow-[0_0_8px_currentColor]",
    periodBadgeClass: "border-secondary/30 bg-secondary/10 text-secondary",
  },
  {
    id: "tecklogics",
    number: "03",
    role: "Front-End Developer",
    company: "Tecklogics",
    location: "Islamabad, Pakistan",
    period: "Jan 2024 – Mar 2024",
    domain: "Enterprise Systems & UI Architecture",
    summary:
      "Developed modular Angular enterprise applications with a robust design system built on Tailwind CSS, Grid, and Flexbox, integrated with live REST APIs.",
    bullets: [
      "Built responsive web applications using Angular framework ensuring scalability, optimization, and cross-device compatibility.",
      "Developed reusable UI components using Tailwind CSS, Grid, and Flexbox improving consistency and maintainability.",
      "Integrated RESTful APIs enabling real-time data synchronization ensuring smooth functionality and enhanced user experience.",
    ],
    skills: ["Angular", "TypeScript", "Tailwind CSS", "Component Architecture", "RESTful APIs", "CSS Grid", "Flexbox"],
    accent: "tertiary",
    badgeAccent: "accent",
    roleColorClass: "text-tertiary",
    bulletDotClass: "bg-accent text-accent shadow-[0_0_8px_currentColor]",
    periodBadgeClass: "border-tertiary/30 bg-tertiary/10 text-tertiary",
  },
  {
    id: "cyber-reconnaissance",
    number: "04",
    role: "Front-End Developer",
    company: "Cyber Reconnaissance & Combat",
    location: "Islamabad, Pakistan",
    period: "Aug 2022 – Dec 2022",
    domain: "Web Security & Defense Systems",
    summary:
      "Engineered secure, mission-critical web applications in Angular with robust authentication systems, access control boundaries, and optimized state management.",
    bullets: [
      "Developed secure and scalable web applications using Angular with modern UI libraries and frameworks.",
      "Implemented authentication systems enhancing application security, improving access control, and ensuring safe user interactions.",
      "Optimized performance using state management, lazy loading, and efficient rendering improving scalability and responsiveness.",
    ],
    skills: ["Angular", "TypeScript", "Web Security", "Authentication", "Access Control", "State Management", "Performance"],
    accent: "accent",
    badgeAccent: "primary",
    roleColorClass: "text-accent",
    bulletDotClass: "bg-primary text-primary shadow-[0_0_8px_currentColor]",
    periodBadgeClass: "border-accent/30 bg-accent/10 text-accent",
  },
];

export default function WorkExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const stackWrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stackWrapper = stackWrapperRef.current;
      if (!section || !stackWrapper) return;

      const cards = Array.from(
        stackWrapper.querySelectorAll<HTMLDivElement>(".experience-card")
      );
      if (cards.length < WORK_EXPERIENCES.length) return;

      const isMobile = window.innerWidth < 640;
      const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
      // Adaptive stepY: compact on mobile so 4 stacked cards stay comfortably in view
      const stepY = isMobile ? 32 : isTablet ? 46 : 56;
      const halfStep = Math.round(stepY / 2);

      // Initial state:
      // Cards container starts invisible until title moves to top
      gsap.set(stackWrapper, { opacity: 0, y: 30 });
      gsap.set(cards[0], { yPercent: 0, y: 0, scale: 1, opacity: 1, transformOrigin: "center top" });
      for (let i = 1; i < cards.length; i++) {
        gsap.set(cards[i], { yPercent: 125, y: 0, scale: 1, opacity: 0, transformOrigin: "center top" });
      }

      const existingSt = ScrollTrigger.getById("experience-timeline");
      if (existingSt) {
        existingSt.kill(true);
      }
      const existingLead = ScrollTrigger.getById("experience-particle-lead-in");
      if (existingLead) {
        existingLead.kill(true);
      }

      // Lead-in trigger: As Work Experience section enters viewport from bottom,
      // particles from the Skills spiral triangles smoothly fly into "Work Experience" in the center!
      ScrollTrigger.create({
        id: "experience-particle-lead-in",
        trigger: section,
        start: "top bottom",
        end: "top top",
        scrub: 0.8,
        onEnter: () => {
          particleBridge.isDarkActive = true;
          particleBridge.activeWord = "EXPERIENCE";
        },
        onEnterBack: () => {
          particleBridge.isDarkActive = true;
          particleBridge.activeWord = "EXPERIENCE";
        },
        onLeaveBack: () => {
          particleBridge.experienceProgress = 0.0;
          particleBridge.experienceTitleYProgress = 0.0;
          particleBridge.activeWord = "SKILLS";
        },
        onUpdate: (self) => {
          particleBridge.experienceProgress = self.progress;
          particleBridge.experienceTitleYProgress = 0.0;
          particleBridge.isDarkActive = true;
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "experience-timeline",
          trigger: section,
          start: "top top",
          end: "+=4400",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onEnter: () => {
            particleBridge.isDarkActive = true;
            particleBridge.experienceProgress = 1.0;
          },
          onEnterBack: () => {
            particleBridge.isDarkActive = true;
            particleBridge.experienceProgress = 1.0;
          },
          onLeave: () => {
            particleBridge.experienceProgress = 0.0;
            particleBridge.experienceTitleYProgress = 1.0;
          },
          onLeaveBack: () => {
            particleBridge.experienceProgress = 1.0;
            particleBridge.experienceTitleYProgress = 0.0;
          },
          onUpdate: (self) => {
            const p = self.progress;

            // 70% Section Height Scroll Threshold:
            // Phase 1 (0.00 -> 0.08): Title glides from center up to top position
            // Phase 2 (0.08 -> 0.70): Title stays fully assembled while cards stack
            // Phase 3 (0.70 -> 0.90): When 70% of Work Experience is scrolled, particles break down towards Contact
            // Phase 4 (0.90 -> 1.00): Particles stay broken / dispersed
            const titleGlideEnd = 0.08;
            const breakStart = 0.70;
            const breakEnd = 0.90;

            if (p < titleGlideEnd) {
              particleBridge.experienceProgress = 1.0;
              particleBridge.experienceTitleYProgress = p / titleGlideEnd;
            } else if (p < breakStart) {
              particleBridge.experienceProgress = 1.0;
              particleBridge.experienceTitleYProgress = 1.0;
            } else if (p < breakEnd) {
              const spreadP = (p - breakStart) / (breakEnd - breakStart);
              particleBridge.experienceProgress = Math.max(0.0, Math.min(1.0, 1.0 - spreadP));
              particleBridge.experienceTitleYProgress = 1.0;
            } else {
              particleBridge.experienceProgress = 0.0;
              particleBridge.experienceTitleYProgress = 1.0;
            }

            particleBridge.isDarkActive = true;
          },
        },
      });

      // 1. Reveal stack container & Card 0 as title reaches top (0.00 -> 0.08)
      tl.to(
        stackWrapper,
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.08,
        },
        0.0
      );

      // 2. Card 1 (02 BX Technologies - 2nd card) stacks on Card 0 (0.10 -> 0.36)
      // Symmetrical centering: Card 0 moves to -halfStep, Card 1 lands at +halfStep
      // Center remains Y = 0 (middle of the screen)
      tl.to(
        cards[0],
        {
          y: -halfStep,
          ease: "power1.inOut",
          duration: 0.26,
        },
        0.10
      );
      tl.to(
        cards[1],
        {
          yPercent: 0,
          y: halfStep,
          opacity: 1,
          ease: "power1.out",
          duration: 0.26,
        },
        0.10
      );

      // 3. Card 2 (03 Tecklogics - 3rd card) stacks on Card 1 (0.36 -> 0.62)
      // Symmetrical centering: Card 0 moves to -stepY, Card 1 moves to 0, Card 2 lands at +stepY
      // Center remains Y = 0 (middle of the screen)
      tl.to(
        cards[0],
        {
          y: -stepY,
          ease: "power1.inOut",
          duration: 0.26,
        },
        0.36
      );
      tl.to(
        cards[1],
        {
          y: 0,
          ease: "power1.inOut",
          duration: 0.26,
        },
        0.36
      );
      tl.to(
        cards[2],
        {
          yPercent: 0,
          y: stepY,
          opacity: 1,
          ease: "power1.out",
          duration: 0.26,
        },
        0.36
      );

      // 4. Card 3 (04 Cyber Reconnaissance & Combat - 4th card) stacks AND triangles spread AT THE EXACT SAME TIME (0.62 -> 0.88)
      // Symmetrical centering:
      // Card 0 -> -halfStep * 3 (-84px)
      // Card 1 -> -halfStep     (-28px)
      // Card 2 -> +halfStep     (+28px)
      // Card 3 -> +halfStep * 3 (+84px)
      // All previous cards are neatly tabbed: 01, 02, 03 all visible above 04!
      // Center remains Y = 0 (middle of the screen)
      tl.to(
        cards[0],
        {
          y: -halfStep * 3,
          ease: "power1.inOut",
          duration: 0.26,
        },
        0.62
      );
      tl.to(
        cards[1],
        {
          y: -halfStep,
          ease: "power1.inOut",
          duration: 0.26,
        },
        0.62
      );
      tl.to(
        cards[2],
        {
          y: halfStep,
          ease: "power1.inOut",
          duration: 0.26,
        },
        0.62
      );
      tl.to(
        cards[3],
        {
          yPercent: 0,
          y: halfStep * 3,
          opacity: 1,
          ease: "power1.out",
          duration: 0.26,
        },
        0.62
      );

      // 5. Final comfortable resting pause for completed stack (0.88 -> 1.00)
      tl.to({}, { duration: 0.12 }, 0.88);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="relative w-full h-[100dvh] min-h-screen bg-transparent overflow-hidden select-none flex flex-col justify-center items-center pt-12 sm:pt-16 pb-4 pointer-events-auto"
    >
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-3.5 sm:px-6 md:px-8 mt-4 sm:mt-0">
        {/* Full-width Stacked Cards Track */}
        <div
          ref={stackWrapperRef}
          className="relative w-full h-[450px] xs:h-[465px] sm:h-[410px] md:h-[390px] will-change-transform"
        >
          {WORK_EXPERIENCES.map((item, index) => (
            <AppCard
              key={item.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              accent={item.accent}
              className={cn(
                "experience-card absolute top-0 left-0 w-full h-full",
                index === 0 && "z-10",
                index === 1 && "z-20",
                index === 2 && "z-30",
                index === 3 && "z-40"
              )}
            >
              {/* Card Header & Content */}
              <div>
                {/* Number & Company Name (Left) and Location (Right in Heading Font) */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-1">
                  <div className="flex items-baseline gap-2.5 sm:gap-4 min-w-0">
                    <AppCardNumber className="text-xl xs:text-2xl sm:text-3xl md:text-4xl">
                      {item.number}
                    </AppCardNumber>
                    <AppCardTitle className="text-lg xs:text-xl sm:text-2xl md:text-3xl leading-snug sm:leading-tight">
                      {item.company}
                    </AppCardTitle>
                  </div>
                  <span className="font-heading text-xs sm:text-sm md:text-base font-medium tracking-normal text-muted/80 shrink-0 self-start sm:self-auto">
                    {item.location}
                  </span>
                </div>

                {/* Role */}
                <h4
                  className={cn(
                    "text-sm xs:text-base sm:text-lg md:text-xl font-bold tracking-tight",
                    item.roleColorClass
                  )}
                >
                  {item.role}
                </h4>

                {/* Domain under Role */}
                <div className="mt-1 mb-2 sm:mb-2.5">
                  <AppCardBadge accent={item.badgeAccent}>
                    {item.domain}
                  </AppCardBadge>
                </div>

                {/* Role Summary */}
                <AppCardSummary className="text-[11.5px] xs:text-xs sm:text-[13px] leading-snug sm:leading-relaxed mb-2 sm:mb-2.5 line-clamp-2 sm:line-clamp-none">
                  {item.summary}
                </AppCardSummary>

                {/* Key Bullet Points from Resume */}
                <ul className="space-y-1 sm:space-y-1.5 mb-2.5 sm:mb-3">
                  {item.bullets.map((bullet, bIdx) => (
                    <li
                      key={bIdx}
                      className={cn(
                        "text-[11px] xs:text-[11.5px] sm:text-[13px] text-foreground/85 leading-snug sm:leading-relaxed flex items-start gap-2",
                        bIdx === 2 && "hidden xs:flex sm:flex"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                          item.bulletDotClass
                        )}
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer: Tech Stack & Date */}
              <AppCardFooter className="pt-2 sm:pt-2.5 border-t border-foreground/10 flex flex-row items-center justify-between gap-2 mt-auto">
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 max-w-[70%] sm:max-w-none">
                  <span className="text-[10px] sm:text-[11px] font-sans text-tertiary/80 uppercase tracking-wider mr-0.5 shrink-0">
                    Stack:
                  </span>
                  {item.skills.map((skill, sIdx) => (
                    <AppCardPill key={sIdx} variant="tertiary" className="text-[9.5px] xs:text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2">
                      {skill}
                    </AppCardPill>
                  ))}
                </div>

                {/* Date / Period in Footer */}
                <div className="shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-sans text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border font-medium transition-colors whitespace-nowrap",
                      item.periodBadgeClass
                    )}
                  >
                    <svg
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {item.period}
                  </span>
                </div>
              </AppCardFooter>
            </AppCard>
          ))}
        </div>
      </div>
    </section>
  );
}
