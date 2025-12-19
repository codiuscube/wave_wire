import { useState, useEffect, useCallback, useMemo } from "react";
import { Bolt, QuestionCircle, AddCircle, CloseCircle, HamburgerMenu } from '@solar-icons/react';
import { Reorder, useDragControls, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { DualSlider } from "./DualSlider";
import { DirectionSelector } from "./DirectionSelector";
import type { TriggerTier, SurfSpot } from "../../types";
import { getOffshoreWindow, getSwellWindow } from "../../data/noaaBuoys";
import { generateTriggerSummary, getTideLabel } from "../../lib/triggerUtils";

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

const tideOptions = [
    { value: "any", label: "Any Details" },
    { value: "rising", label: "Rising Only" },
    { value: "falling", label: "Falling Only" },
];

// Helper to format ranges with "15+" style logic
const formatRange = (min: number, max: number, absMax: number, unit: string) => {
    const minStr = min >= absMax ? `${absMax}+` : min.toString();
    const maxStr = max >= absMax ? `${absMax}+` : max.toString();
    return `${minStr}${unit} - ${maxStr}${unit}`;
};

// Convert degrees to cardinal direction
const degreesToCardinal = (deg: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
};

// Format height range for templates
const formatHeight = (min: number, max: number): string => {
    if (min === max) return `${min}ft`;
    if (max >= 15) return `${min}ft+`;
    return `${min}-${max}ft`;
};

// Format period for templates
const formatPeriod = (min: number, max: number): string => {
    if (min === max) return `${min}s`;
    if (min >= 10) return `${min}s+`;
    return `${min}-${max}s`;
};

// Dynamic template generators using actual trigger data
type TemplateGenerator = (t: Partial<TriggerTier>, spotName: string, buoyId?: string) => string;

const LOCAL_TEMPLATES: TemplateGenerator[] = [
    // Classic informational with buoy
    (t, spot, buoyId) => {
        const base = `${spot} is looking ${t.condition}. ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} @ ${formatPeriod(t.minPeriod || 0, t.maxPeriod || 0)} from the ${degreesToCardinal(t.minSwellDirection || 0)}. Wind ${(t.maxWindSpeed || 0) <= 10 ? 'light' : 'moderate'} out of the ${degreesToCardinal(t.minWindDirection || 0)}.`;
        return buoyId ? `${base} (Buoy ${buoyId}: [Buoy Height] @ [Buoy Period])` : base;
    },

    // Conversational with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` Buoy ${buoyId} showing [Buoy Height] @ [Buoy Period].` : '';
        return `Heads up - ${spot} has ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} waves rolling in. Period around ${t.minPeriod}s${(t.maxWindSpeed || 0) <= 8 ? ', winds are calm' : ''}.${buoyInfo} Could be worth a look.`;
    },

    // Data-focused with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` | Buoy ${buoyId}: [Buoy Height] @ [Buoy Period], [Water Temp]` : '';
        return `${spot}: ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} @ ${t.minPeriod}-${t.maxPeriod}s (${degreesToCardinal(t.minSwellDirection || 0)}). Wind: ${t.minWindSpeed}-${t.maxWindSpeed}mph ${degreesToCardinal(t.minWindDirection || 0)}. Condition: ${t.condition}.${buoyInfo}`;
    },

    // Brief and casual with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` Buoy reading [Buoy Height].` : '';
        return `${spot}'s got ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} @ ${t.minPeriod}s+. ${(t.maxWindSpeed || 0) <= 10 ? 'Clean conditions' : 'A bit of wind'}.${buoyInfo} ${t.condition === 'epic' ? 'Get out there!' : 'Worth checking.'}`;
    },

    // Morning report style with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` Buoy ${buoyId} reporting [Buoy Height] @ [Buoy Period]. Water [Water Temp].` : '';
        return `Morning check: ${spot} showing ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} faces, ${t.minPeriod}s period. Swell from ${degreesToCardinal(t.minSwellDirection || 0)}, wind ${degreesToCardinal(t.minWindDirection || 0)} at ${t.maxWindSpeed}mph.${buoyInfo} Rating: ${t.condition}.`;
    },
];

