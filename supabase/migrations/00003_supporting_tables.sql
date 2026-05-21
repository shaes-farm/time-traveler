-- ============================================================================
-- 00003_supporting_tables.sql
--
-- Supporting tables for system messaging and content moderation (issue #15).
-- See docs/system-design.md §3.5.
--
-- RLS policies follow in issue #19. Notifications are designed to be write-once
-- except for read/read_at; full write-once enforcement will arrive with #19's
-- column-restricted UPDATE policy. This migration includes a read_at-sync
-- trigger so the two columns stay consistent under any caller.
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN (
      'collaborator_invite', 'content_moderated', 'content_reported',
      'library_update', 'system_message'
    )),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, read, created_at DESC);

CREATE OR REPLACE FUNCTION sync_notification_read_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.read IS TRUE AND OLD.read IS DISTINCT FROM TRUE THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_read_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION sync_notification_read_at();

CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  entity_type VARCHAR(50) NOT NULL
    CHECK (entity_type IN ('timeline', 'event', 'period', 'story', 'character')),
  entity_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL
    CHECK (reason IN ('inaccurate', 'inappropriate', 'spam', 'copyright', 'other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_status ON content_reports (status, created_at DESC);
CREATE INDEX idx_reports_entity ON content_reports (entity_type, entity_id);

-- ============================================================================
-- Enable RLS (default deny until policies land in issue #19)
-- ============================================================================

ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
