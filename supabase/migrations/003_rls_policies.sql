-- ============================================================
-- AZIM MOTORS - Migration 003: Row Level Security Policies
-- ============================================================

SET search_path TO azim_motors, public;

-- Helper: get the calling user's role
CREATE OR REPLACE FUNCTION azim_motors.current_user_role()
RETURNS azim_motors.user_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM azim_motors.user_profiles WHERE id = auth.uid();
$$;

-- Enable RLS on all tables
ALTER TABLE azim_motors.user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.vehicles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.suppliers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.parts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.job_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.job_card_parts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.repair_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE azim_motors.stock_movements ENABLE ROW LEVEL SECURITY;

-- ── user_profiles ──────────────────────────────────────────

CREATE POLICY "profiles_select_authenticated" ON azim_motors.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own_or_admin" ON azim_motors.user_profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR azim_motors.current_user_role() = 'admin'
  );

CREATE POLICY "profiles_insert_admin" ON azim_motors.user_profiles
  FOR INSERT WITH CHECK (azim_motors.current_user_role() = 'admin');

CREATE POLICY "profiles_delete_admin" ON azim_motors.user_profiles
  FOR DELETE USING (azim_motors.current_user_role() = 'admin');

-- ── customers ──────────────────────────────────────────────

CREATE POLICY "customers_select" ON azim_motors.customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_insert" ON azim_motors.customers
  FOR INSERT WITH CHECK (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

CREATE POLICY "customers_update" ON azim_motors.customers
  FOR UPDATE USING (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

CREATE POLICY "customers_delete" ON azim_motors.customers
  FOR DELETE USING (azim_motors.current_user_role() = 'admin');

-- ── vehicles ───────────────────────────────────────────────

CREATE POLICY "vehicles_select" ON azim_motors.vehicles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "vehicles_insert" ON azim_motors.vehicles
  FOR INSERT WITH CHECK (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

CREATE POLICY "vehicles_update" ON azim_motors.vehicles
  FOR UPDATE USING (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

CREATE POLICY "vehicles_delete" ON azim_motors.vehicles
  FOR DELETE USING (azim_motors.current_user_role() = 'admin');

-- ── suppliers ──────────────────────────────────────────────

CREATE POLICY "suppliers_select" ON azim_motors.suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "suppliers_write" ON azim_motors.suppliers
  FOR ALL USING (azim_motors.current_user_role() = 'admin');

-- ── parts ──────────────────────────────────────────────────

CREATE POLICY "parts_select" ON azim_motors.parts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "parts_insert" ON azim_motors.parts
  FOR INSERT WITH CHECK (azim_motors.current_user_role() = 'admin');

CREATE POLICY "parts_update" ON azim_motors.parts
  FOR UPDATE USING (azim_motors.current_user_role() = 'admin');

CREATE POLICY "parts_delete" ON azim_motors.parts
  FOR DELETE USING (azim_motors.current_user_role() = 'admin');

-- ── job_cards ──────────────────────────────────────────────

CREATE POLICY "job_cards_select" ON azim_motors.job_cards
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "job_cards_insert" ON azim_motors.job_cards
  FOR INSERT WITH CHECK (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

-- Mechanics can only update their own cards; admin/receptionist can update all
CREATE POLICY "job_cards_update" ON azim_motors.job_cards
  FOR UPDATE USING (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
    OR (
      azim_motors.current_user_role() = 'mechanic'
      AND assigned_mechanic = auth.uid()
    )
  );

CREATE POLICY "job_cards_delete" ON azim_motors.job_cards
  FOR DELETE USING (azim_motors.current_user_role() = 'admin');

-- ── job_card_parts ─────────────────────────────────────────

CREATE POLICY "jcp_select" ON azim_motors.job_card_parts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "jcp_insert" ON azim_motors.job_card_parts
  FOR INSERT WITH CHECK (
    azim_motors.current_user_role() IN ('admin', 'mechanic', 'receptionist')
  );

CREATE POLICY "jcp_delete" ON azim_motors.job_card_parts
  FOR DELETE USING (
    azim_motors.current_user_role() IN ('admin', 'mechanic')
  );

-- ── repair_records ─────────────────────────────────────────

CREATE POLICY "repair_records_select" ON azim_motors.repair_records
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Written only by trigger (SECURITY DEFINER) — block direct user inserts
CREATE POLICY "repair_records_no_direct_write" ON azim_motors.repair_records
  FOR INSERT WITH CHECK (FALSE);

-- ── stock_movements ────────────────────────────────────────

CREATE POLICY "stock_movements_select" ON azim_motors.stock_movements
  FOR SELECT USING (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

CREATE POLICY "stock_movements_insert" ON azim_motors.stock_movements
  FOR INSERT WITH CHECK (azim_motors.current_user_role() = 'admin');
