# 00 — App Shell

**Purpose.** Persistent chrome on every authenticated screen. Provides navigation, identity, and global affordances. Not a "screen" — a layout primitive that every other wireframe sits inside.

## Data shown

- Authenticated user's name + avatar (from `profiles.first_name`, `profiles.last_name`, `profiles.avatar_url`)
- Current location breadcrumb derived from route
- Entity-type counts in the sidebar (optional badges from `get_user_metrics` RPC — debate in open questions)
- Global notification count (deferred — placeholder badge only)

## Primary actions

- Navigate to any top-level entity list (Characters, Events; later: Timelines, Periods, Stories, Media, Categories)
- Open user menu (profile, sign out, theme toggle)
- Open global search (`Cmd+K` / `Ctrl+K`)
- Open quick-create menu (`C` keyboard shortcut, opens command palette pre-filtered to "create...")

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Time Traveler        ⌕  Search everywhere…              ⊕   🔔  👤 MC ▾  │  ← topbar
├──────────────┬───────────────────────────────────────────────────────────────┤
│              │                                                               │
│  ▸ Dashboard │   Dashboard ▸ Characters ▸ Marie Curie                        │  ← breadcrumb
│              │   ─────────────────────────────────────────────────────────── │
│  Content     │                                                               │
│  ▸ Characters│                                                               │
│  ▸ Events    │              [ screen content goes here ]                     │
│  ─ Timelines │                                                               │
│  ─ Periods   │                                                               │
│  ─ Stories   │                                                               │
│              │                                                               │
│  Library     │                                                               │
│  ─ Media     │                                                               │
│  ─ Categories│                                                               │
│              │                                                               │
│  ─ Settings  │                                                               │
│              │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
   ↑ left rail                                ↑ content viewport
   220–256px fixed                            fluid; max content width 1280px
```

## Annotations

1. **Sidebar nav uses two visual states**: active (filled marker `▸`), inactive (dim marker `─`). Out-of-scope entities are dimmed but still present, so the IA reads complete even in this first pass.
2. **Sidebar grouping reflects the data model**, not arbitrary product sections: "Content" for entities the user authors as primary work, "Library" for organizational resources, "Settings" alone at the bottom.
3. **Topbar global search** opens a command palette ([Cmd+K]) that searches across all four searchable entity types (events, characters, stories, timelines — backed by their `search_vector` columns). Results group by entity type.
4. **Quick-create button** (⊕) opens the same command palette pre-filtered to "Create…". This is the primary way to start a new entity from anywhere.
5. **Breadcrumb is route-derived**, not hand-authored. Each segment links to its parent.
6. **User menu** shows display name. Sign-out, profile edit, theme toggle (dark default), and an "admin tools" link if `profiles.role = 'admin'`.
7. **No nav badges on counts in the sidebar** unless we have a reason to call attention to them. Per `system-design §8.2` the metrics RPC exists but pushing counts into the chrome adds noise. Deferred decision.

## Edge cases

- **Loading.** Topbar + sidebar render immediately; content area shows route-specific skeleton.
- **Unauthenticated.** Redirect to sign-in. Shell only renders when session is valid.
- **Admin role.** Sidebar gets an extra "Admin" group (moderation queue, all users, content reports). Out of scope for this pass but called out as an addition vector.
- **Mobile / narrow viewport.** Sidebar collapses to an off-canvas drawer. Out of scope for this pass — admin is desktop-first.

## Open questions

- Should the sidebar surface entity counts? They're cheap (one RPC), but they create visual noise and they can be wrong-feeling when stale.
- Where does the "switch timeline context" affordance live, once timelines are in scope? Topbar? Above breadcrumb? Inside the events list?
