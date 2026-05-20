-- ============================================================
-- AZIM MOTORS - Migration 001: Create Schema
-- Run this first in Supabase SQL Editor
-- Uses azim_motors schema (NOT public) to avoid conflicts
-- with other systems sharing the same Supabase instance.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS azim_motors;

GRANT USAGE ON SCHEMA azim_motors TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA azim_motors
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA azim_motors
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA azim_motors
  GRANT ALL ON FUNCTIONS TO authenticated, service_role;

-- Expose azim_motors to PostgREST (stored on authenticator role, picked up on reload)
-- Run after tables are created:
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA azim_motors TO anon, authenticated;
--   ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,...,azim_motors';
--   NOTIFY pgrst, 'reload config';
