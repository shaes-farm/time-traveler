-- ============================================================================
-- 00023_api_role_table_grants.sql
--
-- Grant table-level privileges on the `public` schema to the PostgREST API
-- roles (anon, authenticated, service_role).
--
-- Why this is needed
-- ------------------
-- Every prior migration defines RLS *policies* (e.g. `update_events ... TO
-- authenticated` in 00011) but never issues the underlying table GRANTs. RLS is
-- a *filter* layered on top of SQL privileges — a role still needs the base
-- SELECT/INSERT/UPDATE/DELETE grant before any policy is even consulted. On
-- hosted Supabase the platform pre-grants these to anon/authenticated/
-- service_role via default privileges, so the gap is invisible there. The local
-- stack's default privileges grant only TRUNCATE/REFERENCES/TRIGGER/MAINTAIN
-- (`Dxtm`) to those roles, so `supabase db reset` produces tables the API roles
-- cannot read or write:
--
--   42501: permission denied for table events
--   42501: permission denied for table stories
--
-- This broke `pnpm db:test` (00007 RLS, 00021 publish-guard, 00021 stories RLS)
-- and any local run of the apps against a freshly reset DB. Making the grants
-- explicit here is the portable fix: it removes the reliance on platform
-- default-privilege behavior and keeps local and remote consistent.
--
-- Privilege model (RLS remains the row-level gate)
-- ------------------------------------------------
--   anon          → SELECT only. The public reader (apps/reader) is anonymous
--                   and read-only; anon has no write RLS policy, so even a write
--                   grant would be dead. Least privilege: SELECT only.
--   authenticated → SELECT, INSERT, UPDATE, DELETE. RLS (default-deny + the
--                   per-table policies in 00007/00011) decides which rows.
--   service_role  → ALL. Server-only key; bypasses RLS by design.
--
-- ALTER DEFAULT PRIVILEGES is also set so tables added by future migrations
-- inherit these grants automatically and this gap cannot silently reappear.
-- ============================================================================

-- Schema usage (idempotent; anon/authenticated already hold USAGE on public,
-- but assert it so the grants below resolve regardless of platform state).
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Existing tables and views.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Sequences (future-proofing for any serial/identity columns).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Future tables/sequences created in `public` inherit the same grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
