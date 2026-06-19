# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

**Time Traveler** is a temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time — Big Bang through the speculative future. Distinguishing features:

- **Fractal timelines** — nested zoomable temporal hierarchy.
- **Hybrid temporal system** — JSONB-encoded dates extend beyond SQL date limits to handle prehistoric/geological/cosmological dates, with precision metadata and uncertainty ranges. See `docs/system-design.md` §4 for the era conversion formula used by all `sort_order` generated columns.
- **Seven character types** — Human, Animal, Mythological, Fictional, Organization, Divine, Artifact — with temporally-scoped relationships and event participation.

**Current state:** The Supabase layer is mature (19 numbered migrations + pgTAP tests). `apps/admin` is under active feature development — auth, the app shell, dashboard, list pages (timelines, characters, events, periods, stories, categories, media), and the timeline create/edit editor — backed by `@repo/services` (nine service modules + Zod schemas) and `@repo/ui` (TanStack Query hooks, a Zustand store, shadcn/ui primitives). The public-facing reader is comprehensively designed (UX/IA/motion/accessibility specs in `docs/design/public/`) and will live in a dedicated `apps/reader` Next.js app per [ADR-0030](docs/adr/adr-0030-public-reader-app-placement.md). All 32 load-bearing architectural decisions are documented in `docs/adr/` (retroactive 0001–0027 recorded May 2026; forward decisions 0028 onward). `apps/docs` is still Turborepo boilerplate.

## Repository Layout

pnpm monorepo orchestrated by Turborepo. Workspaces: `apps/*`, `packages/*`.

