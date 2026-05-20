-- ============================================================
-- AZIM MOTORS - Migration 010: Permissive RLS for inventory
-- Replaces role-lookup policies (which fail when the profile
-- isn't found in the RLS context) with simple auth checks.
-- Any authenticated user can manage parts, suppliers, stock.
-- ============================================================

SET search_path TO azim_motors, public;

-- ── parts ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "parts_select"  ON azim_motors.parts;
DROP POLICY IF EXISTS "parts_insert"  ON azim_motors.parts;
DROP POLICY IF EXISTS "parts_update"  ON azim_motors.parts;
DROP POLICY IF EXISTS "parts_delete"  ON azim_motors.parts;

CREATE POLICY "parts_all_authenticated" ON azim_motors.parts
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── suppliers ──────────────────────────────────────────────
DROP POLICY IF EXISTS "suppliers_select"  ON azim_motors.suppliers;
DROP POLICY IF EXISTS "suppliers_write"   ON azim_motors.suppliers;
DROP POLICY IF EXISTS "suppliers_insert"  ON azim_motors.suppliers;
DROP POLICY IF EXISTS "suppliers_update"  ON azim_motors.suppliers;
DROP POLICY IF EXISTS "suppliers_delete"  ON azim_motors.suppliers;

CREATE POLICY "suppliers_all_authenticated" ON azim_motors.suppliers
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── stock_movements ────────────────────────────────────────
DROP POLICY IF EXISTS "stock_movements_select" ON azim_motors.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert" ON azim_motors.stock_movements;

CREATE POLICY "stock_movements_all_authenticated" ON azim_motors.stock_movements
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── customers ──────────────────────────────────────────────
DROP POLICY IF EXISTS "customers_select" ON azim_motors.customers;
DROP POLICY IF EXISTS "customers_insert" ON azim_motors.customers;
DROP POLICY IF EXISTS "customers_update" ON azim_motors.customers;
DROP POLICY IF EXISTS "customers_delete" ON azim_motors.customers;

CREATE POLICY "customers_all_authenticated" ON azim_motors.customers
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── vehicles ───────────────────────────────────────────────
DROP POLICY IF EXISTS "vehicles_select" ON azim_motors.vehicles;
DROP POLICY IF EXISTS "vehicles_insert" ON azim_motors.vehicles;
DROP POLICY IF EXISTS "vehicles_update" ON azim_motors.vehicles;
DROP POLICY IF EXISTS "vehicles_delete" ON azim_motors.vehicles;

CREATE POLICY "vehicles_all_authenticated" ON azim_motors.vehicles
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── job_cards ──────────────────────────────────────────────
DROP POLICY IF EXISTS "job_cards_select" ON azim_motors.job_cards;
DROP POLICY IF EXISTS "job_cards_insert" ON azim_motors.job_cards;
DROP POLICY IF EXISTS "job_cards_update" ON azim_motors.job_cards;
DROP POLICY IF EXISTS "job_cards_delete" ON azim_motors.job_cards;

CREATE POLICY "job_cards_all_authenticated" ON azim_motors.job_cards
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── job_card_parts ─────────────────────────────────────────
DROP POLICY IF EXISTS "jcp_select" ON azim_motors.job_card_parts;
DROP POLICY IF EXISTS "jcp_insert" ON azim_motors.job_card_parts;
DROP POLICY IF EXISTS "jcp_delete" ON azim_motors.job_card_parts;

CREATE POLICY "jcp_all_authenticated" ON azim_motors.job_card_parts
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── repair_records ─────────────────────────────────────────
DROP POLICY IF EXISTS "repair_records_select"           ON azim_motors.repair_records;
DROP POLICY IF EXISTS "repair_records_no_direct_write"  ON azim_motors.repair_records;

CREATE POLICY "repair_records_select" ON azim_motors.repair_records
  FOR SELECT USING (auth.uid() IS NOT NULL);
