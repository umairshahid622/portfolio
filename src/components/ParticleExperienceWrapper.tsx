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

const clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);

const rangeProgress = (s: number, start: number, end: number): number =>
  end > start ? clamp01((s - start) / (end - start)) : s >= end ? 1 : 0;

/**
 * Mirrors Skills.tsx's Card 02 exit progress calculation on ScrollTrigger refresh
 * so the flow loop performs zero DOM reads during scroll frames.
 */
const measureSkillsBreakStart = (): number => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return 0.46;
  }
  const track = document.getElementById("skills-cards-track");
  if (!track) return 0.46;

  const cards = track.querySelectorAll<HTMLElement>('[data-skill-card="true"]');
  if (cards.length < 2) return 0.46;

  const isMobile = window.innerWidth < 768;
  const first = cards[0];
  const second = cards[1];
  const last = cards[cards.length - 1];

  const totalScroll = isMobile
    ? Math.abs(
        last.offsetLeft +
          last.offsetWidth * 0.5 -
          (first.offsetLeft + first.offsetWidth * 0.5)
      )
    : Math.max(
        0,
        track.scrollWidth -
          window.innerWidth +
          (window.innerWidth >= 1024 ? 96 : 64)
      );

  if (totalScroll <= 0) return 0.46;

  const exitDist = isMobile
    ? second.offsetLeft +
      second.offsetWidth * 0.5 -
      (first.offsetLeft + first.offsetWidth * 0.5)
    : second.offsetLeft + second.offsetWidth;

  return 0.14 + Math.min(0.7, Math.max(0.25, exitDist / totalScroll)) * 0.74;
};

