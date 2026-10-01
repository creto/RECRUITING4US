import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  PlaneGeometry,
  Points,
  TubeGeometry,
  Vector3,
  type PerspectiveCamera as PCam,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SceneProps } from "../ViewSlot";
import { live, stageColors } from "../palette";
import { chevronCenterX, chevronGeometry } from "../geometry";
import { cardMaterial, chevronMaterial, damp, flowMaterial, glowMaterial, inkMaterial, labelTexture, mulberry32, pointsMaterial } from "../materials";
import { QUALITY } from "../quality";
import { pointer } from "../registry";
import { elementProgress, smoothstep } from "@/motion/progress";

/*
 * TALENT CONSTELLATION
 *
 * 0.0–1.6s  the four chevrons of the official mark arrive from depth and
 *           resolve into the logo (animated logo).
 * 1.4–2.3s  a single highlight traverses the settled mark.
 * 2.3–3.8s  the chevrons open along the hiring axis and become four stage
 *           gates (Postular, Evaluar, Entrevistar, Ofertar); candidate
 *           trajectories draw from the job opening toward the hire node.
 * then      candidates travel. Most rest at a gate where a person reviews
 *           them (ring pulse); one featured candidate collects evidence
 *           (CV, evaluación, scorecard, notas) and reaches the offer.
 * scroll    the camera moves from the many to that one application.
 *
 * Nothing is "rejected": a resting candidate is waiting for a human review.
 */

const GATE_X = [-3.7, -1.1, 1.5, 4.1];
const ANCHOR_X = -7;
const HIRE_X = 7;
const GATE_LABELS = ["Postular", "Evaluar", "Entrevistar", "Ofertar"];
const LAYOUT = {
  wide: { x: 3.7, y: -0.25, rx: 0.08, ry: 0.5, scale: 0.64 },
  narrow: { x: 0.7, y: 0.25, rx: 0.12, ry: 0.92, scale: 0.9 },
};
const EVIDENCE = [
  { label: "CV", at: 0.12 },
  { label: "Evaluación", at: 0.42 },
  { label: "Muestra de trabajo", at: 0.5 },
  { label: "Scorecard", at: 0.66 },
  { label: "Notas", at: 0.7 },
];

type Traj = { curve: CatmullRomCurve3; end: number; seed: number; period: number; offset: number; featured: boolean };

