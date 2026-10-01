# Visual direction

Written before building, as the brief requires (frontend-design process), then revised.

## Subject, audience, job

- **Subject:** RECRUIT4US, one company's hiring workspace: careers pages, pipeline, assessments, code, interviews,
  offers and onboarding.
- **Audience:** Spanish-speaking (LatAm/Colombia) talent leaders, recruiters and hiring managers; candidates also see
  the brand.
- **Job:** in 30 seconds a visitor understands that RECRUIT4US moves **people** through a hiring journey, gathers
  **evidence** at each step, and leaves the **decision** to people.

## Concept: the talent journey, drawn with the mark

The official mark is four chevrons that go right and get lighter. We read it as a candidate travelling through
stages. Everything visual comes from that:

- **Colour** is progress: forest (invitation) → jade (submission) → leaf (evidence) → sprout (completion).
- **The Candidate Trace**, one line down the whole page that steps out into a chevron at each stage, is the signature
  primitive.
- **The hero** assembles the actual mark from depth, then opens its four chevrons into stage gates that candidate
  trajectories flow through.
- **Review rings** mark the places where a person decides. Resting candidates are "waiting for review", never
  "rejected".

## Plan (first pass)

- Colour: paper `#f1f4ee`, ink `#08170f`, forest `#036145`, jade `#04a764`, leaf `#78dd55`, sprout `#d0fa8e`. Night
  `#020d09`.
- Type: Bricolage Grotesque (display condensed via `wdth`, body normal); JetBrains Mono only for code.
- Layout: left-aligned editorial grid; a gutter reserved for the Dock and the Trace; sections alternate composition
  (split heads, full-bleed bands, sticky studios, pinned story).

```
┌ Dock ┐ ┌──────────── wrap ────────────────────────────────┐
│  ▸   │ │ Stage tag                                         │
│  ▸   │ │ H2 (condensed, 3 lines)         body (right col)  │
│  ▸  ⟩│ │ ───────────── section-specific composition ────── │
│      │ │                                                   │
└──────┘ └───────────────────────────────────────────────────┘
   ▲ Candidate Trace runs here and steps out (⟩) at each stage tag
```

## Critique against the defaults and what changed

| Risk | Decision |
| --- | --- |
| "Near-black with one acid-green accent" (dark default) | Day is the default theme; the greens are always a four-step scale, and sprout only means completion |
| Generic ATS hero (smiling team, Kanban screenshot) | The hero is the logo itself, assembled and opened into a journey; there are no photos of people |
| Six identical feature cards | Each section has its own composition: hover-expand panels, pinned snap text, a sticky studio, lanes in perspective, a search console, a dark lab, sliders |
| All-caps eyebrows, mono labels, "→" links | Sentence-case stage tags with a chevron glyph and a real sequence number (`4/8`); mono only for code |
| Fade-up on every element | One orchestrated load (hero); everything else moves because of scroll progress or a user action |
| "AI recruiting" tropes (brains, robots, gauges, purple) | No AI imagery at all; integrity uses amber "signal", not red alarms or surveillance imagery |
| Great hero, weak lower page | The lower sections carry the richest interactions: scorecard lock, calendar collisions, offer to onboarding, the integrity review, the product tour |

## Spend the boldness in one place

The bold move is the **stepped, condensed headline plus the mark becoming the journey**. Everything else stays quiet:
restrained glass, one shader environment (the coding lab), cards only where the product has cards.
