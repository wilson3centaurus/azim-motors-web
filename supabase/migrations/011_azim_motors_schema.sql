-- ============================================================
-- AZIM MOTORS - Migration 011: Full azim_motors schema rebuild
-- Drops and recreates schema cleanly.
-- Uses our own profiles table — NOT Supabase Auth.
-- Run in Supabase SQL Editor.
-- ============================================================

-- Wipe and recreate schema
DROP SCHEMA IF EXISTS azim_motors CASCADE;
CREATE SCHEMA azim_motors;

-- ── TABLES ──────────────────────────────────────────────────

CREATE TABLE azim_motors.profiles (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   text        NOT NULL UNIQUE,
  password_hash           text        NOT NULL,
  pin_hash                text,
  password_login_enabled  boolean     NOT NULL DEFAULT true,
  full_name               text        NOT NULL,
  role                    text        NOT NULL DEFAULT 'mechanic'
                            CHECK (role IN ('admin','mechanic','salesperson','receptionist')),
  phone                   text,
  avatar_url              text,
  is_active               boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.customers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text        NOT NULL,
  phone      text        NOT NULL,
  email      text,
  address    text,
  id_number  text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.vehicles (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid        NOT NULL REFERENCES azim_motors.customers(id) ON DELETE RESTRICT,
  registration  text        NOT NULL UNIQUE,
  make          text        NOT NULL,
  model         text        NOT NULL,
  year          integer,
  color         text,
  vin           text,
  mileage_in    integer,
  rfid_tag      text        UNIQUE,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.suppliers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  contact_name  text,
  phone         text,
  email         text,
  address       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.parts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number   text        UNIQUE,
  name          text        NOT NULL,
  description   text,
  quantity      integer     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level integer     NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  unit_cost     numeric     NOT NULL DEFAULT 0,
  selling_price numeric,
  supplier_id   uuid        REFERENCES azim_motors.suppliers(id) ON DELETE SET NULL,
  location      text,
  rfid_tag      text        UNIQUE,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.job_number_sequences (
  year   integer PRIMARY KEY,
  value  integer NOT NULL DEFAULT 0
);

CREATE TABLE azim_motors.job_cards (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number                  text        NOT NULL UNIQUE,
  vehicle_id                  uuid        NOT NULL REFERENCES azim_motors.vehicles(id)  ON DELETE RESTRICT,
  customer_id                 uuid        NOT NULL REFERENCES azim_motors.customers(id) ON DELETE RESTRICT,
  assigned_mechanic           uuid        REFERENCES azim_motors.profiles(id) ON DELETE SET NULL,
  created_by                  uuid        REFERENCES azim_motors.profiles(id) ON DELETE SET NULL,
  status                      text        NOT NULL DEFAULT 'Pending'
                                CHECK (status IN ('Pending','In Progress','Completed','Cancelled')),
  service_type                text,
  complaint                   text        NOT NULL,
  diagnosis                   text,
  work_done                   text,
  date_received               date        NOT NULL DEFAULT CURRENT_DATE,
  estimated_return            date,
  actual_return               date,
  labour_cost                 numeric     NOT NULL DEFAULT 0,
  quoted_amount               numeric     NOT NULL DEFAULT 0,
  total_parts_cost            numeric     NOT NULL DEFAULT 0,
  payment_status              text        NOT NULL DEFAULT 'Unpaid'
                                CHECK (payment_status IN ('Unpaid','Deposit Paid','Paid')),
  customer_notification_sent  boolean     NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.job_card_parts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id    uuid        NOT NULL REFERENCES azim_motors.job_cards(id) ON DELETE CASCADE,
  part_id        uuid        NOT NULL REFERENCES azim_motors.parts(id)     ON DELETE RESTRICT,
  quantity_used  integer     NOT NULL CHECK (quantity_used > 0),
  unit_cost      numeric     NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_card_id, part_id)
);

CREATE TABLE azim_motors.repair_records (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id     uuid        NOT NULL REFERENCES azim_motors.job_cards(id)  ON DELETE CASCADE,
  vehicle_id      uuid        NOT NULL REFERENCES azim_motors.vehicles(id)   ON DELETE CASCADE,
  customer_id     uuid        NOT NULL REFERENCES azim_motors.customers(id)  ON DELETE CASCADE,
  completed_at    timestamptz NOT NULL DEFAULT now(),
  diagnosis       text,
  work_done       text,
  labour_cost     numeric,
  total_cost      numeric,
  mileage_out     integer,
  technician_name text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.stock_movements (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id         uuid        NOT NULL REFERENCES azim_motors.parts(id)    ON DELETE CASCADE,
  job_card_id     uuid        REFERENCES azim_motors.job_cards(id)         ON DELETE SET NULL,
  movement_type   text        NOT NULL CHECK (movement_type IN ('IN','OUT','ADJUSTMENT')),
  quantity        integer     NOT NULL,
  quantity_before integer     NOT NULL,
  quantity_after  integer     NOT NULL,
  reason          text,
  performed_by    uuid        REFERENCES azim_motors.profiles(id)          ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.sales (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     text        NOT NULL UNIQUE,
  customer_name   text,
  customer_phone  text,
  subtotal        numeric     NOT NULL DEFAULT 0,
  discount_amount numeric     NOT NULL DEFAULT 0,
  total_amount    numeric     NOT NULL DEFAULT 0,
  payment_method  text        NOT NULL DEFAULT 'Cash',
  notes           text,
  sold_by         uuid        REFERENCES azim_motors.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.sale_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid        NOT NULL REFERENCES azim_motors.sales(id) ON DELETE CASCADE,
  part_id     uuid        NOT NULL REFERENCES azim_motors.parts(id) ON DELETE RESTRICT,
  quantity    integer     NOT NULL CHECK (quantity > 0),
  unit_price  numeric     NOT NULL,
  line_total  numeric     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE azim_motors.password_reset_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  token      text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX ON azim_motors.customers           (full_name);
CREATE INDEX ON azim_motors.customers           (phone);
CREATE INDEX ON azim_motors.vehicles            (customer_id);
CREATE INDEX ON azim_motors.vehicles            (registration);
CREATE INDEX ON azim_motors.parts               (name);
CREATE INDEX ON azim_motors.job_cards           (customer_id);
CREATE INDEX ON azim_motors.job_cards           (vehicle_id);
CREATE INDEX ON azim_motors.job_cards           (status);
CREATE INDEX ON azim_motors.job_cards           (estimated_return);
CREATE INDEX ON azim_motors.job_card_parts      (job_card_id);
CREATE INDEX ON azim_motors.stock_movements     (part_id);
CREATE INDEX ON azim_motors.repair_records      (vehicle_id);

-- ── GRANTS ───────────────────────────────────────────────────

GRANT USAGE ON SCHEMA azim_motors TO anon, authenticated, service_role;
GRANT ALL   ON ALL TABLES    IN SCHEMA azim_motors TO service_role;
GRANT ALL   ON ALL SEQUENCES IN SCHEMA azim_motors TO service_role;

-- ── FUNCTIONS ────────────────────────────────────────────────

-- Atomically generate the next job card number for the current year.
CREATE OR REPLACE FUNCTION azim_motors.next_job_number()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_year  integer := EXTRACT(YEAR FROM now())::integer;
  v_value integer;
BEGIN
  INSERT INTO azim_motors.job_number_sequences (year, value)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET value = azim_motors.job_number_sequences.value + 1
  RETURNING value INTO v_value;

  RETURN 'JC-' || v_year || '-' || LPAD(v_value::text, 4, '0');
END;
$$;

-- Atomically generate the next POS sale number.
CREATE OR REPLACE FUNCTION azim_motors.next_sale_number()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_year    integer := EXTRACT(YEAR FROM now())::integer;
  v_seq_key integer := EXTRACT(YEAR FROM now())::integer + 1000;
  v_value   integer;
BEGIN
  INSERT INTO azim_motors.job_number_sequences (year, value)
  VALUES (v_seq_key, 1)
  ON CONFLICT (year) DO UPDATE
    SET value = azim_motors.job_number_sequences.value + 1
  RETURNING value INTO v_value;

  RETURN 'POS-' || v_year || '-' || LPAD(v_value::text, 4, '0');
END;
$$;

-- Recalculate total_parts_cost on a job card.
CREATE OR REPLACE FUNCTION azim_motors.recalculate_job_parts_cost(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE azim_motors.job_cards
  SET total_parts_cost = COALESCE(
        (SELECT SUM(quantity_used * unit_cost)
         FROM azim_motors.job_card_parts
         WHERE job_card_id = p_job_id), 0),
      updated_at = now()
  WHERE id = p_job_id;
END;
$$;

-- Auto-create a repair record when a job is marked Completed.
CREATE OR REPLACE FUNCTION azim_motors.ensure_repair_record(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_job            record;
  v_mechanic_name  text;
BEGIN
  SELECT * INTO v_job FROM azim_motors.job_cards WHERE id = p_job_id;
  IF v_job IS NULL OR v_job.status <> 'Completed' THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM azim_motors.repair_records WHERE job_card_id = p_job_id) THEN RETURN; END IF;

  IF v_job.assigned_mechanic IS NOT NULL THEN
    SELECT full_name INTO v_mechanic_name
    FROM azim_motors.profiles WHERE id = v_job.assigned_mechanic;
  END IF;

  INSERT INTO azim_motors.repair_records
        (id, job_card_id, vehicle_id, customer_id, completed_at,
         diagnosis, work_done, labour_cost, total_cost,
         mileage_out, technician_name, created_at)
  VALUES (gen_random_uuid(), v_job.id, v_job.vehicle_id, v_job.customer_id, now(),
          v_job.diagnosis, v_job.work_done, v_job.labour_cost,
          v_job.labour_cost + v_job.total_parts_cost,
          NULL, v_mechanic_name, now());
END;
$$;

-- Transactionally add a part to a job card (deducts stock).
CREATE OR REPLACE FUNCTION azim_motors.add_job_card_part(
  p_job_card_id  uuid,
  p_part_id      uuid,
  p_quantity     integer,
  p_actor_id     uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_part     record;
  v_next_qty integer;
  v_cost     numeric;
BEGIN
  SELECT * INTO v_part FROM azim_motors.parts WHERE id = p_part_id FOR UPDATE;
  IF v_part IS NULL THEN RAISE EXCEPTION 'Part not found.'; END IF;
  IF v_part.quantity < p_quantity THEN RAISE EXCEPTION 'Insufficient stock for selected part.'; END IF;
  IF EXISTS (
    SELECT 1 FROM azim_motors.job_card_parts
    WHERE job_card_id = p_job_card_id AND part_id = p_part_id
  ) THEN RAISE EXCEPTION 'That part is already attached to the job card.'; END IF;

  v_next_qty := v_part.quantity - p_quantity;
  v_cost     := COALESCE(v_part.selling_price, v_part.unit_cost);

  INSERT INTO azim_motors.job_card_parts
        (id, job_card_id, part_id, quantity_used, unit_cost, created_at)
  VALUES (gen_random_uuid(), p_job_card_id, p_part_id, p_quantity, v_cost, now());

  UPDATE azim_motors.parts
  SET quantity = v_next_qty, updated_at = now()
  WHERE id = p_part_id;

  INSERT INTO azim_motors.stock_movements
        (id, part_id, job_card_id, movement_type, quantity,
         quantity_before, quantity_after, reason, performed_by, created_at)
  VALUES (gen_random_uuid(), p_part_id, p_job_card_id, 'OUT', -p_quantity,
          v_part.quantity, v_next_qty, 'Used on job card', p_actor_id, now());

  PERFORM azim_motors.recalculate_job_parts_cost(p_job_card_id);
END;
$$;

-- Transactionally remove a part line from a job card (restores stock).
CREATE OR REPLACE FUNCTION azim_motors.remove_job_card_part(
  p_line_id  uuid,
  p_actor_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_line     record;
  v_cur_qty  integer;
  v_next_qty integer;
BEGIN
  SELECT * INTO v_line FROM azim_motors.job_card_parts WHERE id = p_line_id;
  IF v_line IS NULL THEN RAISE EXCEPTION 'Part line not found.'; END IF;

  SELECT quantity INTO v_cur_qty FROM azim_motors.parts WHERE id = v_line.part_id FOR UPDATE;
  v_next_qty := v_cur_qty + v_line.quantity_used;

  DELETE FROM azim_motors.job_card_parts WHERE id = p_line_id;

  UPDATE azim_motors.parts
  SET quantity = v_next_qty, updated_at = now()
  WHERE id = v_line.part_id;

  INSERT INTO azim_motors.stock_movements
        (id, part_id, job_card_id, movement_type, quantity,
         quantity_before, quantity_after, reason, performed_by, created_at)
  VALUES (gen_random_uuid(), v_line.part_id, v_line.job_card_id, 'IN', v_line.quantity_used,
          v_cur_qty, v_next_qty, 'Removed from job card', p_actor_id, now());

  PERFORM azim_motors.recalculate_job_parts_cost(v_line.job_card_id);
END;
$$;

-- Transactionally delete a job card (restores all part stock).
CREATE OR REPLACE FUNCTION azim_motors.delete_job_card(
  p_job_id   uuid,
  p_actor_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_status   text;
  v_line     record;
  v_cur_qty  integer;
  v_next_qty integer;
BEGIN
  SELECT status INTO v_status FROM azim_motors.job_cards WHERE id = p_job_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Job card not found.'; END IF;
  IF v_status = 'Completed' THEN RAISE EXCEPTION 'Completed job cards cannot be deleted.'; END IF;

  FOR v_line IN
    SELECT * FROM azim_motors.job_card_parts WHERE job_card_id = p_job_id
  LOOP
    SELECT quantity INTO v_cur_qty FROM azim_motors.parts WHERE id = v_line.part_id FOR UPDATE;
    v_next_qty := v_cur_qty + v_line.quantity_used;

    UPDATE azim_motors.parts
    SET quantity = v_next_qty, updated_at = now()
    WHERE id = v_line.part_id;

    INSERT INTO azim_motors.stock_movements
          (id, part_id, job_card_id, movement_type, quantity,
           quantity_before, quantity_after, reason, performed_by, created_at)
    VALUES (gen_random_uuid(), v_line.part_id, p_job_id, 'IN', v_line.quantity_used,
            v_cur_qty, v_next_qty, 'Job card deleted', p_actor_id, now());
  END LOOP;

  DELETE FROM azim_motors.job_cards WHERE id = p_job_id;
END;
$$;

-- Transactionally adjust stock for a part.
CREATE OR REPLACE FUNCTION azim_motors.adjust_part_stock(
  p_part_id  uuid,
  p_quantity integer,
  p_reason   text    DEFAULT NULL,
  p_actor_id uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_cur_qty  integer;
  v_next_qty integer;
BEGIN
  SELECT quantity INTO v_cur_qty FROM azim_motors.parts WHERE id = p_part_id FOR UPDATE;
  IF v_cur_qty IS NULL THEN RAISE EXCEPTION 'Part not found.'; END IF;

  v_next_qty := v_cur_qty + p_quantity;
  IF v_next_qty < 0 THEN RAISE EXCEPTION 'Adjustment would make stock negative.'; END IF;

  UPDATE azim_motors.parts
  SET quantity = v_next_qty, updated_at = now()
  WHERE id = p_part_id;

  INSERT INTO azim_motors.stock_movements
        (id, part_id, job_card_id, movement_type, quantity,
         quantity_before, quantity_after, reason, performed_by, created_at)
  VALUES (gen_random_uuid(), p_part_id, NULL, 'ADJUSTMENT', p_quantity,
          v_cur_qty, v_next_qty,
          COALESCE(p_reason, 'Manual adjustment'), p_actor_id, now());
END;
$$;

-- Create a POS sale transactionally.
CREATE OR REPLACE FUNCTION azim_motors.create_sale(
  p_customer_name   text,
  p_customer_phone  text,
  p_payment_method  text,
  p_notes           text,
  p_sold_by         uuid,
  p_discount_amount numeric,
  p_items           jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sale_id    uuid    := gen_random_uuid();
  v_sale_num   text;
  v_item       record;
  v_part       record;
  v_unit_price numeric;
  v_line_total numeric;
  v_subtotal   numeric := 0;
  v_total      numeric;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Add at least one stock item to the sale.';
  END IF;

  v_sale_num := azim_motors.next_sale_number();

  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(part_id uuid, quantity integer)
  LOOP
    SELECT * INTO v_part FROM azim_motors.parts WHERE id = v_item.part_id FOR UPDATE;
    IF v_part IS NULL THEN RAISE EXCEPTION 'One of the selected stock items no longer exists.'; END IF;
    IF v_part.quantity < v_item.quantity THEN
      RAISE EXCEPTION '% does not have enough stock.', v_part.name;
    END IF;

    v_unit_price := COALESCE(v_part.selling_price, v_part.unit_cost);
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal   := v_subtotal + v_line_total;

    INSERT INTO azim_motors.sale_items
          (id, sale_id, part_id, quantity, unit_price, line_total, created_at)
    VALUES (gen_random_uuid(), v_sale_id, v_item.part_id, v_item.quantity,
            v_unit_price, v_line_total, now());

    UPDATE azim_motors.parts
    SET quantity = quantity - v_item.quantity, updated_at = now()
    WHERE id = v_item.part_id;

    INSERT INTO azim_motors.stock_movements
          (id, part_id, job_card_id, movement_type, quantity,
           quantity_before, quantity_after, reason, performed_by, created_at)
    VALUES (gen_random_uuid(), v_item.part_id, NULL, 'OUT', -v_item.quantity,
            v_part.quantity, v_part.quantity - v_item.quantity,
            'POS sale', p_sold_by, now());
  END LOOP;

  v_total := GREATEST(v_subtotal - COALESCE(p_discount_amount, 0), 0);

  INSERT INTO azim_motors.sales
        (id, sale_number, customer_name, customer_phone, subtotal,
         discount_amount, total_amount, payment_method, notes, sold_by, created_at)
  VALUES (v_sale_id, v_sale_num, p_customer_name, p_customer_phone, v_subtotal,
          COALESCE(p_discount_amount, 0), v_total,
          COALESCE(p_payment_method, 'Cash'), p_notes, p_sold_by, now());

  RETURN jsonb_build_object(
    'id',           v_sale_id,
    'sale_number',  v_sale_num,
    'total_amount', v_total
  );
END;
$$;

-- Seed sample suppliers and parts (idempotent).
CREATE OR REPLACE FUNCTION azim_motors.seed_sample_inventory()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sup1_id   uuid;
  v_sup2_id   uuid;
  v_part_id   uuid;
  v_inserted  integer := 0;
BEGIN
  -- Suppliers
  SELECT id INTO v_sup1_id FROM azim_motors.suppliers WHERE name = 'Star Benz Spares' LIMIT 1;
  IF v_sup1_id IS NULL THEN
    v_sup1_id := gen_random_uuid();
    INSERT INTO azim_motors.suppliers (id, name, contact_name, phone, email, address, created_at)
    VALUES (v_sup1_id, 'Star Benz Spares', 'Martin Dube', '+263774110220',
            'benzparts@azim.local', 'Msasa Industrial, Harare', now());
  END IF;

  SELECT id INTO v_sup2_id FROM azim_motors.suppliers WHERE name = 'Workshop Tools Hub' LIMIT 1;
  IF v_sup2_id IS NULL THEN
    v_sup2_id := gen_random_uuid();
    INSERT INTO azim_motors.suppliers (id, name, contact_name, phone, email, address, created_at)
    VALUES (v_sup2_id, 'Workshop Tools Hub', 'Rudo Moyo', '+263774220330',
            'tools@azim.local', 'Graniteside, Harare', now());
  END IF;

  -- Parts (skip if part_number already exists)
  IF NOT EXISTS (SELECT 1 FROM azim_motors.parts WHERE part_number = 'MB-W204-OFK') THEN
    v_part_id := gen_random_uuid();
    INSERT INTO azim_motors.parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
    VALUES (v_part_id, 'MB-W204-OFK', 'Mercedes-Benz W204 Oil Filter Kit',
            'Service kit with oil filter, sump washer, and O-rings for routine C-Class servicing.',
            12, 3, 18, 30, v_sup1_id, 'Shelf A1', true, now(), now());
    INSERT INTO azim_motors.stock_movements (id, part_id, movement_type, quantity, quantity_before, quantity_after, reason, created_at)
    VALUES (gen_random_uuid(), v_part_id, 'IN', 12, 0, 12, 'Seed sample stock', now());
    v_inserted := v_inserted + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM azim_motors.parts WHERE part_number = 'MB-BPF-212') THEN
    v_part_id := gen_random_uuid();
    INSERT INTO azim_motors.parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
    VALUES (v_part_id, 'MB-BPF-212', 'Mercedes-Benz Brake Pad Set Front',
            'Front brake pad set suitable for common E-Class workshop jobs.',
            8, 2, 52, 78, v_sup1_id, 'Shelf A4', true, now(), now());
    INSERT INTO azim_motors.stock_movements (id, part_id, movement_type, quantity, quantity_before, quantity_after, reason, created_at)
    VALUES (gen_random_uuid(), v_part_id, 'IN', 8, 0, 8, 'Seed sample stock', now());
    v_inserted := v_inserted + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM azim_motors.parts WHERE part_number = 'KIT-TUNE-01') THEN
    v_part_id := gen_random_uuid();
    INSERT INTO azim_motors.parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
    VALUES (v_part_id, 'KIT-TUNE-01', 'Engine Tune-Up Repair Kit',
            'Assorted plugs, belts, and fluid-service consumables for tune-up work.',
            6, 2, 95, 135, v_sup2_id, 'Kit Rack B2', true, now(), now());
    INSERT INTO azim_motors.stock_movements (id, part_id, movement_type, quantity, quantity_before, quantity_after, reason, created_at)
    VALUES (gen_random_uuid(), v_part_id, 'IN', 6, 0, 6, 'Seed sample stock', now());
    v_inserted := v_inserted + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM azim_motors.parts WHERE part_number = 'TOOL-TW-12') THEN
    v_part_id := gen_random_uuid();
    INSERT INTO azim_motors.parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
    VALUES (v_part_id, 'TOOL-TW-12', 'Torque Wrench 1/2 inch',
            'Workshop-grade torque wrench for suspension, wheel, and engine work.',
            4, 1, 80, 120, v_sup2_id, 'Tool Wall C1', true, now(), now());
    INSERT INTO azim_motors.stock_movements (id, part_id, movement_type, quantity, quantity_before, quantity_after, reason, created_at)
    VALUES (gen_random_uuid(), v_part_id, 'IN', 4, 0, 4, 'Seed sample stock', now());
    v_inserted := v_inserted + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM azim_motors.parts WHERE part_number = 'MB-SBK-ML') THEN
    v_part_id := gen_random_uuid();
    INSERT INTO azim_motors.parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
    VALUES (v_part_id, 'MB-SBK-ML', 'Mercedes-Benz Suspension Bush Kit',
            'Front-end bush repair kit for common Mercedes suspension jobs.',
            5, 2, 68, 102, v_sup1_id, 'Shelf B3', true, now(), now());
    INSERT INTO azim_motors.stock_movements (id, part_id, movement_type, quantity, quantity_before, quantity_after, reason, created_at)
    VALUES (gen_random_uuid(), v_part_id, 'IN', 5, 0, 5, 'Seed sample stock', now());
    v_inserted := v_inserted + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM azim_motors.parts WHERE part_number = 'TOOL-OBD-PRO') THEN
    v_part_id := gen_random_uuid();
    INSERT INTO azim_motors.parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
    VALUES (v_part_id, 'TOOL-OBD-PRO', 'Diagnostic Scanner OBD Kit',
            'Garage diagnostic tool kit for quick ECU scan and fault tracing.',
            3, 1, 140, 195, v_sup2_id, 'Tool Locker D2', true, now(), now());
    INSERT INTO azim_motors.stock_movements (id, part_id, movement_type, quantity, quantity_before, quantity_after, reason, created_at)
    VALUES (gen_random_uuid(), v_part_id, 'IN', 3, 0, 3, 'Seed sample stock', now());
    v_inserted := v_inserted + 1;
  END IF;

  RETURN jsonb_build_object('inserted_parts', v_inserted);
END;
$$;

-- Grant execute on all functions to service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA azim_motors TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA azim_motors TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA azim_motors TO anon;

-- Expose azim_motors to PostgREST
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,azim_motors';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
