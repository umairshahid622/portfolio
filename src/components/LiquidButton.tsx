import React, { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

export interface LiquidButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "primary" | "secondary" | "accent";
  liquidColor?: string;
  liquidColorBack?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

/**
 * LiquidButton
 *
 * Inspired by the GSAP community liquid button showcase & discussion:
 * https://gsap.com/community/forums/topic/27839-liquid-button-using-gsap-library/
 * (Featuring Utopia Agriculture liquid wave physics, Cassie Evans & OSUblake wave techniques,
 * and George Francis vector point perturbation).
 */
export default function LiquidButton({
  href,
  variant = "primary",
  liquidColor,
  liquidColorBack,
  icon,
  iconPosition = "left",
  children,
  className = "",
  ...props
}: LiquidButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const frontWaveRef = useRef<SVGPathElement | null>(null);
  const backWaveRef = useRef<SVGPathElement | null>(null);
  const textTrackRef = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef(false);
  const isAnimatingRef = useRef(false);

  // Default color schemes according to variant
  const colors = {
    primary: {
      border: "border-brand-orange/40 hover:border-brand-orange/80",
      bg: "bg-brand-orange/10 dark:bg-brand-orange/15",
      text: "text-brand-orange dark:text-[#ff9429]",
      hoverText: "text-white",
      shadow: "shadow-md shadow-brand-orange/20 hover:shadow-brand-orange/30",
      front: "#ff7d00",
      back: "#d45d00",
    },
    secondary: {
      border: "border-black/15 dark:border-white/15 hover:border-[#15616d]/50 dark:hover:border-[#15616d]/70",
      bg: "bg-black/[0.03] dark:bg-white/[0.04]",
      text: "text-[var(--text-color)]",
      hoverText: "text-white",
      shadow: "shadow-sm hover:shadow-md hover:shadow-[#15616d]/15",
      front: "#15616d",
      back: "#0e434c",
    },
    accent: {
      border: "border-brand-orange/30 hover:border-brand-orange",
      bg: "bg-black/[0.02] dark:bg-white/[0.02]",
      text: "text-[var(--text-color)]",
      hoverText: "text-white",
      shadow: "shadow-sm",
      front: "#ff7d00",
      back: "#e06c00",
    },
  }[variant];

  const fillFront = liquidColor || colors.front;
  const fillBack = liquidColorBack || colors.back;

  // Wave physics state
  const NUM_POINTS = 8;
  const waveState = useRef({
    levelY: 115, // 115 = submerged below view, -15 = completely flooded
    targetLevelY: 115,
    phase: 0,
    amplitude: 0,
    tilt: 0,
    mousePerturbation: Array(NUM_POINTS).fill(0),
  });

  // Calculate SVG curve from wave points
  const generatePath = useCallback(
    (level: number, phase: number, amp: number, tilt: number, isBack = false) => {
      const points: { x: number; y: number }[] = [];
      const phaseOffset = isBack ? 1.6 : 0;
      const freq = isBack ? 0.95 : 1.15;
      const effectiveAmp = isBack ? amp * 1.25 : amp;

      for (let i = 0; i < NUM_POINTS; i++) {
        const norm = i / (NUM_POINTS - 1);
        const x = norm * 100;
        // Directional tilt: linearly sloping across the width
        const tiltOffset = (norm - 0.5) * tilt;
        // Sine wave modulation
        const waveSin = Math.sin(phase * freq + norm * Math.PI * 2.4 + phaseOffset);
        // Cursor perturbation dip
        const perturb = waveState.current.mousePerturbation[i] || 0;
        const y = level + tiltOffset + waveSin * effectiveAmp + perturb;
        points.push({ x, y });
      }

      // Smooth path using quadratic bezier midpoints
      let d = `M 0 100 L ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        d += ` Q ${p1.x} ${p1.y}, ${mx} ${my}`;
      }
      const last = points[points.length - 1];
      d += ` Q ${points[points.length - 2].x} ${points[points.length - 2].y}, ${last.x} ${last.y}`;
      d += ` L 100 100 Z`;

      return d;
    },
    [NUM_POINTS]
  );

  // Animation frame loop for liquid simulation
  const updateWaves = useCallback(() => {
    const s = waveState.current;

    // Advance wave phase naturally
    s.phase += 0.055;

    // Dampen mouse perturbations toward 0
    for (let i = 0; i < NUM_POINTS; i++) {
      s.mousePerturbation[i] *= 0.88;
    }

    // Render path to SVG
    if (frontWaveRef.current) {
      frontWaveRef.current.setAttribute(
        "d",
        generatePath(s.levelY, s.phase, s.amplitude, s.tilt, false)
      );
    }
    if (backWaveRef.current) {
      backWaveRef.current.setAttribute(
        "d",
        generatePath(s.levelY + 3, s.phase, s.amplitude, s.tilt * 0.7, true)
      );
    }

    // Continue loop if animating or hovered
    if (isAnimatingRef.current || isHoveredRef.current || s.levelY < 114) {
      requestAnimationFrame(updateWaves);
    } else {
      isAnimatingRef.current = false;
    }
  }, [generatePath, NUM_POINTS]);

  const startAnimationLoop = useCallback(() => {
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      requestAnimationFrame(updateWaves);
    }
  }, [updateWaves]);

  // Initial draw
  useEffect(() => {
    if (frontWaveRef.current && backWaveRef.current) {
      const initialD = `M 0 100 L 0 115 L 100 115 L 100 100 Z`;
      frontWaveRef.current.setAttribute("d", initialD);
      backWaveRef.current.setAttribute("d", initialD);
    }
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    isHoveredRef.current = true;
    startAnimationLoop();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      waveState.current.levelY = -15;
      waveState.current.amplitude = 0;
      if (textTrackRef.current) {
        gsap.set(textTrackRef.current, { yPercent: -50 });
      }
      return;
    }

    // Detect direction of entry (Left to Right vs Right to Left)
    const rect = e.currentTarget.getBoundingClientRect();
    const entryFromLeft = e.clientX - rect.left < rect.width / 2;
    const initialTilt = entryFromLeft ? -14 : 14;

    const s = waveState.current;
    gsap.killTweensOf(s);

    // Liquid swell up
    gsap.to(s, {
      levelY: -15,
      amplitude: 14,
      duration: 0.7,
      ease: "power2.out",
      onComplete: () => {
        // Natural continuous gentle ripple when filled
        gsap.to(s, {
          amplitude: 4.5,
          duration: 0.8,
          ease: "sine.inOut",
        });
      },
    });

    // Tilt settles back to level
    s.tilt = initialTilt;
    gsap.to(s, {
      tilt: 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.4)",
    });

    // Organic button squash & stretch
    gsap.fromTo(
      buttonRef.current,
      { scaleX: 0.98, scaleY: 1.02 },
      {
        scaleX: 1,
        scaleY: 1,
        duration: 0.65,
        ease: "elastic.out(1.2, 0.4)",
      }
    );

    // Utopia Agriculture dual-layer text roll
    if (textTrackRef.current) {
      gsap.to(textTrackRef.current, {
        yPercent: -50,
        duration: 0.45,
        ease: "power3.out",
      });
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    startAnimationLoop();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      waveState.current.levelY = 115;
      waveState.current.amplitude = 0;
      if (textTrackRef.current) {
        gsap.set(textTrackRef.current, { yPercent: 0 });
      }
      return;
    }

    const s = waveState.current;
    gsap.killTweensOf(s);

    // Liquid drainage with fluid dampening
    gsap.to(s, {
      levelY: 115,
      amplitude: 12,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        s.amplitude = 0;
      },
    });

    // Roll text back down
    if (textTrackRef.current) {
      gsap.to(textTrackRef.current, {
        yPercent: 0,
        duration: 0.4,
        ease: "power2.inOut",
      });
    }

    // Reset button scale
    gsap.to(buttonRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power1.out",
    });
  };

  // George Francis cursor perturbation: create subtle wave indentation near cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isHoveredRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseNormX = (e.clientX - rect.left) / rect.width;

    const s = waveState.current;
    for (let i = 0; i < NUM_POINTS; i++) {
      const pointNormX = i / (NUM_POINTS - 1);
      const dist = Math.abs(pointNormX - mouseNormX);
      if (dist < 0.28) {
        // Gaussian bump displacement
        const intensity = Math.exp(-(dist * dist) / (2 * 0.12 * 0.12));
        s.mousePerturbation[i] = -intensity * 6;
      }
    }
  };

  return (
    <a
      ref={buttonRef}
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`group relative inline-flex items-center justify-center rounded-xl border ${colors.border} ${colors.bg} ${colors.shadow} overflow-hidden cursor-pointer select-none transition-all duration-300 active:scale-95 px-5 py-2.5 ${className}`}
      {...props}
    >
      {/* Liquid Wave Background Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-xl">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Deep back wave */}
          <path
            ref={backWaveRef}
            fill={fillBack}
            opacity="0.42"
            className="transition-opacity duration-300"
          />
          {/* Main front liquid wave */}
          <path
            ref={frontWaveRef}
            fill={fillFront}
            className="transition-opacity duration-300"
          />
        </svg>

        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-60 group-hover:opacity-30 transition-opacity" />
      </div>

      {/* Utopia Agriculture dual-layer vertical rolling text track */}
      <div className="relative z-10 overflow-hidden h-[24px] pointer-events-none">
        <div
          ref={textTrackRef}
          className="flex flex-col transform-gpu will-change-transform"
        >
          {/* Default State Item */}
          <div
            className={`h-[24px] flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap leading-none ${colors.text}`}
          >
            {iconPosition === "left" && icon && (
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5">
                {icon}
              </span>
            )}
            <span>{children}</span>
            {iconPosition === "right" && icon && (
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5">
                {icon}
              </span>
            )}
          </div>

          {/* Hover State Item (Flooded with liquid) */}
          <div
            className={`h-[24px] flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap leading-none ${colors.hoverText}`}
          >
            {iconPosition === "left" && icon && (
              <span className="flex-shrink-0 drop-shadow-sm">
                {icon}
              </span>
            )}
            <span className="drop-shadow-sm">{children}</span>
            {iconPosition === "right" && icon && (
              <span className="flex-shrink-0 drop-shadow-sm">
                {icon}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
