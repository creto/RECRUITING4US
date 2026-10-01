import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  LinearFilter,
  NormalBlending,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  type Texture,
} from "three";
import { live } from "./palette";

/*
 * Shared shader library. Every scene builds its materials from here so the
 * whole site shares one lighting model, one glass, one glow. Colour uniforms
 * reference the live palette's Color instances directly, so a theme switch
 * re-lights every scene without touching materials.
 */

export const GLSL_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/** Four-stop stage ramp: t in 0..1 → forest, jade, leaf, sprout. */
const GLSL_RAMP = /* glsl */ `
uniform vec3 uS1; uniform vec3 uS2; uniform vec3 uS3; uniform vec3 uS4;
vec3 ramp(float t){
  t = clamp(t, 0.0, 1.0) * 3.0;
  if (t < 1.0) return mix(uS1, uS2, t);
  if (t < 2.0) return mix(uS2, uS3, t - 1.0);
  return mix(uS3, uS4, t - 2.0);
}`;

const rampUniforms = () => ({
  uS1: { value: live.s1 },
  uS2: { value: live.s2 },
  uS3: { value: live.s3 },
  uS4: { value: live.s4 },
});

/**
 * Satin chevron: soft diffuse, restrained specular, fresnel rim, and the
 * branded highlight that sweeps across the mark once it resolves.
 */
