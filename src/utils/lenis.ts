import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

export interface ScrollToOptions {
  offset?: number;
  immediate?: boolean;
  lock?: boolean;
  duration?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

/**
 * Initializes the Lenis smooth scrolling instance and synchronizes
 * it with GSAP's RAF ticker and ScrollTrigger updates.
 */
export function initLenis(): Lenis {
  if (typeof window === "undefined") {
    return null as unknown as Lenis;
  }

  if (lenisInstance) {
    return lenisInstance;
  }

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // Synchronize Lenis scroll position with GSAP ScrollTrigger
  lenisInstance.on("scroll", ScrollTrigger.update);

  // Hook into GSAP's high-frequency RAF ticker so physics, GSAP, and Three.js stay in 100% lockstep
  tickerCallback = (time: number) => {
    lenisInstance?.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);

  // Turn off GSAP's lagSmoothing to avoid micro-stutter during rapid direction changes
  gsap.ticker.lagSmoothing(0);

  return lenisInstance;
}

/**
 * Returns the active Lenis instance, if initialized.
 */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Smoothly scrolls to a target (number, CSS selector, or HTMLElement)
 * using Lenis momentum scrolling with a fallback to window.scrollTo.
 */
export function scrollTo(
  target: number | string | HTMLElement,
  options?: ScrollToOptions
) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      duration: options?.duration ?? 1.2,
      immediate: options?.immediate ?? false,
      offset: options?.offset ?? 0,
      lock: options?.lock ?? false,
      easing: options?.easing,
      onComplete: options?.onComplete,
    });
    return;
  }

  if (typeof window === "undefined") return;

  const isImmediate = options?.immediate ?? false;
  const behavior = isImmediate ? "instant" : "smooth";

  if (typeof target === "number") {
    window.scrollTo({
      top: target + (options?.offset ?? 0),
      behavior,
    });
  } else if (typeof target === "string") {
    const el = document.querySelector(target);
    if (el) {
      el.scrollIntoView({ behavior });
    }
  } else if (target instanceof HTMLElement) {
    target.scrollIntoView({ behavior });
  }

  if (options?.onComplete) {
    setTimeout(options.onComplete, isImmediate ? 20 : 600);
  }
}

/**
 * Pauses Lenis smooth scrolling (e.g., when modal or mobile menu drawer is open).
 */
export function stopScroll() {
  lenisInstance?.stop();
}

/**
 * Resumes Lenis smooth scrolling.
 */
export function startScroll() {
  lenisInstance?.start();
}

/**
 * Destroys the active Lenis instance and cleans up GSAP ticker handlers.
 */
export function destroyLenis() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}
