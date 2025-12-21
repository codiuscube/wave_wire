/**
 * Trigger Condition Evaluator
 * Evaluates surf conditions against user-defined triggers
 */

import type { BuoyData, ForecastData, TideData, SpotConditions } from './dataFetcher.js';

export interface Trigger {
  id: string;
  userId: string;
  spotId: string;
  name: string;
  condition: 'fair' | 'good' | 'epic' | null;
  minHeight: number | null;
  maxHeight: number | null;
  minPeriod: number | null;
  maxPeriod: number | null;
  minSwellDirection: number | null;
  maxSwellDirection: number | null;
  minWindSpeed: number | null;
  maxWindSpeed: number | null;
  minWindDirection: number | null;
  maxWindDirection: number | null;
  tideType: 'rising' | 'falling' | 'any' | null;
  minTideHeight: number | null;
  maxTideHeight: number | null;
  notificationStyle: 'local' | 'hype' | 'custom' | null;
  messageTemplate: string | null;
  enabled: boolean;
}

export interface MatchResult {
  matches: boolean;
  matchType: 'live' | 'forecast';
  reason?: string;
  conditionData: ConditionData;
}

export interface ConditionData {
  waveHeight: number;
  wavePeriod: number;
  swellDirection: number;
  windSpeed: number;
  windDirection: string;
  tideHeight: number | null;
  tideDirection: string | null;
  spotName: string;
  buoyId: string | null;
}

/**
 * Check if a direction (in degrees) falls within a range.
 * Handles wraparound for ranges like 315-45 (NW to NE through North).
 */
function isDirectionInRange(degrees: number, min: number, max: number): boolean {
  // Normalize to 0-360
  degrees = ((degrees % 360) + 360) % 360;
  min = ((min % 360) + 360) % 360;
  max = ((max % 360) + 360) % 360;

  if (min <= max) {
    // Normal range (e.g., 90-180)
    return degrees >= min && degrees <= max;
  } else {
    // Wraparound range (e.g., 315-45 crosses 0/360)
    return degrees >= min || degrees <= max;
  }
}

/**
 * Evaluate a trigger against current conditions.
 * Uses FORECAST data for swell evaluation (primary source).
 * Buoy data is supplementary info only - not used for trigger matching.
 */
