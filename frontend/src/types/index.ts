export interface SurfSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  buoyId: string;
  timezone: string;
  region?: string;
  country?: string;
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
  tideType: 'rising' | 'falling' | 'any';
  minTideHeight: number;
  maxTideHeight: number;
  spotId: string;
  messageTemplate: string;
  notificationStyle?: 'local' | 'hype' | 'custom';
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
