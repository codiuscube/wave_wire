export interface SurfSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  buoyId: string;
  timezone: string;
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
  windDirections: string[];
  maxWindSpeed: number;
  swellDirection: string[];
  spotId: string;
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
