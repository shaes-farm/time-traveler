# 05 — Story Reader

**Purpose.** The narrative reading surface for one story (`/:username/stories/:slug`). Long-form prose with its ordered events in story context, perspective-character + narrator cues, and lateral links out to events and characters (PRD §2.2.7; [02](../02-screen-inventory.md) §2 screen 5). A primary reconvergence on-ramp into the timeline-first surface (F3, F4).

**Flows:** F3 (read → follow event → reconvergence), F4 (perspective chip → character profile).

## Data shown

- Story header: title, narrator-type badge, perspective-character chip, cover
- Long-form prose column (the narrative body)
- Ordered event rail: events in narrative order (`story_events.sort_order`, #183), each with `TemporalDisplay`
- Lateral cross-links: perspective character, in-prose entity anchors, "appears in" reconvergence

## Primary actions

- Read prose (primary)
- Open the perspective character → character profile (`context-shift`; F4)
- Follow an event anchor → event detail (`context-shift`; F3)
- Follow in-prose entity cross-links (inert when unpublished)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  The Curies' Quest                                                             │
│  ◈ Third person   ☻ Marie Curie · Human                  [ cover image ]       │
│  ───────────────────────────────────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────────┐  ┌────────────────────┐  │
│  │                                                │  │ Events in this story│  │
│  │  In the winter of 1898, in a converted shed    │  │ ─────────────────── │  │
│  │  on the rue Lhomond, Marie and Pierre Curie    │  │ 1 ● Discovery of    │  │
│  │  bent over trays of pitchblende residue …      │  │     polonium        │  │
│  │                                                │  │     1898 CE · exact │  │
│  │  …the faint glow that would name a new element │  │ 2 ● Isolation of    │  │
│  │  after her homeland.  ⟶ [Discovery of polonium]│  │     radium          │  │
│  │                                                │  │     1902 CE · exact │  │
│  │  Years later, the Nobel committee …            │  │ 3 ● Nobel Prize in  │  │
│  │                                                │  │     Physics         │  │
│  │  … ⟶ [Pierre Curie] shared the prize …         │  │     1903 CE · exact │  │
│  │                                                │  │ 4 ● …               │  │
│  │  (prose continues — single reading column)     │  │                     │  │
│  │                                                │  │ Narrative order     │  │
│  └────────────────────────────────────────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile frame (structural reflow)

```
┌────────────────────────┐
│ ⏳ TT             ☰    │
├────────────────────────┤
│ The Curies' Quest      │
│ ◈ Third person         │
│ ☻ Marie Curie · Human  │
│ [ cover ]              │
│ ───────────────────── │
│ ▸ Events (4)           │  ← event rail = collapsible
│   1 Discovery of polo… │    accordion above prose
│   2 Isolation of radium│
│ ───────────────────── │
│ In the winter of 1898, │  ← prose, full width
│ in a converted shed …  │
│ ⟶ [Discovery of polo…] │  ← inline anchors inline
│ Years later, the Nobel │
│ committee …            │
└────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** two-column — prose reading column (primary) + a sticky ordered event rail on the right.
- **Tablet (640–1023px):** prose column widens; event rail narrows but stays alongside; in-prose anchors unchanged.
- **Mobile (<640px):** single column; the ordered event rail collapses into an accordion ("▸ Events (N)") above the prose; in-prose entity anchors render inline within the text.

## Annotations

1. **Prose is the primary surface.** A single, comfortable reading column — the immersive register that diverges from the admin's dense authoring layout ([ADR-0031](../../adr/adr-0031-public-reader-design-divergence.md); [01](../01-ux-principles.md)). Data: `stories.content` (narrative body).
2. **Ordered event rail = `story_events.sort_order` (#183, BLOCKED for ordering).** Events appear in narrative order, numbered, each with `TemporalDisplay` (era + precision always present — "1898 CE · exact", [00](../00-ia-route-model.md) §5.2 rule 4). **Blocked on [#183](https://github.com/shaes-farm/time-traveler/issues/183)**: until `story_events.sort_order` ships, events render in chronological fallback order with a note "Events shown in chronological order"; the (admin) drag-reorder affordance is not a reader concern. Data: `story_events` junction + event rows.
3. **Perspective chip → character profile.** The header chip "Marie Curie · Human" (icon + type + name — never icon-alone, [00](../00-ia-route-model.md) §5.2 rule 3) links to screen 07 (F4 step 2, `context-shift`). A story may have no perspective character. Data: perspective `characters` row.
4. **Narrator-type badge (◈).** Surfaces the narrative voice (first / third / omniscient). Data: `stories.narrator_type`.
5. **In-prose entity anchors.** Entity references woven into the prose are links to their reader routes when published, and inert text when not — no dead links ([00](../00-ia-route-model.md) §5.2 rule 1). The exact in-prose anchor affordance (how authored references resolve to links) is **owned by #171**. Data: entity refs within `stories.content`.
6. **Event anchor → event detail.** Each rail entry (and matching in-prose anchor) navigates to event detail (`context-shift`, F3 step 5), from which the reader can pivot to the timeline canvas (reconvergence, F3 steps 6–7).
7. **SSR-first reading.** Prose is server-rendered so it remains readable during a connection gap (annotation ties to the connection-loss edge case below). Data: SSR of the story body.

## Edge cases

- **Story with no ordered events (valid).** Prose-only render; the event rail does not appear ([02](../02-screen-inventory.md) §3; F3 edge case).
- **`story_events.sort_order` not shipped (#183).** Events render chronologically with a "shown in chronological order" note.
- **Perspective character unpublished.** Chip renders as inert text; no 404 ([00](../00-ia-route-model.md) §5.2 rule 1).
- **"Appears in" / in-prose link unpublished.** Renders as inert text, not a dead link.
- **Loading.** Prose + event-rail skeletons.
- **Error (transient).** Retryable; already-loaded narrative content stays visible.
- **Connection loss (Realtime).** Stale banner + auto-resubscribe; SSR prose remains readable; a newly-added event surfaces an unobtrusive `ambient-presence` signal ([02](../02-screen-inventory.md) §3; F3 edge case).

## Open questions

> **Resolved (this pass):** Single-column immersive prose layout; ordered event rail beside prose (accordion on mobile). Unpublished refs render inert (no dead links). Chronological fallback when #183 not yet shipped.
>
> **Blocked:** narrative event ordering on [#183](https://github.com/shaes-farm/time-traveler/issues/183) (`story_events.sort_order`).
>
> Deferred to **#171:** in-prose anchor resolution affordance; event-rail ↔ prose scroll-sync (if any). Deferred to **#172:** prose typographic scale + reading rhythm; cover + chip visual treatment.