const HYPE_TEMPLATES: TemplateGenerator[] = [
    // Classic stoke with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` Buoy ${buoyId} confirms [Buoy Height]! 📡` : '';
        return `🔥 ${spot} is GOING OFF! ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} @ ${t.minPeriod}s+ and ${(t.maxWindSpeed || 0) <= 8 ? 'GLASSY' : 'looking fun'}!${buoyInfo} ${t.condition === 'epic' ? 'DROP EVERYTHING! 🚨' : 'Get on it! 🤙'}`;
    },

    // All caps energy with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` BUOY SAYS [Buoy Height]! 📊` : '';
        return `🌊 YEW! ${spot.toUpperCase()} IS ${t.condition?.toUpperCase()}! ${formatHeight(t.minHeight || 0, t.maxHeight || 0).toUpperCase()} WALLS @ ${t.minPeriod}S!${buoyInfo} ${(t.maxWindSpeed || 0) <= 10 ? 'CLEAN AS! ✨' : 'SEND IT! 🚀'}`;
    },

    // Emoji heavy with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` 📡 Buoy: [Buoy Height] [Water Temp]` : '';
        return `${t.emoji || '🏄'} ${spot} alert! ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} 🌊 ${t.minPeriod}s period ⏱️ Wind: ${(t.maxWindSpeed || 0) <= 8 ? '😎 offshore' : '💨 manageable'}${buoyInfo} | ${t.condition === 'epic' ? '🔥🔥🔥' : '👍'}`;
    },

    // Urgent style with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` Buoy ${buoyId}: [Buoy Height] @ [Buoy Period]!` : '';
        return `⚡ SWELL ALERT: ${spot} just lit up! ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} @ ${t.minPeriod}s from the ${degreesToCardinal(t.minSwellDirection || 0)}.${buoyInfo} ${t.condition === 'epic' ? 'THIS IS IT!' : 'Looking solid!'} 🏄‍♂️`;
    },

    // Party vibes with buoy
    (t, spot, buoyId) => {
        const buoyInfo = buoyId ? ` 🌡️ Water's [Water Temp]!` : '';
        return `🎉 It's happening at ${spot}! ${formatHeight(t.minHeight || 0, t.maxHeight || 0)} of pure ${t.condition} vibes! ${t.minPeriod}s+ periods, ${(t.maxWindSpeed || 0) <= 10 ? 'butter smooth 🧈' : 'bit of texture'}.${buoyInfo} Paddle out! 🤙`;
    },
];

// Get a consistent template based on trigger name (so same trigger = same template)
const getTemplateIndex = (triggerName: string, arrayLength: number): number => {
    let hash = 0;
    for (let i = 0; i < triggerName.length; i++) {
        hash = ((hash << 5) - hash) + triggerName.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash) % arrayLength;
};

// Generate template from trigger data
const generateLocalTemplate = (t: Partial<TriggerTier>, spotName: string, buoyId?: string): string => {
    const index = getTemplateIndex(t.name || 'default', LOCAL_TEMPLATES.length);
    return LOCAL_TEMPLATES[index](t, spotName, buoyId);
};

const generateHypeTemplate = (t: Partial<TriggerTier>, spotName: string, buoyId?: string): string => {
    const index = getTemplateIndex(t.name || 'default', HYPE_TEMPLATES.length);
    return HYPE_TEMPLATES[index](t, spotName, buoyId);
};

