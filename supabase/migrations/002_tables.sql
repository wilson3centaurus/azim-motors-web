-- ============================================================
-- AZIM MOTORS - Migration 002: All Tables & Triggers
-- ============================================================

SET search_path TO azim_motors, public;

-- ── ENUMS ──────────────────────────────────────────────────

CREATE TYPE azim_motors.job_status AS ENUM (
  'Pending',
  'In Progress',
  'Completed',
  'Cancelled'
);

CREATE TYPE azim_motors.user_role AS ENUM (
  'admin',
  'mechanic',
  'receptionist'
);

-- ── USER PROFILES ──────────────────────────────────────────

CREATE TABLE azim_motors.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          azim_motors.user_role NOT NULL DEFAULT 'mechanic',
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── CUSTOMERS ──────────────────────────────────────────────

CREATE TABLE azim_motors.customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  address       TEXT,
  id_number     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── VEHICLES ───────────────────────────────────────────────

CREATE TABLE azim_motors.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES azim_motors.customers(id) ON DELETE RESTRICT,
  registration    TEXT NOT NULL UNIQUE,
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            SMALLINT,
  color           TEXT,
  vin             TEXT,
  mileage_in      INTEGER,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── SUPPLIERS ──────────────────────────────────────────────

CREATE TABLE azim_motors.suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  contact_name  TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── PARTS / INVENTORY ──────────────────────────────────────

CREATE TABLE azim_motors.parts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number     TEXT UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level   INTEGER NOT NULL DEFAULT 5,
  unit_cost       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  selling_price   NUMERIC(10, 2),
  supplier_id     UUID REFERENCES azim_motors.suppliers(id) ON DELETE SET NULL,
  location        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE VIEW azim_motors.low_stock_parts AS
  SELECT * FROM azim_motors.parts
  WHERE quantity <= reorder_level AND is_active = TRUE;

-- ── JOB CARDS ──────────────────────────────────────────────

CREATE SEQUENCE azim_motors.job_number_seq START 1;

CREATE OR REPLACE FUNCTION azim_motors.next_job_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'JC-' || TO_CHAR(NOW(), 'YYYY') || '-'
         || LPAD(nextval('azim_motors.job_number_seq')::TEXT, 4, '0');
END;
$$;

CREATE TABLE azim_motors.job_cards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number        TEXT NOT NULL UNIQUE DEFAULT '',
  vehicle_id        UUID NOT NULL REFERENCES azim_motors.vehicles(id) ON DELETE RESTRICT,
  customer_id       UUID NOT NULL REFERENCES azim_motors.customers(id) ON DELETE RESTRICT,
  assigned_mechanic UUID REFERENCES azim_motors.user_profiles(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES azim_motors.user_profiles(id) ON DELETE SET NULL,
  status            azim_motors.job_status NOT NULL DEFAULT 'Pending',
  complaint         TEXT NOT NULL,
  diagnosis         TEXT,
  work_done         TEXT,
  date_received     DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_return  DATE,
  actual_return     DATE,
  labour_cost       NUMERIC(10, 2) DEFAULT 0,
  total_parts_cost  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── JOB CARD PARTS ─────────────────────────────────────────

CREATE TABLE azim_motors.job_card_parts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id   UUID NOT NULL REFERENCES azim_motors.job_cards(id) ON DELETE CASCADE,
  part_id       UUID NOT NULL REFERENCES azim_motors.parts(id) ON DELETE RESTRICT,
  quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
  unit_cost     NUMERIC(10, 2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_card_id, part_id)
);

-- ── REPAIR RECORDS ─────────────────────────────────────────

