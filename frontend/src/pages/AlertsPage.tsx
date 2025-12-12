import { useState } from 'react';
import { Clock, Moon, Sun, Zap, Bell, Info, AlertCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Switch,
  Badge,
} from '../components/ui';
import type { AlertSchedule } from '../types';

const defaultSchedules: AlertSchedule[] = [
  {
    id: '1',
    name: 'Night Before Hype',
    description: 'Checks tomorrow\'s forecast against your triggers. Only alerts if conditions look promising.',
    time: '20:00',
    type: 'forecast',
    enabled: true,
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  },
  {
    id: '2',
    name: 'Morning Reality Check',
    description: 'Validates live buoy data against your triggers. Only alerts if conditions are actually good + includes traffic estimate.',
    time: '06:00',
    type: 'realtime',
    enabled: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: '3',
    name: 'Pop-Up Alerts',
    description: 'Monitors for sudden condition changes. Only alerts when conditions improve to match a trigger.',
    time: '*/2',
    type: 'popup',
    enabled: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const alertIcons: Record<string, typeof Clock> = {
  forecast: Moon,
  realtime: Sun,
  popup: Zap,
};

const alertDetails: Record<string, { trigger: string; example: string }> = {
  forecast: {
    trigger: 'Tomorrow\'s forecast matches a trigger',
    example: '"Tomorrow looking good! Forecast shows 4ft @ 10s with NW winds. Set that alarm."',
  },
  realtime: {
    trigger: 'Live buoy data matches a trigger',
    example: '"Morning check: Buoy 42035 reading 4.2ft @ 12s (SE), wind 8mph NW. Traffic: 45min. Verdict: GO!"',
  },
  popup: {
    trigger: 'Conditions change to match a trigger',
    example: '"Wind just switched offshore! Buoy 42035: 3.5ft @ 9s (SE). Surfside cleaning up - glassy for the next few hours."',
  },
};

export function AlertsPage() {
  const [schedules, setSchedules] = useState<AlertSchedule[]>(defaultSchedules);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('05:00');

  const updateSchedule = (id: string, updates: Partial<AlertSchedule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const toggleDay = (scheduleId: string, day: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    const newDays = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day];

    updateSchedule(scheduleId, { days: newDays });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Alert Schedule</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Control when we check conditions. Alerts only fire when triggers are matched.
        </p>
      </div>

      {/* Key Info Banner */}
      <Card className="mb-6 lg:mb-8 bg-primary/10 border-primary/30">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">No Spam, Only Signals</p>
              <p className="text-sm text-muted-foreground mt-1">
                All alerts require conditions to match your triggers. You won't get "nothing happening" messages -
                only notifications when it's actually worth checking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Alerts */}
      <div className="space-y-4 mb-6 lg:mb-8">
        {schedules.map((schedule) => {
          const Icon = alertIcons[schedule.type];
          const details = alertDetails[schedule.type];
          return (
            <Card key={schedule.id}>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${schedule.enabled
                        ? 'bg-primary/20'
                        : 'bg-secondary'
                      }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${schedule.enabled ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold">{schedule.name}</h3>
                        {schedule.type === 'popup' && (
                          <Badge variant="warning">Real-time</Badge>
                        )}
                      </div>
                      <Switch
                        checked={schedule.enabled}
                        onChange={(checked) =>
                          updateSchedule(schedule.id, { enabled: checked })
                        }
                      />
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {schedule.description}
                    </p>

                    {/* When it triggers */}
                    <div className="p-3 bg-secondary/30 rounded-lg mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Triggers when:
                      </p>
                      <p className="text-sm">{details.trigger}</p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Example: {details.example}
                      </p>
                    </div>

                    {schedule.enabled && (
                      <div className="space-y-4">
                        {/* Time Setting */}
                        {schedule.type !== 'popup' && (
                          <div className="flex items-center gap-4">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={schedule.time}
                              onChange={(e) =>
                                updateSchedule(schedule.id, { time: e.target.value })
                              }
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground">
                              Check time (your local timezone)
                            </span>
                          </div>
                        )}

                        {schedule.type === 'popup' && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Zap className="w-4 h-4" />
                            Checks every 2 hours during daylight (6am - 8pm)
                          </div>
                        )}

                        {/* Days Selection */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Active days (check runs on these days):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <button
                                key={day}
                                onClick={() => toggleDay(schedule.id, day)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md text-xs font-medium transition-colors ${schedule.days.includes(day)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                  }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                No alerts during these hours, even if conditions match
              </CardDescription>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onChange={setQuietHoursEnabled}
            />
          </div>
        </CardHeader>
        {quietHoursEnabled && (
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Start
                </label>
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="w-32"
                />
              </div>
              <span className="text-muted-foreground mt-5">to</span>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  End
                </label>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Pop-up alerts during quiet hours will be queued and sent when quiet hours end (if still valid).
            </p>
          </CardContent>
        )}
      </Card>

      {/* How It Works */}
      <Card className="mt-6 lg:mt-8 bg-muted/50 border-border">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Alert Flow</p>
              <div className="text-sm text-muted-foreground mt-3 space-y-3">
                <div className="flex gap-3">
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">1</span>
                  <p>At scheduled time, we check conditions for <strong>all your spots</strong></p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">2</span>
                  <p>Each spot's conditions are compared against <strong>its triggers</strong></p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">3</span>
                  <p>If a trigger matches, AI generates a message with your <strong>personality setting</strong></p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">4</span>
                  <p>You receive one consolidated alert (not spam for each spot)</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <strong>Free tier:</strong> 1 spot, 1 trigger, 5 SMS/month. After SMS limit, Night Before alerts fall back to email.
                  Upgrade to Unlimited for unlimited spots, triggers, and SMS.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="mt-8 flex justify-end">
        <Button size="lg">Save Schedule</Button>
      </div>
    </div>
  );
}