export function chevronMaterial(color: Color) {
  return new ShaderMaterial({
    transparent: true,
    uniforms: {
      uColor: { value: color },
      uRim: { value: live.rim },
      uBg: { value: live.bg },
      uMix: live.mix,
      uSweep: { value: -2 },
      uOpacity: { value: 1 },
      uLight: { value: new Vector3(-0.4, 0.7, 0.9).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){
        vec4 w = modelMatrix * vec4(position,1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform vec3 uRim; uniform vec3 uBg; uniform float uMix;
      uniform float uSweep; uniform float uOpacity; uniform vec3 uLight;
      varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(vV);
        float diff = 0.62 + 0.38 * max(dot(n, uLight), 0.0);
        vec3 h = normalize(uLight + v);
        float spec = pow(max(dot(n, h), 0.0), 48.0) * 0.55;
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        float band = 1.0 - smoothstep(0.0, 0.35, abs((vW.x + vW.y * 0.6) - uSweep));
        vec3 col = uColor * diff + vec3(spec);
        col += uRim * fres * mix(0.18, 0.45, uMix);
        col += mix(vec3(1.0), uRim, 0.35) * band * 0.55;
        gl_FragColor = vec4(col, uOpacity);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Candidate trajectories (merged tubes, one draw call). Attributes:
 *   aT       0..1 along the trajectory
 *   aEnd     where this candidate's journey currently rests (0..1)
 *   aSeed    per-trajectory phase
 *   aFeat    1 for the featured candidate
 * Travelled part: stage-ramp colour with a pulse flowing forward. Beyond
 * aEnd: a faint dotted continuation, the path that is still open.
 */
export function flowMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    side: DoubleSide,
    uniforms: {
      ...rampUniforms(),
      uTime: { value: 0 },
      uDraw: { value: 0 },
      uFocus: { value: 0 },
      uMix: live.mix,
      uDim: { value: live.dim },
    },
    vertexShader: /* glsl */ `
      attribute float aT; attribute float aEnd; attribute float aSeed; attribute float aFeat;
      varying float vT; varying float vEnd; varying float vSeed; varying float vFeat; varying float vFres;
      void main(){
        vT = aT; vEnd = aEnd; vSeed = aSeed; vFeat = aFeat;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vec3 v = normalize(cameraPosition - w.xyz);
        vFres = abs(dot(n, v));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_RAMP}
      uniform float uTime; uniform float uDraw; uniform float uFocus; uniform float uMix; uniform vec3 uDim;
      varying float vT; varying float vEnd; varying float vSeed; varying float vFeat; varying float vFres;
      void main(){
        if (vT > uDraw) discard;
        float travelled = step(vT, vEnd);
        vec3 col = ramp(vT);
        float pulse = pow(fract(vT * 3.0 - uTime * 0.18 + vSeed), 10.0);
        float core = smoothstep(0.0, 0.9, vFres);
        float a = travelled * (0.28 + 0.55 * pulse) * core;
        // open path ahead: faint dashes
        float dash = step(0.5, fract(vT * 60.0));
        a += (1.0 - travelled) * 0.12 * dash * core;
        col = mix(col, uDim, (1.0 - travelled) * 0.6);
        float focus = mix(1.0, mix(0.25, 1.0, vFeat), uFocus);
        a *= focus;
        a = mix(a, max(a, 0.95 * core * travelled), vFeat);
        col += vFeat * pulse * 0.35;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

/** Soft points: candidates (disc) and review pulses (ring). */
export function pointsMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: { uScale: { value: 1 }, uTime: { value: 0 }, uMix: live.mix, uInk: { value: live.ink } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute vec3 aColor; attribute float aKind; attribute float aAlpha;
      uniform float uScale;
      varying vec3 vColor; varying float vKind; varying float vAlpha;
      void main(){
        vColor = aColor; vKind = aKind; vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale * (10.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uMix; uniform vec3 uInk;
      varying vec3 vColor; varying float vKind; varying float vAlpha;
      void main(){
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        float a;
        vec3 col = vColor;
        if (vKind < 0.5) {
          float core = 1.0 - smoothstep(0.34, 0.42, r);
          float halo = (1.0 - smoothstep(0.35, 1.0, r)) * 0.35;
          a = core + halo;
          col = mix(col, vec3(1.0), core * 0.35 * uMix);
        } else {
          a = smoothstep(0.78, 0.86, r) * (1.0 - smoothstep(0.9, 1.0, r));
        }
        gl_FragColor = vec4(col, a * vAlpha);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Glass card with a rounded-rect SDF edge and an optional label mask
 * (white-on-transparent canvas texture tinted with the ink colour).
 */
export function cardMaterial(map: Texture | null, opts: { accent?: Color; radius?: number; aspect?: number } = {}) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uMap: { value: map },
      uHasMap: { value: map ? 1 : 0 },
      uGlass: { value: live.glass },
      uInk: { value: live.ink },
      uAccent: { value: opts.accent ?? live.s2 },
      uBg: { value: live.bg },
      uMix: live.mix,
      uOpacity: { value: 1 },
      uGlow: { value: 0 },
      uAspect: { value: opts.aspect ?? 1.6 },
      uRadius: { value: opts.radius ?? 0.12 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform float uHasMap; uniform vec3 uGlass; uniform vec3 uInk; uniform vec3 uAccent;
      uniform vec3 uBg; uniform float uMix; uniform float uOpacity; uniform float uGlow; uniform float uAspect; uniform float uRadius;
      varying vec2 vUv;
      float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main(){
        vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
        float d = sdRound(p, vec2(uAspect * 0.5, 0.5), uRadius);
        float aa = fwidth(d);
        float inside = 1.0 - smoothstep(-aa, aa, d);
        float edge = 1.0 - smoothstep(0.0, 0.012 + aa, abs(d));
        vec3 fill = mix(uGlass, uBg, 0.15);
        float sheen = smoothstep(0.5, -0.2, vUv.y + vUv.x * 0.3) * 0.12;
        vec3 col = fill + sheen;
        float a = inside * mix(0.86, 0.62, uMix);
        col = mix(col, uAccent, edge * (0.55 + uGlow * 0.45));
        a = max(a, edge * inside * 0.9);
        if (uHasMap > 0.5) {
          float m = texture2D(uMap, vUv).a;
          col = mix(col, uInk, m);
          a = max(a, m * inside);
        }
        col += uAccent * uGlow * 0.25 * inside;
        gl_FragColor = vec4(col, a * uOpacity);
        #include <colorspace_fragment>
      }`,
  });
}

/** Additive glow sprite for nodes (hire ring, head of a trace). */
export function glowMaterial(color: Color, strength = 1) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uColor: { value: color }, uStrength: { value: strength }, uMix: live.mix },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uStrength; uniform float uMix; varying vec2 vUv;
      void main(){
        float r = length(vUv - 0.5) * 2.0;
        float g = pow(max(1.0 - r, 0.0), 2.2) * uStrength * mix(0.55, 1.0, uMix);
        gl_FragColor = vec4(uColor * g, g);
        #include <colorspace_fragment>
      }`,
  });
}

/* ------------------------------------------------------------ labels */

const labelCache = new Map<string, CanvasTexture>();

/**
 * White text on a transparent canvas, used as an alpha mask by cardMaterial
 * so the label follows the theme's ink colour. Drawn with the site's font.
 */
export function labelTexture(text: string, opts: { w?: number; h?: number; size?: number; weight?: number; align?: CanvasTextAlign; sub?: string } = {}) {
  const key = JSON.stringify([text, opts]);
  const hit = labelCache.get(key);
  if (hit) return hit;
  const w = opts.w ?? 512;
  const h = opts.h ?? 320;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.textBaseline = "middle";
  g.textAlign = opts.align ?? "left";
  let size = opts.size ?? Math.round(h * 0.2);
  const font = (px: number) => `${opts.weight ?? 650} ${px}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
  g.font = font(size);
  // Shrink to fit 84% of the width so long labels never clip.
  while (size > 12 && g.measureText(text).width > w * 0.84) {
    size -= 2;
    g.font = font(size);
  }
  const x = g.textAlign === "center" ? w / 2 : w * 0.1;
  if (opts.sub) {
    g.fillText(text, x, h * 0.4);
    g.globalAlpha = 0.6;
    g.font = `500 ${Math.round(size * 0.62)}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
    g.fillText(opts.sub, x, h * 0.66);
  } else {
    g.fillText(text, x, h / 2);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;
  labelCache.set(key, tex);
  return tex;
}

/** Deterministic PRNG so every visitor sees the same composition. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));

/** Bare label: the texture's alpha tinted with a palette colour. */
export function inkMaterial(map: Texture, color: Color = live.ink, opacity = 1) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uMap: { value: map }, uColor: { value: color }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
      void main(){ float a = texture2D(uMap, vUv).a * uOpacity; if (a < 0.01) discard; gl_FragColor = vec4(uColor, a);
      #include <colorspace_fragment>
      }`,
  });
}

