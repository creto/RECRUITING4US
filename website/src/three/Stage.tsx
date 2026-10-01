import { useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, View } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { activeSlots, stageMounted } from "./registry";
import { stepPalette } from "./palette";
import { QUALITY } from "./quality";
import s from "./Stage.module.css";

function PaletteDriver() {
  useFrame((_, dt) => stepPalette(Math.min(dt, 0.1)));
  return null;
}

/**
 * The single shared WebGL canvas. Fixed over the page with pointer-events
 * off; each section's <SceneSlot> tunnels its scene in through drei <View>,
 * which scissors rendering to that section's rectangle. One GL context, one
 * render loop, lazy scenes, and no rendering at all when no slot is near the
 * viewport.
 */
export default function Stage() {
  const active = useStore(activeSlots);
  const [dpr, setDpr] = useState(() => Math.min(QUALITY.dpr, window.devicePixelRatio || 1));

  useEffect(() => {
    stageMounted.set(true);
    return () => stageMounted.set(false);
  }, []);

  return (
    <Canvas
      className={s.stage}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2 }}
      frameloop={active > 0 ? "always" : "never"}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false, depth: true }}
      camera={{ position: [0, 0, 10], fov: 35 }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <PaletteDriver />
      <PerformanceMonitor flipflops={2} onDecline={() => setDpr((d) => Math.max(1, d - 0.5))} />
      <View.Port />
    </Canvas>
  );
}
