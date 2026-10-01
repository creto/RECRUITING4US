/**
 * Adaptive quality. Decided once at startup, refined at runtime by drei's
 * PerformanceMonitor (see Stage.tsx), which can only lower the DPR.
 *
 * Budget (docs/performance.md):
 *   - one WebGL context for the whole site, max 2 views drawing at once
 *   - DPR cap 2 desktop / 1.5 mobile / 1 low tier
 *   - no post-processing passes; glow is done in material shaders
 *   - candidate trajectories: 44 desktop, 18 mobile
 */
export type Tier = "high" | "mid" | "low";

function detect(): Tier {
  if (typeof window === "undefined") return "mid";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const small = window.matchMedia("(max-width: 820px)").matches;
  if (cores <= 2 || mem <= 2) return "low";
  if (small || cores <= 4) return "mid";
  return "high";
}

export const TIER: Tier = detect();

export const QUALITY = {
  high: { dpr: 2, trajectories: 44, pool: 72, tubeSegments: 96, radial: 6 },
  mid: { dpr: 1.5, trajectories: 22, pool: 48, tubeSegments: 64, radial: 5 },
  low: { dpr: 1, trajectories: 14, pool: 32, tubeSegments: 40, radial: 4 },
}[TIER];

let supported: boolean | null = null;
export function webglSupported(): boolean {
  if (supported !== null) return supported;
  try {
    const c = document.createElement("canvas");
    supported = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    supported = false;
  }
  return supported;
}
