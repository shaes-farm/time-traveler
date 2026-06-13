-- pgTAP tests for 00021_fix_stories_rls_recursion.sql
--
-- Regression coverage for the `infinite recursion detected in policy for
-- relation "stories"` bug: reading stories (and story_events) under RLS must
-- now succeed for both anon and authenticated callers, while preserving the
-- original visibility semantics (published OR owner OR admin OR collaborator).
--
-- IMPORTANT: assertions must `SET LOCAL ROLE anon|authenticated` to apply RLS —
-- the default `postgres` role bypasses it. Before this migration, the SELECTs
-- below raised a recursion error rather than returning a count.
begin;
create extension if not exists pgtap with schema extensions;

-- ============================================================================
-- Seed (runs as postgres, RLS bypassed): one owner with a published and a
-- private story, each linked to an event so the EXISTS/collaborator branch of
-- the predicate is actually exercised.
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role,
                        raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'owner@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Owner","last_name":"User"}'::jsonb);

insert into timelines (id, user_id, slug, title, temporal_data, published) values
  ('aaaaaaaa-0001-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'tl-1', 'Timeline One',
   '{"year":2000,"era":"CE"}'::jsonb, false);

insert into events (id, user_id, slug, title, temporal_data, timeline_id, published) values
  ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'ev-1', 'Event One',
   '{"year":2001,"era":"CE"}'::jsonb,
   'aaaaaaaa-0001-0000-0000-000000000001', false);

insert into stories (id, user_id, slug, title, published) values
  ('bbbbbbbb-0001-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'story-pub', 'Published Story', true),
  ('bbbbbbbb-0001-0000-0000-000000000002'::uuid,
   '11111111-1111-1111-1111-111111111111', 'story-priv', 'Private Story', false);

insert into story_events (story_id, event_id) values
  ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0002-0000-0000-000000000001'),
  ('bbbbbbbb-0001-0000-0000-000000000002', 'aaaaaaaa-0002-0000-0000-000000000001');

-- ============================================================================
-- Plan: 8 assertions
-- ============================================================================
select plan(8);

-- --- Helper exists and is SECURITY DEFINER -----------------------------------
select is(
  (select count(*)::int from pg_proc
   where proname = 'is_story_readable' and pronamespace = 'public'::regnamespace),
  1, 'is_story_readable() helper exists');

select is(
  (select prosecdef from pg_proc
   where proname = 'is_story_readable' and pronamespace = 'public'::regnamespace),
  true, 'is_story_readable() is SECURITY DEFINER');

-- --- anon: no recursion + only published rows visible ------------------------
set local role anon;

select lives_ok(
  $$ select count(*) from stories $$,
  'anon SELECT on stories no longer raises infinite-recursion');

select is(
  (select count(*)::int from stories),
  1, 'anon sees only the published story');

select lives_ok(
  $$ select count(*) from story_events $$,
  'anon SELECT on story_events no longer raises infinite-recursion');

select is(
  (select count(*)::int from story_events),
  1, 'anon sees only the published story''s story_events row');

reset role;

-- --- authenticated owner: sees both own stories ------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';

select is(
  (select count(*)::int from stories),
  2, 'authenticated owner sees both published and private stories');

select is(
  (select count(*)::int from story_events),
  2, 'authenticated owner sees both story_events rows');

reset request.jwt.claims;
reset role;

select * from finish();
rollback;
