-- Add notification channel preferences to alert_settings
ALTER TABLE public.alert_settings
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.alert_settings.push_enabled IS 'Whether push notifications are enabled for this user';
COMMENT ON COLUMN public.alert_settings.email_enabled IS 'Whether email notifications are enabled for this user';
COMMENT ON COLUMN public.alert_settings.sms_enabled IS 'Whether SMS notifications are enabled (future feature)';

-- Push subscriptions table (stores OneSignal player IDs)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  onesignal_player_id TEXT NOT NULL,
  device_type TEXT,  -- 'web', 'ios_pwa', 'android_pwa'
  browser TEXT,      -- 'chrome', 'safari', 'firefox', 'edge'
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, onesignal_player_id)
);

COMMENT ON TABLE public.push_subscriptions IS 'Stores OneSignal push notification subscriptions per user device';

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own push subscriptions
CREATE POLICY "Users can read own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own push subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscriptions
CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own push subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for efficient lookups by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);

-- Add index for active subscriptions lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON public.push_subscriptions(user_id, is_active)
  WHERE is_active = true;

-- Add onesignal_id to sent_alerts for push delivery tracking
ALTER TABLE public.sent_alerts
  ADD COLUMN IF NOT EXISTS onesignal_id TEXT;

COMMENT ON COLUMN public.sent_alerts.onesignal_id IS 'OneSignal notification ID for push delivery tracking';

-- Create updated_at trigger for push_subscriptions
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();
