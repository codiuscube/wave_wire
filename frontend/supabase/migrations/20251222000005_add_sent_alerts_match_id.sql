-- Fix: Add match_id column to sent_alerts
-- This column links alerts to trigger_matches for tracking

ALTER TABLE public.sent_alerts
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.trigger_matches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sent_alerts_match ON public.sent_alerts(match_id);

COMMENT ON COLUMN public.sent_alerts.match_id IS 'Reference to the trigger_match that generated this alert';
