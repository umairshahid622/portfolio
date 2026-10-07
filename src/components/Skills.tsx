import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { particleBridge } from "../utils/particleBridge";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const [, setMergeProgress] = useState(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      // ScrollTrigger that converges particles into "SKILLS" (left) and 3D Gear (right)
      ScrollTrigger.create({
        trigger: section,
        start: "top 85%", // initiates convergence as section approaches viewport
        end: "top 12%",   // solidifies completely into "SKILLS" and Gear as section settles
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          particleBridge.skillsProgress = self.progress;
          setMergeProgress(self.progress);
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="relative w-full h-screen h-[100dvh] min-h-screen py-20 px-4 sm:px-8 md:px-12 bg-transparent text-earth-cream transition-colors duration-300 flex flex-col justify-start"
    >
      {/* Accessible Section Heading */}
      <h2 className="sr-only">Skills</h2>

      {/* Top Header Bar Container */}
      <div className="w-full max-w-7xl mx-auto relative z-10">
        
      </div>
    </section>
  );
}
