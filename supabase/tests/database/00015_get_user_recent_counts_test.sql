-- pgTAP tests for 00015_get_user_recent_counts.sql (issue #41 — dashboard "▴ N new" badge)
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

-- ============================================================================
-- Function signature, volatility, and security mode
-- ============================================================================

select has_function('public', 'get_user_recent_counts',
  array['uuid', 'integer'],
  'get_user_recent_counts function exists');

select volatility_is('public', 'get_user_recent_counts',
  array['uuid', 'integer'], 'stable',
  'get_user_recent_counts is STABLE');

select is(
  (select prosecdef from pg_proc
    where proname='get_user_recent_counts' and pronamespace='public'::regnamespace),
  true,
  'get_user_recent_counts is SECURITY DEFINER'
);

-- ============================================================================
-- Fixture data
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('dddddddd-0000-0000-0000-dddddddddddd'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'recent@local', '', now(), now(), now(), 'authenticated', 'authenticated');

-- Three timelines: two created NOW (inside the 7-day window), one created
-- 8 days ago (outside the default window, inside a 30-day window).
insert into timelines (id, user_id, slug, title, temporal_data, created_at) values
  ('dddddddd-0001-0000-0000-000000000001'::uuid,
   'dddddddd-0000-0000-0000-dddddddddddd',
   'tl-fresh-1', 'Fresh 1', '{"year":1000,"era":"CE"}'::jsonb,
   now()),
  ('dddddddd-0001-0000-0000-000000000002'::uuid,
   'dddddddd-0000-0000-0000-dddddddddddd',
   'tl-fresh-2', 'Fresh 2', '{"year":1000,"era":"CE"}'::jsonb,
   now()),
  ('dddddddd-0001-0000-0000-000000000003'::uuid,
   'dddddddd-0000-0000-0000-dddddddddddd',
   'tl-stale', 'Stale (8 days old)', '{"year":1000,"era":"CE"}'::jsonb,
   now() - interval '8 days');

-- One event from NOW, one from 8 days ago.
insert into events (id, user_id, slug, title, temporal_data, created_at) values
  ('dddddddd-0002-0000-0000-000000000001'::uuid,
   'dddddddd-0000-0000-0000-dddddddddddd',
   'ev-fresh', 'Fresh event', '{"year":1000,"era":"CE"}'::jsonb,
   now()),
  ('dddddddd-0002-0000-0000-000000000002'::uuid,
   'dddddddd-0000-0000-0000-dddddddddddd',
   'ev-stale', 'Stale event', '{"year":1000,"era":"CE"}'::jsonb,
   now() - interval '8 days');

-- One character from NOW only.
insert into characters (id, user_id, slug, name, character_type, created_at) values
  ('dddddddd-0004-0000-0000-000000000001'::uuid,
   'dddddddd-0000-0000-0000-dddddddddddd',
   'char-fresh', 'Fresh character', 'human', now());

-- ============================================================================
-- Default window (7 days): excludes the 8-day-old rows
-- ============================================================================

select is(
  (select count(*) from public.get_user_recent_counts(
    'dddddddd-0000-0000-0000-dddddddddddd'::uuid)),
  7::bigint, 'get_user_recent_counts returns one row per entity type (7 total)'
);

select is(
  (select count from public.get_user_recent_counts(
    'dddddddd-0000-0000-0000-dddddddddddd'::uuid)
    where entity_type = 'timelines'),
  2::bigint, 'default 7-day window counts the 2 fresh timelines and excludes the 8-day-old one'
);

select is(
  (select count from public.get_user_recent_counts(
    'dddddddd-0000-0000-0000-dddddddddddd'::uuid)
    where entity_type = 'events'),
  1::bigint, 'default 7-day window counts the 1 fresh event and excludes the 8-day-old one'
);

select is(
  (select count from public.get_user_recent_counts(
    'dddddddd-0000-0000-0000-dddddddddddd'::uuid)
    where entity_type = 'characters'),
  1::bigint, 'default 7-day window counts the 1 fresh character'
);

-- ============================================================================
-- Custom window (30 days): includes the 8-day-old rows
-- ============================================================================

select is(
  (select count from public.get_user_recent_counts(
    'dddddddd-0000-0000-0000-dddddddddddd'::uuid, 30)
    where entity_type = 'timelines'),
  3::bigint, '30-day window includes the 8-day-old timeline'
);

select is(
  (select count from public.get_user_recent_counts(
    'dddddddd-0000-0000-0000-dddddddddddd'::uuid, 30)
    where entity_type = 'events'),
  2::bigint, '30-day window includes the 8-day-old event'
);

-- ============================================================================
-- Unknown user → all zeros
-- ============================================================================

select is(
  (select sum(count)::bigint from public.get_user_recent_counts(
    '00000000-0000-0000-0000-000000000000'::uuid)),
  0::bigint, 'get_user_recent_counts returns all zeros for an unknown user_id'
);

-- ============================================================================
-- SECURITY DEFINER bypasses RLS — anon can call and still see accurate counts
-- ============================================================================

set local role anon;
select is(
  (select count from public.get_user_recent_counts(
    'dddddddd-0000-0000-0000-dddddddddddd'::uuid)
    where entity_type = 'timelines'),
  2::bigint, 'anon can call get_user_recent_counts and SECURITY DEFINER bypasses RLS'
);

reset role;
select * from finish();
rollback;
