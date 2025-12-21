import { Sun, Moon, Bolt, InfoCircle, ClockCircle, History3, Lock, Calendar, Bell, Letter, Phone } from '@solar-icons/react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { usePushNotification } from '../contexts/PushNotificationContext';
import { useAlertSettings } from '../hooks';
import {
  Card,
  CardContent,
  Input,
  Switch,
  SegmentedControl,
  Button,
  Badge,
} from '../components/ui';
import { DnaLogo } from '../components/ui/DnaLogo';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AlertsPage() {
  const { user, profile } = useAuth();
  const { settings, isLoading, update } = useAlertSettings(user?.id);
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permissionState: pushPermission,
    isLoading: pushLoading,
    isIosWithoutPwa,
    subscribe: subscribeToPush,
  } = usePushNotification();

  // 'pro' = Free Beta tier in DB, 'premium' = paid tier
  const canUsePremiumAlerts = ['premium', 'pro'].includes(
    profile?.subscriptionTier?.toLowerCase() || ''
  ) || profile?.isAdmin;

  const handleToggle = async (
    field: 'forecastAlertsEnabled' | 'liveAlertsEnabled' | 'twoDayForecastEnabled' | 'fiveDayForecastEnabled' | 'pushEnabled' | 'emailEnabled',
    value: boolean
  ) => {
    if (!canUsePremiumAlerts && (field === 'twoDayForecastEnabled' || field === 'forecastAlertsEnabled' || field === 'fiveDayForecastEnabled')) {
      return;
    }
    await update({ [field]: value });
  };

  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      await update({ pushEnabled: true });
    }
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

        {/* Alert Types Section */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-2 h-2 bg-destructive animate-pulse rounded-full" />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Alert Types</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">



            {/* Night Before Alerts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="relative group h-full"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 transition-colors group-hover:bg-primary z-10 rounded-l" />
              <Card className={`tech-card h-full ${!canUsePremiumAlerts ? 'opacity-75 grayscale-[0.5]' : ''}`}>
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
            </motion.div>

            {/* Live Alerts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group h-full"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 transition-colors group-hover:bg-primary z-10 rounded-l" />
              <Card className="tech-card h-full">
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
            </motion.div>

            {/* Five Days Out Alerts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="relative group h-full"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 transition-colors group-hover:bg-primary z-10 rounded-l" />
              <Card className={`tech-card h-full ${!canUsePremiumAlerts ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={getIconStyle(!!settings?.fiveDayForecastEnabled)}>
                      <Calendar weight="BoldDuotone" size={32} />
                    </div>
                    {canUsePremiumAlerts ? (
                      <Switch
                        checked={settings?.fiveDayForecastEnabled ?? false}
                        onChange={(checked) => handleToggle('fiveDayForecastEnabled', checked)}
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
                      <h3 className="font-bold">5 Days Out</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 h-12">
                      Early planning alert. Get notified 5 days before good conditions arrive.
                    </p>

                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Two Days Before Alerts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group h-full"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 transition-colors group-hover:bg-primary z-10 rounded-l" />
              <Card className={`tech-card h-full ${!canUsePremiumAlerts ? 'opacity-75 grayscale-[0.5]' : ''}`}>
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
            </motion.div>
          </div>

        </div>

        {/* Notification Channels Section */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-2 h-2 bg-blue-500 animate-pulse rounded-full" />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Notification Channels
            </h2>
          </div>

          <Card className="tech-card">
            <CardContent className="pt-6 space-y-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={getIconStyle(!!(pushSubscribed && settings?.pushEnabled))}>
                    <Bell weight="BoldDuotone" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">Push Notifications</h3>
                    <p className="text-xs text-muted-foreground">
                      {isIosWithoutPwa
                        ? 'Add to Home Screen for push on iOS'
                        : !pushSupported
                          ? 'Not supported in this browser'
                          : pushPermission === 'denied'
                            ? 'Blocked in browser settings'
                            : pushSubscribed
                              ? 'Enabled on this device'
                              : 'Get instant alerts on this device'}
                    </p>
                  </div>
                </div>
                {pushSupported && pushPermission !== 'denied' && !isIosWithoutPwa && (
                  pushSubscribed ? (
                    <Switch
                      checked={settings?.pushEnabled ?? false}
                      onChange={(checked) => handleToggle('pushEnabled', checked)}
                      disabled={pushLoading}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEnablePush}
                      disabled={pushLoading}
                    >
                      Enable
                    </Button>
                  )
                )}
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={getIconStyle(settings?.emailEnabled ?? true)}>
                    <Letter weight="BoldDuotone" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">Email</h3>
                    <p className="text-xs text-muted-foreground">
                      Receive alerts to your email address
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.emailEnabled ?? true}
                  onChange={(checked) => handleToggle('emailEnabled', checked)}
                />
              </div>

              {/* SMS - Coming Soon */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg opacity-50">
                <div className="flex items-center gap-3">
                  <div className={getIconStyle(false)}>
                    <Phone weight="BoldDuotone" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">SMS</h3>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
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
                <SegmentedControl
                  options={[
                    { value: 'solar', label: 'Solar Cycle' },
                    { value: 'clock', label: 'Fixed Hours' },
                    { value: 'always', label: '24/7 Active' },
                  ]}
                  value={settings?.windowMode || 'solar'}
                  onChange={(val) => handleModeChange(val as 'solar' | 'clock' | 'always')}
                />

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
