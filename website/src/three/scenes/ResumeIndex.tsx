import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { CanvasTexture, Group, LinearFilter, Mesh, PlaneGeometry, SRGBColorSpace, type PerspectiveCamera as PCam } from "three";
import type { SceneProps } from "../ViewSlot";
import { live, stageColors } from "../palette";
import { cardMaterial, damp, labelTexture } from "../materials";
import { cvHighlight } from "../stores";
import { elementProgress, smoothstep } from "@/motion/progress";
import { pointer } from "../registry";

/*
 * RESUME INDEX. A CV sheet enters; as the section scrolls, six text-derived
 * layers separate from it (skills, titles, education, locations, years, work
 * history). The recruiter's search lights the layers where its terms were
 * found (driven by the Boolean search next to it, via cvHighlight).
 */

const FIELDS = ["Habilidades", "Cargos", "Educación", "Ubicaciones", "Años", "Experiencia"];

function resumeTexture() {
  const w = 512,
    h = 680;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  const bar = (x: number, y: number, ww: number, hh = 10, a = 1) => {
    g.globalAlpha = a;
    g.beginPath();
    g.roundRect(x, y, ww, hh, hh / 2);
    g.fill();
  };
  bar(48, 56, 220, 26); // name
  bar(48, 96, 150, 12, 0.55);
  let y = 150;
  for (let s = 0; s < 5; s++) {
    bar(48, y, 110, 14, 0.9);
    y += 32;
    const lines = 2 + (s % 3);
    for (let l = 0; l < lines; l++) {
      bar(48, y, 330 + ((l * 53 + s * 31) % 90), 9, 0.4);
      y += 22;
    }
    y += 20;
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  return tex;
}

export default function ResumeIndex({ slot }: SceneProps) {
  const cam = useRef<PCam>(null);
  const root = useRef<Group>(null);
  const sheet = useRef<Mesh>(null);
  const slabs = useRef<(Mesh | null)[]>([]);
  const st = useRef({ p: 0 });

  const sheetTex = useMemo(() => resumeTexture(), []);
  const sheetMat = useMemo(() => cardMaterial(sheetTex, { accent: live.s1, aspect: 0.75, radius: 0.05 }), [sheetTex]);
  const slabMats = useMemo(
    () => FIELDS.map((f, i) => cardMaterial(labelTexture(f, { w: 800, h: 160, size: 68 }), { accent: stageColors()[Math.min(3, Math.floor(i / 1.6))], aspect: 5, radius: 0.22 })),
    [],
  );
  const sheetGeo = useMemo(() => new PlaneGeometry(2.4, 3.2), []);
  const slabGeo = useMemo(() => new PlaneGeometry(2.5, 0.5), []);

  useEffect(
    () => () => {
      sheetTex.dispose();
      sheetGeo.dispose();
      slabGeo.dispose();
      sheetMat.dispose();
      slabMats.forEach((m) => m.dispose());
    },
    [sheetTex, sheetGeo, slabGeo, sheetMat, slabMats],
  );

  useFrame((state, dtRaw) => {
    if (!slot.visible) return;
    const dt = Math.min(dtRaw, 0.05);
    const target = slot.reduced ? 1 : smoothstep(0.12, 0.55, elementProgress(slot.el));
    st.current.p = slot.reduced ? target : damp(st.current.p, target, 5, dt);
    const p = st.current.p;
    const time = state.clock.elapsedTime;
    const hits = cvHighlight.get();

    if (sheet.current) {
      sheet.current.position.set(-0.9 * p, 0.05, -0.4 * p);
      sheet.current.rotation.y = 0.35 * p;
    }
    for (let i = 0; i < FIELDS.length; i++) {
      const m = slabs.current[i];
      if (!m) continue;
      const k = smoothstep(i * 0.08, 0.55 + i * 0.08, p);
      const inY = 1.05 - i * 0.42;
      const outY = 1.45 - i * 0.58;
      m.position.set(-0.9 * p + k * 1.75, inY + (outY - inY) * k, -0.3 + k * (0.6 + i * 0.05));
      m.rotation.y = 0.35 * p - k * 0.55;
      const mat = slabMats[i];
      mat.uniforms.uOpacity.value = 0.15 + k * 0.85;
      const glow = hits[i] ? 1 : 0;
      mat.uniforms.uGlow.value = damp(mat.uniforms.uGlow.value, glow * k, 6, dt);
      mat.uniforms.uAccent.value = hits[i] ? live.s4 : stageColors()[Math.min(3, Math.floor(i / 1.6))];
    }
    const r = root.current!;
    r.rotation.y = damp(r.rotation.y, slot.reduced ? 0 : pointer.x * 0.08, 3, dt);
    r.rotation.x = damp(r.rotation.x, slot.reduced ? 0 : -pointer.y * 0.05, 3, dt);
    r.position.y = slot.reduced ? 0 : Math.sin(time * 0.6) * 0.03;
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={34} position={[0.55, 0.1, 8.6]} />
      <group ref={root} position={[-0.25, 0.05, 0]}>
        <mesh ref={sheet} geometry={sheetGeo} material={sheetMat} />
        {FIELDS.map((f, i) => (
          <mesh key={f} ref={(m) => void (slabs.current[i] = m)} geometry={slabGeo} material={slabMats[i]} renderOrder={2 + i} />
        ))}
      </group>
    </>
  );
}
