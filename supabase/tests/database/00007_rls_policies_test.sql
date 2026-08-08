-- pgTAP tests for 00007_rls_policies.sql (issue #19 — RLS policies)
--
-- Strategy: seed 5 users (owner, other, admin, collab_editor, collab_viewer)
-- and a mix of published / private content owned by `owner`, then impersonate
-- each role via `SET LOCAL ROLE` + `SET LOCAL request.jwt.claims` and verify
-- row visibility and write outcomes.
--
-- IMPORTANT: tests must `SET LOCAL ROLE authenticated` (or `anon`) to apply
-- RLS. The default `postgres` test role bypasses RLS entirely.
--
-- For UPDATE/DELETE tests, RLS silently filters rather than throwing — so the
-- pattern is: switch to the role under test, run the write, switch BACK to
-- postgres, then SELECT to observe whether the row was actually changed.
begin;
create extension if not exists pgtap with schema extensions;

-- ============================================================================
-- Seed users + profiles + content (runs as postgres, RLS bypassed)
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role,
                        raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'owner@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Owner","last_name":"User"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'other@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Other","last_name":"User"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'admin@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Admin","last_name":"User"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'editor@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Editor","last_name":"User"}'::jsonb),
  ('55555555-5555-5555-5555-555555555555'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'viewer@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Viewer","last_name":"User"}'::jsonb);

update profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

insert into timelines (id, user_id, slug, title, temporal_data, published) values
  ('aaaaaaaa-0001-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'tl-shared', 'Shared Timeline',
   '{"year":2000,"era":"CE"}'::jsonb, false);

