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
} from '@solar-icons/react';
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
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks";

export function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, isLoading, error, update } = useProfile(user?.id);
  const navigate = useNavigate();

  // Local form state (initialized from profile)
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeLat, setHomeLat] = useState<number | null>(null);
  const [homeLon, setHomeLon] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    setSaveError(null);
    setSaveSuccess(false);

    const { error: updateError } = await update({
      phone: phone || null,
      email: email || null,
      homeAddress: homeAddress || null,
      homeLat,
      homeLon,
    });

    setIsSaving(false);

    if (updateError) {
      setSaveError(updateError);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || isLoading) {
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

        {/* Contact Info */}
        <div className="w-full mb-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full bg-primary animate-pulse`} />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Contact Info</h2>
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

        {/* Notification Channels - Coming Soon */}
        <div className="w-full mb-8 opacity-50 pointer-events-none">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className={`w-2 h-2 rounded-full bg-amber-500/50`} />
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Channels</h2>
            <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
          </div>
          <Card className="mb-6 lg:mb-8 bg-card/60 backdrop-blur-sm border-muted">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Notification Channels</CardTitle>
              <CardDescription className="text-sm">How you receive surf alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* SMS - Primary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3 border border-border bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                    <Phone weight="Bold" size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-muted-foreground">SMS</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Instant texts when conditions match triggers
                    </p>
                  </div>
                </div>
              </div>

              {/* Email - Fallback */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Letter weight="Bold" size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-muted-foreground">Email</p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Email notifications for surf alerts
                    </p>
                  </div>
                </div>
              </div>
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
          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-sm text-green-600">Changes saved successfully!</p>
          )}
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
