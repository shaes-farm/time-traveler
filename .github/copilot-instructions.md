# GitHub Copilot Instructions — Time Traveler

> **Source of truth:** Full project context, repository layout, toolchain, and commands live in
> [`CLAUDE.md`](../CLAUDE.md), [`docs/system-design.md`](../docs/system-design.md), the PRD
> ([`docs/prd/PRD-0001-time-traveler-system.md`](../docs/prd/PRD-0001-time-traveler-system.md)), and
> [`docs/adr/`](../docs/adr/). This file is intentionally scoped to what the **Copilot code reviewer**
> should enforce on a pull request — read `CLAUDE.md` for anything not covered here.

**Time Traveler** is a temporal CMS (pnpm + Turborepo monorepo: `apps/admin`, `apps/docs`, `apps/reader`;
`packages/ui` = `@repo/ui`, `packages/services` = `@repo/services`) on Next.js 16 / React 19 / TypeScript /
Supabase (Postgres + JSONB + RLS).

## What to enforce in review

**TypeScript & lint**

- Strict mode is on (`strict`, `strictNullChecks`, `noUncheckedIndexedAccess`). Flag implicit `any`,
  unchecked index access, and non-null assertions used to dodge the type system.
- Zero-warnings policy: every package runs `eslint --max-warnings 0`. A warning is a failure — flag it.
- ESM everywhere (both apps are `"type": "module"`). No CommonJS `require`/`module.exports`.

**Imports & boundaries**

- Use the package subpath exports: `@repo/ui/components/*`, `@repo/ui/hooks/*`, `@repo/ui/stores`,
  `@repo/services/schemas/*`, `@repo/services/<entity>-service`. Flag deep relative imports across packages.
- `apps/reader` is anonymous, read-only, and must never share the admin shell ([ADR-0030](../docs/adr/adr-0030-public-reader-app-placement.md)).

**Database / Supabase (highest-signal review area)**

- **Every migration that `CREATE`s a table (junction tables included) must, in the same file: enable RLS,
  add policies, AND grant least-privilege** ([ADR-0034](../docs/adr/adr-0034-api-role-table-grants.md)).
  `public` tables are no longer auto-exposed — PostgREST returns `42501` until granted. GRANT controls
  table access; RLS controls which rows — **both are required**. Expected grants:
  `GRANT SELECT ON public.<table> TO anon;` and
  `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated, service_role;`
  (`anon` is read-only). Reject `ALTER DEFAULT PRIVILEGES` auto-grants (removed by Supabase 2026-10-30).
  See `supabase/migrations/00023_api_role_table_grants.sql` for the canonical snippet.
- Junction tables use composite PKs with no surrogate `id` and no `user_id` — RLS derives ownership from
  parent entities. Flag deviations.
- Reuse `immutable_array_to_string` (in `00001_initial_schema.sql`) inside `GENERATED ALWAYS AS`; flag new
  wrappers around the STABLE `array_to_string`.

**Secrets & safety**

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client bundles. Flag any service-role usage outside server-only code.
- Flag hardcoded credentials, tokens, or invented secret values.

## Conventions for flagged-but-not-blocking situations

- **Blocked work** should be marked in code, not faked: `// BLOCKED:`, `// NEEDS:`, or `// DECISION NEEDED:`
  rather than mocked/stubbed dependencies or guessed business logic. Conflicts with an existing pattern
  should follow the existing convention and flag the conflict, not silently override it.
- **Upstream/spec bugs** found while implementing should be filed as a separate GitHub issue (with evidence,
  workaround, and recommended fix) and referenced from the workaround comment — not silently worked around.
- **ADRs** are required for hard-to-reverse, cross-cutting, or precedent-setting decisions (new dependency,
  schema/RLS pattern, API boundary, state/data-flow choice, design-system rule). New ADRs number from the
  next free number — check [`docs/adr/README.md`](../docs/adr/README.md). A PR making such a decision without
  an ADR is worth flagging.

## CI parity

Required checks on `main`: format, lint, type-check, build, and test (≥80% coverage). Locally the whole
suite is `pnpm verify`; database changes also need `pnpm db:test`. A PR that would fail any of these should
not pass review.
