import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CharacterPointsCanvas from "./CharacterPointsCanvas";
import { particleBridge } from "../utils/particleBridge";

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

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      // Dark Theme & Particle Activation:
      // Active strictly when inside this wrapper.
      // When scrolling back up to Hero, isDarkActive becomes false so particles fade out cleanly.
      ScrollTrigger.create({
        trigger: wrapper,
        start: "top 75%",
        end: "bottom bottom",
        onToggle: (self) => {
          if (self.isActive) {
            particleBridge.isDarkActive = true;
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
    },
    { scope: wrapperRef }
  );

  return (
    <div
      ref={wrapperRef}
      id="particle-experience-wrapper"
      className="dark relative w-full bg-earth-black text-earth-cream"
    >
      {/* 3D Particle Canvas Viewport & Single Continuous Background */}
      {/* CSS sticky keeps this viewport locked across Overview & Skills with ZERO GSAP pin conflicts */}
      <div
        className="sticky top-0 left-0 w-full h-screen h-[100dvh] pointer-events-none z-0 overflow-hidden"
      >
        <CharacterPointsCanvas className="relative z-10" />
      </div>

      {/* Content Layer: Overview, Skills, and future particle sections */}
      <div className="relative z-10 -mt-[100vh] w-full pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
