-- pgTAP tests for 00024_fix_storage_insert_policies.sql (issue #290 — Storage
-- INSERT policies block all authenticated uploads under Storage API v1.60+).
--
-- Background: 00009 put a (metadata->>'size')::bigint <= 5242880 WITH CHECK on
-- the three INSERT policies. Storage API v1.60+ inserts the storage.objects row
-- with metadata = NULL and populates size afterward, so the check fired on
-- INSERT against NULL metadata, evaluated to NULL (not true), and rejected ALL
-- authenticated uploads with 403. 00024 drops the size check; the bucket-level
-- file_size_limit = 5242880 remains the real (HTTP 413) enforcement.
--
-- This test guards the fix two ways:
--   1. STRUCTURAL — the broken metadata/size check is gone and stays gone.
--   2. BEHAVIORAL — an authenticated INSERT with metadata = NULL (the exact
--      v1.60+ scenario) succeeds.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

-- ============================================================================
-- STRUCTURAL: the (metadata->>'size') <= 5242880 check is gone from all three
-- INSERT policies and must not reappear.
-- ============================================================================

select ok(
  (select with_check not like '%5242880%' and with_check not like '%metadata%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='media_insert'),
  'media_insert WITH CHECK no longer references metadata or the 5MB literal'
);
select ok(
  (select with_check not like '%5242880%' and with_check not like '%metadata%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='avatars_insert'),
  'avatars_insert WITH CHECK no longer references metadata or the 5MB literal'
);
select ok(
  (select with_check not like '%5242880%' and with_check not like '%metadata%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='exports_insert'),
  'exports_insert WITH CHECK no longer references metadata or the 5MB literal'
);

-- media / avatars INSERT now gate on bucket_id alone.
select ok(
  (select qual is null and with_check like '%bucket_id%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='media_insert'),
  'media_insert gates on bucket_id only'
);
select ok(
  (select qual is null and with_check like '%bucket_id%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='avatars_insert'),
  'avatars_insert gates on bucket_id only'
);

-- exports INSERT retains its owner-prefix guard ((foldername(name))[1] = uid).
select ok(
  (select with_check like '%foldername%' and with_check like '%auth.uid()%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='exports_insert'),
  'exports_insert retains the owner-prefix guard (foldername + auth.uid())'
);

-- ============================================================================
-- The real enforcement after 00024: bucket-level file_size_limit stays at 5MB
-- (the Storage API returns HTTP 413 before the row is ever written).
-- ============================================================================

select is(
  (select count(*)::bigint from storage.buckets
    where id in ('media','avatars','exports') and file_size_limit = 5242880),
  3::bigint,
  'all 3 buckets still enforce the 5MB file_size_limit (real HTTP-413 guard)'
);

-- ============================================================================
-- BEHAVIORAL: reproduce the v1.60+ scenario. As an authenticated user, an
-- INSERT into storage.objects with metadata = NULL must succeed. Before 00024
-- this raised "new row violates row-level security policy" (403).
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role,
                        raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111'::uuid,
   '00000000-0000-0000-0000-000000000000'::uuid,
   'uploader@local', '', now(), now(), now(), 'authenticated', 'authenticated',
   '{"first_name":"Uploader","last_name":"User"}'::jsonb);

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111"}';

-- media bucket: gated on bucket_id only, so a NULL-metadata insert must pass.
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values ('media', 'regression-290-media.png',
            '11111111-1111-1111-1111-111111111111', NULL)$$,
  'authenticated INSERT into media with NULL metadata succeeds (v1.60+ #290)'
);

-- avatars bucket: same gate.
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values ('avatars', 'regression-290-avatar.png',
            '11111111-1111-1111-1111-111111111111', NULL)$$,
  'authenticated INSERT into avatars with NULL metadata succeeds (v1.60+ #290)'
);

-- exports bucket: owner-prefix guard means the path must start with the uid.
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values ('exports',
            '11111111-1111-1111-1111-111111111111/regression-290-export.json',
            '11111111-1111-1111-1111-111111111111', NULL)$$,
  'authenticated INSERT into exports (owner prefix, NULL metadata) succeeds (#290)'
);

reset role; reset request.jwt.claims;

select * from finish();
rollback;
