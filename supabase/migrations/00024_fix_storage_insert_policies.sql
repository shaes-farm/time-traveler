-- ============================================================================
-- 00024_fix_storage_insert_policies.sql
--
-- Fix broken (metadata->>'size')::bigint <= 5242880 check in Storage INSERT
-- policies (issue #293).
--
-- Root cause: Supabase Storage API v1.60+ inserts the storage.objects row
-- before populating the metadata column. The WITH CHECK fires on INSERT and
-- sees metadata IS NULL, so (NULL::bigint <= 5242880) evaluates to NULL (not
-- true), rejecting ALL authenticated uploads regardless of file size.
--
-- The bucket-level file_size_limit = 5242880 (set in 00009) is the real
-- enforcement: the Storage API returns HTTP 413 before the row is ever
-- created. The per-policy metadata check was redundant and is now also
-- broken. Removing it from INSERT policies restores authenticated uploads.
--
-- Workaround applied in code: none needed after this migration.
-- See issue #293 and ADR-0009 (storage) for context.
-- ============================================================================

-- media bucket
DROP POLICY IF EXISTS "media_insert" ON storage.objects;
CREATE POLICY "media_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

-- avatars bucket
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- exports bucket — owner-prefix constraint retained; size check removed
DROP POLICY IF EXISTS "exports_insert" ON storage.objects;
CREATE POLICY "exports_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
