---
title: "ADR-0034: Explicit Data API GRANTs for PostgREST roles"
status: "Accepted"
date: "2026-06-18"
authors: "Backend / DB"
tags: ["architecture", "decision", "database", "security", "rls"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0034: Explicit Data API GRANTs for PostgREST roles

## Status

**Accepted**

## Context

Supabase's **June 2026 API-permissions change** makes tables in the `public`
schema no longer auto-exposed to the Data API. Until June 2026, creating a table
in `public` auto-granted `SELECT/INSERT/UPDATE/DELETE` to `anon`,
`authenticated`, and `service_role`, so the table was reachable via PostgREST
even with no RLS. Going forward a table is unreachable until a role is explicitly
`GRANT`ed privileges on it (PostgREST returns `42501` otherwise). Rollout:

- 2026-04-28 — new projects can opt in
- 2026-05-30 — default for all new projects
- 2026-10-30 — applies to existing projects (only **new** tables; existing tables
  keep their grants)

Sources: <https://supabase.com/docs/guides/api/securing-your-api> and
<https://github.com/orgs/supabase/discussions/45329>.

Every prior migration in this repo defines RLS **policies** (e.g. `update_events
… TO authenticated` in `00011`) but never issues the underlying table
**GRANTs** — it relied on the old auto-exposure default. The local Supabase
CLI/Postgres image (`supabase/postgres:17.6.1.134`, CLI `2.106.0`) already ships
the fail-closed default, so a fresh `supabase db reset` produced tables the API
roles could not touch:

```
42501: permission denied for table events
42501: permission denied for table stories
```

This broke `pnpm db:test` (the `00007` RLS and both `00021` suites aborted) and
any local run of the apps against a freshly reset DB. GRANT controls **table**
access; RLS controls **row** access — both are required.

## Decision

Add `00023_api_role_table_grants.sql`: a one-time catch-up that explicitly grants
the existing tables (created in `00001`–`00022`), using least privilege:

- **anon** → `SELECT` (the public reader is anonymous, read-only).
- **authenticated** → `SELECT, INSERT, UPDATE, DELETE` (RLS decides which rows).
- **service_role** → `SELECT, INSERT, UPDATE, DELETE` (server-only; bypasses RLS).

The migration deliberately does **not** use `ALTER DEFAULT PRIVILEGES` to
auto-grant future tables. Supabase calls that a temporary migration aid scheduled
for removal on 2026-10-30 and recommends fail-closed exposure.

**Convention going forward:** any migration that `CREATE`s a table must grant it
explicitly in the same migration, bundled with its `ENABLE ROW LEVEL SECURITY`
and policies:

```sql
GRANT SELECT ON public.<table> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated, service_role;
```

## Consequences

### Positive

- **POS-001**: `pnpm db:reset` + `pnpm db:test` pass locally; the apps can talk
  to a freshly reset DB.
- **POS-002**: Schema is self-sufficient and reproducible from migrations —
  exposure no longer depends on platform default-privilege behavior, and local
  matches the post-2026-10-30 cloud default.
- **POS-003**: Fail-closed posture aligns with Supabase's security direction — a
  new table is invisible to the API until intentionally granted.
- **POS-004**: Least privilege for `anon` (read-only) is encoded in SQL.

### Negative

- **NEG-001**: Every future table migration must remember its GRANTs or the table
  4xxs through the API. This is the intended (fail-closed) trade-off; mitigated by
  the new-table snippet in `00023` and by pgTAP coverage.
- **NEG-002**: The catch-up `GRANT … ON ALL TABLES IN SCHEMA public` is broad;
  future tables are handled individually instead.

## Alternatives Considered

### Re-enable auto-exposure via `ALTER DEFAULT PRIVILEGES … GRANT`

- **ALT-001**: **Description**: Set default privileges so future tables inherit
  the grants automatically (old DX).
- **ALT-002**: **Rejection Reason**: Supabase explicitly flags this as a
  temporary aid removed 2026-10-30 and warns it restores the "exposed unless you
  remember to revoke" posture the change is eliminating.

### Pin the Supabase CLI / Postgres image to the pre-change version

- **ALT-003**: **Description**: Freeze tooling so the old auto-exposure default
  persists locally.
- **ALT-004**: **Rejection Reason**: Temporary and fragile — cloud flips on
  2026-10-30 regardless, and CI/teammates on a newer image would still break.

### Move API tables to a dedicated `api` schema

- **ALT-005**: **Description**: Supabase's stronger recommendation — expose a
  curated `api` schema and lock down `public`.
- **ALT-006**: **Rejection Reason**: Large, cross-cutting refactor (PostgREST
  `db-schemas`, all service queries, generated types). Out of scope here; left as
  a possible future hardening step.

## Implementation Notes

- **IMP-001**: `GRANT … ON ALL TABLES IN SCHEMA public` covers the views created
  in `00006` as well as the junction tables.
- **IMP-002**: Grants are additive/idempotent — safe to apply on remote, where
  existing tables already carry their grants (unaffected until 2026-10-30).
- **IMP-003**: Covered by `supabase/tests/database/00023_api_role_table_grants_test.sql`
  (anon read-only; authenticated/service_role DML).
- **IMP-004**: No generated-type impact — privileges do not change the schema, so
  `db:gen:types` output is unaffected.
