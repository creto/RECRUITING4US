# Performance

## Budget (decided before building)

| Item | Budget | Status |
| --- | --- | --- |
| Entry JS (React, GSAP+ScrollTrigger, Lenis, page, copy) | ≤ 180 kB gzip | ~171 kB gzip (2026-09-30, after sourcing + portal) |
| 3D runtime (three + R3F + drei parts) | lazy, after first paint, ≤ 260 kB gzip | ~242 kB gzip, loaded on idle |
| Each 3D scene module | ≤ 6 kB gzip | 1.3–5.0 kB gzip (SourcingFlow 3.5 kB) |
| CSS | ≤ 35 kB gzip | ~33 kB gzip |
| Fonts on first view | 1 family (Latin subset) | Bricolage Latin 131 kB; JetBrains Mono only where code appears |
| Initial images | mark only (≤ 10 kB) | 3.5–7 kB PNG derivatives; product screenshots lazy, WebP, 1200/2400 w |
| WebGL contexts | 1 | 1 (shared canvas + drei `View`) |
| Simultaneous scenes drawing | ≤ 2 | usually 1; slots render only when visible |
| DPR cap | 2 desktop / 1.5 mid / 1 low | `three/quality.ts` + `PerformanceMonitor` step-down |
| Post-processing | none | none (glow lives in material shaders) |
| Mobile | fewer trajectories (22 or 14), smaller pool (48 or 32), fewer evidence cards | yes |

## Measured

`npm run build && npm run preview`, then `node scripts/perf.mjs` (headless Chromium, **software WebGL via SwiftShader**,
so FPS is a lower bound and not a real-GPU number):

| Metric | 1440×900 | 390×844 |
| --- | --- | --- |
| LCP | ~1.26 s | ~1.06 s |
| CLS (whole page scroll) | 0.03 | see note |
| First-load transfer | JS 417 kB* · CSS 30 kB · fonts 169 kB · images 180 kB → **7 kB after the mark derivatives** | same |
| Long tasks during load | 4 | 3 |
| Scroll FPS (software GL) | 14 | 47 |

\* includes the lazily fetched 3D runtime, which starts loading on idle within the 3 s sampling window.

Note on CLS: the first mobile measurement (0.44) came from content that grew after interaction or scroll: the
pipeline audit log, the offer-to-onboarding reveal and the product-tour probe. Those regions now reserve their final
size. Re-run `scripts/perf.mjs --width 390` after changes.

On a real GPU (integrated laptop graphics), expect 60 fps in every section: every scene is a handful of draw calls,
namely merged trajectories (1), candidate points (1), 4 chevrons, labels, the instanced pool (1), and one full-screen
quad for the pixel liquid.

## Techniques in use

- three.js, R3F and drei are never in the entry chunk: `Stage` and `ViewSlot` are `lazy()`, and each scene is its own
  chunk that loads when its slot nears the viewport
- the canvas `frameloop` switches to `"never"` when no slot is visible, and scenes return early when hidden
- merged `TubeGeometry` for all trajectories, `Points` for candidates and review rings, `InstancedMesh` for the pool
- materials and geometries are memoised and disposed on unmount; label textures are cached
- `PerformanceMonitor` lowers DPR on sustained frame drops
- Lenis runs on GSAP's ticker (one rAF loop); scroll listeners are passive and rAF-batched
- screenshots: WebP q82 with `srcset` 1200/2400 and `loading="lazy"`
- per-route static HTML, so metadata and first paint need no JS routing

## Next steps (not done)

- split below-the-fold sections into a lazily loaded chunk to reduce entry JS by ~20 kB gzip (it needs deep-link
  retry logic)
- subset Bricolage to the characters Spanish actually uses (~40% smaller)
- measure on real devices (a mid-range Android and a MacBook Air) with WebPageTest and record the numbers here
