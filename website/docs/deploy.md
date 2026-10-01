# Deploy

The website is a static build (`website/dist`). It deploys independently of the app.

## Vercel (recommended)

Create a **separate Vercel project** pointing at this repository with **Root Directory = `website`**.
`website/vercel.json` sets:

- `buildCommand: npm run build`, `outputDirectory: dist`, `cleanUrls: true`
- fallback of unknown paths to `/index.html` (the client router renders the 404 view). `/assets/*` is excluded so a
  missing chunk is never served as HTML.
- immutable caching for `/assets/*`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Environment variables (Project → Settings → Environment Variables):

| Variable | Example | Notes |
| --- | --- | --- |
| `VITE_APP_ORIGIN` | `https://app.recruit4us.example` | Where "Ingresar" sends people (`/login` on the app) |
| `VITE_SITE_ORIGIN` | `https://recruit4us.tiglobal.com.co` | Canonical URLs + sitemap; **owner to confirm the domain** |
| `VITE_DEMO_ENDPOINT` | `https://forms.example/recruit4us-demo` | Optional. Without it the demo form opens a prefilled email |
| `VITE_DEMO_EMAIL` | `info@tiglobal.com.co` | Email fallback recipient |

The app's own Vercel project (repository root) is unaffected: its `vercel.json` and build do not include `website/`.

## Same-domain option

To serve the website at `/` and the app at `/login` etc. on one domain, put a proxy or rewrite layer in front
(for example, Vercel rewrites on a small edge project) that routes `/login`, `/app`, `/api`, `/portal`, `/assess`,
`/code`, `/live`, `/book`, `/careers`, `/embed`, `/invite`, `/track`, `/status`, `/notice` and the app's assets to the
app, and everything else to the website. With that setup, leave `VITE_APP_ORIGIN` empty. This is not configured in
this repository.

## CI

`.github/workflows/website.yml` runs on changes under `website/**`: `npm ci`, typecheck, lint, tests, the claims
scanner, and the build.

## Checklist before publishing

- [ ] `VITE_SITE_ORIGIN` confirmed; `og:image` (`/og-es.jpg`) reachable on that origin
- [ ] `VITE_APP_ORIGIN` points to the production app
- [ ] demo endpoint or mailbox confirmed with TIGLOBAL
- [ ] `npm run check` green; `npm run build` green
- [ ] product screenshots (`public/product/`) reviewed against `docs/northstar-demo-safety.md`
