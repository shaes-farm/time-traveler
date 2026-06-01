# 01 — Landing / Discovery

**Purpose.** The reader's front door (`/`). Presents the **dual call-to-action** into both entry philosophies — timeline-first (Explore) and story-first (Stories) — and surfaces featured + recent published timelines and stories so a first-time visitor has an immediate path inward (PRD §2.2.1; [02](../02-screen-inventory.md) §2 screen 1).

**Flows:** F1 (timeline-first entry), F3 (story-first entry).

## Data shown

- Hero with dual CTA: **Explore timelines** → `/explore`, **Read stories** → `/stories`
- Featured timelines (curated/featured published rows) — card: title, `TemporalDisplay` span, type, owner
- Featured stories — card: cover, title, narrator-type badge, perspective-character chip
- Recent-content rails (recently published timelines + stories), newest first

## Primary actions

- Enter timeline-first path (Explore CTA / nav)
- Enter story-first path (Stories CTA / nav)
- Open any featured/recent card → its reader route
- (All within the shell from [00](00-app-shell.md))

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⏳ Time Traveler        Explore   Stories   ⌕ Search            Sign in →     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│            Travel the full span of time — from the Big Bang to now.            │  ← hero
│                                                                                │
│             [ Explore timelines → ]        [ Read stories → ]                  │  ← dual CTA
│                                                                                │
│  ── Featured timelines ─────────────────────────────────────────────────────  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Cosmic       │ │ Evolution of │ │ Curie        │ │ Women in     │          │
│  │ history      │ │ life         │ │ biography    │ │ science      │          │
│  │ 13.8 BYA–now │ │ 4 BYA–now    │ │ 1867–1934 CE │ │ 1700–now CE  │          │
│  │ general      │ │ general      │ │ biography    │ │ thematic     │          │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                │
│  ── Featured stories ───────────────────────────────────────────────────────  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                           │
│  │ [  cover  ]  │ │ [  cover  ]  │ │ [  cover  ]  │                           │
│  │ The Curies'  │ │ A Mammoth    │ │ Zeus &       │                           │
│  │ Quest        │ │ Winter       │ │ Olympus      │                           │
│  │ ◈ 3rd person │ │ ◈ 1st person │ │ ◈ omniscient │                           │
│  │ ☻ Marie C.   │ │ ☻ (none)     │ │ ☻ Zeus·Divine│                           │
│  └──────────────┘ └──────────────┘ └──────────────┘                           │
│                                                                                │
│  ── Recently published ─────────────────────────────────────────────────────  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│  │ timeline  │ │ story     │ │ timeline  │ │ story     │ │ timeline  │  ⟩      │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile frame (structural reflow)

```
┌────────────────────────┐
│ ⏳  TT          ☰      │
├────────────────────────┤
│  Travel the full       │
│  span of time.         │
│                        │
│ [ Explore timelines → ]│  ← CTAs stack
│ [ Read stories →      ]│
│                        │
│ ── Featured timelines  │
│ ┌────────────────────┐ │  ← cards 1-up,
│ │ Cosmic history     │ │    horizontal
│ │ 13.8 BYA–now       │ │    swipe rail
│ └────────────────────┘ │
│  ‹ ●○○○ ›               │
│ ── Featured stories    │
│ ┌────────────────────┐ │
│ │ The Curies' Quest  │ │
│ └────────────────────┘ │
│ ── Recently published  │
│ ┌────────────────────┐ │
│ └────────────────────┘ │
└────────────────────────┘
```

## Responsive behavior

- **Desktop (≥1024px):** dual CTA side-by-side; rails show 4 timeline cards / 3 story cards per row.
- **Tablet (640–1023px):** dual CTA side-by-side; rails show 2–3 cards per row, remainder via horizontal scroll.
- **Mobile (<640px):** CTAs stack vertically (full-width); each rail becomes a 1-up horizontally-swipeable carousel with a position indicator (see mobile frame).

## Annotations

1. **Dual CTA is the load-bearing decision.** The two entry philosophies are equal-weight ([00](../00-ia-route-model.md) §5.3; [01](../01-ux-principles.md)). Neither is primary; the hero presents both side-by-side. This is the fork into F1 (Explore) vs. F3 (Stories).
2. **Every card carries `TemporalDisplay`.** Era + precision always travel with a date ([00](../00-ia-route-model.md) §5.2 rule 4) — e.g. "13.8 BYA", "1867–1934 CE". Data: each entity's hybrid temporal JSONB.
3. **Featured = curated, Recent = newest-first.** "Featured" surfaces a curated/featured flag on published rows; "Recently published" orders by publish recency. Data: `published = true` rows ([ADR-0011](../../../adr/adr-0011-publication-model.md)); curation source owned by content/admin.
4. **Story cards show narrator type (◈) + perspective character (☻).** Narrator-type badge and perspective-character chip (icon + type label, never icon-alone — [00](../00-ia-route-model.md) §5.2 rule 3). A story may have no perspective character ("(none)"). Data: `stories.narrator_type`, perspective character ref.
5. **Type/owner on timeline cards.** Timeline cards show the timeline `type` (general/biography/thematic…) and resolve the owner for the `/:username/...` route ([ADR-0029](../../../adr/adr-0029-public-reader-route-scheme.md) per [00](../00-ia-route-model.md) §4.1). Data: `timelines.type`, owner `username`.
6. **Card → route is the navigation transition.** Timeline card → `fractal-zoom` into the canvas (F1 step 4); story card → `cross-fade` into the reader (F3 step 3). Motion classes owned by [01](../01-ux-principles.md) §6 / timing by #172.
7. **No search box on landing.** Discovery here is curated + faceted-browse-driven; full search is stubbed (screen 10). The Search nav item is the only search surface at launch.

## Edge cases

- **Empty (nothing published yet).** Replace rails with a friendly empty state: "Nothing published yet — check back soon," keeping both CTAs visible so the IA still works ([02](../02-screen-inventory.md) §3).
- **Loading.** Skeleton cards in each rail; hero + CTAs render immediately (SSR).
- **Error (transient).** Retryable error panel scoped to the rails region; shell stays intact ([02](../02-screen-inventory.md) §3).
- **Connection loss (Realtime).** Stale-content banner via `ambient-presence`; auto-resubscribe merges newly-published rows into the recent rail on reconnect ([02](../02-screen-inventory.md) §3).
- **Sparse story card (no perspective character).** Chip renders "(none)"; card stays coherent.

## Open questions

> **Resolved (this pass):** No search box on landing (faceted browse + curated rails are the discovery floor; search stubbed). Dual CTA equal-weight (no default-primary path).
>
> Deferred to content/admin: the source of the "featured" flag (curation mechanism). Deferred to **#172:** card visual treatment, hero typography scale, carousel indicator styling.
