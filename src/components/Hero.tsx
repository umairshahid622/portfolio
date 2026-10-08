import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../context/ThemeContext";
import { useLoading } from "../context/LoadingContext";
import AvatarCanvas from "./AvatarCanvas";
import TextSpiralWrap from "./TextSpiralWrap";
import AtmosphericVeils from "./AtmosphericVeils";
import AppButton from "./AppButton";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { isDark } = useTheme();

  let curtainParting = true;
  let isCurtainComplete = false;
  try {
    const loading = useLoading();
    curtainParting = loading.curtainParting;
    isCurtainComplete = loading.isCurtainComplete;
  } catch {
    // Graceful fallback when outside LoadingProvider
  }

  const hasAnimatedRef = useRef(false);
  const hasReunitedRef = useRef(false);

  // Helper to calculate the shift needed to unite Umair & Shahid with an optimal word space
  const calculateReuniteShift = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 0;
    const umairEl = container.querySelector<HTMLElement>(".hero-popout-umair");
    const shahidEl = container.querySelector<HTMLElement>(".hero-popout-shahid");
    if (!umairEl || !shahidEl) return 0;

    // Temporarily measure untransformed gap
    const prevUX = gsap.getProperty(umairEl, "x") as number;
    const prevSX = gsap.getProperty(shahidEl, "x") as number;
    gsap.set([umairEl, shahidEl], { x: 0 });
    const uRect = umairEl.getBoundingClientRect();
    const sRect = shahidEl.getBoundingClientRect();
    gsap.set(umairEl, { x: prevUX });
    gsap.set(shahidEl, { x: prevSX });

    const rawGap = Math.max(0, sRect.left - uRect.right);
    const wordGap = Math.min(24, Math.max(12, uRect.height * 0.24));
    return Math.max(0, (rawGap - wordGap) / 2);
  }, []);

  // Handler triggered when the avatar entrance animation completes
  const handleAnimationComplete = useCallback(() => {
    if (hasReunitedRef.current) return;
    hasReunitedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    const umairEl = container.querySelector<HTMLElement>(".hero-popout-umair");
    const shahidEl = container.querySelector<HTMLElement>(".hero-popout-shahid");
    const roleEl = container.querySelector<HTMLElement>(".hero-popout-role");
    const taglineEl = container.querySelector<HTMLElement>(".hero-popout-tagline");
    const ctasEl = container.querySelector<HTMLElement>(".hero-popout-ctas");

    if (!umairEl || !shahidEl) return;

    const finalShiftX = calculateReuniteShift();

    const reunionTl = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    // 1: Umair & Shahid reunite into 1 unified heading
    reunionTl.to(umairEl, {
      x: finalShiftX,
      duration: 0.95,
      ease: "power3.inOut",
    });

    reunionTl.to(
      shahidEl,
      {
        x: -finalShiftX,
        duration: 0.95,
        ease: "power3.inOut",
      },
      "<" // reunite simultaneously
    );

    // 2: Reveal "Full-stack Developer" below "Umair Shahid"
    if (roleEl) {
      reunionTl.to(
        roleEl,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.8)",
        },
        "-=0.3"
      );
    }

    // 3: Reveal "Developing Modern Full-Stack Applications" tagline below role
    if (taglineEl) {
      reunionTl.to(
        taglineEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.2"
      );
    }

    // 4: Reveal "Contact Me" and "Download Resume" buttons
    if (ctasEl) {
      reunionTl.to(
        ctasEl,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.55,
          ease: "back.out(1.6)",
        },
        "-=0.2"
      );
    }
  }, [calculateReuniteShift]);

  // Keep reunited title position mathematically centered across browser resize
  useEffect(() => {
    const handleResize = () => {
      if (!hasReunitedRef.current || !containerRef.current) return;
      const umairEl = containerRef.current.querySelector<HTMLElement>(".hero-popout-umair");
      const shahidEl = containerRef.current.querySelector<HTMLElement>(".hero-popout-shahid");
      if (!umairEl || !shahidEl) return;

      const finalShiftX = calculateReuniteShift();
      gsap.set(umairEl, { x: finalShiftX });
      gsap.set(shahidEl, { x: -finalShiftX });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [calculateReuniteShift]);

  // Entrance animations using GSAP
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const umairEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-umair");
      const shahidEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-shahid");
      const roleEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-role");
      const taglineEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-tagline");
      const ctasEl = containerRef.current?.querySelector<HTMLElement>(".hero-popout-ctas");

      if (!umairEl || !shahidEl) return;

      if (prefersReducedMotion || hasAnimatedRef.current) {
        hasAnimatedRef.current = true;
        hasReunitedRef.current = true;
        const finalShiftX = calculateReuniteShift();
        gsap.set(umairEl, { opacity: 1, scale: 1, x: finalShiftX });
        gsap.set(shahidEl, { opacity: 1, scale: 1, x: -finalShiftX });
        if (roleEl) gsap.set(roleEl, { opacity: 1, scale: 1, y: 0 });
        if (taglineEl) gsap.set(taglineEl, { opacity: 1, y: 0 });
        if (ctasEl) gsap.set(ctasEl, { opacity: 1, scale: 1, y: 0 });
        gsap.set(".hero-main-content", { zIndex: 30 });
        return;
      }

      // Keep hidden until curtain begins parting
      if (!curtainParting) {
        gsap.set([umairEl, shahidEl], {
          opacity: 0,
          scale: 0.2,
        });
        if (roleEl) gsap.set(roleEl, { opacity: 0, scale: 0.8, y: 25 });
        if (taglineEl) gsap.set(taglineEl, { opacity: 0, y: 20 });
        if (ctasEl) gsap.set(ctasEl, { opacity: 0, scale: 0.85, y: 20 });
        return;
      }

      hasAnimatedRef.current = true;

      // Measure gap between elements to achieve exact 0px space between them at center
      gsap.set([umairEl, shahidEl], { x: 0, scale: 1 });
      const umairRect = umairEl.getBoundingClientRect();
      const shahidRect = shahidEl.getBoundingClientRect();
      const shiftX = Math.max(0, (shahidRect.left - umairRect.right) / 2);

      // Synchronize with curtain reveal: start as curtains open wide enough (~0.75s after parting start)
      // or immediately if curtain is already complete
      const startDelay = isCurtainComplete ? 0.1 : 0.75;

      const tl = gsap.timeline({
        delay: startDelay,
      });

      if (typeof window !== "undefined") {
        (window as any).__heroTimeline = tl;
      }

      // Initialize at timeline time 0:
      // Umair and Shahid start joined at the center with 0 space between them, hidden
      tl.set(
        umairEl,
        {
          x: shiftX,
          scale: 0.2,
          opacity: 0,
          transformOrigin: "center center",
        },
        0
      );

      tl.set(
        shahidEl,
        {
          x: -shiftX,
          scale: 0.2,
          opacity: 0,
          transformOrigin: "center center",
        },
        0
      );

      if (roleEl) tl.set(roleEl, { opacity: 0, scale: 0.8, y: 25 }, 0);
      if (taglineEl) tl.set(taglineEl, { opacity: 0, y: 20 }, 0);
      if (ctasEl) tl.set(ctasEl, { opacity: 0, scale: 0.85, y: 20 }, 0);

      // 1: The Text Popout with 0 space between them at the center (behind 3D character)
      tl.to([umairEl, shahidEl], {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(2.2)",
      });

      // Brief hold so user appreciates the connected name
      tl.to({}, { duration: 0.3 });

      // 2: Both Umair and Shahid separate to their flanking positions for the avatar to emerge
      tl.to(
        umairEl,
        {
          x: 0,
          duration: 0.85,
          ease: "power3.inOut",
        }
      );
      tl.to(
        shahidEl,
        {
          x: 0,
          duration: 0.85,
          ease: "power3.inOut",
        },
        "<" // Part symmetrically at the exact same moment
      );

      // Once separation completes, promote text layer above character layer
      tl.set(".hero-main-content", { zIndex: 30 });
    },
    { scope: containerRef, dependencies: [curtainParting, calculateReuniteShift, handleAnimationComplete] }
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative z-20 w-full min-h-screen flex flex-col justify-center items-center py-16 px-5 sm:px-8 md:px-12 overflow-hidden bg-earth-cream dark:bg-earth-forest text-earth-forest dark:text-earth-cream transition-colors duration-300"
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-[0.03] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Atmospheric SVG Veils, Self-Drawing Bubble Spirals & Randomly Popping GSAP Bubbles */}
      <AtmosphericVeils className="absolute inset-0 pointer-events-none z-0" />

      {/* 3D Avatar Character Layer - z-20 so inner letters are behind the character during popout */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <AvatarCanvas
          isDark={isDark}
          onWalkComplete={handleAnimationComplete}
        />
      </div>

      {/* Main Hero Content - z-10 so it emerges from behind the 3D character */}
      <div className="hero-main-content w-full max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center my-auto z-10 px-4 sm:px-6 md:px-8 pointer-events-none">
        {/* Central Anchor: stays in the exact middle of the screen */}
        <div className="relative w-full flex flex-col items-center justify-center">
          <h1 className="w-full flex items-center justify-between select-none pointer-events-none">
            {/* Left Wing: Umair */}
            <div className="flex-1 flex justify-end overflow-visible pr-2 sm:pr-4 md:pr-8 lg:pr-10 pointer-events-none">
              <span
                style={{ opacity: 0 }}
                className="hero-popout-umair block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-earth-forest dark:text-earth-cream leading-none text-right will-change-transform pointer-events-auto"
              >
                <TextSpiralWrap>Umair</TextSpiralWrap>
              </span>
            </div>

            {/* Central Corridor for 3D Character */}
            <div
              className="w-36 shrink-0 pointer-events-none"
              aria-hidden="true"
            />

            {/* Right Wing: Shahid */}
            <div className="flex-1 flex justify-start overflow-visible pl-2 sm:pl-4 md:pl-8 lg:pl-10 pointer-events-none">
              <span
                style={{ opacity: 0 }}
                className="hero-popout-shahid block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-earth-terracotta dark:text-earth-sand leading-none text-left will-change-transform pointer-events-auto"
              >
                <TextSpiralWrap>Shahid</TextSpiralWrap>
              </span>
            </div>
          </h1>

          {/* Revealed Content: positioned directly below H1 */}
          <div className="absolute top-full left-0 right-0 pt-3 sm:pt-4 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-2.5 pointer-events-none">
            <h2
              style={{ opacity: 0 }}
              className="hero-popout-role text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-earth-forest/90 dark:text-earth-cream/90 tracking-tight text-center will-change-transform pointer-events-auto"
            >
              <TextSpiralWrap strokeWidth={2}>Full-stack Developer</TextSpiralWrap>
            </h2>

            <p
              style={{ opacity: 0 }}
              className="hero-popout-tagline text-xs sm:text-sm md:text-base text-earth-forest/75 dark:text-earth-cream/75 max-w-lg font-medium tracking-wide text-center will-change-transform pointer-events-auto px-4"
            >
              Engineering scalable solutions across web & mobile
            </p>

            <div
              style={{ opacity: 0 }}
              className="hero-popout-ctas flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-1 sm:pt-1.5 will-change-transform pointer-events-auto"
            >
              <AppButton
                href="#contact"
                variant="primary"
                size="md"
                icon="arrow-right"
                iconPosition="right"
              >
                Contact Me
              </AppButton>
              <AppButton
                href="/Resume.pdf"
                target="_blank"
                download="Resume.pdf"
                variant="outline"
                size="md"
                icon="download"
                iconPosition="right"
              >
                Download Resume
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
