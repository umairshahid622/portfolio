import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AppIcon } from "./AppIcon";
import type { IconName } from "../assets/Icons";
import { cn } from "../utils/cn";

gsap.registerPlugin(useGSAP);

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "icon";
export type ButtonSize = "sm" | "md" | "lg";
export type IconPosition = "left" | "right";

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName | string | React.ReactNode;
  iconPosition?: IconPosition;
  iconClassName?: string;
  animateIcon?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean | string;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-earth-terracotta to-earth-sand text-earth-cream dark:text-earth-forest group-hover:text-earth-cream dark:group-hover:text-earth-forest font-bold shadow-lg shadow-earth-terracotta/25 hover:shadow-earth-terracotta/40",
  secondary:
    "border border-earth-forest/20 dark:border-earth-cream/20 text-earth-forest dark:text-earth-cream group-hover:text-earth-cream dark:group-hover:text-earth-cream bg-earth-forest/5 dark:bg-earth-forest/40 backdrop-blur-md font-semibold shadow-sm hover:border-earth-terracotta/60",
  outline:
    "border border-earth-moss/30 dark:border-earth-sand/30 text-earth-forest dark:text-earth-sand group-hover:text-earth-cream dark:group-hover:text-earth-cream bg-earth-moss/10 dark:bg-earth-sand/10 hover:border-earth-terracotta font-medium",
  ghost:
    "text-earth-forest/80 dark:text-earth-cream/80 hover:text-earth-forest dark:hover:text-earth-cream font-medium",
  icon:
    "p-2.5 rounded-xl border border-earth-forest/15 dark:border-earth-cream/15 bg-earth-forest/10 dark:bg-earth-forest/60 backdrop-blur-md text-earth-forest dark:text-earth-cream shadow-sm hover:border-earth-terracotta",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3.5 text-sm sm:text-base rounded-xl gap-2.5 tracking-wide",
};

// The rounded border element that expands inside the button to fully fill it
const splashStyles: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-earth-sand dark:border-earth-terracotta bg-earth-forest dark:bg-earth-cream shadow-[0_0_30px_rgba(221,161,94,0.45)]",
  secondary:
    "border-2 border-earth-sand dark:border-earth-sand bg-earth-terracotta dark:bg-earth-terracotta shadow-[0_0_25px_rgba(188,108,37,0.5)]",
  outline:
    "border-2 border-earth-sand dark:border-earth-sand bg-earth-terracotta dark:bg-earth-terracotta shadow-[0_0_20px_rgba(188,108,37,0.4)]",
  ghost:
    "border-2 border-earth-forest/40 dark:border-earth-cream/40 bg-earth-forest/15 dark:bg-earth-cream/15",
  icon:
    "border-2 border-earth-terracotta dark:border-earth-sand bg-earth-terracotta/30 dark:bg-earth-sand/30 backdrop-blur-md shadow-[0_0_20px_rgba(188,108,37,0.5)]",
};

