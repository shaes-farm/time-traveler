# 04 — Story Browser

**Purpose.** The story-first browse + filter surface (`/stories`). A faceted grid of published stories (PRD §2.2.7; [02](../02-screen-inventory.md) §2 screen 4). The story-first parallel to Explore (screen 02).

**Flows:** F3 (browse → filter → open story).

## Data shown

- Filterable story grid — card: cover, title, narrator-type badge, perspective-character chip, tag chips
- Facet rail: `?narrator=`, `?perspective=`, `?tag=` (URL-encoded; preserved on refresh/share)
- Result count + active-facet summary
- Sort control; pagination

## Primary actions

- Apply / clear facets
- Sort + paginate
- Open a story card → `/:username/stories/:slug` (`cross-fade`)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Stories                                               58 stories · 12 shown   │
│                                                                                │
│  ┌─────────────────┐  ┌──────────────────────────────────────────────────────┐ │
│  │ Filter          │  │  Sort: Recent ▾                                       │ │
│  │                 │  │  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐ │ │
│  │ Narrator        │  │  │ [   cover   ] │ │ [   cover   ] │ │ [   cover  ] │ │ │
│  │ ☐ 1st person 14 │  │  │ The Curies'   │ │ A Mammoth     │ │ Zeus &       │ │ │
│  │ ☐ 3rd person 33 │  │  │ Quest         │ │ Winter        │ │ Olympus      │ │ │
│  │ ☐ Omniscient 11 │  │  │ ◈ 3rd person  │ │ ◈ 1st person  │ │ ◈ omniscient │ │ │
│  │                 │  │  │ ☻ Marie·Human │ │ ☻ (none)      │ │ ☻ Zeus·Divine│ │ │
│  │ Perspective ⌕   │  │  │ #triumph #sci │ │ #survival     │ │ #myth #epic  │ │ │
│  │                 │  │  └───────────────┘ └───────────────┘ └──────────────┘ │ │
│  │ Tag             │  │  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐ │ │
│  │ ☐ triumph    9  │  │  │ [   cover   ] │ │ [   cover   ] │ │ [   cover  ] │ │ │
│  │ ☐ survival  12  │  │  │ Voyage of the │ │ The Bronze    │ │ Letters from │ │ │
│  │ ☐ myth      18  │  │  │ Beagle        │ │ Collapse      │ │ the Front    │ │ │
│  │ ☐ science   21  │  │  │ ◈ 3rd person  │ │ ◈ omniscient  │ │ ◈ 1st person │ │ │
│  │ ☐ epic       7  │  │  │ ☻ Darwin·Human│ │ ☻ (none)      │ │ ☻ A. Doe·Hum │ │ │
│  │                 │  │  └───────────────┘ └───────────────┘ └──────────────┘ │ │
│  │ Clear filters   │  │  ⟨ 1  2  3  4  5  ⟩                                    │ │
│  └─────────────────┘  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** persistent left facet rail + 3-up story grid as drawn.
- **Tablet (640–1023px):** facet rail collapses to a top **Filters ▾** bar; grid 2-up.
- **Mobile (<640px):** facets move into an `enter-exit` bottom-sheet drawer; cards render 1-up; active facets surface as removable chips above the grid. (Same drawer pattern as Explore screen 02 for cross-surface consistency.)

## Annotations

1. **Facets are URL state.** `?narrator=` / `?perspective=` / `?tag=` are URL-encoded and preserved on refresh/share ([00](../00-ia-route-model.md) §3.2; F3 step 2). Data: `stories.narrator_type`, perspective character ref, story tags.
2. **Narrator badge (◈) + perspective chip (☻).** Narrator type is a badge; the perspective character is a chip rendered icon + type label + name — never icon-alone ([00](../00-ia-route-model.md) §5.2 rule 3). A story may have no perspective character ("(none)"). Data: `stories.narrator_type`, perspective `characters` row.
3. **Perspective facet is a typeahead.** Because the perspective-character space is large, `?perspective=` is set via a `⌕` typeahead resolving to a character; exact UX owned by #171. Tag facet is a checkbox set with counts.
4. **Cover thumbnails.** Story cards lead with a cover image (story media); a typed placeholder renders when a story has no cover. Data: story cover media ([ADR-0016](../../../adr/adr-0016-storage-buckets-graduated-access.md)).
5. **Card → reader is `cross-fade`, not `fractal-zoom`.** Opening a story moves from a list to a reading surface — a content swap, not a temporal-scale change (F3 step 3; [01](../01-ux-principles.md) §6). This deliberately differs from Explore's `fractal-zoom`.
6. **Tag chips on cards.** Up to ~2 tags shown inline (`#triumph #science`), the rest truncated. Tags are also the `?tag=` facet values.

## Edge cases

- **No matches for active facets.** Inline empty state + **Clear filters**; facets stay in URL ([02](../02-screen-inventory.md) §3; F3 edge case).
- **No published stories at all.** Whole-panel empty state with a link back to landing.
- **Loading.** Skeleton story cards; facet rail interactive immediately.
- **Error (transient).** Retryable error region.
- **Connection loss (Realtime).** Stale banner; auto-resubscribe ([02](../02-screen-inventory.md) §3).
- **Story with no cover.** Typed placeholder image; card stays coherent.

## Open questions

> **Resolved (this pass):** Card → reader uses `cross-fade` (not `fractal-zoom`). Perspective facet is a typeahead; tag facet is a checkbox set. Stories without a cover get a typed placeholder.
>
> Deferred to **#171:** perspective typeahead interaction; mobile active-facet chip behavior. Deferred to **#172:** card + cover visual treatment.
