import { useState } from 'react';
import { Waves, TrendingUp, Clock, Zap, ArrowRight, MapPin, Wind, Thermometer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../components/ui';

// Mock data - would come from API/context in real app
const userSpots = [
  {
    id: 'surfside',
    name: 'Surfside Beach',
    buoyId: '42035',
    buoyName: 'Galveston',
    currentConditions: {
      waveHeight: 4.2,
      wavePeriod: 12,
      swellDirection: 'SE',
      swellDegrees: 145,
      windSpeed: 8,
      windDirection: 'NW',
      waterTemp: 72,
    },
    status: 'good' as const,
    triggersMatched: 2,
    nextCheck: '6:00 AM',
  },
  {
    id: 'galveston',
    name: 'Galveston (61st St)',
    buoyId: '42035',
    buoyName: 'Galveston',
    currentConditions: {
      waveHeight: 3.8,
      wavePeriod: 11,
      swellDirection: 'SE',
      swellDegrees: 140,
      windSpeed: 12,
      windDirection: 'E',
      waterTemp: 73,
    },
    status: 'fair' as const,
    triggersMatched: 1,
    nextCheck: '6:00 AM',
  },
  {
    id: 'bob-hall',
    name: 'Bob Hall Pier',
    buoyId: null, // No buoy assigned yet
    buoyName: null,
    currentConditions: null, // No conditions without buoy
    status: 'unknown' as const,
    triggersMatched: 0,
    nextCheck: '6:00 AM',
  },
];

const recentAlerts = [
  {
    id: '1',
    spotName: 'Surfside Beach',
    type: 'Epic',
    message: 'Surfside is firing! 5ft sets, offshore wind. GO NOW!',
    time: '2 hours ago',
    condition: 'epic' as const,
  },
  {
    id: '2',
    spotName: 'Galveston (61st St)',
    type: 'Morning Check',
    message: 'Good conditions expected. 4ft @ 11s. Traffic: 45min.',
    time: 'Yesterday 6:00 AM',
    condition: 'good' as const,
  },
  {
    id: '3',
    spotName: 'Surfside Beach',
    type: 'Night Forecast',
    message: 'Tomorrow looking fun. Swell building overnight.',
    time: '2 days ago',
    condition: 'good' as const,
  },
];

const statusConfig = {
  epic: { label: 'Epic', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', dotColor: 'bg-purple-500' },
  good: { label: 'Good', color: 'bg-green-500/20 text-green-400 border-green-500/30', dotColor: 'bg-green-500' },
  fair: { label: 'Fair', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dotColor: 'bg-yellow-500' },
  poor: { label: 'Poor', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', dotColor: 'bg-zinc-500' },
  unknown: { label: 'No Buoy', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dotColor: 'bg-orange-500' },
};

export function DashboardOverview() {
  const [expandedSpotId, setExpandedSpotId] = useState<string | null>(null);

  // Calculate aggregate stats
  const totalAlerts = 3; // This week
  const spotsWithBuoy = userSpots.filter((s) => s.buoyId);
  const bestSpot = spotsWithBuoy.length > 0
    ? spotsWithBuoy.reduce((best, spot) => {
        const statusOrder = { epic: 4, good: 3, fair: 2, poor: 1, unknown: 0 };
        return statusOrder[spot.status] > statusOrder[best.status] ? spot : best;
      }, spotsWithBuoy[0])
    : null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor conditions across all your spots.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userSpots.length}</p>
                <p className="text-xs text-muted-foreground">Active Spots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {bestSpot ? (
                <>
                  <div className={`h-10 w-10 rounded-lg ${statusConfig[bestSpot.status].color.split(' ')[0]} flex items-center justify-center`}>
                    <Waves className={`w-5 h-5 ${statusConfig[bestSpot.status].color.split(' ')[1]}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{bestSpot.currentConditions?.waveHeight}ft</p>
                    <p className="text-xs text-muted-foreground">Best: {bestSpot.name.split(' ')[0]}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Waves className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-xs text-muted-foreground">No buoys configured</p>
                  </div>
                </>
              )}
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
                <p className="text-2xl font-bold">{totalAlerts}</p>
                <p className="text-xs text-muted-foreground">Alerts This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Spots Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>All Spots</CardTitle>
          <CardDescription>Current conditions across your configured spots</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userSpots.map((spot) => {
              const status = statusConfig[spot.status];
              const isExpanded = expandedSpotId === spot.id;

              return (
                <div key={spot.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Spot Row */}
                  <button
                    onClick={() => setExpandedSpotId(isExpanded ? null : spot.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors text-left"
                  >
                    {/* Status Indicator */}
                    <div className={`h-3 w-3 rounded-full ${status.dotColor}`} />

                    {/* Spot Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{spot.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      {spot.buoyId ? (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          Buoy: {spot.buoyId} ({spot.buoyName})
                        </p>
                      ) : (
                        <p className="text-xs text-orange-400 mt-0.5">
                          No buoy assigned - select one to get conditions
                        </p>
                      )}
                    </div>

                    {/* Quick Stats - only show if buoy assigned */}
                    {spot.currentConditions ? (
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-mono font-bold">{spot.currentConditions.waveHeight}ft</p>
                          <p className="text-xs text-muted-foreground">Height</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono font-bold">{spot.currentConditions.wavePeriod}s</p>
                          <p className="text-xs text-muted-foreground">Period</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono font-bold">{spot.currentConditions.windSpeed}mph</p>
                          <p className="text-xs text-muted-foreground">{spot.currentConditions.windDirection}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:flex items-center">
                        <p className="text-sm text-muted-foreground">No data</p>
                      </div>
                    )}

                    {/* Triggers Matched */}
                    <Badge variant={spot.triggersMatched > 0 ? 'success' : 'secondary'}>
                      {spot.triggersMatched} trigger{spot.triggersMatched !== 1 ? 's' : ''}
                    </Badge>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/10">
                      {spot.currentConditions ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 border border-border rounded-lg bg-background">
                            <div className="flex items-center gap-2 mb-1">
                              <Waves className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Wave Height</p>
                            </div>
                            <p className="text-lg font-mono font-bold">
                              {spot.currentConditions.waveHeight}ft @ {spot.currentConditions.wavePeriod}s
                            </p>
                          </div>
                          <div className="p-3 border border-border rounded-lg bg-background">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Swell Direction</p>
                            </div>
                            <p className="text-lg font-mono font-bold">
                              {spot.currentConditions.swellDirection} ({spot.currentConditions.swellDegrees}°)
                            </p>
                          </div>
                          <div className="p-3 border border-border rounded-lg bg-background">
                            <div className="flex items-center gap-2 mb-1">
                              <Wind className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Wind</p>
                            </div>
                            <p className="text-lg font-mono font-bold">
                              {spot.currentConditions.windSpeed}mph {spot.currentConditions.windDirection}
                            </p>
                          </div>
                          <div className="p-3 border border-border rounded-lg bg-background">
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Water Temp</p>
                            </div>
                            <p className="text-lg font-mono font-bold">
                              {spot.currentConditions.waterTemp}°F
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border border-orange-500/30 bg-orange-500/10 rounded-lg">
                          <p className="text-sm text-orange-300">
                            No buoy assigned to this spot. Assign a buoy to see real-time conditions and enable alerts.
                          </p>
                          <Link
                            to="/dashboard/spot"
                            className="inline-block mt-2 text-sm text-orange-400 hover:text-orange-300 font-medium"
                          >
                            Assign Buoy →
                          </Link>
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Link
                          to={`/dashboard/triggers?spot=${spot.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Edit Triggers →
                        </Link>
                        <span className="text-xs text-muted-foreground">•</span>
                        <Link
                          to={`/dashboard/spot`}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Spot Settings →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Your last notifications across all spots</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.map((alert) => {
              const conditionStyle = statusConfig[alert.condition];
              return (
                <div key={alert.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${conditionStyle.color}`}>
                    {alert.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-muted-foreground">{alert.spotName}</p>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/dashboard/triggers">
          <Card className="group hover:border-zinc-600 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Configure Triggers</p>
                  <p className="text-sm text-muted-foreground">Set conditions per spot</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/spot">
          <Card className="group hover:border-zinc-600 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Manage Spots</p>
                  <p className="text-sm text-muted-foreground">Add or edit your breaks</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/alerts">
          <Card className="group hover:border-zinc-600 transition-colors cursor-pointer h-full">
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
