import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapProfile, toDbProfileUpdate, type Profile } from '../lib/mappers';
import { showError } from '../lib/toast';

interface UseProfileReturn {
  /** The user profile, or null if not yet loaded */
  profile: Profile | null;
  /** Whether the profile is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Update the profile (excludes is_admin and subscription_tier) */
  update: (updates: Partial<Omit<Profile, 'id' | 'isAdmin' | 'subscriptionTier' | 'createdAt' | 'updatedAt'>>) => Promise<{ error: string | null }>;
}

/**
 * Hook to fetch and update a user's profile.
 *
 * @param userId - The user's ID (from auth)
 * @returns Profile data and mutation functions
 *
 * @example
 * ```tsx
 * const { profile, isLoading, error, update } = useProfile(user.id);
 *
 * const handleSave = async () => {
 *   const { error } = await update({ phone: '+1234567890' });
 *   if (error) console.error(error);
 * };
 * ```
 */
export function useProfile(userId: string | undefined): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        showError('Failed to load profile');
        setProfile(null);
      } else if (data) {
        setProfile(mapProfile(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = useCallback(
    async (
      updates: Partial<Omit<Profile, 'id' | 'isAdmin' | 'subscriptionTier' | 'createdAt' | 'updatedAt'>>
    ): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const dbUpdates = toDbProfileUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        showError('Failed to update profile');
        return { error: updateError.message };
      }

      if (data) {
        setProfile(mapProfile(data));
      }

      return { error: null };
    },
    [userId]
  );

  return {
    profile,
    isLoading,
    error,
    refresh: fetchProfile,
    update,
  };
}

export default useProfile;
