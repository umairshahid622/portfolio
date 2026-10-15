import type { LogoItem } from "../interfaces/cursor";
import reactLogo from "../assets/CursorIcons/react.svg";
import nextjsLogo from "../assets/CursorIcons/nextjs.svg";
import flutterLogo from "../assets/CursorIcons/flutter.svg";
import nodejsLogo from "../assets/CursorIcons/nodejs.svg";
import expressLogo from "../assets/CursorIcons/express.svg";
import nestjsLogo from "../assets/CursorIcons/nestjs.svg";
import postgresLogo from "../assets/CursorIcons/postgresql.svg";
import mongodbLogo from "../assets/CursorIcons/mongodb.svg";
import githubLogo from "../assets/CursorIcons/github.svg";
import tailwindLogo from "../assets/CursorIcons/tailwindcss.svg";
import gsapLogo from "../assets/CursorIcons/gsap.svg";
import framerLogo from "../assets/CursorIcons/framermotion.svg";

export const LOGOS: LogoItem[] = [
  { name: "React", src: reactLogo, isMonochrome: false, accentColor: "var(--color-primary)" },
  { name: "Next.js", src: nextjsLogo, isMonochrome: true, accentColor: "var(--color-background)" },
  { name: "Flutter", src: flutterLogo, isMonochrome: false, accentColor: "var(--color-tertiary)" },
  { name: "Node.js", src: nodejsLogo, isMonochrome: false, accentColor: "var(--color-secondary)" },
  { name: "Express", src: expressLogo, isMonochrome: true, accentColor: "var(--color-background)" },
  { name: "NestJS", src: nestjsLogo, isMonochrome: false, accentColor: "var(--color-tertiary)" },
  { name: "PostgreSQL", src: postgresLogo, isMonochrome: false, accentColor: "var(--color-primary)" },
  { name: "MongoDB", src: mongodbLogo, isMonochrome: false, accentColor: "var(--color-secondary)" },
  { name: "GitHub", src: githubLogo, isMonochrome: true, accentColor: "var(--color-background)" },
  { name: "Tailwind CSS", src: tailwindLogo, isMonochrome: false, accentColor: "var(--color-primary)" },
  { name: "GSAP", src: gsapLogo, isMonochrome: false, accentColor: "var(--color-secondary)" },
  { name: "Framer Motion", src: framerLogo, isMonochrome: false, accentColor: "var(--color-tertiary)" },
];

export const CURSOR_CONFIG = {
  DISTANCE_THRESHOLD: 36,    // Spacing between icons in px (light edge overlap for 40px icons)
  MIN_SPAWN_INTERVAL: 25,    // Minimum ms between spawns for fluid stacking
  STOP_DELAY: 220,           // ms of no mousemove considered as cursor stopped
  MAX_STACK_SIZE: 7,         // Maximum icons visible simultaneously in the active stack
  CARD_SIZE: 40,             // Icon dimension in px
  STACK_HOLD_DURATION: 0.65, // Seconds icons stay in place in the stack before fading
} as const;
