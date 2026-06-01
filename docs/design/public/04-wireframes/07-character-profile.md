# 07 — Character Profile

**Purpose.** The reader view for a single character (`/:username/characters/:slug`) — type-identity header, biography, character timeline (events in role order), and the relationship network (PRD §2.2.5; [02](../02-screen-inventory.md) §2 screen 7). A shared leaf and a pivot point in the reconvergence model (F4).

**Flows:** F4 (perspective/participant → character → event → timeline).

## Data shown

- Type-identity header: character-type icon + label (1 of 7 types), name, aliases
- Temporal scope: birth/death `TemporalDisplay` (era + precision)
- Biography (prose)
- Character timeline: events the character participates in, in role order (`event_characters`)
- Relationship network: directed relationships (`character_relationships`) with sub-role labels

## Primary actions

- Follow a character-timeline event → event detail (`context-shift`; F4)
- Follow a related character → their profile (`context-shift`)
- (Reconvergence: event → "appears in" timeline → canvas)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ☻ Human                                                                       │
│  Marie Curie   ↳ "Maria Skłodowska" +1                                         │
│  1867–1934 CE · exact                                                          │
│  ───────────────────────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────┐  ┌────────────────────────┐ │
│  │  Biography                                    │  │ Relationships          │ │
│  │  Marie Curie was a physicist and chemist who  │  │      ┌──────────┐       │ │
│  │  conducted pioneering research on radioactiv… │  │      │  Marie   │       │ │
│  │                                               │  │      └────┬─────┘       │ │
│  ├──────────────────────────────────────────────┤  │   spouse │ mentor       │ │
│  │  Character timeline                           │  │     ┌────┴───┐  ┌─────┐ │ │
│  │  ● 1898  Discovery of polonium       →        │  │     │ Pierre │  │ Irène│ │ │
│  │  ● 1902  Isolation of radium         →        │  │     │ Curie  │  │ J-C  │ │ │
│  │  ● 1903  Nobel Prize in Physics      →        │  │     └────────┘  └─────┘ │ │
│  │  ● 1911  Nobel Prize in Chemistry    →        │  │  (directed pairs +      │ │
│  │  (events in role order)                       │  │   sub-role labels)      │ │
│  └──────────────────────────────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** two-column — biography + character timeline on the left; relationship network on the right.
- **Tablet (640–1023px):** relationship network narrows; node labels truncate; layout stays two-column.
- **Mobile (<640px):** single column; biography → character timeline → relationship network stacked. The network renders as a bounded list of related characters with sub-role labels (graph layout is desktop/tablet; mobile uses the list fallback). Graph vs. list strategy owned by #171.

## Annotations

1. **Type-identity header (1 of 7 types).** Character-type icon + tint + label — never icon-alone, never color-only ([00](../00-ia-route-model.md) §5.2 rule 3; [ADR-0024](../../adr/adr-0024-accessibility-first-visual-language.md); [ADR-0007](../../adr/adr-0007-seven-character-types.md) seven types: Human / Animal / Mythological / Fictional / Organization / Divine / Artifact). Aliases truncate to "+N". Data: `characters.character_type`, `characters.aliases`.
2. **Temporal scope may be absent.** Divine/mythological/artifact characters may have no birth/death — render gracefully (no `TemporalDisplay` line) rather than an empty field. When present, era + precision always travel with the date ([00](../00-ia-route-model.md) §5.2 rule 4). Data: character temporal JSONB.
3. **Character timeline = events in role order (`event_characters`).** The events the character participates in, ordered, each navigating to event detail (`context-shift`, F4 step 4). This is a list, not the full canvas renderer — it is a per-character chronology. Data: `event_characters` junction → `events`.
4. **Relationship network = directed pairs (`character_relationships`).** Related characters with sub-role labels (spouse, mentor, …) per the relationship taxonomy ([ADR-0008](../../adr/adr-0008-character-relationships-directed-pairs.md) directed pairs; [ADR-0009](../../adr/adr-0009-relationship-sub-role-taxonomy.md) sub-roles). Each node links to that character's profile. **Graph layout strategy + node paging for large networks is owned by #171**; mobile uses a list fallback. Data: `character_relationships` (directed, temporally-scoped).
5. **Unpublished related characters render inert.** A relationship to an unpublished character renders as inert text (or is omitted), never a dead link ([00](../00-ia-route-model.md) §5.2 rule 1).
6. **Reconvergence pivot.** From a character-timeline event the reader reaches event detail, then an "appears in" timeline → the canvas (F4 steps 4–7). The character profile is therefore an on-ramp into the timeline-first surface.

## Edge cases

- **No events in role order.** Character-timeline section shows "No events yet" and omits gracefully ([02](../02-screen-inventory.md) §3; F4 edge case).
- **No published relationships.** Relationship network omits gracefully.
- **Large relationship network.** Bounded render; paging / detail-on-demand owned by #171.
- **No temporal scope (divine/mythological/artifact).** Temporal line omitted; header + biography stand alone.
- **Unpublished / missing character.** Clean 404 (screen 11); never 403 ([00](../00-ia-route-model.md) §4.3).
- **Loading.** Header + timeline/network skeletons.
- **Connection loss (Realtime).** Stale banner + auto-resubscribe ([02](../02-screen-inventory.md) §3).

## Open questions

> **Resolved (this pass):** Character timeline is a per-character chronology list (not the full canvas). Type identity is icon + tint + label (never icon/color-only). Temporal scope omitted gracefully when absent.
>
> Deferred to **#171:** relationship-network graph layout + node paging; graph-vs-list breakpoint behavior. Deferred to **#172:** type-identity + network visual treatment.
