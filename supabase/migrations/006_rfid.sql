-- ============================================================
-- AZIM MOTORS - Migration 006: RFID Support
-- Chainway C72 UHF RFID integration
-- ============================================================

SET search_path TO azim_motors, public;

-- RFID tag columns on existing tables
ALTER TABLE azim_motors.vehicles ADD COLUMN IF NOT EXISTS rfid_tag TEXT UNIQUE;
ALTER TABLE azim_motors.parts    ADD COLUMN IF NOT EXISTS rfid_tag TEXT UNIQUE;

-- RFID scan event log
CREATE TABLE IF NOT EXISTS azim_motors.rfid_scan_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epc          TEXT NOT NULL,
  scan_type    TEXT NOT NULL,
  vehicle_id   UUID REFERENCES azim_motors.vehicles(id) ON DELETE SET NULL,
  part_id      UUID REFERENCES azim_motors.parts(id)    ON DELETE SET NULL,
  job_card_id  UUID REFERENCES azim_motors.job_cards(id) ON DELETE SET NULL,
  device_id    TEXT,
  scanned_by   UUID REFERENCES azim_motors.user_profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_rfid    ON azim_motors.vehicles(rfid_tag) WHERE rfid_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_parts_rfid       ON azim_motors.parts(rfid_tag)    WHERE rfid_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rfid_log_epc     ON azim_motors.rfid_scan_log(epc);
CREATE INDEX IF NOT EXISTS idx_rfid_log_created ON azim_motors.rfid_scan_log(created_at DESC);

-- RLS
ALTER TABLE azim_motors.rfid_scan_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfid_log_select" ON azim_motors.rfid_scan_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "rfid_log_insert" ON azim_motors.rfid_scan_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Grants
GRANT SELECT, INSERT ON azim_motors.rfid_scan_log TO anon, authenticated;
