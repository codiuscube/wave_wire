import { useState } from 'react';
import { SpotCard } from '../components/SpotCard';
import type { Spot } from '../components/SpotCard';
import { AlertsModal } from '../components/dashboard/AlertsModal';
import { Button } from '../components/ui';
import { AlertCard } from '../components/dashboard/AlertCard';

// Mock data - would come from API/context in real app
const userSpots: Spot[] = [
  {
    id: 'surfside',
    name: 'Surfside Beach',
    buoyId: '42035',
    buoyName: 'Galveston (22nm SE)',
    buoy: {
      waveHeight: 4.2,
      wavePeriod: 12,
      waterTemp: 72,
      meanWaveDirection: 'SE',
      meanWaveDegrees: 145,
      timestamp: 'Just now',
      windSpeed: 12,
      windDirection: 'SE',
      windDegrees: 140,
    },
    forecast: {
      primary: {
        height: 3.5,
        period: 11,
        direction: 'SE',
        degrees: 140,
      },
      secondary: {
        height: 1.2,
        period: 8,
        direction: 'E',
        degrees: 90,
      },
      windSpeed: 8,
      windDirection: 'NW',
      windDegrees: 315,
      tide: 1.2,
      airTemp: 78,
    },
    status: 'good',
    triggersMatched: 2,
    nextCheck: '6:00 AM',
    icon: 'Star',
  },
  {
    id: 'galveston',
    name: 'Galveston (61st St)',
    buoyId: '42035',
    buoyName: 'Galveston (22nm SE)',
    buoy: {
      waveHeight: 3.8,
      wavePeriod: 11,
      waterTemp: 71,
      meanWaveDirection: 'SE',
      meanWaveDegrees: 142,
      timestamp: '15m ago',
      windSpeed: 10,
      windDirection: 'SE',
      windDegrees: 138,
    },
    forecast: {
      primary: {
        height: 3.2,
        period: 10,
        direction: 'SE',
        degrees: 135,
      },
      secondary: {
        height: 1.0,
        period: 7,
        direction: 'E',
        degrees: 85,
      },
      windSpeed: 12,
      windDirection: 'SE',
      windDegrees: 135,
      tide: 0.8,
      airTemp: 76,
    },
    status: 'fair',
    triggersMatched: 0,
    nextCheck: '6:30 AM',
    icon: 'Radio',
  },
  {
    id: 'bob-hall',
    name: 'Bob Hall Pier',
    // No buoy assigned for this one to test "No Signal"
    forecast: {
      primary: {
        height: 2.1,
        period: 8,
        direction: 'E',
        degrees: 95,
      },
      secondary: {
        height: 0.8,
        period: 5,
        direction: 'SE',
        degrees: 120,
      },
      windSpeed: 4,
      windDirection: 'W',
      windDegrees: 270,
      tide: -0.2,
      airTemp: 82,
    },
    status: 'poor',
    triggersMatched: 0,
    nextCheck: '7:00 AM',
    icon: 'Anchor',
  },
];

const recentAlerts = [
  {
    id: '1',
    spotName: 'Surfside Beach',
    type: 'Epic',
    message: 'Surfside is firing! 5ft sets, offshore wind. GO NOW!',
    time: '2023-10-24T14:32:00Z',
    condition: 'epic' as const,
  },
  {
    id: '2',
    spotName: 'Galveston (61st St)',
    type: 'Morning Check',
    message: 'Good conditions expected. 4ft @ 11s. Traffic: 45min.',
    time: '2023-10-23T06:15:00Z',
    condition: 'good' as const,
  },
  {
    id: '3',
    spotName: 'Surfside Beach',
    type: 'Night Forecast',
    message: 'Tomorrow looking fun. Swell building overnight.',
    time: '2023-10-22T21:45:00Z',
    condition: 'good' as const,
  },
];



export function DashboardOverview() {
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 lg:mb-12">
        <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
          // OPERATIONAL_OVERVIEW
        </div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="DASHBOARD">
          Dashboard
        </h1>
        <p className="font-mono text-muted-foreground text-base sm:text-lg border-l-2 border-muted pl-4">
          Monitor raw data feeds across your designated spots.
        </p>
      </div>

      {/* Recent Alerts */}
      <div className="mb-8 lg:mb-12">
        <div className="tech-card rounded-lg bg-card/50 backdrop-blur-md">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-destructive animate-pulse" />
              <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">Recent Wire Intercepts</h2>
            </div>
            <Button
              onClick={() => setShowAlertsModal(true)}
              variant="rogue-secondary"
              className="px-4 py-2"
            >
              VIEW_LOGS
            </Button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Spots Status */}
      <div>
        <div className="tech-card rounded-lg bg-card/50 backdrop-blur-md">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
              <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">YOUR_SPOTS</h2>
            </div>
            <div className="flex gap-4">
              <Button variant="rogue-secondary" className="px-4 py-2">
                EDIT_SPOTS
              </Button>
              <Button variant="rogue-secondary" className="px-4 py-2">
                EDIT_TRIGGERS
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {userSpots.map((spot) => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          </div>
        </div>
        <AlertsModal
          isOpen={showAlertsModal}
          onClose={() => setShowAlertsModal(false)}
          initialAlerts={recentAlerts}
        />
      </div>
    </div>
  );
}
