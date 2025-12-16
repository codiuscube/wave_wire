import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, GripVertical, Info, Radar, MapPin, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  Card,
  CardContent,
  Button,
  Input,
  Slider,
  Select,
  Badge,
  AddTriggerModal,
} from "../components/ui";
import type { TriggerTier } from "../types";

// Mock spots - in real app this would come from context/store
// Set to empty array to test no-spots state, or use the array below for normal state
const userSpots: { id: string; name: string; buoyId: string }[] = [
  { id: "surfside", name: "Surfside Beach", buoyId: "42035" },
  { id: "galveston", name: "Galveston (61st St)", buoyId: "42035" },
  { id: "bob-hall", name: "Bob Hall Pier", buoyId: "42020" },
];

const defaultTriggers: TriggerTier[] = [
  {
    id: "1",
    name: "Dawn Patrol",
    emoji: "🔥",
    condition: "epic",
    minHeight: 5,
    maxHeight: 15,
    minPeriod: 10,
    maxPeriod: 20,
    windDirections: ["N", "NNW", "NW", "WNW"],
    maxWindSpeed: 12,
    swellDirection: ["SE", "S", "SSE"],
    spotId: "surfside",
  },
  {
    id: "2",
    name: "Lunch Session",
    emoji: "🏄",
    condition: "good",
    minHeight: 3,
    maxHeight: 6,
    minPeriod: 8,
    maxPeriod: 15,
    windDirections: ["N", "NNW", "NW", "WNW", "W", "NNE"],
    maxWindSpeed: 15,
    swellDirection: ["SE", "S", "SSE", "E"],
    spotId: "surfside",
  },
  {
    id: "3",
    name: "After Work",
    emoji: "👍",
    condition: "fair",
    minHeight: 2,
    maxHeight: 4,
    minPeriod: 6,
    maxPeriod: 12,
    windDirections: ["N", "NNW", "NW", "WNW", "W", "NNE", "NE", "WSW"],
    maxWindSpeed: 20,
    swellDirection: ["SE", "S", "SSE", "E", "ESE"],
    spotId: "surfside",
  },
];

const emojiOptions = [
  { value: "🔥", label: "🔥 Fire" },
  { value: "🏄", label: "🏄 Surfer" },
  { value: "👍", label: "👍 Thumbs Up" },
  { value: "🌊", label: "🌊 Wave" },
  { value: "⚡", label: "⚡ Lightning" },
  { value: "🚀", label: "🚀 Rocket" },
  { value: "💎", label: "💎 Diamond" },
  { value: "🌅", label: "🌅 Sunrise" },
  { value: "🌴", label: "🌴 Palm" },
  { value: "☀️", label: "☀️ Sun" },
];

const conditionOptions = [
  { value: "fair", label: "Fair" },
  { value: "good", label: "Good" },
  { value: "epic", label: "Epic" },
];

const directionOptions = [
  { value: "N", label: "N" },
  { value: "NNE", label: "NNE" },
  { value: "NE", label: "NE" },
  { value: "ENE", label: "ENE" },
  { value: "E", label: "E" },
  { value: "ESE", label: "ESE" },
  { value: "SE", label: "SE" },
  { value: "SSE", label: "SSE" },
  { value: "S", label: "S" },
  { value: "SSW", label: "SSW" },
  { value: "SW", label: "SW" },
  { value: "WSW", label: "WSW" },
  { value: "W", label: "W" },
  { value: "WNW", label: "WNW" },
  { value: "NW", label: "NW" },
  { value: "NNW", label: "NNW" },
];

const conditionColors = {
  fair: "bg-zinc-900 text-zinc-300 border-zinc-800",
  good: "bg-zinc-100 text-zinc-900 border-zinc-200",
  epic: "bg-white text-black border-white ring-1 ring-zinc-200 shadow-sm",
};

