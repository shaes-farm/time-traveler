-- pgTAP tests for 00012_character_media_single_primary.sql (issue #125)
-- Verifies that at most one is_primary = true row per character_id is enforced.
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

-- ============================================================================
-- Index exists
-- ============================================================================
select has_index(
  'public', 'character_media', 'character_media_one_primary',
  'character_media_one_primary partial unique index exists'
);

-- ============================================================================
-- Test fixtures
-- ============================================================================
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('aa000000-0000-0000-0000-000000000001'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'primary@local', '', now(), now(), now(), 'authenticated', 'authenticated');

insert into characters (user_id, slug, name, character_type) values
  ('aa000000-0000-0000-0000-000000000001', 'cm-char-a', 'CM Char A', 'human');

insert into media (user_id, slug, storage_path, url, media_type) values
  ('aa000000-0000-0000-0000-000000000001', 'cm-media-1', '/path/1', 'http://x/1', 'image'),
  ('aa000000-0000-0000-0000-000000000001', 'cm-media-2', '/path/2', 'http://x/2', 'image');

-- Insert first primary row — must succeed.
insert into character_media (character_id, media_id, is_primary)
  select
    (select id from characters where slug = 'cm-char-a'),
    (select id from media where slug = 'cm-media-1'),
    true;

-- ============================================================================
-- Uniqueness enforcement: second is_primary = true for same character_id fails
-- ============================================================================
select throws_ok(
  $$insert into character_media (character_id, media_id, is_primary)
    select
      (select id from characters where slug = 'cm-char-a'),
      (select id from media       where slug = 'cm-media-2'),
      true$$,
  '23505', null,
  'character_media_one_primary rejects second is_primary = true for same character_id'
);

-- ============================================================================
-- Negative path: is_primary = false alongside an existing primary is allowed
-- ============================================================================
select lives_ok(
  $$insert into character_media (character_id, media_id, is_primary)
    select
      (select id from characters where slug = 'cm-char-a'),
      (select id from media       where slug = 'cm-media-2'),
      false$$,
  'second row with is_primary = false for same character_id is allowed'
);

-- ============================================================================
-- Negative path: two non-primary rows for the same character_id are allowed
-- ============================================================================
select lives_ok(
  $$update character_media
    set is_primary = false
    where character_id = (select id from characters where slug = 'cm-char-a')
      and media_id     = (select id from media       where slug = 'cm-media-1')$$,
  'unsetting primary flag succeeds without error'
);

select * from finish();
rollback;
