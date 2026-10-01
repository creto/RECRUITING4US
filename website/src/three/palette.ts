import { Color } from "three";
import { getTheme } from "@/theme/theme";

/**
 * Theme-aware live palette. One set of THREE.Color instances shared by every
 * scene's uniforms; PaletteDriver (in Stage) eases them toward the current
 * theme each frame, so WebGL lighting changes together with the page.
 */
const DEF = {
  light: {
    bg: "#f1f4ee",
    ink: "#08170f",
    dim: "#a9b8ad",
    glass: "#ffffff",
    rim: "#036145",
    s1: "#036145",
    s2: "#04a764",
    s3: "#4cc23a",
    s4: "#9bdc5a",
    glow: "#04a764",
    signal: "#b7791f",
  },
  dark: {
    bg: "#020d09",
    ink: "#eaf4e5",
    dim: "#2c4a3c",
    glass: "#0e2a1f",
    rim: "#d0fa8e",
    s1: "#0a8a5f",
    s2: "#04a764",
    s3: "#78dd55",
    s4: "#d0fa8e",
    glow: "#d0fa8e",
    signal: "#f0b95a",
  },
} as const;

type Key = keyof (typeof DEF)["light"];
export type LivePalette = Record<Key, Color> & { mix: { value: number } };

const theme0 = typeof document === "undefined" ? "light" : getTheme();
export const live: LivePalette = Object.assign(
  Object.fromEntries(Object.entries(DEF[theme0]).map(([k, v]) => [k, new Color(v)])) as Record<Key, Color>,
  { mix: { value: theme0 === "dark" ? 1 : 0 } },
);

const targets = {
  light: Object.fromEntries(Object.entries(DEF.light).map(([k, v]) => [k, new Color(v)])) as Record<Key, Color>,
  dark: Object.fromEntries(Object.entries(DEF.dark).map(([k, v]) => [k, new Color(v)])) as Record<Key, Color>,
};

/** Ease the live palette toward the active theme. Called once per frame. */
export function stepPalette(dt: number) {
  const theme = getTheme();
  const tgt = targets[theme];
  const k = 1 - Math.exp(-dt * 6);
  (Object.keys(tgt) as Key[]).forEach((key) => live[key].lerp(tgt[key], k));
  live.mix.value += ((theme === "dark" ? 1 : 0) - live.mix.value) * k;
}

export const stageColors = () => [live.s1, live.s2, live.s3, live.s4];
