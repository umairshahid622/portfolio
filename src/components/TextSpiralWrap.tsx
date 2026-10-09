import { useRef, useEffect, useId } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TextSpiralWrapProps {
  children: React.ReactNode;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// Normalized 2.15-turn organic rounded spiral lasso path in viewBox 0 0 100 100
const LASSO_PATH =
  "M 15.7 34.7 C 16.4 33.5, 18.4 29.9, 20.1 27.7 C 21.8 25.5, 23.8 23.5, 26 21.8 C 28.2 20.1, 30.7 18.6, 33.2 17.4 C 35.8 16.2, 38.5 15.2, 41.3 14.5 C 44.1 13.8, 47.0 13.5, 49.9 13.4 C 52.8 13.3, 55.8 13.6, 58.6 14.2 C 61.4 14.8, 64.2 15.7, 66.8 16.8 C 69.4 17.9, 72.0 19.3, 74.3 21 C 76.6 22.7, 78.7 24.7, 80.5 26.8 C 82.3 28.9, 84.0 31.3, 85.3 33.8 C 86.6 36.3, 87.6 39.0, 88.3 41.7 C 89.0 44.4, 89.4 47.2, 89.4 50 C 89.4 52.8, 89.1 55.7, 88.5 58.4 C 87.9 61.1, 86.9 63.9, 85.6 66.4 C 84.3 68.9, 82.7 71.4, 80.9 73.6 C 79.1 75.8, 77.0 77.9, 74.7 79.7 C 72.4 81.5, 69.8 83.0, 67.1 84.3 C 64.4 85.5, 61.5 86.5, 58.6 87.2 C 55.7 87.9, 52.7 88.2, 49.7 88.2 C 46.7 88.2, 43.6 87.9, 40.7 87.3 C 37.8 86.7, 34.8 85.7, 32.1 84.5 C 29.4 83.3, 26.8 81.8, 24.4 80 C 22.0 78.2, 19.8 76.2, 17.9 73.9 C 16.0 71.7, 14.3 69.1, 13 66.5 C 11.7 63.9, 10.7 61.1, 10 58.3 C 9.3 55.5, 9.0 52.5, 9 49.6 C 9.0 46.7, 9.3 43.8, 10 40.9 C 10.7 38.0, 11.8 35.1, 13.1 32.5 C 14.4 29.9, 16.2 27.4, 18.1 25.1 C 20.0 22.8, 22.3 20.6, 24.7 18.8 C 27.1 17.0, 29.8 15.4, 32.6 14.1 C 35.4 12.8, 38.4 11.8, 41.4 11.1 C 44.4 10.4, 47.7 10.2, 50.8 10.2 C 53.9 10.2, 57.1 10.5, 60.1 11.2 C 63.1 11.9, 66.2 12.9, 69 14.2 C 71.8 15.5, 74.6 17.1, 77 19 C 79.4 20.9, 81.7 23.1, 83.6 25.5 C 85.5 27.9, 87.3 30.5, 88.6 33.2 C 89.9 35.9, 91.0 38.9, 91.7 41.8 C 92.4 44.7, 92.7 47.8, 92.7 50.8 C 92.7 53.8, 92.3 56.9, 91.5 59.9 C 90.8 62.9, 89.6 65.9, 88.2 68.6 C 86.8 71.3, 84.9 73.9, 82.9 76.3 C 80.9 78.7, 78.5 80.9, 76 82.8 C 73.5 84.7, 70.6 86.3, 67.7 87.6 C 64.8 88.9, 61.7 89.9, 58.5 90.6 C 55.3 91.3, 52.0 91.5, 48.7 91.5 C 45.5 91.5, 42.1 91.0, 39 90.3 C 35.9 89.6, 32.7 88.5, 29.8 87.1 C 26.9 85.7, 24.1 84.0, 21.6 82 C 19.1 80.0, 16.8 77.7, 14.8 75.2 C 12.8 72.7, 11.1 69.9, 9.7 67.1 C 8.3 64.3, 7.3 61.2, 6.6 58.1 C 5.9 55.0, 5.6 51.9, 5.7 48.7 C 5.8 45.6, 6.3 42.3, 7.1 39.2 C 7.9 36.1, 9.1 33.1, 10.6 30.3 C 12.1 27.5, 14.0 24.7, 16.1 22.3 C 18.2 19.9, 20.7 17.6, 23.4 15.7 C 26.1 13.8, 29.1 12.0, 32.1 10.7 C 35.2 9.4, 40.1 8.3, 41.7 7.8";

/**
 * TextSpiralWrap
 * Wraps text with an SVG rounded spiral line that draws dynamically
 * from starting point to ending point on hover using GSAP.
 */
export default function TextSpiralWrap({
  children,
  className = "",
  strokeColor,
  strokeWidth = 2.5,
}: TextSpiralWrapProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pathLengthRef = useRef(0);
  const uniqueId = useId().replace(/:/g, "");

  // Measure path length and initialize hidden stroke state
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      pathLengthRef.current = len;
      gsap.set(pathRef.current, {
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity: 0,
      });
    }
  }, []);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleMouseEnter = contextSafe(() => {
    if (!pathRef.current) return;
    const len = pathLengthRef.current || pathRef.current.getTotalLength();

    gsap.killTweensOf(pathRef.current);

    // Reset stroke to beginning of path
    gsap.set(pathRef.current, {
      strokeDasharray: len,
      strokeDashoffset: len,
      opacity: 1,
    });

    // Draw the rounded spiral line sequentially from start point to end point
    gsap.to(pathRef.current, {
      strokeDashoffset: 0,
      duration: 0.85,
      ease: "power2.out",
    });
  });

  const handleMouseLeave = contextSafe(() => {
    if (!pathRef.current) return;
    const len = pathLengthRef.current || pathRef.current.getTotalLength();

    gsap.killTweensOf(pathRef.current);

    // Smoothly glide off forward or rewind
    gsap.to(pathRef.current, {
      strokeDashoffset: -len,
      opacity: 0,
      duration: 0.45,
      ease: "power2.in",
      onComplete: () => {
        if (pathRef.current) {
          gsap.set(pathRef.current, { strokeDashoffset: len, opacity: 0 });
        }
      },
    });
  });

  const gradientId = `spiral-gradient-${uniqueId}`;

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-cursor-hover
      className={`relative inline-flex items-center justify-center select-none group ${className}`}
    >
      {/* SVG Canvas Overlay for the Rounded Spiral Line */}
      <svg
        aria-hidden="true"
        className="absolute -inset-x-6 -inset-y-3 sm:-inset-x-8 sm:-inset-y-4 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] h-[calc(100%+1.5rem)] sm:h-[calc(100%+2rem)] pointer-events-none z-30 overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--color-terracotta)" />
            <stop offset="30%" stopColor="var(--color-sand)" />
            <stop offset="70%" stopColor="var(--color-terracotta)" />
            <stop offset="100%" stopColor="var(--color-sand)" />
          </linearGradient>
          <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="2.5"
              floodColor="var(--color-sand)"
              floodOpacity="0.75"
            />
          </filter>
        </defs>

        <path
          ref={pathRef}
          d={LASSO_PATH}
          vectorEffect="non-scaling-stroke"
          fill="none"
          stroke={strokeColor || "var(--color-terracotta)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${uniqueId})`}
          className="will-change-transform"
        />
      </svg>

      {/* Text element */}
      <span className="relative z-10 block">
        {children}
      </span>
    </span>
  );
}
