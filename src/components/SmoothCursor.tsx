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
      let lastSpawnX = -1;
      let lastSpawnY = -1;
      let logoIndex = 0;
      let isMoving = false;
      let currentZIndex = 1000;
      let stopTimer: ReturnType<typeof setTimeout> | null = null;

      const {
        DISTANCE_THRESHOLD,
        STOP_DELAY,
        MAX_STACK_SIZE,
        STACK_HOLD_DURATION,
      } = CURSOR_CONFIG;
      const activeElements: HTMLDivElement[] = [];

      // Spawn next logo in stack formation with overlapping edges
      const spawnLogo = (x: number, y: number) => {
        const logo = LOGOS[logoIndex];
        logoIndex = (logoIndex + 1) % LOGOS.length;

        // Alternate subtle tilt (-8deg to +8deg) for natural fanned stack look
        const tiltSign = logoIndex % 2 === 0 ? 1 : -1;
        const randomRot = tiltSign * gsap.utils.random(4, 9);

        // Keep increasing z-index so every newly spawned card sits on top of the stack
        currentZIndex++;

        // Create popup card
        const badge = document.createElement("div");
        badge.className =
          "cursor-logo-badge fixed top-0 left-0 pointer-events-none select-none flex flex-col items-center justify-center will-change-transform";
        badge.style.zIndex = currentZIndex.toString();

        badge.innerHTML = `
          <div class="relative flex items-center justify-center size-10">
            <img
              src="${logo.src}"
              alt="${logo.name}"
              class="w-full h-full object-contain ${logo.isMonochrome ? "invert" : ""}"
              draggable="false"
            />
          </div>
        `;

        trailContainer.appendChild(badge);
        activeElements.push(badge);

        // Cull oldest element smoothly when stack exceeds max size
        if (activeElements.length > MAX_STACK_SIZE) {
          const oldest = activeElements.shift();
          if (oldest && oldest.parentElement) {
            gsap.killTweensOf(oldest);
            gsap.to(oldest, {
              scale: 0.7,
              opacity: 0,
              duration: 0.18,
              ease: "power2.in",
              onComplete: () => {
                oldest.remove();
              },
            });
          }
        }

        // Set initial spawn coordinates centered on position with initial scale pop
        gsap.set(badge, {
          x,
          y,
          xPercent: -50,
          yPercent: -50,
          scale: 0.3,
          rotation: randomRot,
          opacity: 0,
        });

        // Dynamic pop-in onto the stack, hold in stacked place, and smoothly fade out
        const tl = gsap.timeline({
          onComplete: () => {
            const idx = activeElements.indexOf(badge);
            if (idx > -1) activeElements.splice(idx, 1);
            badge.remove();
            if (activeElements.length === 0) {
              currentZIndex = 1000;
            }
          },
        });

        tl.to(badge, {
          scale: 1,
          opacity: 1,
          duration: 0.22,
          ease: "back.out(2.2)",
        }).to(
          badge,
          {
            scale: 0.7,
            opacity: 0,
            duration: 0.28,
            ease: "power2.in",
          },
          `+=${STACK_HOLD_DURATION}`
        );
      };

      let isHoveringInteractive = false;

      const onMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;

        if (!isInitialized) {
          isInitialized = true;
          lastSpawnX = clientX;
          lastSpawnY = clientY;
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
          lastSpawnX = clientX;
          lastSpawnY = clientY;
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

        // Calculate travel distance from the last spawn position
        const dx = clientX - lastSpawnX;
        const dy = clientY - lastSpawnY;
        const dist = Math.hypot(dx, dy);

        // Stop spawning icons while hovering interactive elements
        if (isHovering) {
          lastSpawnX = clientX;
          lastSpawnY = clientY;
        } else if (dist >= DISTANCE_THRESHOLD) {
          // Step along the movement vector to ensure seamless overlapping edges in the stack
          const numSteps = Math.min(Math.floor(dist / DISTANCE_THRESHOLD), 4);

          for (let s = 1; s <= numSteps; s++) {
            const stepDist = s * DISTANCE_THRESHOLD;
            const spawnX = lastSpawnX + (dx * stepDist) / dist;
            const spawnY = lastSpawnY + (dy * stepDist) / dist;
            spawnLogo(spawnX, spawnY);
          }

          lastSpawnX = lastSpawnX + (dx * (numSteps * DISTANCE_THRESHOLD)) / dist;
          lastSpawnY = lastSpawnY + (dy * (numSteps * DISTANCE_THRESHOLD)) / dist;
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
