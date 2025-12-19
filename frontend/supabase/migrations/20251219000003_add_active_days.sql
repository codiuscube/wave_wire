-- Add active_days array to alert_settings
-- Date: 2025-12-19

ALTER TABLE alert_settings
  ADD COLUMN active_days text[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
