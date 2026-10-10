import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLoading } from "../context/LoadingContext";
import TextSpiralWrap from "./TextSpiralWrap";
import AtmosphericVeils from "./AtmosphericVeils";
import AppButton from "./AppButton";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  let curtainParting = true;
  try {
    const loading = useLoading();
    curtainParting = loading.curtainParting;
  } catch {
    // Graceful fallback when outside LoadingProvider
  }

  const hasAnimatedRef = useRef(false);

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

      if (prefersReducedMotion) {
        hasAnimatedRef.current = true;
        gsap.set([umairEl, shahidEl], { opacity: 1, scale: 1, y: 0 });
        if (roleEl) gsap.set(roleEl, { opacity: 1, scale: 1, y: 0 });
        if (taglineEl) gsap.set(taglineEl, { opacity: 1, y: 0 });
        if (ctasEl) gsap.set(ctasEl, { opacity: 1, y: 0 });
        return;
      }

      // If already started or animated, never restart or interrupt the timeline
      if (hasAnimatedRef.current) {
        return;
      }

      // Keep hidden until curtain begins parting
      if (!curtainParting) {
        gsap.set([umairEl, shahidEl], {
          opacity: 0,
          scale: 0.88,
          y: 28,
        });
        if (roleEl) gsap.set(roleEl, { opacity: 0, scale: 0.9, y: 22 });
        if (taglineEl) gsap.set(taglineEl, { opacity: 0, y: 18 });
        if (ctasEl) gsap.set(ctasEl, { opacity: 0, y: 20 });
        return;
      }

      hasAnimatedRef.current = true;

      const tl = gsap.timeline({
        delay: 0.45,
        defaults: { ease: "power3.out" },
      });

      if (typeof window !== "undefined") {
        (window as any).__heroTimeline = tl;
      }

      // 1: Umair & Shahid entrance with scale & bounce
      tl.to([umairEl, shahidEl], {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: "back.out(1.8)",
        clearProps: "transform",
      });

      // 2: Reveal "Full-stack Developer"
      if (roleEl) {
        tl.to(
          roleEl,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            ease: "back.out(1.6)",
            clearProps: "transform",
          },
          "-=0.4"
        );
      }

      // 3: Reveal tagline
      if (taglineEl) {
        tl.to(
          taglineEl,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            clearProps: "transform",
          },
          "-=0.3"
        );
      }

      // 4: Reveal CTA buttons smoothly with slide-up and fade-in (no scale pop)
      if (ctasEl) {
        tl.to(
          ctasEl,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            clearProps: "transform",
          },
          "-=0.25"
        );
      }
    },
    { scope: containerRef, dependencies: [curtainParting] }
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative z-20 w-full min-h-screen flex flex-col justify-center items-center py-20 px-5 sm:px-8 md:px-12 overflow-hidden bg-earth-forest text-earth-cream"
    >
      {/* Subtle grid pattern overlay */}
      <div className="hero-grid-pattern absolute inset-0 pointer-events-none -z-10 opacity-[0.03]" />

      {/* Atmospheric SVG Veils, Self-Drawing Bubble Spirals & Randomly Popping GSAP Bubbles */}
      <AtmosphericVeils className="absolute inset-0 pointer-events-none z-0" />

      {/* Main Hero Content */}
      <div className="hero-main-content w-full max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center my-auto z-10 px-4 sm:px-6 md:px-8 pointer-events-none">
        <div className="relative w-full flex flex-col items-center justify-center text-center">
          {/* Main Title: Umair Shahid */}
          <h1 className="w-full flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 select-none pointer-events-none text-center">
            <span className="hero-popout-umair opacity-0 inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-earth-cream leading-none will-change-transform pointer-events-auto">
              <TextSpiralWrap>Umair</TextSpiralWrap>
            </span>
            <span className="hero-popout-shahid opacity-0 inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-earth-sand leading-none will-change-transform pointer-events-auto">
              <TextSpiralWrap>Shahid</TextSpiralWrap>
            </span>
          </h1>

          {/* Subcontent: Role, Tagline, CTAs */}
          <div className="pt-4 sm:pt-6 md:pt-8 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 pointer-events-none">
            <h2 className="hero-popout-role opacity-0 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-earth-cream/90 tracking-tight text-center will-change-transform pointer-events-auto">
              <TextSpiralWrap strokeWidth={2}>Full-stack Developer</TextSpiralWrap>
            </h2>

            <p className="hero-popout-tagline opacity-0 text-sm sm:text-base md:text-lg text-earth-cream/75 max-w-xl font-medium tracking-wide text-center will-change-transform pointer-events-auto px-4">
              Engineering scalable solutions across web & mobile
            </p>

            <div
              className="hero-popout-ctas flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 pt-2 sm:pt-3 will-change-transform pointer-events-auto"
              style={{ opacity: 0 }}
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
