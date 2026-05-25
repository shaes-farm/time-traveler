# Fidelity-2 Implementation Plan

Status: draft 1 — ready for execution
Scope: the visual design system + screen mockups + production primitives that consume the fidelity-1 wireframes ([`02-wireframes/`](02-wireframes/))

## Context

[Fidelity-1](00-screen-inventory.md) shipped 11 markdown wireframes plus an [aesthetic-notes parking lot](03-aesthetic-notes.md) with explicit deferrals: color palette, typeface picks, spacing scale, iconography, empty-state illustrations, dark/light mode tokens.

The wireframes commit to:

- Dark mode default
- Table-first density (cards only where a single visual element dominates)
- Motion-as-affordance, not delight — no scroll-driven animation, no custom cursors, no parallax
- Era + precision visible everywhere a date appears
- Character type as identity (visible in lists, headers, pickers)
- Junction surfaces read as editable lists

Fidelity-2 turns those constraints into:

1. A typed design token system
2. shadcn-based primitives with a heavily customized theme
3. Composite Storybook mockups for every wireframed screen
4. Production-ready route stubs in `apps/admin` that consume the design system

The fidelity-1 design review filed three follow-up issues; all are resolved or open with concrete proposals. The wireframes are stable; this plan implements them.

## Locked-in stack

Decisions captured before execution begins:

| Decision            | Pick                                                                                                            | Rationale                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS framework       | **Tailwind 4** in `packages/ui` and `apps/admin`                                                                | shadcn implies Tailwind; CSS-first config (no `tailwind.config.js`); existing CSS Modules code stays where it makes sense (route-level layout) |
| Component workbench | **Storybook 10 + Vite preset** in `packages/ui`                                                                 | Vite is lighter than the Next.js preset; pairs with existing Vitest tooling. Primitives stay framework-agnostic                                |
| Token system        | **TypeScript source-of-truth** emitting CSS variables + Tailwind theme via build script                         | Single source; tokens are typed and importable from React when needed                                                                          |
| Icons               | **lucide-react**                                                                                                | shadcn's default; free, neutral, comprehensive                                                                                                 |
| Color base          | **Tailwind zinc neutrals**; accent colors (era hues, status badges, importance gradient) crystallize in Batch B | Avoids picking palette in the abstract; lets the temporal primitive drive accent decisions                                                     |
| Display typeface    | **Instrument Serif** (Google Fonts)                                                                             | Substitute for licensed picks (GT Sectra / Tiempos) listed in aesthetic notes. Editorial character without licensing cost. Final pick deferred |
| Body typeface       | **Inter Tight** (Google Fonts)                                                                                  | Acknowledged "slop-tier" but acceptable per aesthetic notes when licensed alternatives are out of budget. Tabular numerals verified            |
| Mono typeface       | **JetBrains Mono** (Google Fonts)                                                                               | Per aesthetic notes; for IDs, slugs, JSONB previews                                                                                            |
| Bespoke primitives  | **Tree only** per [aesthetic notes](03-aesthetic-notes.md) — every other primitive comes from shadcn            | DataTable uses tanstack-table + shadcn `Table` markup                                                                                          |

## Where things live

| Concern                                   | Location                                                                                  | Notes                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Design primitives (shadcn + custom theme) | `packages/ui/src/components/`                                                             | Exported via `@repo/ui/*`                                      |
| Design tokens                             | `packages/ui/src/styles/tokens.ts` (TS source) + emitted CSS variables and Tailwind theme | Build step emits both forms                                    |
| Storybook                                 | `packages/ui/.storybook/`                                                                 | Runs via `pnpm run storybook` in `packages/ui`                 |
| Stories                                   | colocated next to components (`*.stories.tsx`)                                            | Same workspace, same lint/check-types rules                    |
| Composite "page" mockups                  | Storybook composite stories under a `Pages > *` hierarchy                                 | Real route counterparts ship later in `apps/admin`             |
| Production routes                         | `apps/admin/app/*`                                                                        | Consume `@repo/ui` primitives; replace placeholder boilerplate |

Mockup screens that don't yet have a production route live as Storybook composite stories. When a screen graduates to interactive/data-driven, the route moves to `apps/admin` and the composite story stays as a visual snapshot.

## Batches

Each batch ends with a reviewable visual deliverable. Each depends only on the previous.

