# Squad Decisions

## Active Decisions

### 2026-03-23: Build order and architectural sequencing

**By:** Cooper (Lead)
**What:** Recommended build sequence for Time Traveler MVP, from foundation to feature layers.

**Build Sequence (7 phases):**

| Phase | What | Owner | Reviewer |
|-------|------|-------|----------|
| 0 | Supabase + Schema + RLS | TARS | Cooper |
| 1 | Temporal Core (TS) | TARS | Romilly (tests) |
| 2 | Service Layer + Hooks | TARS | Cooper |
| 3 | Auth + UI Shell + TemporalInput | Brand + TARS | Cooper |
| 4 | Timeline + Event UI | Brand | Romilly |
| 5 | Characters + Relationships | Brand + TARS | Cooper |
| 6 | Stories + Categories + Periods | Brand | Cooper |
| 7 | Timeline Visualization (D3) | Brand | Cooper |

**Locked Architectural Decisions:**

1. **JSONB temporal structure is final** as specified in system-design.md §4.2. No changes to field names, era values, or sort computation formula.
2. **No stored procedures for CRUD.** PostgREST + client service layer. DB functions only for read-only complex queries.
3. **RLS ships with the initial migration.** Four-clause read pattern: published OR owner OR admin OR collaborator.
4. **Separate start/end temporal columns.** Two JSONB columns + two generated sort columns per entity.
5. **Client-side temporal logic.** TemporalService lives in TypeScript, not database.
6. **UUIDs for primary keys.** Enables client-side ID generation for optimistic updates.
7. **ON DELETE CASCADE on all foreign keys.**

**Deferred from MVP:** Real-time collaborative editing, full-text search UI, bulk import/export, curated content library, map visualization, temporal comparison view, content moderation UI, mobile optimization, geocoding, PDF/HTML export, OAuth beyond email.

**Why:** The hybrid temporal JSONB system + Supabase schema is the load-bearing foundation. Everything depends on temporal data, sort_order_years generated columns, and era conversion logic being correct before any UI work begins.

---

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
