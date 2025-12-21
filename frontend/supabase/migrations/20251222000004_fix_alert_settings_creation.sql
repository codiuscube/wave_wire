-- Fix: Add alert_settings creation to handle_new_user function
-- Bug: Users weren't getting alert_settings records on signup,
-- causing the alert runner to skip all their triggers.

-- Update handle_new_user function to also create alert_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free')
  );

  -- Create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  -- Create default quiet hours
  INSERT INTO public.quiet_hours (user_id)
  VALUES (NEW.id);

  -- Create default alert schedules
  INSERT INTO public.alert_schedules (user_id, name, type, description, check_time)
  VALUES
    (NEW.id, 'Night Before Hype', 'forecast', 'Check tomorrow''s forecast', '20:00'),
    (NEW.id, 'Morning Reality Check', 'realtime', 'Live buoy validation', '06:00'),
    (NEW.id, 'Pop-Up Alert', 'popup', 'Catches sudden changes', NULL);

  -- Create default alert settings (THIS WAS MISSING!)
  INSERT INTO public.alert_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: Create alert_settings for existing users who don't have them
INSERT INTO public.alert_settings (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.alert_settings a ON a.user_id = p.id
WHERE a.id IS NULL;
