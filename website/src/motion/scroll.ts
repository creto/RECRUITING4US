import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/media";

/**
 * One scroll engine for the whole site.
 *
 * Lenis gives a short, snappy inertia (lerp 0.14, no "floaty" delay) and is
 * driven by GSAP's ticker so ScrollTrigger and Lenis share one clock and never
 * desync. Reduced motion: Lenis is not created at all; native scroll plus
 * ScrollTrigger still work, and every scrubbed timeline renders its final or
 * a static state (see useScrub / sections).
 */
gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

export function initScroll() {
  if (lenis || prefersReducedMotion()) return () => undefined;
  lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function headerOffset() {
  return window.innerWidth < 1100 ? -72 : -24;
}

/** Scroll to a section id; works with and without Lenis. */
export function scrollToId(id: string, immediate = false) {
  const el = document.getElementById(id);
  if (!el) return false;
  if (lenis) {
    lenis.scrollTo(el, { offset: headerOffset(), immediate, duration: 1.1 });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + headerOffset();
    window.scrollTo({ top: y, behavior: immediate || prefersReducedMotion() ? "auto" : "smooth" });
  }
  // Move keyboard focus with the scroll so screen readers follow.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  return true;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

export { gsap, ScrollTrigger };
