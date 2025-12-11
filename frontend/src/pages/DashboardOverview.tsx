import { Waves, TrendingUp, Clock, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '../components/ui';

export function DashboardOverview() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your surf alerts and current conditions.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Waves className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.2ft</p>
                <p className="text-xs text-muted-foreground">Current Swell</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">12s</p>
                <p className="text-xs text-muted-foreground">Wave Period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">6:00 AM</p>
                <p className="text-xs text-muted-foreground">Next Check</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Alerts This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Conditions</CardTitle>
            <CardDescription>Live data from your selected spot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium">Surfside Beach</p>
                  <p className="text-sm text-muted-foreground">Buoy: 42035 (Galveston)</p>
                </div>
                <Badge variant="success">Conditions Met</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Wave Height</p>
                  <p className="text-xl font-mono font-bold">4.2ft @ 12s</p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Wind</p>
                  <p className="text-xl font-mono font-bold">8mph NW</p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Swell Direction</p>
                  <p className="text-xl font-mono font-bold">SE (145°)</p>
                </div>
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Water Temp</p>
                  <p className="text-xl font-mono font-bold">72°F</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Your last notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  type: 'OMFG',
                  message: 'Surfside is firing! 5ft sets, offshore wind. GO NOW!',
                  time: '2 hours ago',
                  tier: 'success',
                },
                {
                  type: 'Morning Check',
                  message: 'Good conditions expected. 4ft @ 11s. Traffic: 45min.',
                  time: 'Yesterday 6:00 AM',
                  tier: 'secondary',
                },
                {
                  type: 'Night Forecast',
                  message: 'Tomorrow looking fun. Swell building overnight.',
                  time: '2 days ago',
                  tier: 'secondary',
                },
              ].map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <Badge variant={alert.tier as 'success' | 'secondary'}>{alert.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/dashboard/triggers">
          <Card className="group hover:border-zinc-600 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Configure Triggers</p>
                  <p className="text-sm text-muted-foreground">Set your wave conditions</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/spot">
          <Card className="group hover:border-zinc-600 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Spot</p>
                  <p className="text-sm text-muted-foreground">Update your home break</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/alerts">
          <Card className="group hover:border-zinc-600 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alert Schedule</p>
                  <p className="text-sm text-muted-foreground">Manage notification times</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
