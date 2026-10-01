# RECRUIT4US website vNext

The public, Spanish-first product website for **RECRUIT4US**, the hiring workspace of the TIGLOBAL 4US family.
It is an immersive site (React + Vite + Three.js/R3F + GSAP/ScrollTrigger + Lenis) that tells the candidate
journey: descubrir → postular → filtrar → evaluar → entrevistar → revisar → ofertar → incorporar.

It lives **beside** the hiring app in this repository (`creto/RECRUITING4US`) as an independent package:

```
/                  the RECRUIT4US app (TanStack Start). Untouched by the website.
/website           this package: own package.json, lockfile, tsconfig, lint, tests, CI, deploy.
```

The website never imports from `../src`. The app's `/login`, auth, ATS, assessments and every other route are unchanged;
"Ingresar" links point to the app's `/login` (see `VITE_APP_ORIGIN`).

## Commands

From the repository root:

```bash
npm run website:install   # npm --prefix website ci
npm run website:dev       # http://localhost:5190
npm run website:build     # static build in website/dist
```

Inside `website/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `0.0.0.0:5190` |
| `npm run build` | typecheck, production build, then per-route HTML + sitemap + robots (`scripts/seo-routes.mjs`) |
| `npm run preview` | serve `dist/` on `:5191` |
| `npm run typecheck` / `lint` / `test` | TypeScript, ESLint, Vitest |
| `npm run claims` | product-claim scanner (blocks forbidden marketing claims, see `docs/marketing-claims.md`) |
| `npm run check` | typecheck + lint + test + claims |
| `npm run smoke` | render smoke of every route, desktop + mobile, JSON verdict (`-- --base http://127.0.0.1:5191` for the built site) |
| `node scripts/qa-interactions.mjs` | interaction checks + axe-core in light and dark |
| `node scripts/qa-states.mjs --id sourcing --offsets 0,400 --click "#sourcing ol button"` | one section at scroll offsets and after clicking controls |
| `npm run shots -- --widths 1440,390 --themes light,dark --sections inicio,pipeline` | visual QA screenshots into `artifacts/qa/` |
| `npm run og` | regenerate the Spanish share card `public/og-es.jpg` |

Node 20.19+ (CI uses Node 22).

## Environment

Copy `.env.example` to `.env.local` if you need to change defaults. All values are optional.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_APP_ORIGIN` | empty (same origin) | Origin of the RECRUIT4US app; "Ingresar" goes to `${VITE_APP_ORIGIN}/login` |
| `VITE_SITE_ORIGIN` | `https://recruit4us.tiglobal.com.co` | Canonical URLs, sitemap, Open Graph (owner to confirm the final domain) |
| `VITE_DEMO_ENDPOINT` | empty | HTTPS endpoint that receives the demo-request JSON. Empty → the form opens a prefilled email |
| `VITE_DEMO_EMAIL` | `info@tiglobal.com.co` | Recipient for the email fallback |

## Documentation

| Topic | File |
| --- | --- |
| Architecture, routing, folder layout | `docs/architecture.md` |
| Design system, brand tokens sampled from the logo, typography, Liquid Glass | `docs/design-system.md` |
| Visual direction and critique notes | `docs/visual-direction.md` |
| WebGL architecture (single canvas, scene registry, shaders) | `docs/webgl-architecture.md` |
| Animation system (Lenis, ScrollTrigger, Candidate Trace, sliders, transitions) | `docs/animation-system.md` |
| Performance budget and measurements | `docs/performance.md` |
| Accessibility baseline | `docs/accessibility.md` |
| SEO | `docs/seo.md` |
| Deploy | `docs/deploy.md` |
| Asset inventory | `docs/asset-inventory.md` |
| Product truth: inventory, sources, feature verification | `docs/recruit4us-product-inventory.md`, `docs/product-sources.md`, `docs/feature-verification.md` |
| Integration status | `docs/integration-status.md` |
| Marketing claims + forbidden-claim scanner rules | `docs/marketing-claims.md` |
| Northstar demo safety (screenshots) | `docs/northstar-demo-safety.md` |
| Authentic UI screenshots inventory | `docs/authentic-ui-inventory.md` |
| QA notes (visual, motion, WebGL) | `docs/qa-notes.md` |

## Honesty rules (short version)

Scores are evidence; people decide. The site never claims AI decisions, automatic rejection, hosted video, a LinkedIn
connection, multi-language formal judging, always-on external email or calendar sync, native HRIS connectors, or
certifications. `npm run claims` enforces this in CI.
