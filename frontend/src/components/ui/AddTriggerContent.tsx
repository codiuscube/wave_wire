import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { Slider } from "./Slider";
import type { TriggerTier } from "../../types";

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

interface AddTriggerContentProps {
    spotId: string;
    onAddTrigger: (trigger: TriggerTier) => void;
    className?: string; // Add className prop
}

export function AddTriggerContent({
    spotId,
    onAddTrigger,
    className = "",
}: AddTriggerContentProps) {
    const [trigger, setTrigger] = useState({
        name: "",
        emoji: "🌊",
        condition: "good" as "fair" | "good" | "epic",
        minHeight: 2,
        maxHeight: 5,
        minPeriod: 6,
        maxPeriod: 12,
        windDirections: ["N", "NW", "NNW"] as string[],
        maxWindSpeed: 15,
        swellDirection: ["SE", "S"] as string[],
    });

    const toggleSwellDirection = (direction: string) => {
        setTrigger((prev) => ({
            ...prev,
            swellDirection: prev.swellDirection.includes(direction)
                ? prev.swellDirection.filter((d) => d !== direction)
                : [...prev.swellDirection, direction],
        }));
    };

    const toggleWindDirection = (direction: string) => {
        setTrigger((prev) => ({
            ...prev,
            windDirections: prev.windDirections.includes(direction)
                ? prev.windDirections.filter((d) => d !== direction)
                : [...prev.windDirections, direction],
        }));
    };

    const handleSubmit = () => {
        if (!trigger.name.trim()) return;

        const newTrigger: TriggerTier = {
            id: Date.now().toString(),
            name: trigger.name,
            emoji: trigger.emoji,
            condition: trigger.condition,
            minHeight: trigger.minHeight,
            maxHeight: trigger.maxHeight,
            minPeriod: trigger.minPeriod,
            maxPeriod: trigger.maxPeriod,
            windDirections: trigger.windDirections,
            maxWindSpeed: trigger.maxWindSpeed,
            swellDirection: trigger.swellDirection,
            spotId,
        };

        onAddTrigger(newTrigger);
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
                {/* Name & Emoji */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="text-sm font-medium mb-2 block">
                            Trigger Name
                        </label>
                        <Input
                            value={trigger.name}
                            onChange={(e) =>
                                setTrigger({ ...trigger, name: e.target.value })
                            }
                            placeholder="e.g., Dawn Patrol, Lunch Session"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Emoji</label>
                        <Select
                            options={emojiOptions}
                            value={trigger.emoji}
                            onChange={(v) => setTrigger({ ...trigger, emoji: v })}
                        />
                    </div>
                </div>

                {/* Condition */}
                <div>
                    <label className="text-sm font-medium mb-2 block">
                        Condition Level
                    </label>
                    <Select
                        options={conditionOptions}
                        value={trigger.condition}
                        onChange={(v) =>
                            setTrigger({
                                ...trigger,
                                condition: v as "fair" | "good" | "epic",
                            })
                        }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        This determines the urgency of alerts when conditions match.
                    </p>
                </div>

                {/* Wave Height */}
                <div>
                    <label className="text-sm font-medium mb-3 block">
                        Wave Height: {trigger.minHeight}ft - {trigger.maxHeight}ft
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
                                onChange={(v) => setTrigger({ ...trigger, minHeight: v })}
                                className="flex-1"
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Slider
                                min={2}
                                max={15}
                                step={0.5}
                                value={trigger.maxHeight}
                                onChange={(v) => setTrigger({ ...trigger, maxHeight: v })}
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
                    <label className="text-sm font-medium mb-3 block">
                        Minimum Period: {trigger.minPeriod}s
                    </label>
                    <Slider
                        min={4}
                        max={18}
                        step={1}
                        value={trigger.minPeriod}
                        onChange={(v) => setTrigger({ ...trigger, minPeriod: v })}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Longer periods = more powerful waves.
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
                                onClick={() => toggleSwellDirection(dir.value)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${trigger.swellDirection.includes(dir.value)
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-transparent text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                                    }`}
                            >
                                {dir.label}
                            </button>
                        ))}
                    </div>
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
                                onClick={() => toggleWindDirection(dir.value)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${trigger.windDirections.includes(dir.value)
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-transparent text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                                    }`}
                            >
                                {dir.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Max Wind Speed */}
                <div>
                    <label className="text-sm font-medium mb-3 block">
                        Max Wind Speed: {trigger.maxWindSpeed}mph
                    </label>
                    <Slider
                        min={5}
                        max={30}
                        step={1}
                        value={trigger.maxWindSpeed}
                        onChange={(v) => setTrigger({ ...trigger, maxWindSpeed: v })}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border mt-auto">
                <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!trigger.name.trim()}
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Add Trigger
                </Button>
            </div>
        </div>
    );
}
