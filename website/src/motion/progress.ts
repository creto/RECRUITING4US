/**
 * Normalised scroll progress of an element through the viewport.
 * 0 = the element's top meets the viewport bottom, 1 = its bottom meets the
 * viewport top. Cheap (one rect read) and used by WebGL scenes inside
 * useFrame, so 3D never needs its own ScrollTrigger.
 */
export function elementProgress(el: Element | null, start = 0, end = 1): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const total = r.height + vh;
  const p = (vh - r.top) / total;
  const q = (p - start) / (end - start);
  return q < 0 ? 0 : q > 1 ? 1 : q;
}

/** Progress while a (tall) element is pinned: 0 at its top reaching the viewport top, 1 at its bottom reaching the viewport bottom. */
export function pinnedProgress(el: Element | null): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  if (span <= 0) return r.top <= 0 ? 1 : 0;
  const q = -r.top / span;
  return q < 0 ? 0 : q > 1 ? 1 : q;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