| Batch                                  | Theme               | Deliverables                                                                                                                                                                                                                                       |
| -------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[A](#batch-a--foundations)**         | Foundations         | Tailwind 4 + Storybook 10 + tokens.ts; first trivial story; Foundations stories (Colors, Typography, Spacing, Era treatment)                                                                                                                       |
| **[B](#batch-b--temporal-primitive)**  | Temporal primitive  | `TemporalDisplay` component with variant matrix in Storybook; character-detail composite story consuming it; era + uncertainty tokens crystallized                                                                                                 |
| **[C](#batch-c--app-shell)**           | App shell           | Sidebar (240/64px collapsed per [#127](https://github.com/shaes-farm/time-traveler/issues/127)), topbar, breadcrumb, layout grid; status-badge primitives (Published/Draft/Shared); the chrome that wraps every future mockup                      |
| **[D](#batch-d--list-primitives)**     | List primitives     | DataTable (shadcn + tanstack-table); left-rail filter group; row-layout patterns (multi-line, era + uncertainty inline, importance numeric); composite stories for characters list + events list                                                   |
| **[E](#batch-e--editor-primitives)**   | Editor primitives   | Chip input, slug field with locked-by-default, temporal input control (composite popover using TemporalDisplay), curated-set save dropdown; composite stories for character editor + event editor                                                  |
| **[F](#batch-f--relationship-editor)** | Relationship editor | Card stream layout, sub-role picker ([#119](https://github.com/shaes-farm/time-traveler/issues/119) taxonomy), reciprocity-aware add sheet, contradiction warning; composite story for the relationships editor (Alternative B from the wireframe) |

After Batch F, every fidelity-1 wireframe has a visual realization. Simpler screens (sign-in, dashboard, list/detail variants that reuse existing primitives) can be assembled directly as routes in `apps/admin` without a dedicated batch.

### Batch A — Foundations

Three PRs land Batch A.

**PR A.1 — Tailwind 4 + tokens setup**

- Install Tailwind 4, `class-variance-authority`, `tailwind-merge` in `packages/ui` and `apps/admin`
- `packages/ui/src/styles/tokens.ts` — TypeScript source-of-truth for colors (zinc + transparent accent placeholders), type scale, spacing, radii
- Build script emits `tokens.css` (CSS variables) and `tailwind-tokens.ts` (theme extension)
- `packages/ui/src/styles/globals.css` imports `tokens.css` and Tailwind base + components + utilities layers
- `apps/admin/app/globals.css` re-imports from `@repo/ui/styles/globals.css`
- Google Fonts loaded via `next/font` in `apps/admin/app/layout.tsx`; `@repo/ui` consumes them via CSS variables
- shadcn CLI initialized in `packages/ui` (`components.json` configured to use our tokens, not stock defaults)
- Validation suite green

**PR A.2 — Storybook 10 + Vite setup**

- `packages/ui/.storybook/` with Vite preset
- `pnpm run storybook` script
- Loads `@repo/ui` global styles so stories render with theme
- First trivial story: shadcn `Button` with custom theme overrides — proves the token pipeline
- Validation suite green

**PR A.3 — Foundations stories**

- `Foundations > Colors` story with zinc neutrals as swatches (copy-to-clipboard for hex), placeholder accent slots
- `Foundations > Typography` story with type specimens at each scale, tabular-figure verification
- `Foundations > Spacing` story showing the ramp visually
- `Foundations > Era treatment` story documenting the (currently empty) era-color slot — to be filled in Batch B
- First commitments to actual hex values, type metrics, and spacing scale

### Batch B — Temporal primitive

Two PRs.

**PR B.1 — `TemporalDisplay` primitive**

- `packages/ui/src/components/temporal-display/` with stories
- Props: `value: TemporalData`, optional `endValue` for ranges, `format?: "inline" | "block" | "compact"`
- Variant matrix in stories: CE / BCE / KYA / MYA / BYA × exact / circa / approximate / estimated / geological × with/without uncertainty
- Era badge treatment committed (color + typographic convention; must satisfy accessibility — not era-color alone)
- Uncertainty treatment committed (italics / hairline range bar / subdued color)
- Tabular numerals enforced for year columns
- Vitest unit tests for `TemporalService.formatDisplay` integration

**PR B.2 — Character detail composite story**

- `Pages > Character Detail` composite story consuming `TemporalDisplay`
- Tests the primitive's layout against narrative text (biography) and structured metadata (temporal scope block)
- Surfaces any token gaps that didn't appear in isolation
- Validation suite green
- Tokens in `tokens.ts` updated with whatever Batch B crystallized

### Batch C — App shell

- `Shell` layout component (sidebar + topbar + breadcrumb + content slot)
- Sidebar collapse state (240 → 64px) wired to the existing `useUiStore` from [#138](https://github.com/shaes-farm/time-traveler/pull/138)
- Topbar: global search trigger, quick-create button, user menu (lucide icons)
- Breadcrumb derives from route segments
- Status-badge primitive: Published (✓ + green), Draft (─ + zinc), Shared (⇄ + blue) per PRD §7.11.5
- Composite story for the shell + a dashboard-like content slot

### Batch D — List primitives

- `DataTable` wrapping shadcn `Table` + tanstack-table; row virtualization for events list
- `FilterRail` — left-rail layout with grouped checkbox sets, range sliders, 3-state radios
- Row-layout patterns from wireframes: multi-line rows, era + uncertainty inline, importance as right-aligned tabular number
- Composite stories: `Pages > Characters List`, `Pages > Events List`
- Per the [wireframe decisions](02-wireframes/03-characters-list.md): hover-card thumbnails (no dedicated thumbnail column), labels-only filter chips this fidelity, no card view (per [#127](https://github.com/shaes-farm/time-traveler/issues/127))

### Batch E — Editor primitives

- `ChipInput` for `TEXT[]` fields (aliases, cultural_context, characteristics, tags)
- `SlugField` with locked-by-default + manual unlock + warning per Batch 1 decision
- `TemporalInput` composite popover (era picker, year/month/day, precision, uncertainty) using `TemporalDisplay` for the trigger button preview
- `SaveDropdown` with curated-set "Save and add another" per Batch 5 decision
- Auto-save toolbar indicator ("Draft saved at H:MM PM") per [#127](https://github.com/shaes-farm/time-traveler/issues/127) reconciliation
- Composite stories: `Pages > Character Editor`, `Pages > Event Editor`

### Batch F — Relationship editor

- Card stream layout with type-grouped sections (Family / Professional / Social-personal / Antagonistic / Asymmetric)
- Sub-role picker per the [#119](https://github.com/shaes-farm/time-traveler/issues/119) taxonomy — three sub-roled types reveal an inline sub-role selector
- Add-relationship sheet (right-side slide-out) with reciprocity-aware semantics
- Contradiction warning surface
- Composite story: `Pages > Relationships Editor`
- This is the highest-stakes screen visually; budget for iteration

## Verification per batch

- All Storybook stories build and render without console errors
- Vitest unit tests on every primitive (props, accessibility roles, keyboard interactions where applicable)
- Validation suite green: `pnpm run format:check`, `check-types`, `lint`, `build`, `test:coverage`
- A composite story or screen mockup consuming the new primitives in real layout context
- Tokens in `tokens.ts` only contain values that an active primitive consumes — no speculative token sprawl

Visual regression testing is deferred. Worth revisiting after Batch C lands if drift becomes a problem.

## Risks

- **Token rework risk.** Tokens picked in Batch B may need refactoring once Batch C tests them at a different scale. Mitigation: keep Batch A's initial token set deliberately minimal; only commit values the active primitive demands.
- **Tailwind 4 + Storybook 10 compatibility.** Both are current majors. Worth confirming the Vite preset works with Tailwind 4's CSS-first config before installation. Fallback: Tailwind 3 + Storybook 9 is the conservative pairing.
- **Next.js 16 + Storybook Vite preset.** Storybook's Next.js preset has historically lagged behind Next major releases. The Vite preset is more reliable but means primitives can't use Next-specific APIs (`next/image`, `next/link`) inside stories. Mitigation: primitives stay framework-agnostic; `apps/admin` route code wraps them in Next-specific adapters when needed.
- **Google Fonts substitution drift.** Instrument Serif and Inter Tight are credible substitutes but visually distinct from the licensed picks (GT Sectra, Söhne) named in aesthetic notes. The system may need refactoring when licensed picks land. Mitigation: typeface tokens are abstract (`--font-display`, `--font-body`, `--font-mono`); only the CSS `@font-face` rules and the Google-Fonts loader change when faces are swapped.
- **Scope creep on the relationship editor.** Batch F is the most ambiguous batch — card stream, sub-role taxonomy, reciprocity all converge. Budget for two passes. If Batch F runs long, the carve-out is to ship the basic card stream first and defer the sub-role picker + add sheet to a B follow-up batch.

## Open questions to revisit during the work

These don't block Batch A but will need answers as later batches progress:

- **Per-era color decisions.** Specific hue + saturation per CE / BCE / KYA / MYA / BYA. Must satisfy red-green colorblindness accessibility per aesthetic notes. Decide during Batch B.
- **Importance gradient.** 1–10 importance and 4-level significance both lean toward sequential single-hue scales. Specific hue + lightness ramp decided during Batch D when the events list surfaces importance prominently.
- **Visual range bar.** Triggered rendering rule decided in [Batch 4](02-wireframes/08-event-detail.md) (uncertainty > 100 yr OR range > 1000 yr OR spans era boundary). Visual treatment — hairline, gradient, solid — decided during Batch B or D depending on which primitive surfaces it first.
- **Sidebar collapse persistence.** The `useUiStore` from [#138](https://github.com/shaes-farm/time-traveler/pull/138) already supports it; UX decision is whether collapse is per-tab or cross-tab (localStorage scope). Decide during Batch C.
- **Empty-state illustrations.** Deferred in aesthetic notes; may be decided ad-hoc during list batches or stay as plain-text empty states throughout fidelity-2.
- **Visual regression testing.** Deferred; revisit after Batch C lands.

## Cross-references

- Fidelity-1 wireframes: [`02-wireframes/`](02-wireframes/)
- Design-review decisions log: [`00-screen-inventory.md`](00-screen-inventory.md) "Conventions decided" and "Decisions resolved" sections
- Aesthetic-notes parking lot: [`03-aesthetic-notes.md`](03-aesthetic-notes.md)
- Follow-up issues: [#119](https://github.com/shaes-farm/time-traveler/issues/119) (open), [#125](https://github.com/shaes-farm/time-traveler/issues/125) (closed by #133), [#127](https://github.com/shaes-farm/time-traveler/issues/127) (closed by #135)
- Existing client state: `packages/ui/src/stores/` (Zustand stores from #138)
