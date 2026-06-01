# 06 — Event Detail

**Purpose.** The full reader view for a single event (`/:username/events/:slug`) — temporal range, location, type/importance, participants, categories, and the cross-links by which both entry paths reconverge (PRD §2.2.4; [02](../02-screen-inventory.md) §2 screen 6). This is the **shared leaf** where the timeline-first and story-first spines meet ([00](../00-ia-route-model.md) §5.3).

**Flows:** F1 (timeline → event), F3 (story → event), F4 (character → event → timeline), F6 (period event-in-range → event).

## Data shown

- Event header: title, `TemporalDisplay` range, type badge, importance (★ ramp)
- Location
- Participants (`event_characters`) — typed character chips
- Categories — links to faceted explore
- "Appears in" — timelines + stories containing this event (reconvergence links)
- "Part of period" — period band link (F6)
- "Zoom into ⤵" — when `events.detail_timeline_id` is set (#177)

## Primary actions

- Open a participant → character profile (`context-shift`; F4)
- Open an "appears in" timeline → timeline canvas (`fractal-zoom`; F3/F4 reconvergence)
- Open an "appears in" story → story reader (`cross-fade`)
- Open "Part of period" → period detail (`context-shift`; F6)
- Drill via "Zoom into ⤵" → sub-timeline (`fractal-zoom`) — blocked on #177
- Open a category → `/explore?category=…`

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Cambrian explosion                                                            │
│  538 MYA · approximate            ◆ Biological   ★★★★★      [ Zoom into ⤵ ]    │
│  ───────────────────────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────┐  ┌────────────────────────┐ │
│  │  Description                                  │  │ Participants           │ │
│  │  A rapid diversification of multicellular     │  │ ☻ Anomalocaris·Animal  │ │
│  │  life over ~20 million years …                │  │ ☻ Trilobite·Animal     │ │
│  │                                               │  │ ☻ (3 more)             │ │
│  │  📍 Location: global (marine)                 │  ├────────────────────────┤ │
│  │                                               │  │ Categories             │ │
│  │                                               │  │ # Paleontology         │ │
│  │                                               │  │ # Evolution            │ │
│  ├──────────────────────────────────────────────┤  ├────────────────────────┤ │
│  │  Part of period                               │  │ Appears in             │ │
│  │  ▸ Cambrian  (538–485 MYA)                    │  │ ▸ Evolution of life    │ │
│  │                                               │  │   (timeline) →         │ │
│  │                                               │  │ ▸ A Mammoth Winter     │ │
│  │                                               │  │   (story) →            │ │
│  └──────────────────────────────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** two-column — main description + location on the left; participants / categories / "appears in" sidebar on the right.
- **Tablet (640–1023px):** sidebar narrows but stays alongside; header controls wrap.
- **Mobile (<640px):** single column; sections stack in priority order — header → description → participants → categories → part-of-period → appears-in. Sparse sections omit entirely (no empty boxes).

## Annotations

1. **Shared-leaf reconvergence.** Both entry spines terminate here; the "Appears in" section is the pivot back out — a timeline link re-enters the canvas (`fractal-zoom`), a story link enters the reader (`cross-fade`) ([00](../00-ia-route-model.md) §5.3; F3 step 6, F4 step 6). Data: `timeline_events`, `story_events` junctions.
2. **`TemporalDisplay` leads the header.** Era + precision always present — "538 MYA · approximate" ([00](../00-ia-route-model.md) §5.2 rule 4; [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md)). Data: event temporal JSONB (start/end + precision).
3. **Importance = single-hue ★ ramp; type = badge.** Significance renders as a sequential ★ ramp (not a literal rating; [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md) amber ramp); event type is a labelled badge (◆ + label, never color-only). Data: `events.importance`, `events.event_type`.
4. **Participants = typed chips (`event_characters`).** Each participant is a chip with character-type icon + type label + name (never icon-alone, [00](../00-ia-route-model.md) §5.2 rule 3), linking to character profile (F4 step 8). Overflow collapses to "(N more)". Unpublished participants render as inert text. Data: `event_characters` junction → `characters`.
5. **Categories → faceted explore.** A category is not a destination page; it links to `/explore?category=…` ([00](../00-ia-route-model.md) §3.3; [ADR-0028](../../../adr/adr-0028-period-span-overlay-and-hierarchy-axes.md)). Data: event category junction.
6. **"Part of period" → period detail (F6 entry).** Links to screen 08 (`context-shift`, F6 step 2). Data: period containing the event's range (`period_timelines` / range intersection).
7. **"Zoom into ⤵" = #177 (BLOCKED).** Shown only when `events.detail_timeline_id` is set; distinct from the "appears in" lateral links (decomposition vs. containment, [00](../00-ia-route-model.md) §5.2 rule 2). **Blocked on [#177](https://github.com/shaes-farm/time-traveler/issues/177)** — hidden until the column ships.
8. **No 403 — only 404.** An unpublished or missing event returns the 404 screen (11), never a 403 ([00](../00-ia-route-model.md) §4.3; [ADR-0011](../../../adr/adr-0011-publication-model.md)/[ADR-0014](../../../adr/adr-0014-rls-single-source-of-authorization.md)).

## Edge cases

- **Sparse event (no participants / no categories).** Those sections omit gracefully; the page stays coherent ([02](../02-screen-inventory.md) §3; F1 edge case).
- **Unpublished / missing event.** Clean 404 (screen 11); never 403.
- **Unpublished participant / cross-link.** Renders as inert text, not a dead link ([00](../00-ia-route-model.md) §5.2 rule 1).
- **No `detail_timeline_id`.** "Zoom into ⤵" is absent (expected default until #177).
- **Loading.** Section skeletons.
- **Error.** 404 for unpublished/missing; retryable region for transient errors.
- **Connection loss (Realtime).** Stale banner + auto-resubscribe ([02](../02-screen-inventory.md) §3).

## Open questions

> **Resolved (this pass):** Two-column layout (main + sidebar), mobile stacks by priority. Categories link to faceted explore (not a category page). Unpublished refs render inert. Missing/unpublished event → 404, never 403.
>
> **Blocked:** "Zoom into ⤵" on [#177](https://github.com/shaes-farm/time-traveler/issues/177) (`events.detail_timeline_id`).
>
> Deferred to **#171:** participant-overflow expand affordance. Deferred to **#172:** badge/★-ramp/chip visual treatment.
