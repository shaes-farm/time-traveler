# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

**Time Traveler** is a temporal content management system for storing, visualizing, and interacting with historical events and narratives across the full span of time — Big Bang through the speculative future. Distinguishing features:

- **Fractal timelines** — nested zoomable temporal hierarchy.
- **Hybrid temporal system** — JSONB-encoded dates extend beyond SQL date limits to handle prehistoric/geological/cosmological dates, with precision metadata and uncertainty ranges. See `docs/system-design.md` §4 for the era conversion formula used by all `sort_order` generated columns.
- **Seven character types** — Human, Animal, Mythological, Fictional, Organization, Divine, Artifact — with temporally-scoped relationships and event participation.

**Current state:** Database schema migrations exist (`supabase/migrations/`), but `apps/admin` and `apps/docs` are still Turborepo boilerplate — the product features are not yet implemented.

## Repository Layout

pnpm monorepo orchestrated by Turborepo. Workspaces: `apps/*`, `packages/*`.

- `apps/admin` — Next.js 16 admin app (port 3000). Package name is `admin`.
- `apps/docs` — Next.js 16 docs app (port 3001). Package name is `docs`.
- `packages/ui` — `@repo/ui` shared React components. Import as `@repo/ui/button`, `@repo/ui/card`, etc. (resolved via `packages/ui/src/*.tsx`).
- `packages/eslint-config` — `@repo/eslint-config` (`base`, `next`, `react-internal`).
- `packages/typescript-config` — `@repo/typescript-config` (`base.json`, `nextjs.json`, `react-library.json`).
- `supabase/migrations` — numbered SQL migrations. Migration `00001_initial_schema.sql` defines core tables (profiles, characters, …); `00002_relationships_junctions.sql` defines `character_relationships` and 11 junction tables.
- `docs/prd/PRD-0001-time-traveler-system.md` and `docs/system-design.md` are the authoritative references for feature/schema work.
- `.squad/` and `.github/agents/squad.agent.md` configure an in-repo AI team (Squad). The only GitHub Actions workflows are Squad automation (triage, heartbeat, label sync) — **there is no CI build pipeline**, so validation is local-only.

## Toolchain

- **Node ≥24** (`.nvmrc` pins v24)
- **pnpm 9.0.0** (declared in `package.json` `packageManager`)
- **Turborepo 2.8.20**, **TypeScript 5.9.2**, **Next.js 16.2.0**, **React 19.2.x**
- **Supabase CLI** ^2.101.0 — local stack runs Postgres 17

## Commands

```bash
pnpm install              # bootstrap; run after dependency changes
pnpm run build            # turbo run build across all packages/apps
pnpm run lint             # ESLint with --max-warnings 0 (warnings fail)
pnpm run check-types      # next typegen && tsc --noEmit in each Next app, tsc --noEmit in packages/ui
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

**No test framework is configured.** There is no `test` script in any `package.json`. Do not invent `pnpm test`.

### Validation before submitting changes

Run in order — all must pass:

1. `pnpm install` if deps changed
2. `pnpm run check-types`
3. `pnpm run lint`
4. `pnpm run build`

## Conventions and gotchas

- **Strict TypeScript**: `strict`, `strictNullChecks`, and `noUncheckedIndexedAccess` are all enabled. Types must be explicit.
- **Zero-warnings lint policy**: every app/package runs `eslint --max-warnings 0`. A warning is an error.
- **ESM everywhere**: both apps declare `"type": "module"`. Use ESM `import`/`export`.
- **Turborepo task graph**: `build` depends on `^build`, so internal packages build before apps. Don't build a single app in isolation without ensuring `packages/ui` is built.
- **Junction tables** (`supabase/migrations/00002_*`) use composite primary keys with no surrogate `id` and no `user_id` — RLS derives ownership from parent entities. Follow this pattern when adding new junctions (see `docs/system-design.md` §3.4).
- **`immutable_array_to_string`** in `00001_initial_schema.sql` exists because `array_to_string` is marked STABLE and can't be used in `GENERATED ALWAYS AS`. Reuse it instead of inventing another wrapper.
- **Env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` — see `.env.local.example`. Never expose the service-role key in client bundles.

## When you're blocked (from `.github/copilot-instructions.md`)

- Missing API/package/service → add `// BLOCKED: [reason]` and move on. Don't mock or stub.
- Missing credentials → leave `// NEEDS: [credential description]`. Never hardcode or invent values.
- Ambiguous business logic → add `// DECISION NEEDED: [...]` and take the conservative path. Don't guess.
- Conflict with an existing pattern → follow the existing convention and flag the conflict in a comment.

## When you find a spec or upstream bug

If implementing a task reveals a bug in the spec (`docs/system-design.md`, PRD), schema, or another upstream artifact, do not silently work around it. File a separate GitHub issue documenting the bug, its evidence, the workaround applied in code, and the recommended upstream fix. Reference the tracking issue in the workaround comment if the workaround is non-obvious. See #73 for the template.
