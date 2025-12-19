import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapAlertSettings, toDbAlertSettingsUpdate, type AlertSettings } from '../lib/mappers';

interface UseAlertSettingsReturn {
  /** The user's alert settings, or null if not yet loaded */
  settings: AlertSettings | null;
  /** Whether the settings are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Update the alert settings */
  update: (updates: Partial<Omit<AlertSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<{ error: string | null }>;
}

const DEFAULT_SETTINGS: Omit<AlertSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  windowMode: 'solar',
  windowStartTime: '06:00',
  windowEndTime: '22:00',
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  forecastAlertsEnabled: false,
  twoDayForecastEnabled: false,
  fiveDayForecastEnabled: false,
  liveAlertsEnabled: true,
};

/**
 * Hook to fetch and update a user's alert settings.
 * Auto-creates default settings if the user has none.
 *
 * @param userId - The user's ID (from auth)
 * @returns Alert settings data and mutation functions
 *
 * @example
 * ```tsx
 * const { settings, isLoading, error, update } = useAlertSettings(user.id);
 *
 * const handleToggle = async () => {
 *   const { error } = await update({ forecastAlertsEnabled: false });
 *   if (error) console.error(error);
 * };
 * ```
 */
export function useAlertSettings(userId: string | undefined): UseAlertSettingsReturn {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch existing settings
      const { data, error: fetchError } = await supabase
        .from('alert_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // If no row exists, create default settings
        if (fetchError.code === 'PGRST116') {
          const { data: insertedData, error: insertError } = await supabase
            .from('alert_settings')
            .insert({
              user_id: userId,
              window_mode: DEFAULT_SETTINGS.windowMode,
              window_start_time: DEFAULT_SETTINGS.windowStartTime,
              window_end_time: DEFAULT_SETTINGS.windowEndTime,
              active_days: DEFAULT_SETTINGS.activeDays,
              forecast_alerts_enabled: DEFAULT_SETTINGS.forecastAlertsEnabled,
              two_day_forecast_enabled: DEFAULT_SETTINGS.twoDayForecastEnabled,
              five_day_forecast_enabled: DEFAULT_SETTINGS.fiveDayForecastEnabled,
              live_alerts_enabled: DEFAULT_SETTINGS.liveAlertsEnabled,
            })
            .select()
            .single();

          if (insertError) {
            setError(insertError.message);
            setSettings(null);
          } else if (insertedData) {
            setSettings(mapAlertSettings(insertedData));
          }
        } else {
          setError(fetchError.message);
          setSettings(null);
        }
      } else if (data) {
        setSettings(mapAlertSettings(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const update = useCallback(
    async (
      updates: Partial<Omit<AlertSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const dbUpdates = toDbAlertSettingsUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('alert_settings')
        .update(dbUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        return { error: updateError.message };
      }

      if (data) {
        setSettings(mapAlertSettings(data));
      }

      return { error: null };
    },
    [userId]
  );

  return {
    settings,
    isLoading,
    error,
    refresh: fetchSettings,
    update,
  };
}

export default useAlertSettings;
