# QA notes (visual, motion, WebGL)

Latest pass: 2026-09-30, branch `website-vnext`. Screenshots are written to `artifacts/qa/` (git-ignored); rerun the
commands below to regenerate them. Headless Chromium uses SwiftShader, so screenshots prove layout and rendering,
not GPU frame times.

## Tools

| Command | What it proves |
| --- | --- |
| `npm run check` | typecheck, ESLint, Vitest (router, slider, Boolean search), claims scanner |
| `npm run smoke [-- --base URL]` | every route (`/`, `/seguridad`, `/integraciones`, `/contacto`, 404) on desktop 1440 and mobile 390: visible h1, real text in `<main>`, no uncaught/console errors, no failed same-origin requests, no module script served as HTML, no horizontal overflow. JSON verdict, exit 1 on failure |
| `node scripts/qa-interactions.mjs` | theme toggle + persistence, Dock scroll + `aria-current`, assessment slider keyboard, Boolean search result + error, route change + title, mobile menu, mobile overflow, reduced motion (no Lenis), **axe-core** WCAG 2.0/2.1/2.2 A+AA in light and dark (fails on serious/critical) |
| `npm run shots -- --widths … --themes … --sections …` | section screenshots per width/theme, fails on console errors |
| `node scripts/qa-states.mjs --id <section> --offsets … --click "<selector>"` | one section at several scroll offsets and after clicking each matching control (scroll-driven and interactive states) |
| `node scripts/perf.mjs` | performance capture (see `performance.md`) |

Production check: `npm run build`, then `npx vite preview --host 127.0.0.1 --port 5191` and
`npm run smoke -- --base http://127.0.0.1:5191`.

## Results of the latest pass

| Check | Dev (:5190) | Production build (:5191) |
| --- | --- | --- |
| typecheck / lint / tests (26) / claims (30 rules, 0 block) | pass | n/a |
| build | n/a | pass; entry 171 kB gzip (budget 180), CSS 33 kB gzip (budget 35) |
| smoke, 5 routes × 2 viewports | pass | pass |
| interactions + axe, light and dark | 14/14 pass, 0 serious/critical | not run |

Visual matrix (directive §135): 1440, 1280, 1024, 768, 430, 390, 375 × light/dark for the hero, sourcing and the
candidate portal; plus every home section at 1440 and 390 (light) and the lower sections at 1440 at several offsets,
and the three subpages. No console errors in any capture.

## Findings fixed in this pass

| Finding | Fix |
| --- | --- |
| Hero: the "Vacante" job card overlapped the lede at 1440 | narrower lede, card seated under the trajectories' origin |
| Hero: constellation ran off the right edge at 1024 and off the left at 768 | re-centred for square viewports; stacked tablets scale down |
| Candidate Trace disappeared behind the code section (the canvas paints that backdrop) | trace moved to the content layer (z 3); it lives in the gutter so it never covers content |
| Interviews, scheduling and offers had no trace anchors | anchors added; trace now carries five stage meanings (see `animation-system.md`) |
| Sourcing was the thinnest section (a CSS line with dots) | rebuilt as a scroll-driven 3D flow with real step buttons; mobile pill row keeps the scene in view |
| No candidate-experience section (directive §50) | candidate portal section added; copy checked against `/portal` vs `/candidate` |
| Portal copy implied the JSON download after a code login | corrected: download and onboarding tasks are in the signed-in account |
| 21 px horizontal overflow at 390 (assessment slider's `1fr` column) | `minmax(0, 1fr)` and tighter tabs under 480 px |
| `npm run smoke` pointed at a missing file | `scripts/smoke.mjs` written |
| axe: `aria-label` on a `<p>` (portal code) | screen-reader text instead |
| Dangling `docs/brand-tokens-from-logo.md` reference | points to `design-system.md` |

## Motion QA

Checked by stepping scroll offsets and clicking controls (`qa-states.mjs`), in normal and reduced motion:

- **Hero**: intro (chevrons from depth → mark → sweep → gates → trajectories) settles by ~4.5 s; scroll focuses one
  application. Reduced motion renders the settled pose.
- **Candidate Trace**: draws with scroll; marks fill as the head passes; evidence ticks and the conversation strand
  are revealed by the head, never ahead of it.
- **Sourcing**: phases follow scroll without pinning; a clicked step plays the scene there and holds until the visitor
  scrolls 140 px. Reduced motion shows the resolved flow (people in pools, routes drawn, stops marked, application lit).
- **Portal**: the code types once when the device is 45% visible, then unlocks into the journey; any tab click cancels
  it. Reduced motion starts on the journey with no typing.
- **Theme switch**: page, glass, trace and every scene re-light together (live palette eased per frame).

## WebGL QA

- One WebGL context for the site; scenes are separate lazy chunks (1.3–5 kB gzip each) loaded when their slot nears
  the viewport; the canvas frameloop is `never` when no slot is visible.
- Every scene disposes its geometries and materials on unmount (checked in code for the new `SourcingFlow`).
- Mobile tier: fewer people in sourcing (40 / 26 vs 64), fewer trajectories, lower DPR cap.
- Not measured here: real GPU frame time, memory and draw calls on hardware. Profile on a mid-range phone and a laptop
  with the browser's performance panel before launch.

## Known limits

- Pushing `website-vnext` to GitHub is blocked: the OAuth app lacks the `workflow` scope needed for
  `.github/workflows/website.yml`. Commits stay local until a token with that scope pushes them; history is not
  rewritten.
- Entry JS is within budget but close; the next lever is a lazily loaded chunk for the sections below the Journey
  (needs deep-link scrolling and section tracking to wait for that chunk).
