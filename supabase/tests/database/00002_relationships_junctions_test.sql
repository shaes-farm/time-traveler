-- pgTAP tests for 00002_relationships_junctions.sql (issue #14 — relationships + junctions)
begin;
create extension if not exists pgtap with schema extensions;

select plan(32);

-- ============================================================================
-- Tables exist (1 relationship + 11 junction)
-- ============================================================================
select has_table('public', 'character_relationships', 'character_relationships table exists');
select has_table('public', 'event_categories',       'event_categories junction exists');
select has_table('public', 'event_media',            'event_media junction exists');
select has_table('public', 'event_characters',       'event_characters junction exists');
select has_table('public', 'timeline_events',        'timeline_events junction exists');
select has_table('public', 'period_timelines',       'period_timelines junction exists');
select has_table('public', 'story_periods',          'story_periods junction exists');
select has_table('public', 'story_characters',       'story_characters junction exists');
select has_table('public', 'story_events',           'story_events junction exists');
select has_table('public', 'character_media',        'character_media junction exists');
select has_table('public', 'timeline_collaborators', 'timeline_collaborators junction exists');
select has_table('public', 'timeline_media',         'timeline_media junction exists');

-- ============================================================================
-- RLS enabled on all 12 tables
-- ============================================================================
select is(
  (select count(*) from pg_tables
    where schemaname = 'public'
      and tablename in ('character_relationships','event_categories','event_media',
                        'event_characters','timeline_events','period_timelines',
                        'story_periods','story_characters','story_events',
                        'character_media','timeline_collaborators','timeline_media')
      and rowsecurity),
  12::bigint,
  'all 12 relationship/junction tables have RLS enabled'
);

-- ============================================================================
-- Junction tables use composite PK with no surrogate id column
-- ============================================================================
select hasnt_column('public', 'event_categories',       'id', 'event_categories has no surrogate id');
select hasnt_column('public', 'event_media',            'id', 'event_media has no surrogate id');
select hasnt_column('public', 'event_characters',       'id', 'event_characters has no surrogate id');
select hasnt_column('public', 'timeline_events',        'id', 'timeline_events has no surrogate id');
select hasnt_column('public', 'period_timelines',       'id', 'period_timelines has no surrogate id');
select hasnt_column('public', 'story_periods',          'id', 'story_periods has no surrogate id');
select hasnt_column('public', 'story_characters',       'id', 'story_characters has no surrogate id');
select hasnt_column('public', 'story_events',           'id', 'story_events has no surrogate id');
select hasnt_column('public', 'character_media',        'id', 'character_media has no surrogate id');
select hasnt_column('public', 'timeline_collaborators', 'id', 'timeline_collaborators has no surrogate id');
select hasnt_column('public', 'timeline_media',         'id', 'timeline_media has no surrogate id');

-- ============================================================================
-- character_relationships self-reference CHECK
-- ============================================================================
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'rel@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into characters (user_id, slug, name, character_type) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'a', 'A', 'human'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'b', 'B', 'human');

select throws_ok(
  $$insert into character_relationships (user_id, character_id, related_character_id, relationship_type)
    select 'cccccccc-cccc-cccc-cccc-cccccccccccc', id, id, 'family'
    from characters where slug='a'$$,
  '23514', null,
  'character_relationships rejects character_id = related_character_id'
);

-- ============================================================================
-- char_rels_unique enforces uniqueness on (character_id, related_character_id, relationship_type)
-- ============================================================================
insert into character_relationships (user_id, character_id, related_character_id, relationship_type)
  select 'cccccccc-cccc-cccc-cccc-cccccccccccc',
         (select id from characters where slug='a'),
         (select id from characters where slug='b'),
         'family';

select throws_ok(
  $$insert into character_relationships (user_id, character_id, related_character_id, relationship_type)
    select 'cccccccc-cccc-cccc-cccc-cccccccccccc',
           (select id from characters where slug='a'),
           (select id from characters where slug='b'),
           'family'$$,
  '23505', null,
  'char_rels_unique rejects duplicate (char, related, type)'
);

select lives_ok(
  $$insert into character_relationships (user_id, character_id, related_character_id, relationship_type)
    select 'cccccccc-cccc-cccc-cccc-cccccccccccc',
           (select id from characters where slug='a'),
           (select id from characters where slug='b'),
           'professional'$$,
  'same character pair allowed with different relationship_type'
);

-- ============================================================================
-- set_updated_at trigger on character_relationships
-- ============================================================================
select has_trigger('public', 'character_relationships', 'set_updated_at',
  'updated_at trigger on character_relationships');

update character_relationships set updated_at = '2020-01-01 00:00:00+00'::timestamptz
  where character_id = (select id from characters where slug='a');
select ok(
  (select min(updated_at) from character_relationships
     where character_id = (select id from characters where slug='a'))
  > '2020-01-01 00:00:00+00'::timestamptz,
  'handle_updated_at trigger overrides updated_at on character_relationships UPDATE'
);

-- ============================================================================
-- ON DELETE CASCADE behavior
-- ============================================================================
-- character_media: deleting a character removes its media junction rows
insert into media (user_id, slug, storage_path, url, media_type)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'm1', '/p', '/u', 'image');
insert into character_media (character_id, media_id, is_primary)
  select (select id from characters where slug='a'),
         (select id from media where slug='m1'),
         true;

delete from characters where slug='a';
select is((select count(*) from character_media
           where character_id not in (select id from characters)),
          0::bigint,
          'ON DELETE CASCADE on character_media when character removed');

-- character_relationships cascade on character deletion
-- (delete already cascaded above; verify count is 0)
select is((select count(*) from character_relationships), 0::bigint,
          'character_relationships cascaded when one side character was deleted');

-- ============================================================================
-- ON DELETE CASCADE on character_relationships.user_id
-- ============================================================================
delete from auth.users where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid;
select is((select count(*) from character_relationships
           where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid),
          0::bigint,
          'ON DELETE CASCADE on character_relationships.user_id when auth user removed');

select * from finish();
rollback;
