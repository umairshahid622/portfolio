import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CharacterPointsCanvas from "./CharacterPointsCanvas";
import { particleBridge } from "../utils/particleBridge";
import {
  PORTAL_SCROLL_DISTANCE,
  OVERVIEW_SCROLL_DISTANCE,
} from "./HeroOverviewPortal";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ParticleExperienceWrapperProps {
  children: React.ReactNode;
}

const clamp01 = (value: number): number =>
  value <= 0 ? 0 : value >= 1 ? 1 : value;

const computeOverviewBreak = (p: number): number => {
  if (p < 0.7) return 0;
  if (p < 0.9) return (p - 0.7) / 0.2;
  return 1;
};

const computeSkillsState = (
  p: number,
  breakStart: number
): { progress: number; spread: number } => {
  const mergeDuration = 0.06;
  const breakEnd = Math.min(0.86, breakStart + 0.16);

  if (p <= 0) {
    return { progress: 0, spread: 0 };
  }
  if (p < mergeDuration) {
    return { progress: p / mergeDuration, spread: 0 };
  }
  if (p < breakStart) {
    return { progress: 1, spread: 0 };
  }
  return {
    progress: 1,
    spread: clamp01((p - breakStart) / Math.max(0.0001, breakEnd - breakStart)),
  };
};

const computeExperienceState = (
  p: number
): { progress: number; titleY: number } => {
  const titleGlideEnd = 0.08;
  const breakStart = 0.7;
  const breakEnd = 0.9;

  if (p < titleGlideEnd) {
    return { progress: 1, titleY: clamp01(p / titleGlideEnd) };
  }
  if (p < breakStart) {
    return { progress: 1, titleY: 1 };
  }
  if (p < breakEnd) {
    const spreadP = (p - breakStart) / (breakEnd - breakStart);
    return { progress: clamp01(1 - spreadP), titleY: 1 };
  }
  return { progress: 0, titleY: 1 };
};

/**
 * Mirrors Skills.tsx's Card 02 exit progress calculation during ScrollTrigger refresh
 * so the master flow controller requires zero DOM reads during scroll frames.
 */
const measureSkillsBreakStart = (): number => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return 0.46;
  }
  const cardsTrack = document.getElementById("skills-cards-track");
  if (!cardsTrack) return 0.46;

  const cardNodes = cardsTrack.querySelectorAll<HTMLElement>(
    '[data-skill-card="true"]'
  );
  if (cardNodes.length < 2) return 0.46;

  const isMobile = window.innerWidth < 768;
  const firstCard = cardNodes[0];
  const card2 = cardNodes[1];
  const lastCard = cardNodes[cardNodes.length - 1];

  let totalScroll = 0;
  if (isMobile) {
    const firstCenter = firstCard.offsetLeft + firstCard.offsetWidth * 0.5;
    const lastCenter = lastCard.offsetLeft + lastCard.offsetWidth * 0.5;
    totalScroll = Math.abs(lastCenter - firstCenter);
  } else {
    const pad = window.innerWidth >= 1024 ? 96 : 64;
    totalScroll = Math.max(
      0,
      cardsTrack.scrollWidth - window.innerWidth + pad
    );
  }

  if (totalScroll <= 0) return 0.46;

  const card2ExitDist = isMobile
    ? card2.offsetLeft +
      card2.offsetWidth * 0.5 -
      (firstCard.offsetLeft + firstCard.offsetWidth * 0.5)
    : card2.offsetLeft + card2.offsetWidth;

  const fraction = Math.min(
    0.7,
    Math.max(0.25, card2ExitDist / totalScroll)
  );
  return 0.14 + fraction * 0.74;
};

/**
 * ParticleExperienceWrapper
 *
 * Houses the continuous 3D particle canvas and orchestrates the unified
 * scroll-driven flow across Hero Portal, Overview, Skills, Work Experience,
 * and Contact with zero React re-renders.
 *
 * Key guarantees:
 * - Zero React state updates on scroll: canvas z-index stacking (`z-0` vs `z-20`)
 *   is toggled synchronously on the DOM ref to prevent re-renders and 1-frame flashes.
 * - Continuous, gap-free state partition across the entire scroll axis: prevents
 *   lagging `scrub` tails in one section from clobbering `particleBridge` after
 *   scrolling or jumping into another section.
 * - Shader branch continuity guard between the Skills 3D spiral ribbon and Work
 *   Experience orbital nebula during rapid bidirectional scrolling.
 */
