# Architecture

## Placement: the website lives beside the app

The owner asked for the website inside the existing repository and for `/login` and every app route to stay
untouched. The website is therefore a **separate package** in `website/`:

- own `package.json` + lockfile. It does not share `node_modules` with the app, so three.js/R3F/GSAP never reach the app bundle.
- own `tsconfig`, ESLint config, Vitest, CI workflow (`.github/workflows/website.yml`) and Vercel config
- the app's root `eslint.config.mjs` ignores `website/**`; the app's `tsconfig.json` only includes `src` and `server`
- root scripts `website:install`, `website:dev`, `website:build` delegate with `npm --prefix website`

The website never imports from `../src`. Where the website needs product behaviour for a demo (Boolean search), it has
its own small implementation that mirrors the documented rules (`src/lib/booleanSearch.ts`).

Calls to action that enter the product link to `${VITE_APP_ORIGIN}/login`. The website never renders a login.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build | Vite 8, TypeScript 5.9, React 19 | fast, static output, no server needed |
| Routing | ~80-line history router (`src/app/router.ts`) | four public routes; View Transitions for route changes |
| 3D | three 0.186, @react-three/fiber 9, drei 10 | one shared canvas with `View` scissoring |
| Scroll | Lenis (driven by GSAP's ticker) + GSAP ScrollTrigger | one clock, no desync |
| Styling | CSS Modules + global tokens (`src/theme`) | no runtime CSS-in-JS, theme through CSS variables |
| Fonts | Bricolage Grotesque Variable (wght + wdth), JetBrains Mono Variable (code only) | self-hosted via Fontsource |

## Folder layout

```
src/
  app/         App shell, router, per-route meta, pages (/seguridad, /integraciones, /contacto, 404), Home composition
  sections/    one file per home section (+ CSS module); helpers in sections/interviews, sections/trust
  three/       Stage (the single canvas), SceneSlot/ViewSlot, registry, palette, materials (shaders), geometry, scenes/*
  motion/      scroll engine (Lenis+ScrollTrigger), progress helpers, useSlider, active-section tracking
  ui/          Header, Dock, ThemeToggle, Cursor, Button, Logo, CandidateTrace, SectionHead, StageTag, ProductShot, Footer
  theme/       tokens.css, base.css, glass.css, transitions.css, theme store
  content/     es.ts (all copy), i18n.ts (locale seam), resumes.ts (synthetic demo data)
  brand/       markGeometry.ts: geometry measured from the official mark (for animation only)
  lib/         env, media queries, tiny store, boolean search
scripts/       seo-routes, check-claims (+claims-lib), make-og, screenshots
tests/         Vitest: router, copy rules, slider, boolean search
docs/          this documentation
```

## Routes

| Path | Content |
| --- | --- |
| `/` | the full narrative (17 sections) |
| `/seguridad` | trust, isolation, privacy and integrity in depth |
| `/integraciones` | full integration status matrix + technical notes |
| `/contacto` | demo request |
| anything else | 404 (client-rendered; `dist/404.html` is also generated with `noindex`) |

Home section ids (the contract used by the Dock, mobile menu, deep links and the Candidate Trace):
`inicio, que-es, recorrido, vacantes, sourcing, pipeline, cv, evaluaciones, codigo, entrevistas, agenda, ofertas,
portal, confianza, integraciones, tour, demo`. Each section declares its Dock group with `data-dock` and its Candidate
Trace meaning with `data-trace="1..5"` (invitation, submission, evidence, conversation, completion).

## i18n

Spanish is the only published locale. All copy is in `src/content/es.ts`; components read it through `useCopy()`.
Adding English means creating `en.ts` typed as `Copy` (the compiler lists every missing string) and registering it in
`i18n.ts`. We do not publish machine English.

## Data

The site has no backend. The demo form posts JSON to `VITE_DEMO_ENDPOINT` if configured, otherwise opens a prefilled
email. It asks for no candidate data.
