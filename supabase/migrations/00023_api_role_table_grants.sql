-- ============================================================================
-- 00023_api_role_table_grants.sql
--
-- Grant Data API access on the existing `public` tables to the PostgREST roles
-- (anon, authenticated, service_role).
--
-- Why this is needed
-- ------------------
-- Supabase's June 2026 "API permissions" change makes tables in `public` no
-- longer auto-exposed to the Data API: a table is unreachable until a role is
-- explicitly GRANTed privileges on it (PostgREST returns 42501 otherwise). The
-- local CLI/Postgres image already ships this fail-closed default, so a fresh
-- `supabase db reset` produced tables the API roles could not read or write:
--
--   42501: permission denied for table events
--   42501: permission denied for table stories
--
-- which broke `pnpm db:test` (00007 RLS, both 00021 suites) and any local run of
-- the apps. Prior migrations define RLS *policies* but never the underlying
-- GRANTs — GRANT controls table access, RLS controls which rows. Both are
-- required. See:
--   - https://supabase.com/docs/guides/api/securing-your-api
--   - https://github.com/orgs/supabase/discussions/45329
--
-- This migration is a one-time catch-up that grants every table created so far
-- (00001–00022). It deliberately does NOT use `ALTER DEFAULT PRIVILEGES` to
-- auto-grant future tables: Supabase calls that a temporary aid scheduled for
-- removal on 2026-10-30 and recommends fail-closed exposure. Convention going
-- forward: any migration that CREATES a table must grant it here too, bundled
-- with its RLS enablement/policies (see new-table example at the bottom).
--
-- Privilege model (least privilege; RLS remains the row-level gate)
-- ----------------------------------------------------------------
--   anon          → SELECT only. The public reader (apps/reader) is anonymous
--                   and read-only; it has no write RLS policy.
--   authenticated → SELECT, INSERT, UPDATE, DELETE. RLS (default-deny + the
--                   per-table policies in 00007/00011) decides which rows.
--   service_role  → SELECT, INSERT, UPDATE, DELETE. Server-only key; bypasses
--                   RLS by design.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- anon: read-only across existing tables/views.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- authenticated + service_role: full DML across existing tables/views.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO authenticated, service_role;

-- Sequences (for any serial/identity columns).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- New-table convention (for future migrations — do NOT rely on auto-exposure):
--
--   GRANT SELECT ON public.<table> TO anon;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated, service_role;
--
-- placed alongside the table's `ENABLE ROW LEVEL SECURITY` and policies.
-- ----------------------------------------------------------------------------
