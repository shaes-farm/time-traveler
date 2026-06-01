# Public Reader — UX Principles + Visual Direction

Status: **draft 1** — principles + visual direction + motion classes + accessibility baseline; exact durations/easing deferred to #172
Parent epic: [#165](https://github.com/shaes-farm/time-traveler/issues/165) · Issue: [#167](https://github.com/shaes-farm/time-traveler/issues/167)
Builds on: [`00-ia-route-model.md`](00-ia-route-model.md) (IA + route contract) · [ADR-0031](../../adr/adr-0031-public-reader-design-divergence.md) (design divergence + token-reuse policy)

> **What this document is.** The UX principles and visual-direction guidance for the **public reader** surface — the anonymous, read-only experience for exploring and reading _published_ temporal content. It sets typography, color, composition, and motion **constraints** that downstream wireframe and fidelity issues (#168–#173) refine into concrete screens.
>
> **What this document is not.** It is not pixel-perfect comps, component implementation, or the detailed motion spec. It names motion **classes** and a reduced-motion **policy**; the exact durations, easing curves, and per-surface choreography are owned by the mid-fidelity + motion + accessibility spec (#172). Screen inventory is #168; user flows are #169; low-fi wireframes are #170; the interaction spec is #171.

---

## 1. Audience and the admin divergence

The public reader serves the **PRD §2.2 reader capabilities** for an **anonymous, unauthenticated** visitor. Where the admin CMS is a dense, keyboard-first authoring surface in the Notion / Linear / Sanity register (see [`docs/design/admin/03-aesthetic-notes.md`](../admin/03-aesthetic-notes.md), _Tone and genre_), the reader is an **immersive, exploratory consumption surface**. The two **share design tokens but diverge sharply in motion and composition** ([`README.md`](README.md) audience-separation principle; admin notes, _What would change my mind_). They never share a navigation shell ([`00-ia-route-model.md`](00-ia-route-model.md) §1 principle 5).

This divergence is recorded as a binding decision in [ADR-0031](../../adr/adr-0031-public-reader-design-divergence.md). The short version:

- **Reuse, do not redefine.** The reader inherits the same OKLCH design tokens, typefaces, icon set, and shadcn/ui primitives as the admin app (ADR-0020, ADR-0022, ADR-0025). It does not invent a parallel palette or a second type system.
- **Diverge in register.** The reader composes those tokens into an **editorial, spacious, motion-aware** experience optimized for reading and exploration — not the dense, scannable, table-first composition the admin uses.

The genre anchors the reader _is_ allowed to reach for (and that the admin explicitly rejects):

- Editorial long-form reading surfaces (digital magazines, museum-collection narratives, well-typeset essay sites).
- Exploratory data-visualization interfaces where zoom and pan are the primary verbs.
- Map and atlas interfaces, for the "where am I in a vast space" orientation problem the fractal timeline shares.

It is still **not** in the genre of Awwwards scroll-theater: the accessibility-first constraints in [ADR-0024](../../adr/adr-0024-accessibility-first-visual-language.md) remain binding (see §6, §7). Immersive does not mean decorative.

---

## 2. UX principles — exploratory time navigation

These govern the timeline-first spine (PRD §2.2.1 master timeline browsing, §2.2.2 fractal navigation, §2.2.3 timeline visualization).

1. **Orientation is never lost.** The fractal graph means a reader can be many zoom levels deep (`events.detail_timeline_id`, ADR-0006). The current position in the zoom stack must be continuously legible — a persistent breadcrumb of the drill path ([`00-ia-route-model.md`](00-ia-route-model.md) §5.2 rules 2 and 5), not an afterthought. "Where am I, and how do I get back up" is answerable at all times.
2. **Zoom is the primary verb; transitions preserve continuity.** Moving between temporal scales (Big Bang → an individual event) must feel like one continuous space, not a series of page loads. The PRD calls for "smooth transitions when zooming" (§2.2.3, §3.2.5); §6 names the `fractal-zoom` motion class that satisfies it.
3. **Temporal range is the spine of every view.** Era and precision travel with every date, never stripped to a bare year ([`00-ia-route-model.md`](00-ia-route-model.md) §1 principle 2). The reader reuses the admin's `TemporalDisplay` semantics: era code + value, uncertainty rendered quietly (see §4).
4. **Scale is a first-class, shareable choice.** Logarithmic is the default for long spans; linear is a user toggle, and the choice is URL-addressable (`?scale=`, [`00-ia-route-model.md`](00-ia-route-model.md) §3.2; PRD §2.2.3). The visual language must make the active scale obvious so a reader is never silently misreading magnitudes.
5. **Density scales with depth, not with the viewport.** At wide zoom, the canvas shows shape and rhythm (period bands, event clusters, importance prominence); detail resolves as the reader drills in. The reader should never be asked to parse a wall of labels at cosmological zoom.
6. **Lateral exploration is a peer of drilling.** From any event the reader can move sideways to a participating character (`event_characters`) or an overlapping period (`period_timelines`) — these cross-links are defined IA ([`00-ia-route-model.md`](00-ia-route-model.md) §5.2 rule 1) and must read as a distinct, available affordance, not a hidden one.

---

## 3. UX principles — narrative reading

These govern the story-first spine (PRD §2.2.7 story reading, §2.2.4 event detail, §2.2.5 character-centric views).

1. **Reading comes first on reading surfaces.** On `/:username/stories/:slug` the prose is the primary object: comfortable measure (line length), generous vertical rhythm, editorial display type for headings (§4). Chrome recedes; the timeline is context, not competition.
2. **Perspective and narrator are always visible.** Stories carry a point of view (PRD §2.2.7). The narrator / perspective character is a persistent, quiet cue in the reading frame, reachable at `/:username/characters/:slug` without losing the reader's place.
3. **Events keep their temporal anchor inside narrative.** An event referenced in a story still shows its era + precision and remains a link to its full reader view (`/:username/events/:slug`). Narrative order (`story_events.sort_order`, #183) and temporal order can differ; the visual language must not let the reader confuse the two.
4. **The two entry paths reconverge at leaf entities.** A reader who arrived via a story can pivot into the timeline canvas of any event, and vice versa ([`00-ia-route-model.md`](00-ia-route-model.md) §5.3). Shared leaves (event, character, period) must feel like one coherent surface regardless of entry path — same chrome, same affordances.

---

## 4. Visual language direction

The reader **reuses** the finalized accessibility-first visual language from the admin design pass. The token files — [`packages/ui/src/styles/tokens.ts`](../../../packages/ui/src/styles/tokens.ts) (hand-synced to `tokens.css`) — are the source of truth (ADR-0022). This document specifies intent and where the reader diverges; it does not redefine canonical values, and the OKLCH values quoted below are illustrative references to the token file, not new declarations.

### 4.1 Reaffirmed (shared with admin)

- **Dark-mode-only, for now.** The reader inherits the dark-mode-only commitment (ADR-0023). A light/immersive reading theme, if ever wanted, needs its own ADR; do not assume it.
- **Era palette by hue-spread, never color-only.** The five eras (CE / BCE / KYA / MYA / BYA) differentiate by hue spread evenly around the wheel for red-green-colorblind survival, and the literal era code always renders beside the value (ADR-0024; admin notes, _Era palette_). Tokens: `--color-era-ce`, `--color-era-bce`, `--color-era-kya`, `--color-era-mya`, `--color-era-bya`.
- **Character type as identity.** Each of the seven `character_type` values is icon + low-chroma tint + literal label, never icon-alone (ADR-0024; ADR-0007). Token slots `--color-type-*` are reserved for when the type-badge primitive lands (admin notes, _Character type as identity_); the reader consumes them once shipped rather than defining its own.
- **Significance / importance as a single-hue sequential ramp.** Both reuse the amber importance ramp (`--color-importance-low` … `--color-importance-critical`); more-important entities read as more prominent markers on the canvas (PRD §2.2.3).
- **Uncertainty is quiet, never alarming.** Exact dates are full-weight; circa/approximate qualifiers render as a muted prefix (`c.` / `~` / `est.`) with the value in `--color-foreground-muted`; range bars appear only on real ambiguity (admin notes, _Uncertainty treatment_).
- **Typography.** Display: **Fraunces** (variable serif, editorial). Body: **Inter Tight** (legible, tabular figures mandatory for year alignment). Mono: **JetBrains Mono** (era codes, IDs, slugs). Icon set: **lucide-react** (locked, ADR-0022).

### 4.2 Where the reader diverges

The reader composes the same tokens into a different register:

- **More space, larger display type.** The reader leans into the upper end of the type scale for story headings and timeline-section titles; the admin stays compact. Reading measure is constrained for prose comfort, not maximized for data density.
- **Surfaces are calmer and fewer.** The reader favors large, quiet surfaces (one dominant reading or canvas column) over the admin's multi-rail, table-dense composition. Cards and panels are used sparingly, for genuinely card-shaped content (character portraits, media, story covers).
- **Color carries meaning, not decoration.** The same era / type / significance accents do all the chromatic work; the reader does **not** introduce mood gradients, brand color washes, or per-page accent themes. The shell stays low-luminance and neutral so the temporal accents remain legible (ADR-0024 anti-pattern: no purple gradients).
- **Motion is a deliberate part of the experience** (§6) — the single largest divergence from the admin, where motion is affordance-only.

---

## 5. Do / Don't patterns

Concrete guidance for downstream wireframe and fidelity work (#168–#173). These are derived from the principles above and from [ADR-0024](../../adr/adr-0024-accessibility-first-visual-language.md).

### Typography

| Do                                                                            | Don't                                                                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Use Fraunces for story/section display headings to set an editorial register. | Introduce a new display or body typeface outside the locked token set.    |
| Constrain prose to a comfortable reading measure (~60–75ch).                  | Run prose full-bleed across a wide canvas because the space is available. |
| Use tabular figures (Inter Tight) wherever years align in columns or axes.    | Use proportional figures for temporal data — year alignment breaks.       |
| Render era codes in mono (JetBrains Mono) beside every date.                  | Strip the era code and rely on hue alone to signal CE vs. BCE vs. KYA.    |

### Color

| Do                                                                          | Don't                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Let era / type / significance tokens carry all chromatic meaning.           | Add page-level brand washes, mood gradients, or per-story accent themes. |
| Pair every color signal with text/icon (era code, type label, range value). | Encode any state, era, type, or significance by color **only**.          |
| Keep the shell neutral and low-luminance so temporal accents stay legible.  | Use purple gradients or saturated decorative backgrounds (ADR-0024).     |

### Surfaces & composition

| Do                                                                              | Don't                                                                 |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Favor one dominant column (reading or canvas) with quiet supporting chrome.     | Replicate the admin's multi-rail, table-dense authoring layout.       |
| Reserve cards for genuinely card-shaped content (portraits, media, covers).     | Wrap prose or list rows in decorative cards "to fill space."          |
| Keep the zoom-stack breadcrumb persistent and legible at every depth.           | Hide orientation behind a menu or drop it at deep zoom levels.        |
| Make the active scale (log / linear) and lateral cross-links visibly available. | Bury the scale toggle or make cross-links discoverable only on hover. |

### Contrast & legibility

| Do                                                                           | Don't                                                                       |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Meet WCAG 2.1 AA contrast for all text and meaningful UI (§7).               | Place low-chroma type tints on the shell as text without checking contrast. |
| Keep label text at full foreground; reserve muted foreground for qualifiers. | Render primary content in muted foreground for a "subtle" look.             |

---

## 6. Motion direction

Motion is the reader's single largest divergence from the admin (where motion is affordance-only). Here motion also serves **continuity and orientation** in a vast temporal space. It is still bounded: the [ADR-0024](../../adr/adr-0024-accessibility-first-visual-language.md) anti-patterns hold — **no scroll-driven animation, no custom cursors, no parallax, no magnetic buttons.** Immersive is earned through continuity, not theatrics.

This document defines the **allowed transition classes** and their intent. Exact durations, easing curves, and per-surface choreography are the mid-fidelity + motion + accessibility spec's job (#172); they are deliberately not pinned here.

| Class              | Intent                                                              | When used                                                                                     | Reduced-motion behavior (see §7)                                  |
| ------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `fractal-zoom`     | Preserve spatial continuity when changing temporal scale.           | Drilling into / out of a `detail_timeline_id`; zooming the canvas (PRD §2.2.2–2.2.3, §3.2.5). | Replace with an instant or near-instant cut; no animated scaling. |
| `context-shift`    | Signal a lateral move between peer entities without disorientation. | Event → character, event → period, story event → its reader view (cross-links, §2, §3).       | Instant; optional brief crossfade only.                           |
| `cross-fade`       | Soften content swaps that are not spatial moves.                    | Facet/filter result updates on list routes; scale toggle (`?scale=`).                         | Instant content replacement; no fade.                             |
| `enter-exit`       | Give overlays a clear, fast affordance.                             | Dialogs, sheets, media lightboxes opening/closing.                                            | Instant appearance/dismissal; no slide or scale.                  |
| `ambient-presence` | Acknowledge live published-content updates unobtrusively.           | Realtime inserts on reader surfaces (PRD §2.2.10; in-scope at MVP per IA OQ-6).               | Static state change only; no motion, no flashing.                 |

Motion rules:

- **Motion must be interruptible.** A reader who keeps interacting (e.g. zooms again mid-transition) is never blocked waiting for an animation to finish.
- **No motion conveys information on its own.** Anything animated must also be true in the static end state — a colorblind or reduced-motion reader loses nothing by skipping the motion.
- **Realtime updates never steal focus or scroll position.** `ambient-presence` is quiet by definition (PRD §2.2.10).

---

## 7. Accessibility baseline

The reader is an anonymous public surface; accessibility is non-negotiable and inherits every [ADR-0024](../../adr/adr-0024-accessibility-first-visual-language.md) constraint. This section is the floor; #172 carries the per-surface detail.

- **Contrast: WCAG 2.1 AA.** All text and meaningful non-text UI meets AA contrast against the dark shell. Low-chroma type tints are validated before being used as text rather than as badge fills.
- **Never color-only.** Era (always the mono era code), character type (always the label), significance, and published-state are conveyed redundantly with text and/or icon, never by hue alone (ADR-0024; PRD §4.4.1).
- **Keyboard path for both spines.** The full timeline-first and story-first journeys ([`00-ia-route-model.md`](00-ia-route-model.md) §5.3) are operable by keyboard: reaching `/explore` and `/stories`, drilling and ascending the zoom stack, following cross-links, opening and dismissing overlays. Focus order follows reading order.
- **Visible focus.** Every interactive element has a clearly visible focus indicator that meets AA contrast; focus is never suppressed for aesthetics.
- **Reduced-motion policy.** When the user agent reports `prefers-reduced-motion: reduce`, the reader honors it globally: `fractal-zoom`, `context-shift`, `cross-fade`, and `enter-exit` collapse to instant (or near-instant) state changes per §6, and `ambient-presence` drops all motion. No essential content or wayfinding depends on the animated path — orientation (the zoom-stack breadcrumb) is always present statically. Parallax and scroll-driven motion are never introduced, reduced-motion or not.
- **Media alternatives.** Images carry `alt_text` (required per PRD §4.8.6, WCAG 2.1 AA); the reader surfaces it.

---

## 8. Admin / public divergence + token-reuse policy

The binding statement of this policy is [ADR-0031](../../adr/adr-0031-public-reader-design-divergence.md). Summary for designers:

- **Reuse (shared source of truth):** all color tokens (`--color-era-*`, `--color-importance-*`, foreground/background/muted, and the reserved `--color-type-*` slots once they ship), the typeface set (Fraunces / Inter Tight / JetBrains Mono), spacing and radius tokens, and shadcn/ui primitives — all from `@repo/ui` (ADR-0020, ADR-0022, ADR-0025). The reader **consumes** these; it does not fork them.
- **Diverge (reader-owned):** composition (spacious editorial vs. dense table-first), information density (resolves with zoom depth vs. always-dense), display-type scale (larger for immersion), and **motion** (a deliberate continuity/orientation system vs. affordance-only).
- **Never share:** the navigation shell. The reader and admin are separate apps (ADR-0030, `apps/reader`) with separate chrome; a token is shared, a layout is not.
- **New primitives:** if the reader needs an interaction primitive, reuse shadcn/ui; only genuinely bespoke needs (e.g. the timeline canvas renderer, #65) are hand-built, and those are tracked as their own implementation tickets — not introduced here.

---

## 9. Handoff — what this gates

| Downstream issue                   | What it takes from this doc                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #168 (screen inventory)            | §1–§3 principles + §4 visual register, to scope which screens express the timeline-first and story-first spines.                                                                |
| #169 (user flows)                  | §2–§3 entry-path and cross-link principles; §6 `context-shift` for the feel of lateral moves.                                                                                   |
| #170 (low-fi wireframes)           | §4.2 composition divergence, §5 do/don't patterns, §2.1 persistent zoom-stack breadcrumb.                                                                                       |
| #171 (interaction spec)            | §6 motion **classes** and §2 zoom/scale interactions — to be specified as concrete interactions.                                                                                |
| #172 (mid-fi + motion + a11y spec) | §6 + §7 — turns motion classes and the reduced-motion policy into exact durations, easing, and per-surface choreography. **This doc deliberately stops short of those values.** |
| #173 (prototype validation)        | §2–§3 principles as the success criteria for "is exploration and reading actually coherent."                                                                                    |
| #65–#69 (visualization impl)       | §4 (importance prominence, era bands), §6 `fractal-zoom` continuity, §7 accessibility floor.                                                                                    |

---

## 10. Verification (issue #167 acceptance criteria)

- [x] **Public UX principles documented** — §2 (exploratory navigation), §3 (narrative reading), §1 (audience + divergence framing).
- [x] **Visual-direction guidance includes do/don't patterns** — §4 (visual language) + §5 (do/don't tables: typography, color, surfaces, contrast).
- [x] **Motion guidance defines allowed transition classes** — §6 (five named classes with intent, usage, and reduced-motion behavior; durations/curves deferred to #172).
- [x] **Accessibility constraints captured (incl. reduced-motion behavior)** — §7 (AA contrast, never color-only, keyboard path, visible focus, explicit reduced-motion policy, media alternatives).
- [x] **Admin/public divergence and token-reuse policy explicitly defined** — §8 + [ADR-0031](../../adr/adr-0031-public-reader-design-divergence.md).
- [x] **Guidance is directly referenceable by wireframe/fidelity issues** — §9 (per-issue handoff table).
- [x] **No contradictions with PRD/system-design constraints** — reaffirms ADR-0022/0023/0024 tokens and anti-patterns, PRD §2.2 reader capabilities, and the §2.2.3/§3.2.5 smooth-zoom requirement; introduces no light mode, no color-only signals, and no banned motion.
