---
goal: Enforce single-primary on character_media via partial unique index
version: 1.0
date_created: 2026-05-24
last_updated: 2026-05-24
owner: shaes-farm
status: "In progress"
tags: [migration, schema, database, bug]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

The `character_media` junction table allows multiple rows with `is_primary = true` for the same `character_id`. This violates single-primary semantics required by the admin UI (character avatar/thumbnail). This plan adds a partial unique index at the DB level, cleans up any existing invalid data, and documents the convention in `docs/system-design.md` §3.4. Surfaced from PR #120. Tracked in issue #125.

## 1. Requirements & Constraints

- **REQ-001**: At most one `character_media` row per `character_id` may have `is_primary = true`.
- **REQ-002**: The constraint must be enforced at the database level — not UI-only — to protect against concurrent writes, PostgREST direct calls, and future bulk imports.
- **REQ-003**: Existing data must be cleaned before the index is created. Migration must be safe on a fresh (empty) DB and on a pre-populated DB with dirty data.
- **REQ-004**: Cleanup strategy is deterministic: per `character_id`, retain the row with the lowest `media_id` UUID as the surviving primary; set the rest to `false`. (`character_media` has no `created_at` column — confirmed against `00002_relationships_junctions.sql`.)
- **REQ-005**: Partial unique index follows the canonical PostgreSQL pattern: `CREATE UNIQUE INDEX … ON character_media (character_id) WHERE is_primary = true;`
- **REQ-006**: `docs/system-design.md` §3.4 must document the partial-index pattern as the project convention for single-primary junction flags.
- **CON-001**: Migration number is `00012` (next after `00011_rls_performance_hardening.sql`).
- **CON-002**: No stored procedures or triggers — constraint is index-only.
- **PAT-001**: All migrations are plain SQL files in `supabase/migrations/`. No down migrations.
- **PAT-002**: pgTAP tests live in `supabase/tests/database/` with the matching migration number prefix.
- **GUD-001**: Run `pnpm run check-types && pnpm run lint && pnpm run build` and `pnpm run db:test` before submitting PR.

## 2. Implementation Steps

### Implementation Phase 1 — Database Migration

- GOAL-001: Create migration that cleans existing dirty data and creates the partial unique index.

| Task     | Description                                                                                                                      | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create `supabase/migrations/00012_character_media_single_primary.sql`                                                            | ✅        | 2026-05-24 |
| TASK-002 | CTE cleanup: per `character_id` group with >1 `is_primary = true`, set all but lowest `media_id` to `false`                      | ✅        | 2026-05-24 |
| TASK-003 | `CREATE UNIQUE INDEX IF NOT EXISTS character_media_one_primary ON public.character_media (character_id) WHERE is_primary = true` | ✅        | 2026-05-24 |

### Implementation Phase 2 — Documentation Update

- GOAL-002: Document the partial-index single-primary pattern in `docs/system-design.md` §3.4.

| Task     | Description                                                                            | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Add single-primary pattern callout to §3.4 prose (before the self-referential FK note) | ✅        | 2026-05-24 |
| TASK-005 | Add index DDL comment inline in the §3.4 `character_media` code block                  | ✅        | 2026-05-24 |
| TASK-006 | Update key-changes callout for `character_media` to mention the partial index          | ✅        | 2026-05-24 |

### Implementation Phase 3 — pgTAP Tests

- GOAL-003: Verify migration correctness via pgTAP.

| Task     | Description                                                                                   | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Create `supabase/tests/database/00012_character_media_single_primary_test.sql`                | ✅        | 2026-05-24 |
| TASK-008 | `has_index` test: `character_media_one_primary` exists on `character_media`                   | ✅        | 2026-05-24 |
| TASK-009 | `throws_ok` (SQLSTATE 23505): second `is_primary = true` row for same `character_id` rejected | ✅        | 2026-05-24 |
| TASK-010 | `lives_ok`: `is_primary = false` row alongside existing primary succeeds                      | ✅        | 2026-05-24 |
| TASK-011 | `lives_ok`: unsetting the primary flag via UPDATE succeeds without error                      | ✅        | 2026-05-24 |

### Implementation Phase 4 — Validation

- GOAL-004: Confirm all CI checks pass.

| Task     | Description                                               | Completed | Date |
| -------- | --------------------------------------------------------- | --------- | ---- |
| TASK-012 | `pnpm run db:reset` — apply migration locally             |           |      |
| TASK-013 | `pnpm run db:test` — all pgTAP tests pass                 |           |      |
| TASK-014 | `pnpm run check-types && pnpm run lint && pnpm run build` |           |      |

## 3. Alternatives

- **ALT-001**: Trigger-based enforcement (BEFORE INSERT OR UPDATE unsets existing primary). Rejected: triggers silently mutate data and are harder to test and reason about under concurrency. Issue #125 explicitly requests the index approach.
- **ALT-002**: Application-layer-only enforcement (admin UI atomic swap). Rejected: bypassed by PostgREST direct writes, parallel tabs, bulk import. UI-side atomic swap is a UX improvement but does not replace the DB constraint.
- **ALT-003**: Per-row CHECK constraint. Not supported by PostgreSQL for cross-row predicates.

## 4. Dependencies

- **DEP-001**: Migration `00011_rls_performance_hardening.sql` must precede `00012`. (Already on `main`.)
- **DEP-002**: `character_media` table with `is_primary BOOLEAN DEFAULT false` — defined in `00002_relationships_junctions.sql`.

## 5. Files

- **FILE-001**: `supabase/migrations/00012_character_media_single_primary.sql` — new migration (data cleanup + index creation)
- **FILE-002**: `supabase/tests/database/00012_character_media_single_primary_test.sql` — new pgTAP test file
- **FILE-003**: `docs/system-design.md` — §3.4 Junction Tables documentation update

## 6. Testing

- **TEST-001**: `has_index('public', 'character_media', 'character_media_one_primary', ...)` — index exists
- **TEST-002**: `throws_ok(...)` SQLSTATE `23505` — second `is_primary = true` row for same `character_id` raises unique violation
- **TEST-003**: `lives_ok(...)` — `is_primary = false` row for same character alongside existing primary is accepted
- **TEST-004**: `lives_ok(...)` — unsetting `is_primary` via UPDATE succeeds

## 7. Risks & Assumptions

- **RISK-001**: Production data may contain multiple `is_primary = true` rows per character. Mitigated: cleanup CTE in Step 1 runs before the index creation, so migration will never fail on dirty data.
- **ASSUMPTION-001**: Migration sequence `00012` is available. Verified: highest existing migration is `00011`.
- **ASSUMPTION-002**: `character_media` has no `created_at` column. Confirmed against `supabase/migrations/00002_relationships_junctions.sql`. Cleanup tiebreaker is `media_id ASC`.

## 8. Related Specifications / Further Reading

- [docs/system-design.md §3.4 — Junction Tables](docs/system-design.md)
- [supabase/migrations/00002_relationships_junctions.sql](supabase/migrations/00002_relationships_junctions.sql)
- [GitHub Issue #125](https://github.com/shaes-farm/time-traveler/issues/125)
- [PR #120 — Admin design review (source of requirement)](https://github.com/shaes-farm/time-traveler/pull/120)
