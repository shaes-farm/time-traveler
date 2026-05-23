-- ============================================================================
-- 00010_function_search_path_hardening.sql
--
-- Hardens function-level search_path for Supabase Security Advisor findings
-- (issue #112). Sets search_path = '' on all affected public functions so
-- Postgres cannot resolve object references through an attacker-controlled
-- search path.
--
-- Affected functions:
--   public.events_in_temporal_range(bigint, bigint, uuid)
--   public.immutable_array_to_string(text[], text)
--   public.handle_updated_at()
--   public.sync_notification_read_at()
--   public.character_network(uuid, integer)
--   public.events_shared_by_characters(uuid[])
--
-- No function bodies are modified; this is a configuration-only change.
-- See docs/system-design.md §8 (security hardening) for background.
-- ============================================================================

ALTER FUNCTION public.events_in_temporal_range(BIGINT, BIGINT, UUID)
  SET search_path = '';

ALTER FUNCTION public.immutable_array_to_string(TEXT[], TEXT)
  SET search_path = '';

ALTER FUNCTION public.handle_updated_at()
  SET search_path = '';

ALTER FUNCTION public.sync_notification_read_at()
  SET search_path = '';

ALTER FUNCTION public.character_network(UUID, INTEGER)
  SET search_path = '';

ALTER FUNCTION public.events_shared_by_characters(UUID[])
  SET search_path = '';