export function evaluateTrigger(
  trigger: Trigger,
  conditions: SpotConditions,
  spotName: string
): MatchResult {
  const { forecast, tide } = conditions;

  // Always use forecast for trigger evaluation
  // Buoy data is supplementary info (displayed in UI) but not for matching
  const matchType: 'live' | 'forecast' = 'forecast';

  // Get wave data from forecast
  let waveHeight: number;
  let wavePeriod: number;
  let swellDegrees: number;
  let windSpeed: number;
  let windDegrees: number;
  let windDirection: string;

  if (forecast) {
    waveHeight = forecast.waveHeight;
    wavePeriod = forecast.wavePeriod;
    swellDegrees = forecast.swellDegrees;
    windSpeed = forecast.windSpeed;
    windDegrees = forecast.windDegrees;
    windDirection = forecast.windDirection;
  } else {
    // No forecast data available
    return {
      matches: false,
      matchType: 'forecast',
      reason: 'No forecast data available',
      conditionData: createEmptyConditionData(spotName),
    };
  }

  const conditionData: ConditionData = {
    waveHeight,
    wavePeriod,
    swellDirection: swellDegrees,
    windSpeed,
    windDirection,
    tideHeight: tide?.currentHeight ?? null,
    tideDirection: tide?.currentDirection ?? null,
    spotName,
    buoyId: null,
  };

  // ===== EVALUATE CONDITIONS =====

  // Wave height check
  if (trigger.minHeight !== null && waveHeight < trigger.minHeight) {
    return {
      matches: false,
      matchType,
      reason: `Wave height ${waveHeight}ft < min ${trigger.minHeight}ft`,
      conditionData,
    };
  }
  if (trigger.maxHeight !== null && waveHeight > trigger.maxHeight) {
    return {
      matches: false,
      matchType,
      reason: `Wave height ${waveHeight}ft > max ${trigger.maxHeight}ft`,
      conditionData,
    };
  }

  // Wave period check
  if (trigger.minPeriod !== null && wavePeriod < trigger.minPeriod) {
    return {
      matches: false,
      matchType,
      reason: `Wave period ${wavePeriod}s < min ${trigger.minPeriod}s`,
      conditionData,
    };
  }
  if (trigger.maxPeriod !== null && wavePeriod > trigger.maxPeriod) {
    return {
      matches: false,
      matchType,
      reason: `Wave period ${wavePeriod}s > max ${trigger.maxPeriod}s`,
      conditionData,
    };
  }

  // Swell direction check
  if (trigger.minSwellDirection !== null && trigger.maxSwellDirection !== null) {
    if (!isDirectionInRange(swellDegrees, trigger.minSwellDirection, trigger.maxSwellDirection)) {
      return {
        matches: false,
        matchType,
        reason: `Swell direction ${swellDegrees}° not in range ${trigger.minSwellDirection}-${trigger.maxSwellDirection}°`,
        conditionData,
      };
    }
  }

  // Wind speed check
  if (trigger.maxWindSpeed !== null && windSpeed > trigger.maxWindSpeed) {
    return {
      matches: false,
      matchType,
      reason: `Wind speed ${windSpeed}kts > max ${trigger.maxWindSpeed}kts`,
      conditionData,
    };
  }
  if (trigger.minWindSpeed !== null && windSpeed < trigger.minWindSpeed) {
    return {
      matches: false,
      matchType,
      reason: `Wind speed ${windSpeed}kts < min ${trigger.minWindSpeed}kts`,
      conditionData,
    };
  }

  // Wind direction check
  if (trigger.minWindDirection !== null && trigger.maxWindDirection !== null) {
    if (!isDirectionInRange(windDegrees, trigger.minWindDirection, trigger.maxWindDirection)) {
      return {
        matches: false,
        matchType,
        reason: `Wind direction ${windDegrees}° not in range ${trigger.minWindDirection}-${trigger.maxWindDirection}°`,
        conditionData,
      };
    }
  }

  // Tide checks
  if (tide) {
    // Tide type check
    if (trigger.tideType && trigger.tideType !== 'any') {
      if (tide.currentDirection !== trigger.tideType && tide.currentDirection !== 'slack') {
        return {
          matches: false,
          matchType,
          reason: `Tide is ${tide.currentDirection}, need ${trigger.tideType}`,
          conditionData,
        };
      }
    }

    // Tide height check
    if (trigger.minTideHeight !== null && tide.currentHeight < trigger.minTideHeight) {
      return {
        matches: false,
        matchType,
        reason: `Tide height ${tide.currentHeight}ft < min ${trigger.minTideHeight}ft`,
        conditionData,
      };
    }
    if (trigger.maxTideHeight !== null && tide.currentHeight > trigger.maxTideHeight) {
      return {
        matches: false,
        matchType,
        reason: `Tide height ${tide.currentHeight}ft > max ${trigger.maxTideHeight}ft`,
        conditionData,
      };
    }
  }

  // All conditions passed!
  return {
    matches: true,
    matchType,
    conditionData,
  };
}

function createEmptyConditionData(spotName: string): ConditionData {
  return {
    waveHeight: 0,
    wavePeriod: 0,
    swellDirection: 0,
    windSpeed: 0,
    windDirection: 'N/A',
    tideHeight: null,
    tideDirection: null,
    spotName,
    buoyId: null,
  };
}

/**
 * Convert database trigger row to Trigger interface
 */
export function mapDbTrigger(row: Record<string, unknown>): Trigger {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    spotId: row.spot_id as string,
    name: row.name as string,
    condition: row.condition as Trigger['condition'],
    minHeight: row.min_height as number | null,
    maxHeight: row.max_height as number | null,
    minPeriod: row.min_period as number | null,
    maxPeriod: row.max_period as number | null,
    minSwellDirection: row.min_swell_direction as number | null,
    maxSwellDirection: row.max_swell_direction as number | null,
    minWindSpeed: row.min_wind_speed as number | null,
    maxWindSpeed: row.max_wind_speed as number | null,
    minWindDirection: row.min_wind_direction as number | null,
    maxWindDirection: row.max_wind_direction as number | null,
    tideType: row.tide_type as Trigger['tideType'],
    minTideHeight: row.min_tide_height as number | null,
    maxTideHeight: row.max_tide_height as number | null,
    notificationStyle: row.notification_style as Trigger['notificationStyle'],
    messageTemplate: row.message_template as string | null,
    enabled: row.enabled !== false,
  };
}
