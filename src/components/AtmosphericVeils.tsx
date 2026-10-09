import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/cn";

gsap.registerPlugin(useGSAP);

interface AtmosphericVeilsProps {
  className?: string;
}

// =====================================================================
// MATHEMATICAL PROCEDURAL SVG GENERATORS
// Converts random parameters into ultra-smooth cubic bezier SVG paths
// =====================================================================

// Smooth spline converter: turns any array of 2D points into a continuous C1 cubic bezier SVG path
function pointsToSmoothPath(points: { x: number; y: number }[], closed = false): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  const pts = [...points];
  if (closed) {
    pts.push(pts[0], pts[1], pts[2]);
  }

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  const maxI = closed ? points.length : pts.length - 1;

  for (let i = 0; i < maxI; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1] || pts[i];
    const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

// 1. Procedural Organic Spiral (dynamic center, radius, tightness, wobble)
function generateRandomSpiral(bounds: { minX: number; maxX: number; minY: number; maxY: number }): string {
  const cx = gsap.utils.random(bounds.minX, bounds.maxX);
  const cy = gsap.utils.random(bounds.minY, bounds.maxY);
  const maxR = gsap.utils.random(75, 180);
  const turns = gsap.utils.random(1.6, 3.1);
  const clockwise = Math.random() > 0.5;
  const startAngle = Math.random() * Math.PI * 2;
  const totalAngle = turns * Math.PI * 2 * (clockwise ? 1 : -1);
  const steps = Math.floor(turns * 14);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = Math.pow(t, 1.15) * maxR;
    const angle = startAngle + t * totalAngle;
    const wobble = Math.sin(t * Math.PI * 3.5) * (maxR * 0.05);
    const x = cx + (r + wobble) * Math.cos(angle);
    const y = cy + (r + wobble) * Math.sin(angle);
    points.push({ x, y });
  }

  return pointsToSmoothPath(points);
}

// 2. Procedural Fluid Curving Ribbon (smooth serpentine wave across region)
function generateRandomRibbon(bounds: { minX: number; maxX: number; minY: number; maxY: number }): string {
  const pointsCount = Math.floor(gsap.utils.random(4, 7));
  const points: { x: number; y: number }[] = [];
  const startLeft = Math.random() > 0.5;
  let currX = startLeft ? bounds.minX : bounds.maxX;
  let currY = gsap.utils.random(bounds.minY, bounds.maxY);
  const stepX = ((bounds.maxX - bounds.minX) / (pointsCount - 1)) * (startLeft ? 1 : -1);

  points.push({ x: currX, y: currY });

  for (let i = 1; i < pointsCount; i++) {
    currX += stepX * gsap.utils.random(0.8, 1.25);
    currY += gsap.utils.random(-130, 130);
    currY = Math.max(bounds.minY - 60, Math.min(bounds.maxY + 60, currY));
    points.push({ x: currX, y: currY });
  }

  return pointsToSmoothPath(points);
}

// 3. Procedural Orbital Loop / Ellipse / Figure-8
function generateRandomLoop(bounds: { minX: number; maxX: number; minY: number; maxY: number }): string {
  const cx = gsap.utils.random(bounds.minX, bounds.maxX);
  const cy = gsap.utils.random(bounds.minY, bounds.maxY);
  const rx = gsap.utils.random(80, 190);
  const ry = gsap.utils.random(45, 120);
  const tilt = gsap.utils.random(-Math.PI * 0.45, Math.PI * 0.45);
  const isFigure8 = Math.random() > 0.55;
  const steps = isFigure8 ? 24 : 16;
  const points: { x: number; y: number }[] = [];

  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    let localX: number;
    let localY: number;

    if (isFigure8) {
      localX = rx * Math.sin(t);
      localY = ry * Math.sin(t) * Math.cos(t);
    } else {
      localX = rx * Math.cos(t);
      localY = ry * Math.sin(t);
    }

    const x = cx + localX * cosT - localY * sinT;
    const y = cy + localX * sinT + localY * cosT;
    points.push({ x, y });
  }

  return pointsToSmoothPath(points, true);
}

