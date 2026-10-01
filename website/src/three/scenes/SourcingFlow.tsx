import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, Group, Mesh, PlaneGeometry, TubeGeometry, Vector3, type PerspectiveCamera as PCam } from "three";
import type { SceneProps } from "../ViewSlot";
import { live } from "../palette";
import { chevronGeometry } from "../geometry";
import { cardMaterial, chevronMaterial, damp, inkMaterial, labelTexture, mulberry32, pointsMaterial, ringMaterial, traceMaterial } from "../materials";
import { QUALITY, TIER } from "../quality";
import { pointer } from "../registry";
import { sourcingProgress } from "../stores";
import { smoothstep } from "@/motion/progress";

/*
 * SOURCING FLOW. People who have not applied yet, left to right:
 *
 *   prospects (a loose field)  →  pools (three groups for future needs)
 *   → two separate routes:
 *       referral   an internal recommendation, no gate, tracked to hire
 *       campaign   passes the CONSENT gate; without consent a prospect
 *                  stays in its pool. A reply or a bounce stops the send
 *                  (amber ring, the person simply stops receiving mail).
 *   → application: only someone who applies becomes an applicant. That is a
 *     different object (a card + the pipeline chevron), not a recoloured dot.
 *
 * Progress comes from the section (scroll, or a clicked step) through the
 * sourcingProgress store. Every state is also described by the DOM steps.
 */

type Route = "stay" | "referral" | "campaign-no" | "campaign" | "campaign-stop";
type Person = {
  field: Vector3;
  pool: Vector3;
  route: Route;
  applies: boolean;
  wait: Vector3;
  stopU: number;
  stagger: number;
  seed: number;
};

const FIELD_X = -5.4;
const POOL_X = -2.3;
const POOLS = [1.15, 0, -1.15];
const POOL_NAMES = ["Analítica", "Plataforma", "Soporte"];
const GATE = new Vector3(-0.35, -1.25, 0);
const STOP_U = 0.42;
const CARD = new Vector3(6, 0, 0);
const FOCUS_X = [FIELD_X, POOL_X, 1.4, 1.4, CARD.x - 0.3];

const referralCurve = new CatmullRomCurve3(
  [new Vector3(-1.6, 0.75, 0), new Vector3(0.2, 1.75, 0.15), new Vector3(2.6, 1.7, 0.1), new Vector3(4.6, 0.55, 0)],
  false,
  "catmullrom",
  0.4,
);
const campaignCurve = new CatmullRomCurve3(
  [GATE.clone().setX(GATE.x + 0.15), new Vector3(1.3, -1.7, 0.1), new Vector3(3.1, -1.45, 0.1), new Vector3(4.6, -0.55, 0)],
  false,
  "catmullrom",
  0.4,
);

const STOP_POS = campaignCurve.getPointAt(STOP_U - 0.04).add(new Vector3(0, -0.2, 0));

function tube(curve: CatmullRomCurve3, segs: number) {
  const g = new TubeGeometry(curve, segs, 0.022, 5, false);
  const n = g.attributes.position.count;
  const aT = new Float32Array(n);
  for (let v = 0; v < n; v++) aT[v] = Math.floor(v / 6) / segs;
  g.setAttribute("aT", new BufferAttribute(aT, 1));
  g.deleteAttribute("uv");
  return g;
}

