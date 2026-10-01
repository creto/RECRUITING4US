# Accessibility baseline

Target: WCAG 2.2 AA principles. No critical information lives only in WebGL or only in motion.

| Area | Implementation |
| --- | --- |
| Structure | landmarks (`header`, labelled `nav`s, `main#contenido`, `footer`), one `h1`, one `h2` per section, skip link |
| Keyboard | every control is a native `button`/`a`/`input`; the Dock is plain links with a tooltip on focus; sliders respond to ← → Home End on the focused region; the mobile menu moves focus into the sheet, closes on Escape, locks page scroll while open and returns focus to the menu button |
| Focus | global `:focus-visible` outline in the theme's focus colour; buttons use a two-ring halo that is visible on any background |
| Screen readers | 3D slots are `role="img"` with an `aria-label`; the same content exists as text in the section. The pinned journey also renders its full content as an `ol.sr-only`. Sliders use `aria-roledescription="carrusel"` and labelled slides; tabs use `tablist`/`tab`/`tabpanel`; dynamic results (search, assessment step, integrity review, scorecard, form status) use `aria-live="polite"` |
| Forms | visible labels, `aria-invalid` + `aria-describedby` errors, a 48px control height, and a privacy note |
| Reduced motion | no Lenis; no parallax; 3D scenes show a static, meaningful pose; scrubbed sequences show their final state; CSS transitions are reduced to 1ms; View Transitions are skipped; the custom cursor is off |
| Reduced transparency | glass falls back to an opaque tint |
| Touch | targets ≥ 44px; draggable sliders keep vertical page scroll (`touch-action: pan-y` with direction locking) |
| Colour | body text `--ink`/`--ink-2` on `--bg` pass AA in both themes; green accents used as text are the dark forest (day) or sprout (night) variants, never mid-greens |
| Language | `lang="es"` |
| Cursor | the native cursor always stays visible; the custom ring is decorative |

Automated checks in this repo: `scripts/qa-interactions.mjs` covers theme persistence, Dock navigation and
`aria-current`, slider keyboard, search live region, mobile menu, the no-horizontal-overflow check at 390px, and
reduced motion (Lenis off). The same script runs **axe-core** (WCAG 2.0/2.1/2.2 A and AA rules) on the home page in both themes and fails on any serious or critical violation.
