-- ============================================================
-- AZIM MOTORS - Migration 009: Fix RLS policies
-- Widens write access so all authenticated staff can manage
-- inventory and suppliers (not just admin).
-- Also ensures the test admin profile is correct.
-- ============================================================

SET search_path TO azim_motors, public;

-- ── Fix test admin profile ─────────────────────────────────
-- If admin@admin.com exists in auth.users but has no profile,
-- or has the wrong role, this corrects it.

DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'admin@admin.com';
  IF v_uid IS NOT NULL THEN
    INSERT INTO azim_motors.user_profiles (id, full_name, role, is_active)
    VALUES (v_uid, 'Test Admin', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;
  END IF;
END $$;

-- ── Parts: allow all authenticated roles to insert/update ──
DROP POLICY IF EXISTS "parts_insert" ON azim_motors.parts;
DROP POLICY IF EXISTS "parts_update" ON azim_motors.parts;
DROP POLICY IF EXISTS "parts_delete" ON azim_motors.parts;

CREATE POLICY "parts_insert" ON azim_motors.parts
  FOR INSERT WITH CHECK (
    azim_motors.current_user_role() IN ('admin', 'mechanic', 'receptionist')
  );

CREATE POLICY "parts_update" ON azim_motors.parts
  FOR UPDATE USING (
    azim_motors.current_user_role() IN ('admin', 'mechanic', 'receptionist')
  );

CREATE POLICY "parts_delete" ON azim_motors.parts
  FOR DELETE USING (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

-- ── Suppliers: allow all authenticated roles to write ──────
DROP POLICY IF EXISTS "suppliers_write" ON azim_motors.suppliers;

CREATE POLICY "suppliers_insert" ON azim_motors.suppliers
  FOR INSERT WITH CHECK (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

CREATE POLICY "suppliers_update" ON azim_motors.suppliers
  FOR UPDATE USING (
    azim_motors.current_user_role() IN ('admin', 'receptionist')
  );

CREATE POLICY "suppliers_delete" ON azim_motors.suppliers
  FOR DELETE USING (
    azim_motors.current_user_role() = 'admin'
  );

-- ── Stock movements: allow mechanic + receptionist ─────────
DROP POLICY IF EXISTS "stock_movements_insert" ON azim_motors.stock_movements;

CREATE POLICY "stock_movements_insert" ON azim_motors.stock_movements
  FOR INSERT WITH CHECK (
    azim_motors.current_user_role() IN ('admin', 'mechanic', 'receptionist')
  );

DROP POLICY IF EXISTS "stock_movements_select" ON azim_motors.stock_movements;

CREATE POLICY "stock_movements_select" ON azim_motors.stock_movements
  FOR SELECT USING (auth.uid() IS NOT NULL);