/**
 * Candidate Trace in 3D (one tube). uHead is the candidate's position
 * (0..1): behind it the path is lit in stage colours with evidence pulses,
 * ahead of it the path is a faint dashed promise.
 */
export function traceMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { ...rampUniforms(), uHead: { value: 0 }, uTime: { value: 0 }, uDim: { value: live.dim }, uMix: live.mix },
    vertexShader: /* glsl */ `
      attribute float aT; varying float vT; varying float vFres;
      void main(){
        vT = aT;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vFres = abs(dot(n, normalize(cameraPosition - w.xyz)));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_RAMP}
      uniform float uHead; uniform float uTime; uniform vec3 uDim; uniform float uMix;
      varying float vT; varying float vFres;
      void main(){
        float core = smoothstep(0.0, 0.8, vFres);
        float behind = 1.0 - smoothstep(uHead - 0.002, uHead + 0.002, vT);
        vec3 col = ramp(vT);
        float pulse = pow(fract(vT * 5.0 - uTime * 0.25), 12.0);
        float a = behind * (0.75 + 0.25 * pulse) * core;
        float dash = step(0.45, fract(vT * 90.0));
        a += (1.0 - behind) * 0.22 * dash * core;
        col = mix(uDim, col, behind);
        col += behind * pulse * 0.25;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Instanced glass cards (question pool). Per instance:
 *   aSel   0..1 how "selected / active" the card is (brightens, accent edge)
 *   aSaved 0..1 answer saved (fills the accent)
 *   aDim   0..1 pushed back (fades)
 */
export function instancedCardMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { ...rampUniforms(), uGlass: { value: live.glass }, uInk: { value: live.ink }, uBg: { value: live.bg }, uMix: live.mix },
    vertexShader: /* glsl */ `
      attribute float aSel; attribute float aSaved; attribute float aDim; attribute float aSeed;
      varying vec2 vUv; varying float vSel; varying float vSaved; varying float vDim; varying float vSeed;
      void main(){
        vUv = uv; vSel = aSel; vSaved = aSaved; vDim = aDim; vSeed = aSeed;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_RAMP}
      uniform vec3 uGlass; uniform vec3 uInk; uniform vec3 uBg; uniform float uMix;
      varying vec2 vUv; varying float vSel; varying float vSaved; varying float vDim; varying float vSeed;
      float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main(){
        vec2 p = (vUv - 0.5) * vec2(0.72, 1.0);
        float d = sdRound(p, vec2(0.36, 0.5), 0.07);
        float aa = fwidth(d);
        float inside = 1.0 - smoothstep(-aa, aa, d);
        float edge = 1.0 - smoothstep(0.0, 0.01 + aa, abs(d));
        vec3 accent = ramp(0.35 + vSel * 0.35 + vSaved * 0.3);
        vec3 col = mix(uGlass, uBg, 0.12);
        // question lines (never the answers): three bars
        float lines = 0.0;
        for (int i = 0; i < 3; i++) {
          float y = 0.78 - float(i) * 0.12;
          float w = 0.62 - float(i) * 0.14 - fract(vSeed * float(i + 3)) * 0.12;
          lines += step(abs(vUv.y - y), 0.022) * step(0.14, vUv.x) * step(vUv.x, 0.14 + w);
        }
        col = mix(col, uInk, lines * 0.35);
        // answer area fills when saved
        float box = step(0.14, vUv.x) * step(vUv.x, 0.86) * step(0.14, vUv.y) * step(vUv.y, 0.4);
        col = mix(col, accent, box * (0.18 + vSaved * 0.6));
        col = mix(col, accent, edge * (0.35 + vSel * 0.65));
        float a = inside * mix(0.9, 0.7, uMix);
        a = max(a, edge * inside);
        a *= 1.0 - vDim * 0.78;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

/** Deadline arc: a thin ring whose lit portion is the time used. */
export function arcMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { ...rampUniforms(), uProgress: { value: 0 }, uExtend: { value: 0 }, uOpacity: { value: 0 }, uDim: { value: live.dim }, uSignal: { value: live.s4 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_RAMP}
      uniform float uProgress; uniform float uExtend; uniform float uOpacity; uniform vec3 uDim; uniform vec3 uSignal;
      varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float ring = smoothstep(0.9, 0.915, r) * (1.0 - smoothstep(0.975, 0.99, r));
        float ang = fract(atan(p.x, p.y) / 6.28318 + 1.0);
        float total = 1.0 + uExtend;
        float used = step(ang * total, uProgress);
        float ext = step(1.0, ang * total) * uExtend;
        vec3 col = mix(uDim, ramp(ang), used);
        col = mix(col, uSignal, step(1.0, ang * total) * step(ang * total, 1.0 + uExtend));
        float a = ring * (0.35 + used * 0.65 + ext * 0.4) * uOpacity;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Flat ring on a plane (pools, stop markers). `dash` > 0 breaks the ring
 * into that many segments; uFill adds a faint disc inside.
 */
export function ringMaterial(color: Color, opts: { dash?: number; width?: number } = {}) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: 0 },
      uFill: { value: 0 },
      uDash: { value: opts.dash ?? 0 },
      uWidth: { value: opts.width ?? 0.035 },
      uSpin: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; uniform float uFill; uniform float uDash; uniform float uWidth; uniform float uSpin;
      varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float aa = fwidth(r);
        float ring = smoothstep(1.0 - uWidth * 2.0 - aa, 1.0 - uWidth * 2.0, r) * (1.0 - smoothstep(1.0 - aa, 1.0, r));
        if (uDash > 0.5) {
          float ang = fract(atan(p.y, p.x) / 6.28318 + uSpin);
          ring *= step(0.38, fract(ang * uDash));
        }
        float disc = (1.0 - smoothstep(1.0 - uWidth * 2.0 - aa, 1.0 - uWidth * 2.0, r)) * uFill;
        float a = max(ring, disc) * uOpacity;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }`,
  });
}
