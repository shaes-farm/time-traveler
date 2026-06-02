-- pgTAP tests for 00019_drop_events_parent_event_id.sql (issue #180 — drop the
-- deprecated events.parent_event_id column; fractal nesting is forward-only via
-- events.detail_timeline_id, #177).
begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

-- ============================================================================
-- Column is gone
-- ============================================================================

select hasnt_column(
  'public', 'events', 'parent_event_id',
  'events.parent_event_id column has been dropped'
);

-- ============================================================================
-- Dependent index is gone
-- ============================================================================

select hasnt_index(
  'public', 'events', 'idx_events_parent',
  'idx_events_parent has been dropped with the column'
);

-- ============================================================================
-- Self-referential FK is gone
-- ============================================================================

select ok(
  not exists (
    select 1
    from pg_constraint c
    where c.conname = 'events_parent_event_id_fkey'
      and c.conrelid = 'public.events'::regclass
  ),
  'events_parent_event_id_fkey self-FK has been dropped'
);

select * from finish();
rollback;
