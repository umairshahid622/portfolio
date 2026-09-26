import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";

// Import all 165 frames eagerly via Vite
const rawFrameModules = import.meta.glob<string>(
  "../assets/meUsingLaptop_frames/frame_*.png",
  { eager: true, import: "default" }
);

// Sort frames numerically by frame number (frame_001 -> 1 .. frame_165 -> 165)
const sortedFrameKeys = Object.keys(rawFrameModules).sort((a, b) => {
  const numA = parseInt(a.match(/frame_(\d+)\.png/)?.[1] || "0", 10);
  const numB = parseInt(b.match(/frame_(\d+)\.png/)?.[1] || "0", 10);
  return numA - numB;
});

const frameUrls = sortedFrameKeys.map((key) => rawFrameModules[key]);
const TOTAL_FRAMES = frameUrls.length; // 165

export default function Hero() {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store preloaded Image objects
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());

  // Animation state object for GSAP
  const animTarget = useRef<{ frame: number }>({
    frame: isDark ? TOTAL_FRAMES : 1,
  });
  const isFirstRender = useRef(true);

  // Draw image with cover behavior to fill full canvas width and height
  const drawCover = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      let drawWidth = canvasWidth;
      let drawHeight = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvasWidth / imgRatio;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        drawWidth = canvasHeight * imgRatio;
        // Bias framing slightly towards Umair (left-center) on portrait screens
        offsetX = (canvasWidth - drawWidth) * 0.34;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    },
    []
  );

  // Render a specific frame number (1-based: 1..TOTAL_FRAMES)
  const renderFrame = useCallback(
    (frameNumber: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const clampedFrame = Math.round(
        Math.max(1, Math.min(TOTAL_FRAMES, frameNumber))
      );

      // Try exact frame, or find nearest loaded frame to eliminate black/flicker
      let img = imagesRef.current.get(clampedFrame);
      if (!img || !img.complete || img.naturalWidth === 0) {
        let bestDist = Infinity;
        let fallbackImg: HTMLImageElement | null = null;
        for (const [fNum, loadedImg] of imagesRef.current.entries()) {
          if (loadedImg.complete && loadedImg.naturalWidth > 0) {
            const dist = Math.abs(fNum - clampedFrame);
            if (dist < bestDist) {
              bestDist = dist;
              fallbackImg = loadedImg;
            }
          }
        }
        img = fallbackImg ?? undefined;
      }

      if (img && img.complete && img.naturalWidth > 0) {
        drawCover(ctx, img, canvas.width, canvas.height);
      }
    },
    [drawCover]
  );

  // Resize canvas to match full-screen container dimensions with DPR scaling
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    renderFrame(animTarget.current.frame);
  }, [renderFrame]);

  // Set up ResizeObserver to keep canvas razor-sharp across all screen sizes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  // Preload frames prioritizing initial frame & opposite frame, then batching
  useEffect(() => {
    let isCancelled = false;

    const initialTargetFrame = isDark ? TOTAL_FRAMES : 1;
    const oppositeTargetFrame = isDark ? 1 : TOTAL_FRAMES;

    const priorityOrder = [
      initialTargetFrame,
      oppositeTargetFrame,
      ...Array.from({ length: TOTAL_FRAMES }, (_, i) => i + 1).filter(
        (f) => f !== initialTargetFrame && f !== oppositeTargetFrame
      ),
    ];

    const loadImage = (frameNum: number): Promise<void> => {
      return new Promise((resolve) => {
        if (imagesRef.current.has(frameNum)) {
          resolve();
          return;
        }

        const img = new Image();
        const url = frameUrls[frameNum - 1];
        img.src = url;

        img.onload = () => {
          if (isCancelled) return;
          imagesRef.current.set(frameNum, img);

          if (frameNum === initialTargetFrame) {
            resizeCanvas();
          }
          resolve();
        };

        img.onerror = () => {
          resolve();
        };
      });
    };

    (async () => {
      await loadImage(initialTargetFrame);
      if (isCancelled) return;
      await loadImage(oppositeTargetFrame);
      if (isCancelled) return;

      const remaining = priorityOrder.slice(2);
      const concurrency = 16;
      for (let i = 0; i < remaining.length; i += concurrency) {
        if (isCancelled) break;
        const chunk = remaining.slice(i, i + concurrency);
        await Promise.all(chunk.map((f) => loadImage(f)));
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isDark, resizeCanvas]);

  // GSAP Theme Switch Animation
  useEffect(() => {
    const targetFrame = isDark ? TOTAL_FRAMES : 1;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      animTarget.current.frame = targetFrame;
      renderFrame(targetFrame);
      return;
    }

    gsap.killTweensOf(animTarget.current);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const diff = Math.abs(animTarget.current.frame - targetFrame);
    const duration = prefersReducedMotion
      ? 0.05
      : Math.max(0.7, (diff / TOTAL_FRAMES) * 2.2);

    const tween = gsap.to(animTarget.current, {
      frame: targetFrame,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        renderFrame(animTarget.current.frame);
      },
      onComplete: () => {
        renderFrame(targetFrame);
      },
    });

    return () => {
      tween.kill();
    };
  }, [isDark, renderFrame]);

  // Animate the hero copy on mount with masked line reveals (StrictMode-safe)
  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      const tl = gsap.timeline({
        delay: 0.55,
        defaults: { ease: "expo.out" },
      });

      tl.from(".hero-eyebrow", { yPercent: 130, opacity: 0, duration: 0.9 })
        .from(
          ".hero-name-line",
          { yPercent: 115, opacity: 0, duration: 1.1 },
          "-=0.55"
        )
        .from(".hero-tagline", { y: 26, opacity: 0, duration: 0.9 }, "-=0.7");
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-screen min-h-screen relative overflow-hidden flex items-center justify-center p-0 m-0"
    >
      <canvas ref={canvasRef} className="w-full h-full block object-cover" />

      {/* Animated hero copy layered over the canvas */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-32 md:px-12 md:pb-28">
          <div className="overflow-hidden">
            <p className="hero-eyebrow flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-orange md:text-sm">
              <span className="inline-block h-px w-8 bg-brand-orange md:w-12" />
              Full-Stack Developer
            </p>
          </div>

          <div className="mt-3 overflow-hidden pb-[0.15em] md:mt-4">
            <h1 className="hero-name-line text-5xl leading-[0.9] text-white sm:text-6xl md:text-8xl lg:text-9xl">
              Umair <span className="font-heading text-brand-orange">Shahid</span>
            </h1>
          </div>

          <p className="hero-tagline mt-5 max-w-xl text-base text-white/90 md:mt-6 md:text-lg">
            Developing Modern Full-Stack Applications
          </p>
        </div>
      </div>
    </div>
  );
}
