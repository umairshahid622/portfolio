import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CharacterPointsCanvas from "./CharacterPointsCanvas";
import { particleBridge } from "../utils/particleBridge";
import { cn } from "../utils/cn";
import { PORTAL_SCROLL_DISTANCE } from "./HeroOverviewPortal";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface ParticleExperienceWrapperProps {
  children: React.ReactNode;
}

/**
 * ParticleExperienceWrapper
 * 
 * Houses the continuous 3D particle canvas and orchestrates master timelines
 * across wrapped sections (Overview, Skills, and future object/word morphs).
 * 
 * Isolates Hero completely: particles and dark universe background only exist
 * within this wrapper, so the particle text stays sticked to Overview and never
 * bleeds into the Hero section.
 */
export default function ParticleExperienceWrapper({
  children,
}: ParticleExperienceWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Stacking control for the particle viewport.
  // The particle field is ONE continuous layer shared by every section, so where it sits in the
  // stack has to change per phase:
  //   - Hero -> Overview portal: canvas goes BEHIND the content layer. The Hero layer is masked
  //     out from the centre with an expanding circular aperture, so sitting behind it means the
  //     particles appear INSIDE the portal as it opens, instead of floating over the Hero's own
  //     "Umair Shahid" content.
  //   - Work Experience: canvas goes BEHIND the content layer too, so the floating nebula never
  //     covers the stacked resume cards.
  //   - Everywhere else (Overview, Skills, Contact): canvas stays IN FRONT (z-20). Skills needs
  //     that so the loop can wrap the cards — the shader decides per-shard which parts of the
  //     loop may cover a card (depth test in CharacterPointsCanvas).
  //
  // `portalBehind` starts as `true` on purpose: at scroll position 0 ScrollTrigger reports the
  // portal trigger as "not active", and the Hero's own trigger flips `isDarkActive` synchronously
  // on the very first scroll tick — one frame before this React state would land. That frame used
  // to draw the fading-in "ABOUT ME" mesh over the Hero as a brief flash, in both directions
  // (leaving the Hero and returning to it).
  const [portalBehind, setPortalBehind] = useState(true);
  const [experienceBehind, setExperienceBehind] = useState(false);
  const [contactBehind, setContactBehind] = useState(false);
  const particlesBehind = portalBehind || experienceBehind || contactBehind;

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      // Dark Theme & Particle Activation:
      // Active strictly when inside this wrapper.
      // When scrolling back up to Hero, isDarkActive becomes false so particles fade out cleanly.
      ScrollTrigger.create({
        trigger: wrapper,
        start: "top+=15 top",
        end: "bottom bottom",
        onToggle: (self) => {
          if (self.isActive) {
            particleBridge.isDarkActive = true;
          } else {
            particleBridge.isDarkActive = false;
          }
        },
        onRefresh: (self) => {
          if (self.isActive) {
            particleBridge.isDarkActive = true;
          }
        },
        onEnter: () => {
          particleBridge.isDarkActive = true;
        },
        onEnterBack: () => {
          particleBridge.isDarkActive = true;
        },
        onLeave: () => {
          // Keep active so particles do not disappear at bottom of content
          particleBridge.isDarkActive = true;
        },
        onLeaveBack: () => {
          // Only fade out when scrolling all the way back up to Hero
          particleBridge.isDarkActive = false;
          particleBridge.overviewProgress = 0;
          particleBridge.skillsProgress = 0;
          particleBridge.experienceProgress = 0;
        },
      });

      // Portal phase: keep the canvas behind the Hero layer for the whole circular aperture
      // expansion, so the particles are revealed THROUGH the portal (and stay hidden behind the
      // still-opaque Hero everywhere else).
      const portalLayering = ScrollTrigger.create({
        id: "particle-layer-behind-portal",
        trigger: "#hero-portal-wrapper",
        start: "top top",
        end: `top+=${PORTAL_SCROLL_DISTANCE} top`,
        onUpdate: (self) => setPortalBehind(self.progress < 1),
        onRefresh: (self) => setPortalBehind(self.progress < 1),
      });

      // Work Experience phase: the whole nebula sits behind the stacked resume cards.
      //
      // The section is GSAP-pinned, so its own box is only one viewport tall. ScrollTrigger
      // wraps it in a "pin-spacer" that carries its real scroll footprint (pin distance +
      // viewport) — measuring that covers the whole pinned sequence. The swap lands at the pin
      // start, where the cards are still at opacity 0, so the layer change is imperceptible.
      const footprintOf = (selector: string) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) return null;
        return el.parentElement?.classList.contains("pin-spacer")
          ? el.parentElement
          : el;
      };

      const experienceFootprint = footprintOf("#experience");

      const cardLayering = experienceFootprint
        ? ScrollTrigger.create({
            id: "particle-layer-behind-cards",
            trigger: experienceFootprint,
            start: "top top",
            end: "bottom top",
            onToggle: (self) => setExperienceBehind(self.isActive),
            onRefresh: (self) => setExperienceBehind(self.isActive),
          })
        : null;

      // Contact phase: keep canvas behind Contact form so all form inputs,
      // textareas, buttons, and contact links remain 100% clickable with zero layer obstruction
      const contactFootprint = footprintOf("#contact");

      const contactLayering = contactFootprint
        ? ScrollTrigger.create({
            id: "particle-layer-behind-contact",
            trigger: contactFootprint,
            start: "top 80%",
            end: "bottom bottom",
            onToggle: (self) => setContactBehind(self.isActive),
            onRefresh: (self) => setContactBehind(self.isActive),
          })
        : null;

      return () => {
        portalLayering.kill();
        cardLayering?.kill();
        contactLayering?.kill();
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
      {/* CSS sticky keeps this viewport locked across Overview & Skills with ZERO GSAP pin conflicts */}
      {/* z-20 = particles over content (Overview/Skills/Contact). z-0 = particles tucked behind the
          content layer (Hero portal aperture + Work Experience cards). */}
      <div
        className={cn(
          "sticky top-0 left-0 w-full h-screen h-[100dvh] pointer-events-none overflow-hidden",
          particlesBehind ? "z-0" : "z-20"
        )}
      >
        <CharacterPointsCanvas className="relative z-10" />
      </div>

      {/* Content Layer: Overview, Skills, and future particle sections */}
      <div
        className="relative z-10 w-full pointer-events-auto"
        style={{ marginTop: "-100dvh" }}
      >
        {children}
      </div>
    </div>
  );
}
