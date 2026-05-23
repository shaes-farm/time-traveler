-- pgTAP tests for 00011_rls_performance_hardening.sql (issue #115 — RLS performance hardening)
begin;
create extension if not exists pgtap with schema extensions;

-- ============================================================================
-- Plan: 36 assertions
--   17  — old write_X FOR ALL policies are gone from split tables
--   17  — new insert_X policies exist on split tables
--    1  — no table in public has multiple permissive SELECT policies for the
--          same role (validates both lints are resolved)
--    1  — read_events still present (smoke-test that non-split policies
--          survived the DROP/RECREATE in this migration)
-- ============================================================================
select plan(36);

-- ---------------------------------------------------------------------------
-- Helper: check whether a named policy exists on a table
-- ---------------------------------------------------------------------------

-- ============================================================================
-- Part A: old write_X FOR ALL policies must no longer exist (17 checks)
-- ============================================================================

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'periods'
     and p.polname = 'write_periods'),
  0, 'write_periods FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'characters'
     and p.polname = 'write_characters'),
  0, 'write_characters FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'stories'
     and p.polname = 'write_stories'),
  0, 'write_stories FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'categories'
     and p.polname = 'write_categories'),
  0, 'write_categories FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'media'
     and p.polname = 'write_media'),
  0, 'write_media FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'event_categories'
     and p.polname = 'write_event_categories'),
  0, 'write_event_categories FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'event_media'
     and p.polname = 'write_event_media'),
  0, 'write_event_media FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'event_characters'
     and p.polname = 'write_event_characters'),
  0, 'write_event_characters FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'timeline_events'
     and p.polname = 'write_timeline_events'),
  0, 'write_timeline_events FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'period_timelines'
     and p.polname = 'write_period_timelines'),
  0, 'write_period_timelines FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'timeline_media'
     and p.polname = 'write_timeline_media'),
  0, 'write_timeline_media FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'story_periods'
     and p.polname = 'write_story_periods'),
  0, 'write_story_periods FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'story_characters'
     and p.polname = 'write_story_characters'),
  0, 'write_story_characters FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'story_events'
     and p.polname = 'write_story_events'),
  0, 'write_story_events FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'character_media'
     and p.polname = 'write_character_media'),
  0, 'write_character_media FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'character_relationships'
     and p.polname = 'write_character_relationships'),
  0, 'write_character_relationships FOR ALL is gone');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'timeline_collaborators'
     and p.polname = 'write_collaborators'),
  0, 'write_collaborators FOR ALL is gone');

-- ============================================================================
-- Part B: new insert_X policies exist on split tables (17 checks)
-- ============================================================================

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'periods'
     and p.polname = 'insert_periods' and p.polcmd = 'a'),
  1, 'insert_periods policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'characters'
     and p.polname = 'insert_characters' and p.polcmd = 'a'),
  1, 'insert_characters policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'stories'
     and p.polname = 'insert_stories' and p.polcmd = 'a'),
  1, 'insert_stories policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'categories'
     and p.polname = 'insert_categories' and p.polcmd = 'a'),
  1, 'insert_categories policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'media'
     and p.polname = 'insert_media' and p.polcmd = 'a'),
  1, 'insert_media policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'event_categories'
     and p.polname = 'insert_event_categories' and p.polcmd = 'a'),
  1, 'insert_event_categories policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'event_media'
     and p.polname = 'insert_event_media' and p.polcmd = 'a'),
  1, 'insert_event_media policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'event_characters'
     and p.polname = 'insert_event_characters' and p.polcmd = 'a'),
  1, 'insert_event_characters policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'timeline_events'
     and p.polname = 'insert_timeline_events' and p.polcmd = 'a'),
  1, 'insert_timeline_events policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'period_timelines'
     and p.polname = 'insert_period_timelines' and p.polcmd = 'a'),
  1, 'insert_period_timelines policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'timeline_media'
     and p.polname = 'insert_timeline_media' and p.polcmd = 'a'),
  1, 'insert_timeline_media policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'story_periods'
     and p.polname = 'insert_story_periods' and p.polcmd = 'a'),
  1, 'insert_story_periods policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'story_characters'
     and p.polname = 'insert_story_characters' and p.polcmd = 'a'),
  1, 'insert_story_characters policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'story_events'
     and p.polname = 'insert_story_events' and p.polcmd = 'a'),
  1, 'insert_story_events policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'character_media'
     and p.polname = 'insert_character_media' and p.polcmd = 'a'),
  1, 'insert_character_media policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'character_relationships'
     and p.polname = 'insert_character_relationships' and p.polcmd = 'a'),
  1, 'insert_character_relationships policy exists');

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'timeline_collaborators'
     and p.polname = 'insert_collaborators' and p.polcmd = 'a'),
  1, 'insert_collaborators policy exists');

-- ============================================================================
-- Part C: no table in public has multiple permissive SELECT policies for
--         the same (table, role) combination (validates lint=0006 is resolved)
-- ============================================================================

select is(
  (select count(*)::int
   from (
     select c.relname, r.rolname
     from pg_policy p
     join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
     cross join pg_roles r
     where n.nspname = 'public'
       and p.polcmd = 'r'           -- SELECT
       and p.polpermissive = true
       and (p.polroles = '{0}' or r.oid = any(p.polroles))
     group by c.relname, r.rolname
     having count(*) > 1
   ) dupes),
  0,
  'no table has multiple permissive SELECT policies for the same role');

-- ============================================================================
-- Part D: smoke-test that non-split read policies survived migration (1 check)
-- ============================================================================

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'events'
     and p.polname = 'read_events' and p.polcmd = 'r'),
  1, 'read_events SELECT policy still exists after migration');

select * from finish();
rollback;