function buildPeople(count: number): Person[] {
  const rnd = mulberry32(2207);
  const out: Person[] = [];
  let referralApplied = 0;
  let campaignApplied = 0;
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    const field = new Vector3(FIELD_X + Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.65, (rnd() - 0.5) * 1.4);
    const k = i % 3;
    const pa = rnd() * Math.PI * 2;
    const pr = Math.sqrt(rnd()) * 0.34;
    const pool = new Vector3(POOL_X + Math.cos(pa) * pr, POOLS[k] + Math.sin(pa) * pr, (rnd() - 0.5) * 0.2);
    const roll = rnd();
    let route: Route = "stay";
    if (k === 0 && roll < 0.45) route = "referral";
    else if (k !== 0 && roll < 0.75) {
      const consent = rnd() < 0.62;
      route = !consent ? "campaign-no" : rnd() < 0.3 ? "campaign-stop" : "campaign";
    }
    let applies = false;
    if (route === "referral" && referralApplied < 1) applies = !!++referralApplied;
    else if (route === "campaign" && campaignApplied < 2 && rnd() < 0.6) applies = !!++campaignApplied;
    const end = route === "referral" ? referralCurve.getPointAt(1) : campaignCurve.getPointAt(1);
    const wait = end.clone().add(new Vector3(0.15 + rnd() * 0.35, (rnd() - 0.5) * 0.45, (rnd() - 0.5) * 0.3));
    out.push({ field, pool, route, applies, wait, stopU: STOP_U - rnd() * 0.08, stagger: rnd(), seed: rnd() });
  }
  return out;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function SourcingFlow({ slot }: SceneProps) {
  const cam = useRef<PCam>(null);
  const root = useRef<Group>(null);
  const card = useRef<Mesh>(null);
  const chev = useRef<Mesh>(null);
  const size = useThree((s) => s.size);
  const st = useRef({ p: 0, cx: 0, cy: 0.5, cz: 14 });

  const people = useMemo(() => buildPeople(TIER === "high" ? 64 : TIER === "mid" ? 40 : 26), []);
  const n = people.length;

  const geos = useMemo(
    () => ({
      referral: tube(referralCurve, QUALITY.tubeSegments),
      campaign: tube(campaignCurve, QUALITY.tubeSegments),
      ring: new PlaneGeometry(1, 1),
      label: new PlaneGeometry(1.7, 0.425),
      small: new PlaneGeometry(1.2, 0.3),
      gate: new PlaneGeometry(0.34, 1.25),
      card: new PlaneGeometry(1.7, 0.74),
    }),
    [],
  );

  const mats = useMemo(() => {
    const ink = (text: string, sizePx = 60, opacity = 0) => inkMaterial(labelTexture(text, { w: 512, h: 128, size: sizePx, align: "center" }), live.ink, opacity);
    return {
      referral: traceMaterial(),
      campaign: traceMaterial(),
      pts: pointsMaterial(),
      pools: POOLS.map(() => ringMaterial(live.s1, { width: 0.025 })),
      stop: ringMaterial(live.signal, { dash: 10, width: 0.05 }),
      gate: cardMaterial(null, { accent: live.s2, aspect: 0.34 / 1.25, radius: 0.12 }),
      card: cardMaterial(labelTexture("Postulación", { w: 640, h: 280, size: 78, sub: "Entra al pipeline" }), { accent: live.s2, aspect: 1.7 / 0.74, radius: 0.16 }),
      chev: chevronMaterial(live.s2),
      lProspects: ink("Prospectos"),
      lPools: ink("Pools"),
      lPoolNames: POOL_NAMES.map((p) => ink(p, 52)),
      lReferral: ink("Referido interno"),
      lCampaign: ink("Campaña"),
      lGate: ink("Consentimiento"),
      lStop: inkMaterial(labelTexture("Respuesta o rebote: se detiene", { w: 640, h: 128, size: 50, align: "center" }), live.signal, 0),
      lStay: inkMaterial(labelTexture("Sin consentimiento: sigue en el pool", { w: 720, h: 128, size: 48, align: "center" }), live.ink, 0),
    };
  }, []);

  // Points: [person discs..., stop rings...]
  const ptsGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(n * 2 * 3), 3));
    g.setAttribute("aColor", new BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const sz = new Float32Array(n * 2);
    const kind = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      sz[i] = people[i].applies ? 30 : 22;
      sz[n + i] = 0;
      kind[n + i] = 1;
    }
    g.setAttribute("aSize", new BufferAttribute(sz, 1));
    g.setAttribute("aKind", new BufferAttribute(kind, 1));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(n * 2), 1));
    return g;
  }, [n, people]);

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      ptsGeo.dispose();
      const all = Object.values(mats).flat();
      all.forEach((m) => m.dispose());
    },
    [geos, mats, ptsGeo],
  );

  const tmp = useMemo(() => ({ v: new Vector3(), w: new Vector3(), c: new Color() }), []);

  useFrame((state, dtRaw) => {
    if (!slot.visible) return;
    const dt = Math.min(dtRaw, 0.05);
    const S = st.current;
    const target = sourcingProgress.get();
    S.p = slot.reduced ? target : damp(S.p, target, 3.2, dt);
    const p = S.p;
    const time = slot.reduced ? 0 : state.clock.elapsedTime;

    // phase envelopes
    const toPool = (pp: Person) => easeInOut(smoothstep(0.16 + pp.stagger * 0.08, 0.34 + pp.stagger * 0.08, p));
    const referralT = (pp: Person) => easeInOut(smoothstep(0.42 + pp.stagger * 0.06, 0.6 + pp.stagger * 0.06, p));
    const gateT = (pp: Person) => easeInOut(smoothstep(0.58 + pp.stagger * 0.05, 0.66 + pp.stagger * 0.05, p));
    const campaignT = (pp: Person) => easeInOut(smoothstep(0.64 + pp.stagger * 0.06, 0.8 + pp.stagger * 0.06, p));
    const applyT = (pp: Person) => easeInOut(smoothstep(0.84 + pp.stagger * 0.04, 0.96, p));

    const pos = ptsGeo.attributes.position.array as Float32Array;
    const col = ptsGeo.attributes.aColor.array as Float32Array;
    const alpha = ptsGeo.attributes.aAlpha.array as Float32Array;
    const appliedGlow = { v: 0 };

    for (let i = 0; i < n; i++) {
      const pp = people[i];
      const drift = slot.reduced ? 0 : 1;
      // field → pool
      tmp.v.copy(pp.field);
      tmp.v.y += Math.sin(time * 0.5 + pp.seed * 9) * 0.06 * drift;
      tmp.v.x += Math.cos(time * 0.4 + pp.seed * 7) * 0.05 * drift;
      tmp.v.lerp(pp.pool, toPool(pp));
      let c = live.s1;
      let a = 0.95;
      let ring = 0;

      if (pp.route === "referral") {
        const t = referralT(pp);
        if (t > 0) {
          referralCurve.getPointAt(Math.min(0.999, t), tmp.w);
          tmp.v.lerp(tmp.w, Math.min(1, t * 6));
          if (t >= 0.999) tmp.v.copy(pp.wait);
          c = live.s3;
        }
      } else if (pp.route === "campaign" || pp.route === "campaign-stop" || pp.route === "campaign-no") {
        const g = gateT(pp);
        if (pp.route === "campaign-no") {
          // walks up to the gate, is not enrolled, returns to its pool
          const out = Math.sin(Math.min(1, g) * Math.PI);
          tmp.v.lerp(GATE, out * 0.45);
          a = 0.95 - g * 0.4;
        } else {
          tmp.v.lerp(GATE, g);
          const t = campaignT(pp);
          if (t > 0) {
            const u = pp.route === "campaign-stop" ? Math.min(t, pp.stopU) : t;
            campaignCurve.getPointAt(Math.min(0.999, u), tmp.w);
            tmp.v.copy(tmp.w);
            if (pp.route === "campaign" && t >= 0.999) tmp.v.copy(pp.wait);
            c = live.s2;
            if (pp.route === "campaign-stop" && t >= pp.stopU) {
              // enrollment stopped: the person settles just off the route
              c = live.signal;
              ring = smoothstep(pp.stopU, pp.stopU + 0.12, t);
              tmp.v.y -= ring * (0.18 + pp.seed * 0.22);
              tmp.v.x += ring * (pp.seed - 0.5) * 0.4;
              a = 0.95 - ring * 0.25;
            }
          } else if (g > 0.5) c = live.s2;
        }
      } else {
        // stays in its pool for a future need
        a = 0.95 - smoothstep(0.4, 0.6, p) * 0.35;
      }

      if (pp.applies) {
        const t = applyT(pp);
        if (t > 0) {
          tmp.v.lerp(CARD, t);
          c = live.s4;
          a *= 1 - smoothstep(0.85, 1, t);
          appliedGlow.v = Math.max(appliedGlow.v, t);
        }
      }

      pos.set([tmp.v.x, tmp.v.y, tmp.v.z], i * 3);
      pos.set([tmp.v.x, tmp.v.y, tmp.v.z], (n + i) * 3);
      tmp.c.copy(c);
      col.set([tmp.c.r, tmp.c.g, tmp.c.b], i * 3);
      col.set([live.signal.r, live.signal.g, live.signal.b], (n + i) * 3);
      alpha[i] = a;
      alpha[n + i] = 0;
    }
    ptsGeo.attributes.position.needsUpdate = true;
    ptsGeo.attributes.aColor.needsUpdate = true;
    ptsGeo.attributes.aAlpha.needsUpdate = true;
    mats.pts.uniforms.uScale.value = size.height / 700;

    // routes draw as their phase plays
    mats.referral.uniforms.uHead.value = smoothstep(0.4, 0.62, p);
    mats.campaign.uniforms.uHead.value = smoothstep(0.62, 0.84, p);
    mats.referral.uniforms.uTime.value = time;
    mats.campaign.uniforms.uTime.value = time;

    // pools, gate, stop marker, labels
    const poolsOn = smoothstep(0.14, 0.3, p);
    mats.pools.forEach((m, k) => {
      m.uniforms.uOpacity.value = poolsOn * 0.85;
      m.uniforms.uFill.value = 0.06 + (k === 0 ? smoothstep(0.4, 0.5, p) * 0.04 : 0);
    });
    const gateOn = smoothstep(0.55, 0.62, p);
    mats.gate.uniforms.uOpacity.value = 0.35 + smoothstep(0.3, 0.55, p) * 0.65;
    mats.gate.uniforms.uGlow.value = gateOn * (1 - smoothstep(0.8, 0.9, p) * 0.6);
    mats.stop.uniforms.uOpacity.value = smoothstep(0.66, 0.74, p) * 0.9;
    mats.stop.uniforms.uSpin.value = time * 0.03;

    mats.lProspects.uniforms.uOpacity.value = 0.9 - smoothstep(0.3, 0.45, p) * 0.7;
    mats.lPools.uniforms.uOpacity.value = smoothstep(0.16, 0.3, p) * 0.9;
    mats.lPoolNames.forEach((m) => (m.uniforms.uOpacity.value = smoothstep(0.2, 0.32, p) * 0.75));
    mats.lReferral.uniforms.uOpacity.value = smoothstep(0.4, 0.5, p) * 0.9;
    mats.lCampaign.uniforms.uOpacity.value = smoothstep(0.6, 0.7, p) * 0.9;
    mats.lGate.uniforms.uOpacity.value = 0.35 + smoothstep(0.52, 0.6, p) * 0.6;
    mats.lStop.uniforms.uOpacity.value = smoothstep(0.7, 0.78, p) * 0.95;
    mats.lStay.uniforms.uOpacity.value = smoothstep(0.62, 0.7, p) * (1 - smoothstep(0.86, 0.94, p)) * 0.8;

    // application: a different object
    const apply = Math.max(appliedGlow.v, slot.reduced && p > 0.9 ? 1 : 0);
    mats.card.uniforms.uOpacity.value = 0.3 + smoothstep(0.7, 0.86, p) * 0.7;
    mats.card.uniforms.uGlow.value = apply;
    mats.chev.uniforms.uOpacity.value = 0.25 + apply * 0.75;
    mats.chev.uniforms.uSweep.value = -4 + apply * 16;
    if (card.current) card.current.scale.setScalar(0.92 + apply * 0.08);
    if (chev.current) chev.current.position.x = CARD.x + 1.35 + apply * 0.15;

    // camera: wide screens see the whole flow and drift with progress;
    // narrow screens travel from phase to phase.
    const aspect = size.width / Math.max(1, size.height);
    const narrow = aspect < 1.5;
    const k = Math.min(3.999, p * 4);
    const fx = FOCUS_X[Math.floor(k)] + (FOCUS_X[Math.floor(k) + 1] - FOCUS_X[Math.floor(k)]) * easeInOut(k - Math.floor(k));
    const span = 15.4; // world width of the composition
    const fov = 30;
    const fit = span / (2 * Math.tan(((fov / 2) * Math.PI) / 180) * aspect);
    const z = narrow ? Math.max(9.5, 8 / aspect) : Math.min(24, Math.max(11, fit));
    const tx = narrow ? fx : 0.25 + (fx - 0.25) * 0.12;
    S.cx = damp(S.cx, tx + (slot.reduced ? 0 : pointer.x * 0.35), 2.6, dt);
    S.cy = damp(S.cy, 0.55 + (slot.reduced ? 0 : pointer.y * 0.2), 2.6, dt);
    S.cz = damp(S.cz, z, 2.6, dt);
    const c = cam.current!;
    c.position.set(S.cx, S.cy, S.cz);
    c.lookAt(S.cx * 0.92, 0, 0);
    if (root.current) root.current.rotation.y = narrow ? 0 : -0.06;
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={30} near={0.1} far={80} position={[0, 0.5, 14]} />
      <group ref={root}>
        <mesh geometry={geos.referral} material={mats.referral} />
        <mesh geometry={geos.campaign} material={mats.campaign} />
        {POOLS.map((y, k) => (
          <group key={k}>
            <mesh position={[POOL_X, y, -0.05]} scale={0.95} geometry={geos.ring} material={mats.pools[k]} />
            <mesh position={[POOL_X - 1.25, y, 0]} scale={1.25} geometry={geos.small} material={mats.lPoolNames[k]} />
          </group>
        ))}
        <mesh position={[GATE.x, GATE.y, 0.02]} geometry={geos.gate} material={mats.gate} />
        <mesh position={STOP_POS.toArray()} scale={0.7} geometry={geos.ring} material={mats.stop} />
        <points geometry={ptsGeo} material={mats.pts} frustumCulled={false} renderOrder={2} />
        <mesh ref={card} position={CARD.toArray()} geometry={geos.card} material={mats.card} renderOrder={3} />
        <mesh ref={chev} position={[CARD.x + 1.35, 0, 0]} scale={0.32} geometry={chevronGeometry(1, true, 0.3)} material={mats.chev} />

        <mesh position={[FIELD_X, 2.2, 0]} geometry={geos.label} material={mats.lProspects} />
        <mesh position={[POOL_X, 2.05, 0]} geometry={geos.label} material={mats.lPools} />
        <mesh position={[1.4, 2.15, 0]} geometry={geos.label} material={mats.lReferral} />
        <mesh position={[3.15, -0.92, 0]} geometry={geos.label} material={mats.lCampaign} />
        <mesh position={[GATE.x, -0.42, 0.02]} scale={0.8} geometry={geos.label} material={mats.lGate} />
        <mesh position={[STOP_POS.x, STOP_POS.y - 0.78, 0]} scale={[1.9, 1.52, 1]} geometry={geos.small} material={mats.lStop} />
        <mesh position={[POOL_X, -2.2, 0]} scale={[2, 1.43, 1]} geometry={geos.small} material={mats.lStay} />
      </group>
    </>
  );
}
