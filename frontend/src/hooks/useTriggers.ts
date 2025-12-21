import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapTrigger, toDbTriggerInsert, toDbTriggerUpdate, type Trigger } from '../lib/mappers';
import { showError } from '../lib/toast';

type SubscriptionTier = 'free' | 'pro' | 'premium';

const TRIGGER_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  pro: Infinity, // Free (Beta) - same as premium during beta
  premium: Infinity,
};

interface UseTriggersReturn {
  /** The user's triggers */
  triggers: Trigger[];
  /** Whether the triggers are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Whether the user can add another trigger based on their tier */
  canAddTrigger: boolean;
  /** Current trigger count */
  triggerCount: number;
  /** Maximum triggers allowed for tier */
  triggerLimit: number;
  /** Add a new trigger */
  addTrigger: (trigger: Omit<Trigger, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ data: Trigger | null; error: string | null }>;
  /** Update an existing trigger */
  updateTrigger: (triggerId: string, updates: Partial<Omit<Trigger, 'id' | 'userId' | 'spotId' | 'createdAt' | 'updatedAt'>>) => Promise<{ error: string | null }>;
  /** Delete a trigger */
  deleteTrigger: (triggerId: string) => Promise<{ error: string | null }>;
}

/**
 * Hook to manage a user's triggers with tier-based limits.
 *
 * @param userId - The user's ID
 * @param tier - The user's subscription tier (determines trigger limit)
 * @returns Triggers data and CRUD functions
 *
 * @example
 * ```tsx
 * const { triggers, canAddTrigger, addTrigger, deleteTrigger } = useTriggers(user.id, 'free');
 *
 * if (!canAddTrigger) {
 *   return <UpgradePrompt />;
 * }
 * ```
 */
export function useTriggers(
  userId: string | undefined,
  tier: SubscriptionTier = 'free'
): UseTriggersReturn {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerLimit = TRIGGER_LIMITS[tier];
  const triggerCount = triggers.length;
  const canAddTrigger = triggerCount < triggerLimit;

  const fetchTriggers = useCallback(async () => {
    if (!userId) {
      setTriggers([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('triggers')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        showError('Failed to load triggers');
        setTriggers([]);
      } else if (data) {
        setTriggers(data.map(mapTrigger));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  const addTrigger = useCallback(
    async (
      trigger: Omit<Trigger, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<{ data: Trigger | null; error: string | null }> => {
      if (!userId) {
        return { data: null, error: 'No user ID provided' };
      }

      // Frontend validation for better UX
      if (!canAddTrigger) {
        return {
          data: null,
          error: `You've reached the ${tier} tier limit of ${triggerLimit} trigger${triggerLimit === 1 ? '' : 's'}. Upgrade to add more.`,
        };
      }

      // Check for duplicate condition for this spot
      const existingCondition = triggers.find(
        t => t.spotId === trigger.spotId && t.condition === trigger.condition
      );

      if (existingCondition) {
        return {
          data: null,
          error: `A ${trigger.condition} trigger already exists for this spot.`,
        };
      }

      const dbTrigger = toDbTriggerInsert({ ...trigger, userId });

      const { data, error: insertError } = await supabase
        .from('triggers')
        .insert(dbTrigger)
        .select()
        .single();

      if (insertError) {
        showError('Failed to add trigger');
        return { data: null, error: insertError.message };
      }

      if (data) {
        const mappedTrigger = mapTrigger(data);
        setTriggers((prev) => [mappedTrigger, ...prev]);
        return { data: mappedTrigger, error: null };
      }

      return { data: null, error: 'No data returned' };
    },
    [userId, canAddTrigger, tier, triggerLimit, triggers]
  );

  const updateTrigger = useCallback(
    async (
      triggerId: string,
      updates: Partial<Omit<Trigger, 'id' | 'userId' | 'spotId' | 'createdAt' | 'updatedAt'>>
    ): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const dbUpdates = toDbTriggerUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('triggers')
        .update(dbUpdates)
        .eq('id', triggerId)
        .eq('user_id', userId) // Ensure user owns the trigger
        .select()
        .single();

      if (updateError) {
        showError('Failed to update trigger');
        return { error: updateError.message };
      }

      if (data) {
        const mappedTrigger = mapTrigger(data);
        setTriggers((prev) =>
          prev.map((t) => (t.id === triggerId ? mappedTrigger : t))
        );
      }

      return { error: null };
    },
    [userId]
  );

  const deleteTrigger = useCallback(
    async (triggerId: string): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const { error: deleteError } = await supabase
        .from('triggers')
        .delete()
        .eq('id', triggerId)
        .eq('user_id', userId); // Ensure user owns the trigger

      if (deleteError) {
        showError('Failed to delete trigger');
        return { error: deleteError.message };
      }

      setTriggers((prev) => prev.filter((t) => t.id !== triggerId));
      return { error: null };
    },
    [userId]
  );

  return {
    triggers,
    isLoading,
    error,
    refresh: fetchTriggers,
    canAddTrigger,
    triggerCount,
    triggerLimit,
    addTrigger,
    updateTrigger,
    deleteTrigger,
  };
}

export default useTriggers;
