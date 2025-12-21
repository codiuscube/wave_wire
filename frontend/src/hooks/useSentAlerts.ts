import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapSentAlert, type SentAlert } from '../lib/mappers';
import { showError } from '../lib/toast';

interface UseSentAlertsOptions {
  /** Limit number of alerts returned */
  limit?: number;
  /** Filter by spot ID */
  spotId?: string;
  /** Filter by delivery status */
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
}

interface UseSentAlertsReturn {
  /** The sent alerts */
  alerts: SentAlert[];
  /** Whether the alerts are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Total count of alerts for this user */
  totalCount: number;
}

/**
 * Hook to fetch a user's sent alert history.
 *
 * @param userId - The user's ID
 * @param options - Filter and pagination options
 * @returns Sent alerts data
 *
 * @example
 * ```tsx
 * const { alerts, isLoading } = useSentAlerts(user.id, { limit: 10 });
 *
 * return (
 *   <ul>
 *     {alerts.map(alert => (
 *       <li key={alert.id}>{alert.messageContent}</li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export function useSentAlerts(
  userId: string | undefined,
  options: UseSentAlertsOptions = {}
): UseSentAlertsReturn {
  const { limit = 50, spotId, deliveryStatus } = options;

  const [alerts, setAlerts] = useState<SentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!userId) {
      setAlerts([]);
      setError(null);
      setIsLoading(false);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sent_alerts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (spotId) {
        query = query.eq('spot_id', spotId);
      }

      if (deliveryStatus) {
        query = query.eq('delivery_status', deliveryStatus);
      }

      // Order by most recent first
      query = query.order('sent_at', { ascending: false, nullsFirst: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        showError('Failed to load alert history');
        setAlerts([]);
        setTotalCount(0);
      } else if (data) {
        setAlerts(data.map(mapSentAlert));
        setTotalCount(count ?? data.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, spotId, deliveryStatus, limit]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    refresh: fetchAlerts,
    totalCount,
  };
}

export default useSentAlerts;
