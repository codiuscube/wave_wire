import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getOpenMeteoUsage,
  checkRateLimitStatus,
  OPENMETEO_LIMITS,
} from '../../services/api/apiUsageTracker';

interface ApiHealthCheck {
  name: string;
  endpoint: string;
  status: 'idle' | 'checking' | 'healthy' | 'degraded' | 'down';
  latency?: number;
  lastChecked?: Date;
  error?: string;
  details?: string;
}

interface SystemStats {
  userCount: number;
  triggerCount: number;
  uniqueSpotsWithTriggers: number;
  alertsSent30Days: number;
  totalSpots: number;
}

interface ActualApiUsage {
  callsLastMinute: number;
  callsLastHour: number;
  callsLastDay: number;
  callsLast30Days: number;
  lastCallAt: Date | null;
  minutePercent: number;
  hourPercent: number;
  dayPercent: number;
  monthPercent: number;
  warningLevel: 'ok' | 'warning' | 'critical';
  limitingFactor: string | null;
}

// Test coordinates - Hanalei Bay ocean coordinates (known to return valid wave data)
const TEST_COORDS = { lat: 22.2995, lon: -159.5075, name: 'Hanalei Bay' };

export function SystemHealth() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [actualUsage, setActualUsage] = useState<ActualApiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiHealthChecks, setApiHealthChecks] = useState<ApiHealthCheck[]>([
    {
      name: 'Open-Meteo Marine (GFS Wave)',
      endpoint: 'marine-api.open-meteo.com',
      status: 'idle',
    },
    {
      name: 'Open-Meteo Marine (ECMWF)',
      endpoint: 'marine-api.open-meteo.com',
      status: 'idle',
    },
    {
      name: 'NOAA Tides & Currents',
      endpoint: 'api.tidesandcurrents.noaa.gov',
      status: 'idle',
    },
  ]);

  const runApiHealthChecks = useCallback(async () => {
    // Update all to checking state
    setApiHealthChecks(prev => prev.map(check => ({ ...check, status: 'checking' as const })));

    const results: ApiHealthCheck[] = [];

    // Test Open-Meteo Marine API with GFS Wave model
    try {
      const gfsStart = Date.now();
      const gfsUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${TEST_COORDS.lat}&longitude=${TEST_COORDS.lon}&hourly=wave_height,wave_period,wave_direction&models=ncep_gfswave025&forecast_days=1`;
      const gfsResponse = await fetch(gfsUrl);
      const gfsLatency = Date.now() - gfsStart;

      if (!gfsResponse.ok) {
        results.push({
          name: 'Open-Meteo Marine (GFS Wave)',
          endpoint: 'marine-api.open-meteo.com',
          status: 'down',
          latency: gfsLatency,
          lastChecked: new Date(),
          error: `HTTP ${gfsResponse.status}`,
        });
      } else {
        const gfsData = await gfsResponse.json();
        const waveHeight = gfsData?.hourly?.wave_height?.[0];
        const hasValidData = typeof waveHeight === 'number' && waveHeight > 0;

        results.push({
          name: 'Open-Meteo Marine (GFS Wave)',
          endpoint: 'marine-api.open-meteo.com',
          status: hasValidData ? 'healthy' : 'degraded',
          latency: gfsLatency,
          lastChecked: new Date(),
          details: hasValidData
            ? `Wave: ${waveHeight.toFixed(1)}m at ${TEST_COORDS.name}`
            : 'No wave data returned',
        });
      }
    } catch (err) {
      results.push({
        name: 'Open-Meteo Marine (GFS Wave)',
        endpoint: 'marine-api.open-meteo.com',
        status: 'down',
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }

    // Test Open-Meteo Marine API with ECMWF model
    try {
      const ecmwfStart = Date.now();
      const ecmwfUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${TEST_COORDS.lat}&longitude=${TEST_COORDS.lon}&hourly=wave_height,wave_period,wave_direction&models=ecmwf_wam&forecast_days=1`;
      const ecmwfResponse = await fetch(ecmwfUrl);
      const ecmwfLatency = Date.now() - ecmwfStart;

      if (!ecmwfResponse.ok) {
        results.push({
          name: 'Open-Meteo Marine (ECMWF)',
          endpoint: 'marine-api.open-meteo.com',
          status: 'down',
          latency: ecmwfLatency,
          lastChecked: new Date(),
          error: `HTTP ${ecmwfResponse.status}`,
        });
      } else {
        const ecmwfData = await ecmwfResponse.json();
        const waveHeight = ecmwfData?.hourly?.wave_height?.[0];
        const hasValidData = typeof waveHeight === 'number' && waveHeight > 0;

        results.push({
          name: 'Open-Meteo Marine (ECMWF)',
          endpoint: 'marine-api.open-meteo.com',
          status: hasValidData ? 'healthy' : 'degraded',
          latency: ecmwfLatency,
          lastChecked: new Date(),
          details: hasValidData
            ? `Wave: ${waveHeight.toFixed(1)}m at ${TEST_COORDS.name}`
            : 'No wave data returned',
        });
      }
    } catch (err) {
      results.push({
        name: 'Open-Meteo Marine (ECMWF)',
        endpoint: 'marine-api.open-meteo.com',
        status: 'down',
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }

    // Test NOAA Tides API
    try {
      const noaaStart = Date.now();
      // Use a known NOAA station (Honolulu)
      const noaaUrl = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=1612340&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&format=json';
      const noaaResponse = await fetch(noaaUrl);
      const noaaLatency = Date.now() - noaaStart;

      if (!noaaResponse.ok) {
        results.push({
          name: 'NOAA Tides & Currents',
          endpoint: 'api.tidesandcurrents.noaa.gov',
          status: 'down',
          latency: noaaLatency,
          lastChecked: new Date(),
          error: `HTTP ${noaaResponse.status}`,
        });
      } else {
        const noaaData = await noaaResponse.json();
        const hasPredictions = noaaData?.predictions?.length > 0;

        results.push({
          name: 'NOAA Tides & Currents',
          endpoint: 'api.tidesandcurrents.noaa.gov',
          status: hasPredictions ? 'healthy' : 'degraded',
          latency: noaaLatency,
          lastChecked: new Date(),
          details: hasPredictions
            ? `${noaaData.predictions.length} tide predictions`
            : 'No predictions returned',
        });
      }
    } catch (err) {
      results.push({
        name: 'NOAA Tides & Currents',
        endpoint: 'api.tidesandcurrents.noaa.gov',
        status: 'down',
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }

    setApiHealthChecks(results);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        // Fetch counts and API usage in parallel
        const [usersResult, triggersResult, spotsResult, alertsResult, totalSpotsResult, openMeteoUsageData] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('triggers').select('id', { count: 'exact', head: true }).eq('enabled', true),
          supabase.from('triggers').select('spot_id').eq('enabled', true),
          supabase.from('sent_alerts').select('id', { count: 'exact', head: true })
            .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('surf_spots').select('id', { count: 'exact', head: true }),
          getOpenMeteoUsage(),
        ]);

        // Count unique spots
        const uniqueSpots = new Set(spotsResult.data?.map(t => t.spot_id)).size;

        setStats({
          userCount: usersResult.count ?? 0,
          triggerCount: triggersResult.count ?? 0,
          uniqueSpotsWithTriggers: uniqueSpots,
          alertsSent30Days: alertsResult.count ?? 0,
          totalSpots: totalSpotsResult.count ?? 0,
        });

        // Process actual API usage
        const rateLimitStatus = checkRateLimitStatus(openMeteoUsageData);
        setActualUsage({
          ...openMeteoUsageData,
          ...rateLimitStatus,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Refresh every 30 seconds to keep usage data current
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate estimated GitHub Actions usage
  const estimatedUsage = stats ? calculateGitHubActionsUsage(stats) : null;
  // Calculate estimated OpenMeteo API usage (for comparison)
  const estimatedOpenMeteo = stats ? calculateOpenMeteoUsage(stats) : null;

  if (loading) {
    return (
      <div className="p-6 border border-border/30 bg-card/60">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/50 rounded w-1/3" />
          <div className="h-4 bg-muted/50 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-destructive/30 bg-destructive/10">
        <p className="font-mono text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!stats || !estimatedUsage) return null;

  const warningLevel = getWarningLevel(estimatedUsage.percentUsed);

  // Format relative time for last API call
  const formatLastCall = (date: Date | null): string => {
    if (!date) return 'No data yet';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="p-6 border border-border/30 bg-card/60">
      <h3 className="font-mono text-base tracking-widest text-muted-foreground uppercase mb-6">
        System Health
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="Users" value={stats.userCount} />
        <StatBox label="Triggers" value={stats.triggerCount} />
        <StatBox label="Spots" value={stats.uniqueSpotsWithTriggers} />
        <StatBox label="Alerts (30d)" value={stats.alertsSent30Days} />
      </div>

      {/* API Health Checks Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-mono text-sm tracking-wider text-muted-foreground uppercase">
            External API Health
          </h4>
          <button
            onClick={runApiHealthChecks}
            disabled={apiHealthChecks.some(c => c.status === 'checking')}
            className="px-3 py-1 text-xs font-mono uppercase tracking-wider bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {apiHealthChecks.some(c => c.status === 'checking') ? 'Checking...' : 'Run Health Check'}
          </button>
        </div>

        <div className="space-y-3">
          {apiHealthChecks.map((check) => (
            <ApiHealthCheckRow key={check.name} check={check} />
          ))}
        </div>

        {apiHealthChecks.every(c => c.status === 'idle') && (
          <p className="mt-3 text-xs font-mono text-muted-foreground">
            Click "Run Health Check" to test external API connectivity and response times.
          </p>
        )}
      </div>

      {/* OpenMeteo API Usage Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-mono text-sm tracking-wider text-muted-foreground uppercase">
            Open-Meteo API Usage (Free Tier)
          </h4>
          <div className="flex items-center gap-4">
            {actualUsage?.lastCallAt && (
              <span className="text-xs font-mono text-muted-foreground">
                Last call: {formatLastCall(actualUsage.lastCallAt)}
              </span>
            )}
            <a
              href="https://open-meteo.com/en/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-primary/70 hover:text-primary underline"
            >
              Terms of Use
            </a>
          </div>
        </div>

        {/* Actual Usage (if available) or Estimated */}
        {actualUsage && (actualUsage.callsLastDay > 0 || actualUsage.callsLast30Days > 0) ? (
          <>
            {/* Actual Usage Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Live Tracking
              </span>
            </div>

            {/* OpenMeteo Rate Limit Bars - Actual Data */}
            <div className="space-y-4">
              <RateLimitBar
                label="Per Minute"
                current={actualUsage.callsLastMinute}
                limit={OPENMETEO_LIMITS.perMinute}
                warning={actualUsage.minutePercent >= 70}
                critical={actualUsage.minutePercent >= 90}
              />
              <RateLimitBar
                label="Per Hour"
                current={actualUsage.callsLastHour}
                limit={OPENMETEO_LIMITS.perHour}
                warning={actualUsage.hourPercent >= 70}
                critical={actualUsage.hourPercent >= 90}
              />
              <RateLimitBar
                label="Per Day (24h)"
                current={actualUsage.callsLastDay}
                limit={OPENMETEO_LIMITS.perDay}
                warning={actualUsage.dayPercent >= 70}
                critical={actualUsage.dayPercent >= 90}
              />
              <RateLimitBar
                label="Per Month (30d)"
                current={actualUsage.callsLast30Days}
                limit={OPENMETEO_LIMITS.perMonth}
                warning={actualUsage.monthPercent >= 70}
                critical={actualUsage.monthPercent >= 90}
              />
            </div>

            {/* Warning Message */}
            {actualUsage.warningLevel !== 'ok' && (
              <div className={`mt-4 p-3 rounded ${getWarningBgColor(actualUsage.warningLevel)}`}>
                <p className={`font-mono text-sm ${getWarningTextColor(actualUsage.warningLevel)}`}>
                  {actualUsage.warningLevel === 'critical'
                    ? `Critical: Approaching Open-Meteo ${actualUsage.limitingFactor} limit. Consider upgrading to a paid API plan.`
                    : `Warning: ${actualUsage.limitingFactor} usage is elevated. Monitor closely.`}
                </p>
              </div>
            )}

            {/* Comparison with Estimates */}
            {estimatedOpenMeteo && (
              <div className="mt-4 p-3 bg-muted/20 rounded">
                <p className="font-mono text-xs text-muted-foreground">
                  <span className="font-semibold">Estimated daily:</span> ~{estimatedOpenMeteo.estimatedCallsPerDay.toLocaleString()} calls
                  {' '}
                  <span className="text-muted-foreground/60">
                    ({estimatedOpenMeteo.triggerRuns} trigger runs × {estimatedOpenMeteo.callsPerRun} + ~{estimatedOpenMeteo.dashboardViewsPerDay} dashboard views)
                  </span>
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* No tracking data yet - show estimates */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Estimated (no tracking data yet)
              </span>
            </div>

            {estimatedOpenMeteo && (
              <>
                <div className="space-y-4">
                  <RateLimitBar
                    label="Per Minute (peak)"
                    current={estimatedOpenMeteo.peakCallsPerMinute}
                    limit={OPENMETEO_LIMITS.perMinute}
                    warning={estimatedOpenMeteo.minutePercent >= 70}
                    critical={estimatedOpenMeteo.minutePercent >= 90}
                  />
                  <RateLimitBar
                    label="Per Hour (avg)"
                    current={estimatedOpenMeteo.estimatedCallsPerHour}
                    limit={OPENMETEO_LIMITS.perHour}
                    warning={estimatedOpenMeteo.hourPercent >= 70}
                    critical={estimatedOpenMeteo.hourPercent >= 90}
                  />
                  <RateLimitBar
                    label="Per Day (est)"
                    current={estimatedOpenMeteo.estimatedCallsPerDay}
                    limit={OPENMETEO_LIMITS.perDay}
                    warning={estimatedOpenMeteo.dayPercent >= 70}
                    critical={estimatedOpenMeteo.dayPercent >= 90}
                  />
                  <RateLimitBar
                    label="Per Month (est)"
                    current={estimatedOpenMeteo.estimatedCallsPerMonth}
                    limit={OPENMETEO_LIMITS.perMonth}
                    warning={estimatedOpenMeteo.monthPercent >= 70}
                    critical={estimatedOpenMeteo.monthPercent >= 90}
                  />
                </div>

                <div className="mt-4 p-3 bg-muted/20 rounded">
                  <p className="font-mono text-xs text-muted-foreground">
                    <span className="font-semibold">Estimation basis:</span> {estimatedOpenMeteo.triggerRuns} trigger runs/day × {estimatedOpenMeteo.callsPerRun} API calls/run + ~{estimatedOpenMeteo.dashboardViewsPerDay} dashboard views/day
                  </p>
                  <p className="font-mono text-xs text-muted-foreground/60 mt-1">
                    Run the migration to enable live API tracking.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* GitHub Actions Usage */}
      <div className="space-y-3">
        <h4 className="font-mono text-sm tracking-wider text-muted-foreground uppercase mb-4">
          GitHub Actions Usage
        </h4>
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-muted-foreground">Est. Monthly Usage</span>
          <span className="font-mono">
            {estimatedUsage.estimatedMinutes.toLocaleString()} / 2,000 min
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor(warningLevel)}`}
            style={{ width: `${Math.min(estimatedUsage.percentUsed, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>{estimatedUsage.percentUsed.toFixed(1)}% of free tier</span>
          <span>~{estimatedUsage.estimatedMinutesPerRun.toFixed(1)} min/run</span>
        </div>

        {/* Warning Message */}
        {warningLevel !== 'ok' && (
          <div className={`mt-4 p-3 rounded ${getWarningBgColor(warningLevel)}`}>
            <p className={`font-mono text-sm ${getWarningTextColor(warningLevel)}`}>
              {getWarningMessage(warningLevel, stats.userCount)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RateLimitBar({
  label,
  current,
  limit,
  warning,
  critical
}: {
  label: string;
  current: number;
  limit: number;
  warning: boolean;
  critical: boolean;
}) {
  const percent = Math.min((current / limit) * 100, 100);
  const color = critical ? 'bg-destructive' : warning ? 'bg-yellow-500' : 'bg-primary';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className={critical ? 'text-destructive' : warning ? 'text-yellow-500' : ''}>
          {current.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-mono text-2xl font-bold text-primary">{value.toLocaleString()}</div>
      <div className="font-mono text-xs text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

interface UsageEstimate {
  estimatedMinutesPerRun: number;
  estimatedMinutes: number;
  percentUsed: number;
}

function calculateGitHubActionsUsage(stats: SystemStats): UsageEstimate {
  // Calculation based on:
  // - Each spot fetch: ~3 seconds (buoy + forecast + tide in parallel)
  // - Each trigger eval: ~0.1 seconds
  // - Each message generation: ~1 second (AI call)
  // - Assume ~30% of triggers match per run on average (conservative)
  const secondsPerSpot = 3;
  const secondsPerTrigger = 0.1;
  const secondsPerMessage = 1;
  const matchRate = 0.1; // 10% of triggers match

  const estimatedMessagesPerRun = stats.triggerCount * matchRate;
  const totalSecondsPerRun =
    (stats.uniqueSpotsWithTriggers * secondsPerSpot) +
    (stats.triggerCount * secondsPerTrigger) +
    (estimatedMessagesPerRun * secondsPerMessage);

  const estimatedMinutesPerRun = totalSecondsPerRun / 60;

  // 10 runs per day (every 2 hours, skipping night)
  // 30 days per month
  const runsPerMonth = 10 * 30;
  const estimatedMinutes = estimatedMinutesPerRun * runsPerMonth;

  const percentUsed = (estimatedMinutes / 2000) * 100;

  return {
    estimatedMinutesPerRun,
    estimatedMinutes: Math.round(estimatedMinutes),
    percentUsed,
  };
}

type WarningLevel = 'ok' | 'warning' | 'critical';

function getWarningLevel(percentUsed: number): WarningLevel {
  if (percentUsed >= 90) return 'critical';
  if (percentUsed >= 70) return 'warning';
  return 'ok';
}

function getProgressColor(level: WarningLevel): string {
  switch (level) {
    case 'critical': return 'bg-destructive';
    case 'warning': return 'bg-yellow-500';
    default: return 'bg-primary';
  }
}

function getWarningBgColor(level: WarningLevel): string {
  switch (level) {
    case 'critical': return 'bg-destructive/20 border border-destructive/30';
    case 'warning': return 'bg-yellow-500/20 border border-yellow-500/30';
    default: return '';
  }
}

function getWarningTextColor(level: WarningLevel): string {
  switch (level) {
    case 'critical': return 'text-destructive';
    case 'warning': return 'text-yellow-600 dark:text-yellow-400';
    default: return '';
  }
}

function getWarningMessage(level: WarningLevel, userCount: number): string {
  switch (level) {
    case 'critical':
      return `Critical: At ${userCount} users, you're approaching the free tier limit. Consider upgrading to Supabase Pro or GitHub Actions paid tier.`;
    case 'warning':
      return `Warning: Approaching free tier limit. At ~150-200 users, you'll need to upgrade infrastructure.`;
    default:
      return '';
  }
}

// OpenMeteo Usage Calculation
interface OpenMeteoUsage {
  // Raw estimates
  peakCallsPerMinute: number;
  estimatedCallsPerHour: number;
  estimatedCallsPerDay: number;
  estimatedCallsPerMonth: number;
  // Percentages
  minutePercent: number;
  hourPercent: number;
  dayPercent: number;
  monthPercent: number;
  // For breakdown display
  triggerRuns: number;
  callsPerRun: number;
  dashboardViewsPerDay: number;
}

function calculateOpenMeteoUsage(stats: SystemStats): OpenMeteoUsage {
  // Each forecast fetch = 2 API calls (marine + weather)
  const CALLS_PER_FORECAST = 2;

  // Background trigger evaluation runs (every 2 hours during daytime = ~10 runs/day)
  const TRIGGER_RUNS_PER_DAY = 10;

  // Each trigger run fetches forecasts for all unique spots with triggers
  const callsPerTriggerRun = stats.uniqueSpotsWithTriggers * CALLS_PER_FORECAST;

  // Dashboard viewing estimates:
  // - Assume 20% of users view dashboard daily
  // - Each dashboard view loads ~3 spots on average
  // - Users may reload 2-3 times per session
  const activeUsersPerDay = Math.ceil(stats.userCount * 0.2);
  const avgSpotsPerUser = Math.min(3, stats.totalSpots / Math.max(stats.userCount, 1));
  const reloadsPerSession = 2;
  const dashboardCallsPerDay = activeUsersPerDay * avgSpotsPerUser * reloadsPerSession * CALLS_PER_FORECAST;

  // Total daily calls
  const triggerCallsPerDay = TRIGGER_RUNS_PER_DAY * callsPerTriggerRun;
  const estimatedCallsPerDay = triggerCallsPerDay + dashboardCallsPerDay;

  // Hourly estimate (spread across 12 active hours)
  const estimatedCallsPerHour = Math.ceil(estimatedCallsPerDay / 12);

  // Monthly estimate
  const estimatedCallsPerMonth = estimatedCallsPerDay * 30;

  // Peak minute estimate (worst case: all trigger fetches at once + some dashboard)
  // Trigger run happens in parallel, so all spot fetches happen in the same minute
  const peakCallsPerMinute = callsPerTriggerRun + Math.ceil(dashboardCallsPerDay / (12 * 60));

  return {
    peakCallsPerMinute,
    estimatedCallsPerHour,
    estimatedCallsPerDay: Math.round(estimatedCallsPerDay),
    estimatedCallsPerMonth: Math.round(estimatedCallsPerMonth),
    minutePercent: (peakCallsPerMinute / OPENMETEO_LIMITS.perMinute) * 100,
    hourPercent: (estimatedCallsPerHour / OPENMETEO_LIMITS.perHour) * 100,
    dayPercent: (estimatedCallsPerDay / OPENMETEO_LIMITS.perDay) * 100,
    monthPercent: (estimatedCallsPerMonth / OPENMETEO_LIMITS.perMonth) * 100,
    triggerRuns: TRIGGER_RUNS_PER_DAY,
    callsPerRun: callsPerTriggerRun,
    dashboardViewsPerDay: Math.round(dashboardCallsPerDay / CALLS_PER_FORECAST),
  };
}

function ApiHealthCheckRow({ check }: { check: ApiHealthCheck }) {
  const getStatusColor = () => {
    switch (check.status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-destructive';
      case 'checking': return 'bg-primary animate-pulse';
      default: return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (check.status) {
      case 'healthy': return 'Healthy';
      case 'degraded': return 'Degraded';
      case 'down': return 'Down';
      case 'checking': return 'Checking...';
      default: return 'Not checked';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <div>
          <div className="font-mono text-sm">{check.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{check.endpoint}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono text-xs uppercase tracking-wider ${
          check.status === 'healthy' ? 'text-green-500' :
          check.status === 'degraded' ? 'text-yellow-500' :
          check.status === 'down' ? 'text-destructive' :
          'text-muted-foreground'
        }`}>
          {getStatusText()}
        </div>
        {check.latency && (
          <div className="font-mono text-xs text-muted-foreground">
            {check.latency}ms
          </div>
        )}
        {check.details && (
          <div className="font-mono text-xs text-muted-foreground mt-1">
            {check.details}
          </div>
        )}
        {check.error && (
          <div className="font-mono text-xs text-destructive mt-1">
            {check.error}
          </div>
        )}
      </div>
    </div>
  );
}

