import { ExtrudeGeometry, Shape, type BufferGeometry } from "three";
import { chevronPoints, CORNER_R, MARK_H, MARK_W, type Pt } from "@/brand/markGeometry";

/** World units per mark pixel (the full mark is ~4.1 × 3.1 units). */
export const MARK_SCALE = 1 / 130;

function toWorld([x, y]: Pt): Pt {
  return [(x - MARK_W / 2) * MARK_SCALE, -(y - MARK_H / 2) * MARK_SCALE];
}

function roundedShape(points: Pt[], r: number) {
  const shape = new Shape();
  const n = points.length;
  const towards = (a: Pt, b: Pt): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const t = Math.min(r, len / 2) / len;
    return [a[0] + dx * t, a[1] + dy * t];
  };
  for (let k = 0; k < n; k++) {
    const p0 = points[(k - 1 + n) % n];
    const p1 = points[k];
    const p2 = points[(k + 1) % n];
    const a = towards(p1, p0);
    const b = towards(p1, p2);
    if (k === 0) shape.moveTo(a[0], a[1]);
    else shape.lineTo(a[0], a[1]);
    shape.quadraticCurveTo(p1[0], p1[1], b[0], b[1]);
  }
  shape.closePath();
  return shape;
}

const cache = new Map<string, BufferGeometry>();

/**
 * Chevron i of the official mark, extruded with a soft bevel. When
 * `centered`, the chevron is re-centred on its own origin (used as a gate);
 * otherwise it keeps its place inside the mark (used for the logo formation).
 */
export function chevronGeometry(i: number, centered = false, depth = 0.22) {
  const key = `${i}-${centered}-${depth}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let pts = chevronPoints(i).map(toWorld);
  if (centered) {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    pts = pts.map(([x, y]) => [x - cx, y] as Pt);
  }
  const geo = new ExtrudeGeometry(roundedShape(pts, CORNER_R * MARK_SCALE), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 4,
    curveSegments: 6,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  cache.set(key, geo);
  return geo;
}

/** Centre x of chevron i inside the mark, in world units. */
export function chevronCenterX(i: number) {
  const pts = chevronPoints(i).map(toWorld);
  return pts.reduce((s, p) => s + p[0], 0) / pts.length;
}
