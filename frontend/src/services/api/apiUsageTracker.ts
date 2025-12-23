import { supabase } from '../../lib/supabase';

export type ApiService = 'openmeteo_marine' | 'openmeteo_weather' | 'openmeteo_combined';
export type ApiSource = 'dashboard' | 'trigger_eval' | 'script' | 'spot_card' | 'unknown';

interface ApiUsageStats {
  service: string;
  calls_last_minute: number;
  calls_last_hour: number;
  calls_last_day: number;
  calls_last_30_days: number;
  last_call_at: string | null;
}

// OpenMeteo Free Tier Rate Limits
export const OPENMETEO_LIMITS = {
  perMinute: 600,
  perHour: 5000,
  perDay: 10000,
  perMonth: 300000,
};

/**
 * Log an API call to the usage tracking table
 */
export async function logApiUsage(
  service: ApiService,
  callCount: number = 1,
  source: ApiSource = 'unknown',
  endpoint?: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_api_usage', {
      p_service: service,
      p_call_count: callCount,
      p_source: source,
      p_endpoint: endpoint,
    });

    if (error) {
      // Don't throw - logging failures shouldn't break the app
      console.warn('[ApiUsageTracker] Failed to log usage:', error.message);
    }
  } catch (err) {
    console.warn('[ApiUsageTracker] Error logging usage:', err);
  }
}

/**
 * Get aggregated API usage statistics
 */
export async function getApiUsageStats(): Promise<ApiUsageStats[]> {
  const { data, error } = await supabase
    .from('api_usage_stats')
    .select('*');

  if (error) {
    console.error('[ApiUsageTracker] Failed to get stats:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get OpenMeteo-specific usage (combines marine + weather endpoints)
 */
export async function getOpenMeteoUsage(): Promise<{
  callsLastMinute: number;
  callsLastHour: number;
  callsLastDay: number;
  callsLast30Days: number;
  lastCallAt: Date | null;
}> {
  const stats = await getApiUsageStats();

  // Sum up all OpenMeteo-related services
  const openMeteoStats = stats.filter(s =>
    s.service.startsWith('openmeteo')
  );

  const callsLastMinute = openMeteoStats.reduce((sum, s) => sum + (s.calls_last_minute ?? 0), 0);
  const callsLastHour = openMeteoStats.reduce((sum, s) => sum + (s.calls_last_hour ?? 0), 0);
  const callsLastDay = openMeteoStats.reduce((sum, s) => sum + (s.calls_last_day ?? 0), 0);
  const callsLast30Days = openMeteoStats.reduce((sum, s) => sum + (s.calls_last_30_days ?? 0), 0);

  // Get most recent call
  const lastCalls = openMeteoStats
    .map(s => s.last_call_at)
    .filter(Boolean)
    .sort()
    .reverse();

  const lastCallAt = lastCalls[0] ? new Date(lastCalls[0]) : null;

  return {
    callsLastMinute,
    callsLastHour,
    callsLastDay,
    callsLast30Days,
    lastCallAt,
  };
}

/**
 * Check if we're approaching rate limits
 */
export function checkRateLimitStatus(usage: {
  callsLastMinute: number;
  callsLastHour: number;
  callsLastDay: number;
  callsLast30Days: number;
}): {
  minutePercent: number;
  hourPercent: number;
  dayPercent: number;
  monthPercent: number;
  warningLevel: 'ok' | 'warning' | 'critical';
  limitingFactor: string | null;
} {
  const minutePercent = (usage.callsLastMinute / OPENMETEO_LIMITS.perMinute) * 100;
  const hourPercent = (usage.callsLastHour / OPENMETEO_LIMITS.perHour) * 100;
  const dayPercent = (usage.callsLastDay / OPENMETEO_LIMITS.perDay) * 100;
  const monthPercent = (usage.callsLast30Days / OPENMETEO_LIMITS.perMonth) * 100;

  // Determine warning level
  let warningLevel: 'ok' | 'warning' | 'critical' = 'ok';
  let limitingFactor: string | null = null;

  const checks = [
    { name: 'per-minute', percent: minutePercent },
    { name: 'hourly', percent: hourPercent },
    { name: 'daily', percent: dayPercent },
    { name: 'monthly', percent: monthPercent },
  ];

  for (const check of checks) {
    if (check.percent >= 90) {
      warningLevel = 'critical';
      limitingFactor = check.name;
      break;
    } else if (check.percent >= 70 && warningLevel === 'ok') {
      warningLevel = 'warning';
      limitingFactor = check.name;
    }
  }

  return {
    minutePercent,
    hourPercent,
    dayPercent,
    monthPercent,
    warningLevel,
    limitingFactor,
  };
}
