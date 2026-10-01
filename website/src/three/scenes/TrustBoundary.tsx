import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  EdgesGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  type PerspectiveCamera as PCam,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SceneProps } from "../ViewSlot";
import { live } from "../palette";
import { cardMaterial, damp, inkMaterial, labelTexture, mulberry32, pointsMaterial } from "../materials";
import { QUALITY, TIER } from "../quality";
import { pointer } from "../registry";
import { elementProgress, smoothstep } from "@/motion/progress";
import { useCopy } from "@/content/i18n";

/*
 * TRUST BOUNDARY
 *
 * The company workspace is a glass volume (edge lines + a faint fresnel
 * face). Candidate data sits inside as small clustered points. Beside it,
 * past a hatched boundary plane, a smaller and dimmer volume: another
 * company. Three access paths enter through three doors:
 *   1. Página de empleo      stops on the surface, at the published jobs.
 *   2. Portal del candidato  reaches one highlighted point: that person.
 *   3. Espacio del reclutador enters and branches to the whole interior.
 * Pulses travel along the paths and never cross the boundary.
 * Scroll through the section turns the camera a little around the volume.
 */

const CO = new Vector3(-0.7, 0, 0); // company centre
const CH = new Vector3(2.1, 1.35, 1.5); // company half extents
const OO = new Vector3(3.1, -0.35, -0.2); // other company centre
const OH = new Vector3(0.85, 0.8, 0.85);
const WALL_X = 1.83;
const FRONT = CO.z + CH.z;
const LEFT = CO.x - CH.x;

const DOOR_A = new Vector3(-1.75, 0.5, FRONT); // published jobs plate
const DOOR_B = new Vector3(-0.15, -0.55, FRONT);
const DOOR_C = new Vector3(LEFT, -0.15, 0.2);
const TARGET = new Vector3(0.55, -0.3, 0.45); // one candidate's own records

const START_A = new Vector3(-3.35, 2.45, 3.0);
const START_B = new Vector3(-0.7, -2.45, 3.4);
const START_C = new Vector3(-4.4, -0.75, 1.5);

const CLUSTERS = [
  new Vector3(-1.85, 0.45, -0.7),
  new Vector3(-1.2, -0.55, 0.55),
  new Vector3(0.35, 0.55, -0.55),
  new Vector3(0.5, -0.5, 0.2),
  new Vector3(-0.55, 0.05, -0.1),
];

type Path = { curve: CatmullRomCurve3; tone: 1 | 2 | 3; seed: number; speed: number };

/** Label world size relative to the view: a little larger on narrow slots so it stays legible. */
const labelScale = (w: number) => (w < 560 ? 2.3 : w < 900 ? 1.75 : 1.55);
/** Half the drawn text width of label i, in world units at the target depth. */
const labelHalf = (i: number, ls: number) => [0.42, 0.36, 0.42, 0.42, 0.42][i] * 1.8 * ls;

function buildPaths(): Path[] {
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const mk = (pts: Vector3[], tone: 1 | 2 | 3, seed: number, speed: number): Path => {
    const curve = new CatmullRomCurve3(pts, false, "centripetal");
    curve.arcLengthDivisions = 120;
    return { curve, tone, seed, speed };
  };
  const out: Path[] = [];
  // 1. careers page: from outside to the published plate, and no further.
  out.push(mk([START_A.clone(), v(-2.7, 1.65, 2.7), v(-2.05, 0.9, 2.1), v(DOOR_A.x, DOOR_A.y, FRONT + 0.03)], 1, 0.1, 0.16));
  // 2. candidate portal: through its door to one point.
  out.push(mk([START_B.clone(), v(-0.45, -1.6, 2.85), v(-0.2, -0.85, 2.05), DOOR_B.clone(), v(0.25, -0.4, 0.95), TARGET.clone()], 2, 0.45, 0.13));
  // 3. recruiter workspace: through the side door, branching to every cluster.
  CLUSTERS.forEach((c, i) => {
    out.push(mk([START_C.clone(), v(-3.6, -0.4, 0.8), DOOR_C.clone(), v(LEFT + 0.55, -0.12, 0.18), c.clone()], 3, 0.2 + i * 0.17, 0.11 + i * 0.008));
  });
  return out;
}

/* ---------------------------------------------------------- materials */