CREATE TABLE azim_motors.repair_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id     UUID NOT NULL REFERENCES azim_motors.job_cards(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES azim_motors.vehicles(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES azim_motors.customers(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  diagnosis       TEXT,
  work_done       TEXT,
  labour_cost     NUMERIC(10, 2),
  total_cost      NUMERIC(10, 2),
  mileage_out     INTEGER,
  technician_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── STOCK MOVEMENTS ────────────────────────────────────────

CREATE TABLE azim_motors.stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id         UUID NOT NULL REFERENCES azim_motors.parts(id) ON DELETE CASCADE,
  job_card_id     UUID REFERENCES azim_motors.job_cards(id) ON DELETE SET NULL,
  movement_type   TEXT NOT NULL CHECK (movement_type IN ('IN','OUT','ADJUSTMENT')),
  quantity        INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after  INTEGER NOT NULL,
  reason          TEXT,
  performed_by    UUID REFERENCES azim_motors.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── TRIGGERS ───────────────────────────────────────────────

-- Auto-set job_number on INSERT
CREATE OR REPLACE FUNCTION azim_motors.set_job_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
    NEW.job_number := azim_motors.next_job_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_job_number
  BEFORE INSERT ON azim_motors.job_cards
  FOR EACH ROW EXECUTE FUNCTION azim_motors.set_job_number();

-- updated_at maintenance
CREATE OR REPLACE FUNCTION azim_motors.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_customers
  BEFORE UPDATE ON azim_motors.customers
  FOR EACH ROW EXECUTE FUNCTION azim_motors.touch_updated_at();

CREATE TRIGGER trg_touch_vehicles
  BEFORE UPDATE ON azim_motors.vehicles
  FOR EACH ROW EXECUTE FUNCTION azim_motors.touch_updated_at();

CREATE TRIGGER trg_touch_parts
  BEFORE UPDATE ON azim_motors.parts
  FOR EACH ROW EXECUTE FUNCTION azim_motors.touch_updated_at();

CREATE TRIGGER trg_touch_job_cards
  BEFORE UPDATE ON azim_motors.job_cards
  FOR EACH ROW EXECUTE FUNCTION azim_motors.touch_updated_at();

CREATE TRIGGER trg_touch_user_profiles
  BEFORE UPDATE ON azim_motors.user_profiles
  FOR EACH ROW EXECUTE FUNCTION azim_motors.touch_updated_at();

-- Deduct stock when job_card_parts row is inserted
CREATE OR REPLACE FUNCTION azim_motors.deduct_stock_on_part_use()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_before INTEGER;
BEGIN
  SELECT quantity INTO v_before FROM azim_motors.parts WHERE id = NEW.part_id FOR UPDATE;
  IF v_before < NEW.quantity_used THEN
    RAISE EXCEPTION 'Insufficient stock for part % (have %, need %)',
      NEW.part_id, v_before, NEW.quantity_used;
  END IF;
  UPDATE azim_motors.parts SET quantity = quantity - NEW.quantity_used WHERE id = NEW.part_id;
  INSERT INTO azim_motors.stock_movements
    (part_id, job_card_id, movement_type, quantity, quantity_before, quantity_after, reason)
  VALUES
    (NEW.part_id, NEW.job_card_id, 'OUT', -NEW.quantity_used,
     v_before, v_before - NEW.quantity_used, 'Used on job card');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock
  AFTER INSERT ON azim_motors.job_card_parts
  FOR EACH ROW EXECUTE FUNCTION azim_motors.deduct_stock_on_part_use();

-- Restore stock when job_card_parts row is deleted
CREATE OR REPLACE FUNCTION azim_motors.restore_stock_on_part_remove()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_before INTEGER;
BEGIN
  SELECT quantity INTO v_before FROM azim_motors.parts WHERE id = OLD.part_id FOR UPDATE;
  UPDATE azim_motors.parts SET quantity = quantity + OLD.quantity_used WHERE id = OLD.part_id;
  INSERT INTO azim_motors.stock_movements
    (part_id, job_card_id, movement_type, quantity, quantity_before, quantity_after, reason)
  VALUES
    (OLD.part_id, OLD.job_card_id, 'IN', OLD.quantity_used,
     v_before, v_before + OLD.quantity_used, 'Removed from job card');
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_restore_stock
  AFTER DELETE ON azim_motors.job_card_parts
  FOR EACH ROW EXECUTE FUNCTION azim_motors.restore_stock_on_part_remove();

-- Recompute job_cards.total_parts_cost after job_card_parts changes
CREATE OR REPLACE FUNCTION azim_motors.sync_parts_cost()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_job_id UUID;
BEGIN
  v_job_id := COALESCE(NEW.job_card_id, OLD.job_card_id);
  UPDATE azim_motors.job_cards
    SET total_parts_cost = (
      SELECT COALESCE(SUM(quantity_used * unit_cost), 0)
      FROM azim_motors.job_card_parts
      WHERE job_card_id = v_job_id
    )
  WHERE id = v_job_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_parts_cost
  AFTER INSERT OR UPDATE OR DELETE ON azim_motors.job_card_parts
  FOR EACH ROW EXECUTE FUNCTION azim_motors.sync_parts_cost();

-- Auto-create repair_record when job status → Completed
CREATE OR REPLACE FUNCTION azim_motors.create_repair_record_on_complete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_tech_name TEXT;
  v_total     NUMERIC;
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    SELECT full_name INTO v_tech_name
      FROM azim_motors.user_profiles WHERE id = NEW.assigned_mechanic;
    v_total := COALESCE(NEW.labour_cost, 0) + COALESCE(NEW.total_parts_cost, 0);
    INSERT INTO azim_motors.repair_records
      (job_card_id, vehicle_id, customer_id, diagnosis, work_done,
       labour_cost, total_cost, technician_name)
    VALUES
      (NEW.id, NEW.vehicle_id, NEW.customer_id, NEW.diagnosis, NEW.work_done,
       NEW.labour_cost, v_total, v_tech_name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_repair_record
  AFTER UPDATE ON azim_motors.job_cards
  FOR EACH ROW EXECUTE FUNCTION azim_motors.create_repair_record_on_complete();

-- Mirror new auth.users into user_profiles
CREATE OR REPLACE FUNCTION azim_motors.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO azim_motors.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::azim_motors.user_role, 'mechanic')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION azim_motors.handle_new_auth_user();
