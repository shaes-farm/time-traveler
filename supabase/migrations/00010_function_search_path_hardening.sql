-- Hardens function-level search_path for Security Advisor findings.

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
