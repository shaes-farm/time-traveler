# 10 — Global Search (stubbed)

**Status: Post-MVP / stubbed at launch.** Faceted full-text search across all published types is reserved but not built for MVP; the Search nav item routes here to a "coming soon" placeholder ([02](../02-screen-inventory.md) §2 screen 10; [00](../00-ia-route-model.md) OQ-2). Faceted browse on Explore (02) and Stories (04) is the MVP search floor.

**Flows:** — (no flow traverses search at MVP).

> This is a **lightweight frame** — a single placeholder state. The full search surface (input, faceted results grouped by type, ranking) is designed when search is scheduled post-MVP.

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                              ⌕                                                 │
│                     Search is coming soon                                      │
│                                                                                │
│       Full-text search across timelines, stories, events, and characters      │
│       is on the way. For now, browse and filter:                              │
│                                                                                │
│              [ Explore timelines → ]      [ Read stories → ]                   │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Responsive behavior

- All breakpoints: a single centered placeholder. CTAs stack vertically on mobile (<640px). No facets, no input wiring at MVP.

## Annotations

1. **Present but stubbed — deliberately not hidden.** Keeping the Search nav item + this route stable means the IA does not shift when search ships ([00](../00-ia-route-model.md) §3.1; [02](../02-screen-inventory.md) §2 annotation). The only state at launch is this placeholder.
2. **Redirects discovery to the MVP floor.** The two CTAs send users to the faceted browse surfaces (Explore / Stories) that _are_ the search substitute at MVP.
3. **Future surface (out of scope here).** When built, this screen gets: a search input (backed by the `search_vector` columns on events/characters/stories/timelines), results grouped by entity type, and facets. That design is **post-MVP** and not specified in this pass.

## Edge cases

- **Only one state.** No empty/loading/error variants at launch — the placeholder is the single state ([02](../02-screen-inventory.md) §3 "Global search" row: stub only).
- **Direct navigation to `/search`.** Lands on this placeholder (not a 404) — the route is reserved.

## Open questions

> **Resolved (this pass):** Search is stubbed; route reserved and stable; discovery redirected to faceted browse. Full search surface is **post-MVP** and intentionally undesigned here.
