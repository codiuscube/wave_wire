-- Simplify alert window logic by replacing specific flags with a unified mode
-- Date: 2025-12-19

ALTER TABLE alert_settings
  DROP COLUMN IF EXISTS daylight_window_enabled,
  DROP COLUMN IF EXISTS quiet_hours_enabled,
  DROP COLUMN IF EXISTS quiet_hours_start,
  DROP COLUMN IF EXISTS quiet_hours_end;

ALTER TABLE alert_settings
  ADD COLUMN window_mode text CHECK (window_mode IN ('solar', 'clock', 'always')) DEFAULT 'solar',
  ADD COLUMN window_start_time time DEFAULT '06:00',
  ADD COLUMN window_end_time time DEFAULT '22:00';

-- Force existing rows to default
UPDATE alert_settings SET window_mode = 'solar' WHERE window_mode IS NULL;
