import { Sun, Moon, Bolt, InfoCircle, ClockCircle, Radar, History3, Lock } from '@solar-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useAlertSettings } from '../hooks';
import {
  Card,
  CardContent,
  Input,
  Switch,
} from '../components/ui';
import { DnaLogo } from '../components/ui/DnaLogo';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AlertsPage() {
  const { user, profile } = useAuth();
  const { settings, isLoading, update } = useAlertSettings(user?.id);

  // 'pro' = Free Beta tier in DB, 'premium' = paid tier
  const canUsePremiumAlerts = ['premium', 'pro'].includes(
    profile?.subscriptionTier?.toLowerCase() || ''
  ) || profile?.isAdmin;

  const handleToggle = async (
    field: 'forecastAlertsEnabled' | 'liveAlertsEnabled' | 'twoDayForecastEnabled',
    value: boolean
  ) => {
    if (!canUsePremiumAlerts && (field === 'twoDayForecastEnabled' || field === 'forecastAlertsEnabled')) {
      return;
    }
    await update({ [field]: value });
  };

  const handleModeChange = async (mode: 'solar' | 'clock' | 'always') => {
    await update({ windowMode: mode });
  };

  const handleTimeChange = async (
    field: 'windowStartTime' | 'windowEndTime',
    value: string
  ) => {
    await update({ [field]: value });
  };

  const handleDayToggle = async (day: string) => {
    if (!settings?.activeDays) return;

    const newDays = settings.activeDays.includes(day)
      ? settings.activeDays.filter(d => d !== day)
      : [...settings.activeDays, day];

    // Optional: Prevent deselecting all days? 
    // For now we allow it, effectively pausing all alerts.

    await update({ activeDays: newDays });
  };

  if (isLoading) {
    return (
      <div className="relative p-4 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <DnaLogo className="w-16 h-16" />
      </div>
    );
  }

  // Helper for glowing icon styles - Monochromatic
  const getIconStyle = (active: boolean) =>
    `h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${active
      ? 'bg-primary-foreground text-muted-foreground shadow-md'
      : 'bg-primary-foreground/20 text-muted-foreground/20'
    }`;

  return (
    <div className="relative p-4 min-h-[calc(100vh-4rem)] flex flex-col items-center">
      {/* Background Tech Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Header - Centered */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
            // ALERT_PROTOCOLS
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="ALERTS">
            ALERTS
          </h1>
          <p className="font-mono text-muted-foreground text-sm sm:text-base border-muted px-4">
            Configure active surveillance windows and notification types.
          </p>
        </div>

        {/* Surveillance Window Section */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full ${settings?.windowMode !== 'always' ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Surveillance Window</h2>
          </div>

          <Card className="tech-card overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6">

                {/* Mode Selector */}
                <div className="flex p-1 bg-secondary/50 rounded-lg">
                  {(['solar', 'clock', 'always'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleModeChange(mode)}
                      className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-all ${settings?.windowMode === mode
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }`}
                    >
                      {mode === 'solar' && 'Solar Cycle'}
                      {mode === 'clock' && 'Fixed Hours'}
                      {mode === 'always' && '24/7 Active'}
                    </button>
                  ))}
                </div>

                {/* Day Selector */}
                <div className="flex justify-between gap-1 sm:gap-2">
                  {DAYS.map((day) => {
                    const isActive = settings?.activeDays?.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`
                          flex-1 aspect-square sm:aspect-auto sm:h-10 
                          flex items-center justify-center rounded-md font-mono text-xs font-bold transition-all
                          ${isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5 bg-muted/20'
                          }
                        `}
                      >
                        {day.slice(0, 2)}
                      </button>
                    );
                  })}
                </div>

                {/* Mode Content */}
                <div className="min-h-12 flex items-center">

                  {settings?.windowMode === 'solar' && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Sun weight="BoldDuotone" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">Follow the Sun</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Alerts are active from <span className="text-primary font-mono">Sunrise</span> to <span className="text-primary font-mono">Sunset</span> based on each spot's location.
                        </p>
                      </div>
                    </div>
                  )}

                  {settings?.windowMode === 'clock' && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <ClockCircle weight="BoldDuotone" size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">Fixed Schedule</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Set specific active hours
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={settings?.windowStartTime ?? '06:00'}
                            onChange={(e) => handleTimeChange('windowStartTime', e.target.value)}
                            className="w-24 font-mono text-center bg-background"
                          />
                          <span className="text-muted-foreground font-mono">→</span>
                          <Input
                            type="time"
                            value={settings?.windowEndTime ?? '22:00'}
                            onChange={(e) => handleTimeChange('windowEndTime', e.target.value)}
                            className="w-24 font-mono text-center bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {settings?.windowMode === 'always' && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Bolt weight="BoldDuotone" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">Always On</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Active 24/7 on selected days.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Types Section */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-2 h-2 bg-destructive animate-pulse rounded-full" />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Alert Types</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Two Days Before Alerts */}
            <Card className={`tech-card group ${!canUsePremiumAlerts ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={getIconStyle(!!settings?.twoDayForecastEnabled)}>
                    <History3 weight="BoldDuotone" size={32} />
                  </div>
                  {canUsePremiumAlerts ? (
                    <Switch
                      checked={settings?.twoDayForecastEnabled ?? false}
                      onChange={(checked) => handleToggle('twoDayForecastEnabled', checked)}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-xs font-mono font-bold text-muted-foreground">
                      <Lock size={12} weight="Bold" />
                      PREMIUM
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold">2 Days Out</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 h-12">
                    Early warning check. Received at 12pm, two days before conditions arrive.
                  </p>

                </div>
              </CardContent>
            </Card>

            {/* Night Before Alerts */}
            <Card className={`tech-card group ${!canUsePremiumAlerts ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={getIconStyle(!!settings?.forecastAlertsEnabled)}>
                    <Moon weight="BoldDuotone" size={32} />
                  </div>
                  {canUsePremiumAlerts ? (
                    <Switch
                      checked={settings?.forecastAlertsEnabled ?? true}
                      onChange={(checked) => handleToggle('forecastAlertsEnabled', checked)}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-xs font-mono font-bold text-muted-foreground">
                      <Lock size={12} weight="Bold" />
                      PREMIUM
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold">Night Before</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 h-12">
                    Final confirmation. Received at 6pm the night before conditions arrive.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Live Alerts */}
            <Card className="tech-card group">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={getIconStyle(!!settings?.liveAlertsEnabled)}>
                    <Bolt weight="BoldDuotone" size={32} />
                  </div>
                  <Switch
                    checked={settings?.liveAlertsEnabled ?? true}
                    onChange={(checked) => handleToggle('liveAlertsEnabled', checked)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold">Live Data</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 h-12">
                    Real-time buoy monitoring. Instant alerts when conditions trigger.
                  </p>


                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Info Section */}
        <div className="w-full pb-20">
          <Card className="bg-muted/30 border-border/50 border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <InfoCircle weight="Bold" size={20} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium font-mono text-sm">System Logic</p>
                  <div className="text-sm text-muted-foreground mt-3 space-y-2 font-mono text-xs">
                    <div className="flex gap-3 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      <p>Conditions checked against <span className="text-foreground">Triggers</span></p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      <p>Alerts filtered by <span className="text-foreground">Window</span> & <span className="text-foreground">Active Days</span></p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      <p>One consolidated msg / check</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
