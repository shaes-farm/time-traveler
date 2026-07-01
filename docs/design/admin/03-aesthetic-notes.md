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

- **Display / headlines**: a typeface with editorial character — candidates to test: GT Sectra, Söhne Breit, Tiempos Headline, or a strong slab like Söhne Schmal. Avoid generic geometric sans. **Fidelity-2 substitute: Fraunces** (Google Fonts) — variable serif standing in for GT Sectra; licensed pick remains the long-term aspiration.
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

## Visual design language (finalized — fidelity-2)

The "preliminary" sections above record _intent_. This section records the **decisions** made when the intent met implementation in fidelity-2 (Batches A–H, PRs [#149](https://github.com/shaes-farm/time-traveler/pull/149)–[#162](https://github.com/shaes-farm/time-traveler/pull/162)). Where a value below differs from the PRD, the divergence is called out and the source-of-truth is the token file noted.

Source-of-truth for color/typography/radius tokens: [`packages/ui/src/styles/tokens.ts`](../../../packages/ui/src/styles/tokens.ts) (hand-synced to `tokens.css`). This document specifies _intent and semantics_; the token files carry the canonical values. **Do not treat the hexes/OKLCH here as authoritative if they drift from the token file — update this doc to match the code.**

### Era palette (finalized)

Eras differentiate by **hue spread evenly around the color wheel**, not by the clustered semantic palette the PRD originally proposed. This is the load-bearing accessibility decision: PRD §7.2.2's blue/amber/**brown**/**green**/purple set clusters brown↔amber↔green in the warm-to-yellow-green band, which is exactly where red-green colorblind users lose separation. The finalized palette maximizes inter-era hue distance instead.

| Era | Finalized hue (dark mode)          | Token             | PRD §7.2.2 previously       | Reconciled?    |
| --- | ---------------------------------- | ----------------- | --------------------------- | -------------- |
| CE  | warm amber — `oklch(0.78 0.10 60)` | `--color-era-ce`  | warm blue `#4F7CAC`         | ✅ PRD updated |
| BCE | gold — `oklch(0.78 0.10 100)`      | `--color-era-bce` | amber gold `#D4A574`        | ✅ PRD updated |
| KYA | teal — `oklch(0.74 0.09 200)`      | `--color-era-kya` | earth brown `#8B7355`       | ✅ PRD updated |
| MYA | blue — `oklch(0.74 0.09 260)`      | `--color-era-mya` | deep forest green `#2D5C3F` | ✅ PRD updated |
| BYA | magenta — `oklch(0.74 0.10 320)`   | `--color-era-bya` | cosmic purple `#6B4C8A`     | ✅ PRD updated |

**Hue is never the only signal.** The `TemporalDisplay` primitive ([#158](https://github.com/shaes-farm/time-traveler/pull/158)) also renders the era code (`CE` / `BCE` / `KYA` / `MYA` / `BYA`) in a mono typographic treatment beside the value, so colorblind users read the literal era token regardless of hue. Light-mode era values are deferred with the rest of light mode.

> **PRD reconciled.** PRD §7.2.2 has been updated in place to the finalized hue-spread palette (no separate issue filed — fixed directly, per the same approach as the [#127](https://github.com/shaes-farm/time-traveler/issues/127) reconciliation). The token files (`tokens.css` / `tokens.ts`) remain the source of truth; the PRD now points at them.

### Uncertainty treatment (finalized)

Precision and uncertainty render as a **layered, quiet** treatment — never alarming, always legible:

- **Exact** dates: plain, full-weight numerals.
- **circa / approximate / estimated**: the qualifier renders as a subdued, muted-foreground prefix (`c.` / `~` / `est.`) and the value sits in `--color-foreground-muted`, not full foreground. No italics on the numerals themselves (tabular alignment must hold).
- **Uncertainty range (`± years`)**: rendered inline in muted foreground (`66 MYA ± 1M`).
- **Range bar**: a hairline horizontal bar appears under a temporal range only when it carries real ambiguity — the trigger rule (from [08-event-detail.md](02-wireframes/08-event-detail.md) annotation #5) is **uncertainty > 100 years OR range > 1000 years OR the range spans an era boundary.** Trivial CE ranges get no bar.

### Character type as identity (finalized)

Each of the seven `character_type` values gets a **lucide-react icon + a low-chroma color tint + the literal label**. The label is always present (never icon-alone, per the anchor above); color and icon are reinforcement for fast scanning in lists, headers, and pickers. Color stays low-chroma so seven categorical tints don't fight the era accents or the importance gradient when they co-occur in a dense row.

| `character_type` | lucide icon (candidate) | Tint (dark mode)                    | Notes                             |
| ---------------- | ----------------------- | ----------------------------------- | --------------------------------- |
| `human`          | `User`                  | `oklch(0.72 0.04 250)` slate        | the default; most common          |
| `animal`         | `PawPrint`              | `oklch(0.74 0.06 150)` muted green  | species/breed fields attach       |
| `mythological`   | `Drama`                 | `oklch(0.76 0.07 30)` terracotta    | legend/hero register              |
| `fictional`      | `BookOpen`              | `oklch(0.74 0.06 300)` muted violet | source-work / author              |
| `organization`   | `Building2`             | `oklch(0.72 0.03 230)` steel        | founded/dissolved temporal labels |
| `divine`         | `Sparkles`              | `oklch(0.80 0.08 90)` gold          | domain field; radiance register   |
| `artifact`       | `Gem`                   | `oklch(0.70 0.04 60)` bronze        | created/destroyed temporal labels |

**Recommended token slots** (to add to `tokens.ts`/`tokens.css` when the type badge primitive lands — not added in this design pass): `--color-type-human`, `--color-type-animal`, `--color-type-mythological`, `--color-type-fictional`, `--color-type-organization`, `--color-type-divine`, `--color-type-artifact`. Icons are candidates pending a Storybook pass against the era palette; the icon **set** (lucide-react) is locked. Badge shape follows the existing `Badge` primitive (subtle tinted background + ring, matching `StatusBadge`).

### Significance scale (finalized)

`significance` (`low / medium / high / critical`) reuses the **importance sequential ramp** already shipped in Batch F — a single amber hue (55) rising in lightness + chroma across four brackets (`--color-importance-low` … `--color-importance-critical`). Significance and importance are the same _visual_ language (sequential, single-hue) even though they are different data fields, because both answer "how much does this matter." No new tokens needed; the four brackets map 1:1 onto the four significance levels.

### Status badges (finalized)

Per PRD §7.11.5, surfaced via the `StatusBadge` primitive (Batch B):

- **Published** — `✓`, emerald tint (`emerald-400` on `emerald-500/10` with ring). Unmistakable.
- **Draft** — `─`, zinc/muted. Recedes.
- **Shared** — `⇄`, blue tint. Marks collaborator-visible entities (adopted in the [#127](https://github.com/shaes-farm/time-traveler/issues/127) reconciliation).

## Motion direction (preliminary)

This is an admin app, so motion serves **affordance** and **continuity**, not delight. Specifically:

- Form state changes (era picker switching CE → MYA, revealing/hiding fields) animate via height + opacity, never jarring layout shifts.
- Modal/sheet entrances are fast (150–200ms) and use ease-out. The user wants to be inside the dialog, not watching it appear.
- Destructive confirm dialogs do _not_ animate aggressively. They should feel weighty.
- No scroll-driven animation. No cursor effects. No magnetic buttons. No parallax. These belong in the public reader surface, if anywhere.

## Density and information rules

- **Tables are the primary list pattern.** Cards are reserved for cases where a single visual element (face, image) dominates — character cards in pickers, media tiles.
- **List rows show enough metadata to triage without clicking.** Examples in the wireframes: each row of the events table shows title, era + year, type, importance, participant count, published state.
- **Filter rails over filter dropdowns.** When 4+ filter axes exist (events list has 6+), a side-rail filter pattern with grouped controls beats stuffing them into the toolbar. The rail sits on the **right**, after the content it filters — this keeps the content adjacent to the primary nav (rather than wedged between two rails) and mirrors the editor's right-hand metadata column, so "contextual controls live on the right" reads consistently across list and editor surfaces. See ADR-0035.
- **Search is global and entity-scoped.** Topbar search is global (across all four searchable types). Each list view has its own scoped search.

## Components shopping list (preliminary)

When this graduates to in-tree React in `apps/admin`, expected primitives — most map cleanly to shadcn/ui but the visual treatment should override defaults:

- DataTable with virtualization (events list will run long)
- Sheet (right-slide for relationship editor, event participant editor)
- Dialog (destructive confirms, quick-create)
- Popover (temporal input control)
- Combobox / Command palette (timeline & sub-timeline pickers, link-event picker, character picker, global search)
- TagInput / chip-style multi-text for `TEXT[]` fields
- Tabs (character detail, event detail, timeline detail)
- Tree (category hierarchy; timeline fractal hierarchy) — _no shadcn primitive for this; custom build_
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
