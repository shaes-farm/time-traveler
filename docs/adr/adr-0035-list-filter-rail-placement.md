---
title: "ADR-0035: List-page filter rail on the right"
status: "Accepted"
date: "2026-06-30"
authors: "Admin design + frontend"
tags: ["architecture", "decision", "design-system", "admin"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0035: List-page filter rail on the right

## Status

**Accepted**

## Context

The admin app's entity-list screens (timelines, events, media — and the
spec'd-but-unbuilt characters, periods, stories, categories) use a persistent
`FilterRail` sidebar of grouped controls. Until now the rail rendered on the
**left** of the content: the global navigation sidebar, then the filter rail,
then the table. The fidelity-1 wireframes and
[`03-aesthetic-notes.md`](../design/admin/03-aesthetic-notes.md) committed to a
left rail as "conventional and discoverable."

In use, the left placement reads as cramped: the table is wedged between two
left-edge rails (nav + filters), the controls sit visually _upstream_ of the
content they act on, and the content is pushed away from the primary nav. The
design-system rule for the rail was load-bearing (it is referenced by five list
wireframes plus the PRD), so changing the side is a cross-cutting,
precedent-setting decision rather than a one-off CSS tweak — it warrants a
record.

## Decision

Place the list-page filter rail on the **right** of the content pane, so the
reading order is **nav → content → filters**. The `FilterRail` keeps its fixed
`w-56` width; placement is controlled by DOM order in each list shell (`<main>`
before `<FilterRail>`) rather than `flex-row-reverse`, so focus and screen-reader
order naturally reach content before the filters. The rail's divider flips from
`border-r` to `border-l`.

This applies to all admin entity-list screens and to the `MediaFilterRail`
adapter, which composes `FilterRail`.

## Consequences

### Positive

- **POS-001**: Content sits directly against the primary nav and gets the wide
  middle of the viewport, relieving the cramped two-left-rails layout.
- **POS-002**: Filters read as a contextual sidebar _next to_ the content,
  mirroring the editor's existing fixed right-hand metadata column
  ([`05-character-editor.md`](../design/admin/02-wireframes/05-character-editor.md)).
  "Contextual controls live on the right" now reads consistently across list and
  editor surfaces.
- **POS-003**: DOM-order (not `flex-row-reverse`) placement keeps tab and
  screen-reader order as content-then-filters, satisfying the
  accessibility-first language of [ADR-0024](adr-0024-accessibility-first-visual-language.md).

### Negative

- **NEG-001**: Diverges from the common left-facet convention (and from the
  public reader's currently-spec'd left facet rail), so admin and reader filter
  placement may differ until the reader is built and reconciled.
- **NEG-002**: Required redrawing the ASCII wireframes and rewording the
  aesthetic-notes rule — documentation churn with no functional payoff.

## Alternatives Considered

### Keep the left rail

- **ALT-001**: **Description**: Leave the rail where it is; address the cramped
  feeling with spacing/typography only.
- **ALT-002**: **Rejection Reason**: Doesn't fix the structural problem — the
  table stays wedged between two left rails and upstream of its own controls.

### Collapsible / drawer filters

- **ALT-003**: **Description**: Add an independent collapse toggle or a mobile
  drawer for the rail.
- **ALT-004**: **Rejection Reason**: Larger surface area and out of scope for
  this change; the responsive-drawer gap is pre-existing and tracked separately.
  The right-side swap neither introduces nor blocks it.

## Implementation Notes

- **IMP-001**: Code touch points — flip `border-r`→`border-l` in
  [`packages/ui/src/components/filter-rail.tsx`](../../packages/ui/src/components/filter-rail.tsx);
  render `<main>` before the rail in the timelines and events list clients and in
  [`packages/ui/src/components/media-picker.tsx`](../../packages/ui/src/components/media-picker.tsx).
  No change to filter state (URL params), TanStack Query hooks, or `MediaFilterRail`
  facet logic.
- **IMP-002**: Docs updated in lockstep — PRD §7.11.2, the five list wireframes,
  the media-library wireframe, the aesthetic-notes density rule, and the
  fidelity-2 plan's `FilterRail` line.
- **IMP-003**: Public reader filter placement
  ([`public/04-wireframes/02-explore.md`](../design/public/04-wireframes/02-explore.md),
  `04-story-browser.md`) is intentionally **not** changed here; revisit when
  `apps/reader` is scaffolded (#254) to decide whether to align the reader with
  this rule or keep its left facet rail.

## References

- **REF-001**: [ADR-0024](adr-0024-accessibility-first-visual-language.md)
  (accessibility-first visual language), [ADR-0025](adr-0025-shared-mediapicker-bespoke-tree.md)
  (`MediaPicker` shared primitive).
- **REF-002**: [`docs/design/admin/03-aesthetic-notes.md`](../design/admin/03-aesthetic-notes.md)
  § Density and information rules; PRD-0001 §7.11.2.
