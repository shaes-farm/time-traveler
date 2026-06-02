# 07 — Character Profile (mid-fidelity)

Builds on: [04 wireframe — Character profile](../04-wireframes/07-character-profile.md) · [README visual-system reference](README.md#reader-visual-system-reference) · [motion-spec](motion-spec.md) · [accessibility-spec](accessibility-spec.md)
Route: `/:username/characters/:slug` · Flows: F4 ([03](../03-user-flows.md))

**Purpose.** Biography + character timeline + relationship network (PRD §2.2.5) — a shared leaf. Structure from the [04 wireframe](../04-wireframes/07-character-profile.md). Character type is identity (one of seven), never icon-alone ([01 §4.1](../01-ux-principles.md); [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md)).

## Visual hierarchy + token callouts

- **Type-identity header:** type icon (lucide) + literal **type label** + name (Display L); type tint from reserved `--color-type-*` slot (badge fill, validated, never color-only). Temporal scope (birth/death `TemporalDisplay`, era + precision).
- **Biography:** Body L prose, comfortable measure.
- **Character timeline:** events in role order; each `TemporalDisplay` + title; links to event detail.
- **Relationship network** (`character_relationships`): bounded render; node = character (type icon + name), edge = relationship type (label + temporal scope). Layout/paging strategy is **#171-owned** ([04](../04-wireframes/07-character-profile.md)); this doc fixes node/edge **visual treatment** only.

## Component states

| Module            | States                                                 |
| ----------------- | ------------------------------------------------------ |
| Event-list item   | default · hover · focus-visible                        |
| Relationship node | default · hover · focus-visible · (links to character) |
| Media thumb       | default · hover · focus-visible · open                 |

## System states

- **No events in role order:** "No events yet"; section omits ([02 §3](../02-screen-inventory.md)).
- **No published relationships:** network section omits gracefully.
- **Loading:** header + timeline/network skeletons.
- **Missing/unpublished:** 404; transient retryable.
- **Connection-loss:** stale banner; resubscribe ([motion-spec §3](motion-spec.md)).

## Responsive

- **Desktop:** identity header full-width; biography + timeline + network in columns. **Tablet:** network folds below. **Mobile:** single column; network may degrade to a list of relationships ([04](../04-wireframes/07-character-profile.md)).

## Motion

- **`context-shift`** to events/related characters; **`enter-exit`** media lightbox; **`ambient-presence`** stale banner. No `fractal-zoom` here (no canvas). **Reduced-motion:** all instant; type-identity header static ([motion-spec §5](motion-spec.md)).

## Accessibility

| #   | Concern          | Spec                                                                                                                    |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Focus order      | skip-link → nav → `h1` name → type/temporal → biography → character timeline list → relationship network nodes → footer |
| 2   | Type identity    | icon + **label** always; tint is decorative layer ([accessibility-spec §6](accessibility-spec.md))                      |
| 3   | Network keyboard | nodes Tab-reachable; no hover-only edges; relationship type labelled ([01 §7](../01-ux-principles.md))                  |
| 4   | Temporal SR      | birth/death + event dates read era + precision ([accessibility-spec §4.4](accessibility-spec.md))                       |
| 5   | Reduced-motion   | lateral moves instant ([motion-spec §5](motion-spec.md))                                                                |
