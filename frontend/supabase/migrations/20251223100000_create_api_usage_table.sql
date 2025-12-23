-- API Usage Tracking Table
-- Tracks API calls to external services (Open-Meteo, etc.) for rate limit monitoring

CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,           -- 'openmeteo_marine', 'openmeteo_weather', etc.
  endpoint text,                   -- Optional: specific endpoint called
  call_count integer NOT NULL DEFAULT 1,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source text                      -- 'dashboard', 'trigger_eval', 'script', etc.
);

-- Index for efficient time-based queries
CREATE INDEX idx_api_usage_service_time ON api_usage (service, recorded_at DESC);
CREATE INDEX idx_api_usage_recorded_at ON api_usage (recorded_at DESC);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view api_usage"
  ON api_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow inserts from authenticated users (for tracking)
CREATE POLICY "Authenticated users can insert api_usage"
  ON api_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role full access (for server-side scripts)
CREATE POLICY "Service role has full access"
  ON api_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Aggregated view for easy querying
CREATE OR REPLACE VIEW api_usage_stats AS
SELECT
  service,
  -- Last minute
  COALESCE(SUM(call_count) FILTER (WHERE recorded_at > now() - interval '1 minute'), 0) AS calls_last_minute,
  -- Last hour
  COALESCE(SUM(call_count) FILTER (WHERE recorded_at > now() - interval '1 hour'), 0) AS calls_last_hour,
  -- Last day (24 hours)
  COALESCE(SUM(call_count) FILTER (WHERE recorded_at > now() - interval '24 hours'), 0) AS calls_last_day,
  -- Last 30 days (for monthly approximation)
  COALESCE(SUM(call_count) FILTER (WHERE recorded_at > now() - interval '30 days'), 0) AS calls_last_30_days,
  -- Last recorded
  MAX(recorded_at) AS last_call_at
FROM api_usage
GROUP BY service;

-- Grant access to the view
GRANT SELECT ON api_usage_stats TO authenticated;

-- Function to log API usage (can be called from client or server)
CREATE OR REPLACE FUNCTION log_api_usage(
  p_service text,
  p_call_count integer DEFAULT 1,
  p_source text DEFAULT NULL,
  p_endpoint text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO api_usage (service, call_count, source, endpoint)
  VALUES (p_service, p_call_count, p_source, p_endpoint);
END;
$$;

-- Cleanup function to remove old records (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM api_usage
  WHERE recorded_at < now() - interval '90 days';
END;
$$;

COMMENT ON TABLE api_usage IS 'Tracks API calls to external services for rate limit monitoring';
COMMENT ON VIEW api_usage_stats IS 'Aggregated API usage statistics by service';
