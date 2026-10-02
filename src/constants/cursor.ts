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
  { name: "React", src: reactLogo, isMonochrome: false, accentColor: "#61DAFB" },
  { name: "Next.js", src: nextjsLogo, isMonochrome: true, accentColor: "#000000" },
  { name: "Flutter", src: flutterLogo, isMonochrome: false, accentColor: "#02569B" },
  { name: "Node.js", src: nodejsLogo, isMonochrome: false, accentColor: "#5FA04E" },
  { name: "Express", src: expressLogo, isMonochrome: true, accentColor: "#000000" },
  { name: "NestJS", src: nestjsLogo, isMonochrome: false, accentColor: "#E0234E" },
  { name: "PostgreSQL", src: postgresLogo, isMonochrome: false, accentColor: "#336791" },
  { name: "MongoDB", src: mongodbLogo, isMonochrome: false, accentColor: "#47A248" },
  { name: "GitHub", src: githubLogo, isMonochrome: true, accentColor: "#000000" },
  { name: "Tailwind CSS", src: tailwindLogo, isMonochrome: false, accentColor: "#06B6D4" },
  { name: "GSAP", src: gsapLogo, isMonochrome: false, accentColor: "#0ae448" },
  { name: "Framer Motion", src: framerLogo, isMonochrome: false, accentColor: "#0055FF" },
];

export const CURSOR_CONFIG = {
  DISTANCE_THRESHOLD: 50, // pixels moved before next logo pop
  MIN_SPAWN_INTERVAL: 60, // ms minimum delay to prevent stacking
  STOP_DELAY: 220,        // ms of no mousemove considered as cursor stopped
} as const;
