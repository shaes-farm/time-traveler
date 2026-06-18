---
title: "ADR-0034: Explicit table GRANTs for PostgREST API roles"
status: "Accepted"
date: "2026-06-18"
authors: "Backend / DB"
tags: ["architecture", "decision", "database", "security", "rls"]
supersedes: ""
superseded_by: ""
amends: ""
amended_by: ""
---

# ADR-0034: Explicit table GRANTs for PostgREST API roles

## Status

**Accepted**

## Context

Every migration to date defines RLS **policies** (e.g. `update_events … TO
authenticated` in `00011_rls_performance_hardening.sql`) but none issues the
underlying table **GRANTs**. In PostgreSQL, RLS is a row filter layered on top of
SQL privileges: a role must first hold the base `SELECT`/`INSERT`/`UPDATE`/
`DELETE` grant before any policy is consulted.

On hosted Supabase this gap is invisible — the platform pre-grants
`anon`/`authenticated`/`service_role` privileges on `public` via default
privileges before project migrations run. The **local** stack does not: its
default privileges grant only `TRUNCATE/REFERENCES/TRIGGER/MAINTAIN` (`Dxtm`) to
those roles. So `supabase db reset` produced tables the API roles could not read
or write:

```
42501: permission denied for table events
42501: permission denied for table stories
```

This broke `pnpm db:test` (the `00007` RLS, `00021` publish-guard, and `00021`
stories-recursion suites all aborted) and any local run of the apps against a
freshly reset database. Relying on implicit platform default-privilege behavior
also means local and remote could silently diverge.

## Decision

Add `00023_api_role_table_grants.sql`: grant table-level privileges to the
PostgREST API roles explicitly, and set `ALTER DEFAULT PRIVILEGES` so future
tables inherit them. RLS remains the row-level gate.

Privilege model:

- **anon** → `SELECT` only. The public reader (`apps/reader`) is anonymous and
  read-only and has no write RLS policy; a write grant would be dead privilege.
- **authenticated** → `SELECT, INSERT, UPDATE, DELETE`. The per-table RLS
  policies (`00007`/`00011`) decide which rows.
- **service_role** → `ALL`. Server-only key; bypasses RLS by design.

This sets the convention for all future tables: grants are explicit and
version-controlled, never assumed from the platform.

## Consequences

### Positive

- **POS-001**: `pnpm db:reset` + `pnpm db:test` work locally; the apps can talk
  to a freshly reset DB.
- **POS-002**: Local and remote privilege state are identical and reproducible
  from migrations — no dependence on platform default-privilege drift.
- **POS-003**: `ALTER DEFAULT PRIVILEGES` prevents the gap from silently
  reappearing when new tables are added.
- **POS-004**: Least-privilege posture for `anon` (read-only) is encoded in SQL,
  not just in RLS policy targeting.

### Negative

- **NEG-001**: Privileges are now asserted in two places (the platform default
  on hosted Supabase, and this migration). The grants are additive and
  idempotent, so this is belt-and-suspenders rather than a conflict.
- **NEG-002**: New tables that need a _narrower_ grant than the schema-wide
  default must `REVOKE` explicitly.

## Alternatives Considered

### Rely on Supabase platform default privileges

- **ALT-001**: **Description**: Do nothing in migrations; assume the platform
  grants API-role privileges.
- **ALT-002**: **Rejection Reason**: That is exactly what failed — local default
  privileges differ from hosted, leaving migrations not self-sufficient and the
  DB test suite red.

### Grant `ALL` to `anon` as well (mirror Supabase's broadest default)

- **ALT-003**: **Description**: `GRANT ALL … TO anon, authenticated,
service_role` and let RLS gate everything.
- **ALT-004**: **Rejection Reason**: `anon` has no write RLS policy, so write
  grants are dead privilege and weaken least-privilege for no functional gain.

## Implementation Notes

- **IMP-001**: `GRANT … ON ALL TABLES IN SCHEMA public` covers views created in
  `00006`; `service_role` keeps `ALL`.
- **IMP-002**: Grants are additive/idempotent — safe to apply on remote where
  the platform may already have granted equivalent or broader privileges.
- **IMP-003**: Covered by `supabase/tests/database/00023_api_role_table_grants_test.sql`
  (anon read-only, authenticated DML, service_role full).
- **IMP-004**: No generated-type impact — privileges do not change the schema,
  so `db:gen:types` output is unaffected.
