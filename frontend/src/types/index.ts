export interface SurfSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  buoyId: string;
  timezone: string;
  region?: string;
  country?: string;
  localsKnowledge?: SpotLocalsKnowledge;
}

export interface SpotConditionTier {
  minHeight?: number;
  maxHeight?: number;
  minPeriod?: number;
  maxPeriod?: number;
  minSwellDirection?: number; // 0-360 degrees
  maxSwellDirection?: number; // 0-360 degrees
  minWindDirection?: number; // 0-360 degrees (offshore)
  maxWindDirection?: number; // 0-360 degrees (offshore)
  maxWindSpeed?: number;
  optimalTideStates?: ('low' | 'mid' | 'high')[];
  optimalTideDirection?: 'rising' | 'falling' | 'any';
}

export interface SpotLocalsKnowledge {
  conditions?: SpotConditionTier;
  summary?: string;
  notes?: string;
}

// Wave model types - these must match Open-Meteo Marine API parameter values
// Verified from: https://open-meteo.com/en/docs/marine-weather-api
export type WaveModel =
  | 'best_match'
  | 'ncep_gfswave025'
  | 'ncep_gfswave016'
  | 'ecmwf_wam'
  | 'meteofrance_wave'
  | 'ewam'
  | 'gwam';

export const WAVE_MODEL_OPTIONS: { value: WaveModel; label: string; description: string }[] = [
  { value: 'best_match', label: 'Best Match (Recommended)', description: 'Automatically picks the best model for your spot\'s location' },
  { value: 'ncep_gfswave025', label: 'GFS Wave (US)', description: 'NOAA model. Best for US coasts, updates every 6 hours' },
  { value: 'ncep_gfswave016', label: 'GFS Wave High-Res (US)', description: 'Higher resolution NOAA model. Better coastal detail for US' },
  { value: 'ecmwf_wam', label: 'ECMWF WAM', description: 'European model with high accuracy. Excellent for Atlantic swells' },
  { value: 'meteofrance_wave', label: 'MeteoFrance Wave', description: 'French model, strong for European Atlantic and Mediterranean' },
  { value: 'ewam', label: 'DWD Europe', description: 'German regional model. Best for North Sea and Baltic spots' },
  { value: 'gwam', label: 'DWD Global', description: 'German global model. Good general coverage worldwide' },
];

/**
 * Returns wave models available for a given location.
 * Filters out regional models that don't have coverage for the coordinates.
 *
 * Coverage regions:
 * - best_match, ecmwf_wam, gwam: Global (always available)
 * - ncep_gfswave025/016: Americas & Pacific (lon < -30° or lon > 100°)
 * - meteofrance_wave: European Atlantic & Med (lat 20-75°, lon -40° to 45°)
 * - ewam: North Sea & Baltic (lat 45-70°, lon -15° to 35°)
 */
export function getWaveModelsForLocation(lat: number, lon: number): typeof WAVE_MODEL_OPTIONS {
  return WAVE_MODEL_OPTIONS.filter(option => {
    switch (option.value) {
      // Global models - always available
      case 'best_match':
      case 'ecmwf_wam':
      case 'gwam':
        return true;

      // NOAA GFS - Americas and Pacific
      case 'ncep_gfswave025':
      case 'ncep_gfswave016':
        // Western hemisphere (Americas) or Western Pacific
        return lon < -30 || lon > 100;

      // MeteoFrance - European Atlantic and Mediterranean
      case 'meteofrance_wave':
        return lat >= 20 && lat <= 75 && lon >= -40 && lon <= 45;

      // DWD EWAM - North Sea and Baltic (narrow regional)
      case 'ewam':
        return lat >= 45 && lat <= 70 && lon >= -15 && lon <= 35;

      default:
        return true;
    }
  });
}

export interface TriggerTier {
  id: string;
  name: string;
  emoji: string;
  condition: 'fair' | 'good' | 'epic';
  minHeight: number;
  maxHeight: number;
  minPeriod: number;
  maxPeriod: number;
  minWindSpeed: number;
  maxWindSpeed: number;
  minWindDirection: number; // 0-360
  maxWindDirection: number; // 0-360
  minSwellDirection: number; // 0-360
  maxSwellDirection: number; // 0-360
  // Optional secondary swell
  secondarySwellEnabled?: boolean;
  minSecondarySwellDirection?: number; // 0-360
  maxSecondarySwellDirection?: number; // 0-360
  minSecondarySwellHeight?: number;
  maxSecondarySwellHeight?: number;
  minSecondarySwellPeriod?: number;
  maxSecondarySwellPeriod?: number;
  tideType: 'rising' | 'falling' | 'any';
  minTideHeight: number;
  maxTideHeight: number;
  spotId: string;
  messageTemplate: string;
  notificationStyle?: 'local' | 'hype' | 'custom';
  // Wave model selection (defaults to 'best_match')
  waveModel?: WaveModel;
  // Buoy trigger fields (only applicable when spot has buoyId)
  buoyTriggerEnabled?: boolean;
  buoyMinHeight?: number;
  buoyMaxHeight?: number;
  buoyMinPeriod?: number;
  buoyMaxPeriod?: number;
  buoyTriggerMode?: 'or' | 'and';
}

export interface AlertSchedule {
  id: string;
  name: string;
  description: string;
  time: string;
  type: 'forecast' | 'realtime' | 'popup';
  enabled: boolean;
  days: string[];
}

export interface UserPreferences {
  spotId: string;
  phone: string;
  email: string;
  triggers: TriggerTier[];
  schedules: AlertSchedule[];
  aiPersonality: 'stoked_local' | 'chill_surfer' | 'data_nerd' | 'hype_beast';
  homeAddress?: string;
}

export interface BuoyData {
  timestamp: Date;
  height: number;
  period: number;
  direction: number;
  waterTemp: number;
}

export interface ForecastData {
  date: Date;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  windSpeed: number;
  windDirection: number;
  tide: 'low' | 'mid' | 'high';
}
