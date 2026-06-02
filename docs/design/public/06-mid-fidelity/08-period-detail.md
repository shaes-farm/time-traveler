# 08 — Period Detail (mid-fidelity)

Builds on: [04 wireframe — Period detail](../04-wireframes/08-period-detail.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/:username/periods/:slug` · Flows: F6 ([03](../03-user-flows.md))

**Purpose.** Period hierarchy + overlaid timelines + computed events-in-range (PRD §2.2.6, [ADR-0028](../../../adr/adr-0028-period-span-overlay-and-hierarchy-axes.md)) — a shared leaf. Structure from the [04 wireframe](../04-wireframes/08-period-detail.md).

## Visual hierarchy + token callouts

- **Header:** Display L period name; `TemporalDisplay` span (era + precision).
- **Hierarchy breadcrumb** (`parent_period_id`): `▸`-separated ancestor links; deep chains truncate with `…` (model #171-owned). Mirrors the timeline breadcrumb pattern visually but is a **hierarchy**, not a zoom stack ([05 §8.2](../05-interaction-specification.md) distinction).
- **Overlaid timelines** (`period_timelines`): list of timeline links; entering one is a `fractal-zoom` to the canvas.
- **Events-in-range:** computed by span intersection; each row `TemporalDisplay` + title; copy clarifies "overlapping this period" (not "contained in") (F6 edge case).

## Component states

| Module                 | States                                                     |
| ---------------------- | ---------------------------------------------------------- |
| Breadcrumb segment     | default · hover · focus-visible · current (non-link) · `…` |
| Overlaid-timeline link | default · hover · focus-visible · inert (unpublished)      |
| Events-in-range row    | default · hover · focus-visible                            |

## System states

- **No overlaid timelines:** events-in-range falls back to all published timelines; "No timelines overlaid" note (F6 edge case).
- **No events in range:** "No events in this period yet" ([02 §3](../02-screen-inventory.md)).
- **Loading:** hierarchy + lists skeletons.
- **Missing/unpublished:** 404; transient retryable.
- **Connection-loss:** stale banner; resubscribe ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** header + breadcrumb; overlaid timelines + events-in-range in columns. **Tablet/Mobile:** single column, lists stacked ([04](../04-wireframes/08-period-detail.md)).

## Motion

- **`context-shift`** navigating hierarchy + to events; **`fractal-zoom`** entering an overlaid timeline canvas; **`ambient-presence`** stale banner. **Reduced-motion:** all instant; breadcrumb updates synchronously ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern           | Spec                                                                                                                                             |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Focus order       | skip-link → nav → hierarchy breadcrumb → `h1` period name → temporal span → overlaid timelines → events-in-range → footer                        |
| 2   | Hierarchy vs zoom | breadcrumb is a hierarchy (`parent_period_id`), labelled distinctly from the timeline zoom-stack ([05 §8.2](../05-interaction-specification.md)) |
| 3   | Range copy        | "overlapping this period" wording avoids the contained-in confusion (F6 edge case)                                                               |
| 4   | Temporal SR       | span + event dates read era + precision ([accessibility-spec §4.4](accessibility-spec.md))                                                       |
| 5   | Reduced-motion    | navigation + canvas entry instant ([motion-spec §5](motion-spec.md))                                                                             |