- `apps/admin` — Next.js 16 admin app (port 3000). Package name is `admin`.
- `apps/docs` — Next.js 16 docs app (port 3001). Package name is `docs`.
- `apps/reader` — Next.js 16 public reader app (port 3002). Package name is `reader`. Anonymous, read-only, dedicated app per [ADR-0030](docs/adr/adr-0030-public-reader-app-placement.md) — **not yet scaffolded** (tracked in #254).
- `packages/ui` — `@repo/ui` shared React components (shadcn/ui-based). Import components as `@repo/ui/components/button`, `@repo/ui/components/card`, etc.; TanStack Query hooks via `@repo/ui/hooks/*`; the Zustand store via `@repo/ui/stores` (subpath exports — see `packages/ui/package.json`).
- `packages/services` — `@repo/services` Supabase clients, Zod schemas (`@repo/services/schemas/*`), and service modules (`@repo/services/<entity>-service`). Wildcard subpath exports (`./*` → `src/*.ts`).
- `packages/eslint-config` — `@repo/eslint-config` (`base`, `next-js`, `react-internal`).
- `packages/typescript-config` — `@repo/typescript-config` (`base.json`, `nextjs.json`, `react-library.json`).
- `supabase/migrations` — numbered SQL migrations. Migration `00001_initial_schema.sql` defines core tables (profiles, characters, …); `00002_relationships_junctions.sql` defines `character_relationships` and 11 junction tables.
- `docs/prd/PRD-0001-time-traveler-system.md` and `docs/system-design.md` are the authoritative references for feature/schema work.
- `docs/design/admin/` contains the fidelity-1 wireframes for the admin app (IA + interaction spec for characters, events, and relationships editor). When doing UI work in `apps/admin`, read alongside PRD §7.11 (divergences tracked in #127).
- `docs/design/public/` contains the complete design spec for the public-facing reader: UX principles, wireframes, mid-fidelity designs, interaction spec, motion tokens, and accessibility spec. This design gates implementation tickets #65–#69.
- `docs/adr/` contains all 32 load-bearing architectural decisions. See [`docs/adr/README.md`](docs/adr/README.md) for the index; decisions 0001–0027 were retroactively documented in May 2026, and forward decisions (0028 onward) are added as decisions are made.
- CI runs on GitHub Actions (`.github/workflows/ci.yml`): format, lint, type-check, build, and test on every push/PR; these are required checks on `main`.

## Toolchain

- **Node ≥24** (`.nvmrc` pins v24)
- **pnpm 11.2.2** (declared in `package.json` `packageManager`)
- **Turborepo 2.9.16**, **TypeScript 6.0.3**, **Next.js 16.2.x**, **React 19.2.x**
- **Supabase CLI** ^2.101.0 — local stack runs Postgres 17

## Commands

```bash
pnpm install              # bootstrap; run after dependency changes
pnpm run build            # turbo run build across all packages/apps
pnpm run lint             # ESLint with --max-warnings 0 (warnings fail)
pnpm run check-types      # next typegen && tsc --noEmit in each Next app, tsc --noEmit in packages/ui and packages/services
pnpm run test             # turbo run test (Vitest in packages/ui + packages/services)
pnpm run test:coverage    # Vitest with an 80% coverage threshold
pnpm run format           # prettier --write "**/*.{ts,tsx,md}"
pnpm run dev              # admin on :3000, docs on :3001
```

Supabase (local stack):

```bash
pnpm run db:start              # boot local Supabase
pnpm run db:stop
pnpm run db:status
pnpm run db:reset              # reset local DB and re-apply migrations
pnpm run db:test               # run pgTAP database tests (supabase/tests/database/)
pnpm run db:deploy             # supabase db push to remote
pnpm run db:sync               # supabase db pull
pnpm run db:gen:migration <n>  # scaffold a new migration
pnpm run db:gen:types          # regenerate ./packages/services/src/supabase/types.ts
```

**Vitest** powers unit tests in `packages/ui` and `packages/services` (`pnpm test`, `pnpm test:coverage` — the latter enforces an 80% threshold). Tests live next to source as `*.test.ts(x)`. `apps/*` have no tests yet. The husky **pre-push** hook runs `test:coverage`, so a push fails if tests fail or coverage drops.

### Validation before submitting changes

Run in order — all must pass:

1. `pnpm install` if deps changed
2. **`pnpm run format`** — run this **before** `git add`; the husky pre-commit hook runs `format:check` and will block the commit if any file is not formatted. One write-pass here prevents all hook-related thrashing.
3. `pnpm run check-types`
4. `pnpm run lint`
5. `pnpm run test:coverage` (also enforced by the pre-push hook)
6. `pnpm run build`

Or run the full suite at once: `pnpm verify` (`format:check && lint && check-types && test:coverage && build`).

## Conventions and gotchas

- **Strict TypeScript**: `strict`, `strictNullChecks`, and `noUncheckedIndexedAccess` are all enabled. Types must be explicit.
- **Zero-warnings lint policy**: every app/package runs `eslint --max-warnings 0`. A warning is an error.
- **ESM everywhere**: both apps declare `"type": "module"`. Use ESM `import`/`export`.
- **Turborepo task graph**: `build` depends on `^build`, so internal packages build before apps. Don't build a single app in isolation without ensuring `packages/ui` is built.
- **New tables need explicit Data API GRANTs** (Supabase June-2026 change; [ADR-0034](docs/adr/adr-0034-api-role-table-grants.md)). `public` tables are no longer auto-exposed — a table returns `42501` from PostgREST until a role is granted on it. GRANT controls table access; RLS controls which rows — **both** are required. Any migration that `CREATE`s a table must, in the same file, enable RLS, add policies, **and** grant least-privilege: `GRANT SELECT ON public.<table> TO anon;` and `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated, service_role;` (`anon` is read-only — the reader app is anonymous). Do **not** use `ALTER DEFAULT PRIVILEGES` to auto-grant (a temporary aid Supabase removes 2026-10-30). See `00023_api_role_table_grants.sql` for the catch-up grant and the canonical snippet.
- **Junction tables** (`supabase/migrations/00002_*`) use composite primary keys with no surrogate `id` and no `user_id` — RLS derives ownership from parent entities. Follow this pattern when adding new junctions (see `docs/system-design.md` §3.4). Junctions are tables too — they need the same GRANTs as above.
- **`immutable_array_to_string`** in `00001_initial_schema.sql` exists because `array_to_string` is marked STABLE and can't be used in `GENERATED ALWAYS AS`. Reuse it instead of inventing another wrapper.
- **Env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` — see `.env.local.example`. Never expose the service-role key in client bundles.

## When you're blocked (from `.github/copilot-instructions.md`)

- Missing API/package/service → add `// BLOCKED: [reason]` and move on. Don't mock or stub.
- Missing credentials → leave `// NEEDS: [credential description]`. Never hardcode or invent values.
- Ambiguous business logic → add `// DECISION NEEDED: [...]` and take the conservative path. Don't guess.
- Conflict with an existing pattern → follow the existing convention and flag the conflict in a comment.

## When you find a spec or upstream bug

If implementing a task reveals a bug in the spec (`docs/system-design.md`, PRD), schema, or another upstream artifact, do not silently work around it. File a separate GitHub issue documenting the bug, its evidence, the workaround applied in code, and the recommended upstream fix. Reference the tracking issue in the workaround comment if the workaround is non-obvious. See #73 for the template.

## When to write an ADR

Architectural decisions are recorded as ADRs in [`docs/adr/`](docs/adr/). The series ADR-0001…0032 documents every load-bearing decision made to date; the index and process live in [`docs/adr/README.md`](docs/adr/README.md).

- Write a new ADR when you make a decision that is **hard to reverse, cross-cutting, or sets a precedent** — a new dependency/platform, a schema/RLS pattern, an API boundary, a state/data-flow choice, or a design-system rule. Routine, local, easily-reversible changes do not need one.
- **Number new ADRs from the next free number** — the series currently runs through ADR-0032, so check [`docs/adr/README.md`](docs/adr/README.md) for the latest before numbering. Copy [`docs/adr/adr-0000-template.md`](docs/adr/adr-0000-template.md), fill it in, cite concrete evidence (migration file/section or doc section), and add a row to the README index.
- If a new decision **supersedes or amends** an existing ADR, set the `supersedes`/`superseded_by` front matter on both sides and update the index status.
