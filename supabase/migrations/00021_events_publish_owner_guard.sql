-- ============================================================================
-- 00021_events_publish_owner_guard.sql
--
-- Owner-only event publication (issue #48).
--
-- The `update_events` policy (00011) grants UPDATE to collaborator-editors
-- (is_timeline_collab_editor) so they can edit an event's content. But the
-- go-live decision — flipping `published` / `published_at` — is reserved to the
-- row owner (or a global admin), per wireframe
-- docs/design/admin/02-wireframes/16-publish-workflow.md ("Publishing is an
-- editorial go-live decision reserved to ownership") and system-design §9.
--
-- RLS cannot express "editors may update every column except these two", so a
-- BEFORE UPDATE trigger enforces the column-level rule: it rejects a change to
-- `published` or `published_at` unless the actor is the owner or an admin.
-- Editors keep full edit rights on every other column.
--
-- Timelines already have this guard for free — `update_timelines` is owner/admin
-- only — so this is events-only.
--
-- auth.uid() IS NULL means there is no JWT (service_role / postgres, which
-- bypass RLS for trusted server-side work); the guard does not apply there.
-- Function is SECURITY INVOKER with a hardened empty search_path (#73).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.guard_event_publish_owner_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF (NEW.published    IS DISTINCT FROM OLD.published
      OR NEW.published_at IS DISTINCT FROM OLD.published_at)
     AND auth.uid() IS NOT NULL
     AND auth.uid() <> OLD.user_id
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the owner can change an event''s publication state'
      USING ERRCODE = '42501';  -- insufficient_privilege
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_event_publish
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.guard_event_publish_owner_only();