insert into timeline_collaborators (timeline_id, user_id, role) values
  ('aaaaaaaa-0001-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'editor'),
  ('aaaaaaaa-0001-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'viewer');

insert into events (id, user_id, slug, title, temporal_data, timeline_id, published) values
  ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'ev-public', 'Public Event',
   '{"year":2001,"era":"CE"}'::jsonb,
   'aaaaaaaa-0001-0000-0000-000000000001', true),
  ('aaaaaaaa-0002-0000-0000-000000000002'::uuid,
   '11111111-1111-1111-1111-111111111111', 'ev-private', 'Private Event',
   '{"year":2002,"era":"CE"}'::jsonb,
   'aaaaaaaa-0001-0000-0000-000000000001', false),
  -- Dedicated delete-target so admin-DELETE test doesn't break junction-read tests
  ('aaaaaaaa-0002-0000-0000-000000000099'::uuid,
   '11111111-1111-1111-1111-111111111111', 'ev-delete-target', 'Delete Target',
   '{"year":2099,"era":"CE"}'::jsonb,
   'aaaaaaaa-0001-0000-0000-000000000001', false);

insert into characters (id, user_id, slug, name, character_type, published) values
  ('aaaaaaaa-0004-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'char-public', 'Public Character', 'human', true),
  ('aaaaaaaa-0004-0000-0000-000000000002'::uuid,
   '11111111-1111-1111-1111-111111111111', 'char-private', 'Private Character', 'human', false);

insert into categories (id, user_id, slug, title) values
  ('aaaaaaaa-0006-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'cat-1', 'Category One');

insert into media (id, user_id, slug, storage_path, url, media_type) values
  ('aaaaaaaa-0007-0000-0000-000000000001'::uuid,
   '11111111-1111-1111-1111-111111111111', 'media-1', '/p', '/u', 'image');

insert into event_categories (event_id, category_id) values
  ('aaaaaaaa-0002-0000-0000-000000000001', 'aaaaaaaa-0006-0000-0000-000000000001'),
  ('aaaaaaaa-0002-0000-0000-000000000002', 'aaaaaaaa-0006-0000-0000-000000000001');

-- Vocabulary fixture: 00029 replaced the relationship_type CHECK with an FK to
-- relationship_types, which 00029 leaves empty (content ships in 00030).
insert into relationship_categories (key, label) values ('social', 'Social')
  on conflict (key) do nothing;
insert into relationship_types (key, label, category_key) values
  ('family', 'Family', 'social')
  on conflict (key) do nothing;

insert into character_relationships (user_id, character_id, related_character_id, relationship_type)
values ('11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-0004-0000-0000-000000000001',
        'aaaaaaaa-0004-0000-0000-000000000002',
        'family');

insert into notifications (user_id, type, title, body) values
  ('11111111-1111-1111-1111-111111111111', 'system_message', 'Hello owner', 'body');

insert into content_reports (reporter_id, entity_type, entity_id, reason) values
  ('11111111-1111-1111-1111-111111111111', 'timeline',
   'aaaaaaaa-0001-0000-0000-000000000001', 'inappropriate');

select plan(46);

-- ============================================================================
-- Helper: set role + claims atomically. Always reset both before each switch.
-- ============================================================================

-- ============================================================================
-- READ tests
-- ============================================================================

-- ---- events: 5 visibilities + anon ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
select is(
  (select count(*) from events
    where id in ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
                 'aaaaaaaa-0002-0000-0000-000000000002'::uuid)),
  2::bigint,
  'owner sees both own events (private + published)'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is(
  (select count(*) from events
    where id in ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
                 'aaaaaaaa-0002-0000-0000-000000000002'::uuid)),
  1::bigint,
  'other user sees only published event'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
select is(
  (select count(*) from events
    where id in ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
                 'aaaaaaaa-0002-0000-0000-000000000002'::uuid)),
  2::bigint,
  'admin sees all events (published + private)'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-5555-5555-555555555555"}';
select is(
  (select count(*) from events
    where id in ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
                 'aaaaaaaa-0002-0000-0000-000000000002'::uuid)),
  2::bigint,
  'collaborator-viewer sees all shared-timeline events'
);

reset role; reset request.jwt.claims;
set local role anon;
select is(
  (select count(*) from events
    where id in ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
                 'aaaaaaaa-0002-0000-0000-000000000002'::uuid)),
  1::bigint,
  'anon sees only published events'
);

-- ---- timelines: owner / other / collab-viewer / anon ----
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
select is(
  (select count(*) from timelines where id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid),
  1::bigint, 'owner sees own private timeline'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is(
  (select count(*) from timelines where id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid),
  0::bigint, 'other user does NOT see owner''s private timeline'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-5555-5555-555555555555"}';
select is(
  (select count(*) from timelines where id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid),
  1::bigint, 'collaborator-viewer sees shared timeline'
);

reset role; reset request.jwt.claims;
set local role anon;
select is(
  (select count(*) from timelines where id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid),
  0::bigint, 'anon does NOT see private timeline'
);

-- ---- characters: published-only for other user ----
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is(
  (select count(*) from characters
    where id in ('aaaaaaaa-0004-0000-0000-000000000001'::uuid,
                 'aaaaaaaa-0004-0000-0000-000000000002'::uuid)),
  1::bigint, 'other user sees only published character'
);

-- ---- categories / media / profiles globally readable ----
reset role; reset request.jwt.claims;
set local role anon;
select is(
  (select count(*) from categories where id = 'aaaaaaaa-0006-0000-0000-000000000001'::uuid),
  1::bigint, 'anon can read categories (globally readable)'
);
select is(
  (select count(*) from media where id = 'aaaaaaaa-0007-0000-0000-000000000001'::uuid),
  1::bigint, 'anon can read media (globally readable)'
);
select is(
  (select count(*) from profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
  1::bigint, 'anon can read profiles (globally readable per AC)'
);

-- ============================================================================
-- WRITE tests (UPDATE/DELETE silently filter; check via postgres role after)
-- ============================================================================

-- ---- events INSERT with own user_id (other user) ----
reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select lives_ok(
  $$insert into events (user_id, slug, title, temporal_data)
    values ('22222222-2222-2222-2222-222222222222', 'other-event', 'OE',
            '{"year":2010,"era":"CE"}'::jsonb)$$,
  'other user can INSERT events with own user_id'
);

-- ---- events INSERT with someone else's user_id is blocked ----
select throws_ok(
  $$insert into events (user_id, slug, title, temporal_data)
    values ('11111111-1111-1111-1111-111111111111', 'spoof', 'spoof',
            '{"year":2010,"era":"CE"}'::jsonb)$$,
  '42501', null,
  'other user CANNOT INSERT events with someone else''s user_id'
);

-- ---- events UPDATE: owner / other / collab-editor / collab-viewer ----
reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
update events set title = 'owner update'
  where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid;
reset role; reset request.jwt.claims;
select is(
  (select title from events where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid),
  'owner update'::varchar, 'owner can UPDATE own event'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
update events set title = 'hijack'
  where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid;
reset role; reset request.jwt.claims;
select isnt(
  (select title from events where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid),
  'hijack'::varchar, 'other user UPDATE on owner''s event is filtered out'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"44444444-4444-4444-4444-444444444444"}';
update events set summary = 'edited by collab-editor'
  where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid;
reset role; reset request.jwt.claims;
select is(
  (select summary from events where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid),
  'edited by collab-editor'::text, 'collaborator-editor can UPDATE shared event'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-5555-5555-555555555555"}';
update events set summary = 'viewer hijack'
  where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid;
reset role; reset request.jwt.claims;
select isnt(
  (select summary from events where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid),
  'viewer hijack'::text, 'collaborator-viewer CANNOT UPDATE shared event'
);

-- ---- events DELETE: collab-editor (denied) / admin (allowed) ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"44444444-4444-4444-4444-444444444444"}';
delete from events where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid;
reset role; reset request.jwt.claims;
select is(
  (select count(*) from events where id = 'aaaaaaaa-0002-0000-0000-000000000001'::uuid),
  1::bigint, 'collaborator-editor CANNOT DELETE event (owner/admin only)'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
delete from events where id = 'aaaaaaaa-0002-0000-0000-000000000099'::uuid;
reset role; reset request.jwt.claims;
select is(
  (select count(*) from events where id = 'aaaaaaaa-0002-0000-0000-000000000099'::uuid),
  0::bigint, 'admin can DELETE any event'
);

-- ---- timelines UPDATE: collab-editor cannot update timeline itself ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"44444444-4444-4444-4444-444444444444"}';
update timelines set title = 'editor hijack'
  where id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid;
reset role; reset request.jwt.claims;
select isnt(
  (select title from timelines where id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid),
  'editor hijack'::varchar, 'collaborator-editor CANNOT UPDATE timeline itself'
);

-- ---- characters INSERT with someone else's user_id is rejected ----
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select throws_ok(
  $$insert into characters (user_id, slug, name, character_type)
    values ('11111111-1111-1111-1111-111111111111', 'spoof', 'X', 'human')$$,
  '42501', null,
  'characters INSERT with someone else''s user_id is rejected'
);

-- ============================================================================
-- JUNCTION TABLES
-- ============================================================================

-- ---- event_categories read via parent ----
reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is(
  (select count(*) from event_categories
    where event_id in ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
                       'aaaaaaaa-0002-0000-0000-000000000002'::uuid)),
  1::bigint,
  'event_categories: other user sees junction for visible (public) event only'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-5555-5555-555555555555"}';
select is(
  (select count(*) from event_categories
    where event_id in ('aaaaaaaa-0002-0000-0000-000000000001'::uuid,
                       'aaaaaaaa-0002-0000-0000-000000000002'::uuid)),
  2::bigint,
  'event_categories: collaborator sees junctions for both shared-timeline events'
);

-- ---- event_categories write: other user can attach to their own event ----
reset role; reset request.jwt.claims;
insert into events (id, user_id, slug, title, temporal_data) values
  ('bbbbbbbb-0002-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222', 'other-ev', 'Other Event',
   '{"year":2020,"era":"CE"}'::jsonb);

set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select lives_ok(
  $$insert into event_categories (event_id, category_id)
    values ('bbbbbbbb-0002-0000-0000-000000000001',
            'aaaaaaaa-0006-0000-0000-000000000001')$$,
  'event_categories: user can attach existing global category to their own event'
);

-- ---- event_categories write: blocked when event isn't owned ----
-- The owner's `aaaaaaaa-0002-...000002` (private event) row already has an event_categories
-- entry from seed; try to insert a duplicate from the other user — RLS rejects.
-- Use a NEW category to avoid duplicate-key collision.
reset role; reset request.jwt.claims;
insert into categories (id, user_id, slug, title) values
  ('bbbbbbbb-0006-0000-0000-000000000001'::uuid,
   '22222222-2222-2222-2222-222222222222', 'cat-2', 'Category Two');

set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select throws_ok(
  $$insert into event_categories (event_id, category_id)
    values ('aaaaaaaa-0002-0000-0000-000000000001',
            'bbbbbbbb-0006-0000-0000-000000000001')$$,
  '42501', null,
  'event_categories: other user CANNOT attach category to owner''s event'
);

-- ============================================================================
-- character_relationships
-- ============================================================================

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is(
  (select count(*) from character_relationships),
  0::bigint, 'other user CANNOT see owner''s character_relationships'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
select is(
  (select count(*) from character_relationships),
  1::bigint, 'owner sees own character_relationships'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
select is(
  (select count(*) from character_relationships),
  1::bigint, 'admin sees all character_relationships'
);

-- ============================================================================
-- timeline_collaborators (the table that originally caused infinite recursion)
-- ============================================================================

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
select is(
  (select count(*) from timeline_collaborators
    where timeline_id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid),
  2::bigint, 'timeline owner sees both collaborators'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-5555-5555-555555555555"}';
select ok(
  (select count(*) from timeline_collaborators
    where user_id = '55555555-5555-5555-5555-555555555555'::uuid) >= 1,
  'collaborator-viewer sees own collaborator row'
);

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is(
  (select count(*) from timeline_collaborators
    where timeline_id = 'aaaaaaaa-0001-0000-0000-000000000001'::uuid),
  0::bigint, 'unrelated user sees no collaborator rows for owner''s timeline'
);

-- ============================================================================
-- notifications
-- ============================================================================

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
select is((select count(*) from notifications), 1::bigint, 'owner sees own notification');

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is((select count(*) from notifications), 0::bigint, 'other user does NOT see owner''s notification');

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
select is((select count(*) from notifications), 1::bigint, 'admin sees all notifications');

-- ============================================================================
-- content_reports
-- ============================================================================

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
select is((select count(*) from content_reports), 1::bigint, 'reporter sees own report');

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select is((select count(*) from content_reports), 0::bigint, 'other user does NOT see someone else''s report');

reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
select is((select count(*) from content_reports), 1::bigint, 'admin sees all reports');

-- INSERT own
reset role; reset request.jwt.claims;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
select lives_ok(
  $$insert into content_reports (reporter_id, entity_type, entity_id, reason)
    values ('22222222-2222-2222-2222-222222222222', 'event',
            'aaaaaaaa-0002-0000-0000-000000000001'::uuid, 'spam')$$,
  'authenticated user can INSERT content_reports with own reporter_id'
);

-- Cannot spoof reporter_id
select throws_ok(
  $$insert into content_reports (reporter_id, entity_type, entity_id, reason)
    values ('11111111-1111-1111-1111-111111111111', 'event',
            'aaaaaaaa-0002-0000-0000-000000000001'::uuid, 'spam')$$,
  '42501', null,
  'content_reports INSERT cannot spoof reporter_id'
);

-- Non-admin UPDATE filtered out
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
update content_reports set status = 'reviewed'
  where reporter_id = '11111111-1111-1111-1111-111111111111'::uuid;
reset role; reset request.jwt.claims;
select isnt(
  (select status from content_reports
    where reporter_id = '11111111-1111-1111-1111-111111111111'::uuid),
  'reviewed'::varchar, 'non-admin UPDATE on content_reports is filtered out'
);

-- Admin UPDATE works
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
update content_reports set status = 'reviewed'
  where reporter_id = '11111111-1111-1111-1111-111111111111'::uuid;
reset role; reset request.jwt.claims;
select is(
  (select status from content_reports
    where reporter_id = '11111111-1111-1111-1111-111111111111'::uuid),
  'reviewed'::varchar, 'admin can UPDATE content_reports'
);

-- ============================================================================
-- profiles UPDATE
-- ============================================================================

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';
update profiles set bio = 'self update'
  where id = '11111111-1111-1111-1111-111111111111'::uuid;
reset role; reset request.jwt.claims;
select is(
  (select bio from profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
  'self update'::text, 'user can UPDATE own profile'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222"}';
update profiles set bio = 'cross-user hijack'
  where id = '11111111-1111-1111-1111-111111111111'::uuid;
reset role; reset request.jwt.claims;
select isnt(
  (select bio from profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
  'cross-user hijack'::text, 'user CANNOT UPDATE another user''s profile'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333"}';
update profiles set bio = 'admin update'
  where id = '11111111-1111-1111-1111-111111111111'::uuid;
reset role; reset request.jwt.claims;
select is(
  (select bio from profiles where id = '11111111-1111-1111-1111-111111111111'::uuid),
  'admin update'::text, 'admin can UPDATE any profile'
);

reset role; reset request.jwt.claims;
select * from finish();
rollback;
