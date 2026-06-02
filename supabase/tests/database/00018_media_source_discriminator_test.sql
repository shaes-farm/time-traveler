-- pgTAP tests for 00018_media_source_discriminator.sql (issue #179 — add the
-- media.source upload/external discriminator, make storage_path nullable, and
-- guard the two with a CHECK constraint).
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

-- ============================================================================
-- Column presence, type, nullability, default
-- ============================================================================
select has_column(
  'public', 'media', 'source',
  'media.source column exists'
);

select col_type_is(
  'public', 'media', 'source', 'character varying(20)',
  'media.source is varchar(20)'
);

select col_not_null(
  'public', 'media', 'source',
  'media.source is NOT NULL'
);

select col_default_is(
  'public', 'media', 'source', 'upload',
  'media.source defaults to upload'
);

select col_is_null(
  'public', 'media', 'storage_path',
  'media.storage_path is now nullable'
);

-- ============================================================================
-- Test fixtures
-- ============================================================================
insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('bb000000-0000-0000-0000-000000000001'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'media-source@local', '', now(), now(), now(),
          'authenticated', 'authenticated');

-- ============================================================================
-- Happy paths: upload with a storage_path; external with NULL storage_path
-- ============================================================================
select lives_ok(
  $$insert into media (user_id, slug, source, storage_path, url, media_type)
    values ('bb000000-0000-0000-0000-000000000001', 'ms-upload',
            'upload', 'bb000000-0000-0000-0000-000000000001/file.jpg',
            'http://x/file.jpg', 'image')$$,
  'upload media with a storage_path is accepted'
);

select lives_ok(
  $$insert into media (user_id, slug, source, storage_path, url, media_type)
    values ('bb000000-0000-0000-0000-000000000001', 'ms-external',
            'external', null, 'https://archive.org/img.jpg', 'image')$$,
  'external media with NULL storage_path is accepted'
);

-- ============================================================================
-- Guard CHECK: upload without a storage_path, external with one, both rejected
-- ============================================================================
select throws_ok(
  $$insert into media (user_id, slug, source, storage_path, url, media_type)
    values ('bb000000-0000-0000-0000-000000000001', 'ms-bad-upload',
            'upload', null, 'http://x/y.jpg', 'image')$$,
  '23514', null,
  'media_source_storage_ck rejects upload with NULL storage_path'
);

select throws_ok(
  $$insert into media (user_id, slug, source, storage_path, url, media_type)
    values ('bb000000-0000-0000-0000-000000000001', 'ms-bad-external',
            'external', '/some/path', 'https://x/y.jpg', 'image')$$,
  '23514', null,
  'media_source_storage_ck rejects external with non-NULL storage_path'
);

-- ============================================================================
-- Enum CHECK: an unknown source value is rejected
-- ============================================================================
select throws_ok(
  $$insert into media (user_id, slug, source, storage_path, url, media_type)
    values ('bb000000-0000-0000-0000-000000000001', 'ms-bogus',
            'bogus', '/some/path', 'http://x/z.jpg', 'image')$$,
  '23514', null,
  'source CHECK rejects values outside (upload, external)'
);

select * from finish();
rollback;
