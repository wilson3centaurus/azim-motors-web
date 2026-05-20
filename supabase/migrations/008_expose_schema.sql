-- ============================================================
-- AZIM MOTORS - Migration 008: Expose azim_motors to PostgREST
-- Run this in Supabase SQL Editor.
-- PostgREST only exposes "public" by default; this adds azim_motors.
-- ============================================================

-- Tell PostgREST to also serve the azim_motors schema
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,azim_motors';

-- Tell PostgREST to reload its config and schema cache immediately
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
