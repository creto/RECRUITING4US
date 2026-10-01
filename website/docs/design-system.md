# Design system

## Brand tokens sampled from the official mark

Source: `public/mark.png` (537 × 400, four rounded chevrons) and `public/favicon.svg` in the app repo. The website
copies the PNG to `website/public/brand/mark.png` and uses it as-is in the header, footer and share card. No logo was
redrawn.

Pixel samples along row y=200 of the PNG (centre of each chevron) and the favicon's declared strokes:

| Chevron | PNG sample | favicon.svg | Token | Meaning on the site |
| --- | --- | --- | --- | --- |
| 1 (left) | `#046247` | `#036145` | `--r4-forest` | invitation: careers, sourcing |
| 2 | `#05a563` | `#04A764` | `--r4-jade` | submission: application, pipeline, CV |
| 3 | `#76dd55` | `#78DD55` | `--r4-leaf` | evidence: assessments, code, interviews |
| 4 (right) | `#d2fa8e` | `#D0FA8E` | `--r4-sprout` | completion: offer, onboarding |

The favicon values match the PNG within anti-aliasing noise and are used as the exact tokens.

Geometry, measured from the PNG, is in `src/brand/markGeometry.ts`: pitch ≈105.5 px, band ≈87 px, chevron depth
≈110 px, corner radius ≈20 px. It is used only to **animate** the supplied mark: the 3D intro, the SVG fallback and
the small chevron glyphs in stage tags, Dock markers, buttons and the Candidate Trace.

**Rule:** the four greens are a progression scale, never a random accent. Stage colour = how far a candidate has
travelled.

## Themes

| Token | Day | Night |
| --- | --- | --- |
| `--bg` | `#f1f4ee` (cool paper, green cast) | `#020d09` (forest-black) |
| `--ink` | `#08170f` | `#eaf4e5` |
| `--accent-ink` (text accent) | `#036145` | `#d0fa8e` |
| `--accent-fill` | `#04a764` | `#78dd55` |
| `--signal` (integrity signals, warnings) | `#b7791f` | `#f0b95a` |

Day is the default for a candidate-friendly first impression, and the OS preference is respected. The stored choice
(`localStorage["r4-theme"]`) is applied before first paint by an inline script, so there is no flash. `.band-dark`
re-declares night tokens locally for the coding lab, so that band is dark in both themes.

The theme toggle (`src/ui/ThemeToggle.tsx`) is a custom switch: a disc that a second disc slides over to become a
crescent, over a four-colour horizon. The change is a circular View Transition reveal from the knob. WebGL colours
ease to the new palette (`three/palette.ts`), and the Candidate Trace, glass, Dock and footer change through CSS
variables.

## Typography

One family carries the voice: **Bricolage Grotesque Variable** (weight 200–800, width 75–100). It is human and
slightly irregular, like people rather than machines. Its condensed width, used at display sizes, echoes the app's
condensed Oswald headings, and it stays highly legible as body text. **JetBrains Mono** appears only where real
code or search syntax is shown.

| Role | Setting |
| --- | --- |
| Display (hero) | 760 weight, `wdth` 78, 0.9 leading, −0.035em. The **stepped headline** indents each line further right, like the four chevrons |
| H2 | `--step-4`, 720, `wdth` 82 |
| H3 | `--step-2`, 650, `wdth` 90 |
| Body | 17px, 1.55 leading, measure ≤ 62ch |
| Stage tags | 600 weight, sentence case, chevron glyph in stage colour, `n/8` in tabular numerals |
| Data labels / counts | Bricolage with `tabular-nums`, not monospace |
| Code, search syntax | JetBrains Mono |

Rules: sentence case throughout; no all-caps eyebrows; no single-word colour accents in headlines; no "→" appended to
link text.

## Liquid Glass (`src/theme/glass.css`)

Glass is reserved for **interaction, context, hierarchy and control**: header nav, Dock, theme toggle, slider and tab
controls, filters/presets, secondary CTAs. Content sections are never wrapped in glass.

Material layers:

1. theme-tinted translucent fill + `backdrop-filter: blur(18px) saturate(1.6)`
2. refraction feel: an inner vertical gradient
3. pointer-responsive specular highlight (`--gx/--gy`, set by `useSpecular`)
4. controlled border reflection: a conic border mask whose angle follows the pointer (`--ga`)
5. depth-aware shadow per theme
6. spring press: `.glass-press` compresses on `:active` and springs back (`--ease-spring`)

Fallbacks exist for missing `backdrop-filter` and for `prefers-reduced-transparency`.

## Buttons

Buttons advance rather than grow. On hover, four chevron ticks light left to right in the stage colours and the arrow
steps forward. Press compresses the button. Focus shows a two-ring halo (background colour, then the focus colour).
There is no `scale(1.05)`.

## Visual primitives (abstractions, not product UI)

Candidate node (soft point), review ring (a person is deciding), stage gate (chevron), evidence card (glass card with
label), application card (pipeline lanes), resume layer (index slabs), assessment token (instanced cards), deadline
arc, integrity signal (amber `--signal`), calendar slot, offer plane, onboarding task, company boundary (glass volume).
Where real UI is needed we use real screenshots (`ProductShot`) from the synthetic Northstar Labs demo.