/** Glass face: faint fill, fresnel, and an inner glow that hugs each face's edges. */
function faceMaterial(tint: Color, strength: number) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { uTint: { value: tint }, uGlass: { value: live.glass }, uMix: live.mix, uStrength: { value: strength } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint; uniform vec3 uGlass; uniform float uMix; uniform float uStrength;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float glow = 1.0 - smoothstep(0.0, 0.16, e);
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        vec3 col = mix(uGlass, uTint, 0.35 + 0.5 * glow);
        float a = (0.05 + 0.12 * fres + 0.2 * glow * glow) * uStrength * mix(1.0, 0.5, uMix);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

/** All line work in one draw call. aTone: 0 company rim, 1..3 doors, 4 other company. */
function lineMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uRim: { value: live.rim },
      uDim: { value: live.dim },
      uInk: { value: live.ink },
      uC1: { value: live.s1 },
      uC2: { value: live.s2 },
      uC3: { value: live.s3 },
      uMix: live.mix,
      uReveal: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aTone; varying float vTone;
      void main(){ vTone = aTone; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uRim; uniform vec3 uDim; uniform vec3 uInk; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform float uMix; uniform float uReveal;
      varying float vTone;
      void main(){
        vec3 col; float a;
        if (vTone < 0.5) { col = uRim; a = mix(0.62, 0.5, uMix); }
        else if (vTone < 1.5) { col = mix(uC1, uC2, uMix * 0.5); a = 1.0; }
        else if (vTone < 2.5) { col = uC2; a = 1.0; }
        else if (vTone < 3.5) { col = uC3; a = 1.0; }
        else { col = mix(uInk, uDim, 0.55); a = mix(0.32, 0.7, uMix); }
        gl_FragColor = vec4(col, a * uReveal);
        #include <colorspace_fragment>
      }`,
  });
}

/** Access paths: dim tube with pulses flowing inward. */
function pathMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uC1: { value: live.s1 },
      uC2: { value: live.s2 },
      uC3: { value: live.s3 },
      uGlow: { value: live.glow },
      uMix: live.mix,
      uTime: { value: 0 },
      uDraw: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aT; attribute float aTone; attribute float aSeed;
      varying float vT; varying float vTone; varying float vSeed; varying float vFres;
      void main(){
        vT = aT; vTone = aTone; vSeed = aSeed;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vFres = abs(dot(n, normalize(cameraPosition - w.xyz)));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uGlow; uniform float uMix; uniform float uTime; uniform float uDraw;
      varying float vT; varying float vTone; varying float vSeed; varying float vFres;
      void main(){
        if (vT > uDraw) discard;
        vec3 col = vTone < 1.5 ? mix(uC1, uC2, uMix * 0.45) : (vTone < 2.5 ? uC2 : uC3);
        float pulse = pow(fract(vT * 2.2 - uTime * 0.32 + vSeed), 14.0);
        float core = smoothstep(0.05, 0.85, vFres);
        float a = (0.34 + 0.66 * pulse) * core;
        col = mix(col, uGlow, pulse * 0.35 * uMix);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

/** Hatched boundary plane between the two companies. */
function wallMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { uInk: { value: live.ink }, uRim: { value: live.rim }, uMix: live.mix, uReveal: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk; uniform vec3 uRim; uniform float uMix; uniform float uReveal; varying vec2 vUv;
      void main(){
        vec2 p = vUv;
        float fade = smoothstep(0.0, 0.18, p.x) * smoothstep(1.0, 0.82, p.x) * smoothstep(0.0, 0.14, p.y) * smoothstep(1.0, 0.86, p.y);
        float d = fract((p.x + p.y) * 22.0);
        float hatch = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.14, 0.22, d));
        float a = (0.025 + hatch * 0.09) * fade * mix(1.0, 1.5, uMix);
        vec3 col = mix(uInk, uRim, 0.35);
        gl_FragColor = vec4(col, a * uReveal);
        #include <colorspace_fragment>
      }`,
  });
}

/* -------------------------------------------------------------- scene */

