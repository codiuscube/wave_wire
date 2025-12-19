-- Add two_day_forecast_enabled to alert_settings
-- Date: 2025-12-19

ALTER TABLE alert_settings
  ADD COLUMN two_day_forecast_enabled boolean DEFAULT false;
