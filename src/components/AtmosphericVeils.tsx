import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";

gsap.registerPlugin(useGSAP);

interface AtmosphericVeilsProps {
  className?: string;
}

export default function AtmosphericVeils({ className = "" }: AtmosphericVeilsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) return;

      // ---------------------------------------------------------------
      // 1. ANTHROPOMORPHIC SMOKY VEILS & SILK DRAPES (From Image 1 & 2)
      // ---------------------------------------------------------------
      // Veil 1 (Upper right flowing drape)
      gsap.to(".veil-1", {
        x: "random(-35, 35)",
        y: "random(-25, 25)",
        rotation: "random(-4, 4)",
        scale: "random(0.96, 1.05)",
        opacity: isDark ? "random(0.12, 0.22)" : "random(0.08, 0.16)",
        transformOrigin: "center center",
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Veil 2 (Left smoky wisp)
      gsap.to(".veil-2", {
        x: "random(-30, 30)",
        y: "random(-35, 20)",
        rotation: "random(-6, 6)",
        scale: "random(0.95, 1.06)",
        opacity: isDark ? "random(0.1, 0.2)" : "random(0.06, 0.14)",
        transformOrigin: "center center",
        duration: 11,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.5,
      });

      // Veil 3 (Lower ambient auroral ribbon)
      gsap.to(".veil-3", {
        x: "random(-40, 40)",
        y: "random(-20, 20)",
        scaleY: "random(0.9, 1.1)",
        opacity: isDark ? "random(0.08, 0.18)" : "random(0.05, 0.12)",
        transformOrigin: "center center",
        duration: 13,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 3,
      });

      // ---------------------------------------------------------------
      // 2. SELF-DRAWING BUBBLE-FORMING SPIRALS (From Image 2)
      // ---------------------------------------------------------------
      const animateSpiral = (
        selector: string,
        glowSelector: string,
        initialDelay: number
      ) => {
        const spiralEl = containerRef.current?.querySelector(
          selector
        ) as SVGPathElement | null;
        if (!spiralEl) return;

        const pathLength = spiralEl.getTotalLength ? spiralEl.getTotalLength() : 800;

        const runSpiralCycle = () => {
          gsap.set(spiralEl, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
            opacity: 0,
            x: 0,
            y: 0,
          });
          gsap.set(glowSelector, { scale: 0, opacity: 0, x: 0, y: 0 });

          const tl = gsap.timeline({
            onComplete: () => {
              gsap.delayedCall(gsap.utils.random(3.5, 7.5), runSpiralCycle);
            },
          });

          tl
            // Draw the spiral path into existence, coiling into a bubble
            .to(spiralEl, {
              opacity: isDark ? 0.7 : 0.5,
              duration: 0.6,
              ease: "power1.in",
            })
            .to(
              spiralEl,
              {
                strokeDashoffset: 0,
                duration: gsap.utils.random(3.2, 4.2),
                ease: "power2.inOut",
              },
              "<"
            )
            // As it finishes coiling into a bubble, flash a gentle center aura
            .to(
              glowSelector,
              {
                scale: 1,
                opacity: isDark ? 0.38 : 0.22,
                duration: 1.2,
                ease: "back.out(1.5)",
              },
              "-=1.2"
            )
            // Gentle floating drift
            .to(spiralEl, {
              y: "-=22",
              x: "+=12",
              duration: 2.2,
              ease: "sine.inOut",
            })
            .to(
              glowSelector,
              {
                y: "-=22",
                x: "+=12",
                duration: 2.2,
                ease: "sine.inOut",
              },
              "<"
            )
            // Undraw / evaporate gracefully
            .to(spiralEl, {
              strokeDashoffset: -pathLength,
              opacity: 0,
              duration: 2.4,
              ease: "power2.in",
            })
            .to(
              glowSelector,
              {
                scale: 1.4,
                opacity: 0,
                duration: 1.5,
                ease: "power1.out",
              },
              "<"
            );
        };

        gsap.delayedCall(initialDelay, runSpiralCycle);
      };

      animateSpiral(".bubble-spiral-1", ".spiral-glow-1", 0.5);
      animateSpiral(".bubble-spiral-2", ".spiral-glow-2", 4.2);

      // Light filament streak (from top right of Image 2)
      const filamentEl = containerRef.current?.querySelector(
        ".light-filament"
      ) as SVGPathElement | null;
      if (filamentEl) {
        const filamentLen = filamentEl.getTotalLength ? filamentEl.getTotalLength() : 200;

        const runFilamentCycle = () => {
          gsap.set(filamentEl, {
            strokeDasharray: filamentLen,
            strokeDashoffset: filamentLen,
            opacity: 0,
            x: 0,
            y: 0,
          });

          const tl = gsap.timeline({
            onComplete: () => {
              gsap.delayedCall(gsap.utils.random(4, 8), runFilamentCycle);
            },
          });

          tl.to(filamentEl, {
            opacity: 0.85,
            duration: 0.4,
            ease: "power1.in",
          })
            .to(
              filamentEl,
              {
                strokeDashoffset: 0,
                duration: 2.2,
                ease: "power2.out",
              },
              "<"
            )
            .to(filamentEl, {
              y: "-=25",
              x: "+=12",
              opacity: 0,
              duration: 1.8,
              ease: "power1.inOut",
            });
        };

        gsap.delayedCall(2, runFilamentCycle);
      }

      // ---------------------------------------------------------------
      // 3. RANDOMLY POPPING SVG BUBBLES AT RANDOM CALM PACE (GSAP)
      // ---------------------------------------------------------------
      const bubbleEls = containerRef.current?.querySelectorAll(".gsap-pop-bubble");

      if (bubbleEls && bubbleEls.length > 0) {
        bubbleEls.forEach((bubbleEl, index) => {
          const mainCircle = bubbleEl.querySelector(".bubble-main");
          const popWave = bubbleEl.querySelector(".bubble-pop-wave");
          const specular = bubbleEl.querySelector(".bubble-specular");

          const runBubbleLifecycle = () => {
            // Calm target coordinates across the screen (in SVG 1440x900 space)
            const targetX = gsap.utils.random(100, 1340);
            const targetY = gsap.utils.random(180, 750);
            const targetScale = gsap.utils.random(0.55, 1.15);
            const maxAlpha = isDark
              ? gsap.utils.random(0.28, 0.58)
              : gsap.utils.random(0.2, 0.42);
            // Reduced motion: subtle, serene float distance
            const floatDistanceY = gsap.utils.random(18, 38);
            const floatDistanceX = gsap.utils.random(-12, 12);
            const lifetime = gsap.utils.random(6.5, 11.0);

            // Reset bubble position and scale
            gsap.set(bubbleEl, {
              x: targetX,
              y: targetY,
              scale: 0,
              opacity: 0,
              transformOrigin: "center center",
            });
            if (popWave) {
              gsap.set(popWave, { scale: 1, opacity: 0 });
            }
            if (mainCircle) {
              gsap.set(mainCircle, { scaleX: 1, scaleY: 1 });
            }

            const bubbleTl = gsap.timeline({
              onComplete: () => {
                // Schedule next pop with longer calm interval
                const nextDelay = gsap.utils.random(2.5, 6.5);
                gsap.delayedCall(nextDelay, runBubbleLifecycle);
              },
            });

            // 1: GENTLE, CALM POP IN
            bubbleTl
              .to(bubbleEl, {
                scale: targetScale,
                opacity: maxAlpha,
                duration: gsap.utils.random(0.9, 1.3),
                ease: "back.out(1.4)",
              })
              // 2: SLOW BUOYANT FLOAT WITH REDUCED MOTION
              .to(
                bubbleEl,
                {
                  y: targetY - floatDistanceY,
                  x: targetX + floatDistanceX,
                  duration: lifetime,
                  ease: "power1.out",
                },
                "-=0.4"
              );

            // Very subtle organic breathing instead of heavy wobble
            if (mainCircle) {
              bubbleTl.to(
                mainCircle,
                {
                  scaleX: 1.025,
                  scaleY: 0.975,
                  duration: 2.6,
                  repeat: Math.floor(lifetime / 2.6),
                  yoyo: true,
                  ease: "sine.inOut",
                },
                0.3
              );
            }

            // Specular reflection shimmer
            if (specular) {
              bubbleTl.to(
                specular,
                {
                  opacity: 0.9,
                  duration: 1.4,
                  repeat: 1,
                  yoyo: true,
                  ease: "sine.inOut",
                },
                0.8
              );
            }

            // 3: GENTLE POP DISSOLVE AT END OF LIFETIME
            bubbleTl.addLabel("burst", `-=${gsap.utils.random(0.4, 0.7)}`);

            if (popWave) {
              bubbleTl
                .fromTo(
                  popWave,
                  { scale: 1, opacity: isDark ? 0.6 : 0.4 },
                  {
                    scale: 1.8,
                    opacity: 0,
                    duration: 0.35,
                    ease: "power1.out",
                  },
                  "burst"
                );
            }

            bubbleTl.to(
              bubbleEl,
              {
                scale: targetScale * 1.15,
                opacity: 0,
                duration: 0.25,
                ease: "power2.out",
              },
              "burst"
            );
          };

          // Staggered initial starts with wider spacing
          const initialDelay = index * 1.4 + gsap.utils.random(0.5, 2.5);
          gsap.delayedCall(initialDelay, runBubbleLifecycle);
        });
      }
    },
    { scope: containerRef, dependencies: [isDark] }
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden ${className || "absolute inset-0 z-0"}`}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gaussian blur filters for ethereal smoky veils */}
          <filter id="veil-blur-lg" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
          <filter id="veil-blur-md" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="veil-blur-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>

          {/* Gradients matching the rich olive, sand & terracotta palette */}
          <radialGradient
            id="veil-grad-1"
            cx="65%"
            cy="40%"
            r="60%"
            fx="65%"
            fy="40%"
          >
            <stop
              offset="0%"
              stopColor={isDark ? "#dda15e" : "#bc6c25"}
              stopOpacity={isDark ? "0.22" : "0.15"}
            />
            <stop
              offset="45%"
              stopColor={isDark ? "#606c38" : "#96a666"}
              stopOpacity={isDark ? "0.14" : "0.08"}
            />
            <stop
              offset="85%"
              stopColor={isDark ? "#283618" : "#dda15e"}
              stopOpacity={isDark ? "0.04" : "0.02"}
            />
            <stop offset="100%" stopColor="#283618" stopOpacity="0" />
          </radialGradient>

          <radialGradient
            id="veil-grad-2"
            cx="40%"
            cy="45%"
            r="55%"
            fx="40%"
            fy="45%"
          >
            <stop
              offset="0%"
              stopColor={isDark ? "#96a666" : "#606c38"}
              stopOpacity={isDark ? "0.2" : "0.14"}
            />
            <stop
              offset="50%"
              stopColor={isDark ? "#bc6c25" : "#dda15e"}
              stopOpacity={isDark ? "0.12" : "0.06"}
            />
            <stop offset="100%" stopColor="#606c38" stopOpacity="0" />
          </radialGradient>

          <linearGradient
            id="veil-grad-3"
            x1="20%"
            y1="80%"
            x2="90%"
            y2="30%"
          >
            <stop
              offset="0%"
              stopColor={isDark ? "#606c38" : "#bc6c25"}
              stopOpacity={isDark ? "0.16" : "0.1"}
            />
            <stop
              offset="50%"
              stopColor={isDark ? "#dda15e" : "#dda15e"}
              stopOpacity={isDark ? "0.1" : "0.05"}
            />
            <stop
              offset="100%"
              stopColor={isDark ? "#283618" : "#606c38"}
              stopOpacity="0"
            />
          </linearGradient>

          {/* Spiral Stroke Gradients */}
          <linearGradient
            id="spiral-stroke-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={isDark ? "#fefae0" : "#bc6c25"} stopOpacity="0.85" />
            <stop offset="50%" stopColor={isDark ? "#dda15e" : "#606c38"} stopOpacity="0.75" />
            <stop offset="100%" stopColor={isDark ? "#bc6c25" : "#dda15e"} stopOpacity="0.4" />
          </linearGradient>

          {/* Filament Light Streak Gradient */}
          <linearGradient
            id="filament-grad"
            x1="0%"
            y1="0%"
            x2="50%"
            y2="100%"
          >
            <stop offset="0%" stopColor={isDark ? "#fefae0" : "#bc6c25"} stopOpacity="0.95" />
            <stop offset="60%" stopColor={isDark ? "#dda15e" : "#dda15e"} stopOpacity="0.7" />
            <stop offset="100%" stopColor={isDark ? "#dda15e" : "#606c38"} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for bubble rings and spirals */}
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* 1. LAYER: ETHEREAL SMOKY VEILS & SILK DRAPES (From Image 1 & 2) */}
        {/* ------------------------------------------------------------- */}
        <g className="veils-layer">
          {/* Top-Right Billowing Silk Drape */}
          <path
            className="veil-1"
            d="M 880 -60 C 1140 60, 1340 240, 1220 500 C 1110 730, 890 660, 770 520 C 660 390, 680 160, 880 -60 Z"
            fill="url(#veil-grad-1)"
            filter="url(#veil-blur-lg)"
          />

          {/* Left Flowing Smoky Wisp */}
          <path
            className="veil-2"
            d="M -60 220 C 200 120, 360 300, 310 520 C 260 720, 90 770, -30 630 C -140 480, -170 330, -60 220 Z"
            fill="url(#veil-grad-2)"
            filter="url(#veil-blur-lg)"
          />

          {/* Center-Bottom Auroral Filament Ribbon */}
          <path
            className="veil-3"
            d="M 280 880 C 440 670, 620 700, 780 540 C 940 370, 1100 430, 1260 280 C 1140 470, 980 610, 820 740 C 660 860, 480 910, 280 880 Z"
            fill="url(#veil-grad-3)"
            filter="url(#veil-blur-md)"
          />
        </g>

        {/* ------------------------------------------------------------- */}
        {/* 2. LAYER: SELF-DRAWING SPIRALS FORMING BUBBLES (From Image 2)  */}
        {/* ------------------------------------------------------------- */}
        <g className="spirals-layer">
          {/* Spiral 1 (Upper-right ambient pocket, as highlighted in user's Image 2) */}
          <g transform="translate(940, 110) scale(0.8)">
            {/* Center glow aura when bubble completes */}
            <circle
              className="spiral-glow-1"
              cx="110"
              cy="140"
              r="70"
              fill={isDark ? "rgba(221, 161, 94, 0.12)" : "rgba(188, 108, 37, 0.08)"}
              filter="url(#veil-blur-sm)"
            />
            {/* Organic spiral path that coils inwards into a bubble circle */}
            <path
              className="bubble-spiral-1"
              d="M 220 20 C 290 50, 310 140, 270 210 C 220 290, 110 300, 40 240 C -30 170, -10 70, 60 20 C 120 -20, 210 0, 240 70 C 270 140, 230 220, 160 240 C 100 250, 50 200, 60 140 C 70 90, 130 70, 170 100 C 200 130, 190 180, 150 190 C 120 200, 90 170, 100 140"
              fill="none"
              stroke="url(#spiral-stroke-grad)"
              strokeWidth="1.3"
              strokeLinecap="round"
              filter="url(#glow-filter)"
            />
          </g>

          {/* Spiral 2 (Left ambient sky pocket) */}
          <g transform="translate(140, 160) scale(0.72)">
            <circle
              className="spiral-glow-2"
              cx="120"
              cy="120"
              r="60"
              fill={isDark ? "rgba(150, 166, 102, 0.12)" : "rgba(96, 108, 56, 0.07)"}
              filter="url(#veil-blur-sm)"
            />
            <path
              className="bubble-spiral-2"
              d="M 10 240 C -20 170, 10 90, 70 40 C 140 -10, 230 10, 270 80 C 310 150, 280 240, 210 280 C 130 310, 50 260, 30 180 C 20 110, 80 50, 150 50 C 210 50, 250 110, 230 170 C 210 220, 150 230, 110 190 C 80 150, 100 100, 140 100"
              fill="none"
              stroke="url(#spiral-stroke-grad)"
              strokeWidth="1.2"
              strokeLinecap="round"
              filter="url(#glow-filter)"
            />
          </g>

          {/* Light filament brush streak (top right from Image 2) */}
          <path
            className="light-filament"
            d="M 1240 80 C 1255 120, 1258 165, 1248 205 C 1242 230, 1230 255, 1222 280"
            fill="none"
            stroke="url(#filament-grad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            filter="url(#glow-filter)"
          />
        </g>

        {/* ------------------------------------------------------------- */}
        {/* 3. LAYER: RANDOMLY POPPING SVG BUBBLES WITH GSAP (REDUCED COUNT) */}
        {/* ------------------------------------------------------------- */}
        <g className="popping-bubbles-layer">
          {Array.from({ length: 5 }).map((_, i) => {
            const radii = [16, 24, 20, 30, 22];
            const radius = radii[i % radii.length];
            const strokeColor =
              i % 3 === 0
                ? isDark
                  ? "#dda15e"
                  : "#bc6c25"
                : i % 3 === 1
                ? isDark
                  ? "#fefae0"
                  : "#606c38"
                : isDark
                ? "#bc6c25"
                : "#dda15e";

            return (
              <g
                key={i}
                className="gsap-pop-bubble"
                style={{ opacity: 0 }}
              >
                {/* Expanding burst wave when bubble pops */}
                <circle
                  className="bubble-pop-wave"
                  cx="0"
                  cy="0"
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth="1.2"
                  fill="none"
                  opacity="0"
                />

                {/* Main bubble sphere */}
                <g className="bubble-main">
                  {/* Subtle inner glassy wash */}
                  <circle
                    cx="0"
                    cy="0"
                    r={radius}
                    fill={strokeColor}
                    fillOpacity={isDark ? "0.05" : "0.03"}
                  />

                  {/* Bubble rim with glowing outline */}
                  <circle
                    cx="0"
                    cy="0"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="1.3"
                    fill="none"
                    filter="url(#glow-filter)"
                  />

                  {/* Specular highlight crescent (authentic light reflection) */}
                  <path
                    className="bubble-specular"
                    d={`M ${-radius * 0.7} ${-radius * 0.3} A ${radius} ${radius} 0 0 1 ${radius * 0.3} ${-radius * 0.7}`}
                    stroke={isDark ? "#ffffff" : strokeColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeOpacity={isDark ? "0.65" : "0.45"}
                    fill="none"
                  />

                  {/* Tiny pin-point shine */}
                  <circle
                    cx={-radius * 0.42}
                    cy={-radius * 0.42}
                    r="1.8"
                    fill={isDark ? "#ffffff" : strokeColor}
                    fillOpacity={isDark ? "0.8" : "0.6"}
                  />
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
