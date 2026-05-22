-- pgTAP tests for 00001_initial_schema.sql (issue #13 — core tables)
begin;
create extension if not exists pgtap with schema extensions;

select plan(46);

-- ============================================================================
-- Tables exist
-- ============================================================================
select has_table('public', 'profiles',   'profiles table exists');
select has_table('public', 'characters', 'characters table exists');
select has_table('public', 'timelines',  'timelines table exists');
select has_table('public', 'periods',    'periods table exists');
select has_table('public', 'events',     'events table exists');
select has_table('public', 'stories',    'stories table exists');
select has_table('public', 'categories', 'categories table exists');
select has_table('public', 'media',      'media table exists');

-- ============================================================================
-- Extensions and helper functions
-- ============================================================================
select has_extension('pgcrypto', 'pgcrypto extension is installed');
select has_function('public', 'immutable_array_to_string', array['text[]','text'],
  'immutable_array_to_string helper function exists');
select volatility_is('public', 'immutable_array_to_string', array['text[]','text'], 'immutable',
  'immutable_array_to_string is marked IMMUTABLE');
select has_function('public', 'handle_updated_at', 'handle_updated_at trigger function exists');

-- ============================================================================
-- updated_at triggers (8 tables)
-- ============================================================================
select has_trigger('public', 'profiles',   'set_updated_at', 'updated_at trigger on profiles');
select has_trigger('public', 'characters', 'set_updated_at', 'updated_at trigger on characters');
select has_trigger('public', 'timelines',  'set_updated_at', 'updated_at trigger on timelines');
select has_trigger('public', 'periods',    'set_updated_at', 'updated_at trigger on periods');
select has_trigger('public', 'events',     'set_updated_at', 'updated_at trigger on events');
select has_trigger('public', 'stories',    'set_updated_at', 'updated_at trigger on stories');
select has_trigger('public', 'categories', 'set_updated_at', 'updated_at trigger on categories');
select has_trigger('public', 'media',      'set_updated_at', 'updated_at trigger on media');

-- ============================================================================
-- RLS enabled on every core table
-- ============================================================================
select is(
  (select count(*) from pg_tables
    where schemaname = 'public'
      and tablename in ('profiles','characters','timelines','periods','events','stories','categories','media')
      and rowsecurity),
  8::bigint,
  'all 8 core tables have RLS enabled'
);

-- ============================================================================
-- profiles_username_idx is partial (WHERE username IS NOT NULL)
-- ============================================================================
select index_is_unique('public', 'profiles', 'profiles_username_idx',
  'profiles_username_idx is unique');
select ok(
  (select pg_get_indexdef(indexrelid) like '%WHERE%username IS NOT NULL%'
     from pg_index
     where indexrelid = 'public.profiles_username_idx'::regclass),
  'profiles_username_idx is partial on (username IS NOT NULL)'
);

-- ============================================================================
-- CHECK constraints reject bad values
-- ============================================================================
-- Seed a test user (profile auto-created by #16 trigger)
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'check@local', '', now(), now(), now(), 'authenticated', 'authenticated');

select throws_ok(
  $$update profiles set role = 'godmode' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '23514', null,
  'profiles.role CHECK rejects unknown role'
);

select throws_ok(
  $$insert into events (user_id, slug, title, event_type, temporal_data)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bad-type', 'x',
            'time_travel', '{"year":2000,"era":"CE"}'::jsonb)$$,
  '23514', null,
  'events.event_type CHECK rejects unknown type'
);

select throws_ok(
  $$insert into characters (user_id, slug, name, character_type)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bad-char', 'X', 'alien')$$,
  '23514', null,
  'characters.character_type CHECK rejects unknown type'
);

select throws_ok(
  $$insert into timelines (user_id, slug, title, timeline_type, temporal_data)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bad-tl', 'X',
            'futuristic', '{"year":2000,"era":"CE"}'::jsonb)$$,
  '23514', null,
  'timelines.timeline_type CHECK rejects unknown type'
);

select throws_ok(
  $$insert into stories (user_id, slug, title, narrator_type)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bad-st', 'X', 'fourth_wall')$$,
  '23514', null,
  'stories.narrator_type CHECK rejects unknown type'
);

select throws_ok(
  $$insert into media (user_id, slug, storage_path, url, media_type)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bad-m', 'p', 'u', 'hologram')$$,
  '23514', null,
  'media.media_type CHECK rejects unknown type'
);

select throws_ok(
  $$insert into periods (user_id, slug, title, significance, temporal_data)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bad-p', 'X',
            'epic', '{"year":2000,"era":"CE"}'::jsonb)$$,
  '23514', null,
  'periods.significance CHECK rejects unknown value'
);

