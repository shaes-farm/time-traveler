-- ============================================================================
-- 00007_rls_policies.sql
--
-- Row Level Security policies for all 20 tables (issue #19).
-- See docs/system-design.md §9.2 (events / content tables / junctions /
-- timeline_collaborators) for the canonical patterns.
--
-- RLS is already ENABLED on every table by 00001-00003 (default-deny);
-- this migration adds the actual SELECT/INSERT/UPDATE/DELETE policies so
-- anon, authenticated, owner, collaborator, and admin roles each get the
-- access they should.
--
-- Policy taxonomy:
--   1. Content with timeline_id (events) — 4-clause read incl. direct
--      collaborator check; insert/update/delete split per spec §9.2.1.
--   2. Content without timeline_id (timelines, periods, characters,
--      stories, categories, media) — 4-clause read with collaborator
--      derived via junction tables; FOR ALL write per spec §9.2.2.
--   3. profiles — globally readable, own-only update. Spec is silent
--      (§9.2 does not cover profiles); designed from AC. Flagged in #73.
--   4. Junction tables (10) — read delegates to parent's RLS via
--      EXISTS subselect; write requires primary parent ownership.
--   5. character_relationships — simple user_id ownership (the table
--      HAS a user_id, unlike other junctions). AC's "read if either
--      character visible" implementation flagged in #73 as a divergence.
--   6. timeline_collaborators — spec §9.2.4; readable by owner, the
--      collaborator themselves, and admins.
--   7. notifications — own-only read/update. Spec §3.5 design notes.
--   8. content_reports — reporter reads own + admin all; admin update only.
--
-- Junction read policies use `EXISTS (SELECT 1 FROM parent WHERE id = X)`
-- so the parent's RLS recursively decides visibility. This picks up
-- collaborator access on parent automatically — the spec example in §9.2.3
-- duplicates the parent's read conditions inline and misses collaborator
-- access, which is a spec gap flagged in #73.
--
-- RLS recursion prevention: spec §9.2.4's `read_collaborators` does an
-- inline `EXISTS (SELECT 1 FROM timelines ...)` which combined with
-- `read_timelines`' inline `EXISTS (SELECT 1 FROM timeline_collaborators ...)`
-- forms a cycle that triggers `infinite recursion detected in policy`
-- whenever a non-owner non-collaborator queries either table. Fixed here
-- via three SECURITY DEFINER helper functions that bypass RLS. The cycle
-- is a real spec bug — flagged in #73.
-- ============================================================================

-- ============================================================================
-- 0. SECURITY DEFINER helpers (break RLS cycles between timelines and
--    timeline_collaborators). All three are STABLE, SET search_path='',
--    fully-qualified — same hardening pattern as is_admin().
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_timeline_owner(t_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.timelines
    WHERE id = t_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_timeline_collaborator(t_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.timeline_collaborators
    WHERE timeline_id = t_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_timeline_collab_editor(t_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.timeline_collaborators
    WHERE timeline_id = t_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
  );
$$;

-- ============================================================================
-- 1. events (spec §9.2.1)
-- ============================================================================

CREATE POLICY "read_events" ON events FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR public.is_timeline_collaborator(events.timeline_id)
);

CREATE POLICY "insert_events" ON events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "update_events" ON events FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR public.is_timeline_collab_editor(events.timeline_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin()
    OR public.is_timeline_collab_editor(events.timeline_id)
  );

CREATE POLICY "delete_events" ON events FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 2. Content tables without timeline_id
-- ============================================================================

-- timelines (the parent entity for collaboration) — spec §9.2.2
CREATE POLICY "read_timelines" ON timelines FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR public.is_timeline_collaborator(timelines.id)
);

CREATE POLICY "insert_timelines" ON timelines FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "update_timelines" ON timelines FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "delete_timelines" ON timelines FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- periods — collaborator access derived via period_timelines junction
CREATE POLICY "read_periods" ON periods FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM period_timelines pt
    WHERE pt.period_id = periods.id
      AND public.is_timeline_collaborator(pt.timeline_id)
  )
);

CREATE POLICY "write_periods" ON periods FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- characters — collaborator access derived via event_characters → events → timelines
CREATE POLICY "read_characters" ON characters FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM event_characters ec
    JOIN events e ON ec.event_id = e.id
    WHERE ec.character_id = characters.id
      AND public.is_timeline_collaborator(e.timeline_id)
  )
);

CREATE POLICY "write_characters" ON characters FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- stories — collaborator access derived via story_events → events → timelines
CREATE POLICY "read_stories" ON stories FOR SELECT USING (
  published = true
  OR user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM story_events se
    JOIN events e ON se.event_id = e.id
    WHERE se.story_id = stories.id
      AND public.is_timeline_collaborator(e.timeline_id)
  )
);

