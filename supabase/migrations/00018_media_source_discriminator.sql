-- ============================================================================
-- 00018_media_source_discriminator.sql
--
-- Adds an upload-vs-external discriminator to the media table (issue #179).
--
-- The original media table (00001) declared storage_path NOT NULL and offered
-- no way to distinguish an uploaded asset (backed by a Supabase Storage object)
-- from an externally-hosted URL embed (a url with no stored object). Issue #49
-- requires registering external URL-based media, and the External-URL tab of
-- the attach dialog was hard-blocked on this. The service layer
-- (packages/services/src/modules/media-service.ts) had worked around the
-- NOT NULL constraint with a sentinel hack (storage_path = url), inferring the
-- kind from storage_path != url; this migration replaces that with a first-class
-- discriminator.
--
-- Three changes:
--   1. storage_path becomes nullable — external embeds have no object path.
--   2. A `source` column ('upload' | 'external') makes the kind explicit for
--      queries, UI labels, and delete semantics (uploaded media must also drop
--      its Storage object; external media must not). DEFAULT 'upload' keeps the
--      add-column backfill-safe.
--   3. A guard CHECK ties the two together: uploads must carry a storage_path;
--      external embeds must not.
--
-- The local DB is rebuilt via `pnpm run db:reset` (validation is local-only,
-- no production data), so pre-existing sentinel rows are not a concern. RLS
-- (read_media/write_media in 00007), the updated_at trigger, media_slug_idx,
-- and the Storage buckets/policies (00009) are all untouched: this migration
-- only widens the media table's shape.
-- ============================================================================

ALTER TABLE media ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE media ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'upload'
  CHECK (source IN ('upload', 'external'));

-- Integrity guard: uploads must have a storage_path; external embeds must not.
ALTER TABLE media ADD CONSTRAINT media_source_storage_ck CHECK (
  (source = 'upload'   AND storage_path IS NOT NULL) OR
  (source = 'external' AND storage_path IS NULL)
);
