import type { TriggerTier } from "../types";

export const getTideLabel = (height: number) => {
    if (height <= -1) return "Low";
    if (height >= 4) return "High";
    return "Med";
};

// Generate a natural language summary of the trigger
// Returns an HTML string ready for dangerouslySetInnerHTML
export const generateTriggerSummary = (t: Partial<TriggerTier>) => {
    const parts = [];
    const bold = (text: string | number) => `<span class="font-medium text-foreground">${text}</span>`;

    // Wave Config
    let wavePart = `${bold(`${t.minHeight}-${t.maxHeight}ft`)} @ ${bold(`${t.minPeriod}-${t.maxPeriod}s`)}`;
    if ((t.minSwellDirection !== undefined && t.maxSwellDirection !== undefined) && (t.minSwellDirection !== 0 || t.maxSwellDirection !== 360)) {
        wavePart += ` (${bold(`${t.minSwellDirection}°-${t.maxSwellDirection}°`)})`;
    }
    parts.push(wavePart);

    // Wind Config
    let windPart = `Wind: ${bold(`${t.minWindSpeed}-${t.maxWindSpeed}mph`)}`;
    if ((t.minWindDirection !== undefined && t.maxWindDirection !== undefined) && (t.minWindDirection !== 0 || t.maxWindDirection !== 360)) {
        windPart += ` (${bold(`${t.minWindDirection}°-${t.maxWindDirection}°`)})`;
    }
    parts.push(windPart);

    // Tide Config
    const formatTideRange = (minH: number, maxH: number) => {
        const minLabel = getTideLabel(minH);
        const maxLabel = getTideLabel(maxH);
        return minLabel === maxLabel ? minLabel : `${minLabel} to ${maxLabel}`;
    };

    if (t.tideType && t.tideType !== "any") {
        let tidePart = `Tide: ${bold(t.tideType)}`;
        // Add height context if restricted
        if ((t.minTideHeight !== undefined && t.minTideHeight > -3) || (t.maxTideHeight !== undefined && t.maxTideHeight < 8)) {
            tidePart += ` (${bold(formatTideRange(t.minTideHeight ?? -3, t.maxTideHeight ?? 8))})`;
        }
        parts.push(tidePart);
    } else if ((t.minTideHeight !== undefined && t.minTideHeight > -3) || (t.maxTideHeight !== undefined && t.maxTideHeight < 8)) {
        // Case where type is any, but height is restricted
        parts.push(`Tide: ${bold(formatTideRange(t.minTideHeight ?? -3, t.maxTideHeight ?? 8))}`);
    }

    return parts.join(" • ");
};
