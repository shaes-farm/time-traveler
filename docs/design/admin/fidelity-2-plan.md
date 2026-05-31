# Fidelity-2 Implementation Plan

Status: draft 2 — reordered to close foundational issues before the temporal primitive  
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
3. A working app shell + auth flows so the admin app stops being Turborepo boilerplate
4. Composite Storybook mockups for every wireframed screen
5. Production-ready route stubs in `apps/admin` that consume the design system

The fidelity-1 design review filed three follow-up issues; all are resolved or open with concrete proposals. The wireframes are stable; this plan implements them.

## Issue tracking

The original fidelity-2 outline didn't reference the foundational GitHub issues that gate the admin app's bootstrap. This revision aligns each batch with the open issues it closes, so the work shows up against the project plan and doesn't grow a parallel paper trail.

| Batch                                              | Closes / advances                                                                                                                                                                                                                                                                                                    | Status      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **[A](#batch-a--foundations)**                     | [#37](https://github.com/shaes-farm/time-traveler/issues/37) (shadcn + Tailwind theme)                                                                                                                                                                                                                               | done        |
| **[B](#batch-b--app-shell)**                       | [#38](https://github.com/shaes-farm/time-traveler/issues/38) (app shell + route groups + sidebar/header)                                                                                                                                                                                                             | done        |
| **[C](#batch-c--auth-infrastructure)**             | [#35](https://github.com/shaes-farm/time-traveler/issues/35) (Supabase Auth), [#36](https://github.com/shaes-farm/time-traveler/issues/36) (`proxy.ts` route protection)                                                                                                                                             | done        |
| **[D](#batch-d--auth-ui)**                         | [#39](https://github.com/shaes-farm/time-traveler/issues/39) (login, register, magic link, password reset)                                                                                                                                                                                                           | done        |
| **[E](#batch-e--temporal-primitive)**              | originally Batch B; reads against PRD §4 / system-design §4                                                                                                                                                                                                                                                          | done        |
| **[F](#batch-f--list-primitives)**                 | originally Batch D                                                                                                                                                                                                                                                                                                   | done        |
| **[G](#batch-g--editor-primitives)**               | [#40](https://github.com/shaes-farm/time-traveler/issues/40) (TemporalInput/editor primitives + docs refresh)                                                                                                                                                                                                        | done        |
| **[H](#batch-h--relationship-editor)**             | originally Batch F; finishes the [#119](https://github.com/shaes-farm/time-traveler/issues/119) UX                                                                                                                                                                                                                   | done        |
| **[I](#batch-i--media-library--picker)**           | [#49](https://github.com/shaes-farm/time-traveler/issues/49) follow-up (cross-entity media library + reusable picker, screen 17)                                                                                                                                                                                     | planned     |
| **[J](#batch-j--visual-language-finalization)**    | finalizes the deferred visual-design language (era palette reconciliation, character-type identity, treatments) per [03-aesthetic-notes.md](03-aesthetic-notes.md)                                                                                                                                                   | planned     |
| **[K](#batch-k--timeline-surfaces--fractal-tree)** | [#42](https://github.com/shaes-farm/time-traveler/issues/42), [#43](https://github.com/shaes-farm/time-traveler/issues/43), [#44](https://github.com/shaes-farm/time-traveler/issues/44), [#47](https://github.com/shaes-farm/time-traveler/issues/47) (timeline list/editor/detail + event detail + bespoke `Tree`) | in progress |
| **[L](#batch-l--publish-workflow--collaborators)** | [#48](https://github.com/shaes-farm/time-traveler/issues/48) (publish/unpublish), [#50](https://github.com/shaes-farm/time-traveler/issues/50) (collaborator management)                                                                                                                                             | in progress |

> **Note on K/L (added after the original A–J plan).** The timeline-specific screens (11–16) were added to the [screen inventory](00-screen-inventory.md#milestone-5-additions) in the M5 design pass _after_ this plan was drafted, so the original "after Batch H, every fidelity-1 wireframe has a visual realization" claim (in [Batch H](#batch-h--relationship-editor)) predated them. Batches K and L close that gap for the Phase-4 (GitHub milestone 5) timeline & event surfaces; Batch I (media) remains the third Phase-4 surface.

Why app shell + auth before the temporal primitive: the TemporalDisplay primitive is the highest-leverage component visually, but every later batch (lists, editors, relationships) renders inside the protected shell. Building the chrome first means later composite stories can mount their primitives in a real shell context instead of a Storybook-only frame, and the auth + proxy work unblocks any future "go look at the running admin app" verification step. The TemporalDisplay still lands before list/editor work, which is where it actually gets consumed.

## Locked-in stack

Decisions captured before execution begins:

| Decision            | Pick                                                                                                       | Rationale                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS framework       | **Tailwind 4** in `packages/ui` and `apps/admin`                                                           | shadcn implies Tailwind; CSS-first config (no `tailwind.config.js`); existing CSS Modules code stays where it makes sense (route-level layout)                                                       |
| Component workbench | **Storybook 10 + Vite preset** in `packages/ui`                                                            | Vite is lighter than the Next.js preset; pairs with existing Vitest tooling. Primitives stay framework-agnostic                                                                                      |
| Token system        | **TypeScript source-of-truth** (`tokens.ts`) hand-synced with the Tailwind 4 `@theme` block (`tokens.css`) | Single conceptual source; the two files are tiny and a build-step indirection isn't worth the complexity until they diverge                                                                          |
| Icons               | **lucide-react**                                                                                           | shadcn's default; free, neutral, comprehensive                                                                                                                                                       |
| Color base          | **Tailwind zinc neutrals (OKLCH)**; accents defer to Batch E                                               | Lets the temporal primitive drive accent decisions. Diverges from #37's "warm tones" — flagged in the PR closing that issue                                                                          |
| Dark mode strategy  | **`color-scheme: dark` default**, no light-mode toggle in fidelity-2                                       | Aesthetic notes commit dark-default; deferring a class-based light toggle keeps the token surface small. Diverges from #37 — flagged                                                                 |
| Display typeface    | **Fraunces** (Google Fonts)                                                                                | Standing in for the licensed GT Sectra listed in aesthetic notes. Variable serif with editorial character; single 400 weight to start, wght / SOFT / opsz axes available when a primitive needs them |
| Body typeface       | **Inter Tight** (Google Fonts)                                                                             | Acknowledged "slop-tier" but acceptable per aesthetic notes when licensed alternatives are out of budget. Tabular numerals verified                                                                  |
| Mono typeface       | **JetBrains Mono** (Google Fonts)                                                                          | Per aesthetic notes; for IDs, slugs, JSONB previews                                                                                                                                                  |
| Bespoke primitives  | **Tree only** per [aesthetic notes](03-aesthetic-notes.md) — every other primitive comes from shadcn       | DataTable uses tanstack-table + shadcn `Table` markup                                                                                                                                                |
| shadcn location     | **`packages/ui`**, not `apps/admin`                                                                        | Monorepo-correct: primitives are shared infrastructure. Diverges from #37's "init in `apps/admin`" instruction — flagged                                                                             |

## Where things live

| Concern                                   | Location                                                                 | Notes                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Design primitives (shadcn + custom theme) | `packages/ui/src/components/`                                            | Exported via `@repo/ui/components/*`                           |
| Design tokens                             | `packages/ui/src/styles/tokens.ts` + `packages/ui/src/styles/tokens.css` | TS + CSS hand-synced; small enough to live without codegen     |
| Storybook                                 | `packages/ui/.storybook/`                                                | Runs via `pnpm run storybook` in `packages/ui`                 |
| Stories                                   | colocated next to components (`*.stories.tsx`)                           | Same workspace, same lint/check-types rules                    |
| Composite "page" mockups                  | Storybook composite stories under a `Pages > *` hierarchy                | Real route counterparts ship later in `apps/admin`             |
| App shell + route groups                  | `apps/admin/app/{(public),(protected),(admin),auth}/`                    | Consume `@repo/ui` primitives                                  |
| Auth utilities                            | `apps/admin/lib/auth/` + `apps/admin/proxy.ts`                           | `@supabase/ssr` clients, callback route, route-protection gate |

Mockup screens that don't yet have a production route live as Storybook composite stories. When a screen graduates to interactive/data-driven, the route moves to `apps/admin` and the composite story stays as a visual snapshot.

## Aesthetic principles applied throughout

These pull from [`03-aesthetic-notes.md`](03-aesthetic-notes.md) and apply to every batch unless an individual batch overrides:

- **Density and speed over delight.** Genre is Notion/Linear/Sanity, not Awwwards. No scroll-driven animation, no custom cursors, no magnetic buttons.
- **Dark mode is the default and the only mode in fidelity-2.** A class-based light-mode toggle is deferred.
- **Tables before cards.** Cards only when a single visual element (face, image) dominates.
- **Era + precision wherever a date appears.** TemporalDisplay enforces this; non-temporal screens still respect it for character birth/death and event dates.
- **Tabular figures mandatory** wherever numbers align (years, importance, counts).
- **No purple gradients.** Explicit anti-pattern from `frontend-design` skill guidance.
- **Era and status differentiate via hue, not saturation alone.** Must satisfy red-green colorblindness; tested before committing era hues in Batch E.
- **Motion serves affordance.** Sheet/dialog entrances 150–200ms ease-out. Destructive confirms feel weighty, not jumpy.

## Batches

Each batch ends with a reviewable visual deliverable. Each depends only on the previous.

### Batch A — Foundations

Closes [#37](https://github.com/shaes-farm/time-traveler/issues/37). Three PRs land Batch A.

**PR A.1 — Tailwind 4 + tokens setup** ✅ landed in [#149](https://github.com/shaes-farm/time-traveler/pull/149)

- Tailwind 4 installed in `packages/ui` and `apps/admin`
- `class-variance-authority`, `tailwind-merge`, `clsx`, `lucide-react` installed
- `packages/ui/src/styles/tokens.ts` — TS source-of-truth (zinc OKLCH + font + radius tokens)
- `packages/ui/src/styles/tokens.css` — Tailwind 4 `@theme` block (hand-synced from `tokens.ts`)
- `packages/ui/src/styles/globals.css` — entry point; sets `color-scheme: dark`, body defaults, font-feature-settings for tabular numerals
- `apps/admin/app/globals.css` re-imports `@repo/ui/styles/globals.css`
- Google Fonts loaded via `next/font` in `apps/admin/app/layout.tsx`, bound to `--font-instrument-serif` / `--font-inter-tight` / `--font-jetbrains-mono`
- `components.json` configured in `packages/ui` (not `apps/admin`) — aliases point at `@repo/ui/components`, `@repo/ui/lib/utils`

**PR A.2 — Storybook 10 + Vite + first shadcn-style primitive** ✅ landed in [#150](https://github.com/shaes-farm/time-traveler/pull/150)

- `packages/ui/.storybook/` with `@storybook/react-vite` framework (Storybook 10 ships docs/controls/actions in core — no addons needed)
- `pnpm run storybook` and `pnpm run build-storybook` scripts
- Preview loads `@repo/ui` global styles and Google Fonts CDN import so stories render with theme
- First shadcn-style primitive: `Button` with cva variants (primary / secondary / ghost × sm / md / lg), forwarding ref, `cn()` helper
- Vitest tests for the Button (variants, sizes, ref, disabled, onClick)
- `storybook-static/` added to `.gitignore` and to ESLint ignores

**PR A.3 — shadcn primitives + Foundations stories** ✅ landed in [#151](https://github.com/shaes-farm/time-traveler/pull/151)

- Install the shadcn primitives the next four batches consume, into `packages/ui/src/components/`:
  - **App shell (Batch B):** `separator`, `scroll-area`, `sheet`, `tabs`, `avatar`, `tooltip`, `dropdown-menu`, `breadcrumb`, `command`
  - **Auth UI (Batch D):** `input`, `label`, `form`, `card`, `sonner` (replacement for legacy `toast`)
  - **Common across many surfaces:** `badge`, `alert`, `dialog`, `skeleton`, `popover`
  - Deferred until consumers exist: `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `progress`, `navigation-menu`, `table`, `hover-card`
- Radix UI peer dependencies pulled in by the shadcn CLI
- All primitives pass through `tokens.css` — no stock shadcn defaults survive
- `Foundations > Colors` story with zinc OKLCH swatches (copy-to-clipboard for the CSS variable name), placeholder accent slots stubbed (era hues, status, importance) — values fill in Batch E
- `Foundations > Typography` story with type specimens at each scale, tabular-figure verification at 14/16/18px
- `Foundations > Spacing` story showing the ramp visually
- Each new primitive ships a minimal `*.stories.tsx` covering default + the variants the wireframes call for
- PR description flags the divergences from #37: shadcn lives in `packages/ui` (not `apps/admin`); zinc neutrals (not warm tones — warmth, if any, comes via era accents in Batch E); dark-mode-default via `color-scheme` (no class-based toggle this batch)

### Batch B — App shell ✅ landed in [#153](https://github.com/shaes-farm/time-traveler/pull/153)

Closes [#38](https://github.com/shaes-farm/time-traveler/issues/38).

- Route group scaffolding in `apps/admin/app/`:

  ```text
  app/
  ├── layout.tsx               # root: providers + font variables on <html>
  ├── (public)/
  │   └── timelines/[slug]/page.tsx     # placeholder
  ├── (protected)/
  │   ├── layout.tsx                    # Shell layout
  │   ├── dashboard/page.tsx            # placeholder
  │   ├── timelines/page.tsx            # placeholder
  │   ├── events/page.tsx               # placeholder
  │   ├── characters/page.tsx           # placeholder
  │   ├── periods/page.tsx              # placeholder
  │   ├── stories/page.tsx              # placeholder
  │   ├── categories/page.tsx           # placeholder
  │   └── media/page.tsx                # placeholder
  ├── (admin)/
  │   └── layout.tsx                    # admin gate (cooperates with #36 proxy)
  └── not-found.tsx
  ```

- `Shell` layout (sidebar + topbar + breadcrumb + content slot) — lives in `packages/ui/src/components/shell/` so the composite stories in Batch E–H can mount the same chrome
- Scope: **chrome only**. Every protected route ships a minimal placeholder page (heading + sub copy + a few Skeleton stand-ins). #38's acceptance criteria tick via navigation + collapse + responsive behavior; real content lands in later batches.
- Sidebar: 240/64 collapsed per [#127](https://github.com/shaes-farm/time-traveler/issues/127); active-route highlighting; user avatar + sign-out at the bottom; collapsed state wired to `useUiStore` from [#138](https://github.com/shaes-farm/time-traveler/pull/138), **persisted to `localStorage` cross-tab** so the preference survives reload
- Topbar:
  - Global search trigger (`⌘K`, opens shadcn `command`)
  - Quick-create button: dropdown listing all 8 entity types (Character / Event / Period / Story / Timeline / Category / Media / Relationship); each item links to `/<entity>/new` (currently 404-stubbed; route integration is tracked outside Batch G)
  - User menu: **placeholder user** (hardcoded avatar fallback + name + email), inert menu items (Profile / Settings / Sign out) — visible but non-functional in Batch B. Wired to real auth in Batch C/D
- Breadcrumb derives from route segments
- Mobile: sidebar collapses into a `sheet`
- Providers component (`components/providers.tsx`): TanStack Query, future ThemeProvider hook (dark-only for now), Zustand bridging if needed
- Status-badge primitive lands here: Published (✓ + green), Draft (─ + zinc), Shared (⇄ + blue) per PRD §7.11.5 — used in placeholder pages so the chrome doesn't read empty
- Composite Storybook story: `Pages > Shell` with a dashboard-like content slot

### Batch C — Auth infrastructure ✅ landed in [#154](https://github.com/shaes-farm/time-traveler/pull/154)

Closes [#35](https://github.com/shaes-farm/time-traveler/issues/35) and [#36](https://github.com/shaes-farm/time-traveler/issues/36). Headless plumbing; no UI in this batch (Batch D consumes it).

- `apps/admin/lib/auth/` utilities backed by `@supabase/ssr`:
  - `createBrowserClient()` / `createServerClient()`
  - `signUp` / `signIn` / `signInWithMagicLink` / `signOut`
  - `resetPassword` / `updatePassword`
  - `getSession()` / `getUser()` (server-only)
- `apps/admin/app/auth/callback/route.ts` — exchanges the code from magic-link / password-reset emails for a session
- `apps/admin/proxy.ts` — route protection gates (Next.js 16 renamed `middleware.ts` → `proxy.ts`; #36's title predates the rename):
  - `/auth/*` → public; redirects to `/dashboard` if already authenticated
  - `(public)/*` → public
  - `(protected)/*` → requires session, redirects to `/auth/login`
  - `(admin)/*` → requires session **and** `profiles.role = 'admin'` — note the schema column is `role`, not `is_admin = true` as #36's text says; closing PR will flag the issue-vs-code mismatch
  - Session-cookie refresh on every request

**Shell user wiring.** `(protected)/layout.tsx` becomes async, calls `getUser()` from `lib/auth/` server-side, and passes the user to `<Shell user={...}>`. Sign-out is a Server Action wired to the user menu via `onSignOut`. No client-side auth context provider in Batch C — Server Components are SSR-friendly and the design-for-extraction note keeps `lib/auth/` Next-agnostic.

**Server Actions, not client SDK calls.** All write-side auth methods (`signIn`, `signUp`, `signInWithMagicLink`, `signOut`, `resetPassword`, `updatePassword`) ship as plain async functions in `lib/auth/` and as thin Server Action wrappers in `app/auth/_actions/` that Batch D's forms post to. Server-side cookie setting means SSR + proxy see the new session on the next request without a manual `router.refresh()`. The reader app can wrap the same `lib/auth/` functions with whatever submission pattern it prefers.

**(admin) stays structural.** `(admin)/layout.tsx` enforces the `role = 'admin'` gate (verified end-to-end via a placeholder protected stub the layout points at). No admin-specific pages in this batch — that's product surface a later batch designs intentionally.

**Email confirmation flow uses Inbucket.** Local Supabase keeps email confirmation on; Inbucket (the local SMTP catcher Supabase ships) receives the confirmation emails. Smoke-test plan exercises the full round-trip: register → check Inbucket → click confirm link → callback route exchanges code → session usable.

- Supabase project dashboard configured: email/password and magic-link providers, custom email templates, redirect URLs for localhost + production
- Profile auto-creation trigger (#16) verified end-to-end against this flow — already lives in `00004_is_admin_and_profile_trigger.sql`
- `apps/admin/.env.local` set up by the developer (gitignored); mirrors `.env.local.example` at the repo root. Next.js reads from the app's directory, not the repo root
- Manual smoke-test plan in the PR description: register → confirm via Inbucket → sign in → sign out → magic link → password reset → admin gate

**Design for extraction.** A future public reader app (D3-based, deferred) will need the same auth surface. To keep that lift mechanical instead of a rewrite, structure `apps/admin/lib/auth/` so the core stays Next-agnostic — auth methods (`signIn`, `signUp`, `signInWithMagicLink`, `resetPassword`, `updatePassword`, `signOut`) and the client factories accept cookie-adapter callbacks rather than calling `cookies()` directly, and route-protection logic accepts an abstract "redirect on unauthenticated" callback. Confine `next/server`, `next/headers`, and `next/navigation` imports to `proxy.ts`, the auth callback route handler, and the page-level Server Actions that call into `lib/auth/`. When the reader app starts and a second consumer materializes, the move to `packages/auth` becomes a copy + rename of `lib/auth/`, plus reproducing the thin Next-specific wrappers in each consumer.

### Batch D — Auth UI ✅ landed in [#157](https://github.com/shaes-farm/time-traveler/pull/157)

Closes [#39](https://github.com/shaes-farm/time-traveler/issues/39).

- `AuthLayout` shared component (centered card, no sidebar/header) — lives in `apps/admin/app/auth/layout.tsx`
- `AuthForm` wrapper handling loading + error state, using `react-hook-form` + `@hookform/resolvers` with Zod schemas
- Pages:
  - `app/auth/login/page.tsx` — email/password + "Sign in with magic link" alternative + "Forgot password?" + "Register" links
  - `app/auth/register/page.tsx` — email + password + confirm + display name; success screen "Check your email for confirmation"
  - `app/auth/magic-link/page.tsx` — email-only; success screen "Check your email for sign-in link"
  - `app/auth/reset-password/page.tsx` — email-only request form
  - `app/auth/update-password/page.tsx` — new password + confirm, accessible from reset email
- Form validation with clear inline errors; aesthetic notes say errors should explain, not just decorate
- Loading states on every submit button
- Redirect to `/dashboard` on successful auth, honoring `?redirect=` if the proxy sent the user here
- Storybook composite story: `Pages > Auth > Login` and the four siblings, so the visual surface is reviewable without spinning up Supabase

### Batch E — Temporal primitive

Originally Batch B. Two PRs.

**PR E.1 — `TemporalDisplay` primitive** ✅ landed in [#158](https://github.com/shaes-farm/time-traveler/pull/158)

- `packages/ui/src/components/temporal-display/` with stories
- Props: `value: TemporalData`, optional `endValue` for ranges, `format?: "inline" | "block" | "compact"`
- Variant matrix in stories: CE / BCE / KYA / MYA / BYA × exact / circa / approximate / estimated / geological × with/without uncertainty
- Era badge treatment committed (color + typographic convention; must satisfy accessibility — not era-color alone)
- Uncertainty treatment committed (italics / hairline range bar / subdued color)
- Tabular numerals enforced for year columns
- Vitest unit tests for `TemporalService.formatDisplay` integration

**PR E.2 — Character detail composite story** ✅ landed in [#159](https://github.com/shaes-farm/time-traveler/pull/159)

- `packages/ui/src/components/character-detail.stories.tsx`
- `Pages > Character Detail` composite story (3 variants: Overview / Loading / PrehistoricCharacter) mounting the Shell from Batch B and consuming `TemporalDisplay` in two roles: compact span in the identity header, block format with `showExact` in the Temporal scope section
- Demonstrates adaptive empty-state rendering (no bio, no physical description, no death date)
- Token findings from E.2: era hues and surface/foreground tokens cover all needs; no new tokens required. Two deferred items crystallized:
  - **`Button` destructive variant** — implemented in Batch G (`button.tsx`) for delete-confirm surfaces
  - **Importance gradient tokens** (1–10 single-hue scale) — implemented in Batch F list surfaces

### Batch F — List primitives ✅ landed in [#160](https://github.com/shaes-farm/time-traveler/pull/160)

Originally Batch D.

- `DataTable` wrapping shadcn `Table` + tanstack-table; row virtualization for events list
- `FilterRail` — left-rail layout with grouped checkbox sets, range sliders, 3-state radios
- Row-layout patterns from wireframes: multi-line rows, era + uncertainty inline, importance as right-aligned tabular number
- Composite stories: `Pages > Characters List`, `Pages > Events List` (mounted in the Shell)
- Per the [wireframe decisions](02-wireframes/03-characters-list.md): hover-card thumbnails (no dedicated thumbnail column), labels-only filter chips this fidelity, no card view (per [#127](https://github.com/shaes-farm/time-traveler/issues/127))

### Batch G — Editor primitives ✅ landed in [#161](https://github.com/shaes-farm/time-traveler/pull/161)

Originally Batch E.

This batch tracks the refreshed scope from [#40](https://github.com/shaes-farm/time-traveler/issues/40) as an editor-primitives/documentation batch centered on `TemporalInput` and related editor controls. Route integration is intentionally excluded from Batch G and tracked separately.

- `ChipInput` for `TEXT[]` fields (aliases, cultural_context, characteristics, tags)
- `SlugField` with locked-by-default + manual unlock + warning per Batch 1 decision
- `TemporalInput` composite popover (era picker, year/month/day, precision, uncertainty) using `TemporalDisplay` for the trigger button preview
- `SaveDropdown` with curated-set "Save and add another" per Batch 5 decision
- Auto-save toolbar indicator ("Draft saved at H:MM PM") per [#127](https://github.com/shaes-farm/time-traveler/issues/127) reconciliation
- Composite stories: `Pages > Character Editor`, `Pages > Event Editor`
- Supporting stories added for newly landed primitives consumed by editor/list surfaces: `Textarea`, `Checkbox`, `Slider`, `Table`, `DataTable`, `FilterRail`

### Batch H — Relationship editor ✅ landed in [#162](https://github.com/shaes-farm/time-traveler/pull/162)

Originally Batch F.

- Card stream layout with type-grouped sections (Family / Professional / Social-personal / Antagonistic / Asymmetric) per the validated card-stream pattern
- Sub-role picker per the [#119](https://github.com/shaes-farm/time-traveler/issues/119) taxonomy — three sub-roled types reveal an inline sub-role selector
- Add-relationship sheet (right-side slide-out) with reciprocity-aware semantics
- Contradiction warning surface
- Composite story: `Pages > Relationships Editor`
- This is the highest-stakes screen visually; budget for iteration

After Batch H, every fidelity-1 wireframe has a visual realization. Simpler screens (sign-in, dashboard, list/detail variants that reuse existing primitives) can be assembled directly as routes in `apps/admin` without a dedicated batch.

### Batch I — Media library & picker

Advances [#49](https://github.com/shaes-farm/time-traveler/issues/49) (the deferred cross-entity browser + reusable picker). Realizes [screen 17](02-wireframes/17-media-library.md) and upgrades the Attach dialog from [screen 15](02-wireframes/15-media-management.md).

- **`MediaPicker` as a shared `packages/ui` primitive (decided up front).** One component, two mount modes selected by a `mode` prop (`"browse"` full-screen library browser vs. `"pick"` modal multi-select picker), per [screen-17 annotation #1](02-wireframes/17-media-library.md#annotations). Mounted by the library route, the Attach dialog's _Existing_ tab, and the character/event editor media sections so all four consume the same grid + facets + card rendering. **Build it first in this batch, before any consumer wires it up**, so the four surfaces can never diverge. It is a composite of shadcn primitives (dialog, command/input, checkbox, scroll-area, card) — **not** bespoke; the only bespoke timeline-era primitive remains `Tree`.
- `MediaGrid` + `MediaCard` (thumbnail, type/kind badge, `⛓ N` attachment-count badge, `⚠` orphan marker) with the by-type preview degradation from [screen 15](02-wireframes/15-media-management.md) annotation #8.
- `MediaFilterRail` reusing the Batch F `FilterRail`: faceted **Type** / **Source** / **Attached-to** (incl. **Orphaned**) groups with counts.
- `MediaDetailDrawer` — edits the `media` row (alt text, caption, slug), lists "Attached to" with per-entity **Detach**, and gates **Delete original** behind a blast-radius confirm computed from the attachment list.
- Attach-dialog **Existing** tab embeds `MediaPicker` in modal mode; the dialog (not the picker) writes the correct junction (`event_media` / `character_media` / `timeline_media`), dedup via composite PK.
- Composite story: `Pages > Media Library` (browser) + a `MediaPicker` modal story.
- **Blocked surfaces:** the **Source** facet + kind badge depend on [#179](https://github.com/shaes-farm/time-traveler/issues/179) (nullable `storage_path` + `source` discriminator). Until it lands, derive kind from `storage_path IS NULL` as a stopgap and mark the facet `provisional`. `// BLOCKED: accurate upload/external split needs #179.`

### Batch J — Visual-language finalization

Turns the [03-aesthetic-notes.md](03-aesthetic-notes.md) § _Visual design language (finalized)_ spec into committed tokens + the type-badge primitive. No new screens; it hardens decisions the earlier batches deferred.

- **Character-type tokens + `CharacterTypeBadge` primitive** — add the 7 `--color-type-*` token slots (slate/green/terracotta/violet/steel/gold/bronze, low-chroma) to `tokens.ts` + `tokens.css`, and a `CharacterTypeBadge` that pairs a lucide-react icon (`User` / `PawPrint` / `Drama` / `BookOpen` / `Building2` / `Sparkles` / `Gem`) with the **always-present** text label. Consumed by characters list, character detail/header, and the type filter chips.
- **Era-palette reconciliation (already done — no action in Batch J)** — PRD §7.2.2 was **rewritten in place** in the Milestone 6 Phase 5 design pass (same PR as this plan update) to match the shipped hue-spread tokens; no separate issue was filed (treated like the [#127](https://github.com/shaes-farm/time-traveler/issues/127) reconciliation — implementation wins, PRD is the doc that moves). Batch J's remaining work is the accessibility gate below; no token value change is required.
- **Significance scale** — confirm `significance` (`low`/`medium`/`high`/`critical`) reuses the Batch F importance amber ramp (`--color-importance-*`); no new tokens.
- **Status + uncertainty** — verify `StatusBadge` (Published/Draft/Shared) and the `TemporalDisplay` uncertainty treatment match the finalized spec; adjust only if drift exists.
- **Accessibility gate:** re-run the red-green colorblind check across era hues + the 7 type tints together (they co-occur in dense rows); icon + label must carry meaning with hue removed.
- Composite story updates: type badges visible in `Pages > Characters List` and `Pages > Character Detail`.

### Batch K — Timeline surfaces + fractal Tree

Closes [#42](https://github.com/shaes-farm/time-traveler/issues/42), [#43](https://github.com/shaes-farm/time-traveler/issues/43), [#44](https://github.com/shaes-farm/time-traveler/issues/44), [#47](https://github.com/shaes-farm/time-traveler/issues/47). Realizes screens [11](02-wireframes/11-timeline-list.md), [12](02-wireframes/12-timeline-editor.md), [13](02-wireframes/13-timeline-detail.md), and [8](02-wireframes/08-event-detail.md).

- **`Tree` primitive** (`packages/ui/src/components/tree.tsx`) — the **only bespoke primitive** (per [aesthetic notes](03-aesthetic-notes.md): "no shadcn primitive for this; custom build"). Accessible (`role="tree"`), keyboard-navigable disclosure tree for the fractal hierarchy (`timeline → events → detail-timeline → …`). Ships with unit tests.
- **`Switch` primitive** (`switch.tsx`) — the A.3-deferred toggle; dependency-free (`<button role="switch">`, no new Radix peer). Consumed by the timeline editor publish toggle and `PublishControl`.
- **`Pages/Timeline List`** (`timeline-list.stories.tsx`, #42) — `FilterRail` (type / visibility / publication / scope) + `DataTable`; two-line title cell with `TemporalDisplay` span + event/collaborator counts; visibility column (icon + always-present label); `StatusBadge` publication column. Defaults to top-level timelines.
- **`Pages/Timeline Editor`** (`timeline-editor.stories.tsx`, #43) — mirrors the event editor: `TemporalInput` start/end span, `SlugField`, `SaveDropdown`, `AutosaveIndicator`, biographical → subject-character field, `RadioGroup` visibility, `Switch` publication. Visibility and publication are **separate controls, never merged**.
- **`Pages/Timeline Detail`** (`timeline-detail.stories.tsx`, #44) — header with publication via `PublishControl` + visibility chip; `Tabs` Events / Periods (read-only stub) / Collaborators (`CollaboratorList`) / Media. Events tab: home/linked badges, dependency-free up/down reordering (no DnD lib added), unlink.
- **`Pages/Event Detail`** (`event-detail.stories.tsx`, #47) — two-column read view; `TemporalDisplay` (header + block); timelines block (Contained-in home/guest, Expands-into, Nearby-in-timeline); `Tabs` Participants / Categories / Media.
- **`// BLOCKED: #177`** — the fractal "Expands into" / "Details the event" / per-row drill-down affordances are gated behind a `FRACTAL_ENABLED` flag (default off) in the timeline-detail and event-detail stories until `events.detail_timeline_id` lands.

### Batch L — Publish workflow + collaborators

Closes [#48](https://github.com/shaes-farm/time-traveler/issues/48), [#50](https://github.com/shaes-farm/time-traveler/issues/50). Realizes screens [16](02-wireframes/16-publish-workflow.md) and [14](02-wireframes/14-collaborators.md).

- **`PublishControl` primitive** (`publish-control.tsx`, #48) — `StatusBadge` + confirm `Dialog` + `Switch`. Flips only `published`; **orthogonal to visibility** (never merged). Owner-only action button via `canPublish`. Consumed by timeline + event detail headers. Unit-tested.
- **`CollaboratorList` primitive** (`collaborator-list.tsx`, #50) — add by `profiles.username`, role select (`viewer`/`editor`/`admin`), remove, with the **owner safeguard** (owner is `timelines.user_id`, rendered as a non-removable footer line). `canManage` gates controls for viewers. Consumed by the timeline detail Collaborators tab. Unit-tested.

### Batch I — Media (Phase-4 status)

Specified in [Batch I](#batch-i--media-library--picker) above; the third Phase-4 surface ([#49](https://github.com/shaes-farm/time-traveler/issues/49)). Not yet implemented. Source facet + kind badge remain **blocked on [#179](https://github.com/shaes-farm/time-traveler/issues/179)** (`storage_path IS NULL` stopgap, facet `provisional`).

## Verification per batch

- All Storybook stories build and render without console errors
- Vitest unit tests on every primitive (props, accessibility roles, keyboard interactions where applicable)
- Validation suite green: `pnpm run format:check`, `check-types`, `lint`, `build`, `test:coverage`
- A composite story or screen mockup consuming the new primitives in real layout context
- Tokens in `tokens.ts` / `tokens.css` only contain values that an active primitive consumes — no speculative token sprawl

Visual regression testing is deferred. Worth revisiting after Batch B lands if drift becomes a problem.

## Risks

- **Token rework risk.** Tokens picked in Batch E may need refactoring once Batch F tests them at a different scale. Mitigation: keep Batch A's initial token set deliberately minimal; only commit values the active primitive demands.
- **Auth-batch dependency on Supabase project config.** Batch C requires the remote Supabase project to have email/password + magic link enabled and email templates approved. If the project's email domain isn't verified, magic links bounce. Mitigation: verify provider config first thing in the batch; fall back to email+password only if magic link setup blocks.
- **Proxy + route group interactions.** Next.js 16 renamed `middleware.ts` to `proxy.ts`; the file still runs on the edge with the same stricter constraints than Node — no `node:` imports, careful with cookies. Mitigation: `@supabase/ssr` is edge-safe; the route-group `matcher` is the load-bearing piece and gets explicit tests. Worth re-reading the Next 16 migration notes before starting Batch C in case the rename came with semantic changes beyond the file name.
- **Tailwind 4 + Storybook 10 compatibility.** Confirmed working in Batches A.1/A.2.
- **Next.js 16 + Storybook Vite preset.** Storybook's Next.js preset has historically lagged behind Next major releases. The Vite preset is more reliable but means primitives can't use Next-specific APIs (`next/image`, `next/link`) inside stories. Mitigation: primitives stay framework-agnostic; `apps/admin` route code wraps them in Next-specific adapters when needed.
- **Google Fonts substitution drift.** Instrument Serif and Inter Tight are credible substitutes but visually distinct from the licensed picks (GT Sectra, Söhne) named in aesthetic notes. The system may need refactoring when licensed picks land. Mitigation: typeface tokens are abstract (`--font-display`, `--font-body`, `--font-mono`); only the CSS `@font-face` rules and the Google-Fonts loader change when faces are swapped.
- **Scope creep on the relationship editor.** Batch H is the most ambiguous batch — card stream, sub-role taxonomy, reciprocity all converge. Budget for two passes. If Batch H runs long, the carve-out is to ship the basic card stream first and defer the sub-role picker + add sheet to a follow-up batch.

## Open questions to revisit during the work

These don't block Batch A but will need answers as later batches progress:

- **Per-era color decisions.** Specific hue + saturation per CE / BCE / KYA / MYA / BYA. Must satisfy red-green colorblindness accessibility per aesthetic notes. Decide during Batch E.
- **Importance gradient.** 1–10 importance and 4-level significance both lean toward sequential single-hue scales. Specific hue + lightness ramp decided during Batch F when the events list surfaces importance prominently.
- **Visual range bar.** Triggered rendering rule decided in [Batch 4](02-wireframes/08-event-detail.md) (uncertainty > 100 yr OR range > 1000 yr OR spans era boundary). Visual treatment — hairline, gradient, solid — decided during Batch E or F depending on which primitive surfaces it first.
- **Sidebar collapse persistence.** The `useUiStore` from [#138](https://github.com/shaes-farm/time-traveler/pull/138) already supports it; UX decision is whether collapse is per-tab or cross-tab (localStorage scope). Decide during Batch B.
- **Light-mode toggle.** Deferred from fidelity-2 to keep the token surface small. Revisit only if a user-research signal demands it.
- **Empty-state illustrations.** Deferred in aesthetic notes; may be decided ad-hoc during list batches (Batch F) or stay as plain-text empty states throughout fidelity-2.
- **Visual regression testing.** Deferred; revisit after Batch B lands.

## Cross-references

- Fidelity-1 wireframes: [`02-wireframes/`](02-wireframes/)
- Design-review decisions log: [`00-screen-inventory.md`](00-screen-inventory.md) "Conventions decided" and "Decisions resolved" sections
- Aesthetic-notes parking lot: [`03-aesthetic-notes.md`](03-aesthetic-notes.md)
- Follow-up issues: [#119](https://github.com/shaes-farm/time-traveler/issues/119) (open), [#125](https://github.com/shaes-farm/time-traveler/issues/125) (closed by #133), [#127](https://github.com/shaes-farm/time-traveler/issues/127) (closed by #135)
- Foundational app-bootstrap issues this plan closes: [#35](https://github.com/shaes-farm/time-traveler/issues/35), [#36](https://github.com/shaes-farm/time-traveler/issues/36), [#37](https://github.com/shaes-farm/time-traveler/issues/37), [#38](https://github.com/shaes-farm/time-traveler/issues/38), [#39](https://github.com/shaes-farm/time-traveler/issues/39)
- Existing client state: `packages/ui/src/stores/` (Zustand stores from #138)
