-- Create trigger_matches table for alert queue
-- This table stores matched triggers awaiting processing

CREATE TABLE public.trigger_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES public.triggers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.user_spots(id) ON DELETE CASCADE,

  -- Match metadata
  match_type TEXT NOT NULL CHECK (match_type IN ('live', 'forecast')),
  condition_matched TEXT CHECK (condition_matched IN ('fair', 'good', 'epic')),

  -- Condition snapshot for message generation
  condition_data JSONB NOT NULL,
  -- Expected shape: {
  --   waveHeight: number,
  --   wavePeriod: number,
  --   swellDirection: number,
  --   windSpeed: number,
  --   windDirection: string,
  --   tideHeight: number,
  --   tideDirection: string,
  --   spotName: string,
  --   buoyId: string
  -- }

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'skipped', 'failed')),
  skip_reason TEXT,
  processed_at TIMESTAMPTZ,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dedup: one match per trigger per day (based on matched_at date in UTC)
CREATE UNIQUE INDEX idx_trigger_matches_dedup
  ON public.trigger_matches(trigger_id, (DATE(matched_at AT TIME ZONE 'UTC')));

-- Indexes for efficient querying
CREATE INDEX idx_trigger_matches_status ON public.trigger_matches(status);
CREATE INDEX idx_trigger_matches_trigger ON public.trigger_matches(trigger_id);
CREATE INDEX idx_trigger_matches_user ON public.trigger_matches(user_id);
CREATE INDEX idx_trigger_matches_matched_at ON public.trigger_matches(matched_at);

-- Enable RLS
ALTER TABLE public.trigger_matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own matches
CREATE POLICY "Users can view own matches"
  ON public.trigger_matches FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (used by GitHub Actions) can insert matches
CREATE POLICY "Service can insert matches"
  ON public.trigger_matches FOR INSERT
  WITH CHECK (true);

-- Service role can update matches
CREATE POLICY "Service can update matches"
  ON public.trigger_matches FOR UPDATE
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.trigger_matches IS 'Queue table for matched triggers awaiting alert processing';
COMMENT ON COLUMN public.trigger_matches.condition_data IS 'Snapshot of surf conditions at match time for message generation';
COMMENT ON COLUMN public.trigger_matches.match_type IS 'Whether match was from live buoy data or forecast data';
