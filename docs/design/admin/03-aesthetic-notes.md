# Aesthetic Notes — Parking Lot

This file is intentionally light. The current pass is information architecture and layout, not visual design. Notes here capture aesthetic _intent_ and constraints that will inform the next fidelity step, when the in-tree React prototypes go in.

## Tone and genre

Time Traveler is a **CMS for temporal scholarship**. The admin app's design genre is closer to:

- Notion's editor density and information hierarchy
- Linear's keyboard-first speed and surface restraint
- Sanity Studio's structured-content editing patterns
- Archive interfaces (museum collection managers, Smithsonian/MoMA backend tools) for the temporal handling

It is explicitly **not** in the genre of:

- Awwwards-style scroll-driven editorial sites (that is the _reader_ surface, not admin)
- shadcn-default Tailwind dashboards (visually generic, fails the `frontend-design` skill's anti-slop test)
- "Premium" agency portfolio aesthetics with custom cursors, parallax, magnetic buttons (wrong tool for editing)

Admin users want **density, speed, and trustworthy data display**. The aesthetic should reward that — not fight it with theatrics.

## Anchors that will carry into visual design

- **Temporal range is the spine of every screen.** Whenever a date appears, the era + precision belongs near it. Birthdate "1867 CE (exact)" beats "1867". This shapes type scale and label/value pairing rules.
- **Uncertainty is a first-class visual.** Approximate dates, geological ranges, "circa 12000 BCE ± 500" — these need a visual treatment (italics? hairline range bars? subdued color?) that distinguishes them from exact dates without screaming.
- **Era distinction matters.** A user juggling KYA/MYA/BYA dates and CE dates in the same session benefits from era being visually scannable. Consider color-coded era badges or a typographic convention. Avoid using era as the only signal (accessibility).
- **Character type is identity.** Human, Animal, Mythological, Fictional, Organization, Divine, Artifact — these read very differently. A divine being and a corporate organization can both have events and relationships, but the admin should make the type visible in lists, headers, and pickers without relying on an icon alone.
- **Junction surfaces are dense.** Event participants, character relationships, media attachments — these are the screens where a user spends real time. They need to read as _editable lists_, not as decorative cards.

## Typography direction (preliminary)

Following `frontend-design` skill guidance to avoid generic AI defaults (Inter, Roboto, system fonts):

- **Display / headlines**: a typeface with editorial character — candidates to test: GT Sectra, Söhne Breit, Tiempos Headline, or a strong slab like Söhne Schmal. Avoid generic geometric sans.
- **Body / forms**: needs to be highly legible at 14–16px in dense tables. Candidates: Söhne, Inter Tight (yes, this is the slop-tier choice — call out only if budget rules out alternatives), or a variable like Recursive Sans. Final pick deferred.
- **Numeric / temporal**: tabular figures are mandatory. Year columns must align. The numeric variant of the body face needs verified tabular numerals.
- **Mono**: for IDs, slugs, JSONB previews in admin tools. JetBrains Mono or Berkeley Mono. Not a hot path; light usage.

## Color direction (preliminary)

The aesthetic notes file is deliberately not picking a palette yet, but constraints worth recording:

- **Dark mode is mandatory.** A CMS user staring at structured forms for hours benefits from a low-luminance shell. Light mode should exist but not be the default.
- **No purple gradients.** Explicit anti-pattern per the `frontend-design` and `web-artifacts-builder` skill guidance.
- **Era differentiation via hue, not just saturation.** If we use color to signal CE/BCE/KYA/MYA/BYA, the hues need to read distinctly for the ~5% of male users with red-green colorblindness. Test with simulators before committing.
- **Significance/importance is a gradient, not a categorical scale.** Importance is 1–10, significance is `low/medium/high/critical`. Both lean toward sequential color scales (single hue, varying lightness/saturation) — not categorical palettes.
- **Status flags need visual weight.** `published = true` should be unmistakable in lists. Draft state should fade, not just label.

## Motion direction (preliminary)

This is an admin app, so motion serves **affordance** and **continuity**, not delight. Specifically:

- Form state changes (era picker switching CE → MYA, revealing/hiding fields) animate via height + opacity, never jarring layout shifts.
- Modal/sheet entrances are fast (150–200ms) and use ease-out. The user wants to be inside the dialog, not watching it appear.
- Destructive confirm dialogs do _not_ animate aggressively. They should feel weighty.
- No scroll-driven animation. No cursor effects. No magnetic buttons. No parallax. These belong in the public reader surface, if anywhere.

## Density and information rules

- **Tables are the primary list pattern.** Cards are reserved for cases where a single visual element (face, image) dominates — character cards in pickers, media tiles.
- **List rows show enough metadata to triage without clicking.** Examples in the wireframes: each row of the events table shows title, era + year, type, importance, participant count, published state.
- **Filter rails over filter dropdowns.** When 4+ filter axes exist (events list has 6+), a left-rail filter pattern with grouped controls beats stuffing them into the toolbar.
- **Search is global and entity-scoped.** Topbar search is global (across all four searchable types). Each list view has its own scoped search.

## Components shopping list (preliminary)

When this graduates to in-tree React in `apps/admin`, expected primitives — most map cleanly to shadcn/ui but the visual treatment should override defaults:

- DataTable with virtualization (events list will run long)
- Sheet (right-slide for relationship editor, event participant editor)
- Dialog (destructive confirms, quick-create)
- Popover (temporal input control)
- Combobox / Command palette (parent event picker, character picker, global search)
- TagInput / chip-style multi-text for `TEXT[]` fields
- Tabs (character detail, event detail)
- Tree (parent event lineage, category hierarchy) — _no shadcn primitive for this; custom build_
- Toast + optimistic-state feedback (TanStack Query pairs well)

## What I deliberately defer

- Color palette specification
- Final typeface picks
- Spacing scale and grid
- Iconography choices
- Empty-state illustration direction
- Dark/light mode token mapping

All of these are downstream of the IA decisions in the wireframes. Picking them now risks anchoring on shapes before validating flow.

## What would change my mind

- If a user-test of the wireframes reveals that the relationship editor needs a graph visualization to be usable, the aesthetic budget for visualization libraries grows substantially.
- If the project commits to a public reader surface that _does_ want immersive editorial design, the admin can stay restrained and the two surfaces can share design tokens but diverge sharply in motion + composition.
- If the schema grows new entity types (rumored in the PRD: places, languages?), the "character type as identity" rule generalizes to "entity type as identity" and the visual system needs to scale.
