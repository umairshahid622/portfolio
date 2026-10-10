import React, {
  forwardRef,
  useId,
  useRef,
  useState,
  useEffect,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "../utils/cn";

gsap.registerPlugin(useGSAP);

export interface AppInputProps {
  id?: string;
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  error?: string;
  helperText?: string;
  autoComplete?: string;
  animationMode?: "single" | "loop" | "symmetrical";
  accentColor?: string;
  borderRadius?: number;
}

export const AppInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  AppInputProps
>(function AppInput(
  {
    id,
    name,
    label,
    type = "text",
    placeholder,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    required = false,
    disabled = false,
    multiline = false,
    rows = 4,
    className = "",
    inputClassName = "",
    labelClassName = "",
    error,
    helperText,
    autoComplete,
    animationMode = "single",
    accentColor = "var(--color-sand, #dda15e)",
    borderRadius = 12,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `app-input-${generatedId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const loopPathRef = useRef<SVGPathElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFocused, setIsFocused] = useState(false);

  // Measure container dimensions for pixel-perfect SVG path calculation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const { width: w, height: h } = dimensions;

  // Compute SVG path strings starting from top-middle
  const strokeWidth = 2;
  const inset = strokeWidth / 2; // 1px offset so stroke doesn't clip
  const xMin = inset;
  const xMax = Math.max(xMin, w - inset);
  const yMin = inset;
  const yMax = Math.max(yMin, h - inset);
  const xCenter = w / 2;
  const r = Math.min(borderRadius, Math.max(0, Math.min(w, h) / 2 - inset));

  // 1. Symmetrical mode:
  // Path 1: Clockwise from top-middle (xCenter, yMin) down to bottom-middle (xCenter, yMax)
  const dPath1 =
    w > 0 && h > 0
      ? `M ${xCenter} ${yMin} L ${xMax - r} ${yMin} A ${r} ${r} 0 0 1 ${xMax} ${yMin + r} L ${xMax} ${yMax - r} A ${r} ${r} 0 0 1 ${xMax - r} ${yMax} L ${xCenter} ${yMax}`
      : "";

  // Path 2: Counter-clockwise from top-middle (xCenter, yMin) down to bottom-middle (xCenter, yMax)
  const dPath2 =
    w > 0 && h > 0
      ? `M ${xCenter} ${yMin} L ${xMin + r} ${yMin} A ${r} ${r} 0 0 0 ${xMin} ${yMin + r} L ${xMin} ${yMax - r} A ${r} ${r} 0 0 0 ${xMin + r} ${yMax} L ${xCenter} ${yMax}`
      : "";

  // Single-direction loop mode:
  // Starts at top-middle and travels full clockwise loop back to top-middle
  const dLoop =
    w > 0 && h > 0
      ? `M ${xCenter} ${yMin} L ${xMax - r} ${yMin} A ${r} ${r} 0 0 1 ${xMax} ${yMin + r} L ${xMax} ${yMax - r} A ${r} ${r} 0 0 1 ${xMax - r} ${yMax} L ${xMin + r} ${yMax} A ${r} ${r} 0 0 1 ${xMin} ${yMax - r} L ${xMin} ${yMin + r} A ${r} ${r} 0 0 1 ${xMin + r} ${yMin} Z`
      : "";

  // Setup GSAP Timeline when dimensions or mode changes
  useGSAP(
    () => {
      if (w <= 0 || h <= 0) return;

      const activePaths: SVGPathElement[] = [];

      if (animationMode === "symmetrical") {
        if (path1Ref.current) activePaths.push(path1Ref.current);
        if (path2Ref.current) activePaths.push(path2Ref.current);
      } else {
        if (loopPathRef.current) activePaths.push(loopPathRef.current);
      }

      if (activePaths.length === 0) return;

      // Initialize path stroke dash properties so each path is hidden at its origin point (top-middle)
      activePaths.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: 0,
        });
      });

      // Create Timeline
      const tl = gsap.timeline({ paused: true });

      // Animate border stroke drawing in one continuous direction from top-middle to full perimeter
      tl.to(
        activePaths,
        {
          strokeDashoffset: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power2.out",
          stagger: 0,
        },
        0
      );

      tlRef.current = tl;

      // Maintain progress if currently focused during a resize
      if (isFocused) {
        tl.progress(1);
      }
    },
    { dependencies: [w, h, animationMode], scope: containerRef }
  );

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(true);
    tlRef.current?.play();
    onFocus?.(e);
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(false);
    tlRef.current?.reverse();
    onBlur?.(e);
  };

  return (
    <div className={cn("relative w-full space-y-2", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block text-xs sm:text-sm font-semibold uppercase tracking-wider text-earth-cream/80 font-sans cursor-pointer select-none",
            labelClassName
          )}
        >
          {label} {required && <span className="text-earth-sand ml-0.5">*</span>}
        </label>
      )}

      {/* Input container with base border & animated SVG overlay */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full rounded-xl bg-earth-black/60 overflow-visible transition-colors duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Animated SVG Border Layer */}
        {w > 0 && h > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
            viewBox={`0 0 ${w} ${h}`}
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <filter id={`glow-${inputId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2.5"
                  floodColor={error ? "#bc6c25" : "#dda15e"}
                  floodOpacity="0.65"
                />
              </filter>
            </defs>

            {/* Resting Base Border (shares exact same geometry as animated border) */}
            <rect
              x={xMin}
              y={yMin}
              width={Math.max(0, xMax - xMin)}
              height={Math.max(0, yMax - yMin)}
              rx={r}
              ry={r}
              stroke={error ? "var(--color-terracotta, #bc6c25)" : "rgba(254, 250, 224, 0.15)"}
              strokeWidth={1}
              fill="none"
              className="transition-colors duration-200"
            />

            {animationMode === "symmetrical" ? (
              <g filter={`url(#glow-${inputId})`}>
                {/* Clockwise half starting from top-middle */}
                <path
                  ref={path1Ref}
                  d={dPath1}
                  stroke={error ? "var(--color-terracotta, #bc6c25)" : accentColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                {/* Counter-clockwise half starting from top-middle */}
                <path
                  ref={path2Ref}
                  d={dPath2}
                  stroke={error ? "var(--color-terracotta, #bc6c25)" : accentColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </g>
            ) : (
              <g filter={`url(#glow-${inputId})`}>
                {/* Single continuous loop starting from top-middle */}
                <path
                  ref={loopPathRef}
                  d={dLoop}
                  stroke={error ? "var(--color-terracotta, #bc6c25)" : accentColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </g>
            )}

          </svg>
        )}

        {/* Form Element: Input or Textarea */}
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            name={name}
            required={required}
            rows={rows}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3.5 bg-transparent border-0 outline-none text-earth-cream text-sm sm:text-base",
              "placeholder:text-earth-cream/30 resize-none font-sans relative z-0",
              inputClassName
            )}
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            name={name}
            type={type}
            required={required}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            className={cn(
              "w-full px-4 py-3.5 bg-transparent border-0 outline-none text-earth-cream text-sm sm:text-base",
              "placeholder:text-earth-cream/30 font-sans relative z-0",
              inputClassName
            )}
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>

      {/* Error or Helper Text */}
      {error && (
        <p className="text-xs text-earth-terracotta font-medium tracking-wide">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-earth-cream/50 font-normal">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default AppInput;
