import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

interface Particle {
  x: number;
  y: number;
  radius: number;
  type: "ring" | "orb" | "mote";
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
  lineWidth: number;
  depth: number; // 0.5 (far) to 1.5 (near) for parallax & speed
  hasCompanion?: boolean;
  companionOffsetX?: number;
  companionOffsetY?: number;
  companionRadius?: number;
  highlightAngle?: number;
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
}

export default function BackgroundParticles({
  className = "",
  count = 46,
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

    // Rich palette matching earth theme
    const colorsDark = [
      "rgba(221, 161, 94,",  // Warm Sand #dda15e
      "rgba(188, 108, 37,",  // Terracotta #bc6c25
      "rgba(254, 250, 224,", // Warm Cream #fefae0
      "rgba(140, 155, 90,",  // Mellow Olive/Moss
      "rgba(235, 185, 110,", // Glowing Amber
    ];

    const colorsLight = [
      "rgba(188, 108, 37,",  // Terracotta
      "rgba(96, 108, 56,",   // Moss
      "rgba(221, 161, 94,",  // Sand
      "rgba(40, 54, 24,",    // Deep Forest
    ];

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

    // Deep background flowing filaments/wisps (as seen faintly in reference)
    const wisps: AmbientWisp[] = [
      {
        yFraction: 0.22,
        amplitude: 45,
        wavelength: 0.0018,
        speed: 0.0003,
        color: isDark ? "rgba(96, 108, 56," : "rgba(188, 108, 37,",
        alpha: isDark ? 0.09 : 0.05,
        offset: 0,
      },
      {
        yFraction: 0.58,
        amplitude: 65,
        wavelength: 0.0012,
        speed: -0.00025,
        color: isDark ? "rgba(221, 161, 94," : "rgba(96, 108, 56,",
        alpha: isDark ? 0.06 : 0.04,
        offset: 2.5,
      },
      {
        yFraction: 0.82,
        amplitude: 50,
        wavelength: 0.0015,
        speed: 0.0002,
        color: isDark ? "rgba(188, 108, 37," : "rgba(221, 161, 94,",
        alpha: isDark ? 0.05 : 0.03,
        offset: 4.1,
      },
    ];

    // Initialize particles
    const particles: Particle[] = [];

    const createParticle = (spawnY?: number): Particle => {
      const typeRoll = Math.random();
      let type: "ring" | "orb" | "mote";
      let radius: number;
      let baseAlpha: number;
      let lineWidth = 1.1;
      let hasCompanion = false;
      let companionOffsetX = 0;
      let companionOffsetY = 0;
      let companionRadius = 0;
      const highlightAngle = Math.random() * Math.PI * 2;

      if (typeRoll < 0.16) {
        // Hollow ring / bubble outline (greatly reduced amount for subtlety)
        type = "ring";
        radius = 9 + Math.random() * 20; // 9px to 29px
        baseAlpha = isDark
          ? 0.14 + Math.random() * 0.2
          : 0.1 + Math.random() * 0.16;
        lineWidth = 0.9 + Math.random() * 0.8;

        // Rare twin companion bubble
        if (Math.random() < 0.15) {
          hasCompanion = true;
          const offsetDist = radius * (1.1 + Math.random() * 0.6);
          const angle = Math.random() * Math.PI * 2;
          companionOffsetX = Math.cos(angle) * offsetDist;
          companionOffsetY = Math.sin(angle) * offsetDist;
          companionRadius = radius * (0.45 + Math.random() * 0.35);
        }
      } else if (typeRoll < 0.60) {
        // Soft glowing bokeh orb
        type = "orb";
        radius = 16 + Math.random() * 34; // 16px to 50px
        baseAlpha = isDark
          ? 0.04 + Math.random() * 0.1
          : 0.03 + Math.random() * 0.07;
      } else {
        // Luminous micro dust mote / glowing spark
        type = "mote";
        radius = 1.0 + Math.random() * 1.8;
        baseAlpha = isDark
          ? 0.35 + Math.random() * 0.45
          : 0.25 + Math.random() * 0.35;
      }

      const colorPrefix =
        activeColors[Math.floor(Math.random() * activeColors.length)];
      const depth = 0.6 + Math.random() * 0.8; // Parallax depth layer

      return {
        x: Math.random() * width,
        y: spawnY !== undefined ? spawnY : Math.random() * height,
        radius,
        type,
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
        lineWidth,
        depth,
        hasCompanion,
        companionOffsetX,
        companionOffsetY,
        companionRadius,
        highlightAngle,
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

        if (p.type === "ring") {
          // Hollow ring outline with soft glowing rim
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${p.color} ${p.alpha})`;
          ctx.lineWidth = p.lineWidth;
          ctx.shadowColor = `${p.color} 0.45)`;
          ctx.shadowBlur = 6;
          ctx.stroke();

          // Subtle inner bubble wash for glassy depth
          ctx.fillStyle = `${p.color} ${p.alpha * 0.035})`;
          ctx.fill();

          // Highlight crescent arc on one edge for authentic bubble reflection
          if (p.highlightAngle !== undefined) {
            ctx.beginPath();
            ctx.arc(
              drawX,
              drawY,
              p.radius,
              p.highlightAngle,
              p.highlightAngle + 0.9
            );
            ctx.strokeStyle = `${p.color} ${Math.min(1, p.alpha * 1.6)})`;
            ctx.lineWidth = p.lineWidth * 1.35;
            ctx.shadowColor = `${p.color} 0.7)`;
            ctx.shadowBlur = 8;
            ctx.stroke();
          }

          // Companion bubble if present (twin bubble from reference)
          if (p.hasCompanion && p.companionRadius) {
            const compX = drawX + (p.companionOffsetX || 0);
            const compY = drawY + (p.companionOffsetY || 0);
            ctx.beginPath();
            ctx.arc(compX, compY, p.companionRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `${p.color} ${p.alpha * 0.8})`;
            ctx.lineWidth = p.lineWidth * 0.85;
            ctx.shadowColor = `${p.color} 0.35)`;
            ctx.shadowBlur = 5;
            ctx.stroke();
          }
        } else if (p.type === "orb") {
          // Soft radial bokeh disc
          const grad = ctx.createRadialGradient(
            drawX,
            drawY,
            0,
            drawX,
            drawY,
            p.radius
          );
          grad.addColorStop(0, `${p.color} ${p.alpha * 0.8})`);
          grad.addColorStop(0.5, `${p.color} ${p.alpha * 0.4})`);
          grad.addColorStop(1, `${p.color} 0)`);

          ctx.beginPath();
          ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        } else {
          // Tiny glowing speck/firefly mote
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color} ${p.alpha})`;
          ctx.shadowColor = `${p.color} 0.95)`;
          ctx.shadowBlur = 7;
          ctx.fill();
        }

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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none w-full h-full ${className || "absolute inset-0 z-0"}`}
    />
  );
}
