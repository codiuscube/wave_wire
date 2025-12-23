import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapUserPreferences, toDbUserPreferencesUpdate, type UserPreferences } from '../lib/mappers';
import { showError } from '../lib/toast';

interface UseUserPreferencesReturn {
  /** The user's preferences, or null if not yet loaded */
  preferences: UserPreferences | null;
  /** Whether the preferences are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Update the user preferences */
  update: (updates: Partial<Omit<UserPreferences, 'id' | 'userId' | 'updatedAt'>>) => Promise<{ error: string | null }>;
}

/**
 * Hook to fetch and update a user's preferences.
 * User preferences are auto-created by the database handle_new_user trigger.
 *
 * @param userId - The user's ID (from auth)
 * @returns User preferences data and mutation functions
 *
 * @example
 * ```tsx
 * const { preferences, isLoading, error, update } = useUserPreferences(user.id);
 *
 * const handleModelChange = async (model: string) => {
 *   const { error } = await update({ defaultWaveModel: model });
 *   if (error) console.error(error);
 * };
 * ```
 */
export function useUserPreferences(userId: string | undefined): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setPreferences(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // User preferences should be created by handle_new_user trigger
        // If not found, it's an error condition
        if (fetchError.code === 'PGRST116') {
          setError('User preferences not found');
        } else {
          setError(fetchError.message);
          showError('Failed to load user preferences');
        }
        setPreferences(null);
      } else if (data) {
        setPreferences(mapUserPreferences(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const update = useCallback(
    async (
      updates: Partial<Omit<UserPreferences, 'id' | 'userId' | 'updatedAt'>>
    ): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const dbUpdates = toDbUserPreferencesUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('user_preferences')
        .update(dbUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        showError('Failed to update preferences');
        return { error: updateError.message };
      }

      if (data) {
        setPreferences(mapUserPreferences(data));
      }

      return { error: null };
    },
    [userId]
  );

  return {
    preferences,
    isLoading,
    error,
    refresh: fetchPreferences,
    update,
  };
}

export default useUserPreferences;
