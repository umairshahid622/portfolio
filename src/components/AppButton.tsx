"use client";

import React, { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { cn } from "../utils/cn";
import { prefersReducedMotion } from "../utils/motion";
import { AppIcon } from "./AppIcon";
import type { IconName } from "../assets/Icons";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "icon";
export type ButtonSize = "sm" | "md" | "lg";
export type IconPosition = "left" | "right";

export interface AppButtonProps {
  children?: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName | string | ReactNode;
  iconPosition?: IconPosition;
  iconClassName?: string;
  animateIcon?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean | string;
  /** Opt out of any audio cues */
  silent?: boolean;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLElement>) => void;
  tabIndex?: number;
  style?: React.CSSProperties;
}

export type RippleButtonProps = AppButtonProps;

const EXPAND_DURATION = 0.55;
const COLLAPSE_DURATION = 0.4;
const LABEL_DURATION = 0.22;

/**
 * The label waits for the fill to reach it rather than flipping with it: entering
 * at an edge, the circle needs about a fifth of its expansion to cover the
 * centre, and a label that changes colour before then spends a moment in the
 * fill's colour on top of the fill's colour.
 */
const LABEL_DELAY = 0.12;

const variantStyles: Record<ButtonVariant, string> = {
  primary: "app-btn-primary shadow-lg shadow-earth-terracotta/25 dark:shadow-earth-sand/20",
  secondary: "app-btn-secondary shadow-sm",
  outline: "app-btn-outline shadow-sm",
  ghost: "app-btn-ghost",
  icon: "app-btn-icon shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs font-semibold uppercase tracking-wider gap-1.5",
  md: "px-6 py-2.5 text-xs sm:text-[0.8rem] font-semibold uppercase tracking-widest gap-2",
  lg: "px-7 md:px-9 py-3.5 md:py-4 text-xs sm:text-[0.8rem] font-semibold uppercase tracking-widest gap-2.5",
};

/**
 * Directional Ripple Button:
 * Solid accent fill at rest with contrasting text. On hover, the contrast colour expands
 * as a circle from wherever the cursor entered, and the label inverts to the accent colour
 * as the circle reaches it — animated with GSAP — then collapses back toward wherever the
 * cursor left.
 */
export function AppButton({
  children,
  onClick,
  type = "button",
  className,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  iconClassName,
  animateIcon = true,
  href,
  target,
  rel,
  download,
  silent = false,
  disabled = false,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}: AppButtonProps) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const restingColor = useRef("");

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    onClick?.(event);
  };

  const handleEnter = (event: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    const fill = fillRef.current;
    const label = labelRef.current;
    if (!el || !fill || !label || disabled || prefersReducedMotion()) return;

    // Take the resting label colour from the element's own computed `color`,
    // with any inline colour a previous leave left behind cleared first
    gsap.set(label, { clearProps: "color" });
    restingColor.current = getComputedStyle(label).color;

    const rect = el.getBoundingClientRect();

    gsap.set(fill, {
      // Radius = the button's diagonal, so the circle reaches every corner from
      // any point inside it. That is also what lets the leave handler re-centre
      // it on the exit point without a visible jump: at full scale it still
      // covers the button from there.
      width: Math.hypot(rect.width, rect.height) * 2,
      height: Math.hypot(rect.width, rect.height) * 2,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      xPercent: -50,
      yPercent: -50,
      scale: 0,
    });

    gsap.to(fill, {
      scale: 1,
      duration: EXPAND_DURATION,
      ease: "power2.out",
      overwrite: true,
    });

    const targetColor = getComputedStyle(el).getPropertyValue("--accent").trim();

    gsap.to(label, {
      color: targetColor,
      duration: LABEL_DURATION,
      delay: LABEL_DELAY,
      ease: "power2.out",
      overwrite: true,
    });

    // Subtle micro-motion for icon on hover
    if (iconRef.current && animateIcon) {
      if (variant === "icon") {
        gsap.to(iconRef.current, {
          scale: 1.18,
          rotation: 15,
          duration: 0.25,
          ease: "back.out(2)",
          overwrite: "auto",
        });
      } else if (iconPosition === "right") {
        gsap.to(iconRef.current, {
          x: 3.5,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
      } else {
        gsap.to(iconRef.current, {
          y: 2,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    }

    onMouseEnter?.(event);
  };

  const handleLeave = (event: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    const fill = fillRef.current;
    const label = labelRef.current;
    if (!el || !fill || !label || disabled || prefersReducedMotion()) return;

    const rect = el.getBoundingClientRect();
    gsap.set(fill, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    gsap.to(fill, {
      scale: 0,
      duration: COLLAPSE_DURATION,
      ease: "power2.in",
      overwrite: true,
    });

    gsap.to(label, {
      color: restingColor.current,
      duration: LABEL_DURATION,
      ease: "power2.out",
      overwrite: true,
      onComplete: () => gsap.set(label, { clearProps: "color" }),
    });

    // Reset icon animation
    if (iconRef.current && animateIcon) {
      gsap.to(iconRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    onMouseLeave?.(event);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled || !ref.current) return;
    gsap.to(ref.current, {
      scale: 0.97,
      duration: 0.12,
      ease: "power2.out",
    });
    onMouseDown?.(event);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled || !ref.current) return;
    gsap.to(ref.current, {
      scale: 1,
      duration: 0.2,
      ease: "back.out(2)",
    });
    onMouseUp?.(event);
  };

  // Icon sizing
  const defaultIconSize =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-4 h-4" : "w-4 h-4";

  const renderedIcon = icon ? (
    <span
      ref={iconRef}
      className="inline-flex items-center justify-center shrink-0 transition-transform pointer-events-none select-none"
    >
      <AppIcon icon={icon} className={cn(defaultIconSize, iconClassName)} />
    </span>
  ) : null;

  const combinedClasses = cn(
    "relative inline-flex items-center justify-center overflow-hidden rounded-full ring-1 ring-[var(--btn-ring,var(--accent))]",
    "select-none transition-shadow duration-200 outline-none focus-visible:ring-2 focus-visible:ring-earth-terracotta focus-visible:ring-offset-2",
    variant === "icon" ? sizeStyles.sm + " p-2.5 w-10 h-10 rounded-full" : sizeStyles[size],
    variantStyles[variant],
    disabled ? "cursor-not-allowed opacity-45 pointer-events-none" : "cursor-pointer",
    className
  );

  const innerContent = (
    <>
      {/* Sized and positioned per hover, so it starts life 0×0 and nothing is
          painted before the first cursor enters — including in the SSR HTML. */}
      <span
        ref={fillRef}
        aria-hidden="true"
        className="app-btn-fill pointer-events-none absolute top-0 left-0 rounded-full will-change-transform"
      />
      <span
        ref={labelRef}
        className="relative z-10 inline-flex items-center justify-center gap-2 pointer-events-none"
      >
        {iconPosition === "left" && renderedIcon}
        {children && <span>{children}</span>}
        {iconPosition === "right" && renderedIcon}
      </span>
    </>
  );

  // If href is provided, render polymorphic <a> tag
  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        target={target}
        rel={target === "_blank" && !rel ? "noopener noreferrer" : rel}
        download={download}
        className={combinedClasses}
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {innerContent}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={combinedClasses}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {innerContent}
    </button>
  );
}

export const RippleButton = AppButton;
export default AppButton;
