# 08 — Period Detail

**Purpose.** The reader view for a single period (`/:username/periods/:slug`) — the period's temporal span, its place in the period hierarchy, the timelines overlaid on it, and the computed events-in-range (PRD §2.2.6; [ADR-0028](../../../adr/adr-0028-period-span-overlay-and-hierarchy-axes.md); [02](../02-screen-inventory.md) §2 screen 8). A shared leaf and the home of F6.

**Flows:** F6 (hierarchy → overlaid timelines → events in range).

## Data shown

- Period header: name, `TemporalDisplay` span (era + precision)
- Hierarchy breadcrumb: ancestor periods (`parent_period_id` chain)
- Child periods (if any)
- Overlaid timelines (`period_timelines`)
- Events in range: events whose dates intersect the period span (computed)

## Primary actions

- Navigate the hierarchy (breadcrumb ancestors, child periods) — `context-shift`
- Open an overlaid timeline → canvas (`fractal-zoom`; F6 step 5)
- Open an event-in-range → event detail (`context-shift`; F6 step 7)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Phanerozoic ▸ Paleozoic ▸ Cambrian                                            │  ← hierarchy breadcrumb
│  Cambrian                                                                      │
│  538–485 MYA · approximate                                                     │
│  ───────────────────────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────┐  ┌────────────────────────┐ │
│  │  About                                        │  │ Child periods          │ │
│  │  The Cambrian is the first geological period  │  │ ▸ Terreneuvian         │ │
│  │  of the Paleozoic Era …                       │  │ ▸ Series 2             │ │
│  │                                               │  │ ▸ Miaolingian          │ │
│  ├──────────────────────────────────────────────┤  │ ▸ Furongian            │ │
│  │  Overlaid timelines                           │  ├────────────────────────┤ │
│  │  ▸ Evolution of life on Earth      →          │  │ Events in range        │ │
│  │  ▸ (others on period_timelines)    →          │  │ ● Cambrian explosion   │ │
│  │                                               │  │   538 MYA · approx  →  │ │
│  │                                               │  │ ● First trilobites     │ │
│  │                                               │  │   521 MYA · approx  →  │ │
│  │                                               │  │ ● … (date-range        │ │
│  │                                               │  │     intersection)      │ │
│  └──────────────────────────────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** two-column — about + overlaid timelines on the left; child periods + events-in-range on the right.
- **Tablet (640–1023px):** sidebar narrows; breadcrumb wraps if deep.
- **Mobile (<640px):** single column; breadcrumb truncates middle ancestors with `…`; sections stack — header → about → hierarchy (children) → overlaid timelines → events-in-range.

## Annotations

1. **Hierarchy breadcrumb = `parent_period_id` chain.** Ancestors render as a breadcrumb; each links to its period detail (`context-shift`, F6 step 4). Deep hierarchies truncate middle levels with `…` (same pattern as the timeline zoom-stack; model owned by #171). Data: `periods.parent_period_id` chain.
2. **`TemporalDisplay` span with era + precision.** "538–485 MYA · approximate" ([00](../00-ia-route-model.md) §5.2 rule 4; [ADR-0028](../../../adr/adr-0028-period-span-overlay-and-hierarchy-axes.md)). Data: period temporal JSONB (start/end + precision).
3. **Overlaid timelines = `period_timelines`.** The timelines explicitly overlaid on this period; each opens the canvas (`fractal-zoom`, F6 step 5). On the canvas, period bands link back here (F6 step 6) — the loop. Data: `period_timelines` junction.
4. **Events in range = computed span intersection.** Events whose temporal range intersects the period span — a date-range intersection, so partially-overlapping events appear ("overlapping this period", not "contained in"; copy owned by #171). When the period has overlaid timelines, the range is scoped to them; with none, the conservative fallback computes across all published timelines ([03](../03-user-flows.md) F6 edge cases). Data: event ranges ∩ period span, scoped by `period_timelines`.
5. **Child periods.** Direct children (the inverse `parent_period_id` relation) listed for downward navigation. Data: child `periods` rows.
6. **Shared-leaf behavior.** Like event/character, period detail is a reconvergence leaf: a reader arriving from an event's "Part of period" (F6 step 1–2) can pivot out to a canvas via overlaid timelines.

## Edge cases

- **No overlaid timelines.** Events-in-range falls back to all published timelines; "No timelines overlaid" noted in that section ([03](../03-user-flows.md) F6 edge case).
- **No events in computed range.** "No events in this period yet" empty state ([02](../02-screen-inventory.md) §3).
- **No child periods (leaf period).** Child-periods section omits gracefully.
- **Very deep hierarchy (4+ ancestors).** Breadcrumb truncates middle with `…` (detail owned by #171).
- **Unpublished / missing period.** Clean 404 (screen 11); never 403 ([00](../00-ia-route-model.md) §4.3).
- **Unpublished overlaid timeline / event-in-range.** Renders as inert text ([00](../00-ia-route-model.md) §5.2 rule 1).
- **Loading.** Hierarchy + lists skeletons.
- **Connection loss (Realtime).** Stale banner + auto-resubscribe ([02](../02-screen-inventory.md) §3).

## Open questions

> **Resolved (this pass):** Events-in-range is a span intersection (partial overlaps included); conservative fallback to all published timelines when none are overlaid. Hierarchy truncates deep chains with `…`.
>
> Deferred to **#171:** "overlapping this period" copy; breadcrumb truncation model. Deferred to **#172:** span/band visual treatment.
