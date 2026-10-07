import { useRef, useEffect, useState } from "react";
import gsap from "gsap";

interface GearIconProps {
  scrollProgress?: number;
  className?: string;
  size?: number;
}

export default function GearIcon({
  scrollProgress = 0,
  className = "",
  size = 52,
}: GearIconProps) {
  const outerGearRef = useRef<SVGGElement>(null);
  const innerGearRef = useRef<SVGGElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const rotationBaseRef = useRef(0);

  // Scroll-linked mechanical gear rotation
  useEffect(() => {
    if (outerGearRef.current) {
      // Outer gear rotates clockwise with scroll
      gsap.to(outerGearRef.current, {
        rotation: scrollProgress * 360 * 1.5 + rotationBaseRef.current,
        duration: 0.35,
        ease: "power1.out",
        transformOrigin: "50% 50%",
      });
    }
    if (innerGearRef.current) {
      // Inner gear counter-rotates counter-clockwise
      gsap.to(innerGearRef.current, {
        rotation: -(scrollProgress * 360 * 2.2 + rotationBaseRef.current * 1.5),
        duration: 0.35,
        ease: "power1.out",
        transformOrigin: "50% 50%",
      });
    }
  }, [scrollProgress]);

  // Ambient rotation loop
  useEffect(() => {
    let animFrame: number;
    const animate = () => {
      rotationBaseRef.current += isHovered ? 1.8 : 0.35;
      if (outerGearRef.current && !scrollProgress) {
        gsap.set(outerGearRef.current, {
          rotation: rotationBaseRef.current,
          transformOrigin: "50% 50%",
        });
      }
      if (innerGearRef.current && !scrollProgress) {
        gsap.set(innerGearRef.current, {
          rotation: -rotationBaseRef.current * 1.4,
          transformOrigin: "50% 50%",
        });
      }
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [isHovered, scrollProgress]);

  const handleClick = () => {
    setClicked(true);
    rotationBaseRef.current += 180;
    setTimeout(() => setClicked(false), 800);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Interactive Engineering Gear"
      className={`group relative flex items-center justify-center rounded-2xl p-2.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-earth-sand cursor-pointer ${className}`}
      style={{
        background: "radial-gradient(circle, rgba(221, 161, 94, 0.12) 0%, rgba(13, 19, 14, 0.6) 80%)",
        boxShadow: isHovered
          ? "0 0 25px rgba(221, 161, 94, 0.35), inset 0 0 15px rgba(188, 108, 37, 0.2)"
          : "0 0 10px rgba(0, 0, 0, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(221, 161, 94, 0.28)",
      }}
    >
      {/* Ambient starlight glow backdrop */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-earth-terracotta/20 via-earth-sand/15 to-earth-moss/20 blur-md transition-opacity duration-500 pointer-events-none ${
          isHovered ? "opacity-100" : "opacity-40"
        }`}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 transition-transform duration-300 ${
          clicked ? "scale-110" : isHovered ? "scale-105" : "scale-100"
        }`}
      >
        <defs>
          {/* Earthy Gold / Terracotta Gradient */}
          <linearGradient id="gearGradientGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fefae0" />
            <stop offset="40%" stopColor="#dda15e" />
            <stop offset="80%" stopColor="#bc6c25" />
            <stop offset="100%" stopColor="#606c38" />
          </linearGradient>

          {/* Copper Glow Filter */}
          <filter id="gearGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <radialGradient id="gearCenterGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf0" />
            <stop offset="60%" stopColor="#dda15e" />
            <stop offset="100%" stopColor="#283618" />
          </radialGradient>
        </defs>

        {/* Outer 12-Tooth Mechanical Cogwheel */}
        <g ref={outerGearRef} filter="url(#gearGlow)">
          <path
            d="
              M 50 14
              L 54 14 L 56 19 L 62 20 L 66 16 L 70 19 L 68 25 L 73 28 L 78 26 L 81 30 L 76 34 L 79 40 L 85 41 L 86 46 L 80 48 L 81 54 L 87 57 L 86 62 L 80 63 L 79 69 L 83 74 L 80 78 L 74 76 L 71 81 L 74 86 L 69 88 L 65 83 L 59 85 L 57 91 L 52 91 L 51 85 L 45 84 L 42 89 L 37 87 L 39 81 L 34 78 L 29 81 L 26 77 L 30 72 L 27 67 L 21 66 L 20 61 L 26 59 L 25 53 L 19 50 L 20 45 L 26 44 L 27 38 L 23 33 L 26 29 L 32 31 L 35 26 L 32 21 L 37 19 L 41 24 L 47 22 L 49 16 Z
            "
            fill="url(#gearGradientGold)"
            fillOpacity={isHovered ? 0.95 : 0.85}
            stroke="#fefae0"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Precision Circular Cutouts in Main Cog Body */}
          <circle cx="50" cy="50" r="28" fill="#0d130e" stroke="rgba(221, 161, 94, 0.6)" strokeWidth="1" />
          <circle cx="50" cy="29" r="3.2" fill="#0d130e" stroke="#dda15e" strokeWidth="0.75" />
          <circle cx="68" cy="40" r="3.2" fill="#0d130e" stroke="#dda15e" strokeWidth="0.75" />
          <circle cx="68" cy="60" r="3.2" fill="#0d130e" stroke="#dda15e" strokeWidth="0.75" />
          <circle cx="50" cy="71" r="3.2" fill="#0d130e" stroke="#dda15e" strokeWidth="0.75" />
          <circle cx="32" cy="60" r="3.2" fill="#0d130e" stroke="#dda15e" strokeWidth="0.75" />
          <circle cx="32" cy="40" r="3.2" fill="#0d130e" stroke="#dda15e" strokeWidth="0.75" />
        </g>

        {/* Inner Counter-Rotating 8-Tooth Sun Gear */}
        <g ref={innerGearRef}>
          <path
            d="
              M 50 31
              L 53 31 L 54 34 L 58 35 L 61 32 L 63 34 L 62 38 L 65 41 L 69 41 L 70 44 L 66 46 L 67 50 L 70 52 L 69 55 L 65 55 L 63 59 L 64 62 L 61 64 L 59 61 L 55 62 L 54 65 L 51 65 L 50 62 L 46 61 L 43 64 L 41 62 L 42 59 L 39 56 L 35 55 L 35 52 L 38 50 L 38 46 L 34 44 L 35 41 L 39 41 L 41 38 L 40 34 L 43 32 L 46 35 L 49 34 Z
            "
            fill="none"
            stroke="#dda15e"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </g>

        {/* Central Glowing Hub & Starlight Center */}
        <circle cx="50" cy="50" r="14" fill="#0d130e" stroke="#bc6c25" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="8" fill="url(#gearCenterGrad)" />
        <circle cx="50" cy="50" r="3.2" fill="#ffffff" />
        {/* Subtle center crosshairs */}
        <line x1="50" y1="42" x2="50" y2="58" stroke="#0d130e" strokeWidth="1" />
        <line x1="42" y1="50" x2="58" y2="50" stroke="#0d130e" strokeWidth="1" />
      </svg>
    </button>
  );
}
