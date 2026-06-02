# 03 — Timeline Reader (mid-fidelity)

Builds on: [04 wireframe — Timeline reader](../04-wireframes/03-timeline-reader.md) · [05 interaction spec §4–§8](../05-interaction-specification.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/:username/timelines/:slug` · Flows: F1, F2, F4, F6 ([03](../03-user-flows.md))
Resolves for this screen: band/overlay/event visual treatment, `fractal-zoom` timing, cluster-panel pagination UX (deferred to #172 by [04](../04-wireframes/03-timeline-reader.md) + [05 §13.2](../05-interaction-specification.md)).

**Purpose.** The renderer-bearing screen — the fractal zoomable canvas (#65) with scale toggle (#66/#67), zoom-stack drill (#68), and period/character overlays (#69). Layout + controls from the [04 wireframe](../04-wireframes/03-timeline-reader.md); interaction contract from [05](../05-interaction-specification.md). This doc fixes the **visual treatment + motion + a11y** of those modules.

## Visual hierarchy + token callouts

- **Zoom-stack breadcrumb** ([05 §8.2](../05-interaction-specification.md)): Body M, segments separated by `▸`; current segment `--color-foreground`, ancestors `--color-foreground-muted` (links). Up to 3 inline; depth ≥4 collapses middle into a `…` `enter-exit` popover ([05 §8.3](../05-interaction-specification.md)). **Reset zoom** control right-aligned.
- **Canvas controls:** scale toggle (`●Log / ○Linear`, a **radio group** — native `<input type="radio">` or `role="radio"` + `aria-checked`, **not** `aria-pressed`, since log/linear are mutually exclusive), overlay toggles ([✓ Periods] [✓ Characters], independent toggle buttons), compare `⤢`. On `--color-surface` control strip.
- **Period bands** (#69, `period_timelines`): horizontal background bands behind the axis; differentiated by **label + low-luminance fill** (never fill-only); era-adjacent hues stay within the dark shell so event markers read on top ([01 §4.2](../01-ux-principles.md)).
- **Event markers:** dot size + prominence scale with `--color-importance-*` (more important = larger/brighter); paired with ★ + label at L2/L3 ([05 §6](../05-interaction-specification.md)). Drill-in `⤵` (#68/#177) is a distinct decomposition glyph, visually separate from the "appears in" lateral link.
- **Character overlay lanes** (#69, `event_characters`): dashed lanes spanning a participation window, labelled with the character name + type icon.
- **Cluster marker:** aggregate dot with a mono count badge (`×7`).
- **Axis:** mono tabular year labels (`--font-mono`), so digits align ([01 §4.1](../01-ux-principles.md)).
- **Event popover / bottom sheet:** `--color-surface`, `--radius-lg`; `TemporalDisplay` (era + precision), ★ ramp, participant count, **Open event** + **Zoom into ⤵** actions.

## Semantic-level visual treatment ([05 §6](../05-interaction-specification.md))

| Level           | Shows                                                      | Labels                 |
| --------------- | ---------------------------------------------------------- | ---------------------- |
| L0 macro        | spine + major era bands + high-importance markers only     | none                   |
| L1 era          | period bands + top-priority markers                        | sparse (≤8/1000px)     |
| L2 period/event | standard markers + cluster affordances                     | selective (≤18/1000px) |
| L3 detail       | dense markers + secondary metadata chips + precise markers | dense (≤36/1000px)     |

Density culling bias: higher importance → more precise temporal value → deterministic id ([05 §6.3](../05-interaction-specification.md)). Overflow degrades to marker-only.

## Cluster-panel pagination (resolves [05 §13.2](../05-interaction-specification.md))

A cluster is >1 marker within an 18px radius ([05 §7](../05-interaction-specification.md)). Activation opens an `enter-exit` preview panel anchored to the cluster marker:

- **Header:** `<count> events` + sort note ("by importance, then time").
- **Body:** first **25** rows (importance → temporal order); each row = `TemporalDisplay` + title + ★, selecting routes to event detail (`context-shift`).
- **Overflow (>25):** a **"+N more"** control at the panel foot reveals the next page **in place** (not a new route); the panel body is a **virtualized scroll** list so large clusters stay performant — perf risk tracked in [implementation-risks.md](implementation-risks.md) for #69. Page size is fixed at 25; no page-number control (keeps the panel quiet).
- **Keyboard:** Enter/Space opens; Arrow keys move between rows; **"+N more"** is in the Tab order; Escape closes and returns focus to the cluster marker ([05 §7.3](../05-interaction-specification.md), [accessibility-spec §4.2](accessibility-spec.md)).

## Component states

| Module             | States                                                                          |
| ------------------ | ------------------------------------------------------------------------------- |
| Breadcrumb segment | default · hover · focus-visible · current (non-link) · `…` collapsed            |
| Scale toggle       | log (default) · linear · focus-visible (radio group; `aria-checked` per option) |
| Overlay toggle     | on · off · focus-visible                                                        |
| Event marker       | default · hover (tooltip) · focus-visible · selected (`aria-selected` + ring)   |
| Cluster marker     | default · hover (summary tooltip) · focus-visible · open                        |
| Drill-in `⤵`       | present (when `detail_timeline_id`) · absent · focus-visible (BLOCKED on #177)  |
| Reset zoom         | default · focus-visible · (at root: still active, re-fits)                      |

## System states

- **Empty timeline:** empty canvas showing the span + "No events yet" ([02 §3](../02-screen-inventory.md)).
- **Loading:** canvas skeleton + progressive event hydration; bands appear when ready.
- **Error:** renderer-scoped error boundary; shell stays usable.
- **Connection-loss:** "Live updates paused" banner; auto-resubscribe + re-fetch visible window; unpublished events render inert until reload ([motion-spec §3](motion-spec.md)).
- **`?at=` anchor unpublished:** load at root position, no error ([05 §9.3](../05-interaction-specification.md)).

## Responsive

- **Desktop:** full canvas, inline controls, floating popover.
- **Tablet:** controls wrap; overlays collapse into **Layers ▾**; popover floats.
- **Mobile:** breadcrumb truncates with `…`; controls → **Layers ▾** + compact scale toggle; pinch-zoom + drag-pan; popover becomes an `enter-exit` bottom sheet ([04](../04-wireframes/03-timeline-reader.md)).

## Motion

- **`fractal-zoom`** (480ms `--ease-standard`, [motion-spec §2.1](motion-spec.md)) — drill-in/out, breadcrumb jump, reset, canvas entry. **Interruptible**: re-zoom mid-flight retargets ([05 §10.3](../05-interaction-specification.md)).
- **`cross-fade`** (200ms) — scale toggle re-render (anchor preserved, [05 §5.2](../05-interaction-specification.md)).
- **`enter-exit`** — event popover / cluster panel / breadcrumb `…` popover / mobile sheet.
- **`context-shift`** — opening event detail; period-band → period detail.
- **`ambient-presence`** — stale banner. **Reduced-motion:** all `fractal-zoom` become instant cuts; no camera flight between breadcrumb jumps; scale toggle direct redraw; live indicators static ([05 §10.3](../05-interaction-specification.md); [motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern          | Spec                                                                                                                                                                                                              |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order      | skip-link → nav → breadcrumb segments → Reset → scale toggle → overlay toggles → compare → **canvas** → footer ([accessibility-spec §2](accessibility-spec.md))                                                   |
| 2   | Canvas keyboard  | `=`/`+`/`-` zoom, arrows pan, `0` reset, Enter opens cluster/event, Escape closes — input parity required ([accessibility-spec §1.2](accessibility-spec.md), [05 §4.1/§10.4](../05-interaction-specification.md)) |
| 3   | SR verbosity     | zoom announcements coalesced + debounced 500ms; announce semantic level + visible window, not raw scalar; scale toggle/reset announce immediately ([accessibility-spec §4.1](accessibility-spec.md))              |
| 4   | Orientation      | zoom-stack breadcrumb always present statically; wayfinding never animation-only ([01 §7](../01-ux-principles.md))                                                                                                |
| 5   | Never color-only | period bands carry labels; markers carry ★/label; era codes in mono ([accessibility-spec §6](accessibility-spec.md))                                                                                              |
| 6   | Focus restore    | on drill/jump, focus → destination `h1`; keyboard-triggered jumps may return to breadcrumb control ([accessibility-spec §2.2](accessibility-spec.md))                                                             |
| 7   | Reduced-motion   | `fractal-zoom` instant; cluster panel instant; banner static ([motion-spec §5](motion-spec.md))                                                                                                                   |
