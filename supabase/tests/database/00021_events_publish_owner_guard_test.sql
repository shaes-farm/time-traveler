-- pgTAP tests for 00021_events_publish_owner_guard.sql (issue #48 — owner-only
-- event publication)
--
-- Strategy: seed an owner, an admin, and a collaborator-editor on a shared
-- timeline that holds an owner-owned draft event. Impersonate each role via
-- `SET LOCAL ROLE authenticated` + `SET LOCAL request.jwt.claims` and verify:
--   - owner and admin may flip `published` / `published_at`
--   - collaborator-editor may edit other columns but NOT the publish state
--
-- The collaborator-editor passes the update_events RLS USING clause, so the
-- BEFORE UPDATE trigger RAISEs (42501) rather than RLS silently filtering — so
-- these are throws_ok assertions.
begin;
create extension if not exists pgtap with schema extensions;

-- ============================================================================
-- Seed (runs as postgres, RLS bypassed)
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
   'editor@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Editor","last_name":"User"}'::jsonb);

update profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

insert into timelines (id, user_id, slug, title, temporal_data, published) values
  ('aaaaaaaa-0001-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'tl-shared', 'Shared Timeline',
   '{"year":2000,"era":"CE"}'::jsonb, false);

insert into timeline_collaborators (timeline_id, user_id, role) values
  ('aaaaaaaa-0001-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'editor');

-- Draft events owned by `owner`, one per transition under test.
insert into events (id, user_id, slug, title, temporal_data, timeline_id, published) values
  ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'ev-owner', 'Owner Event',
   '{"year":2001,"era":"CE"}'::jsonb,
   'aaaaaaaa-0001-0000-0000-000000000001', false),
  ('aaaaaaaa-0002-0000-0000-000000000002'::uuid,
   '11111111-1111-1111-1111-111111111111', 'ev-admin', 'Admin Target Event',
   '{"year":2002,"era":"CE"}'::jsonb,
   'aaaaaaaa-0001-0000-0000-000000000001', false),
  ('aaaaaaaa-0002-0000-0000-000000000003'::uuid,
   '11111111-1111-1111-1111-111111111111', 'ev-editor', 'Editor Target Event',
   '{"year":2003,"era":"CE"}'::jsonb,
   'aaaaaaaa-0001-0000-0000-000000000001', false);

select plan(8);

-- ============================================================================
-- Trigger wiring exists
-- ============================================================================
select has_function('public', 'guard_event_publish_owner_only',
  'guard_event_publish_owner_only() function exists');
select has_trigger('events', 'guard_event_publish',
  'guard_event_publish trigger exists on events');

-- ============================================================================
-- Owner may publish + unpublish own event
-- ============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
select lives_ok(
  $$update events set published = true, published_at = now()
      where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid$$,
  'owner can PUBLISH own event');
select lives_ok(
  $$update events set published = false, published_at = null
      where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid$$,
  'owner can UNPUBLISH own event');

-- ============================================================================
-- Admin may publish someone else's event
-- ============================================================================
reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
select lives_ok(
  $$update events set published = true, published_at = now()
      where id = 'aaaaaaaa-0002-0000-0000-000000000002'::uuid$$,
  'admin can PUBLISH any event');

-- ============================================================================
-- Collaborator-editor: content edit OK, publish flip rejected
-- ============================================================================
reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"44444444-4444-4444-4444-444444444444"}';
select lives_ok(
  $$update events set summary = 'edited by collab-editor'
      where id = 'aaaaaaaa-0002-0000-0000-000000000003'::uuid$$,
  'collaborator-editor can edit non-publish columns');
select throws_ok(
  $$update events set published = true, published_at = now()
      where id = 'aaaaaaaa-0002-0000-0000-000000000003'::uuid$$,
  '42501', null,
  'collaborator-editor CANNOT publish an event');
select throws_ok(
  $$update events set published_at = now()
      where id = 'aaaaaaaa-0002-0000-0000-000000000003'::uuid$$,
  '42501', null,
  'collaborator-editor CANNOT set published_at directly');

reset role; reset request.jwt.claims;

select * from finish();
rollback;
