/**
 * Geometry of the official RECRUIT4US mark, measured from public/mark.png
 * (537 × 400 px, four rounded chevrons). Used ONLY to animate the supplied
 * mark in 3D and in SVG; it does not redesign it. The header and footer use
 * the original PNG. Colours are the exact favicon.svg values, which match
 * pixel samples of the PNG (see docs/design-system.md, "Brand tokens sampled from the official mark").
 */
export const MARK_W = 537;
export const MARK_H = 400;
export const MARK_COLORS = ["#036145", "#04A764", "#78DD55", "#D0FA8E"] as const;

const TOP = 8;
const BOTTOM = 392;
const MID = 200;
const X0 = 6;
const PITCH = 105.5;
const THICK = 87;
const DEPTH = 110;

export type Pt = [number, number];

/** Six corners of chevron i (0..3), clockwise, in mark pixel space (y down). */
export function chevronPoints(i: number): Pt[] {
  const x = X0 + i * PITCH;
  return [
    [x, TOP],
    [x + THICK, TOP],
    [x + THICK + DEPTH, MID],
    [x + THICK, BOTTOM],
    [x, BOTTOM],
    [x + DEPTH, MID],
  ];
}

/** Rounded polygon path (quadratic corners), like the soft corners of the mark. */
export function roundedPath(points: Pt[], r: number): string {
  const n = points.length;
  let d = "";
  for (let k = 0; k < n; k++) {
    const p0 = points[(k - 1 + n) % n];
    const p1 = points[k];
    const p2 = points[(k + 1) % n];
    const a = towards(p1, p0, r);
    const b = towards(p1, p2, r);
    d += `${k === 0 ? "M" : "L"}${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${p1[0]} ${p1[1]} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  return d + "Z";
}

function towards(from: Pt, to: Pt, r: number): Pt {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.min(r, len / 2) / len;
  return [from[0] + dx * t, from[1] + dy * t];
}

export const CORNER_R = 20;
