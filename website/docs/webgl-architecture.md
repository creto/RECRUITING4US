# WebGL architecture

## One canvas, many scenes

`src/three/Stage.tsx` mounts **one** `<Canvas>` for the whole site: fixed full-viewport, `pointer-events: none`,
`z-index: 2`. It is lazy-loaded after first paint (`requestIdleCallback`, 700 ms timeout), so three.js is not in the
entry chunk.

Sections place a `<SceneSlot id="…" label="…">` (`src/three/SceneSlot.tsx`), a normal DOM box. When the slot first
comes within 20% of the viewport, it lazy-loads `ViewSlot`, which renders a drei `<View>` stretched over the slot. drei
tunnels each View into the shared canvas and scissors rendering to the slot's rectangle. Each scene brings its own
camera (`<PerspectiveCamera makeDefault>`), and its module is a separate chunk.

```
Section DOM  ─ SceneSlot (role="img", aria-label) ─ ViewSlot (lazy) ─ <View> ─┐
                                                                             │ tunnel
Stage (single Canvas) ─ PaletteDriver ─ PerformanceMonitor ─ <View.Port/> ◄──┘
```

Layering: `<main>` creates no stacking context, so section backgrounds sit under the canvas. Text that overlaps a
scene rectangle uses `.over-canvas` (`z-index: 3`).

## Scene registry and visibility control

`src/three/registry.ts` keeps each slot's `{ el, visible, reduced }`. One IntersectionObserver per slot updates
visibility. The canvas `frameloop` is `"always"` only while at least one slot is visible, and `"never"` otherwise.
Scenes also return early from `useFrame` when their slot is hidden, so an off-screen scene costs nothing. Hidden tabs
stop rendering naturally (rAF).

## Scenes

| id | File | What it explains | Driven by |
| --- | --- | --- | --- |
| `hero` | `scenes/Constellation.tsx` | Talent Constellation: the four chevrons of the mark assemble into the logo, a highlight sweeps it once, then they open into four stage gates. Candidate trajectories flow from the job opening toward hire; most rest at a gate with a review ring (a person decides); one featured candidate gathers evidence cards and reaches the offer | intro clock, pointer parallax, hero scroll (the camera travels from many candidates to one) |
| `journey` | `scenes/Journey.tsx` | Candidate Trace in 3D: one applicant through seven stages, the trace lighting behind them, evidence cards per stage, review rings | pinned-section progress |
| `sourcing` | `scenes/SourcingFlow.tsx` | Prospects (a loose field) gather into three pools; a referral route runs without a gate; the campaign route passes the consent gate (without consent a prospect walks up and returns to its pool), and a reply or bounce stops the send (amber, settles off the route). Only people who apply become an application card next to the pipeline chevron | section progress or a picked step (`sourcingProgress` store); narrow screens pan phase to phase |
| `resume` | `scenes/ResumeIndex.tsx` | A CV separates into the six indexed fields; search matches light up the fields | section progress + `cvHighlight` store (Boolean search) |
| `pool` | `scenes/AssessmentPool.tsx` | Question pool → stable subset → saved answers + receipt → audited extension on the deadline arc. No answer keys shown | slider step (`assessStep` store) + scroll |
| `liquid` | `scenes/PixelLiquid.tsx` | The single shader environment: a quantised flow field behind the coding lab, pointer ripple | time, pointer |
| `trust` | `scenes/TrustBoundary.tsx` | Company workspace boundary; three access paths (careers → published jobs only, candidate portal → own records, recruiter → whole workspace); another company kept apart | scroll |

## Shared materials (`src/three/materials.ts`)

All materials are `ShaderMaterial`s built from one small library:

- `chevronMaterial`: satin diffuse, soft specular, fresnel rim, branded highlight sweep (`uSweep`)
- `flowMaterial`: merged candidate trajectories. Travelled part in stage colours with forward pulses, the path ahead faint and dashed, and a focus uniform that dims the crowd around the featured candidate
- `traceMaterial`: the Candidate Trace tube with a moving head (`uHead`)
- `pointsMaterial`: soft candidate discs and review rings (one `Points` draw call)
- `cardMaterial` / `instancedCardMaterial`: rounded-rect SDF glass cards with label masks
- `arcMaterial`: deadline arc with extension segment
- `ringMaterial`: flat rings (pools, the dashed stop marker), optional dashes and inner fill
- `glowMaterial`: additive glow sprites; `inkMaterial`: labels
- GLSL simplex noise and a four-stop stage ramp shared by all of them

Colour uniforms reference the **live palette** (`three/palette.ts`): one set of `THREE.Color` instances that
`PaletteDriver` eases toward the active theme every frame. A theme switch re-lights every scene without touching
materials.

Labels are canvas textures drawn with the site's font (white text used as an alpha mask and tinted with the ink colour),
cached and auto-fitted to width.

## Performance measures

- one WebGL context, no post-processing passes (glow is done in the material shaders)
- merged geometry for trajectories (one draw call), `Points` for candidates and rings, `InstancedMesh` for the pool
- adaptive quality tiers (`three/quality.ts`): DPR cap 2 / 1.5 / 1, trajectory count 44 / 22 / 14, pool 72 / 48 / 32
- `PerformanceMonitor` lowers DPR when frame rate declines
- geometries and materials disposed on unmount; label textures cached
- scenes and three.js load lazily; the canvas renders only while a slot is visible

## Accessibility

Every slot has `role="img"` and an `aria-label`, and every section explains the same thing in real text. Reduced
motion: scenes render a static, meaningful pose. The intro jumps to its final state, time is frozen, there is no
parallax, and scroll-driven states jump instead of easing. Without WebGL, slots render their fallback (the hero shows
an SVG trace of the mark; sourcing shows a static SVG of the five steps).
