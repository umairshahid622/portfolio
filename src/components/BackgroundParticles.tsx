import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/cn";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
  swaySpeed: number;
  swayOffset: number;
  swayDistance: number;
  color: string;
  depth: number; // 0.5 (far) to 1.5 (near) for parallax & speed
}

interface AmbientWisp {
  yFraction: number;
  amplitude: number;
  wavelength: number;
  speed: number;
  color: string;
  alpha: number;
  offset: number;
}

interface BackgroundParticlesProps {
  className?: string;
  count?: number;
  showAmbientGlows?: boolean;
}

function getRgbPrefixFromVar(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!val) return fallback;
  if (val.startsWith("#")) {
    const full = val.length === 4
      ? `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`
      : val;
    const r = parseInt(full.slice(1, 3), 16);
    const g = parseInt(full.slice(3, 5), 16);
    const b = parseInt(full.slice(5, 7), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b},`;
    }
  }
  return fallback;
}

export default function BackgroundParticles({
  className = "",
  count = 46,
  showAmbientGlows = true,
}: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = Math.max(canvas.parentElement?.clientHeight || 0, window.innerHeight);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Palette sourced dynamically from CSS variables
    const creamRgb = getRgbPrefixFromVar("--color-cream", "rgba(254, 250, 224,");
    const terracottaRgb = getRgbPrefixFromVar("--color-terracotta", "rgba(188, 108, 37,");
    const mossRgb = getRgbPrefixFromVar("--color-moss", "rgba(96, 108, 56,");
    const sandRgb = getRgbPrefixFromVar("--color-sand", "rgba(221, 161, 94,");
    const forestRgb = getRgbPrefixFromVar("--color-forest", "rgba(40, 54, 24,");

    const colorsDark = [creamRgb, sandRgb];
    const colorsLight = [terracottaRgb, mossRgb, sandRgb, forestRgb];

    const activeColors = isDark ? colorsDark : colorsLight;

    // Mouse tracking for subtle interactive parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetParallaxX = (mouseX / width - 0.5) * 30;
      targetParallaxY = (mouseY / height - 0.5) * 30;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Handle high DPI display
    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = Math.max(canvas.parentElement?.clientHeight || 0, window.innerHeight);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Deep background flowing filaments/wisps
    const wisps: AmbientWisp[] = [
      {
        yFraction: 0.22,
        amplitude: 45,
        wavelength: 0.0018,
        speed: 0.0003,
        color: isDark ? mossRgb : terracottaRgb,
        alpha: isDark ? 0.09 : 0.05,
        offset: 0,
      },
      {
        yFraction: 0.58,
        amplitude: 65,
        wavelength: 0.0012,
        speed: -0.00025,
        color: isDark ? sandRgb : mossRgb,
        alpha: isDark ? 0.06 : 0.04,
        offset: 2.5,
      },
      {
        yFraction: 0.82,
        amplitude: 50,
        wavelength: 0.0015,
        speed: 0.0002,
        color: isDark ? terracottaRgb : sandRgb,
        alpha: isDark ? 0.05 : 0.03,
        offset: 4.1,
      },
    ];

    // Initialize particles
    const particles: Particle[] = [];

    const createParticle = (spawnY?: number): Particle => {
      const radius = 1.0 + Math.random() * 1.5;
      const baseAlpha = isDark
        ? 0.35 + Math.random() * 0.45
        : 0.25 + Math.random() * 0.35;

      const colorPrefix =
        activeColors[Math.floor(Math.random() * activeColors.length)];
      const depth = 0.6 + Math.random() * 0.8; // Parallax depth layer

      return {
        x: Math.random() * width,
        y: spawnY !== undefined ? spawnY : Math.random() * height,
        radius,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -(0.05 + Math.random() * 0.09) * depth, // Calmed, very slow buoyant drift
        baseAlpha,
        alpha: baseAlpha,
        pulseSpeed: 0.003 + Math.random() * 0.008,
        pulseOffset: Math.random() * Math.PI * 2,
        swaySpeed: 0.002 + Math.random() * 0.005,
        swayOffset: Math.random() * Math.PI * 2,
        swayDistance: 0.15 + Math.random() * 0.25,
        color: colorPrefix,
        depth,
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }

    const startTime = Date.now();

    const render = () => {
      const now = Date.now();
      const elapsed = (now - startTime) * 0.001;

      ctx.clearRect(0, 0, width, height);

      // Smooth inertia on mouse parallax
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.04;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.04;

      // 1. Draw subtle ambient flowing filaments in deep background
      if (!prefersReducedMotion) {
        for (const wisp of wisps) {
          ctx.save();
          ctx.beginPath();
          const baseY = height * wisp.yFraction;
          ctx.moveTo(-20, baseY);

          const step = 40;
          for (let x = -20; x <= width + 40; x += step) {
            const waveY =
              baseY +
              Math.sin(x * wisp.wavelength + elapsed * wisp.speed * 1000 + wisp.offset) *
                wisp.amplitude;
            ctx.lineTo(x, waveY);
          }

          ctx.strokeStyle = `${wisp.color} ${wisp.alpha})`;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = `${wisp.color} ${wisp.alpha * 0.6})`;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 2. Draw floating organic particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Floating buoyant motion
          p.y += p.vy;
          p.x +=
            Math.sin(elapsed * p.swaySpeed * 60 + p.swayOffset) * p.swayDistance +
            p.vx;

          // Wrap around top boundary
          if (p.y < -p.radius * 2) {
            particles[i] = createParticle(height + p.radius * 2);
            continue;
          }
          if (p.x < -p.radius * 2) p.x = width + p.radius;
          if (p.x > width + p.radius * 2) p.x = -p.radius;

          // Gentle breathing opacity pulse
          p.alpha = Math.max(
            0.02,
            p.baseAlpha +
              Math.sin(elapsed * p.pulseSpeed * 60 + p.pulseOffset) *
                (p.baseAlpha * 0.32)
          );
        }

        // Apply depth-based parallax position
        const drawX = p.x - currentParallaxX * p.depth;
        const drawY = p.y - currentParallaxY * p.depth;

        ctx.save();

        // Tiny glowing speck/firefly mote (pure particle, no blobs)
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.shadowColor = `${p.color} 0.95)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDark, count]);

  return (
    <div
      className={cn("pointer-events-none", className || "absolute inset-0 z-0")}
      aria-hidden="true"
    >
      {showAmbientGlows && isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
          {/* Unified ambient background glows - single consistent lighting source */}
          <div
            className="absolute top-1/3 left-0 -translate-y-1/2 -translate-x-1/3 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-earth-moss/20 to-earth-sand/15 blur-[140px] pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-1/4 right-0 translate-x-1/4 translate-y-1/4 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-earth-terracotta/20 to-earth-sand/10 blur-[130px] pointer-events-none"
            aria-hidden="true"
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none w-full h-full relative z-0"
      />
    </div>
  );
}
