-- pgTAP tests for 00021_fix_stories_rls_recursion.sql
--
-- Regression coverage for the `infinite recursion detected in policy for
-- relation "stories"` bug: reading stories (and story_events) under RLS must
-- now succeed for anon and authenticated callers. Also exercises every branch
-- of the centralized visibility predicate — published, owner, admin, and
-- collaborator-via-events — so the SECURITY DEFINER helpers can't silently
-- regress the intended semantics.
--
-- IMPORTANT: assertions must `SET LOCAL ROLE anon|authenticated` to apply RLS —
-- the default `postgres` role bypasses it. Before this migration, the SELECTs
-- below raised a recursion error rather than returning a count.
begin;
create extension if not exists pgtap with schema extensions;

-- ============================================================================
-- Seed (runs as postgres, RLS bypassed). Three users:
--   * owner (1111)        — owns both stories
--   * admin (3333)        — profiles.role = 'admin'
--   * collaborator (4444) — 'viewer' on the timeline whose event the private
--                           story is linked to (exercises the collaborator
--                           branch — NOT published, NOT owned by 4444)
-- One published + one private story, both linked to an event in `owner`'s
-- timeline via story_events (so the EXISTS/collaborator branch is real).
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role,
                        raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'owner@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Owner","last_name":"User"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'admin@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Admin","last_name":"User"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'collab@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Collab","last_name":"User"}'::jsonb);

update profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

insert into timelines (id, user_id, slug, title, temporal_data, published) values
  ('aaaaaaaa-0001-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'tl-1', 'Timeline One',
   '{"year":2000,"era":"CE"}'::jsonb, false);

-- 4444 collaborates (viewer) on owner's timeline.
insert into timeline_collaborators (timeline_id, user_id, role) values
  ('aaaaaaaa-0001-0000-0000-000000000001',
   '44444444-4444-4444-4444-444444444444', 'viewer');

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
-- Plan: 14 assertions
-- ============================================================================
select plan(14);

-- --- Helpers exist and are SECURITY DEFINER ----------------------------------
select is(
  (select count(*)::int from pg_proc
   where proname = 'is_story_readable' and pronamespace = 'public'::regnamespace),
  1, 'is_story_readable() helper exists');

select is(
  (select prosecdef from pg_proc
   where proname = 'is_story_readable' and pronamespace = 'public'::regnamespace),
  true, 'is_story_readable() is SECURITY DEFINER');

select is(
  (select count(*)::int from pg_proc
   where proname = 'story_has_collaborating_event' and pronamespace = 'public'::regnamespace),
  1, 'story_has_collaborating_event() helper exists');

select is(
  (select prosecdef from pg_proc
   where proname = 'story_has_collaborating_event' and pronamespace = 'public'::regnamespace),
  true, 'story_has_collaborating_event() is SECURITY DEFINER');

-- --- anon: no recursion + only the published story is visible -----------------
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
  2, 'owner sees both published and private stories');

select is(
  (select count(*)::int from story_events),
  2, 'owner sees both story_events rows');

reset request.jwt.claims;
reset role;

-- --- collaborator: sees the PRIVATE story via the collaborator-via-events
--     branch (not published, not owned by 4444) ------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"44444444-4444-4444-4444-444444444444"}';

select is(
  (select count(*)::int from stories),
  2, 'collaborator sees published + the collaborating private story');

select is(
  (select count(*)::int from stories where published = false),
  1, 'collaborator-via-events branch grants the private story');

reset request.jwt.claims;
reset role;

-- --- admin: override grants the private story --------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';

select is(
  (select count(*)::int from stories),
  2, 'admin sees all stories');

select is(
  (select count(*)::int from stories where published = false),
  1, 'admin override grants the private story');

reset request.jwt.claims;
reset role;

select * from finish();
rollback;
