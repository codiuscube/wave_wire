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
// Only includes models verified to work with the API
export type WaveModel =
  | 'best_match'
  | 'ecmwf_wam'
  | 'meteofrance_wave';

export const WAVE_MODEL_OPTIONS: { value: WaveModel; label: string; description: string }[] = [
  { value: 'best_match', label: 'Best Match (Recommended)', description: 'Automatically picks the best model for your spot\'s location' },
  { value: 'ecmwf_wam', label: 'ECMWF WAM', description: 'European model with high accuracy. Excellent for Atlantic swells' },
  { value: 'meteofrance_wave', label: 'MeteoFrance Wave', description: 'French model, strong for European Atlantic and Mediterranean' },
];

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
