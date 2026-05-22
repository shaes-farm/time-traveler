-- pgTAP tests for 00009_storage_buckets_and_policies.sql (issue #22 — storage)
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

-- ============================================================================
-- Buckets exist with correct public/private + 5MB size limit
-- ============================================================================

select is(
  (select count(*)::bigint from storage.buckets
    where id in ('media', 'avatars', 'exports')),
  3::bigint,
  'all 3 buckets created (media, avatars, exports)'
);

select is(
  (select public from storage.buckets where id = 'media'),
  true, 'media bucket is public'
);
select is(
  (select public from storage.buckets where id = 'avatars'),
  true, 'avatars bucket is public'
);
select is(
  (select public from storage.buckets where id = 'exports'),
  false, 'exports bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'media'),
  5242880::bigint, 'media bucket has 5MB file_size_limit'
);
select is(
  (select file_size_limit from storage.buckets where id = 'avatars'),
  5242880::bigint, 'avatars bucket has 5MB file_size_limit'
);
select is(
  (select file_size_limit from storage.buckets where id = 'exports'),
  5242880::bigint, 'exports bucket has 5MB file_size_limit'
);

-- ============================================================================
-- All 12 policies exist on storage.objects (4 per bucket × 3 buckets)
-- ============================================================================

select policies_are(
  'storage', 'objects',
  array[
    'media_select',   'media_insert',   'media_update',   'media_delete',
    'avatars_select', 'avatars_insert', 'avatars_update', 'avatars_delete',
    'exports_select', 'exports_insert', 'exports_update', 'exports_delete'
  ],
  'all 12 storage policies present (4 ops × 3 buckets)'
);

-- ============================================================================
-- Spot-check per-bucket policy commands match intent
-- (storage.objects already has RLS enabled by default Supabase setup)
-- ============================================================================

select is(
  (select rowsecurity from pg_tables
    where schemaname='storage' and tablename='objects'),
  true,
  'storage.objects has RLS enabled (Supabase default)'
);

-- Verify INSERT policies contain the 5MB size check (literal pattern match)
select ok(
  (select qual is null and with_check like '%5242880%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='media_insert'),
  'media_insert policy enforces 5MB limit in WITH CHECK'
);
select ok(
  (select with_check like '%5242880%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='avatars_insert'),
  'avatars_insert policy enforces 5MB limit in WITH CHECK'
);
select ok(
  (select with_check like '%5242880%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='exports_insert'),
  'exports_insert policy enforces 5MB limit in WITH CHECK'
);

-- Verify public-read policies have NULL `roles` filter or include public
-- (i.e., not restricted to authenticated only)
select ok(
  (select 'public' = any(roles) or roles is null
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='media_select'),
  'media_select is reachable by anon (public role)'
);
select ok(
  (select 'public' = any(roles) or roles is null
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='avatars_select'),
  'avatars_select is reachable by anon (public role)'
);

-- Verify exports SELECT is RESTRICTED to authenticated (not public)
select ok(
  (select 'authenticated' = any(roles) and not ('public' = any(roles))
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='exports_select'),
  'exports_select restricted to authenticated role (no anon access)'
);

-- Verify owner-only DELETE policies reference auth.uid()
select ok(
  (select qual like '%auth.uid()%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='media_delete'),
  'media_delete enforces owner = auth.uid()'
);
select ok(
  (select qual like '%auth.uid()%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='exports_delete'),
  'exports_delete enforces owner = auth.uid()'
);

-- Verify owner-only UPDATE policies reference auth.uid() in both USING and WITH CHECK
select ok(
  (select qual like '%auth.uid()%' and with_check like '%auth.uid()%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='media_update'),
  'media_update enforces owner = auth.uid() in both USING and WITH CHECK'
);
select ok(
  (select qual like '%auth.uid()%' and with_check like '%auth.uid()%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='exports_update'),
  'exports_update enforces owner = auth.uid() in both USING and WITH CHECK'
);

-- INSERT policies have NULL `qual` (only WITH CHECK applies to INSERT)
-- and the WITH CHECK references the bucket_id and metadata->>'size'
select ok(
  (select with_check like '%bucket_id%' and with_check like '%metadata%'
    from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='media_insert'),
  'media_insert WITH CHECK references bucket_id + metadata'
);

select * from finish();
rollback;
