import { lazy, Suspense, type ComponentType } from "react";
import { View } from "@react-three/drei";
import type { SlotState } from "./registry";
import type { SceneId } from "./scenes";

export type SceneProps = { slot: SlotState };

const SCENES: Record<SceneId, ComponentType<SceneProps>> = {
  hero: lazy(() => import("./scenes/Constellation")),
  journey: lazy(() => import("./scenes/Journey")),
  sourcing: lazy(() => import("./scenes/SourcingFlow")),
  resume: lazy(() => import("./scenes/ResumeIndex")),
  pool: lazy(() => import("./scenes/AssessmentPool")),
  liquid: lazy(() => import("./scenes/PixelLiquid")),
  trust: lazy(() => import("./scenes/TrustBoundary")),
};

const FILL = { position: "absolute", inset: 0 } as const;

/**
 * drei's DOM <View> tracks its own element, so it is stretched over the
 * slot; the slot element itself stays the accessible, labelled container.
 */
export default function ViewSlot({ id, slot }: { id: SceneId; slot: SlotState }) {
  const Scene = SCENES[id];
  return (
    <View style={FILL}>
      <Suspense fallback={null}>
        <Scene slot={slot} />
      </Suspense>
    </View>
  );
}
