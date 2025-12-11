import { useState } from 'react';
import { User, Phone, Mail, Shield, CreditCard } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from '../components/ui';

export function AccountPage() {
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [email, setEmail] = useState('surfer@example.com');
  const [phoneVerified] = useState(true);
  const [emailVerified] = useState(false);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground mt-1">
          Manage your contact info and notification preferences.
        </p>
      </div>

      {/* Contact Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Where we send your surf alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              {!phoneVerified && (
                <Button variant="outline">Verify</Button>
              )}
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
              {!emailVerified && (
                <Button variant="outline">Verify</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Email is used for daily digests and account notifications.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Instant text messages for real-time alerts
                </p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Digest</p>
                <p className="text-sm text-muted-foreground">
                  Daily summary of conditions
                </p>
              </div>
            </div>
            <Badge variant="secondary">Off</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Supporter Status */}
      <Card className="mb-8 border-yellow-500/30 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-yellow-400" />
            Supporter Status
          </CardTitle>
          <CardDescription>
            Help cover SMS and server costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Tier</p>
              <p className="text-sm text-muted-foreground">
                50 SMS credits remaining this month
              </p>
            </div>
            <Button>Become a Supporter</Button>
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
    </div>
  );
}
