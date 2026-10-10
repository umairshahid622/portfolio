"use client";

import {
  forwardRef,
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { cn } from "../utils/cn";

export type CardAccent =
  | "moss"
  | "sand"
  | "terracotta"
  | "copper"
  | "olive"
  | "rust";

export interface CardAccentStyles {
  text: string;
  glow: string;
  via: string;
  badge: string;
  borderL: string;
  dot: string;
}

export const ACCENT_STYLES: Record<CardAccent, CardAccentStyles> = {
  moss: {
    text: "text-earth-moss",
    glow: "bg-earth-moss",
    via: "via-earth-moss",
    badge: "bg-earth-moss/20 border-earth-moss/50 text-earth-moss",
    borderL: "border-earth-moss",
    dot: "bg-earth-moss",
  },
  sand: {
    text: "text-earth-sand",
    glow: "bg-earth-sand",
    via: "via-earth-sand",
    badge: "bg-earth-sand/20 border-earth-sand/50 text-earth-sand",
    borderL: "border-earth-sand",
    dot: "bg-earth-sand",
  },
  terracotta: {
    text: "text-earth-terracotta",
    glow: "bg-earth-terracotta",
    via: "via-earth-terracotta",
    badge: "bg-earth-terracotta/20 border-earth-terracotta/50 text-earth-terracotta",
    borderL: "border-earth-terracotta",
    dot: "bg-earth-terracotta",
  },
  copper: {
    text: "text-earth-copper",
    glow: "bg-earth-copper",
    via: "via-earth-copper",
    badge: "bg-earth-copper/20 border-earth-copper/50 text-earth-copper",
    borderL: "border-earth-copper",
    dot: "bg-earth-copper",
  },
  olive: {
    text: "text-earth-olive",
    glow: "bg-earth-olive",
    via: "via-earth-olive",
    badge: "bg-earth-olive/20 border-earth-olive/50 text-earth-olive",
    borderL: "border-earth-olive",
    dot: "bg-earth-olive",
  },
  rust: {
    text: "text-earth-rust",
    glow: "bg-earth-rust",
    via: "via-earth-rust",
    badge: "bg-earth-rust/20 border-earth-rust/50 text-earth-rust",
    borderL: "border-earth-rust",
    dot: "bg-earth-rust",
  },
};

interface AppCardContextValue {
  accent: CardAccent;
  accentStyles: CardAccentStyles;
}

const AppCardContext = createContext<AppCardContextValue>({
  accent: "moss",
  accentStyles: ACCENT_STYLES.moss,
});

export function useAppCard() {
  return useContext(AppCardContext);
}

export interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  accent?: CardAccent;
  topGradient?: boolean;
  ambientGlow?: boolean;
}

export const AppCard = forwardRef<HTMLDivElement, AppCardProps>(function AppCard(
  {
    children,
    className,
    accent = "moss",
    topGradient = true,
    ambientGlow = true,
    ...props
  },
  ref
) {
  const accentStyles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.moss;

  return (
    <AppCardContext.Provider value={{ accent, accentStyles }}>
      <div
        ref={ref}
        className={cn(
          "rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-6 bg-earth-card border border-earth-cream/10 shadow-[0_-12px_32px_rgba(0,0,0,0.7),0_24px_64px_rgba(0,0,0,0.9)] will-change-transform overflow-hidden flex flex-col justify-between",
          !className?.includes("absolute") && "relative",
          className
        )}
        {...props}
      >
        {/* Top Accent Gradient Border */}
        {topGradient && (
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-[2px] opacity-80 bg-gradient-to-r from-transparent to-transparent pointer-events-none",
              accentStyles.via
            )}
          />
        )}

        {/* Ambient Accent Radial Glow */}
        {ambientGlow && (
          <div
            className={cn(
              "absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none",
              accentStyles.glow
            )}
          />
        )}

        {children}
      </div>
    </AppCardContext.Provider>
  );
});

export interface AppCardNumberProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  className?: string;
}

export function AppCardNumber({
  children,
  className,
  ...props
}: AppCardNumberProps) {
  const { accentStyles } = useAppCard();
  return (
    <span
      className={cn(
        "font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight select-none shrink-0",
        accentStyles.text,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AppCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
  className?: string;
  as?: "h3" | "h2" | "h4";
}

export function AppCardTitle({
  children,
  className,
  as: Component = "h3",
  ...props
}: AppCardTitleProps) {
  return (
    <Component
      className={cn(
        "font-heading text-xl sm:text-2xl md:text-3xl font-bold text-earth-cream tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export interface AppCardBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  className?: string;
  accent?: CardAccent;
}

export function AppCardBadge({
  children,
  className,
  accent,
  ...props
}: AppCardBadgeProps) {
  const { accentStyles } = useAppCard();
  const styles = accent ? ACCENT_STYLES[accent] : accentStyles;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-sans font-medium border",
        styles.badge,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AppCardSummaryProps
  extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
  className?: string;
}

export function AppCardSummary({
  children,
  className,
  ...props
}: AppCardSummaryProps) {
  const { accentStyles } = useAppCard();
  return (
    <p
      className={cn(
        "text-xs sm:text-[13px] text-earth-cream/80 leading-relaxed border-l-2 pl-3 py-0.5",
        accentStyles.borderL,
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export interface AppCardPillProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  className?: string;
}

export function AppCardPill({
  children,
  className,
  ...props
}: AppCardPillProps) {
  return (
    <span
      className={cn(
        "text-[11px] sm:text-xs font-sans px-2.5 py-0.5 sm:py-1 rounded-md bg-earth-cream/[0.04] border border-earth-cream/10 text-earth-sand hover:text-earth-cream transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AppCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export function AppCardFooter({
  children,
  className,
  ...props
}: AppCardFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pt-2.5 sm:pt-3 border-t border-earth-cream/10 mt-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Object.assign(AppCard, {
  Number: AppCardNumber,
  Title: AppCardTitle,
  Badge: AppCardBadge,
  Summary: AppCardSummary,
  Pill: AppCardPill,
  Footer: AppCardFooter,
});
