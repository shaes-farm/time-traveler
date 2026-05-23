# 02 — Dashboard

**Purpose.** Landing page after sign-in. Orients the user, surfaces recent work, exposes quick-create. Avoids being a "stats dashboard" — the focus is _getting back to work_.

## Data shown

- Greeting + user's display name
- Counts per entity type (`get_user_metrics` RPC — system-design §5.4)
- Recent activity: last N edited entities across types (sorted by `updated_at`)
- Empty-state guidance for first-time users

## Primary actions

- Quick-create any entity (button or `C` shortcut)
- Jump to a recent entity (click row)
- Drill into an entity list (click a count card)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Good evening, Marie                              [ + Create… ▾ ]            │
│  Saturday, May 23, 2026                                                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Your library                                                           │  │
│  │ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │ │ Characters│ │  Events  │ │ Timelines│ │  Stories │ │  Periods │      │  │
│  │ │    47     │ │   312    │ │     8    │ │    14    │ │    23    │      │  │
│  │ │  ▴ 3 new  │ │  ▴ 12 new│ │  ─       │ │  ─       │ │  ─       │      │  │
│  │ └───────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │  │
│  │ Counts include drafts and unpublished. Click a card to open the list.  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────┐    │
│  │ Recent activity                │  │ Drafts                           │    │
│  │ ───────────────────────────────│  │ ──────────────────────────────── │    │
│  │ ▸ Discovery of polonium        │  │ ▸ Antoine Becquerel (character)  │    │
│  │   event · edited 2h ago        │  │ ▸ Sklodowska family arrival      │    │
│  │ ▸ Marie Curie                  │  │   (event)                        │    │
│  │   character · edited yesterday │  │ ▸ "On laboratory life" (story)   │    │
│  │ ▸ Pierre Curie                 │  │                                  │    │
│  │   character · edited 3d ago    │  │  3 unpublished items             │    │
│  │ ▸ 1898–1934 radium research    │  │                                  │    │
│  │   timeline · edited 5d ago     │  │                                  │    │
│  │                                │  │                                  │    │
│  │  See all activity →            │  │                                  │    │
│  └────────────────────────────────┘  └──────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Greeting uses time-of-day**, derived client-side. The full date is small and below.
2. **Count cards are the primary IA cue**. Five entity types fit naturally in a row; on smaller viewports they wrap to a 2x grid. Each card is a link to that entity's list.
3. **"▴ N new" only renders if there are entities created in the last 7 days.** This is a soft signal of momentum, not a notification. If zero new, render `─` instead of `▴ 0 new` to avoid screaming "you did nothing."
4. **Recent activity is the primary work resumption affordance.** Mixes entity types; each row labels its type explicitly. Sorted by `updated_at`. Max 10 entries.
5. **Drafts panel** filters recent activity to unpublished entities. Helps users see what they've started but not finished. Shows count at the bottom.
6. **Create menu is the topbar action**, not a giant CTA card on the dashboard. The user knows how to create; we don't need to scream.

## Edge cases

- **First-time user (all zero counts).** Replace the entire content area with an onboarding panel: "Welcome to Time Traveler. Start by creating a character or event." Two big CTAs. No fake "0" cards.
- **No recent activity.** Show empty state in the recent activity panel: "Nothing edited recently. Create something to see it here."
- **Counts loading.** Skeleton placeholders in each card. Total dashboard render should not block on counts.

## Open questions

- Is "Drafts" worth its own panel, or should it just be a filter on recent activity? Current design keeps it separate because the IA goal is "what should I finish before publishing?" — a different question than "where did I leave off?"
- Should this surface published vs. draft ratio? Could be motivational; could also feel surveillance-y. Deferred.
- Activity feed entry for _deleted_ entities? Probably no — the entity is gone, there's nowhere to navigate.
