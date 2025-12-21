-- Add columns to existing tables for alert system

-- Triggers: track last fired time and enabled status
ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS last_fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.triggers.last_fired_at IS 'Timestamp of when this trigger last sent an alert';
COMMENT ON COLUMN public.triggers.enabled IS 'Whether this trigger is active for alert evaluation';

-- Sent alerts: link to match and store Resend email ID
-- Only add match_id if trigger_matches table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trigger_matches') THEN
    ALTER TABLE public.sent_alerts ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.trigger_matches(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_sent_alerts_match ON public.sent_alerts(match_id);
    COMMENT ON COLUMN public.sent_alerts.match_id IS 'Reference to the trigger_match that generated this alert';
  END IF;
END $$;

ALTER TABLE public.sent_alerts
  ADD COLUMN IF NOT EXISTS resend_id TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_sent_alerts_delivery_status ON public.sent_alerts(delivery_status);

COMMENT ON COLUMN public.sent_alerts.resend_id IS 'Resend API message ID for tracking delivery';
COMMENT ON COLUMN public.sent_alerts.error_message IS 'Error message if delivery failed';

-- Profiles: add timezone for surveillance window calculations
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago';

COMMENT ON COLUMN public.profiles.timezone IS 'User timezone for surveillance window calculations (IANA format)';
