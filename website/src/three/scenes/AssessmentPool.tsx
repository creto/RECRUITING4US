import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Group, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, Object3D, PlaneGeometry, Quaternion, Vector3, type PerspectiveCamera as PCam } from "three";
import type { SceneProps } from "../ViewSlot";
import { live } from "../palette";
import { arcMaterial, cardMaterial, damp, instancedCardMaterial, labelTexture, mulberry32 } from "../materials";
import { QUALITY } from "../quality";
import { assessStep } from "../stores";
import { pointer } from "../registry";

/*
 * ASSESSMENT POOL.
 * 0 Banco      the question pool floats as a loose sphere of cards.
 * 1 Intento    a stable subset (same seed → same questions every visit) moves
 *              into the active plane; the server deadline arc appears.
 * 2 Evidencia  answers save one by one; the receipt appears.
 * 3 Revisión   a person grants an audited extension: the arc grows a segment.
 * Answer keys are never shown: cards only carry question lines.
 */

const SUBSET = 8;

export default function AssessmentPool({ slot }: SceneProps) {
  const cam = useRef<PCam>(null);
  const pool = useRef<Group>(null);
  const mesh = useRef<InstancedMesh>(null);
  const receipt = useRef<Mesh>(null);
  const arc = useRef<Mesh>(null);
  const extLabel = useRef<Mesh>(null);
  const count = QUALITY.pool;

  const data = useMemo(() => {
    const rnd = mulberry32(2718);
    const home: { p: Vector3; q: Quaternion }[] = [];
    const o = new Object3D();
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere with jitter.
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.39996;
      const R = 2.3 + (rnd() - 0.5) * 0.5;
      o.position.set(Math.cos(th) * r * R, y * R * 0.85, Math.sin(th) * r * R);
      o.lookAt(o.position.clone().multiplyScalar(2));
      o.rotateZ((rnd() - 0.5) * 0.6);
      home.push({ p: o.position.clone(), q: o.quaternion.clone() });
    }
    // Stable subset: a fixed seeded draw from the pool.
    const idx = Array.from({ length: count }, (_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const chosen = idx.slice(0, SUBSET);
    const slotOf = new Map(chosen.map((c, k) => [c, k]));
    const seeds = new Float32Array(count).map(() => rnd());
    return { home, slotOf, seeds };
  }, [count]);

  const geo = useMemo(() => {
    const g = new PlaneGeometry(0.72, 1);
    g.setAttribute("aSel", new InstancedBufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aSaved", new InstancedBufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aDim", new InstancedBufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aSeed", new InstancedBufferAttribute(data.seeds, 1));
    return g;
  }, [count, data]);
  const mat = useMemo(() => instancedCardMaterial(), []);
  const arcMat = useMemo(() => arcMaterial(), []);
  const arcGeo = useMemo(() => new PlaneGeometry(4.3, 4.3), []);
  const receiptMat = useMemo(() => cardMaterial(labelTexture("Comprobante de envío", { w: 900, h: 260, size: 72, sub: "Hora registrada por el servidor" }), { accent: live.s3, aspect: 3.4, radius: 0.16 }), []);
  const receiptGeo = useMemo(() => new PlaneGeometry(2.4, 0.7), []);
  const extMat = useMemo(() => cardMaterial(labelTexture("Extensión con motivo", { w: 800, h: 180, size: 70 }), { accent: live.s4, aspect: 4.4, radius: 0.2 }), []);
  const extGeo = useMemo(() => new PlaneGeometry(1.8, 0.41), []);

  useEffect(() => {
    receiptMat.uniforms.uOpacity.value = 0;
    extMat.uniforms.uOpacity.value = 0;
  }, [receiptMat, extMat]);

  useEffect(
    () => () => {
      [geo, arcGeo, receiptGeo, extGeo].forEach((g) => g.dispose());
      [mat, arcMat, receiptMat, extMat].forEach((m) => m.dispose());
    },
    [geo, arcGeo, receiptGeo, extGeo, mat, arcMat, receiptMat, extMat],
  );

  const state = useRef({ sel: new Float32Array(count), saved: new Float32Array(count), dim: 0, step: 0, arc: 0, ext: 0, rec: 0 });
  const tmp = useMemo(() => ({ m: new Matrix4(), p: new Vector3(), q: new Quaternion(), s: new Vector3(1, 1, 1), gp: new Vector3(), gq: new Quaternion(), inv: new Quaternion() }), []);

  useFrame((st, dtRaw) => {
    if (!slot.visible || !mesh.current) return;
    const dt = slot.reduced ? 1 : Math.min(dtRaw, 0.05);
    const step = assessStep.get();
    const S = state.current;
    const t = st.clock.elapsedTime;

    const g = pool.current!;
    if (!slot.reduced) g.rotation.y += dt * (step === 0 ? 0.12 : 0.03);
    S.dim = damp(S.dim, step >= 1 ? 1 : 0, 4, dt);
    g.scale.setScalar(1 - S.dim * 0.18);
    g.position.z = -S.dim * 1.6;
    g.position.x = -S.dim * 0.4;
    g.updateMatrixWorld();
    tmp.inv.copy(g.quaternion).invert();

    const sel = mesh.current.geometry.attributes.aSel.array as Float32Array;
    const saved = mesh.current.geometry.attributes.aSaved.array as Float32Array;
    const dim = mesh.current.geometry.attributes.aDim.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const k = data.slotOf.get(i);
      const chosen = k !== undefined;
      S.sel[i] = damp(S.sel[i], chosen && step >= 1 ? 1 : 0, 3.2 + (k ?? 0) * 0.25, dt);
      const savedTarget = chosen && step >= 2 && (step >= 3 || (t * 1.4) % 10 > (k ?? 0) * 0.9) ? 1 : 0;
      S.saved[i] = damp(S.saved[i], chosen && step >= 2 ? Math.max(savedTarget, step >= 3 ? 1 : 0) : 0, 5, dt);
      const h = data.home[i];
      tmp.p.copy(h.p);
      tmp.q.copy(h.q);
      if (chosen) {
        // Active plane: 4 × 2 grid facing the camera, in world space → pool-local.
        const col = k % 4;
        const row = Math.floor(k / 4);
        tmp.gp.set(-1.26 + col * 0.84, 0.56 - row * 1.1, 1.9);
        g.worldToLocal(tmp.gp);
        tmp.gq.copy(tmp.inv);
        const a = S.sel[i];
        tmp.p.lerp(tmp.gp, a);
        tmp.q.slerp(tmp.gq, a);
        tmp.s.setScalar(1 + a * 0.08);
      } else tmp.s.setScalar(1);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      mesh.current.setMatrixAt(i, tmp.m);
      sel[i] = S.sel[i];
      saved[i] = S.saved[i];
      dim[i] = chosen ? 0 : S.dim;
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.geometry.attributes.aSel.needsUpdate = true;
    mesh.current.geometry.attributes.aSaved.needsUpdate = true;
    mesh.current.geometry.attributes.aDim.needsUpdate = true;

    // Deadline arc (server time) + extension segment.
    S.arc = damp(S.arc, step >= 1 ? 1 : 0, 4, dt);
    arcMat.uniforms.uOpacity.value = S.arc;
    const used = step === 1 ? 0.35 : step === 2 ? 0.7 : step >= 3 ? 0.9 : 0;
    arcMat.uniforms.uProgress.value = damp(arcMat.uniforms.uProgress.value, used, 2.5, dt);
    S.ext = damp(S.ext, step >= 3 ? 0.18 : 0, 3, dt);
    arcMat.uniforms.uExtend.value = S.ext;
    extMat.uniforms.uOpacity.value = damp(extMat.uniforms.uOpacity.value, step >= 3 ? 1 : 0, 5, dt);

    S.rec = damp(S.rec, step >= 2 ? 1 : 0, 4, dt);
    receiptMat.uniforms.uOpacity.value = S.rec;
    receiptMat.uniforms.uGlow.value = step === 2 ? 1 : 0;
    if (receipt.current) receipt.current.position.y = -1.95 + (1 - S.rec) * -0.5;

    const c = cam.current!;
    c.position.x = damp(c.position.x, slot.reduced ? 0 : pointer.x * 0.35, 3, dt);
    c.position.y = damp(c.position.y, 0.2 + (slot.reduced ? 0 : pointer.y * 0.2), 3, dt);
    c.lookAt(0, 0, 0.8);
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={36} position={[0, 0.2, 10.4]} />
      <group ref={pool}>
        <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} />
      </group>
      <mesh ref={arc} position={[0, 0.02, 1.7]} geometry={arcGeo} material={arcMat} />
      <mesh ref={receipt} position={[0, -1.95, 2.1]} geometry={receiptGeo} material={receiptMat} />
      <mesh ref={extLabel} position={[1.05, 2.05, 1.9]} geometry={extGeo} material={extMat} />
    </>
  );
}