/**
 * ParticleExperienceWrapper
 *
 * Houses the continuous 3D particle canvas and drives a single damped scroll
 * coordinate (`smoothScrollY`) across Hero Portal, Overview, Skills, Work
 * Experience, and Contact with zero React re-renders and C0 continuity at
 * every section boundary.
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

      const getScrollY = () =>
        Math.max(
          0,
          window.scrollY || document.documentElement.scrollTop || 0
        );

      let wrapperTop = wrapper.offsetTop;
      let skillsBreakStart = measureSkillsBreakStart();
      let smoothScrollY = getScrollY();
      let lastRawScrollY = -1;
      let lastTickerTime = gsap.ticker.time;
      // Keep syncing for 1.1s after scroll stops so all `scrub: 0.8` child timelines settle
      let activeUntilTime = gsap.ticker.time + 1.1;

      const applyCanvasLayer = (behind: boolean) => {
        if (isBehindRef.current === behind) return;
        isBehindRef.current = behind;
        const vp = canvasViewportRef.current;
        if (!vp) return;
        vp.classList.toggle("z-0", behind);
        vp.classList.toggle("z-20", !behind);
      };

      const syncParticleFlow = (time: number, force = false) => {
        const rawScrollY = getScrollY();
        const dt = Math.min(0.1, Math.max(0.001, time - lastTickerTime));
        lastTickerTime = time;

        if (rawScrollY !== lastRawScrollY) {
          lastRawScrollY = rawScrollY;
          activeUntilTime = time + 1.1;
        }

        if (force) {
          smoothScrollY = rawScrollY;
        } else {
          const diff = rawScrollY - smoothScrollY;
          if (Math.abs(diff) > 0.25) {
            // Damping rate lambda = 10 matches GSAP `scrub: 0.8` and CharacterPointsCanvas
            smoothScrollY += diff * (1 - Math.exp(-10 * dt));
            activeUntilTime = Math.max(activeUntilTime, time + 0.2);
          } else {
            smoothScrollY = rawScrollY;
            if (time > activeUntilTime) return;
          }
        }

        const s = smoothScrollY;

        // O(1) ScrollTrigger hash lookups
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
        const aboutStart = aboutSt ? aboutSt.start : portalEnd;
        const aboutEnd = aboutSt
          ? aboutSt.end
          : aboutStart + OVERVIEW_SCROLL_DISTANCE;
        const skillsStart = skillsSt ? skillsSt.start : Infinity;
        const skillsEnd = skillsSt ? skillsSt.end : Infinity;
        const expLeadStart = expLeadSt ? expLeadSt.start : skillsEnd;
        const expStart = expSt
          ? expSt.start
          : expLeadSt
          ? expLeadSt.end
          : Infinity;
        const expEnd = expSt ? expSt.end : Infinity;
        const contactLeadStart = contactLeadSt
          ? contactLeadSt.start
          : Infinity;
        const contactTop = contactLeadSt
          ? contactLeadSt.end
          : contactSt
          ? contactSt.start
          : Infinity;

        // 1. Canvas Z-Layering:
        //    - Behind (`z-0`) during Hero & Portal expansion until aperture is fully open
        //    - In front (`z-20`) across Overview & Skills until Skill cards exit the top (`expStart - 15%`)
        //    - Behind (`z-0`) across Work Experience, Contact, and bottom overscroll
        const portalP = portalSt
          ? portalSt.progress
          : rangeProgress(s, portalStart, portalEnd);
        const expLayerSwitch =
          expStart - Math.max(0, expStart - expLeadStart) * 0.15;
        applyCanvasLayer(
          s < aboutStart || portalP < 0.998 || s >= expLayerSwitch
        );

        // 2. Continuous C0 Particle State Evaluation at `s = smoothScrollY`:
        const portalDeadzoneEnd =
          portalStart + (aboutStart - portalStart) * 0.04;

        let dark = true;
        let ov = 0;
        let sk = 0;
        let skSpread = 0;
        let exp = 0;
        let expY = 0;
        let ct = 0;
        let word = "ABOUT ME";

        if (rawScrollY <= portalStart + 8 || s <= portalDeadzoneEnd) {
          dark = false;
        } else if (s <= skillsStart) {
          // Portal expansion (s < aboutStart -> p = 0 -> ov = 0), Overview drum (0 -> 0.7),
          // and nebula breakdown (0.7 -> 0.9), held at 1.0 through the Skills interlude
          const p = rangeProgress(s, aboutStart, aboutEnd);
          ov = p < 0.7 ? 0 : p < 0.9 ? (p - 0.7) / 0.2 : 1;
        } else if (s <= skillsEnd) {
          // Skills pinned horizontal cards & 3D spring loop
          const p = rangeProgress(s, skillsStart, skillsEnd);
          const breakEnd = Math.min(0.86, skillsBreakStart + 0.16);
          ov = 1;
          sk = p < 0.06 ? p / 0.06 : 1;
          skSpread =
            p < skillsBreakStart
              ? 0
              : clamp01(
                  (p - skillsBreakStart) /
                    Math.max(0.0001, breakEnd - skillsBreakStart)
                );
          word = "SKILLS";
        } else if (s < expStart) {
          // Skills -> Work Experience continuous spiral ribbon march
          ov = 1;
          sk = 1;
          skSpread = 1;
          exp = rangeProgress(s, expLeadStart, expStart);
          word = "EXPERIENCE";
        } else if (s <= expEnd) {
          // Work Experience pinned card stack (title glides up 0->0.08, holds 0.08->0.7, disperses 0.7->0.9)
          const p = rangeProgress(s, expStart, expEnd);
          ov = 1;
          sk = 1;
          skSpread = 1;
          exp = p < 0.7 ? 1 : p < 0.9 ? 1 - (p - 0.7) / 0.2 : 0;
          expY = p < 0.08 ? p / 0.08 : 1;
          word = "EXPERIENCE";
        } else {
          // Work Experience unpin -> Contact lead-in & Contact section (including bottom overscroll)
          ov = 1;
          sk = 1;
          skSpread = 1;
          exp = 0;
          expY = 1;
          ct =
            s < contactLeadStart
              ? 0
              : rangeProgress(s, contactLeadStart, contactTop);
          word = ct > 0 ? "CONTACT" : "EXPERIENCE";
        }

        particleBridge.isDarkActive = dark;
        particleBridge.overviewProgress = ov;
        particleBridge.skillsProgress = sk;
        particleBridge.skillsSpreadProgress = skSpread;
        particleBridge.experienceProgress = exp;
        particleBridge.experienceTitleYProgress = expY;
        particleBridge.contactProgress = ct;
        particleBridge.activeWord = word;
      };

      const handleRefresh = () => {
        wrapperTop = wrapper.offsetTop;
        skillsBreakStart = measureSkillsBreakStart();
        activeUntilTime = gsap.ticker.time + 1.1;
        syncParticleFlow(gsap.ticker.time, true);
      };

      const handleNativeScroll = () => {
        activeUntilTime = gsap.ticker.time + 1.1;
      };

      const tickerFn = (time: number) => {
        syncParticleFlow(time, false);
      };

      ScrollTrigger.addEventListener("refresh", handleRefresh);
      window.addEventListener("scroll", handleNativeScroll, { passive: true });
      gsap.ticker.add(tickerFn);

      // Sync immediately, then place tickerFn at the tail of gsap.ticker after App's Lenis effect mounts
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