export default function ParticleExperienceWrapper({
  children,
}: ParticleExperienceWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const isBehindRef = useRef<boolean>(true);

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      let wrapperTop = wrapper.offsetTop;
      let skillsBreakStart = measureSkillsBreakStart();
      let lastScrollY = -1;
      let lastTickerTime = gsap.ticker.time;
      // Keep syncing for 1.25s after any scroll/refresh so all `scrub: 0.8` timelines finish settling
      let activeUntilTime = gsap.ticker.time + 1.25;

      // Estimates matching CharacterPointsCanvas's `MathUtils.damp(..., 10, dt)`
      // to guarantee `uExperienceTitleYProgress` never crosses 0.5 unless `uExperienceProgress` is assembled
      let smoothExpEst = particleBridge.experienceProgress;
      let smoothTitleYEst = particleBridge.experienceTitleYProgress;

      const applyCanvasLayer = (behind: boolean) => {
        if (isBehindRef.current === behind) return;
        isBehindRef.current = behind;
        const vp = canvasViewportRef.current;
        if (!vp) return;
        vp.classList.toggle("z-0", behind);
        vp.classList.toggle("z-20", !behind);
      };

      const syncParticleFlow = (
        time: number,
        _deltaTime: number,
        force = false
      ) => {
        const scrollY = Math.max(
          0,
          window.scrollY || document.documentElement.scrollTop || 0
        );

        const dt = Math.min(0.1, Math.max(0.001, time - lastTickerTime));
        lastTickerTime = time;

        if (scrollY !== lastScrollY) {
          lastScrollY = scrollY;
          activeUntilTime = time + 1.25;
        } else if (!force && time > activeUntilTime) {
          return;
        }

        // O(1) hash lookups in GSAP ScrollTrigger — always fresh even if child triggers re-create
        const portalSt = ScrollTrigger.getById("hero-portal-trigger");
        const aboutSt = ScrollTrigger.getById("about-timeline");
        const skillsSt = ScrollTrigger.getById("skills-timeline");
        const expLeadSt = ScrollTrigger.getById("experience-particle-lead-in");
        const expSt = ScrollTrigger.getById("experience-timeline");
        const contactLeadSt = ScrollTrigger.getById("contact-particle-lead-in");
        const contactSt = ScrollTrigger.getById("contact-timeline");

        const portalStart = portalSt ? portalSt.start : wrapperTop;
        const portalEnd = portalSt
          ? portalSt.end
          : portalStart + PORTAL_SCROLL_DISTANCE;
        const portalP = portalSt
          ? portalSt.progress
          : clamp01(
              (scrollY - portalStart) / Math.max(1, portalEnd - portalStart)
            );

        const aboutStart = aboutSt ? aboutSt.start : portalEnd;
        const aboutEnd = aboutSt
          ? aboutSt.end
          : aboutStart + OVERVIEW_SCROLL_DISTANCE;
        const aboutP = aboutSt
          ? aboutSt.progress
          : clamp01(
              (scrollY - aboutStart) / Math.max(1, aboutEnd - aboutStart)
            );

        const skillsStart = skillsSt ? skillsSt.start : Infinity;
        const skillsEnd = skillsSt ? skillsSt.end : Infinity;
        const skillsP = skillsSt ? skillsSt.progress : 0;

        const expLeadStart = expLeadSt ? expLeadSt.start : skillsEnd;
        const expStart = expSt
          ? expSt.start
          : expLeadSt
          ? expLeadSt.end
          : Infinity;
        const expEnd = expSt ? expSt.end : Infinity;
        const expLeadP = expLeadSt
          ? expLeadSt.progress
          : clamp01(
              (scrollY - expLeadStart) / Math.max(1, expStart - expLeadStart)
            );
        const expP = expSt ? expSt.progress : 0;

        const contactLeadStart = contactLeadSt
          ? contactLeadSt.start
          : Infinity;
        const contactTop = contactLeadSt
          ? contactLeadSt.end
          : contactSt
          ? contactSt.start
          : Infinity;
        const contactLeadP = contactLeadSt
          ? contactLeadSt.progress
          : clamp01(
              (scrollY - contactLeadStart) /
                Math.max(1, contactTop - contactLeadStart)
            );

        // 1. Synchronous Canvas Stacking Control:
        //    - Behind (`z-0`) during Hero & Portal expansion until circular aperture is 100% open
        //    - In front (`z-20`) across Overview & Skills so the 3D spiral wraps the Skill cards
        //    - Behind (`z-0`) from Work Experience through Contact (including bottom overscroll)
        const inPortalPhase = scrollY < aboutStart || portalP < 0.998;
        const inExperienceOrContact = scrollY >= expStart;
        applyCanvasLayer(inPortalPhase || inExperienceOrContact);

        // 2. Continuous Master Particle State Partition:
        const PORTAL_DEADZONE = 0.04;
        if (
          scrollY <= portalStart + 8 ||
          (scrollY < aboutStart && portalP <= PORTAL_DEADZONE)
        ) {
          // Zone 0: Hero (portal closed)
          particleBridge.isDarkActive = false;
          particleBridge.overviewProgress = 0;
          particleBridge.skillsProgress = 0;
          particleBridge.skillsSpreadProgress = 0;
          particleBridge.experienceProgress = 0;
          particleBridge.experienceTitleYProgress = 0;
          particleBridge.contactProgress = 0;
          particleBridge.activeWord = "ABOUT ME";
        } else if (scrollY < aboutStart) {
          // Zone 1: Hero -> Overview circular portal expansion
          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress =
            aboutP > 0 ? computeOverviewBreak(aboutP) : 0;
          particleBridge.skillsProgress = 0;
          particleBridge.skillsSpreadProgress = 0;
          particleBridge.experienceProgress = 0;
          particleBridge.experienceTitleYProgress = 0;
          particleBridge.contactProgress = 0;
          particleBridge.activeWord = "ABOUT ME";
        } else if (scrollY <= aboutEnd) {
          // Zone 2: Overview drum reading & 70%->90% breakdown
          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = computeOverviewBreak(aboutP);
          particleBridge.skillsProgress = 0;
          particleBridge.skillsSpreadProgress = 0;
          particleBridge.experienceProgress = 0;
          particleBridge.experienceTitleYProgress = 0;
          particleBridge.contactProgress = 0;
          particleBridge.activeWord = "ABOUT ME";
        } else if (scrollY < skillsStart) {
          // Zone 3: Overview -> Skills interlude (bridges scrubbed breakdown & reverse unwind)
          const gapT = clamp01(
            (scrollY - aboutEnd) / Math.max(1, skillsStart - aboutEnd)
          );
          const overviewTail =
            aboutSt && (aboutSt.isActive || aboutP > 0)
              ? computeOverviewBreak(aboutP)
              : 1;
          const skUnwind =
            skillsP > 0
              ? computeSkillsState(skillsP, skillsBreakStart)
              : { progress: 0, spread: 0 };
          const unwindWeight = clamp01(gapT / 0.45);

          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = Math.max(
            overviewTail,
            clamp01(gapT / 0.55)
          );
          particleBridge.skillsProgress = skUnwind.progress * unwindWeight;
          particleBridge.skillsSpreadProgress = skUnwind.spread * unwindWeight;
          particleBridge.experienceProgress = 0;
          particleBridge.experienceTitleYProgress = 0;
          particleBridge.contactProgress = 0;
          particleBridge.activeWord =
            particleBridge.skillsProgress > 0.05 ? "SKILLS" : "ABOUT ME";
        } else if (scrollY <= skillsEnd) {
          // Zone 4: Skills pinned horizontal cards & 3D spring loop
          const sk = computeSkillsState(skillsP, skillsBreakStart);
          const expUnwind =
            skillsP > 0.8 && expLeadP > 0 && smoothTitleYEst <= 0.45
              ? expLeadP * clamp01((skillsP - 0.8) / 0.2)
              : 0;

          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = 1;
          particleBridge.skillsProgress = sk.progress;
          particleBridge.skillsSpreadProgress = sk.spread;
          particleBridge.experienceProgress = expUnwind;
          particleBridge.experienceTitleYProgress = 0;
          particleBridge.contactProgress = 0;
          particleBridge.activeWord = "SKILLS";
        } else if (scrollY < expStart) {
          // Zone 5: Skills -> Work Experience continuous spiral ribbon march
          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = 1;
          particleBridge.skillsProgress = 1;
          particleBridge.skillsSpreadProgress = 1;
          particleBridge.experienceTitleYProgress = 0;
          // Hold assembled (`1.0`) for ~4 frames on rapid upward scroll until smoothed titleY drops < 0.5
          // so the shader seamlessly switches back to the spiral path at the exact convergence point
          if (smoothTitleYEst > 0.45) {
            particleBridge.experienceProgress = 1;
            activeUntilTime = Math.max(activeUntilTime, time + 0.35);
          } else {
            particleBridge.experienceProgress = expLeadP;
          }
          particleBridge.contactProgress = 0;
          particleBridge.activeWord = "EXPERIENCE";
        } else if (scrollY <= expEnd) {
          // Zone 6: Work Experience pinned card stack
          const exp = computeExperienceState(expP);
          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = 1;
          particleBridge.skillsProgress = 1;
          particleBridge.skillsSpreadProgress = 1;
          particleBridge.experienceProgress = exp.progress;
          // Guard forward entry: keep titleY below the 0.5 shader threshold until spiral march finishes converging
          if (expP < 0.7 && smoothExpEst < 0.95) {
            particleBridge.experienceTitleYProgress = Math.min(
              exp.titleY,
              0.42
            );
            activeUntilTime = Math.max(activeUntilTime, time + 0.35);
          } else {
            particleBridge.experienceTitleYProgress = exp.titleY;
          }
          particleBridge.contactProgress = 0;
          particleBridge.activeWord = "EXPERIENCE";
        } else if (scrollY < contactTop) {
          // Zone 7: Work Experience unpin -> Contact lead-in morph
          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = 1;
          particleBridge.skillsProgress = 1;
          particleBridge.skillsSpreadProgress = 1;
          particleBridge.experienceTitleYProgress = 1;

          if (scrollY < contactLeadStart) {
            const preGapT = clamp01(
              (scrollY - expEnd) / Math.max(1, contactLeadStart - expEnd)
            );
            const expTail =
              expSt && (expSt.isActive || expP > 0)
                ? computeExperienceState(expP).progress
                : 0;
            particleBridge.experienceProgress = expTail * (1 - preGapT);
            particleBridge.contactProgress = contactLeadP * preGapT;
            particleBridge.activeWord =
              particleBridge.contactProgress > 0.05 ? "CONTACT" : "EXPERIENCE";
          } else {
            particleBridge.experienceProgress = 0;
            particleBridge.contactProgress = contactLeadP;
            particleBridge.activeWord = "CONTACT";
          }
        } else {
          // Zone 8: Contact section & bottom-of-page overscroll
          const settledContactP =
            contactLeadSt && (contactLeadSt.isActive || contactLeadP > 0)
              ? Math.max(
                  contactLeadP,
                  clamp01((scrollY - contactTop) / 300)
                )
              : 1;

          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = 1;
          particleBridge.skillsProgress = 1;
          particleBridge.skillsSpreadProgress = 1;
          particleBridge.experienceProgress = 0;
          particleBridge.experienceTitleYProgress = 1;
          particleBridge.contactProgress = settledContactP;
          particleBridge.activeWord = "CONTACT";
        }

        // Advance smoothed shader uniform estimates (`lambda = 10` matches CharacterPointsCanvas)
        const dampFactor = 1 - Math.exp(-10 * dt);
        smoothExpEst +=
          (particleBridge.experienceProgress - smoothExpEst) * dampFactor;
        smoothTitleYEst +=
          (particleBridge.experienceTitleYProgress - smoothTitleYEst) *
          dampFactor;
      };

      const handleRefresh = () => {
        wrapperTop = wrapper.offsetTop;
        skillsBreakStart = measureSkillsBreakStart();
        activeUntilTime = gsap.ticker.time + 1.25;
        syncParticleFlow(gsap.ticker.time, 16, true);
      };

      const handleNativeScroll = () => {
        activeUntilTime = gsap.ticker.time + 1.25;
      };

      const tickerFn = (time: number, deltaTime: number) => {
        syncParticleFlow(time, deltaTime, false);
      };

      ScrollTrigger.addEventListener("refresh", handleRefresh);
      window.addEventListener("scroll", handleNativeScroll, { passive: true });
      gsap.ticker.add(tickerFn);

      // Run initial synchronization immediately, then move tickerFn to the tail of gsap.ticker
      // after App's useEffect initializes Lenis so syncParticleFlow always executes last per frame
      handleRefresh();
      const tailOrderRaf = window.requestAnimationFrame(() => {
        gsap.ticker.remove(tickerFn);
        gsap.ticker.add(tickerFn);
        handleRefresh();
      });

      return () => {
        window.cancelAnimationFrame(tailOrderRaf);
        ScrollTrigger.removeEventListener("refresh", handleRefresh);
        window.removeEventListener("scroll", handleNativeScroll);
        gsap.ticker.remove(tickerFn);
      };
    },
    { scope: wrapperRef }
  );

  return (
    <div
      ref={wrapperRef}
      id="particle-experience-wrapper"
      className="dark relative w-full bg-surface-dark text-foreground"
    >
      {/* 3D Particle Canvas Viewport & Single Continuous Background */}
      {/* CSS sticky keeps this viewport locked across all sections with ZERO GSAP pin conflicts */}
      {/* z-20 = particles over content (Overview/Skills). z-0 = particles tucked behind content
          (Hero portal aperture, Work Experience cards, and Contact form). */}
      <div
        ref={canvasViewportRef}
        className="sticky top-0 left-0 z-0 w-full h-screen h-[100dvh] pointer-events-none overflow-hidden"
        style={{ contain: "layout paint" }}
      >
        <CharacterPointsCanvas className="relative z-10" />
      </div>

      {/* Content Layer: Hero Portal, Overview, Skills, Work Experience & Contact */}
      <div
        className="relative z-10 w-full pointer-events-auto"
        style={{ marginTop: "-100dvh" }}
      >
        {children}
      </div>
    </div>
  );
}
