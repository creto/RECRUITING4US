import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Mesh, PlaneGeometry, TubeGeometry, Vector3, type PerspectiveCamera as PCam } from "three";
import type { SceneProps } from "../ViewSlot";
import { live, stageColors } from "../palette";
import { chevronGeometry } from "../geometry";
import { cardMaterial, chevronMaterial, damp, glowMaterial, labelTexture, pointsMaterial, traceMaterial } from "../materials";
import { pinnedProgress } from "@/motion/progress";

/*
 * CANDIDATE TRACE (3D). One applicant's path through seven stages. The path
 * zig-zags forward like a row of chevrons; each stage node is a small chevron
 * in its stage colour. As the page scrolls, the candidate advances, the trace
 * behind them lights up, and the evidence gathered at that stage appears as a
 * card. Every stage node also carries a review ring: a person decides there.
 */

const EVIDENCE = ["Vacante publicada", "Postulación y comprobante", "CV indexado", "Comprobante de evaluación", "Scorecards", "Motivo registrado", "Oferta aceptada"];
const TONE = [0, 0, 1, 2, 2, 3, 3];
const N = 7;

export default function Journey({ slot }: SceneProps) {
  const cam = useRef<PCam>(null);
  const head = useRef<Mesh>(null);
  const nodes = useRef<(Mesh | null)[]>([]);
  const cards = useRef<(Mesh | null)[]>([]);
  const state = useRef({ p: 0, cx: 0, cy: 0, cz: 8, lx: 0, ly: 0 });

  const { curve, stageU, tube } = useMemo(() => {
    const pts: Vector3[] = [new Vector3(-1.6, 0, 0.6)];
    for (let i = 0; i < N; i++) pts.push(new Vector3(i * 2.3, i % 2 === 0 ? 0.85 : -0.85, -i * 0.35));
    pts.push(new Vector3(N * 2.3 + 0.4, 0, -N * 0.35));
    const c = new CatmullRomCurve3(pts, false, "catmullrom", 0.35);
    c.arcLengthDivisions = 400;
    // u (arc-length) of each stage node
    const lengths = c.getLengths(400);
    const total = lengths[lengths.length - 1];
    const us = pts.slice(1, N + 1).map((p) => {
      let best = 0,
        bd = Infinity;
      for (let k = 0; k <= 400; k++) {
        const q = c.getPoint(k / 400);
        const d = q.distanceToSquared(p);
        if (d < bd) {
          bd = d;
          best = lengths[k] / total;
        }
      }
      return best;
    });
    const segs = 360;
    const g = new TubeGeometry(c, segs, 0.035, 6, false);
    const n = g.attributes.position.count;
    const aT = new Float32Array(n);
    for (let v = 0; v < n; v++) aT[v] = Math.floor(v / 7) / segs;
    g.setAttribute("aT", new BufferAttribute(aT, 1));
    return { curve: c, stageU: us, tube: g };
  }, []);

  const trace = useMemo(() => traceMaterial(), []);
  const headMat = useMemo(() => glowMaterial(live.glow, 1.4), []);
  const nodeMats = useMemo(() => TONE.map((k) => chevronMaterial(stageColors()[k])), []);
  const cardMats = useMemo(() => EVIDENCE.map((e, i) => cardMaterial(labelTexture(e, { w: 720, h: 200, size: 64 }), { accent: stageColors()[TONE[i]], aspect: 3.6, radius: 0.18 })), []);
  const ringMat = useMemo(() => pointsMaterial(), []);
  const cardGeo = useMemo(() => new PlaneGeometry(1.8, 0.5), []);
  const glowGeo = useMemo(() => new PlaneGeometry(1.1, 1.1), []);

  // Review rings at each node (Points with aKind=1).
  const ringGeo = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    stageU.forEach((u, i) => {
      const p = curve.getPointAt(u);
      pos.set([p.x, p.y, p.z], i * 3);
      const c = stageColors()[TONE[i]];
      col.set([c.r, c.g, c.b], i * 3);
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aColor", new BufferAttribute(col, 3));
    g.setAttribute("aSize", new BufferAttribute(new Float32Array(N).fill(70), 1));
    g.setAttribute("aKind", new BufferAttribute(new Float32Array(N).fill(1), 1));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(N), 1));
    return g;
  }, [curve, stageU]);

  useEffect(
    () => () => {
      tube.dispose();
      ringGeo.dispose();
      cardGeo.dispose();
      glowGeo.dispose();
      [trace, headMat, ringMat, ...nodeMats, ...cardMats].forEach((m) => m.dispose());
    },
    [tube, ringGeo, cardGeo, glowGeo, trace, headMat, ringMat, nodeMats, cardMats],
  );

  const v = useMemo(() => new Vector3(), []);

  useFrame((st, dtRaw) => {
    if (!slot.visible) return;
    const dt = Math.min(dtRaw, 0.05);
    const section = slot.el?.closest("section") ?? null;
    const target = pinnedProgress(section);
    const S = state.current;
    S.p = slot.reduced ? target : damp(S.p, target, 6, dt);
    // Map section progress → path: stage k occupies [k/N, (k+1)/N]; the
    // candidate reaches node k at the start of its slice and rests there.
    const slice = Math.min(N - 1, Math.floor(S.p * N));
    const within = S.p * N - slice;
    const u0 = stageU[slice];
    const u1 = slice < N - 1 ? stageU[slice + 1] : stageU[slice];
    const travel = Math.min(1, Math.max(0, (within - 0.55) / 0.45));
    const u = u0 + (u1 - u0) * travel * travel * (3 - 2 * travel);
    trace.uniforms.uHead.value = u;
    trace.uniforms.uTime.value = slot.reduced ? 0 : st.clock.elapsedTime;
    curve.getPointAt(Math.min(0.999, u), v);
    head.current?.position.copy(v);

    const alpha = ringGeo.attributes.aAlpha.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const reached = u >= stageU[i] - 0.004;
      const active = slice === i;
      const n = nodes.current[i];
      if (n) {
        const sc = damp(n.scale.x, active ? 0.34 : reached ? 0.26 : 0.2, 8, dt);
        n.scale.set(sc, sc, sc);
        nodeMats[i].uniforms.uOpacity.value = reached ? 1 : 0.35;
      }
      const pulse = slot.reduced ? 1 : 0.6 + 0.4 * Math.sin(st.clock.elapsedTime * 2.4);
      alpha[i] = active ? pulse : reached ? 0.25 : 0;
      const c = cards.current[i];
      if (c) {
        const on = reached ? 1 : 0;
        const o = damp(cardMats[i].uniforms.uOpacity.value, on * (active ? 1 : 0.55), 8, dt);
        cardMats[i].uniforms.uOpacity.value = o;
        cardMats[i].uniforms.uGlow.value = active ? 1 : 0;
        c.position.y = damp(c.position.y, (i % 2 === 0 ? 1.75 : -1.75) + (reached ? 0 : (i % 2 === 0 ? -0.3 : 0.3)), 8, dt);
      }
    }
    ringGeo.attributes.aAlpha.needsUpdate = true;
    ringMat.uniforms.uScale.value = (slot.el?.clientHeight ?? 800) / 800;

    // Camera follows the candidate, slightly ahead and above.
    S.cx = damp(S.cx, v.x - 1.4, 3.5, dt);
    S.cy = damp(S.cy, 0.9, 3.5, dt);
    S.cz = damp(S.cz, v.z + 7.2, 3.5, dt);
    S.lx = damp(S.lx, v.x + 1.4, 3.5, dt);
    S.ly = damp(S.ly, v.y * 0.25, 3.5, dt);
    cam.current!.position.set(S.cx, S.cy, S.cz);
    cam.current!.lookAt(S.lx, S.ly, v.z - 0.5);
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={38} near={0.1} far={60} position={[0, 1, 8]} />
      <mesh geometry={tube} material={trace} />
      {stageU.map((u, i) => {
        const p = curve.getPointAt(u);
        return (
          <group key={i}>
            <mesh ref={(m) => void (nodes.current[i] = m)} position={p} geometry={chevronGeometry(TONE[i], true, 0.3)} material={nodeMats[i]} scale={0.2} />
            <mesh ref={(m) => void (cards.current[i] = m)} position={[p.x + 0.2, i % 2 === 0 ? 1.75 : -1.75, p.z]} geometry={cardGeo} material={cardMats[i]} />
          </group>
        );
      })}
      <points geometry={ringGeo} material={ringMat} frustumCulled={false} />
      <mesh ref={head} geometry={glowGeo} material={headMat} />
    </>
  );
}