export function TriggersPage() {
  const { isAdmin } = useAuth();
  const [triggers, setTriggers] = useState<TriggerTier[]>(defaultTriggers);
  const [expandedId, setExpandedId] = useState<string | null>("1");
  const [selectedSpotId, setSelectedSpotId] = useState<string>(
    userSpots.length > 0 ? userSpots[0].id : ""
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const hasSpots = userSpots.length > 0;

  // Show "Coming Soon" for non-admin users
  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Triggers</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Define what conditions get you out of bed.
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Custom triggers are coming soon. You'll be able to set specific wave height, period, and wind conditions that match your preferences.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const spotOptions = userSpots.map((s) => ({ value: s.id, label: s.name }));

  const filteredTriggers = selectedSpotId
    ? triggers.filter((t) => t.spotId === selectedSpotId)
    : [];

  const updateTrigger = (id: string, updates: Partial<TriggerTier>) => {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const toggleSwellDirection = (triggerId: string, direction: string) => {
    const trigger = triggers.find((t) => t.id === triggerId);
    if (!trigger) return;

    const newDirections = trigger.swellDirection.includes(direction)
      ? trigger.swellDirection.filter((d) => d !== direction)
      : [...trigger.swellDirection, direction];

    updateTrigger(triggerId, { swellDirection: newDirections });
  };

  const toggleWindDirection = (triggerId: string, direction: string) => {
    const trigger = triggers.find((t) => t.id === triggerId);
    if (!trigger) return;

    const newDirections = trigger.windDirections.includes(direction)
      ? trigger.windDirections.filter((d) => d !== direction)
      : [...trigger.windDirections, direction];

    updateTrigger(triggerId, { windDirections: newDirections });
  };

  const addTrigger = (newTrigger: TriggerTier) => {
    setTriggers([...triggers, newTrigger]);
    setExpandedId(newTrigger.id);
  };

  const deleteTrigger = (id: string) => {
    setTriggers(triggers.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const formatWindSummary = (directions: string[]) => {
    if (directions.length === 0) return "No wind selected";
    if (directions.length <= 3) return directions.join(", ");
    return `${directions.slice(0, 2).join(", ")} +${directions.length - 2
      } more`;
  };

  const selectedSpot = userSpots.find((s) => s.id === selectedSpotId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Triggers</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Define what conditions get you out of bed. Triggers are specific to
          each spot.
        </p>
      </div>

      {/* Spot Selector */}
      <Card className="mb-6">
        <CardContent className="pt-4 sm:pt-6">
          {hasSpots ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Select Spot
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Triggers are configured per spot. Select a spot to manage
                    its triggers.
                  </p>
                </div>
                <Select
                  options={spotOptions}
                  value={selectedSpotId}
                  onChange={setSelectedSpotId}
                  className="w-full sm:w-64"
                />
              </div>
              {selectedSpot && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground font-mono">
                    Buoy: {selectedSpot.buoyId} • {filteredTriggers.length}{" "}
                    trigger
                    {filteredTriggers.length !== 1 ? "s" : ""} configured
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mb-3">
                <MapPin className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="font-medium text-foreground mb-1">No spots saved yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a spot first to start defining triggers.
              </p>
              <Link to="/dashboard/spots">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create a Spot
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner - Only show when no triggers */}
      {hasSpots && filteredTriggers.length === 0 && (
        <Card className="mb-6 lg:mb-8 bg-primary/10 border-primary/30">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">How Triggers Work</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Triggers are checked in order from top to bottom. When
                  conditions match a trigger, you'll get an alert with that
                  condition level (Fair/Good/Epic). Alerts use your Personality
                  setting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triggers List - Only show when spots exist */}
      {hasSpots && (
        <div className="space-y-4">
          {filteredTriggers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                  <Radar className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="text-muted-foreground">
                  No triggers configured for this spot yet.
                </p>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Trigger
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTriggers.map((trigger, index) => (
            <Card
              key={trigger.id}
              className={`transition-all ${expandedId === trigger.id ? "border-zinc-600" : ""
                }`}
            >
              {/* Collapsed Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === trigger.id ? null : trigger.id)
                }
                className="w-full p-4 flex items-center gap-4 text-left"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-2xl">{trigger.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{trigger.name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${conditionColors[trigger.condition]
                          }`}
                      >
                        {trigger.condition.charAt(0).toUpperCase() +
                          trigger.condition.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trigger.minHeight}-{trigger.maxHeight}ft @{" "}
                      {trigger.minPeriod}s+ • Wind:{" "}
                      {formatWindSummary(trigger.windDirections)} &lt;
                      {trigger.maxWindSpeed}mph
                    </p>
                  </div>
                </div>
                <Badge variant={index === 0 ? "success" : "secondary"}>
                  Priority {index + 1}
                </Badge>
              </button>

              {/* Expanded Content */}
              {expandedId === trigger.id && (
                <CardContent className="pt-0 pb-4 sm:pb-6 px-4 sm:px-6 border-t border-border mt-2">
                  <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
                    {/* Name, Emoji & Condition */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Trigger Name
                        </label>
                        <Input
                          value={trigger.name}
                          onChange={(e) =>
                            updateTrigger(trigger.id, { name: e.target.value })
                          }
                          placeholder="e.g., Dawn Patrol, Lunch Session"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Emoji
                        </label>
                        <Select
                          options={emojiOptions}
                          value={trigger.emoji}
                          onChange={(v) =>
                            updateTrigger(trigger.id, { emoji: v })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Condition
                        </label>
                        <Select
                          options={conditionOptions}
                          value={trigger.condition}
                          onChange={(v) =>
                            updateTrigger(trigger.id, {
                              condition: v as "fair" | "good" | "epic",
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Wave Height */}
                    <div>
                      <label className="text-sm font-medium mb-4 block">
                        Wave Height: {trigger.minHeight}ft - {trigger.maxHeight}
                        ft
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground w-8">
                          {trigger.minHeight}ft
                        </span>
                        <div className="flex-1 flex gap-4 items-center">
                          <Slider
                            min={1}
                            max={10}
                            step={0.5}
                            value={trigger.minHeight}
                            onChange={(v) =>
                              updateTrigger(trigger.id, { minHeight: v })
                            }
                            className="flex-1"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Slider
                            min={2}
                            max={15}
                            step={0.5}
                            value={trigger.maxHeight}
                            onChange={(v) =>
                              updateTrigger(trigger.id, { maxHeight: v })
                            }
                            className="flex-1"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {trigger.maxHeight}ft
                        </span>
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
                        onChange={(v) =>
                          updateTrigger(trigger.id, { minPeriod: v })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Longer periods = more powerful waves. Gulf storms
                        usually 6-10s, hurricane swells 12s+.
                      </p>
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
                            onClick={() =>
                              toggleSwellDirection(trigger.id, dir.value)
                            }
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${trigger.swellDirection.includes(dir.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                              }`}
                          >
                            {dir.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Select directions that work for your spot. Most Gulf
                        beaches favor SE-S swells.
                      </p>
                    </div>

                    {/* Wind Direction */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Acceptable Wind Directions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {directionOptions.map((dir) => (
                          <button
                            key={dir.value}
                            onClick={() =>
                              toggleWindDirection(trigger.id, dir.value)
                            }
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${trigger.windDirections.includes(dir.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                              }`}
                          >
                            {dir.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Offshore wind (blowing from land to sea) creates the
                        cleanest conditions. For most Gulf beaches, N/NW winds
                        are offshore.
                      </p>
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
                        onChange={(v) =>
                          updateTrigger(trigger.id, { maxWindSpeed: v })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Even good wind direction gets choppy above 15-20mph.
                        Lower = cleaner conditions.
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
                        Delete Trigger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
            ))
          )}
        </div>
      )}

      {/* Add Trigger Button */}
      {hasSpots && filteredTriggers.length > 0 && (
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="outline"
          className="mt-4 w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Trigger
        </Button>
      )}

      {/* Save Button */}
      {hasSpots && (
        <div className="mt-8 flex justify-end">
          <Button size="lg">Save Changes</Button>
        </div>
      )}

      {/* Add Trigger Modal */}
      <AddTriggerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTrigger={addTrigger}
        spotId={selectedSpotId}
      />
    </div>
  );
}
