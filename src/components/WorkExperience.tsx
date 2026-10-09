import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function WorkExperience() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "experience-timeline",
          trigger: section,
          start: "top top",
          end: "+=1600",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onEnter: () => {
            particleBridge.isDarkActive = true;
          },
          onEnterBack: () => {
            particleBridge.isDarkActive = true;
          },
          onLeaveBack: () => {
            particleBridge.experienceProgress = 0.0;
          },
          onUpdate: (self) => {
            const p = self.progress;

            // Phase 1 (0.0 -> 0.30): As section pins, triangles merge from screen-spread into "Work Experience" in the middle
            // Phase 2 (0.30 -> 1.0): "Work Experience" stays assembled in the middle with the content space empty
            const mergeDuration = 0.30;
            if (p < mergeDuration) {
              particleBridge.experienceProgress = p / mergeDuration;
            } else {
              particleBridge.experienceProgress = 1.0;
            }

            particleBridge.isDarkActive = true;
          },
        },
      });

      return () => {
        tl.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="relative w-full h-screen h-[100dvh] min-h-screen bg-transparent overflow-hidden select-none pointer-events-none"
    />
  );
}
