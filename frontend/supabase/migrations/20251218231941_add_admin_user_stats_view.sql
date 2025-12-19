-- Migration: Add admin view for user statistics
-- Created: 2024-12-18
-- This view aggregates user activity data for the admin panel

-- ============================================
-- 1. Create admin_user_stats view
-- ============================================
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.phone,
  p.phone_verified,
  p.home_address,
  p.subscription_tier,
  p.is_admin,
  p.onboarding_completed,
  p.created_at,
  p.updated_at,
  -- Activity counts
  COALESCE(us.spots_count, 0)::integer AS spots_count,
  COALESCE(t.triggers_count, 0)::integer AS triggers_count,
  COALESCE(sa.alerts_sent, 0)::integer AS alerts_sent,
  -- Last activity (most recent of: profile update, spot update, trigger update, alert sent)
  GREATEST(
    p.updated_at,
    us.last_spot_activity,
    t.last_trigger_activity,
    sa.last_alert_sent
  ) AS last_activity
FROM public.profiles p
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*)::integer AS spots_count,
    MAX(updated_at) AS last_spot_activity
  FROM public.user_spots
  GROUP BY user_id
) us ON p.id = us.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*)::integer AS triggers_count,
    MAX(updated_at) AS last_trigger_activity
  FROM public.triggers
  GROUP BY user_id
) t ON p.id = t.user_id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*)::integer AS alerts_sent,
    MAX(sent_at) AS last_alert_sent
  FROM public.sent_alerts
  GROUP BY user_id
) sa ON p.id = sa.user_id;

-- ============================================
-- 2. Add indexes to optimize the view queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_spots_user_id ON public.user_spots(user_id);
CREATE INDEX IF NOT EXISTS idx_triggers_user_id ON public.triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_alerts_user_id ON public.sent_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_alerts_user_sent_at ON public.sent_alerts(user_id, sent_at DESC);
