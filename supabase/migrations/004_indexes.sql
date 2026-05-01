-- ============================================================
-- AZIM MOTORS - Migration 004: Indexes
-- ============================================================

CREATE INDEX idx_vehicles_customer        ON azim_motors.vehicles(customer_id);
CREATE INDEX idx_vehicles_registration    ON azim_motors.vehicles(registration);
CREATE INDEX idx_job_cards_vehicle        ON azim_motors.job_cards(vehicle_id);
CREATE INDEX idx_job_cards_customer       ON azim_motors.job_cards(customer_id);
CREATE INDEX idx_job_cards_mechanic       ON azim_motors.job_cards(assigned_mechanic);
CREATE INDEX idx_job_cards_status         ON azim_motors.job_cards(status);
CREATE INDEX idx_job_cards_est_return     ON azim_motors.job_cards(estimated_return)
  WHERE status NOT IN ('Completed', 'Cancelled');
CREATE INDEX idx_job_card_parts_job       ON azim_motors.job_card_parts(job_card_id);
CREATE INDEX idx_job_card_parts_part      ON azim_motors.job_card_parts(part_id);
CREATE INDEX idx_repair_records_vehicle   ON azim_motors.repair_records(vehicle_id);
CREATE INDEX idx_repair_records_customer  ON azim_motors.repair_records(customer_id);
CREATE INDEX idx_parts_low_stock          ON azim_motors.parts(quantity)
  WHERE quantity <= reorder_level AND is_active = TRUE;
CREATE INDEX idx_stock_movements_part     ON azim_motors.stock_movements(part_id);
CREATE INDEX idx_stock_movements_job      ON azim_motors.stock_movements(job_card_id);
