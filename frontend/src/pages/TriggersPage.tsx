import { useState } from 'react';
import { Plus, Trash2, GripVertical, Info } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Slider,
  Select,
  Badge,
  Switch,
} from '../components/ui';
import type { TriggerTier } from '../types';

const defaultTriggers: TriggerTier[] = [
  {
    id: '1',
    name: 'OMFG',
    emoji: '🔥',
    minHeight: 5,
    maxHeight: 15,
    minPeriod: 10,
    maxPeriod: 20,
    windCondition: 'offshore',
    maxWindSpeed: 12,
    swellDirection: ['SE', 'S', 'SSE'],
  },
  {
    id: '2',
    name: 'Fun',
    emoji: '🏄',
    minHeight: 3,
    maxHeight: 6,
    minPeriod: 8,
    maxPeriod: 15,
    windCondition: 'light',
    maxWindSpeed: 15,
    swellDirection: ['SE', 'S', 'SSE', 'E'],
  },
  {
    id: '3',
    name: 'Worth It',
    emoji: '👍',
    minHeight: 2,
    maxHeight: 4,
    minPeriod: 6,
    maxPeriod: 12,
    windCondition: 'any',
    maxWindSpeed: 20,
    swellDirection: ['SE', 'S', 'SSE', 'E', 'ESE'],
  },
];

const windOptions = [
  { value: 'offshore', label: 'Offshore Only' },
  { value: 'light', label: 'Light (<10mph)' },
  { value: 'any', label: 'Any Wind' },
];

const directionOptions = [
  { value: 'N', label: 'N' },
  { value: 'NNE', label: 'NNE' },
  { value: 'NE', label: 'NE' },
  { value: 'ENE', label: 'ENE' },
  { value: 'E', label: 'E' },
  { value: 'ESE', label: 'ESE' },
  { value: 'SE', label: 'SE' },
  { value: 'SSE', label: 'SSE' },
  { value: 'S', label: 'S' },
  { value: 'SSW', label: 'SSW' },
  { value: 'SW', label: 'SW' },
  { value: 'WSW', label: 'WSW' },
  { value: 'W', label: 'W' },
  { value: 'WNW', label: 'WNW' },
  { value: 'NW', label: 'NW' },
  { value: 'NNW', label: 'NNW' },
];

