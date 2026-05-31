---
title: "ADR-0025: Primitive Sourcing — shadcn for Everything Except a Bespoke Tree; Shared MediaPicker"
status: "Accepted (retroactively documented 2026-05-30)"
date: "2026-05-26"
authors: "Time Traveler engineering (reconstructed retroactively)"
tags: ["architecture", "decision", "frontend", "ui", "primitives"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0025: Primitive Sourcing — shadcn for Everything Except a Bespoke Tree; Shared MediaPicker

## Status

**Accepted (retroactively documented 2026-05-30)** — specified in
`docs/design/admin/fidelity-2-plan.md` ("Locked-in stack" → Bespoke primitives;
Batch I). Batch I (#49 follow-up) introduces the shared `MediaPicker`.

## Context

The fidelity-2 system needs many primitives (buttons, tables, dialogs, sheets,
badges, forms, a hierarchy view for nested timelines/periods, a media picker used
on multiple editors). Hand-building primitives that shadcn already provides wastes
effort and loses accessibility; but some surfaces (a nested tree, a cross-entity
media picker) have no good shadcn equivalent.

## Decision

Establish a **primitive-sourcing rule**:

- **shadcn/ui is the source for every primitive except one.** `DataTable` is
  tanstack-table + shadcn `Table` markup; dialogs/sheets/badges/forms/etc. are
  shadcn.
- **`Tree` is the only bespoke primitive** — no shadcn equivalent exists for the
  nested timeline/period hierarchy, so it is built in-house in `packages/ui`.
- **`MediaPicker` is a shared primitive** (Batch I, #49 follow-up): a single
  reusable cross-entity media library + picker, consumed by the event, character,
  and timeline editors rather than re-implemented per editor.

## Consequences

### Positive

- **POS-001**: Maximizes reuse of accessible, tested shadcn primitives; minimizes
  bespoke surface to exactly one component (`Tree`).
- **POS-002**: A single shared `MediaPicker` keeps media attachment behavior
  consistent across every editor and avoids duplicated upload/selection logic.
- **POS-003**: The explicit "Tree only" rule prevents scope creep into hand-rolling
  primitives shadcn already covers.

### Negative

- **NEG-001**: `Tree` is fully owned in-house — its accessibility, keyboard nav,
  and theming are the team's responsibility, with no upstream to track.
- **NEG-002**: A shared `MediaPicker` must satisfy several editors' needs, so its
  API has to stay general enough without becoming a god-component.

## Alternatives Considered

### Build all primitives bespoke

- **ALT-001**: **Description**: Hand-roll tables, dialogs, etc.
- **ALT-002**: **Rejection Reason**: Throws away shadcn's accessible, tested base
  for no benefit; huge maintenance surface.

### Per-editor media pickers

- **ALT-003**: **Description**: Each editor implements its own media selection.
- **ALT-004**: **Rejection Reason**: Duplicates upload/selection logic and drifts
  in behavior; a shared primitive is consistent and cheaper.

### Find/adopt a third-party tree component

- **ALT-005**: **Description**: Use an external tree library.
- **ALT-006**: **Rejection Reason**: Would reintroduce a non-shadcn dependency and
  theming mismatch; a small in-house `Tree` fits the token system cleanly.

## Implementation Notes

- **IMP-001**: Primitives in `packages/ui/src/components/`; `Tree` is the lone
  bespoke entry, `DataTable` wraps tanstack-table + shadcn `Table`.
- **IMP-002**: `MediaPicker` (Batch I) backed by the `media` storage bucket
  (ADR-0016) and `media` table (ADR-0014 global-read).
- **IMP-003**: All primitives consume the token system (ADR-0022) and visual
  language (ADR-0024) and are exercised in Storybook (ADR-0020/0026).

## References

- **REF-001**: ADR-0020 (design system), ADR-0016 (media storage), ADR-0014
  (media RLS), ADR-0022 (tokens), ADR-0026 (Storybook/tests)
- **REF-002**: `docs/design/admin/fidelity-2-plan.md` (Bespoke primitives; Batch
  I); issue #49
- **REF-003**: shadcn/ui, tanstack-table docs
