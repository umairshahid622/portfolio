import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LOGOS, CURSOR_CONFIG } from "../constants";

gsap.registerPlugin(useGSAP);

export default function SmoothCursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Don't activate on touch/coarse devices
      if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
        return;
      }

      const ring = ringRef.current;
      const trailContainer = trailContainerRef.current;
      if (!ring || !trailContainer) return;

      // Set initial centering transform on ring so GSAP manages xPercent & yPercent
      gsap.set(ring, {
        xPercent: -50,
        yPercent: -50,
      });

      // Position helpers using gsap.quickTo for smooth, responsive 60/120fps tracking
      const xToRing = gsap.quickTo(ring, "x", { duration: 0.22, ease: "power2.out" });
      const yToRing = gsap.quickTo(ring, "y", { duration: 0.22, ease: "power2.out" });

      let isInitialized = false;
      let lastX = -1;
      let lastY = -1;
      let lastSpawnTime = 0;
      let logoIndex = 0;
      let isMoving = false;
      let stopTimer: ReturnType<typeof setTimeout> | null = null;

      const { DISTANCE_THRESHOLD, MIN_SPAWN_INTERVAL, STOP_DELAY } = CURSOR_CONFIG;
      const activeElements: HTMLDivElement[] = [];

      // Spawn next logo in synchronized order so every icon spawns
      const spawnLogo = (x: number, y: number, angleDeg: number) => {
        const logo = LOGOS[logoIndex];
        logoIndex = (logoIndex + 1) % LOGOS.length;

        // Create popup card
        const badge = document.createElement("div");
        badge.className =
          "cursor-logo-badge fixed top-0 left-0 pointer-events-none select-none z-[9998] flex flex-col items-center justify-center will-change-transform";

        // Random subtle rotation (-12deg to +12deg)
        const randomRot = gsap.utils.random(-14, 14);

        badge.innerHTML = `
          <div class="relative flex items-center justify-center size-10">
            <img
              src="${logo.src}"
              alt="${logo.name}"
              class="w-full h-full object-contain ${logo.isMonochrome ? "invert" : ""}"
            />
          </div>
        `;

        trailContainer.appendChild(badge);
        activeElements.push(badge);

        // Cull excess elements if moving very fast
        if (activeElements.length > 8) {
          const oldest = activeElements.shift();
          if (oldest && oldest.parentElement) {
            gsap.killTweensOf(oldest);
            oldest.remove();
          }
        }

        // Float direction slightly based on movement angle
        const driftX = Math.cos(angleDeg) * 15;
        const driftY = Math.sin(angleDeg) * 15 - 30; // slight upward lift

        // Set initial spawn coordinates centered on mouse
        gsap.set(badge, {
          x,
          y,
          xPercent: -50,
          yPercent: -50,
          scale: 0.2,
          rotation: randomRot,
          opacity: 0,
        });

        // Dynamic pop-in, float, and fade-out timeline
        const tl = gsap.timeline({
          onComplete: () => {
            const idx = activeElements.indexOf(badge);
            if (idx > -1) activeElements.splice(idx, 1);
            badge.remove();
          },
        });

        tl.to(badge, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "back.out(2)",
        }).to(
          badge,
          {
            x: `+=${driftX}`,
            y: `+=${driftY}`,
            scale: 0.75,
            opacity: 0,
            duration: 0.45,
            ease: "power2.inOut",
          },
          "+=0.25"
        );
      };

      let isHoveringInteractive = false;

      const onMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;

        if (!isInitialized) {
          isInitialized = true;
          lastX = clientX;
          lastY = clientY;
          lastSpawnTime = Date.now();
          isMoving = true;
          gsap.set(ring, {
            x: clientX,
            y: clientY,
            xPercent: -50,
            yPercent: -50,
            opacity: 1,
            scale: 1,
          });
          return;
        }

        // Update smooth cursor position
        xToRing(clientX);
        yToRing(clientY);

        // Every time cursor starts moving after being stopped
        if (!isMoving) {
          isMoving = true;
          lastX = clientX;
          lastY = clientY;
          lastSpawnTime = Date.now();
        }

        // Reset the idle stop timer on every mousemove
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = setTimeout(() => {
          isMoving = false;
        }, STOP_DELAY);

        // Check if currently hovering an interactive or hoverable element
        const target = e.target instanceof Element ? e.target : null;
        const isHovering =
          isHoveringInteractive ||
          !!target?.closest(
            'a, button, input, textarea, select, [role="button"], [data-cursor-hover], [role="link"], label, .cursor-pointer'
          );

        // Calculate travel distance
        const dx = clientX - lastX;
        const dy = clientY - lastY;
        const dist = Math.hypot(dx, dy);
        const now = Date.now();

        // Stop spawning icons while hovering something
        if (isHovering) {
          lastX = clientX;
          lastY = clientY;
          lastSpawnTime = now;
        } else if (dist >= DISTANCE_THRESHOLD && now - lastSpawnTime >= MIN_SPAWN_INTERVAL) {
          const moveAngle = Math.atan2(dy, dx);
          spawnLogo(clientX, clientY, moveAngle);
          lastX = clientX;
          lastY = clientY;
          lastSpawnTime = now;
        }
      };

      const onMouseDown = () => {
        gsap.to(ring, { scale: 0.85, duration: 0.15, ease: "power2.out" });
      };

      const onMouseUp = () => {
        gsap.to(ring, { scale: 1, duration: 0.2, ease: "back.out(2)" });
      };

      const onMouseEnter = () => {
        gsap.to(ring, { opacity: 1, duration: 0.25 });
        isMoving = false;
      };

      const onMouseLeave = () => {
        gsap.to(ring, { opacity: 0, duration: 0.25 });
        isMoving = false;
        if (stopTimer) clearTimeout(stopTimer);
      };

      // Hover expansion on interactive elements (buttons, links, inputs)
      const onMouseOver = (e: MouseEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        if (!target) return;

        const isInteractive = target.closest(
          'a, button, input, textarea, select, [role="button"], [data-cursor-hover], [role="link"], label, .cursor-pointer'
        );

        if (isInteractive) {
          isHoveringInteractive = true;
          gsap.to(ring, {
            scale: 1.45,
            opacity: 1,
            borderColor: "var(--color-terracotta)",
            backgroundColor: "color-mix(in srgb, var(--color-terracotta) 12%, transparent)",
            duration: 0.25,
            ease: "power2.out",
          });
        }
      };

      const onMouseOut = (e: MouseEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        if (!target) return;

        const isInteractive = target.closest(
          'a, button, input, textarea, select, [role="button"], [data-cursor-hover], [role="link"], label, .cursor-pointer'
        );
        const to = e.relatedTarget instanceof Element ? e.relatedTarget : null;
        const stayingInInteractive = to && to.closest(
          'a, button, input, textarea, select, [role="button"], [data-cursor-hover], [role="link"], label, .cursor-pointer'
        );

        if (isInteractive && !stayingInInteractive) {
          isHoveringInteractive = false;
          gsap.to(ring, {
            scale: 1,
            opacity: 1,
            borderColor: "color-mix(in srgb, var(--color-terracotta) 40%, transparent)",
            backgroundColor: "transparent",
            duration: 0.3,
            ease: "back.out(2)",
          });
        }
      };

      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      document.addEventListener("mouseenter", onMouseEnter);
      document.addEventListener("mouseleave", onMouseLeave);
      document.addEventListener("mouseover", onMouseOver, { passive: true });
      document.addEventListener("mouseout", onMouseOut, { passive: true });

      return () => {
        if (stopTimer) clearTimeout(stopTimer);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mouseenter", onMouseEnter);
        document.removeEventListener("mouseleave", onMouseLeave);
        document.removeEventListener("mouseover", onMouseOver);
        document.removeEventListener("mouseout", onMouseOut);
        activeElements.forEach((el) => {
          gsap.killTweensOf(el);
          el.remove();
        });
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="smooth-cursor-wrapper pointer-events-none">
      {/* Logos Popup Trail Layer */}
      <div
        ref={trailContainerRef}
        className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
      />

      {/* Smooth Cursor Follower Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 size-8 rounded-full border-2 border-earth-sand/40 pointer-events-none z-[9999] opacity-0 will-change-transform transition-[border-color,background-color] duration-200"
      />
    </div>
  );
}