export function TriggersPage() {
  const [triggers, setTriggers] = useState<TriggerTier[]>(defaultTriggers);
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const updateTrigger = (id: string, updates: Partial<TriggerTier>) => {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const toggleDirection = (triggerId: string, direction: string) => {
    const trigger = triggers.find((t) => t.id === triggerId);
    if (!trigger) return;

    const newDirections = trigger.swellDirection.includes(direction)
      ? trigger.swellDirection.filter((d) => d !== direction)
      : [...trigger.swellDirection, direction];

    updateTrigger(triggerId, { swellDirection: newDirections });
  };

  const addTrigger = () => {
    const newTrigger: TriggerTier = {
      id: Date.now().toString(),
      name: 'New Tier',
      emoji: '🌊',
      minHeight: 2,
      maxHeight: 5,
      minPeriod: 6,
      maxPeriod: 12,
      windCondition: 'any',
      maxWindSpeed: 15,
      swellDirection: ['SE', 'S'],
    };
    setTriggers([...triggers, newTrigger]);
    setExpandedId(newTrigger.id);
  };

  const deleteTrigger = (id: string) => {
    setTriggers(triggers.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Triggers</h1>
        <p className="text-muted-foreground mt-1">
          Define what conditions get you out of bed. Create tiers from "OMFG" to "Meh".
        </p>
      </div>

      {/* Info Banner */}
      <Card className="mb-8 bg-blue-500/10 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-100">How Triggers Work</p>
              <p className="text-sm text-blue-200/70 mt-1">
                Triggers are checked in order from top to bottom. When conditions match a tier,
                you'll get an alert with that tier's vibe. Alerts use your AI personality setting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triggers List */}
      <div className="space-y-4">
        {triggers.map((trigger, index) => (
          <Card
            key={trigger.id}
            className={`transition-all ${
              expandedId === trigger.id ? 'border-zinc-600' : ''
            }`}
          >
            {/* Collapsed Header */}
            <button
              onClick={() => setExpandedId(expandedId === trigger.id ? null : trigger.id)}
              className="w-full p-4 flex items-center gap-4 text-left"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <div className="flex-1 flex items-center gap-3">
                <span className="text-2xl">{trigger.emoji}</span>
                <div>
                  <p className="font-bold">{trigger.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {trigger.minHeight}-{trigger.maxHeight}ft @ {trigger.minPeriod}s+ •{' '}
                    {trigger.windCondition === 'offshore'
                      ? 'Offshore'
                      : trigger.windCondition === 'light'
                      ? 'Light wind'
                      : 'Any wind'}
                  </p>
                </div>
              </div>
              <Badge variant={index === 0 ? 'success' : 'secondary'}>
                Priority {index + 1}
              </Badge>
            </button>

            {/* Expanded Content */}
            {expandedId === trigger.id && (
              <CardContent className="pt-0 pb-6 px-6 border-t border-border mt-2">
                <div className="space-y-6 pt-6">
                  {/* Name & Emoji */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tier Name</label>
                      <Input
                        value={trigger.name}
                        onChange={(e) => updateTrigger(trigger.id, { name: e.target.value })}
                        placeholder="e.g., OMFG, Fun, Worth It"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Emoji</label>
                      <Input
                        value={trigger.emoji}
                        onChange={(e) => updateTrigger(trigger.id, { emoji: e.target.value })}
                        placeholder="🔥"
                        className="text-center text-2xl"
                      />
                    </div>
                  </div>

                  {/* Wave Height */}
                  <div>
                    <label className="text-sm font-medium mb-4 block">
                      Wave Height: {trigger.minHeight}ft - {trigger.maxHeight}ft
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-8">{trigger.minHeight}ft</span>
                      <div className="flex-1 flex gap-4 items-center">
                        <Slider
                          min={1}
                          max={10}
                          step={0.5}
                          value={trigger.minHeight}
                          onChange={(v) => updateTrigger(trigger.id, { minHeight: v })}
                          className="flex-1"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Slider
                          min={2}
                          max={15}
                          step={0.5}
                          value={trigger.maxHeight}
                          onChange={(v) => updateTrigger(trigger.id, { maxHeight: v })}
                          className="flex-1"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{trigger.maxHeight}ft</span>
                    </div>
                  </div>

                  {/* Wave Period */}
                  <div>
                    <label className="text-sm font-medium mb-4 block">
                      Minimum Period: {trigger.minPeriod}s
                    </label>
                    <Slider
                      min={4}
                      max={18}
                      step={1}
                      value={trigger.minPeriod}
                      onChange={(v) => updateTrigger(trigger.id, { minPeriod: v })}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Longer periods = more powerful waves. Gulf storms usually 6-10s, hurricane swells 12s+.
                    </p>
                  </div>

                  {/* Wind Condition */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Wind Condition</label>
                    <Select
                      options={windOptions}
                      value={trigger.windCondition}
                      onChange={(v) =>
                        updateTrigger(trigger.id, {
                          windCondition: v as 'offshore' | 'light' | 'any',
                        })
                      }
                    />
                  </div>

                  {/* Max Wind Speed */}
                  <div>
                    <label className="text-sm font-medium mb-4 block">
                      Max Wind Speed: {trigger.maxWindSpeed}mph
                    </label>
                    <Slider
                      min={5}
                      max={30}
                      step={1}
                      value={trigger.maxWindSpeed}
                      onChange={(v) => updateTrigger(trigger.id, { maxWindSpeed: v })}
                    />
                  </div>

                  {/* Swell Direction */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Acceptable Swell Directions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {directionOptions.map((dir) => (
                        <button
                          key={dir.value}
                          onClick={() => toggleDirection(trigger.id, dir.value)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            trigger.swellDirection.includes(dir.value)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select directions that work for your spot. Most Gulf beaches favor SE-S swells.
                    </p>
                  </div>

                  {/* Delete Button */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTrigger(trigger.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Tier
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add Trigger Button */}
      <Button onClick={addTrigger} variant="outline" className="mt-4 w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Trigger Tier
      </Button>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