-- ============================================================================
-- Era conversion → sort_order_years
-- ============================================================================
insert into events (user_id, slug, title, temporal_data)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ce', 'CE event',
          '{"year":1969,"month":7,"day":20,"era":"CE","precision":"exact"}'::jsonb),
         ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bce', 'BCE event',
          '{"year":44,"era":"BCE","precision":"exact"}'::jsonb),
         ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mya', 'MYA event',
          '{"year":66,"era":"MYA","precision":"approximate"}'::jsonb);

select is((select sort_order_years from events where slug='ce'),
          1969::bigint, 'CE 1969 → sort_order_years = 1969');
select is((select sort_order_years from events where slug='bce'),
          -44::bigint, 'BCE 44 → sort_order_years = -44');
select is((select sort_order_years from events where slug='mya'),
          -66000000::bigint, 'MYA 66 → sort_order_years = -66,000,000');

-- ============================================================================
-- computed_start_date populates for CE, NULL for non-CE
-- ============================================================================
select isnt((select computed_start_date from events where slug='ce'), null,
            'computed_start_date populates for CE entry');
select is((select computed_start_date from events where slug='bce'), null,
          'computed_start_date is NULL for BCE entry');
select is((select computed_start_date from events where slug='mya'), null,
          'computed_start_date is NULL for MYA entry');

-- ============================================================================
-- search_vector populates
-- ============================================================================
select isnt((select search_vector from events where slug='ce'), null::tsvector,
            'events.search_vector populates after insert');

insert into characters (user_id, slug, name, character_type, biography, aliases)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'einstein', 'Albert Einstein',
          'human', 'physicist', array['A. Einstein','The Genius']);
select isnt((select search_vector from characters where slug='einstein'), null::tsvector,
            'characters.search_vector populates (including aliases via immutable_array_to_string)');

-- ============================================================================
-- handle_updated_at trigger overrides updated_at on UPDATE
-- (within a single transaction now() doesn't advance, so we verify the trigger
--  replaces a hand-set past value rather than comparing two now() reads)
-- ============================================================================
update events set updated_at = '2020-01-01 00:00:00+00'::timestamptz where slug='ce';
select ok(
  (select updated_at from events where slug='ce') > '2020-01-01 00:00:00+00'::timestamptz,
  'handle_updated_at trigger overrides updated_at on UPDATE'
);

-- ============================================================================
-- ON DELETE behavior — set up FK fixtures
-- ============================================================================
insert into timelines (user_id, slug, title, temporal_data)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tl1', 'TL', '{"year":2000,"era":"CE"}'::jsonb);
update events set timeline_id = (select id from timelines where slug='tl1') where slug='ce';

-- ON DELETE SET NULL: deleting timeline nulls events.timeline_id
delete from timelines where slug='tl1';
select is((select timeline_id from events where slug='ce'), null::uuid,
          'ON DELETE SET NULL on events.timeline_id when timeline removed');

-- subject_character_id SET NULL on timelines
insert into timelines (user_id, slug, title, temporal_data, subject_character_id)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tl2', 'TL2',
          '{"year":2000,"era":"CE"}'::jsonb,
          (select id from characters where slug='einstein'));
delete from characters where slug='einstein';
select is((select subject_character_id from timelines where slug='tl2'), null::uuid,
          'ON DELETE SET NULL on timelines.subject_character_id when character removed');

-- perspective_character_id SET NULL on stories
insert into characters (user_id, slug, name, character_type)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'narrator', 'Narrator', 'human');
insert into stories (user_id, slug, title, perspective_character_id)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'st1', 'S',
          (select id from characters where slug='narrator'));
delete from characters where slug='narrator';
select is((select perspective_character_id from stories where slug='st1'), null::uuid,
          'ON DELETE SET NULL on stories.perspective_character_id when character removed');

-- Slug unique per user: same slug for two users is allowed
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'check2@local', '', now(), now(), now(), 'authenticated', 'authenticated');

select lives_ok(
  $$insert into characters (user_id, slug, name, character_type)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'einstein', 'Other Einstein', 'human')$$,
  'same slug allowed for different users'
);
select throws_ok(
  $$insert into characters (user_id, slug, name, character_type)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'einstein', 'Dup', 'human')$$,
  '23505', null,
  'same slug for same user is rejected'
);

-- ON DELETE CASCADE on user_id: delete auth.users → owned content removed
delete from auth.users where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
select is((select count(*) from events where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
          0::bigint,
          'ON DELETE CASCADE on events.user_id when auth user removed');
select is((select count(*) from profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
          0::bigint,
          'ON DELETE CASCADE on profiles.id when auth user removed');

select * from finish();
rollback;
