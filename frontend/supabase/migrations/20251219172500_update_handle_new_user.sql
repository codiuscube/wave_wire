-- Update handle_new_user function to respect subscription_tier from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Use the subscription_tier from metadata if present, otherwise default to 'free'
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free')
  );

  -- Also create default preferences
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
