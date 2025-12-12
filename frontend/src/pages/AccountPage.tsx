import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Shield,
  CreditCard,
  X,
  Check,
  MapPin,
  MessageSquare,
  Infinity,
  Navigation,
  Home,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from "../components/ui";

export function AccountPage() {
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [email, setEmail] = useState("surfer@example.com");
  const [phoneVerified] = useState(true);
  const [emailVerified] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [currentTier] = useState<"free" | "unlimited">("free");
  const [homeAddress, setHomeAddress] = useState("");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your contact info and notification preferences.
        </p>
      </div>

      {/* Contact Info */}
      <Card className="mb-6 lg:mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription className="text-sm">Where we send your surf alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Phone */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number (SMS)
              </span>
              {phoneVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="flex-1"
              />
              {!phoneVerified && <Button variant="outline">Verify</Button>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              We use SMS for instant alerts. Standard messaging rates may apply.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </span>
              {emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
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

      {/* Home Address */}
      <Card className="mb-6 lg:mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Home className="w-5 h-5" />
            Home Address
          </CardTitle>
          <CardDescription className="text-sm">
            Used for traffic estimates in all alerts. We never share this data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              placeholder="123 Main St, Houston, TX"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" className="w-full sm:w-auto">
              <Navigation className="w-4 h-4 mr-2" />
              Verify
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Optional. Leave blank if you don't want traffic info in alerts.
          </p>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="mb-6 lg:mb-8">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Notification Channels</CardTitle>
          <CardDescription className="text-sm">How you receive surf alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* SMS - Primary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3 border-2 border-green-500/50 bg-green-500/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">SMS</p>
                  <Badge variant="success" className="text-[10px]">Primary</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Instant texts when conditions match triggers
                </p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          {/* Email - Fallback */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-muted-foreground">Email</p>
                  <Badge variant="secondary" className="text-[10px]">Fallback</Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {currentTier === "free"
                    ? "Used when SMS limit reached (Night Before alerts only)"
                    : "Backup if SMS delivery fails"
                  }
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Auto-enabled</span>
          </div>

          {/* Explanation */}
          <p className="text-xs text-muted-foreground pt-2">
            SMS is always primary. Email automatically kicks in as a fallback
            {currentTier === "free" && " after your 5 monthly SMS alerts are used"}.
          </p>
        </CardContent>
      </Card>

      {/* Supporter Status */}
      <Card
        className={`mb-6 lg:mb-8 ${currentTier === "free"
            ? "border-yellow-500/30 bg-yellow-500/5"
            : "border-green-500/30 bg-green-500/5"
          }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard
              className={`w-5 h-5 ${currentTier === "free" ? "text-yellow-400" : "text-green-400"
                }`}
            />
            Subscription
          </CardTitle>
          <CardDescription>
            {currentTier === "free"
              ? "Upgrade for unlimited alerts"
              : "Thanks for supporting Home Break!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {currentTier === "free" ? "Free Tier" : "Unlimited Tier"}
                </p>
                <Badge variant={currentTier === "free" ? "warning" : "success"}>
                  {currentTier === "free" ? "Current" : "Active"}
                </Badge>
              </div>
              {currentTier === "free" ? (
                <p className="text-sm text-muted-foreground mt-1">
                  1 spot • 1 trigger • 3 of 5 SMS remaining
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Unlimited spots • Unlimited triggers • Unlimited SMS
                </p>
              )}
            </div>
            {currentTier === "free" ? (
              <Button onClick={() => setShowPricingModal(true)}>Upgrade</Button>
            ) : (
              <Button variant="outline">Manage</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Download My Data
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="mt-8 flex justify-end">
        <Button size="lg">Save Changes</Button>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPricingModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Choose Your Plan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Simple pricing. Cancel anytime.
                </p>
              </div>
              <button
                onClick={() => setShowPricingModal(false)}
                className="p-2 hover:bg-secondary rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pricing Cards */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free Tier */}
              <div
                className={`border rounded-xl p-6 ${currentTier === "free"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                  }`}
              >
                {currentTier === "free" && (
                  <Badge variant="secondary" className="mb-4">
                    Current Plan
                  </Badge>
                )}
                <h3 className="text-lg font-bold">Free</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Perfect for trying out Home Break
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>1 spot</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-muted-foreground" />
                    <span>1 trigger</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span>5 SMS alerts per month</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>Email fallback after SMS limit</span>
                  </li>
                </ul>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={currentTier === "free"}
                >
                  {currentTier === "free" ? "Current Plan" : "Downgrade"}
                </Button>
              </div>

              {/* Unlimited Tier */}
              <div className="border-2 border-green-500 rounded-xl p-6 relative bg-green-500/5">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                  Recommended
                </Badge>
                <h3 className="text-lg font-bold mt-2">Unlimited</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">$5</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Never miss a session
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Infinity className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Unlimited spots</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Infinity className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Unlimited triggers</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Infinity className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Unlimited SMS alerts</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>All alert types</span>
                  </li>
                </ul>

                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  {currentTier === "unlimited"
                    ? "Current Plan"
                    : "Upgrade to Unlimited"}
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-secondary/30">
              <p className="text-xs text-muted-foreground text-center">
                All plans include real-time buoy data, forecast checks, and
                popup alerts.
                <br />
                Cancel anytime. No questions asked.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