const CUSTOM_FIELDS = [
    { id: "Icon", label: "Icon", required: false },
    { id: "Trigger Name", label: "Trigger Name", required: false },
    { id: "Spot Name", label: "Spot Name", required: true },
    { id: "Condition", label: "Condition", required: false },
    { id: "Height", label: "Wave Height", required: false },
    { id: "Period", label: "Wave Period", required: false },
    { id: "Direction", label: "Swell Direction", required: false },
    { id: "Wind Speed", label: "Wind Speed", required: false },
    { id: "Wind Direction", label: "Wind Direction", required: false },
    { id: "Tide Height", label: "Tide Height", required: false },
    { id: "Tide Direction", label: "Tide Direction", required: false },
    { id: "Buoy ID", label: "Buoy Station", required: false },
    { id: "Buoy Height", label: "Buoy Wave Height", required: false },
    { id: "Buoy Period", label: "Buoy Period", required: false },
    { id: "Water Temp", label: "Water Temp", required: false },
];

// For custom templates, replace placeholders with actual trigger data
const getCustomPreviewMessage = (template: string, t: Partial<TriggerTier>, spotName: string, buoyId?: string): string => {
    return template
        .replace("[Icon]", t.emoji || "🏄")
        .replace("[Trigger Name]", t.name || "Alert")
        .replace("[Spot Name]", spotName)
        .replace("[Condition]", t.condition || "good")
        .replace("[Height]", formatHeight(t.minHeight || 0, t.maxHeight || 0).replace('ft', ''))
        .replace("[Period]", `${t.minPeriod || 0}`)
        .replace("[Direction]", degreesToCardinal(t.minSwellDirection || 0))
        .replace("[Wind Speed]", `${t.maxWindSpeed || 0}`)
        .replace("[Wind Direction]", (t.maxWindSpeed || 0) <= 10 ? "OFF" : degreesToCardinal(t.minWindDirection || 0))
        .replace("[Tide Height]", `${((t.minTideHeight || 0) + (t.maxTideHeight || 0)) / 2}ft`)
        .replace("[Tide Direction]", t.tideType === 'any' ? 'Any' : (t.tideType || 'Any'))
        // Buoy data placeholders - these show example values in preview
        .replace("[Buoy ID]", buoyId || "N/A")
        .replace("[Buoy Height]", "3.2ft")
        .replace("[Buoy Period]", "11s")
        .replace("[Water Temp]", "68°F");
};

// Build template string from enabled fields
const buildTemplateFromFields = (fields: { id: string; enabled: boolean }[]) => {
    return fields
        .filter(f => f.enabled)
        .map(f => {
            switch (f.id) {
                case "Icon": return "[Icon]";
                case "Trigger Name": return "[Trigger Name]";
                case "Spot Name": return "[Spot Name]";
                case "Condition": return "[Condition]";
                case "Height": return "[Height]ft";
                case "Period": return "[Period]s";
                case "Direction": return "[Direction]";
                case "Wind Speed": return "Wind [Wind Speed]mph";
                case "Wind Direction": return "[Wind Direction]";
                case "Tide Height": return "Tide [Tide Height]";
                case "Tide Direction": return "([Tide Direction])";
                case "Buoy ID": return "Buoy: [Buoy ID]";
                case "Buoy Height": return "[Buoy Height]";
                case "Buoy Period": return "[Buoy Period]";
                case "Water Temp": return "[Water Temp]";
                default: return "";
            }
        })
        .filter(Boolean)
        .join(" ");
};

// Draggable field component with proper touch handling
interface DraggableFieldProps {
    field: { id: string; enabled: boolean };
    fieldConfig: { id: string; label: string; required: boolean };
    onRemove: (id: string) => void;
}

function DraggableField({ field, fieldConfig, onRemove }: DraggableFieldProps) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={field}
            dragListener={false}
            dragControls={controls}
            className="flex items-center gap-2 bg-card border border-border rounded-lg p-2 shadow-sm select-none"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                zIndex: 50
            }}
        >
            {/* Drag Handle - larger touch target */}
            <div
                className="p-2 -m-1 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => controls.start(e)}
            >
                <HamburgerMenu weight="Bold" size={16} className="text-muted-foreground" />
            </div>

            <span className="flex-1 text-sm font-medium">{fieldConfig.label}</span>

            {/* Remove button - only if not required */}
            {!fieldConfig.required && (
                <button
                    onClick={() => onRemove(field.id)}
                    className="p-2 -m-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                    type="button"
                >
                    <CloseCircle weight="Bold" size={16} />
                </button>
            )}
        </Reorder.Item>
    );
}

