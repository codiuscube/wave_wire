-- Add five day forecast alert type
-- Date: 2024-12-19

ALTER TABLE alert_settings
ADD COLUMN five_day_forecast_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN alert_settings.five_day_forecast_enabled IS 'Enable 5-day advance forecast alerts';
