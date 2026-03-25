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

### 2026-03-23: MVP PRD decomposition into GitHub issues

**By:** Murph (Project Coordinator), completed by Squad Coordinator
**What:** Decomposed the full PRD and system design into 58 GitHub issues (#12–#69) across 8 milestones (Phases 0–7). All issues have acceptance criteria, dependency chains, squad member assignments, and milestone tags.

**Phase breakdown:**
- Phase 0 (Foundation): 11 issues (#12–#22) — Supabase, schema, RLS, storage
- Phase 1 (Shared Logic): 5 issues (#23–#27) — Zod, TemporalService, slug, Vitest
- Phase 2 (Service Layer): 7 issues (#28–#34) — service modules, TanStack Query, Zustand
- Phase 3 (Auth & App Shell): 7 issues (#35–#41) — auth, middleware, shadcn/ui, shell, TemporalInput
- Phase 4 (Timeline & Event CRUD): 9 issues (#42–#50) — timeline/event CRUD, media, collaborators, publish
- Phase 5 (Characters & Relationships): 7 issues (#51–#57) — character service, relationships, event participation, UI
- Phase 6 (Stories, Categories & Periods): 7 issues (#58–#64) — story/category/period services and UI
- Phase 7 (Timeline Visualization): 5 issues (#65–#69) — D3.js renderer, log/linear scales, fractal zoom, period bands

**Why:** Maps the complete MVP scope from PRD-0001 to actionable, trackable work items with clear dependency ordering.

**Blocked:** GitHub project board creation requires `read:project` token scope. Run `gh auth refresh -s read:project` to unblock.

---

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
