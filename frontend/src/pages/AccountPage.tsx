import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Letter,
  Shield,
  Card as CardIcon,
  Home,
  Logout,
  Sun,
  Moon,
  Bolt,
  ClockCircle,
  History3,
  Lock,
  Calendar,
  Bell,
} from '@solar-icons/react';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  DnaLogo,
  AddressAutocomplete,
  Switch,
  SegmentedControl,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { usePushNotification } from "../contexts/PushNotificationContext";
import { useProfile, useAlertSettings } from "../hooks";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AccountPage() {
  const { user, loading: authLoading, signOut, profile: authProfile } = useAuth();
  const { profile, isLoading, error, update } = useProfile(user?.id);
  const { settings: alertSettings, isLoading: alertLoading, update: updateAlertSettings } = useAlertSettings(user?.id);
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permissionState: pushPermission,
    isLoading: pushLoading,
    isIosWithoutPwa,
    subscribe: subscribeToPush,
  } = usePushNotification();
  const navigate = useNavigate();

  // Premium tier check
  const canUsePremiumAlerts = ['premium', 'pro'].includes(
    authProfile?.subscriptionTier?.toLowerCase() || ''
  ) || authProfile?.isAdmin;

  // Local form state (initialized from profile)
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeLat, setHomeLat] = useState<number | null>(null);
  const [homeLon, setHomeLon] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when profile loads
  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
      setHomeAddress(profile.homeAddress || "");
      setHomeLat(profile.homeLat);
      setHomeLon(profile.homeLon);
    }
  }, [profile]);

  // Derived values from profile
  const emailVerified = !!profile?.email; // Consider verified if email exists (from Supabase auth)

  // Check if there are unsaved changes
  const hasChanges =
    phone !== (profile?.phone || "") ||
    email !== (profile?.email || "") ||
    homeAddress !== (profile?.homeAddress || "") ||
    homeLat !== (profile?.homeLat ?? null) ||
    homeLon !== (profile?.homeLon ?? null);

  const handleSave = async () => {
    setIsSaving(true);

    await update({
      phone: phone || null,
      email: email || null,
      homeAddress: homeAddress || null,
      homeLat,
      homeLon,
    });

    setIsSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Alert settings handlers
  const handleAlertToggle = async (
    field: 'forecastAlertsEnabled' | 'liveAlertsEnabled' | 'twoDayForecastEnabled' | 'fiveDayForecastEnabled' | 'pushEnabled' | 'emailEnabled',
    value: boolean
  ) => {
    if (!canUsePremiumAlerts && (field === 'twoDayForecastEnabled' || field === 'forecastAlertsEnabled' || field === 'fiveDayForecastEnabled')) {
      return;
    }
    await updateAlertSettings({ [field]: value });
  };

  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      await updateAlertSettings({ pushEnabled: true });
    }
  };

  const handleModeChange = async (mode: 'solar' | 'clock' | 'always') => {
    await updateAlertSettings({ windowMode: mode });
  };

  const handleWindowTimeChange = async (
    field: 'windowStartTime' | 'windowEndTime',
    value: string
  ) => {
    await updateAlertSettings({ [field]: value });
  };

  const handleDayToggle = async (day: string) => {
    if (!alertSettings?.activeDays) return;
    const newDays = alertSettings.activeDays.includes(day)
      ? alertSettings.activeDays.filter(d => d !== day)
      : [...alertSettings.activeDays, day];
    await updateAlertSettings({ activeDays: newDays });
  };

  // Helper for glowing icon styles
  const getIconStyle = (active: boolean) =>
    `h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${active
      ? 'bg-primary-foreground text-muted-foreground shadow-md'
      : 'bg-primary-foreground/20 text-muted-foreground/20'
    }`;

  if (authLoading || isLoading || alertLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl flex items-center justify-center min-h-[400px]">
        <DnaLogo className="w-16 h-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading profile: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative p-4 min-h-[calc(100vh-4rem)] flex flex-col items-center">
      {/* Background Tech Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[20%] left-[10%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Header - Centered */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
            // ACCOUNT_SETTINGS
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="ACCOUNT">
            ACCOUNT
          </h1>
          <p className="font-mono text-muted-foreground text-sm sm:text-base border-muted px-4">
            Manage your personal data and subscription tier.
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
                    <div className={getIconStyle(!!alertSettings?.forecastAlertsEnabled)}>
                      <Moon weight="BoldDuotone" size={32} />
                    </div>
                    {canUsePremiumAlerts ? (
                      <Switch
                        checked={alertSettings?.forecastAlertsEnabled ?? true}
                        onChange={(checked) => handleAlertToggle('forecastAlertsEnabled', checked)}
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
                    <div className={getIconStyle(!!alertSettings?.liveAlertsEnabled)}>
                      <Bolt weight="BoldDuotone" size={32} />
                    </div>
                    <Switch
                      checked={alertSettings?.liveAlertsEnabled ?? true}
                      onChange={(checked) => handleAlertToggle('liveAlertsEnabled', checked)}
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
                    <div className={getIconStyle(!!alertSettings?.fiveDayForecastEnabled)}>
                      <Calendar weight="BoldDuotone" size={32} />
                    </div>
                    {canUsePremiumAlerts ? (
                      <Switch
                        checked={alertSettings?.fiveDayForecastEnabled ?? false}
                        onChange={(checked) => handleAlertToggle('fiveDayForecastEnabled', checked)}
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
                    <div className={getIconStyle(!!alertSettings?.twoDayForecastEnabled)}>
                      <History3 weight="BoldDuotone" size={32} />
                    </div>
                    {canUsePremiumAlerts ? (
                      <Switch
                        checked={alertSettings?.twoDayForecastEnabled ?? false}
                        onChange={(checked) => handleAlertToggle('twoDayForecastEnabled', checked)}
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

        {/* Surveillance Window Section */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full ${alertSettings?.windowMode !== 'always' ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
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
                  value={alertSettings?.windowMode || 'solar'}
                  onChange={(val) => handleModeChange(val as 'solar' | 'clock' | 'always')}
                />

                {/* Day Selector */}
                <div className="flex justify-between gap-1 sm:gap-2">
                  {DAYS.map((day) => {
                    const isActive = alertSettings?.activeDays?.includes(day);
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
                  {alertSettings?.windowMode === 'solar' && (
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

                  {alertSettings?.windowMode === 'clock' && (
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
                            value={alertSettings?.windowStartTime ?? '06:00'}
                            onChange={(e) => handleWindowTimeChange('windowStartTime', e.target.value)}
                            className="w-24 font-mono text-center bg-background"
                          />
                          <span className="text-muted-foreground font-mono">→</span>
                          <Input
                            type="time"
                            value={alertSettings?.windowEndTime ?? '22:00'}
                            onChange={(e) => handleWindowTimeChange('windowEndTime', e.target.value)}
                            className="w-24 font-mono text-center bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {alertSettings?.windowMode === 'always' && (
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
                  <div className={getIconStyle(!!(pushSubscribed && alertSettings?.pushEnabled))}>
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
                      checked={alertSettings?.pushEnabled ?? false}
                      onChange={(checked) => handleAlertToggle('pushEnabled', checked)}
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
                  <div className={getIconStyle(alertSettings?.emailEnabled ?? true)}>
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
                  checked={alertSettings?.emailEnabled ?? true}
                  onChange={(checked) => handleAlertToggle('emailEnabled', checked)}
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

        {/* Contact Info */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full bg-primary animate-pulse`} />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Contact</h2>
          </div>
          <Card className="mb-6 lg:mb-8 bg-card/60 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User weight="Bold" size={20} />
                Contact Information
              </CardTitle>
              <CardDescription className="text-sm">Where we send your surf alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Phone - Coming Soon */}
              <div className="opacity-50 pointer-events-none">
                <label className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone weight="Bold" size={16} />
                    Phone Number (SMS)
                  </span>
                  <Badge variant="secondary">Coming Soon</Badge>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value=""
                    placeholder="+1 (555) 123-4567"
                    className="flex-1"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  SMS alerts coming soon. Standard messaging rates may apply.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Letter weight="Bold" size={16} />
                    Email Address
                  </span>
                  {emailVerified ? (
                    <Badge variant="outline">Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="surfer@example.com"
                    className="flex-1"
                  />
                  {!emailVerified && <Button variant="outline">Verify</Button>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Email is used for fallback messages, account notifications, and
                  account recovery only.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Home Address */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full bg-blue-500 animate-pulse`} />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Location Data</h2>
          </div>
          <Card className="mb-6 lg:mb-8 bg-card/60 backdrop-blur-sm border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Home weight="Bold" size={20} />
                Home Address
              </CardTitle>
              <CardDescription className="text-sm">
                Used to show nearby surf spots. We never share this data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddressAutocomplete
                value={homeAddress}
                onChange={setHomeAddress}
                onAddressSelect={(suggestion) => {
                  setHomeLat(suggestion.lat);
                  setHomeLon(suggestion.lon);
                }}
                placeholder="Start typing your address..."
              />
              {/* <p className="text-xs text-muted-foreground mt-2">
                Optional. Leave blank if you don't want traffic info in alerts.
              </p> */}
            </CardContent>
          </Card>
        </div>

        {/* Supporter Status - Coming Soon */}
        <div className="w-full mb-8 opacity-50 pointer-events-none">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full bg-emerald-500/50`} />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Plan</h2>
            <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
          </div>
          <Card
            className={`mb-6 lg:mb-8 bg-card/60 backdrop-blur-sm border-muted`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CardIcon weight="Bold" size={20} className="text-muted-foreground" />
                Subscription
              </CardTitle>
              <CardDescription>
                Subscription tiers coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-muted-foreground">Free Tier</p>
                    <Badge variant="secondary">Current</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    All features currently available for free during beta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full bg-destructive/50`} />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Security</h2>
            <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
          </div>
          <Card className="bg-card/60 backdrop-blur-sm border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield weight="Bold" size={20} className="text-muted-foreground" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="opacity-50 pointer-events-none space-y-4">
                <Button variant="outline" className="w-full justify-start" disabled>
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  Download My Data
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  Delete Account
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start text-red-400 hover:text-red-500 hover:bg-red-500/10"
                onClick={handleLogout}
              >
                <Logout size={20} className="mr-2" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Save */}
        <div className="mt-8 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

      </div>

      <div className="mb-20" /> {/* Spacer */}
    </div>
  );
}
