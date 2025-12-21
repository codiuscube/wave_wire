import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SystemStats {
  userCount: number;
  triggerCount: number;
  uniqueSpotsWithTriggers: number;
  alertsSent30Days: number;
}

export function SystemHealth() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        // Fetch counts in parallel
        const [usersResult, triggersResult, spotsResult, alertsResult] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('triggers').select('id', { count: 'exact', head: true }).eq('enabled', true),
          supabase.from('triggers').select('spot_id').eq('enabled', true),
          supabase.from('sent_alerts').select('id', { count: 'exact', head: true })
            .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        ]);

        // Count unique spots
        const uniqueSpots = new Set(spotsResult.data?.map(t => t.spot_id)).size;

        setStats({
          userCount: usersResult.count ?? 0,
          triggerCount: triggersResult.count ?? 0,
          uniqueSpotsWithTriggers: uniqueSpots,
          alertsSent30Days: alertsResult.count ?? 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Calculate estimated GitHub Actions usage
  const estimatedUsage = stats ? calculateGitHubActionsUsage(stats) : null;

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

      {/* GitHub Actions Usage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-muted-foreground">Est. GitHub Actions Usage</span>
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
