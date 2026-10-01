import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from "three";
import type { SceneProps } from "../ViewSlot";
import { live } from "../palette";
import { GLSL_NOISE } from "../materials";

/*
 * PIXEL LIQUID. The site's single shader environment, behind the coding lab.
 * A slow flow field in the four brand greens, quantised into soft pixels,
 * like code evidence settling. The pointer leaves a short-lived ripple.
 * Deliberately quiet on the left where the text sits.
 */
export default function PixelLiquid({ slot }: SceneProps) {
  const size = useThree((s) => s.size);
  const mouse = useRef({ x: 0.7, y: 0.5, e: 0 });
  const mesh = useRef<Mesh>(null);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uRes: { value: new Vector2(1, 1) },
          uPixel: { value: 12 },
          uMouse: { value: new Vector2(0.7, 0.5) },
          uEnergy: { value: 0 },
          uS1: { value: live.s1 },
          uS2: { value: live.s2 },
          uS3: { value: live.s3 },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: /* glsl */ `
          ${GLSL_NOISE}
          uniform float uTime; uniform vec2 uRes; uniform float uPixel; uniform vec2 uMouse; uniform float uEnergy;
          uniform vec3 uS1; uniform vec3 uS2; uniform vec3 uS3;
          varying vec2 vUv;
          void main(){
            vec2 px = vUv * uRes;
            vec2 cell = floor(px / uPixel);
            vec2 cuv = (cell + 0.5) * uPixel / uRes;
            vec2 local = fract(px / uPixel) - 0.5;
            vec2 p = cuv * vec2(uRes.x / uRes.y, 1.0) * 1.7;
            float t = uTime * 0.06;
            vec2 w = vec2(snoise(vec3(p, t)), snoise(vec3(p + 7.3, t)));
            float v = snoise(vec3(p + w * 0.9, t * 1.4)) * 0.5 + 0.5;
            vec2 m = (cuv - uMouse) * vec2(uRes.x / uRes.y, 1.0);
            float d = length(m);
            v += uEnergy * exp(-d * 7.0) * (0.5 + 0.5 * sin(d * 40.0 - uTime * 6.0));
            float q = floor(v * 5.0) / 5.0;
            // Quiet behind the copy (left and top), livelier bottom-right.
            float quiet = smoothstep(0.35, 0.95, cuv.x) * 0.75 + smoothstep(0.55, 0.0, cuv.y) * 0.25;
            vec3 base = vec3(0.006, 0.03, 0.02);
            vec3 col = base;
            col = mix(col, uS1 * 0.42, step(0.6, q));
            col = mix(col, uS2 * 0.5, step(0.8, q));
            col = mix(col, uS3 * 0.62, step(0.95, q));
            float lit = step(0.6, q) * mix(0.12, 0.85, clamp(quiet, 0.0, 1.0));
            float shape = 1.0 - smoothstep(0.3, 0.4, max(abs(local.x), abs(local.y)));
            col = mix(base, col, lit * shape);
            float vign = smoothstep(1.2, 0.3, length(vUv - vec2(0.75, 0.35)));
            col *= 0.7 + 0.3 * vign;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const geo = useMemo(() => new PlaneGeometry(2, 2), []);
  useEffect(
    () => () => {
      mat.dispose();
      geo.dispose();
    },
    [mat, geo],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = slot.el?.getBoundingClientRect();
      if (!r) return;
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      mouse.current.x = x;
      mouse.current.y = y;
      mouse.current.e = 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [slot]);

  useFrame((st, dt) => {
    if (!slot.visible) return;
    const u = mat.uniforms;
    u.uTime.value = slot.reduced ? 12 : st.clock.elapsedTime;
    u.uRes.value.set(size.width, size.height);
    u.uPixel.value = size.width < 700 ? 9 : 12;
    const m = mouse.current;
    (u.uMouse.value as Vector2).lerp(new Vector2(m.x, m.y), 0.12);
    m.e = Math.max(0, m.e - dt * 0.8);
    u.uEnergy.value = slot.reduced ? 0 : m.e;
  });

  return <mesh ref={mesh} geometry={geo} material={mat} frustumCulled={false} />;
}
