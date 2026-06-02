-- pgTAP tests for 00017_events_detail_timeline_id.sql (issue #177 — add
-- events.detail_timeline_id fractal drill-down link).
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

-- ============================================================================
-- Column presence + type
-- ============================================================================

select has_column(
  'public', 'events', 'detail_timeline_id',
  'events.detail_timeline_id column exists'
);

select col_type_is(
  'public', 'events', 'detail_timeline_id', 'uuid',
  'events.detail_timeline_id is uuid'
);

select col_is_null(
  'public', 'events', 'detail_timeline_id',
  'events.detail_timeline_id is nullable'
);

-- ============================================================================
-- FK target + ON DELETE behavior
-- ============================================================================

select ok(
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'events'
      and c.contype = 'f'
      and c.conname = 'events_detail_timeline_id_fkey'
      and c.confrelid = 'public.timelines'::regclass
  ),
  'events.detail_timeline_id FK targets public.timelines(id)'
);

select is(
  (
    select c.confdeltype
    from pg_constraint c
    where c.conname = 'events_detail_timeline_id_fkey'
      and c.conrelid = 'public.events'::regclass
  ),
  'n',
  'events.detail_timeline_id FK uses ON DELETE SET NULL'
);

-- ============================================================================
-- Reverse-lookup partial index exists
-- ============================================================================

select has_index(
  'public', 'events', 'idx_events_detail_timeline',
  'idx_events_detail_timeline exists'
);

select * from finish();
rollback;