CREATE POLICY "write_stories" ON stories FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- categories — globally readable (organizational metadata)
CREATE POLICY "read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "write_categories" ON categories FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- media — globally readable (access control on the parent entity)
CREATE POLICY "read_media" ON media FOR SELECT USING (true);
CREATE POLICY "write_media" ON media FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 3. profiles (spec-silent; designed from AC + flagged in #73)
-- ============================================================================

-- Global read so usernames/avatars/bio can be displayed alongside any content.
CREATE POLICY "read_profiles" ON profiles FOR SELECT USING (true);

-- INSERT is performed by handle_new_user() (SECURITY DEFINER trigger from #16);
-- regular users don't insert here. No INSERT policy → default-deny for any
-- caller that tries direct PostgREST insert against profiles.

-- Own-profile-only update; admins can update any.
CREATE POLICY "update_profiles" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- No DELETE policy → CASCADE from auth.users handles removal.

-- ============================================================================
-- 4. Junction tables (10) — read delegates to parent's RLS; write needs
--    ownership of the primary/first-named parent (see migration header).
-- ============================================================================

-- event_categories — primary parent: event
CREATE POLICY "read_event_categories" ON event_categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_categories.event_id)
);
CREATE POLICY "write_event_categories" ON event_categories FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events
      WHERE id = event_categories.event_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events
      WHERE id = event_categories.event_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- event_media — primary parent: event
CREATE POLICY "read_event_media" ON event_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_media.event_id)
);
CREATE POLICY "write_event_media" ON event_media FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events
      WHERE id = event_media.event_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events
      WHERE id = event_media.event_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- event_characters — primary parent: event
CREATE POLICY "read_event_characters" ON event_characters FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_characters.event_id)
);
CREATE POLICY "write_event_characters" ON event_characters FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events
      WHERE id = event_characters.event_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events
      WHERE id = event_characters.event_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- timeline_events — primary parent: timeline (collaboration root)
CREATE POLICY "read_timeline_events" ON timeline_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM timelines WHERE id = timeline_events.timeline_id)
);
CREATE POLICY "write_timeline_events" ON timeline_events FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM timelines
      WHERE id = timeline_events.timeline_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM timelines
      WHERE id = timeline_events.timeline_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- period_timelines — primary parent: timeline (collaboration root)
CREATE POLICY "read_period_timelines" ON period_timelines FOR SELECT USING (
  EXISTS (SELECT 1 FROM timelines WHERE id = period_timelines.timeline_id)
);
CREATE POLICY "write_period_timelines" ON period_timelines FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM timelines
      WHERE id = period_timelines.timeline_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM timelines
      WHERE id = period_timelines.timeline_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- timeline_media — primary parent: timeline (collaboration root)
CREATE POLICY "read_timeline_media" ON timeline_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM timelines WHERE id = timeline_media.timeline_id)
);
CREATE POLICY "write_timeline_media" ON timeline_media FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM timelines
      WHERE id = timeline_media.timeline_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM timelines
      WHERE id = timeline_media.timeline_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- story_periods — primary parent: story
CREATE POLICY "read_story_periods" ON story_periods FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE id = story_periods.story_id)
);
CREATE POLICY "write_story_periods" ON story_periods FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM stories
      WHERE id = story_periods.story_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stories
      WHERE id = story_periods.story_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- story_characters — primary parent: story
CREATE POLICY "read_story_characters" ON story_characters FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE id = story_characters.story_id)
);
CREATE POLICY "write_story_characters" ON story_characters FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM stories
      WHERE id = story_characters.story_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stories
      WHERE id = story_characters.story_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- story_events — primary parent: story
CREATE POLICY "read_story_events" ON story_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE id = story_events.story_id)
);
CREATE POLICY "write_story_events" ON story_events FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM stories
      WHERE id = story_events.story_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stories
      WHERE id = story_events.story_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- character_media — primary parent: character
CREATE POLICY "read_character_media" ON character_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM characters WHERE id = character_media.character_id)
);
CREATE POLICY "write_character_media" ON character_media FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM characters
      WHERE id = character_media.character_id
        AND (user_id = auth.uid() OR is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM characters
      WHERE id = character_media.character_id
        AND (user_id = auth.uid() OR is_admin()))
  );

-- ============================================================================
-- 5. character_relationships (uses its own user_id; spec-silent — flagged in #73)
-- ============================================================================

CREATE POLICY "read_character_relationships" ON character_relationships FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "write_character_relationships" ON character_relationships FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 6. timeline_collaborators (spec §9.2.4)
-- ============================================================================

CREATE POLICY "read_collaborators" ON timeline_collaborators FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin()
  OR public.is_timeline_owner(timeline_collaborators.timeline_id)
);

CREATE POLICY "write_collaborators" ON timeline_collaborators FOR ALL TO authenticated
  USING (
    is_admin()
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  )
  WITH CHECK (
    is_admin()
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  );

-- ============================================================================
-- 7. notifications (spec-silent; spec §3.5 design notes — flagged in #73)
-- ============================================================================

CREATE POLICY "read_notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Own-row update only. Column-level restriction (only read/read_at) is
-- enforced at the service layer; the sync_notification_read_at trigger
-- already handles read_at population.
CREATE POLICY "update_notifications" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT happens via SECURITY DEFINER from the application/admin path
-- (e.g., collaboration invites, moderation alerts). No INSERT policy →
-- direct PostgREST inserts are blocked by default deny.

-- No DELETE policy → notifications are write-once; service layer never deletes.

-- ============================================================================
-- 8. content_reports (spec-silent; spec §3.5 design notes — flagged in #73)
-- ============================================================================

CREATE POLICY "read_content_reports" ON content_reports FOR SELECT
  USING (reporter_id = auth.uid() OR is_admin());

CREATE POLICY "insert_content_reports" ON content_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Only admins update reports (status, admin_notes, resolved_by/at).
CREATE POLICY "update_content_reports" ON content_reports FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- No DELETE policy → reports are retained for the audit trail.