export function AppButton({
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
  className,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  disabled,
  ...props
}: AppButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const splashRef = useRef<HTMLDivElement>(null);

  // GSAP cleanups on unmount
  useGSAP(
    () => {
      return () => {
        if (buttonRef.current) gsap.killTweensOf(buttonRef.current);
        if (iconRef.current) gsap.killTweensOf(iconRef.current);
        if (splashRef.current) gsap.killTweensOf(splashRef.current);
      };
    },
    { scope: buttonRef }
  );

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || !buttonRef.current || !splashRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const clientX = e.clientX || rect.left + rect.width / 2;
    const clientY = e.clientY || rect.top + rect.height / 2;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));

    // Calculate distance to the farthest corner from entry point
    const maxDist = Math.hypot(
      Math.max(relX, rect.width - relX),
      Math.max(relY, rect.height - relY)
    );

    // Initial 40px circle has radius 20px. Multiply by 2.8 to guarantee 100% full coverage
    const targetScale = Math.max(3, (maxDist * 2.8) / 20);

    // Start circle right at the cursor entry position matching the cursor's rounded border
    gsap.killTweensOf(splashRef.current);
    gsap.set(splashRef.current, {
      x: relX,
      y: relY,
      scale: 0.5,
      opacity: 1,
    });

    // Animate the rounded border expanding across the entire button until fully expanded
    gsap.to(splashRef.current, {
      scale: targetScale,
      opacity: 1,
      duration: 0.45,
      ease: "power2.out",
    });

    // Animate icon on hover
    if (iconRef.current && animateIcon) {
      if (variant === "icon") {
        gsap.to(iconRef.current, {
          scale: 1.2,
          rotation: 15,
          duration: 0.25,
          ease: "back.out(2)",
        });
      } else if (iconPosition === "right") {
        gsap.to(iconRef.current, {
          x: 4,
          duration: 0.25,
          ease: "power2.out",
        });
      } else {
        gsap.to(iconRef.current, {
          y: 2,
          duration: 0.25,
          ease: "power2.out",
        });
      }
    }

    onMouseEnter?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || !buttonRef.current || !splashRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const clientX = e.clientX || rect.left + rect.width / 2;
    const clientY = e.clientY || rect.top + rect.height / 2;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));

    // Shrink the rounded border back toward the cursor exit position
    gsap.to(splashRef.current, {
      x: relX,
      y: relY,
      scale: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power2.inOut",
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
      });
    }

    onMouseLeave?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || !buttonRef.current) return;

    gsap.to(buttonRef.current, {
      scale: 0.96,
      duration: 0.1,
      ease: "power2.out",
    });

    onMouseDown?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || !buttonRef.current) return;

    gsap.to(buttonRef.current, {
      scale: 1,
      duration: 0.2,
      ease: "back.out(2)",
    });

    onMouseUp?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  // Default icon sizing per button size
  const defaultIconSize =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-4.5 h-4.5" : "w-4 h-4";

  const renderedIcon = icon ? (
    <span
      ref={iconRef}
      className="inline-flex items-center justify-center shrink-0 transition-transform pointer-events-none select-none"
    >
      <AppIcon icon={icon} className={cn(defaultIconSize, iconClassName)} />
    </span>
  ) : null;

  const baseStyles =
    "group relative inline-flex items-center justify-center font-medium cursor-pointer select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-earth-terracotta focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed transition-colors duration-200";

  const sizeClass = variant === "icon" ? "" : sizeStyles[size];
  const combinedClasses = cn(
    baseStyles,
    variantStyles[variant],
    sizeClass,
    className
  );

  const internalSplash = (
    <div
      ref={splashRef}
      aria-hidden="true"
      className={cn(
        "absolute w-10 h-10 -ml-5 -mt-5 rounded-full pointer-events-none opacity-0 will-change-transform z-0",
        splashStyles[variant]
      )}
    />
  );

  const content = (
    <span className="relative z-10 inline-flex items-center justify-center gap-inherit transition-colors duration-200 pointer-events-none select-none">
      {iconPosition === "left" && renderedIcon}
      {children && <span>{children}</span>}
      {iconPosition === "right" && renderedIcon}
    </span>
  );

  // If href is provided, render as <a>
  if (href) {
    return (
      <a
        ref={buttonRef as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={target === "_blank" && !rel ? "noopener noreferrer" : rel}
        download={download}
        data-cursor-splash="true"
        className={combinedClasses}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        onMouseEnter={handleMouseEnter}
        onMouseMove={onMouseMove as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {internalSplash}
        {content}
      </a>
    );
  }

  // Otherwise render as <button>
  return (
    <button
      ref={buttonRef as React.Ref<HTMLButtonElement>}
      disabled={disabled}
      data-cursor-splash="true"
      className={combinedClasses}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {internalSplash}
      {content}
    </button>
  );
}

export default AppButton;
