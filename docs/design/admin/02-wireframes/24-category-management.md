# 24 — Category Management

**Purpose.** Manage the **category taxonomy** — a hierarchical tree of tags used to organize events. Unlike timelines/events/characters, a category is lightweight organizational metadata, not authored content: there's no list/detail/editor split and no publish state. One screen does it all — browse the tree, create/edit nodes, and delete with an explicit child policy.

Categories attach to **events only** this pass (the `event_categories` junction); broader attachment to other entities is deferred (resolved M7 decision). Assignment happens in the [event editor](09-event-editor.md) (its category multi-select), **not** here — this screen owns the taxonomy, not the tagging.

## Data shown

- The category tree (`getCategoryTree`, hierarchical via `parent_category_id`)
- Per node: `color` swatch, `icon`, `title`, `description` (on hover/expand), child count, **usage count** (events tagged via `event_categories`)

## Primary actions

- Expand / collapse tree nodes
- Create a category (root or child)
- Edit a category (`title`, `description`, `color`, `icon`, `parent_category_id`)
- Delete a category (with explicit child-handling policy)
- Reparent (move a subtree under a different parent)

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Categories                                            [ + New category ]    │
│  18 categories · 4 roots                                                     │
│                                                                              │
│  ┌────────────────────────────────────────────┬───────────────────────────┐ │
│  │  ⌕ Filter categories…                       │  Edit category            │ │
│  │  ──────────────────────────────────────────  │  ───────────────────────  │ │
│  │  ▾ 🔴 Science                      42 events │  Title *                  │ │
│  │     ▾ 🔵 Physics                   28 events │  [ Quantum Mechanics  ]   │ │
│  │        • 🟣 Quantum Mechanics       9 events │                           │ │
│  │        • 🟢 Relativity              6 events │  Description              │ │
│  │     ▸ 🟠 Chemistry                 11 events │  [ Sub-atomic behavior… ] │ │
│  │  ▾ 🔴 War                          63 events │                           │ │
│  │     • 🟤 World Wars                31 events │  Color   [ 🟣 #8B5CF6  ]  │ │
│  │     • ⚫ Ancient Warfare            8 events │  Icon    [ ⚛  atom     ]  │ │
│  │  ▸ 🟡 Art                          15 events │  Parent  [ Physics    ▾]  │ │
│  │  • ⚪ Uncategorized-bin (0 children) 4 events│                           │ │
│  │                                              │  [ Delete ]      [ Save ] │ │
│  │  [ + Add root category ]                     │                           │ │
│  └────────────────────────────────────────────┴───────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

1. **Tree + inspector, not list/detail.** Left: the category tree (expand/collapse). Right: an inspector panel that edits the selected node inline (or a "new category" form). This is the lightest-weight management surface in the admin — categories don't earn their own routes per node.
2. **Tree comes from `getCategoryTree`** (the existing service builds it in-memory from `parent_category_id`). Ordering within a level is deterministic — alphabetical by `title` (categories have no `sort_order` and no temporal axis). Indentation shows depth; `▾`/`▸` expand/collapse; `•` = leaf.
3. **Each node shows its own `color` + `icon`** — these are **author-chosen per category** (`color VARCHAR(7)` hex, `icon VARCHAR(100)`), distinct from the system token palette. They're the category's identity for the event-editor multi-select and event detail chips. The color is a small swatch; the icon renders from the stored identifier (lucide name or emoji).
4. **Usage count per node** = events tagged via `event_categories`. This is the key triage signal ("is this category actually used?") and drives the delete policy (annotation #6). Deferred-tolerant: render the tree without counts if the aggregate isn't wired.
5. **Create/edit inspector fields:** `title` (required), `description`, `color` (swatch + hex picker), `icon` (picker over the lucide set + emoji fallback), `parent` (combobox; empty = root). **No publish control** — categories have no `published` column; they're taxonomy, always "live" for their owner.
6. **Delete requires an explicit child + usage policy** (issue #59/#63 acceptance). The schema is `parent_category_id ... ON DELETE CASCADE` and `event_categories ... ON DELETE CASCADE`, so a naive delete removes the subtree **and** untags every event. The confirm dialog makes this explicit and offers a safer path:
   - Shows blast radius: "Delete _Physics_? This also deletes 2 child categories (Quantum Mechanics, Relativity) and removes the tag from 28 events."
   - **Option A — Reparent children first** (recommended default when children exist): move children up to _Physics_' parent (or to root), then delete only _Physics_. Preserves the subtree.
   - **Option B — Delete subtree** (the raw cascade): deletes _Physics_ and all descendants; untags all affected events.
     The reparent path is application-layer (the DB only offers cascade); the UI performs the reparent then the delete.
7. **Reparent (move subtree)** — changing a node's `parent` in the inspector (or drag in the tree) moves it and its descendants. **Cycle prevention** (service-layer, system-design §3.4 — `parent_category_id` cycles are not DB-constrained): the parent picker excludes the node and its descendants. This is the **kept** hierarchy axis (taxonomy trees are inherently nested; contrast the retired event `parent_event_id`, [#180](https://github.com/shaes-farm/time-traveler/issues/180)).
8. **No temporal, no significance, no media, no publish** — categories are the simplest entity. The screen is deliberately spare.

## Edge cases

- **Empty (zero categories).** Whole-panel empty state: "No categories yet. Categories are the tags that organize your events — nest them into a tree (Science → Physics → Quantum Mechanics)." Single CTA: **New category**.
- **Delete a category with children.** Always routes through the policy dialog (annotation #6); never a one-click cascade.
- **Delete a category with high usage but no children.** Confirm still states usage ("removes the tag from 28 events"); single-option delete (no reparent needed).
- **Reparent that would create a cycle.** Picker pre-excludes descendants; service rejects a slipped-through race ("That would create a circular category hierarchy").
- **Color/icon unset.** Render a neutral swatch + a default tag icon; both fields are optional in the schema.
- **Duplicate titles under different parents.** Allowed — uniqueness is `(user_id, slug)`, and slugs auto-resolve collisions. Two "Overview" categories under different parents are fine.
- **Loading.** Tree skeleton; inspector empty until a node is selected.

## Open questions

- **Drag-to-reparent vs. picker-only.** The picker is the baseline (always works); drag-in-tree is the nicer interaction. Drag is documented as the target but may land after the picker (consistent with #63's non-goal note on drag polish "if not yet supported by design scope").
- **Merge categories** (fold A into B, re-tagging A's events to B then deleting A) — a real taxonomy-maintenance need, but heavier; deferred to a follow-up. The reparent + delete-policy flow covers restructuring; merge covers de-duplication.
- **Broader attachment** (characters/timelines/periods/stories) — deferred this pass (events-only). If adopted later it needs per-entity category junctions + assignment UI; tracked as the category-scope decision in the M7 inventory notes.
