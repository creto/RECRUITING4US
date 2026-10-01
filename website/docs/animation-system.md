# Animation system

## Motion language from the mark

The mark is four chevrons that move right, lighter as they go. That gives the site its grammar:

| Mark property | Motion rule |
| --- | --- |
| direction (→) | things advance; they do not bounce, spin or explode |
| four steps | progress is shown as discrete stages (ticks, tags, lanes), each in its stage colour |
| lighter as it goes | completion reads as the lightest green (sprout) |
| rounded corners | springs with a soft overshoot (`--ease-spring`), never elastic |

Durations: 180 ms (hover), 420 ms (state), 520–700 ms (stage change, route transition).

## Scroll engine (`src/motion/scroll.ts`)

- **Lenis** with `lerp: 0.14` (short, snappy inertia), driven by `gsap.ticker` with `lagSmoothing(0)`.
  `lenis.on("scroll", ScrollTrigger.update)` keeps both on one clock.
- Anchor links and the Dock use `scrollToId()`, which uses Lenis when present, moves focus to the target section for
  screen readers, and offsets for the fixed header.
- Reduced motion: Lenis is not created at all. Native scrolling and ScrollTrigger still work, and scrubbed sequences
  show their final state.

## Signature primitive: Candidate Trace

`src/ui/CandidateTrace.tsx`. One SVG line follows an applicant down the page. It is built from the real layout: each
section with `data-trace="1..5"` makes the line step out into a chevron at its stage tag and take that stage's colour
(a gradient with stops at those y-positions). The line changes meaning by stage, and the meaning is carried by shape,
not only colour:

| `data-trace` | Meaning | Sections | Stop mark | Line between stops |
| --- | --- | --- | --- | --- |
| 1 | invitation | careers, sourcing | open ring | dotted promise until reached |
| 2 | submission | pipeline, CV | filled square (the receipt) | solid |
| 3 | evidence | assessments, code | diamond | short ticks, one per piece of evidence |
| 4 | conversation | interviews, scheduling | two open rings | a second dashed strand joins |
| 5 | completion | offers, candidate portal | check | solid to the end |

It draws with scroll (`stroke-dashoffset` from a y→length lookup), the head sits at 62% of the viewport height, stage
marks fill when reached, and ticks/strands are revealed by a clip rect that follows the head. The SVG sits on the
content layer (z 3), above the shared canvas, because some scenes paint opaque backdrops. Desktop runs in the gutter
beside the Dock. Screens under 1100 px get a thin edge line with shallow chevrons and smaller marks (separate
geometry). The 3D sibling lives in the pinned journey (`scenes/Journey.tsx`), and the candidate portal's own stage
track reuses the same marks.

## Sequences

| Where | Mechanism | Notes |
| --- | --- | --- |
| Hero intro (animated logo) | R3F clock | chevrons arrive from depth → mark → highlight sweep → open into gates → trajectories draw |
| Hero headline | CSS | each stepped line wipes in left to right (clip-path), then the lede and CTAs; one orchestrated load moment |
| Journey (pinned) | CSS `position: sticky` + scroll progress | vertical snap text (stage names move by whole lines with a spring); the registra/decide pair swaps; 3D trace advances |
| Careers | ScrollTrigger (progress → step) | the embedded form evolves brand → vacancy → application → receipt; clicking a step hands control to the visitor |
| Sourcing | section progress → store → 3D, plus step buttons | prospects → pools → referral (no gate) / campaign through the consent gate → application; not pinned; a picked step holds until the visitor scrolls 140 px |
| Pipeline | ScrollTrigger (progress → lane) | one featured card moves one lane at a time; every move writes an audit line |
| CV index | section progress in 3D | the CV separates into six field layers; search matches glow |
| Assessments | ScrollTrigger + slider | step drives the 3D pool; interaction takes over from scroll |
| Offers → onboarding | ScrollTrigger + button | the accepted offer unfolds into the onboarding checklist |
| Candidate portal | IntersectionObserver, once | the one-time code types itself and the portal unlocks into "Mi recorrido"; any tab click cancels it; reduced motion starts on the journey |
| Trust | scroll in 3D | the camera slowly orbits the company boundary |

Only two sections pin (Journey, plus the sticky controls in Careers and CV). Nothing fades up on every element.

## Sliders (`src/motion/useSlider.ts`)

One headless hook drives: drag (mouse, pen, touch) with direction locking, rubber-banding at the ends, and
velocity-aware release (a flick advances); keyboard ← → Home End on the focused region; prev/next/goTo for buttons and
tabs. Each slider has its own visuals:

1. **Journey snap text**: stage names, vertical
2. **Assessment slider**: Banco → Intento → Evidencia → Revisión, horizontal cards with a four-colour rail, synced to 3D
3. **Interview slider**: Agenda → Sala en vivo → Scorecard → Decisión, a different illustration per slide
4. **Product tour**: real screenshots in perspective, with side slides rotated and dimmed
5. **Careers stepper**: brand → vacancy → application → receipt

All use `role="region"` with `aria-roledescription="carrusel"`, labelled slides, visible focus, and a CSS spring snap
that reduced motion disables.

## Page transitions

`navigate()` wraps route changes in `document.startViewTransition`. The new page is revealed behind a chevron-shaped
leading edge that sweeps left to right (580 ms) while the old page recedes slightly (`theme/transitions.css`). Theme
changes use a circular reveal from the toggle instead. Both are skipped under reduced motion or without View
Transition support.

## Cursor

`src/ui/Cursor.tsx`: a thin ring trailing the native pointer, which stays visible. Over controls it tightens and fills
slightly; over draggable sliders (`data-cursor="drag"`) it shows a horizontal grip. There is no trail, blob or glow.
It is off for touch and for reduced motion.

## Dock

Vertical Liquid Glass Dock (≥1100 px): spring magnification by pointer distance, a chevron marker for the current
section (tracked by one IntersectionObserver over `[data-dock]`), and tooltips on hover and on keyboard focus. Mobile
replaces it with a full-screen sheet that lists the same stages as a vertical journey.
