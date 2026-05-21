-- ============================================================================
-- 00004_is_admin_and_profile_trigger.sql
--
-- Auth helpers (issue #16):
--   1. is_admin() — SECURITY DEFINER predicate used by RLS policies (#19) to
--      grant admin override. Reads profiles.role for auth.uid().
--   2. on_auth_user_created trigger — creates a profiles row whenever Supabase
--      Auth creates an auth.users row, extracting names from raw_user_meta_data
--      with email-local-part and literal fallbacks.
--
-- Both functions are SECURITY DEFINER with empty search_path and fully-qualified
-- table references (Supabase security best practice; spec §3.2 omits the
-- search_path hardening — see #73).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  email_local TEXT := split_part(COALESCE(NEW.email, ''), '@', 1);
  email_first TEXT;
  email_last  TEXT;
  fn TEXT;
  ln TEXT;
BEGIN
  IF email_local ~ '[._]' THEN
    email_first := split_part(regexp_replace(email_local, '[._]', '.', 'g'), '.', 1);
    email_last  := split_part(regexp_replace(email_local, '[._]', '.', 'g'), '.', 2);
  ELSE
    email_first := email_local;
    email_last  := NULL;
  END IF;

  fn := COALESCE(
    NULLIF(meta->>'first_name', ''),
    NULLIF(meta->>'given_name', ''),
    NULLIF(email_first, ''),
    'New'
  );
  ln := COALESCE(
    NULLIF(meta->>'last_name', ''),
    NULLIF(meta->>'family_name', ''),
    NULLIF(email_last, ''),
    'User'
  );

  IF char_length(fn) < 2 THEN fn := fn || '.'; END IF;
  IF char_length(ln) < 2 THEN ln := ln || '.'; END IF;

  INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (NEW.id, fn, ln)
    ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