export default function TrustBoundary({ slot }: SceneProps) {
  const camRef = useRef<PCam>(null);
  const labelRefs = useRef<(Mesh | null)[]>([]);
  const size = useThree((s) => s.size);
  const paths = useMemo(buildPaths, []);
  const tr = useCopy().trust;
  const text = useMemo(
    () => ({ company: tr.boundary, other: tr.other, a: tr.doors[0].name, b: tr.doors[1].name, c: tr.doors[2].name, published: tr.published }),
    [tr],
  );

  /* ---- geometry */
  const tubes = useMemo(() => {
    const seg = Math.round(QUALITY.tubeSegments * 0.75);
    const radial = QUALITY.radial;
    const geos = paths.map((p) => {
      const g = new TubeGeometry(p.curve, seg, p.tone === 3 ? 0.016 : 0.022, radial, false);
      const n = g.attributes.position.count;
      const aT = new Float32Array(n);
      for (let k = 0; k < n; k++) aT[k] = Math.floor(k / (radial + 1)) / seg;
      g.setAttribute("aT", new BufferAttribute(aT, 1));
      g.setAttribute("aTone", new BufferAttribute(new Float32Array(n).fill(p.tone), 1));
      g.setAttribute("aSeed", new BufferAttribute(new Float32Array(n).fill(p.seed), 1));
      g.deleteAttribute("uv");
      return g;
    });
    const merged = mergeGeometries(geos, false)!;
    geos.forEach((g) => g.dispose());
    return merged;
  }, [paths]);

  const lines = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const box = (c: Vector3, h: Vector3, tone: number) => {
      const b = new BoxGeometry(h.x * 2, h.y * 2, h.z * 2);
      const e = new EdgesGeometry(b);
      b.dispose();
      e.translate(c.x, c.y, c.z);
      e.setAttribute("aTone", new BufferAttribute(new Float32Array(e.attributes.position.count).fill(tone), 1));
      parts.push(e);
    };
    box(CO, CH, 0);
    box(OO, OH, 4);
    // Door frames: rectangles drawn on the volume's surface.
    const rect = (c: Vector3, w: number, h: number, axis: "z" | "x", tone: number) => {
      const pts: number[] = [];
      const corner = (u: number, v: number) => (axis === "z" ? [c.x + u, c.y + v, c.z + 0.012] : [c.x - 0.012, c.y + v, c.z + u]);
      const cs = [corner(-w / 2, -h / 2), corner(w / 2, -h / 2), corner(w / 2, h / 2), corner(-w / 2, h / 2)];
      for (let k = 0; k < 4; k++) pts.push(...cs[k], ...cs[(k + 1) % 4]);
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
      g.setAttribute("aTone", new BufferAttribute(new Float32Array(8).fill(tone), 1));
      parts.push(g);
    };
    rect(DOOR_A, 1.6, 0.76, "z", 1);
    rect(DOOR_B, 0.4, 0.6, "z", 2);
    rect(DOOR_C, 0.62, 0.78, "x", 3);
    const merged = mergeGeometries(parts, false)!;
    parts.forEach((g) => g.dispose());
    return merged;
  }, []);

  const companyBox = useMemo(() => new BoxGeometry(CH.x * 2, CH.y * 2, CH.z * 2), []);
  const otherBox = useMemo(() => new BoxGeometry(OH.x * 2, OH.y * 2, OH.z * 2), []);
  const wallGeo = useMemo(() => new PlaneGeometry(4.2, 3.6), []);
  const plateGeo = useMemo(() => new PlaneGeometry(1.44, 0.6), []);
  const labelGeo = useMemo(() => new PlaneGeometry(1.8, 0.45), []);

  /* ---- points: [data..., other company..., heads..., highlight, highlight ring] */
  const data = useMemo(() => {
    const rnd = mulberry32(9127);
    const perCluster = TIER === "low" ? 18 : TIER === "mid" ? 26 : 34;
    const pos: number[] = [];
    const tone: number[] = [];
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
    CLUSTERS.forEach((c, ci) => {
      for (let k = 0; k < perCluster; k++) {
        const x = Math.max(LEFT + 0.15, Math.min(CO.x + CH.x - 0.15, c.x + gauss() * 0.42));
        const y = Math.max(-CH.y + 0.15, Math.min(CH.y - 0.15, c.y + gauss() * 0.34));
        const z = Math.max(-CH.z + 0.15, Math.min(CH.z - 0.2, c.z + gauss() * 0.4));
        pos.push(x, y, z);
        tone.push((ci + k) % 3);
      }
    });
    const other: number[] = [];
    for (let k = 0; k < 26; k++) {
      other.push(OO.x + gauss() * OH.x * 0.6, OO.y + gauss() * OH.y * 0.6, OO.z + gauss() * OH.z * 0.6);
    }
    return { pos, tone, other };
  }, []);

  const nData = data.pos.length / 3;
  const nOther = data.other.length / 3;
  const nHeads = paths.length;
  const iHi = nData + nOther + nHeads;
  const nTotal = iHi + 2;

  const pointsGeo = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(nTotal * 3);
    pos.set(data.pos, 0);
    pos.set(data.other, nData * 3);
    pos.set([TARGET.x, TARGET.y, TARGET.z, TARGET.x, TARGET.y, TARGET.z], iHi * 3);
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aColor", new BufferAttribute(new Float32Array(nTotal * 3), 3));
    const sizeA = new Float32Array(nTotal);
    const kind = new Float32Array(nTotal);
    const alpha = new Float32Array(nTotal);
    const rnd = mulberry32(55);
    for (let k = 0; k < nData; k++) {
      sizeA[k] = 9 + rnd() * 7;
      alpha[k] = 0.55 + rnd() * 0.4;
    }
    for (let k = nData; k < nData + nOther; k++) {
      sizeA[k] = 8 + rnd() * 4;
      alpha[k] = 0.5;
    }
    for (let k = nData + nOther; k < iHi; k++) sizeA[k] = 30;
    sizeA[iHi] = 30;
    alpha[iHi] = 1;
    sizeA[iHi + 1] = 70;
    kind[iHi + 1] = 1;
    g.setAttribute("aSize", new BufferAttribute(sizeA, 1));
    g.setAttribute("aKind", new BufferAttribute(kind, 1));
    g.setAttribute("aAlpha", new BufferAttribute(alpha, 1));
    return g;
  }, [data, nData, nOther, nTotal, iHi]);

  /* ---- materials */
  const mats = useMemo(
    () => ({
      company: faceMaterial(live.rim, 1),
      other: faceMaterial(live.dim, 0.7),
      lines: lineMaterial(),
      path: pathMaterial(),
      wall: wallMaterial(),
      pts: pointsMaterial(),
      plate: cardMaterial(labelTexture(text.published, { w: 768, h: 320, size: 100, align: "center", weight: 650 }), { accent: live.s1, aspect: 2.4, radius: 0.14 }),
      labels: [
        inkMaterial(labelTexture(text.company, { w: 768, h: 192, size: 84, align: "center", weight: 650 }), live.ink, 0),
        inkMaterial(labelTexture(text.other, { w: 768, h: 192, size: 84, align: "center", weight: 600 }), live.ink, 0),
        inkMaterial(labelTexture(text.a, { w: 768, h: 192, size: 80, align: "center", weight: 600 }), live.ink, 0),
        inkMaterial(labelTexture(text.b, { w: 768, h: 192, size: 80, align: "center", weight: 600 }), live.ink, 0),
        inkMaterial(labelTexture(text.c, { w: 768, h: 192, size: 80, align: "center", weight: 600 }), live.ink, 0),
      ],
    }),
    [text],
  );

  useEffect(
    () => () => {
      [tubes, lines, companyBox, otherBox, wallGeo, plateGeo, labelGeo, pointsGeo].forEach((g) => g.dispose());
      [mats.company, mats.other, mats.lines, mats.path, mats.wall, mats.pts, mats.plate, ...mats.labels].forEach((m) => m.dispose());
    },
    [tubes, lines, companyBox, otherBox, wallGeo, plateGeo, labelGeo, pointsGeo, mats],
  );

  const tmp = useMemo(
    () => ({ v: new Vector3(), c: new Color(), target: new Vector3(), base: new Vector3(-0.4, 0, 0.8), f: new Vector3(), r: new Vector3(), u: new Vector3(), up: new Vector3(0, 1, 0), q: new Vector3() }),
    [],
  );
  const cam = useRef({ az: -0.5, el: 0.3, dist: 20, ready: false, fitted: false });
  const labelPos = useMemo(
    () => [
      new Vector3(CO.x + 1.35, CH.y + 0.4, CO.z - CH.z),
      new Vector3(OO.x + 0.25, OO.y + OH.y + 0.5, OO.z - OH.z),
      START_A.clone().add(new Vector3(0, 0.34, 0)),
      START_B.clone().add(new Vector3(0, -0.34, 0)),
      START_C.clone().add(new Vector3(0.1, -0.4, 0)),
    ],
    [],
  );
  // Points the camera keeps in frame: both volumes, path starts, label extents.
  const fitPts = useMemo(() => {
    const pts: Vector3[] = [];
    const corners = (c: Vector3, h: Vector3) => {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(new Vector3(c.x + sx * h.x, c.y + sy * h.y, c.z + sz * h.z));
    };
    corners(CO, CH);
    corners(OO, OH);
    pts.push(START_A.clone(), START_B.clone(), START_C.clone());
    return pts;
  }, []);

  useFrame((state, dtRaw) => {
    if (!slot.visible) return;
    const dt = Math.min(dtRaw, 0.05);
    const reduced = slot.reduced;
    const time = reduced ? 2.4 : state.clock.elapsedTime;
    const aspect = size.width / Math.max(1, size.height);

    // Scroll: reveal the paths as the section arrives, then turn the camera.
    const p = reduced ? 0.5 : elementProgress(slot.el);
    const reveal = reduced ? 1 : smoothstep(0.08, 0.34, p);
    mats.path.uniforms.uDraw.value = 0.02 + reveal * 1.0;
    mats.path.uniforms.uTime.value = time;
    mats.lines.uniforms.uReveal.value = 0.35 + 0.65 * smoothstep(0.02, 0.2, p);
    mats.wall.uniforms.uReveal.value = smoothstep(0.1, 0.3, p) * 0.7 + 0.3;
    mats.plate.uniforms.uOpacity.value = 0.35 + 0.65 * smoothstep(0.12, 0.3, p);
    mats.labels.forEach((m, i) => (m.uniforms.uOpacity.value = smoothstep(0.1 + i * 0.02, 0.3 + i * 0.02, p) * (i === 1 ? 0.62 : 0.9)));

    // Points: live palette colours (theme switch re-colours them).
    const col = pointsGeo.attributes.aColor.array as Float32Array;
    const alpha = pointsGeo.attributes.aAlpha.array as Float32Array;
    const pos = pointsGeo.attributes.position.array as Float32Array;
    const tones = [live.s2, live.s3, live.s4];
    const dark = live.mix.value;
    for (let k = 0; k < nData; k++) {
      tmp.c.copy(tones[data.tone[k]]);
      if (dark < 0.5 && data.tone[k] === 2) tmp.c.copy(live.s3).lerp(live.s1, 0.2);
      col[k * 3] = tmp.c.r;
      col[k * 3 + 1] = tmp.c.g;
      col[k * 3 + 2] = tmp.c.b;
    }
    tmp.c.copy(live.dim).lerp(live.ink, 0.25 - dark * 0.1);
    for (let k = nData; k < nData + nOther; k++) col.set([tmp.c.r, tmp.c.g, tmp.c.b], k * 3);

    // Heads: one pulse per path travelling inward. Path 1 stops at the plate.
    let portalArrive = 0;
    for (let j = 0; j < nHeads; j++) {
      const path = paths[j];
      const idx = nData + nOther + j;
      const cyc = (((time * path.speed + path.seed) % 1) + 1) % 1;
      const u = Math.min(0.999, cyc / 0.82);
      path.curve.getPointAt(u, tmp.v);
      pos.set([tmp.v.x, tmp.v.y, tmp.v.z], idx * 3);
      const c = path.tone === 1 ? live.s1 : path.tone === 2 ? live.s2 : live.s3;
      tmp.c.copy(c);
      if (path.tone === 1) tmp.c.lerp(live.s2, dark * 0.5);
      col.set([tmp.c.r, tmp.c.g, tmp.c.b], idx * 3);
      const fadeIn = smoothstep(0, 0.08, cyc);
      const fadeOut = cyc > 0.82 ? 1 - smoothstep(0.82, 0.98, cyc) : 1;
      alpha[idx] = fadeIn * fadeOut * reveal * (u < 0.999 || cyc < 0.9 ? 1 : 0.6);
      if (path.tone === 2 && cyc > 0.78) portalArrive = 1 - smoothstep(0.86, 1, cyc);
    }

    // Highlight: the one candidate reached by the portal path.
    tmp.c.copy(live.s2).lerp(live.glow, 0.25 + dark * 0.35);
    col.set([tmp.c.r, tmp.c.g, tmp.c.b], iHi * 3);
    col.set([tmp.c.r, tmp.c.g, tmp.c.b], (iHi + 1) * 3);
    const breathe = 0.5 + 0.5 * Math.sin(time * 2.1);
    alpha[iHi] = 0.95 * reveal + 0.05;
    alpha[iHi + 1] = reveal * (0.55 + 0.3 * breathe + 0.15 * portalArrive);
    const sizes = pointsGeo.attributes.aSize.array as Float32Array;
    sizes[iHi + 1] = 74 + breathe * 18 + portalArrive * 24;
    pointsGeo.attributes.aSize.needsUpdate = true;
    pointsGeo.attributes.position.needsUpdate = true;
    pointsGeo.attributes.aColor.needsUpdate = true;
    pointsGeo.attributes.aAlpha.needsUpdate = true;
    mats.pts.uniforms.uScale.value = Math.max(0.55, size.height / 720);

    // Camera: orbit slightly with scroll + pointer, then fit every key
    // point (volumes, path starts, label extents) inside the slot.
    const c = cam.current;
    const az = (aspect < 1 ? -0.34 : -0.46) + p * 0.38 + (reduced ? 0 : pointer.x * 0.05);
    const el = 0.5 - p * 0.2 + (reduced ? 0 : pointer.y * 0.035);
    if (!c.ready) {
      c.az = az;
      c.el = el;
      c.ready = true;
    }
    c.az = damp(c.az, az, 3, dt);
    c.el = damp(c.el, el, 3, dt);
    const F = tmp.f.set(-Math.sin(c.az) * Math.cos(c.el), -Math.sin(c.el), -Math.cos(c.az) * Math.cos(c.el)).normalize();
    const R = tmp.r.crossVectors(F, tmp.up).normalize();
    const U = tmp.u.crossVectors(R, F).normalize();
    const tanV = Math.tan((30 * Math.PI) / 360) * 0.97;
    const tanH = tanV * aspect;
    // Centre of the key points in the view plane, so the composition sits in the middle.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const k of fitPts) {
      tmp.q.copy(k).sub(tmp.base);
      const x = tmp.q.dot(R);
      const y = tmp.q.dot(U);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const ls = labelScale(size.width);
    labelPos.forEach((l, i) => {
      tmp.q.copy(l).sub(tmp.base);
      const half = labelHalf(i, ls);
      const x = tmp.q.dot(R);
      const y = tmp.q.dot(U);
      minX = Math.min(minX, x - half);
      maxX = Math.max(maxX, x + half);
      minY = Math.min(minY, y - 0.12 * ls);
      maxY = Math.max(maxY, y + 0.12 * ls);
    });
    tmp.target.copy(tmp.base).addScaledVector(R, (minX + maxX) / 2).addScaledVector(U, (minY + maxY) / 2);
    let need = 6;
    for (const k of fitPts) {
      tmp.q.copy(k).sub(tmp.target);
      const x = Math.abs(tmp.q.dot(R));
      const y = Math.abs(tmp.q.dot(U));
      const z = tmp.q.dot(F);
      need = Math.max(need, x / tanH - z, y / tanV - z);
    }
    // Labels: their on-screen half extents (text is ~60% of the plane width).
    labelPos.forEach((l, i) => {
      tmp.q.copy(l).sub(tmp.target);
      const half = labelHalf(i, ls);
      const x = Math.abs(tmp.q.dot(R));
      const y = Math.abs(tmp.q.dot(U));
      const z = tmp.q.dot(F);
      // the label scales with depth, so its extent grows with (D + z) / D: solve conservatively.
      need = Math.max(need, (x + half) / tanH - z, (y + 0.12 * ls) / tanV - z);
    });
    c.dist = c.dist === 20 && !c.fitted ? need : damp(c.dist, need, 4, dt);
    c.fitted = true;
    const camera = camRef.current!;
    camera.position.copy(tmp.target).addScaledVector(F, -c.dist);
    camera.lookAt(tmp.target);

    // Labels face the camera and keep one on-screen size whatever their depth.
    labelRefs.current.forEach((m, i) => {
      if (!m) return;
      m.position.copy(labelPos[i]);
      m.quaternion.copy(camera.quaternion);
      const depth = tmp.q.copy(labelPos[i]).sub(camera.position).dot(F);
      m.scale.setScalar((depth / c.dist) * labelScale(size.width));
    });
  });

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={30} near={0.1} far={120} position={[-8, 6, 16]} />
      <mesh geometry={otherBox} material={mats.other} position={OO} renderOrder={1} />
      <mesh geometry={wallGeo} material={mats.wall} position={[WALL_X, 0, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={1} />
      <mesh geometry={companyBox} material={mats.company} position={CO} renderOrder={2} />
      <lineSegments geometry={lines} material={mats.lines} renderOrder={3} />
      <mesh geometry={plateGeo} material={mats.plate} position={[DOOR_A.x, DOOR_A.y, FRONT + 0.02]} renderOrder={4} />
      <mesh geometry={tubes} material={mats.path} renderOrder={5} />
      <points geometry={pointsGeo} material={mats.pts} renderOrder={6} frustumCulled={false} />
      {mats.labels.map((m, i) => (
        <mesh key={i} ref={(el) => void (labelRefs.current[i] = el)} geometry={labelGeo} material={m} renderOrder={7} />
      ))}
    </>
  );
}
