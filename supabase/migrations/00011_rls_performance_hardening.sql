-- ============================================================================
-- 00011_rls_performance_hardening.sql
--
-- Addresses Supabase Performance Advisor warnings (issue #115):
--
--   lint=0003_auth_rls_initplan (33 findings)
--     auth.uid() and is_admin() were being re-evaluated per row instead of
--     once per query.  Fix: wrap every occurrence in (select ...) so the
--     planner treats the expression as a stable InitPlan evaluated once.
--
--   lint=0006_multiple_permissive_policies (17 findings)
--     Tables with both a read_X (FOR SELECT) and a write_X (FOR ALL TO
--     authenticated) policy had two overlapping permissive SELECT policies
--     for the authenticated role, causing every SELECT to evaluate both.
--     Fix: replace each write_X FOR ALL with three separate policies
--     (insert_X, update_X, delete_X), removing the implicit SELECT from
--     the write policy.
--
-- No business logic is changed; only the form of the expressions and the
-- command scope of the write policies.
-- See docs/system-design.md §9.2 (RLS patterns) for policy taxonomy.
-- ============================================================================

-- ============================================================================
-- 1. events  (auth_rls_initplan — already split per action, no FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "read_events"   ON public.events;
DROP POLICY IF EXISTS "insert_events" ON public.events;
DROP POLICY IF EXISTS "update_events" ON public.events;
DROP POLICY IF EXISTS "delete_events" ON public.events;

CREATE POLICY "read_events" ON public.events FOR SELECT USING (
  published = true
  OR user_id = (select auth.uid())
  OR (select is_admin())
  OR public.is_timeline_collaborator(events.timeline_id)
);

CREATE POLICY "insert_events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_events" ON public.events FOR UPDATE TO authenticated
  USING (
    user_id   = (select auth.uid())
    OR (select is_admin())
    OR public.is_timeline_collab_editor(events.timeline_id)
  )
  WITH CHECK (
    user_id   = (select auth.uid())
    OR (select is_admin())
    OR public.is_timeline_collab_editor(events.timeline_id)
  );

CREATE POLICY "delete_events" ON public.events FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 2. timelines  (auth_rls_initplan — already split per action, no FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "read_timelines"   ON public.timelines;
DROP POLICY IF EXISTS "insert_timelines" ON public.timelines;
DROP POLICY IF EXISTS "update_timelines" ON public.timelines;
DROP POLICY IF EXISTS "delete_timelines" ON public.timelines;

CREATE POLICY "read_timelines" ON public.timelines FOR SELECT USING (
  published = true
  OR user_id = (select auth.uid())
  OR (select is_admin())
  OR public.is_timeline_collaborator(timelines.id)
);

CREATE POLICY "insert_timelines" ON public.timelines FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_timelines" ON public.timelines FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "delete_timelines" ON public.timelines FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 3. periods  (auth_rls_initplan + multiple_permissive — split write_periods)
-- ============================================================================

DROP POLICY IF EXISTS "read_periods"  ON public.periods;
DROP POLICY IF EXISTS "write_periods" ON public.periods;

CREATE POLICY "read_periods" ON public.periods FOR SELECT USING (
  published = true
  OR user_id = (select auth.uid())
  OR (select is_admin())
  OR EXISTS (
    SELECT 1 FROM public.period_timelines pt
    WHERE pt.period_id = periods.id
      AND public.is_timeline_collaborator(pt.timeline_id)
  )
);

CREATE POLICY "insert_periods" ON public.periods FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_periods" ON public.periods FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "delete_periods" ON public.periods FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 4. characters  (auth_rls_initplan + multiple_permissive — split write_characters)
-- ============================================================================

DROP POLICY IF EXISTS "read_characters"  ON public.characters;
DROP POLICY IF EXISTS "write_characters" ON public.characters;

CREATE POLICY "read_characters" ON public.characters FOR SELECT USING (
  published = true
  OR user_id = (select auth.uid())
  OR (select is_admin())
  OR EXISTS (
    SELECT 1 FROM public.event_characters ec
    JOIN public.events e ON ec.event_id = e.id
    WHERE ec.character_id = characters.id
      AND public.is_timeline_collaborator(e.timeline_id)
  )
);

CREATE POLICY "insert_characters" ON public.characters FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_characters" ON public.characters FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "delete_characters" ON public.characters FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 5. stories  (auth_rls_initplan + multiple_permissive — split write_stories)
-- ============================================================================

DROP POLICY IF EXISTS "read_stories"  ON public.stories;
DROP POLICY IF EXISTS "write_stories" ON public.stories;

CREATE POLICY "read_stories" ON public.stories FOR SELECT USING (
  published = true
  OR user_id = (select auth.uid())
  OR (select is_admin())
  OR EXISTS (
    SELECT 1 FROM public.story_events se
    JOIN public.events e ON se.event_id = e.id
    WHERE se.story_id = stories.id
      AND public.is_timeline_collaborator(e.timeline_id)
  )
);

CREATE POLICY "insert_stories" ON public.stories FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_stories" ON public.stories FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "delete_stories" ON public.stories FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 6. categories  (auth_rls_initplan + multiple_permissive — split write_categories)
--    read_categories has USING (true) — no auth functions, kept as-is.
-- ============================================================================

DROP POLICY IF EXISTS "write_categories" ON public.categories;

CREATE POLICY "insert_categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_categories" ON public.categories FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "delete_categories" ON public.categories FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 7. media  (auth_rls_initplan + multiple_permissive — split write_media)
--    read_media has USING (true) — no auth functions, kept as-is.
-- ============================================================================

DROP POLICY IF EXISTS "write_media" ON public.media;

CREATE POLICY "insert_media" ON public.media FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_media" ON public.media FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "delete_media" ON public.media FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 8. profiles  (auth_rls_initplan — already per-action, no FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "update_profiles" ON public.profiles;

CREATE POLICY "update_profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 9. Junction tables — auth_rls_initplan + multiple_permissive
--    Each write_X FOR ALL → insert_X + update_X + delete_X.
--    The parent ownership check already uses (select auth.uid()) pattern
--    via inline EXISTS subquery — wrapping is_admin() and auth.uid() below.
-- ============================================================================

-- event_categories
DROP POLICY IF EXISTS "write_event_categories" ON public.event_categories;

CREATE POLICY "insert_event_categories" ON public.event_categories FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_categories.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_event_categories" ON public.event_categories FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_categories.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_categories.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_event_categories" ON public.event_categories FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_categories.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- event_media
DROP POLICY IF EXISTS "write_event_media" ON public.event_media;

CREATE POLICY "insert_event_media" ON public.event_media FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_media.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_event_media" ON public.event_media FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_media.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_media.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_event_media" ON public.event_media FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_media.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- event_characters
DROP POLICY IF EXISTS "write_event_characters" ON public.event_characters;

CREATE POLICY "insert_event_characters" ON public.event_characters FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_characters.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_event_characters" ON public.event_characters FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_characters.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_characters.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_event_characters" ON public.event_characters FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events
      WHERE id = event_characters.event_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- timeline_events
DROP POLICY IF EXISTS "write_timeline_events" ON public.timeline_events;

CREATE POLICY "insert_timeline_events" ON public.timeline_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_events.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_timeline_events" ON public.timeline_events FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_events.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_events.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_timeline_events" ON public.timeline_events FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_events.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- period_timelines
DROP POLICY IF EXISTS "write_period_timelines" ON public.period_timelines;

CREATE POLICY "insert_period_timelines" ON public.period_timelines FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = period_timelines.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_period_timelines" ON public.period_timelines FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = period_timelines.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = period_timelines.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_period_timelines" ON public.period_timelines FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = period_timelines.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- timeline_media
DROP POLICY IF EXISTS "write_timeline_media" ON public.timeline_media;

CREATE POLICY "insert_timeline_media" ON public.timeline_media FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_media.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_timeline_media" ON public.timeline_media FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_media.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_media.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_timeline_media" ON public.timeline_media FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.timelines
      WHERE id = timeline_media.timeline_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- story_periods
DROP POLICY IF EXISTS "write_story_periods" ON public.story_periods;

CREATE POLICY "insert_story_periods" ON public.story_periods FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_periods.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_story_periods" ON public.story_periods FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_periods.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_periods.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_story_periods" ON public.story_periods FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_periods.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- story_characters
DROP POLICY IF EXISTS "write_story_characters" ON public.story_characters;

CREATE POLICY "insert_story_characters" ON public.story_characters FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_characters.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_story_characters" ON public.story_characters FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_characters.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_characters.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_story_characters" ON public.story_characters FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_characters.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- story_events
DROP POLICY IF EXISTS "write_story_events" ON public.story_events;

CREATE POLICY "insert_story_events" ON public.story_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_events.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_story_events" ON public.story_events FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_events.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_events.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_story_events" ON public.story_events FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.stories
      WHERE id = story_events.story_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- character_media
DROP POLICY IF EXISTS "write_character_media" ON public.character_media;

CREATE POLICY "insert_character_media" ON public.character_media FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters
      WHERE id = character_media.character_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "update_character_media" ON public.character_media FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.characters
      WHERE id = character_media.character_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters
      WHERE id = character_media.character_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

CREATE POLICY "delete_character_media" ON public.character_media FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.characters
      WHERE id = character_media.character_id
        AND (user_id = (select auth.uid()) OR (select is_admin())))
  );

-- ============================================================================
-- 10. character_relationships  (auth_rls_initplan + multiple_permissive)
-- ============================================================================

DROP POLICY IF EXISTS "read_character_relationships"  ON public.character_relationships;
DROP POLICY IF EXISTS "write_character_relationships" ON public.character_relationships;

CREATE POLICY "read_character_relationships" ON public.character_relationships FOR SELECT
  USING (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "insert_character_relationships" ON public.character_relationships FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_character_relationships" ON public.character_relationships FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()))
  WITH CHECK (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "delete_character_relationships" ON public.character_relationships FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select is_admin()));

-- ============================================================================
-- 11. timeline_collaborators  (auth_rls_initplan + multiple_permissive)
--     is_timeline_owner() / is_timeline_collaborator() are already SECURITY
--     DEFINER — only is_admin() needs wrapping here.
-- ============================================================================

DROP POLICY IF EXISTS "read_collaborators"  ON public.timeline_collaborators;
DROP POLICY IF EXISTS "write_collaborators" ON public.timeline_collaborators;

CREATE POLICY "read_collaborators" ON public.timeline_collaborators FOR SELECT USING (
  user_id = (select auth.uid())
  OR (select is_admin())
  OR public.is_timeline_owner(timeline_collaborators.timeline_id)
);

CREATE POLICY "insert_collaborators" ON public.timeline_collaborators FOR INSERT TO authenticated
  WITH CHECK (
    (select is_admin())
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  );

CREATE POLICY "update_collaborators" ON public.timeline_collaborators FOR UPDATE TO authenticated
  USING (
    (select is_admin())
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  )
  WITH CHECK (
    (select is_admin())
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  );

CREATE POLICY "delete_collaborators" ON public.timeline_collaborators FOR DELETE TO authenticated
  USING (
    (select is_admin())
    OR public.is_timeline_owner(timeline_collaborators.timeline_id)
  );

-- ============================================================================
-- 12. notifications  (auth_rls_initplan — already per-action, no FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "read_notifications"   ON public.notifications;
DROP POLICY IF EXISTS "update_notifications" ON public.notifications;

CREATE POLICY "read_notifications" ON public.notifications FOR SELECT
  USING (user_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "update_notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- 13. content_reports  (auth_rls_initplan — already per-action, no FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "read_content_reports"   ON public.content_reports;
DROP POLICY IF EXISTS "insert_content_reports" ON public.content_reports;

CREATE POLICY "read_content_reports" ON public.content_reports FOR SELECT
  USING (reporter_id = (select auth.uid()) OR (select is_admin()));

CREATE POLICY "insert_content_reports" ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (select auth.uid()));
