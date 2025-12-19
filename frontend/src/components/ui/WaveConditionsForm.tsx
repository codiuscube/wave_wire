/**
 * WaveConditionsForm - Reusable form for editing wave/wind/tide conditions.
 * Used by LocalsKnowledgeForm to define optimal conditions.
 */

import { useState, useEffect } from "react";
import { AltArrowDown } from "@solar-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { DualSlider } from "./DualSlider";
import { DirectionSelector } from "./DirectionSelector";
import { Select } from "./Select";
import { TideStateSelector, type TideState } from "./TideStateSelector";
import type { SpotConditionTier } from "../../types";

interface WaveConditionsFormProps {
  value: SpotConditionTier;
  onChange: (tier: SpotConditionTier) => void;
  className?: string;
}

// Helper to format ranges with "15+" style logic
const formatRange = (min: number, max: number, absMax: number, unit: string) => {
  const minStr = min >= absMax ? `${absMax}+` : min.toString();
  const maxStr = max >= absMax ? `${absMax}+` : max.toString();
  return `${minStr}${unit} - ${maxStr}${unit}`;
};

// Convert degrees to cardinal direction
function degreesToCardinal(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

// Format direction range
function formatDirectionRange(min: number, max: number): string {
  if (min === 0 && max === 360) {
    return 'All Directions';
  }
  const start = degreesToCardinal(min);
  const end = degreesToCardinal(max);
  if (start === end) {
    return start;
  }
  return `${start} - ${end}`;
}

const tideDirectionOptions = [
  { value: "any", label: "Any" },
  { value: "rising", label: "Rising" },
  { value: "falling", label: "Falling" },
];

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  description?: string;
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  description,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isExpanded
          ? "bg-card border-border"
          : "bg-card border-border/50 hover:border-border"
      }`}
    >
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors ${
          isExpanded ? "bg-muted/30" : ""
        }`}
        onClick={() => onToggle(!isExpanded)}
      >
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{title}</span>
          {description && (
            <span className="text-sm text-muted-foreground">{description}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs uppercase tracking-wider font-semibold px-2 py-1 rounded-md transition-colors ${
              isExpanded
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isExpanded ? "Custom" : "Any"}
          </span>
          <AltArrowDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${
              !isExpanded ? "rotate-[-90deg]" : ""
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-border/50">
              <div className="pt-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to check if wind has custom values
function hasWindValues(v: SpotConditionTier): boolean {
  return !!(
    v.maxWindSpeed !== undefined ||
    v.minWindDirection !== undefined ||
    v.maxWindDirection !== undefined
  );
}

// Helper to check if tide has custom values
function hasTideValues(v: SpotConditionTier): boolean {
  return !!(
    v.optimalTideStates?.length ||
    (v.optimalTideDirection && v.optimalTideDirection !== "any")
  );
}

export function WaveConditionsForm({
  value,
  onChange,
  className = "",
}: WaveConditionsFormProps) {
  // Expanded states for collapsible sections
  const [windExpanded, setWindExpanded] = useState(() => hasWindValues(value));
  const [tideExpanded, setTideExpanded] = useState(() => hasTideValues(value));

  // Sync expanded states when value changes (e.g., data loads from DB)
  useEffect(() => {
    if (hasWindValues(value)) {
      setWindExpanded(true);
    }
  }, [value.maxWindSpeed, value.minWindDirection, value.maxWindDirection]);

  useEffect(() => {
    if (hasTideValues(value)) {
      setTideExpanded(true);
    }
  }, [value.optimalTideStates, value.optimalTideDirection]);

  // Helper to update value
  const updateValue = (updates: Partial<SpotConditionTier>) => {
    onChange({ ...value, ...updates });
  };

  const toggleWind = (expanded: boolean) => {
    setWindExpanded(expanded);
    if (!expanded) {
      updateValue({
        maxWindSpeed: undefined,
        minWindDirection: undefined,
        maxWindDirection: undefined,
      });
    }
  };

  const toggleTide = (expanded: boolean) => {
    setTideExpanded(expanded);
    if (!expanded) {
      updateValue({
        optimalTideStates: undefined,
        optimalTideDirection: undefined,
      });
    }
  };

  // Get current values with defaults
  const swellMin = value.minSwellDirection ?? 0;
  const swellMax = value.maxSwellDirection ?? 360;
  const windMin = value.minWindDirection ?? 0;
  const windMax = value.maxWindDirection ?? 360;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wave Height */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <label className="text-sm font-medium">Wave Height</label>
          <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {formatRange(value.minHeight ?? 0, value.maxHeight ?? 15, 15, "ft")}
          </span>
        </div>
        <div className="px-2">
          <DualSlider
            min={0}
            max={15}
            step={0.5}
            value={[value.minHeight ?? 0, value.maxHeight ?? 15]}
            onValueChange={([min, max]) =>
              updateValue({ minHeight: min, maxHeight: max })
            }
          />
        </div>
      </div>

      {/* Wave Period */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <label className="text-sm font-medium">Wave Period</label>
          <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {formatRange(value.minPeriod ?? 0, value.maxPeriod ?? 20, 20, "s")}
          </span>
        </div>
        <div className="px-2">
          <DualSlider
            min={0}
            max={20}
            step={1}
            value={[value.minPeriod ?? 0, value.maxPeriod ?? 20]}
            onValueChange={([min, max]) =>
              updateValue({ minPeriod: min, maxPeriod: max })
            }
          />
        </div>
      </div>

      {/* Swell Direction */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <label className="text-sm font-medium">Swell Direction</label>
          <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {formatDirectionRange(swellMin, swellMax)}
          </span>
        </div>
        <div className="flex justify-center py-4 bg-muted/20 rounded-lg p-2">
          <DirectionSelector
            min={swellMin}
            max={swellMax}
            onChange={(min, max) =>
              updateValue({ minSwellDirection: min, maxSwellDirection: max })
            }
          />
        </div>
      </div>

      {/* Wind Section - Collapsible */}
      <CollapsibleSection
        title="Wind"
        isExpanded={windExpanded}
        onToggle={toggleWind}
        description={
          !windExpanded
            ? "Any Wind"
            : `Max ${value.maxWindSpeed ?? 20}mph ${formatDirectionRange(windMin, windMax)}`
        }
      >
        <div className="space-y-6">
          {/* Max Wind Speed */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium">Max Wind Speed</label>
              <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                {value.maxWindSpeed ?? 20} mph
              </span>
            </div>
            <div className="px-2">
              <DualSlider
                min={0}
                max={20}
                step={1}
                value={[0, value.maxWindSpeed ?? 20]}
                onValueChange={([, max]) => updateValue({ maxWindSpeed: max })}
              />
            </div>
          </div>

          {/* Offshore Wind Direction */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium">Offshore Wind Direction</label>
              <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                {formatDirectionRange(windMin, windMax)}
              </span>
            </div>
            <div className="flex justify-center py-4 bg-muted/20 rounded-lg p-2">
              <DirectionSelector
                min={windMin}
                max={windMax}
                onChange={(min, max) =>
                  updateValue({ minWindDirection: min, maxWindDirection: max })
                }
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Tide Section - Collapsible */}
      <CollapsibleSection
        title="Tide"
        isExpanded={tideExpanded}
        onToggle={toggleTide}
        description={
          !tideExpanded
            ? "Any Tide"
            : `${value.optimalTideStates?.join(", ") || "Any"} tide${
                value.optimalTideDirection && value.optimalTideDirection !== "any"
                  ? ` (${value.optimalTideDirection})`
                  : ""
              }`
        }
      >
        <div className="space-y-4">
          {/* Tide States */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Optimal Tide Levels
            </label>
            <TideStateSelector
              value={(value.optimalTideStates as TideState[]) ?? []}
              onChange={(states) => updateValue({ optimalTideStates: states })}
            />
          </div>

          {/* Tide Direction */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Tide Direction
            </label>
            <Select
              options={tideDirectionOptions}
              value={value.optimalTideDirection ?? "any"}
              onChange={(v) =>
                updateValue({
                  optimalTideDirection: v as "rising" | "falling" | "any",
                })
              }
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
