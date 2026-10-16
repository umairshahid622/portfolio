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
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "muted"
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

const PRIMARY_STYLE: CardAccentStyles = {
  text: "text-primary",
  glow: "bg-primary",
  via: "via-primary",
  badge: "bg-primary/20 border-primary/50 text-primary",
  borderL: "border-primary",
  dot: "bg-primary",
};

const SECONDARY_STYLE: CardAccentStyles = {
  text: "text-secondary",
  glow: "bg-secondary",
  via: "via-secondary",
  badge: "bg-secondary/20 border-secondary/50 text-secondary",
  borderL: "border-secondary",
  dot: "bg-secondary",
};

const TERTIARY_STYLE: CardAccentStyles = {
  text: "text-tertiary",
  glow: "bg-tertiary",
  via: "via-tertiary",
  badge: "bg-tertiary/20 border-tertiary/50 text-tertiary",
  borderL: "border-tertiary",
  dot: "bg-tertiary",
};

const ACCENT_STYLE: CardAccentStyles = {
  text: "text-accent",
  glow: "bg-accent",
  via: "via-accent",
  badge: "bg-accent/20 border-accent/50 text-accent",
  borderL: "border-accent",
  dot: "bg-accent",
};

const MUTED_STYLE: CardAccentStyles = {
  text: "text-muted",
  glow: "bg-muted",
  via: "via-muted",
  badge: "bg-muted/20 border-muted/50 text-muted",
  borderL: "border-muted",
  dot: "bg-muted",
};

export const ACCENT_STYLES: Record<CardAccent, CardAccentStyles> = {
  primary: PRIMARY_STYLE,
  secondary: SECONDARY_STYLE,
  tertiary: TERTIARY_STYLE,
  accent: ACCENT_STYLE,
  muted: MUTED_STYLE,
  sand: PRIMARY_STYLE,
  moss: SECONDARY_STYLE,
  olive: SECONDARY_STYLE,
  terracotta: TERTIARY_STYLE,
  copper: TERTIARY_STYLE,
  rust: ACCENT_STYLE,
};

interface AppCardContextValue {
  accent: CardAccent;
  accentStyles: CardAccentStyles;
}

const AppCardContext = createContext<AppCardContextValue>({
  accent: "secondary",
  accentStyles: ACCENT_STYLES.secondary,
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
    accent = "secondary",
    topGradient = true,
    ambientGlow = true,
    ...props
  },
  ref
) {
  const accentStyles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.secondary;

  return (
    <AppCardContext.Provider value={{ accent, accentStyles }}>
      <div
        ref={ref}
        className={cn(
          "rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-6 bg-surface border border-foreground/10 shadow-[0_-12px_32px_rgba(0,0,0,0.7),0_24px_64px_rgba(0,0,0,0.9)] will-change-transform overflow-hidden flex flex-col justify-between",
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
  hollow?: boolean;
}

export function AppCardNumber({
  children,
  className,
  hollow = true,
  style,
  ...props
}: AppCardNumberProps) {
  return (
    <span
      className={cn(
        "font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight select-none shrink-0",
        hollow ? "text-transparent" : "text-white",
        className
      )}
      style={{
        ...(hollow ? { WebkitTextStroke: "1.2px #ffffff" } : {}),
        ...style,
      }}
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
        "font-heading text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight",
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
        "text-xs sm:text-[13px] text-foreground/80 leading-relaxed border-l-2 pl-3 py-0.5",
        accentStyles.borderL,
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export type AppCardPillVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "muted"
  | "default";

const PILL_VARIANTS: Record<AppCardPillVariant, string> = {
  primary:
    "bg-primary/10 border-primary/25 text-primary hover:border-primary/50 hover:bg-primary/20",
  secondary:
    "bg-secondary/10 border-secondary/25 text-secondary hover:border-secondary/50 hover:bg-secondary/20",
  tertiary:
    "bg-tertiary/10 border-tertiary/25 text-tertiary hover:border-tertiary/50 hover:bg-tertiary/20",
  accent:
    "bg-accent/10 border-accent/25 text-accent hover:border-accent/50 hover:bg-accent/20",
  muted:
    "bg-muted/10 border-muted/25 text-muted hover:border-muted/50 hover:bg-muted/20",
  default:
    "bg-tertiary/10 border-tertiary/25 text-tertiary hover:border-tertiary/50 hover:bg-tertiary/20",
};

export interface AppCardPillProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  className?: string;
  variant?: AppCardPillVariant;
}

export function AppCardPill({
  children,
  className,
  variant = "tertiary",
  ...props
}: AppCardPillProps) {
  return (
    <span
      className={cn(
        "text-[11px] sm:text-xs font-sans px-2.5 py-0.5 sm:py-1 rounded-md border transition-all duration-200",
        PILL_VARIANTS[variant] ?? PILL_VARIANTS.default,
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
        "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pt-2.5 sm:pt-3 border-t border-foreground/10 mt-auto",
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
