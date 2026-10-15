import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "./Hero";
import Overview from "./Overview";
import { particleBridge } from "../utils/particleBridge";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const PORTAL_SCROLL_DISTANCE = 850;
export const OVERVIEW_SCROLL_DISTANCE = 1100;
export const TOTAL_PORTAL_OVERVIEW_DISTANCE =
  PORTAL_SCROLL_DISTANCE + OVERVIEW_SCROLL_DISTANCE;

/**
 * HeroOverviewPortal
 *
 * Replaces normal vertical scrolling between Hero and Overview with a scroll-driven
 * circular portal expansion.
 *
 * Mechanics:
 * - At scroll = 0: Hero is in full view. In the exact center (50% 50%), a 0px x 0px
 *   singularity point beacon rests with subtle ambient pulse.
 * - On scroll (0 -> 850px): Hero stays locked in the viewport via CSS sticky.
 *   The center point expands outward into a circular aperture from 0px to 150%,
 *   revealing Overview (dark cosmos background, 3D "ABOUT ME" mesh text, and the
 *   overview content) inside the portal. A luminous celestial ring tracks the perimeter.
 * - At scroll = 850px: The portal is fully open (covering the entire screen).
 *   The user seamlessly transitions into Overview's reading reveal and 70% particle breakdown.
 * - Reverse Interaction: Scrolling back up from Overview contracts the portal circle
 *   back down to the 0px center point in Hero.
 */
export default function HeroOverviewPortal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroLayerRef = useRef<HTMLDivElement>(null);
  const centerPointRef = useRef<HTMLDivElement>(null);
  const portalRingRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const heroLayer = heroLayerRef.current;
      const centerPoint = centerPointRef.current;
      const portalRing = portalRingRef.current;
      if (!container || !heroLayer || !centerPoint || !portalRing) return;

      const existingSt = ScrollTrigger.getById("hero-portal-trigger");
      if (existingSt) {
        existingSt.kill(true);
      }

      ScrollTrigger.create({
        id: "hero-portal-trigger",
        trigger: container,
        start: "top top",
        end: `top+=${PORTAL_SCROLL_DISTANCE} top`,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onEnter: () => {
          particleBridge.isDarkActive = true;
        },
        onEnterBack: () => {
          particleBridge.isDarkActive = true;
        },
        onLeaveBack: () => {
          particleBridge.isDarkActive = false;
          particleBridge.overviewProgress = 0.0;
          heroLayer.style.webkitMaskImage = "";
          heroLayer.style.maskImage = "";
          heroLayer.style.opacity = "1";
          heroLayer.style.pointerEvents = "auto";
          centerPoint.style.opacity = "1";
          centerPoint.style.transform = "translate(-50%, -50%) scale(1)";
          portalRing.style.opacity = "0";
          portalRing.style.width = "0px";
          portalRing.style.height = "0px";
        },
        onUpdate: (self) => {
          const p = self.progress;
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;

          if (p <= 0.002) {
            particleBridge.isDarkActive = false;
            heroLayer.style.webkitMaskImage = "";
            heroLayer.style.maskImage = "";
            heroLayer.style.opacity = "1";
            heroLayer.style.pointerEvents = "auto";
            centerPoint.style.opacity = "1";
            centerPoint.style.transform = "translate(-50%, -50%) scale(1)";
            portalRing.style.opacity = "0";
            portalRing.style.width = "0px";
            portalRing.style.height = "0px";
            return;
          }

          particleBridge.isDarkActive = true;
          particleBridge.overviewProgress = 0.0;

          centerPoint.style.opacity = "0";
          centerPoint.style.transform = "translate(-50%, -50%) scale(0.3)";

          // Calculate radius needed to fully encompass the viewport corners from center (50% 50%)
          const maxRadius = Math.hypot(centerX, centerY) * 1.25;
          const currentRadius = p * maxRadius;

          if (p >= 0.998) {
            heroLayer.style.webkitMaskImage = "";
            heroLayer.style.maskImage = "";
            heroLayer.style.opacity = "0";
            heroLayer.style.pointerEvents = "none";
            portalRing.style.opacity = "0";
            return;
          }

          // Cutout aperture in Hero centered at exact pixel coordinates (centerX, centerY)
          const mask = `radial-gradient(circle at ${centerX.toFixed(1)}px ${centerY.toFixed(
            1
          )}px, transparent 0px, transparent ${currentRadius.toFixed(
            1
          )}px, #000 ${(currentRadius + 2).toFixed(1)}px, #000 100%)`;
          heroLayer.style.webkitMaskImage = mask;
          heroLayer.style.maskImage = mask;

          // Soft fade out for remaining corner slivers near full expansion
          heroLayer.style.opacity =
            p > 0.88 ? `${Math.max(0, 1 - (p - 0.88) / 0.12)}` : "1";
          heroLayer.style.pointerEvents = p > 0.25 ? "none" : "auto";

          // Luminous portal boundary ring locked to the exact same center & radius
          const diameter = currentRadius * 2;
          portalRing.style.left = `${(centerX - currentRadius).toFixed(1)}px`;
          portalRing.style.top = `${(centerY - currentRadius).toFixed(1)}px`;
          portalRing.style.width = `${diameter.toFixed(1)}px`;
          portalRing.style.height = `${diameter.toFixed(1)}px`;
          portalRing.style.opacity =
            p > 0.94 ? `${Math.max(0, 1 - (p - 0.94) / 0.06)}` : "1";
        },
      });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="hero-portal-wrapper"
      className="relative w-full"
      style={{
        height: `calc(100vh + ${TOTAL_PORTAL_OVERVIEW_DISTANCE}px)`,
      }}
    >
      {/* Sticky Viewport locks at top: 0 for the entire portal expansion + overview scrub */}
      <div className="sticky top-0 left-0 w-full h-screen h-[100dvh] overflow-hidden select-none">
        {/* Layer 1: Overview (Behind Hero, revealed through the expanding circular aperture) */}
        <div className="absolute inset-0 w-full h-full z-10 overflow-hidden">
          <Overview embedded={true} />
        </div>

        {/* Layer 2: Hero (Masked out from center (50% 50%) as user scrolls) */}
        <div
          ref={heroLayerRef}
          className="absolute inset-0 w-full h-full z-20 overflow-hidden will-change-[mask-image,-webkit-mask-image,opacity]"
        >
          <Hero />
        </div>

        {/* Layer 3: 0px x 0px Center Point Singularity Beacon */}
        <div
          ref={centerPointRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center transition-opacity duration-300"
        >
          <div className="relative flex items-center justify-center">
            {/* Core 0px Origin Singularity Dot */}
            <div className="w-2 h-2 rounded-full bg-primary portal-beacon-glow" />
            {/* Ambient Pulse Ping Rings */}
            <div className="absolute w-5 h-5 rounded-full border border-primary/50 animate-ping opacity-60" />
            <div className="absolute w-9 h-9 rounded-full border border-primary/25 animate-pulse opacity-40" />
          </div>
        </div>

        {/* Layer 4: Expanding Celestial Portal Boundary Ring with Dynamic Theme Glow */}
        <div
          ref={portalRingRef}
          className="absolute rounded-full pointer-events-none z-30 opacity-0 will-change-[width,height,left,top,opacity] border-[2.5px] border-primary/90 portal-ring-glow"
          style={{ width: 0, height: 0, left: "50%", top: "50%" }}
        />
      </div>
    </div>
  );
}