interface TriggerFormProps {
    initialData?: TriggerTier;
    spotId: string;
    spot?: SurfSpot; // Optional spot object for defaulting logic
    lockedCondition?: 'epic' | 'good' | 'fair';
    autofillData?: Partial<TriggerTier>;
    onSubmit: (trigger: TriggerTier) => void;
    className?: string;
}

export function TriggerForm({
    initialData,
    spotId,
    spot,
    onSubmit,
    lockedCondition,
    autofillData,
    className = "",
}: TriggerFormProps) {
    // Calculate defaults (only used on first render if no initialData)
    const [defaultMinWind, defaultMaxWind] = spot
        ? getOffshoreWindow(spot.region, spot.country, spot.lat)
        : [290, 20];

    // Calculate default swell window
    const [defaultMinSwell, defaultMaxSwell] = spot
        ? getSwellWindow(spot.region, spot.country, spot.lat)
        : [0, 360];

    const [trigger, setTrigger] = useState<Partial<TriggerTier>>({
        name: "",
        emoji: "🌊",
        condition: lockedCondition || "good", // Use locked condition if provided
        minHeight: 2,
        maxHeight: 5,
        minPeriod: 6,
        maxPeriod: 12,
        minWindSpeed: 0,
        maxWindSpeed: 10,
        minWindDirection: defaultMinWind,
        maxWindDirection: defaultMaxWind,
        minSwellDirection: defaultMinSwell,
        maxSwellDirection: defaultMaxSwell,
        tideType: "any",
        minTideHeight: -2,
        maxTideHeight: 6,
        messageTemplate: "Surf's up at [Spot Name]! [Height]ft @ [Period]s ([Direction]). Wind is [Wind Speed]mph [Wind Direction].",
        spotId,
        ...initialData,
        ...autofillData, // Apply autofill data (e.g. from existing sibling trigger)
    });

    // Ensure condition is locked if prop is provided, even if initialData says otherwise (though usually they aligned)
    // AND Ensure we respect specific overrides
    useEffect(() => {
        if (lockedCondition) {
            setTrigger(prev => ({ ...prev, condition: lockedCondition }));
        }
    }, [lockedCondition]);

    const [notificationStyle, setNotificationStyle] = useState<"local" | "hype" | "custom">(
        initialData?.notificationStyle || "local"
    );

    // Initialize custom fields with requested defaults (with deduplication)
    const [customFieldState, setCustomFieldState] = useState(() => {
        const defaults = ["Icon", "Spot Name", "Condition", "Height", "Period", "Direction"];
        const seen = new Set<string>();

        const fields = CUSTOM_FIELDS
            .filter(f => {
                if (seen.has(f.id)) return false;
                seen.add(f.id);
                return true;
            })
            .map(f => ({
                id: f.id,
                enabled: defaults.includes(f.id)
            }));

        // Sort: enabled items first (in default order), then disabled
        const enabledItems = fields
            .filter(f => f.enabled)
            .sort((a, b) => defaults.indexOf(a.id) - defaults.indexOf(b.id));
        const disabledItems = fields.filter(f => !f.enabled);

        return [...enabledItems, ...disabledItems];
    });

    // Reset when initialData changes (for switching between add/edit)
    useEffect(() => {
        if (initialData) {
            setTrigger({
                ...initialData,
                // Ensure defaults for optional fields if they are missing/null
                minWindSpeed: initialData.minWindSpeed ?? 0,
                minWindDirection: initialData.minWindDirection ?? defaultMinWind, // Use calculated default as fallback
                maxWindDirection: initialData.maxWindDirection ?? defaultMaxWind,
                minSwellDirection: initialData.minSwellDirection ?? defaultMinSwell,
                maxSwellDirection: initialData.maxSwellDirection ?? defaultMaxSwell,
                tideType: initialData.tideType ?? "any",
                minTideHeight: initialData.minTideHeight ?? -2,
                maxTideHeight: initialData.maxTideHeight ?? 6,
                messageTemplate: initialData.messageTemplate || "Surf's up at [Spot Name]! [Height]ft @ [Period]s ([Direction]). Wind is [Wind Speed]mph [Wind Direction]."
            });
        } else {
            // New Trigger Mode
            // Logic: 
            // 1. Start with defaults
            // 2. Apply autofillData if present
            // 3. Enforce lockedCondition

            setTrigger(prev => ({
                ...prev,
                minWindDirection: defaultMinWind,
                maxWindDirection: defaultMaxWind,
                minSwellDirection: defaultMinSwell,
                maxSwellDirection: defaultMaxSwell,
                ...autofillData, // Apply autofill overrides (directions, heights etc)
                condition: lockedCondition || prev.condition || "good" // Enforce lock
            }));
        }
    }, [initialData, spot, defaultMinWind, defaultMaxWind, defaultMinSwell, defaultMaxSwell, autofillData, lockedCondition]);

    const handleSubmit = () => {
        if (!trigger.name?.trim()) return;

        // Get the spot name for template generation
        const currentSpotName = spot?.name || "Your Spot";

        // Generate the appropriate template based on style
        // Include buoy ID if spot has one attached
        const buoyId = spot?.buoyId;
        let finalTemplate = trigger.messageTemplate || "";
        if (notificationStyle === 'local') {
            finalTemplate = generateLocalTemplate(trigger, currentSpotName, buoyId);
        } else if (notificationStyle === 'hype') {
            finalTemplate = generateHypeTemplate(trigger, currentSpotName, buoyId);
        }
        // For 'custom', use the already-set messageTemplate

        const newTrigger: TriggerTier = {
            id: trigger.id || Date.now().toString(),
            name: trigger.name,
            emoji: trigger.emoji || "🌊",
            condition: trigger.condition as "fair" | "good" | "epic",
            minHeight: trigger.minHeight || 0,
            maxHeight: trigger.maxHeight || 15,
            minPeriod: trigger.minPeriod || 0,
            maxPeriod: trigger.maxPeriod || 20,
            minWindSpeed: trigger.minWindSpeed || 0,
            maxWindSpeed: trigger.maxWindSpeed || 20,
            minWindDirection: trigger.minWindDirection ?? 0,
            maxWindDirection: trigger.maxWindDirection ?? 360,
            minSwellDirection: trigger.minSwellDirection ?? 0,
            maxSwellDirection: trigger.maxSwellDirection ?? 360,
            tideType: (trigger.tideType as "rising" | "falling" | "any") || "any",
            minTideHeight: trigger.minTideHeight ?? -2,
            maxTideHeight: trigger.maxTideHeight ?? 6,
            messageTemplate: finalTemplate,
            notificationStyle,
            spotId,
        };

        onSubmit(newTrigger);
    };

    // Memoized enabled/disabled field lists with deduplication safety
    const enabledFields = useMemo(() => {
        const seen = new Set<string>();
        return customFieldState.filter(f => {
            if (seen.has(f.id)) return false;
            seen.add(f.id);
            return f.enabled;
        });
    }, [customFieldState]);

    const disabledFields = useMemo(() => {
        const seen = new Set<string>();
        return customFieldState.filter(f => {
            if (seen.has(f.id)) return false;
            seen.add(f.id);
            return !f.enabled;
        });
    }, [customFieldState]);

    // Sync template after field state changes (outside of setState)
    useEffect(() => {
        if (notificationStyle === 'custom') {
            const newTemplate = buildTemplateFromFields(customFieldState);
            setTrigger(prev => ({ ...prev, messageTemplate: newTemplate }));
        }
    }, [customFieldState, notificationStyle]);

    // Get the current spot name for templates
    const spotName = spot?.name || "Your Spot";

    // Optimized handlers - no nested setState
    const handleStyleChange = useCallback((style: "local" | "hype" | "custom") => {
        setNotificationStyle(style);
        // Local and hype templates are generated dynamically based on trigger data
        // so we don't set a static template - we'll compute it in the preview
    }, []);

    const addField = useCallback((id: string) => {
        setCustomFieldState(prev => {
            // Check for duplicates first
            const existing = prev.filter(f => f.id === id);
            if (existing.length === 0) return prev;

            const newFields = prev.map(f =>
                f.id === id ? { ...f, enabled: true } : f
            );

            // Move newly enabled item to end of enabled list
            const enabledItems = newFields.filter(f => f.enabled);
            const disabledItems = newFields.filter(f => !f.enabled);

            return [...enabledItems, ...disabledItems];
        });
    }, []);

    const removeField = useCallback((id: string) => {
        const fieldConfig = CUSTOM_FIELDS.find(f => f.id === id);
        if (fieldConfig?.required) return;

        setCustomFieldState(prev =>
            prev.map(f => f.id === id ? { ...f, enabled: false } : f)
        );
    }, []);

    const handleReorder = useCallback((newEnabledOrder: { id: string; enabled: boolean }[]) => {
        setCustomFieldState(prev => {
            const disabledItems = prev.filter(f => !f.enabled);
            // Ensure no duplicates in merge
            const enabledIds = new Set(newEnabledOrder.map(f => f.id));
            const filteredDisabled = disabledItems.filter(f => !enabledIds.has(f.id));
            return [...newEnabledOrder, ...filteredDisabled];
        });
    }, []);

    return (
        <div className={`flex flex-col h-full bg-card ${className}`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">
                {/* Basic Info */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                        Basic Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Trigger Name</label>
                            <Input
                                value={trigger.name}
                                onChange={(e) => setTrigger({ ...trigger, name: e.target.value })}
                                placeholder="e.g. Dawn Patrol"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Icon</label>
                            <Select
                                options={emojiOptions}
                                value={trigger.emoji}
                                onChange={(v) => setTrigger({ ...trigger, emoji: v })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Condition</label>
                            <Select
                                options={conditionOptions}
                                value={trigger.condition}
                                onChange={(v) => setTrigger({ ...trigger, condition: v as "fair" | "good" | "epic" })}
                                disabled={!!lockedCondition}
                            />
                        </div>
                    </div>
                </section>

                <div className="h-px bg-border/50" />

                {/* Wave Conditions */}
                <section className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
                        Wave Criteria
                    </h3>

                    {/* Height */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-medium">Wave Height</label>
                            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                {formatRange(trigger.minHeight || 0, trigger.maxHeight || 0, 15, 'ft')}
                            </span>
                        </div>
                        <div className="px-2">
                            <DualSlider
                                min={0} max={15} step={0.5}
                                value={[trigger.minHeight || 0, trigger.maxHeight || 10]}
                                onValueChange={([min, max]) => setTrigger({ ...trigger, minHeight: min, maxHeight: max })}
                            />
                        </div>
                    </div>

                    {/* Period */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-medium">Wave Period</label>
                            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                {formatRange(trigger.minPeriod || 0, trigger.maxPeriod || 0, 20, 's')}
                            </span>
                        </div>
                        <div className="px-2">
                            <DualSlider
                                min={0} max={20} step={1}
                                value={[trigger.minPeriod || 0, trigger.maxPeriod || 20]}
                                onValueChange={([min, max]) => setTrigger({ ...trigger, minPeriod: min, maxPeriod: max })}
                            />
                        </div>
                    </div>

                    {/* Swell Direction - NEW UI */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-medium">Swell Direction</label>
                            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                {trigger.minSwellDirection}° - {trigger.maxSwellDirection}°
                            </span>
                        </div>
                        <div className="flex justify-center py-4 bg-muted/20 rounded-lg p-2">
                            <DirectionSelector
                                min={trigger.minSwellDirection || 0}
                                max={trigger.maxSwellDirection || 360}
                                onChange={(min, max) => setTrigger({
                                    ...trigger,
                                    minSwellDirection: min,
                                    maxSwellDirection: max
                                })}
                            />
                        </div>
                    </div>
                </section>

                <div className="h-px bg-border/50" />

                {/* Wind & Tide */}
                <section className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">3</span>
                        Wind & Tide
                    </h3>

                    {/* Wind Speed */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-medium">Wind Speed</label>
                            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                {trigger.minWindSpeed} - {trigger.maxWindSpeed} mph
                            </span>
                        </div>
                        <div className="px-2">
                            <DualSlider
                                min={0} max={20} step={1}
                                value={[trigger.minWindSpeed || 0, trigger.maxWindSpeed || 20]}
                                onValueChange={([min, max]) => setTrigger({ ...trigger, minWindSpeed: min, maxWindSpeed: max })}
                            />
                        </div>
                    </div>

                    {/* Wind Direction - NEW UI */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-medium">Wind Direction</label>
                            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                {trigger.minWindDirection}° - {trigger.maxWindDirection}°
                            </span>
                        </div>
                        <div className="flex justify-center py-4 bg-muted/20 rounded-lg p-2">
                            <DirectionSelector
                                min={trigger.minWindDirection || 0}
                                max={trigger.maxWindDirection || 360}
                                onChange={(min, max) => setTrigger({
                                    ...trigger,
                                    minWindDirection: min,
                                    maxWindDirection: max
                                })}
                            />
                        </div>
                    </div>

                    {/* Tide State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Tide State</label>
                            <Select
                                options={tideOptions}
                                value={trigger.tideType as string}
                                onChange={(v) => setTrigger({ ...trigger, tideType: v as "rising" | "falling" | "any" })}
                            />
                        </div>
                        {/* Tide Height */}
                        <div>
                            <div className="flex justify-between items-baseline mb-1.5">
                                <label className="text-sm font-medium">Tide Height</label>
                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {getTideLabel(trigger.minTideHeight ?? -2) === getTideLabel(trigger.maxTideHeight ?? 6)
                                        ? getTideLabel(trigger.minTideHeight ?? -2)
                                        : `${getTideLabel(trigger.minTideHeight ?? -2)} - ${getTideLabel(trigger.maxTideHeight ?? 6)}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground w-12 text-right font-mono tabular-nums">{(trigger.minTideHeight ?? -2).toFixed(1)}ft</span>
                                <div className="flex-1 px-2">
                                    <DualSlider
                                        min={-3} max={8} step={0.1}
                                        value={[trigger.minTideHeight || -2, trigger.maxTideHeight || 6]}
                                        onValueChange={([min, max]) => setTrigger({ ...trigger, minTideHeight: min, maxTideHeight: max })}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground w-12 font-mono tabular-nums">{(trigger.maxTideHeight ?? 6).toFixed(1)}ft</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-border/50" />

                {/* Personality & Message */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">4</span>
                            Notification Message
                        </h3>
                        <div className="group relative">
                            <QuestionCircle weight="Bold" size={16} className="text-muted-foreground cursor-help" />
                            <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg hidden group-hover:block z-50 border">
                                Customize the text message you'll receive when this trigger fires.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Style Selector with Tooltips */}
                        <div className="flex bg-muted p-1 rounded-lg">
                            {([
                                { id: "local", label: "Local", tooltip: "Chill, no-nonsense updates like a buddy texting you the morning report. Straight to the point." },
                                { id: "hype", label: "Hype", tooltip: "FIRED UP energy for when it's going off! All the stoke, emojis, and \"drop everything\" vibes." },
                                { id: "custom", label: "Custom", tooltip: "Build your own message with drag-and-drop fields." }
                            ] as const).map((style) => (
                                <div key={style.id} className="flex-1 relative group">
                                    <button
                                        onClick={() => handleStyleChange(style.id)}
                                        className={`w-full text-sm font-medium py-1.5 px-3 rounded-md transition-all ${notificationStyle === style.id
                                            ? "bg-background shadow text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {style.label}
                                    </button>
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg hidden group-hover:block z-50 border pointer-events-none">
                                        {style.tooltip}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Preview / Editor Area */}
                        <div className="bg-muted/30 border rounded-lg overflow-hidden">
                            {/* Header / Preview Label */}
                            <div className="px-4 py-2 bg-muted/50 border-b">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {notificationStyle === 'custom' ? 'Preview' : 'Example Preview'}
                                </span>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Message Preview */}
                                <div className="bg-background p-4 rounded-lg border border-border/50 text-sm leading-relaxed relative shadow-sm">
                                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-primary/50 rounded-l" />
                                    {notificationStyle === 'local' && generateLocalTemplate(trigger, spotName, spot?.buoyId)}
                                    {notificationStyle === 'hype' && generateHypeTemplate(trigger, spotName, spot?.buoyId)}
                                    {notificationStyle === 'custom' && getCustomPreviewMessage(trigger.messageTemplate || "", trigger, spotName, spot?.buoyId)}
                                </div>

                                {/* Custom Builder - Vertical Drag & Drop */}
                                {notificationStyle === 'custom' && (
                                    <div className="space-y-4 mt-4">
                                        {/* Active Fields - Vertical Stack */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Message Fields
                                                </label>
                                                <span className="text-xs text-muted-foreground">
                                                    Drag handle to reorder
                                                </span>
                                            </div>

                                            <div className="bg-muted/20 rounded-xl p-2 min-h-[60px]">
                                                <Reorder.Group
                                                    axis="y"
                                                    values={enabledFields}
                                                    onReorder={handleReorder}
                                                    className="space-y-2"
                                                    layoutScroll
                                                >
                                                    <AnimatePresence mode="popLayout">
                                                        {enabledFields.map((field) => {
                                                            const fieldConfig = CUSTOM_FIELDS.find(f => f.id === field.id);
                                                            if (!fieldConfig) return null;
                                                            return (
                                                                <DraggableField
                                                                    key={field.id}
                                                                    field={field}
                                                                    fieldConfig={fieldConfig}
                                                                    onRemove={removeField}
                                                                />
                                                            );
                                                        })}
                                                    </AnimatePresence>
                                                </Reorder.Group>

                                                {enabledFields.length === 0 && (
                                                    <div className="text-center py-6 text-sm text-muted-foreground">
                                                        Add fields from below to build your message
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Available Fields */}
                                        {disabledFields.length > 0 && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Add More
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {disabledFields.map(field => {
                                                        const fieldConfig = CUSTOM_FIELDS.find(f => f.id === field.id)!;
                                                        return (
                                                            <button
                                                                key={field.id}
                                                                onClick={() => addField(field.id)}
                                                                type="button"
                                                                className="h-10 px-3 rounded-lg border border-dashed border-muted-foreground/30 text-sm hover:bg-muted/50 active:scale-95 transition-all flex items-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                                                            >
                                                                <AddCircle weight="Bold" size={16} />
                                                                {fieldConfig.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {disabledFields.length === 0 && (
                                            <p className="text-xs text-center text-muted-foreground py-2">
                                                All fields added to message
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border mt-auto bg-card space-y-4">
                {/* Summary */}
                <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground leading-relaxed">
                    <Bolt weight="Bold" size={14} className="inline-block mr-1.5 text-primary mb-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: generateTriggerSummary(trigger) }} />
                </div>

                <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!trigger.name?.trim()}
                    size="lg"
                >
                    <Bolt weight="Bold" size={16} className="mr-2" />
                    {initialData ? "Save Changes" : "Create Trigger"}
                </Button>
            </div>
        </div>
    );
}