function uAtX(curve: CatmullRomCurve3, x: number) {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (curve.getPointAt(mid).x < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function buildTrajectories(count: number): Traj[] {
  const rnd = mulberry32(4117);
  const out: Traj[] = [];
  for (let i = 0; i < count; i++) {
    const featured = i === 0;
    const spread = featured ? 0.15 : 1;
    const pts = [
      new Vector3(ANCHOR_X, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3),
      new Vector3(-5.4, (rnd() - 0.5) * 2.6 * spread, (rnd() - 0.5) * 2.2 * spread),
      ...GATE_X.map((x, k) => new Vector3(x + (rnd() - 0.5) * 0.4, (rnd() - 0.5) * (2.2 - k * 0.35) * spread + (featured ? 0.1 : 0), (rnd() - 0.5) * (2.0 - k * 0.3) * spread)),
      new Vector3(5.7, (rnd() - 0.5) * 0.8 * spread, (rnd() - 0.5) * 0.6 * spread),
      new Vector3(HIRE_X, 0, 0),
    ];
    const curve = new CatmullRomCurve3(pts, false, "centripetal");
    curve.arcLengthDivisions = 160;
    // Where this journey currently rests. Most wait at a gate for review.
    const r = rnd();
    const gate = featured ? 4 : r < 0.3 ? 0 : r < 0.6 ? 1 : r < 0.8 ? 2 : r < 0.93 ? 3 : 4;
    const end = gate === 4 ? 1 : uAtX(curve, GATE_X[gate] - 0.25);
    out.push({ curve, end, seed: rnd(), period: featured ? 16 : 11 + rnd() * 9, offset: rnd(), featured });
  }
  return out;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function Constellation({ slot }: SceneProps) {
  const camRef = useRef<PCam>(null);
  const root = useRef<Group>(null);
  const chevrons = useRef<(Mesh | null)[]>([]);
  const labels = useRef<(Mesh | null)[]>([]);
  const cards = useRef<(Mesh | null)[]>([]);
  const hire = useRef<Mesh>(null);
  const points = useRef<Points>(null);
  const t0 = useRef<number | null>(null);
  const size = useThree((s) => s.size);

  const trajs = useMemo(() => buildTrajectories(QUALITY.trajectories), []);

  const tubes = useMemo(() => {
    const geos = trajs.map((tr) => {
      const g = new TubeGeometry(tr.curve, QUALITY.tubeSegments, tr.featured ? 0.024 : 0.011, QUALITY.radial, false);
      const n = g.attributes.position.count;
      const aT = new Float32Array(n);
      const ring = QUALITY.radial + 1;
      for (let v = 0; v < n; v++) aT[v] = Math.floor(v / ring) / QUALITY.tubeSegments;
      g.setAttribute("aT", new BufferAttribute(aT, 1));
      g.setAttribute("aEnd", new BufferAttribute(new Float32Array(n).fill(tr.end), 1));
      g.setAttribute("aSeed", new BufferAttribute(new Float32Array(n).fill(tr.seed), 1));
      g.setAttribute("aFeat", new BufferAttribute(new Float32Array(n).fill(tr.featured ? 1 : 0), 1));
      g.deleteAttribute("uv");
      return g;
    });
    const merged = mergeGeometries(geos, false)!;
    geos.forEach((g) => g.dispose());
    return merged;
  }, [trajs]);

  const flowMat = useMemo(() => flowMaterial(), []);
  const chevronMats = useMemo(() => stageColors().map((c) => chevronMaterial(c)), []);
  const ptsMat = useMemo(() => pointsMaterial(), []);
  const hireMat = useMemo(() => glowMaterial(live.glow, 1.2), []);
  const labelMats = useMemo(() => GATE_LABELS.map((l) => inkMaterial(labelTexture(l, { w: 512, h: 128, size: 64, align: "center" }), live.ink, 0)), []);
  const cardMats = useMemo(
    () => EVIDENCE.map((e, i) => cardMaterial(labelTexture(e.label, { w: 640, h: 256, size: 76 }), { accent: stageColors()[Math.min(3, i)], aspect: 2.5, radius: 0.16 })),
    [],
  );
  const anchorMat = useMemo(() => cardMaterial(labelTexture("Vacante", { w: 512, h: 256, size: 84, sub: "Analista de datos" }), { accent: live.s1, aspect: 2, radius: 0.14 }), []);
  const hireLabelMat = useMemo(() => inkMaterial(labelTexture("Contratación", { w: 512, h: 128, size: 60, align: "center" }), live.ink, 0), []);

  // Points: [candidates..., review rings...]
  const n = trajs.length;
  const pointsGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(n * 2 * 3), 3));
    g.setAttribute("aColor", new BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const size = new Float32Array(n * 2);
    const kind = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      size[i] = trajs[i].featured ? 44 : 22;
      kind[n + i] = 1;
      size[n + i] = 60;
    }
    g.setAttribute("aSize", new BufferAttribute(size, 1));
    g.setAttribute("aKind", new BufferAttribute(kind, 1));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(n * 2), 1));
    return g;
  }, [n, trajs]);

  useEffect(
    () => () => {
      tubes.dispose();
      pointsGeo.dispose();
      [flowMat, ptsMat, hireMat, anchorMat, hireLabelMat, ...chevronMats, ...labelMats, ...cardMats].forEach((m) => m.dispose());
    },
    [tubes, pointsGeo, flowMat, ptsMat, hireMat, anchorMat, hireLabelMat, chevronMats, labelMats, cardMats],
  );

  const tmp = useMemo(() => ({ v: new Vector3(), c: new Color(), look: new Vector3(), camPos: new Vector3(), feat: new Vector3() }), []);
  const camState = useRef({ x: 0, y: 0.4, z: 16, lx: 0, ly: 0, focus: 0 });

  useFrame((state, dtRaw) => {
    if (!slot.visible) return;
    const dt = Math.min(dtRaw, 0.05);
    const reduced = slot.reduced;
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const t = reduced ? 6 : state.clock.elapsedTime - t0.current;
    const time = reduced ? 7.3 : state.clock.elapsedTime;

    const aspect = size.width / Math.max(1, size.height);
    // Layout follows the CSS breakpoint: ≤820px the hero stacks (scene in its
    // own band above the text); wider, the scene shares the hero with the
    // headline and sits right of it (or above it on squarer tablets).
    const stacked = window.innerWidth <= 820;
    const wide = !stacked;
    const g = root.current!;
    const L = stacked ? LAYOUT.narrow : LAYOUT.wide;
    const squarish = wide ? Math.max(0, Math.min(1, (1.45 - aspect) / 0.45)) : 0; // 0 at ≥1.45, 1 at ≤1.0
    // stacked tablets (600–820px) get a wider, shorter band: shrink so both ends stay in frame
    const narrowScale = stacked ? L.scale * Math.min(0.95, Math.max(0.8, aspect * 0.75)) * (window.innerWidth > 600 ? 0.8 : 1) : L.scale;
    g.position.set(L.x - squarish * 3.7, L.y + squarish * 2.1, 0);
    g.rotation.set(L.rx, L.ry, 0);
    g.scale.setScalar(stacked ? narrowScale : L.scale * (1 - squarish * 0.1));

    // ---- chevrons: arrive → mark → gates
    const logoOffset = 0;
    for (let i = 0; i < 4; i++) {
      const m = chevrons.current[i];
      if (!m) continue;
      const arrive = easeOut(smoothstep(0.1 + i * 0.12, 1.3 + i * 0.12, t));
      const open = easeInOut(smoothstep(2.3 + i * 0.08, 3.6 + i * 0.08, t));
      const markX = chevronCenterX(i) + logoOffset;
      const startZ = [-9, -5, 4, 7][i];
      const startY = [1.8, -1.4, 1.1, -1.6][i];
      const inMarkX = markX - 2.5 * (1 - arrive);
      const x = inMarkX + (GATE_X[i] - inMarkX) * open;
      const y = startY * (1 - arrive);
      const z = startZ * (1 - arrive);
      m.position.set(x, y, z);
      const sc = 1 + open * -0.28;
      m.scale.set(sc, sc, 1);
      m.rotation.y = (1 - arrive) * (i % 2 ? 0.5 : -0.5) - open * L.ry * 0.75;
      const mat = chevronMats[i];
      mat.uniforms.uOpacity.value = arrive * (1 - open * 0.25);
      mat.uniforms.uSweep.value = -4 + smoothstep(1.4, 2.3, t) * 9;
      const lab = labels.current[i];
      if (lab) {
        lab.position.set(GATE_X[i], -1.72, 0.2);
        lab.rotation.y = -L.ry;
        labelMats[i].uniforms.uOpacity.value = smoothstep(3.2, 3.9, t) * 0.9;
      }
    }

    // ---- trajectories
    flowMat.uniforms.uTime.value = time;
    flowMat.uniforms.uDraw.value = easeInOut(smoothstep(2.6, 4.4, t));
    const hp = elementProgress(slot.el, 0.5, 1); // 0 while hero fills the screen, → 1 as it leaves
    camState.current.focus = damp(camState.current.focus, hp, 4, dt);
    flowMat.uniforms.uFocus.value = camState.current.focus;
    ptsMat.uniforms.uTime.value = time;
    ptsMat.uniforms.uScale.value = size.height / 900;

    const pos = pointsGeo.attributes.position.array as Float32Array;
    const col = pointsGeo.attributes.aColor.array as Float32Array;
    const alpha = pointsGeo.attributes.aAlpha.array as Float32Array;
    const appear = smoothstep(3.3, 4.2, t);
    const cols = stageColors();
    for (let i = 0; i < n; i++) {
      const tr = trajs[i];
      const cyc = ((time / tr.period + tr.offset) % 1 + 1) % 1;
      const travel = tr.featured ? 0.7 : 0.58;
      let u: number;
      let a = appear;
      let resting = 0;
      if (cyc < travel) u = easeInOut(cyc / travel) * tr.end;
      else {
        u = tr.end;
        resting = 1;
        if (cyc > 0.92) a *= 1 - (cyc - 0.92) / 0.08;
      }
      if (cyc < 0.04) a *= cyc / 0.04;
      if (!tr.featured) a *= 1 - camState.current.focus * 0.7;
      tr.curve.getPointAt(Math.min(0.9999, u), tmp.v);
      if (tr.featured) tmp.feat.copy(tmp.v);
      pos.set([tmp.v.x, tmp.v.y, tmp.v.z], i * 3);
      pos.set([tmp.v.x, tmp.v.y, tmp.v.z], (n + i) * 3);
      const k = Math.min(2.999, u * 3);
      tmp.c.copy(cols[Math.floor(k)]).lerp(cols[Math.floor(k) + 1], k - Math.floor(k));
      col.set([tmp.c.r, tmp.c.g, tmp.c.b], i * 3);
      col.set([tmp.c.r, tmp.c.g, tmp.c.b], (n + i) * 3);
      alpha[i] = a;
      // Review ring: breathing pulse while a person reviews this candidate.
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + tr.seed * 6.28);
      alpha[n + i] = resting && tr.end < 1 ? a * (0.35 + 0.45 * pulse) : 0;
    }
    pointsGeo.attributes.position.needsUpdate = true;
    pointsGeo.attributes.aColor.needsUpdate = true;
    pointsGeo.attributes.aAlpha.needsUpdate = true;

    // ---- evidence follows the featured candidate
    const feat = trajs[0];
    const fcyc = ((time / feat.period + feat.offset) % 1 + 1) % 1;
    const fu = fcyc < 0.7 ? easeInOut(fcyc / 0.7) : 1;
    EVIDENCE.forEach((e, i) => {
      const card = cards.current[i];
      if (!card) return;
      const on = smoothstep(e.at, e.at + 0.06, fu) * appear * (fcyc > 0.94 ? 1 - (fcyc - 0.94) / 0.06 : 1);
      const k = wide ? i : Math.min(i, 2);
      const tx = tmp.feat.x - 1.2 - k * 0.55;
      const ty = tmp.feat.y + 0.95 + k * 0.42 + Math.sin(time * 0.6 + i) * 0.03;
      const tz = tmp.feat.z + 0.6 + k * 0.25;
      card.rotation.y = -L.ry * 0.9;
      if (!wide && i > 2) {
        cardMats[i].uniforms.uOpacity.value = 0;
        return;
      }
      card.position.x = damp(card.position.x, tx, 6, dt);
      card.position.y = damp(card.position.y, ty, 6, dt);
      card.position.z = damp(card.position.z, tz, 6, dt);
      card.scale.setScalar(0.3 + on * 0.7);
      cardMats[i].uniforms.uOpacity.value = on;
    });

    // ---- hire node + anchor
    const reach = fcyc >= 0.68 && fcyc < 0.94 ? 1 : 0;
    hireMat.uniforms.uStrength.value = damp(hireMat.uniforms.uStrength.value, (0.5 + reach * 1.3) * appear, 4, dt);
    if (hire.current) hire.current.scale.setScalar(1.3 + reach * 0.25 + Math.sin(time * 1.4) * 0.04);
    hireLabelMat.uniforms.uOpacity.value = smoothstep(3.6, 4.3, t) * 0.85;
    anchorMat.uniforms.uOpacity.value = smoothstep(2.5, 3.2, t);

    // ---- camera: intro dolly, pointer parallax, scroll focus on one application
    const cs = camState.current;
    const intro = easeOut(smoothstep(0, 3.6, t));
    const baseZ = (wide ? 19 : 17.5) - intro * 3;
    const px = reduced ? 0 : pointer.x * 0.45;
    const py = reduced ? 0 : pointer.y * 0.3;
    g.localToWorld(tmp.look.copy(tmp.feat));
    const f = cs.focus;
    const tx = px * (1 - f) + tmp.look.x * f * 0.85;
    const ty = 1.1 + py * (1 - f) + (tmp.look.y + 0.4) * f * 0.7;
    const tz = baseZ - f * 7.5;
    cs.x = damp(cs.x, tx, 3, dt);
    cs.y = damp(cs.y, ty, 3, dt);
    cs.z = damp(cs.z, tz, 3, dt);
    cs.lx = damp(cs.lx, tmp.look.x * f, 3, dt);
    cs.ly = damp(cs.ly, tmp.look.y * f, 3, dt);
    const cam = camRef.current!;
    cam.position.set(cs.x, cs.y, cs.z);
    cam.lookAt(cs.lx, cs.ly, 0);
  });

  const anchorGeo = useMemo(() => new PlaneGeometry(1.6, 0.8), []);
  const cardGeo = useMemo(() => new PlaneGeometry(1.25, 0.5), []);
  const labelGeo = useMemo(() => new PlaneGeometry(1.6, 0.4), []);
  const glowGeo = useMemo(() => new PlaneGeometry(1.4, 1.4), []);

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={32} near={0.1} far={80} position={[0, 0.5, 19]} />
      <group ref={root}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} ref={(m) => void (chevrons.current[i] = m)} geometry={chevronGeometry(i, true)} material={chevronMats[i]} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`l${i}`} ref={(m) => void (labels.current[i] = m)} geometry={labelGeo} material={labelMats[i]} />
        ))}
        <mesh geometry={tubes} material={flowMat} renderOrder={1} />
        <points ref={points} geometry={pointsGeo} material={ptsMat} renderOrder={2} frustumCulled={false} />
        {EVIDENCE.map((e, i) => (
          <mesh key={e.label} ref={(m) => void (cards.current[i] = m)} geometry={cardGeo} material={cardMats[i]} renderOrder={3} />
        ))}
        <mesh position={[ANCHOR_X + 0.55, -1.1, 0.2]} rotation={[0, -0.6, 0]} geometry={anchorGeo} material={anchorMat} />
        <mesh ref={hire} position={[HIRE_X, 0, 0]} geometry={glowGeo} material={hireMat} />
        <mesh position={[HIRE_X, -0.95, 0]} rotation={[0, -0.6, 0]} geometry={labelGeo} material={hireLabelMat} />
      </group>
    </>
  );
}
