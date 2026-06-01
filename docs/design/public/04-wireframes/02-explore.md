# 02 — Explore (Timeline Navigator)

**Purpose.** The timeline-first browse + filter surface (`/explore`). A faceted grid/list of published timelines — the master-timeline entry point (PRD §2.2.1; [02](../02-screen-inventory.md) §2 screen 2). Faceted browse here is the **search floor** for MVP ([00](../00-ia-route-model.md) OQ-2).

**Flows:** F1 (discover → filter → open canvas), F5 (add timelines to compare).

## Data shown

- Filterable result grid/list of published timelines — card: title, `TemporalDisplay` span, type, owner, event-count
- Facet rail: `?type=`, `?era=`, `?category=`, `?character=` (URL-encoded; preserved on refresh/share)
- Result count + active-facet summary
- Sort control; pagination
- Per-card **Add to compare** affordance (F5; MVP-optional)

## Primary actions

- Apply / clear facets (URL-driven)
- Sort + paginate
- Open a timeline card → `/:username/timelines/:slug` (`fractal-zoom`)
- Add a card to the compare set (F5)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Explore timelines                                  124 timelines · 18 shown   │
│                                                                                │
│  ┌─────────────────┐  ┌──────────────────────────────────────────────────────┐ │
│  │ Filter          │  │  Sort: Recent ▾                    Compare (0)  [ ▭ ] │ │
│  │                 │  │  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐ │ │
│  │ Type            │  │  │ ☐ compare     │ │ ☐ compare     │ │ ☐ compare    │ │ │
│  │ ☐ General   62  │  │  │ Cosmic        │ │ Evolution of  │ │ Curie        │ │ │
│  │ ☐ Biography 24  │  │  │ history       │ │ life on Earth │ │ biography    │ │ │
│  │ ☐ Thematic  31  │  │  │ 13.8 BYA–now  │ │ 4 BYA–now     │ │ 1867–1934 CE │ │ │
│  │ ☐ Other      7  │  │  │ general·412 ev│ │ general·208 ev│ │ biography·54 │ │ │
│  │                 │  │  └───────────────┘ └───────────────┘ └──────────────┘ │ │
│  │ Era             │  │  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐ │ │
│  │ ☐ BYA       18  │  │  │ Women in      │ │ French        │ │ Bronze Age   │ │ │
│  │ ☐ MYA       22  │  │  │ science       │ │ scientists    │ │ Mediterr.    │ │ │
│  │ ☐ KYA       14  │  │  │ 1700–now CE   │ │ 1600–now CE   │ │ 3300–1200BCE │ │ │
│  │ ☐ BCE       29  │  │  │ thematic·77 ev│ │ thematic·61 ev│ │ general·140  │ │ │
│  │ ☐ CE        41  │  │  └───────────────┘ └───────────────┘ └──────────────┘ │ │
│  │                 │  │                                                        │ │
│  │ Category     ▾  │  │  ⟨ 1  2  3  4  5  6  7  ⟩                              │ │
│  │ Character    ⌕  │  │                                                        │ │
│  │                 │  │                                                        │ │
│  │ Clear filters   │  │                                                        │ │
│  └─────────────────┘  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile frame (structural reflow)

```
┌────────────────────────┐
│ ⏳ TT             ☰    │
├────────────────────────┤
│ Explore     [ Filters ▾]│  ← facet rail = drawer
│ 124 timelines           │
│ Sort: Recent ▾  Compare │
│ ┌────────────────────┐ │
│ │ ☐ compare          │ │  ← cards 1-up
│ │ Cosmic history     │ │
│ │ 13.8 BYA–now       │ │
│ │ general · 412 ev   │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ Evolution of life  │ │
│ └────────────────────┘ │
│ ⟨ 1 2 3 … ⟩            │
└────────────────────────┘
   Filters open as an enter-exit
   bottom sheet; facet counts inside.
```

## Responsive behavior

- **Desktop (≥1024px):** persistent left facet rail + 3-up result grid as drawn.
- **Tablet (640–1023px):** facet rail collapses to a top **Filters ▾** bar that expands inline; result grid 2-up.
- **Mobile (<640px):** facets move into an `enter-exit` bottom-sheet drawer (**Filters** button); results render 1-up. Active facets surface as removable chips above the results.

## Annotations

1. **Facets are URL state.** `?type=` / `?era=` / `?category=` / `?character=` are encoded in the URL and preserved on refresh/share ([00](../00-ia-route-model.md) §3.2; F1 step 3). Within a group selections are OR; across groups AND (admin list convention). Data: `timelines` columns + `timeline_characters` / category junctions.
2. **Era facet uses the canonical era codes.** BYA / MYA / KYA / BCE / CE — never color-only, always the literal code ([01](../01-ux-principles.md) §7; [ADR-0024](../../../adr/adr-0024-accessibility-first-visual-language.md)). Data: derived from each timeline's temporal JSONB era band.
3. **Category + Character facets are deferred-expand.** Category is a dropdown (taxonomy can be large); Character is a typeahead search (`⌕`) resolving to a `?character=` filter on `timeline_characters`. Exact typeahead UX owned by #171.
4. **Result card mirrors landing cards** (title, `TemporalDisplay`, type, event-count) plus an event-count signal. Owner resolves the `/:username/...` route ([ADR-0029](../../../adr/adr-0029-public-reader-route-scheme.md)). Data: `published = true` timelines.
5. **Add-to-compare (F5) is per-card + a running counter.** A checkbox on each card feeds a **Compare (N)** control; activating it opens screen 09 with `?t=` params. Capped at 4 ([03](../03-user-flows.md) F5 edge cases). **MVP-optional** — hidden if `/compare` is not built. Data: client-side selection set.
6. **Card → canvas is `fractal-zoom`.** Opening a card transitions into the timeline reader with spatial origin at the card (F1 step 4); scale defaults to `?scale=logarithmic` for long spans ([00](../00-ia-route-model.md) §3.2).
7. **Sort + pagination are conventional.** Offset pagination + a sort selector (Recent / Title / Span). Cursor pagination on `sort_order_years` is a later optimization (system-design §8.2); not load-bearing for the wireframe.

## Edge cases

- **No matches for active facets.** Inline empty state above the grid: "No timelines match your filters" + **Clear filters**; facets remain in the URL for adjustment ([02](../02-screen-inventory.md) §3; F1 edge case).
- **No published timelines at all.** Whole-panel empty state with a link back to landing.
- **Loading.** Skeleton grid; facet rail is interactive immediately ([02](../02-screen-inventory.md) §3).
- **Error (transient).** Retryable error region; facets preserved in URL.
- **Connection loss (Realtime).** Banner on dropped subscription; newly-published rows merge on reconnect ([02](../02-screen-inventory.md) §3).
- **Compare cap reached (4).** Add-to-compare affordance deactivates at 4 with an explanatory tooltip (UX owned by #171).

## Open questions

> **Resolved (this pass):** Faceted browse is the MVP search floor (full search stubbed, screen 10). Era facet uses literal era codes (never color-only). Compare affordance is per-card + counter, MVP-optional.
>
> Deferred to **#171:** character typeahead interaction; compare-cap tooltip UX; exact active-facet chip behavior on mobile. Deferred to **#172:** card + facet visual treatment.
