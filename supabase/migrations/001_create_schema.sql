-- ============================================================
-- AZIM MOTORS - Migration 001: Create Schema
-- Run this first in Supabase SQL Editor
-- Uses azim_motors schema (NOT public) to avoid conflicts
-- with other systems sharing the same Supabase instance.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS azim_motors;

GRANT USAGE ON SCHEMA azim_motors TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA azim_motors
  GRANT ALL ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA azim_motors
  GRANT ALL ON SEQUENCES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA azim_motors
  GRANT ALL ON FUNCTIONS TO authenticated, service_role;
