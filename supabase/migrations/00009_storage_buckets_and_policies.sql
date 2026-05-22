-- ============================================================================
-- 00009_storage_buckets_and_policies.sql
--
-- Supabase Storage buckets + RLS policies on storage.objects (issue #22).
-- See docs/system-design.md §5.7 (buckets) and §9.3 (policy pattern).
--
-- Three buckets:
--   media    — public read, authenticated upload, owner-only update/delete
--   avatars  — public read, authenticated upload, owner-only update/delete
--   exports  — owner-only read/write (private — never publicly readable)
--
-- 5MB per-upload size limit is enforced in TWO places (belt-and-suspenders):
--   (a) bucket-level file_size_limit (cheap default; storage API rejects early)
--   (b) policy WITH CHECK on (metadata->>'size')::bigint <= 5242880
--       (matches AC literal "enforced in policy")
-- ============================================================================

-- Buckets (5MB = 5 * 1024 * 1024 = 5242880 bytes)
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
  ('media',   'media',   true,  5242880),
  ('avatars', 'avatars', true,  5242880),
  ('exports', 'exports', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- media bucket: public read, authenticated upload, owner-only update/delete
-- ============================================================================

CREATE POLICY "media_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (metadata->>'size')::bigint <= 5242880
  );

CREATE POLICY "media_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'media' AND owner = auth.uid());

CREATE POLICY "media_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND owner = auth.uid());

-- ============================================================================
-- avatars bucket: same pattern as media
-- ============================================================================

CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (metadata->>'size')::bigint <= 5242880
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

-- ============================================================================
-- exports bucket: owner-only read/write (private)
-- ============================================================================

CREATE POLICY "exports_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'exports' AND owner = auth.uid());

CREATE POLICY "exports_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND (metadata->>'size')::bigint <= 5242880
  );

CREATE POLICY "exports_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'exports' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'exports' AND owner = auth.uid());

CREATE POLICY "exports_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exports' AND owner = auth.uid());