// 4. Procedural Shooting Filament Streak (sweeping light trail)
function generateRandomFilament(bounds: { minX: number; maxX: number; minY: number; maxY: number }): string {
  const startX = gsap.utils.random(bounds.minX, bounds.maxX);
  const startY = gsap.utils.random(bounds.minY, bounds.maxY);
  const length = gsap.utils.random(150, 340);
  const angle = gsap.utils.random(0, Math.PI * 2);
  const curve = gsap.utils.random(-90, 90);

  const midDist = length * 0.5;
  const perp = angle + Math.PI / 2;
  const midX = startX + Math.cos(angle) * midDist + Math.cos(perp) * curve;
  const midY = startY + Math.sin(angle) * midDist + Math.sin(perp) * curve;
  const endX = startX + Math.cos(angle) * length;
  const endY = startY + Math.sin(angle) * length;

  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

// 5. Procedural Branching Smoke Tendril
function generateRandomTendril(bounds: { minX: number; maxX: number; minY: number; maxY: number }): string {
  const startX = gsap.utils.random(bounds.minX, bounds.maxX);
  const startY = gsap.utils.random(bounds.minY, bounds.maxY);
  const mainAngle = gsap.utils.random(0, Math.PI * 2);
  const length = gsap.utils.random(130, 220);

  const p1 = {
    x: startX + Math.cos(mainAngle + 0.3) * (length * 0.4),
    y: startY + Math.sin(mainAngle + 0.3) * (length * 0.4),
  };
  const p2 = {
    x: startX + Math.cos(mainAngle - 0.25) * (length * 0.75),
    y: startY + Math.sin(mainAngle - 0.25) * (length * 0.75),
  };
  const end = {
    x: startX + Math.cos(mainAngle) * length,
    y: startY + Math.sin(mainAngle) * length,
  };

  let d = pointsToSmoothPath([{ x: startX, y: startY }, p1, p2, end]);

  // Branch shoot
  const branchAngle = mainAngle + gsap.utils.random(0.5, 0.9) * (Math.random() > 0.5 ? 1 : -1);
  const branchLen = length * gsap.utils.random(0.35, 0.5);
  const bEnd = {
    x: p1.x + Math.cos(branchAngle) * branchLen,
    y: p1.y + Math.sin(branchAngle) * branchLen,
  };
  d += ` M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${(p1.x + bEnd.x) / 2 + gsap.utils.random(-12, 12)} ${(p1.y + bEnd.y) / 2 + gsap.utils.random(-12, 12)}, ${bEnd.x.toFixed(1)} ${bEnd.y.toFixed(1)}`;

  return d;
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

      // ===============================================================
      // PROCEDURAL GENERATIVE ENGINE: CREATING & DESTROYING
      // Constantly generates BRAND NEW RANDOM PATTERNS on every cycle!
      // ===============================================================
      const strokeGradients = [
        "url(#stroke-gold-sand)",
        "url(#stroke-terracotta-moss)",
        "url(#filament-glow-grad)",
        "url(#stroke-olive-celestial)",
        "url(#stroke-cream-amber)",
      ];

      // Screen regions to ensure dynamic distribution around hero content
      const regions = [
        // Slot 0: Top Right Sky & Atmosphere
        { minX: 820, maxX: 1360, minY: 70, maxY: 420 },
        // Slot 1: Top Left Sky & Atmosphere
        { minX: 80, maxX: 620, minY: 70, maxY: 420 },
        // Slot 2: Mid-Right Corridor
        { minX: 850, maxX: 1380, minY: 320, maxY: 660 },
        // Slot 3: Mid-Left Corridor
        { minX: 60, maxX: 580, minY: 320, maxY: 660 },
        // Slot 4: Bottom / Horizon Sweeps
        { minX: 120, maxX: 1320, minY: 580, maxY: 820 },
        // Slot 5: Roaming Celestial Stream
        { minX: 100, maxX: 1340, minY: 100, maxY: 780 },
      ];

      // Generator picker: randomly picks a generator function
      const patternGenerators = [
        generateRandomSpiral,
        generateRandomRibbon,
        generateRandomLoop,
        generateRandomFilament,
        generateRandomTendril,
      ];

      const generateRandomPattern = (slotIndex: number) => {
        const bounds = regions[slotIndex % regions.length];
        // Pick a random pattern generator
        const genFunc =
          patternGenerators[Math.floor(Math.random() * patternGenerators.length)];
        const d = genFunc(bounds);
        const stroke =
          strokeGradients[Math.floor(Math.random() * strokeGradients.length)];
        const strokeWidth = gsap.utils.random(1.0, 1.6);
        return { d, stroke, strokeWidth };
      };

      const pathElements = containerRef.current?.querySelectorAll<SVGPathElement>(
        ".generative-svg-path"
      );

      if (pathElements && pathElements.length > 0) {
        pathElements.forEach((pathEl, slotIndex) => {
          const runGenerativeCycle = () => {
            // 1. GENERATE A BRAND NEW RANDOM PATTERN (Completely new shape every time!)
            const { d, stroke, strokeWidth } = generateRandomPattern(slotIndex);
            pathEl.setAttribute("d", d);
            pathEl.setAttribute("stroke", stroke);
            pathEl.setAttribute("stroke-width", strokeWidth.toFixed(2));

            let pathLength = 600;
            try {
              pathLength = pathEl.getTotalLength ? pathEl.getTotalLength() : 600;
            } catch {
              pathLength = 600;
            }

            // Reset path state: uncreated
            gsap.set(pathEl, {
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
              opacity: 0,
              x: 0,
              y: 0,
            });

            const drawDuration = gsap.utils.random(2.8, 4.4);
            const holdDuration = gsap.utils.random(1.8, 3.2);
            const undrawDuration = gsap.utils.random(2.0, 3.4);
            const maxOpacity = isDark
              ? gsap.utils.random(0.45, 0.72)
              : gsap.utils.random(0.3, 0.52);

            const tl = gsap.timeline({
              onComplete: () => {
                // Once destroyed, schedule the NEXT RANDOM PATTERN at a randomized pace
                const nextDelay = gsap.utils.random(1.8, 5.2);
                gsap.delayedCall(nextDelay, runGenerativeCycle);
              },
            });

            // PHASE 1: CREATION (Stroke draws itself into existence)
            tl.to(pathEl, {
              opacity: maxOpacity,
              duration: 0.5,
              ease: "power1.in",
            })
              .to(
                pathEl,
                {
                  strokeDashoffset: 0,
                  duration: drawDuration,
                  ease: "power2.inOut",
                },
                "<"
              )
              // PHASE 2: LIVING (Gentle organic drift & breathe)
              .to(pathEl, {
                y: gsap.utils.random(-22, 12),
                x: gsap.utils.random(-15, 15),
                duration: holdDuration,
                ease: "sine.inOut",
              })
              // PHASE 3: DESTRUCTION (Stroke unwrites itself / evaporates into light)
              .to(pathEl, {
                strokeDashoffset: -pathLength,
                opacity: 0,
                duration: undrawDuration,
                ease: "power2.in",
              });
          };

          // Staggered initial starts so patterns appear organically across the page
          const initialDelay = slotIndex * 1.3 + gsap.utils.random(0.4, 2.0);
          gsap.delayedCall(initialDelay, runGenerativeCycle);
        });
      }
    },
    { scope: containerRef, dependencies: [isDark] }
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none select-none overflow-hidden", className || "absolute inset-0 z-0")}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft glow filter for vector strokes */}
          <filter id="stroke-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Golden Warm Sand Stroke Gradient */}
          <linearGradient id="stroke-gold-sand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "var(--color-cream)" : "var(--color-terracotta)"} stopOpacity="0.9" />
            <stop offset="50%" stopColor={isDark ? "var(--color-sand)" : "var(--color-moss)"} stopOpacity="0.75" />
            <stop offset="100%" stopColor={isDark ? "var(--color-terracotta)" : "var(--color-sand)"} stopOpacity="0.4" />
          </linearGradient>

          {/* Terracotta Moss Stroke Gradient */}
          <linearGradient id="stroke-terracotta-moss" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? "var(--color-terracotta)" : "var(--color-moss)"} stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--color-sand)" stopOpacity="0.7" />
            <stop offset="100%" stopColor={isDark ? "var(--color-moss)" : "var(--color-terracotta)"} stopOpacity="0.4" />
          </linearGradient>

          {/* Bright Radiant Light Streak Gradient */}
          <linearGradient id="filament-glow-grad" x1="0%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "var(--color-cream)" : "var(--color-terracotta)"} stopOpacity="0.95" />
            <stop offset="50%" stopColor={isDark ? "var(--color-cream)" : "var(--color-sand)"} stopOpacity="0.85" />
            <stop offset="100%" stopColor={isDark ? "var(--color-sand)" : "var(--color-moss)"} stopOpacity="0" />
          </linearGradient>

          {/* Olive Emerald Celestial Gradient */}
          <linearGradient id="stroke-olive-celestial" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={isDark ? "var(--color-moss)" : "var(--color-moss)"} stopOpacity="0.35" />
            <stop offset="50%" stopColor={isDark ? "var(--color-sand)" : "var(--color-terracotta)"} stopOpacity="0.85" />
            <stop offset="100%" stopColor={isDark ? "var(--color-cream)" : "var(--color-sand)"} stopOpacity="0.25" />
          </linearGradient>

          {/* Warm Amber Cream Gradient */}
          <linearGradient id="stroke-cream-amber" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "var(--color-cream)" : "var(--color-sand)"} stopOpacity="0.9" />
            <stop offset="60%" stopColor={isDark ? "var(--color-sand)" : "var(--color-terracotta)"} stopOpacity="0.75" />
            <stop offset="100%" stopColor={isDark ? "var(--color-terracotta)" : "var(--color-moss)"} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* PROCEDURAL GENERATIVE SVGS (Creating & Destroying)            */}
        {/* 6 independent generative slots producing brand new random     */}
        {/* patterns (spirals, loops, ribbons, filaments, tendrils)       */}
        {/* ------------------------------------------------------------- */}
        <g className="generative-paths-layer">
          {Array.from({ length: 6 }).map((_, i) => (
            <path
              key={i}
              className="generative-svg-path opacity-0"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#stroke-glow)"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
