/**
 * Mappers for converting between Supabase snake_case types and frontend camelCase types.
 * Used by hooks to provide a consistent interface to UI components.
 */

import type { Tables, TablesInsert, TablesUpdate } from '../types/supabase';

// =============================================================================
// Frontend Types (camelCase)
// =============================================================================

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  phoneVerified: boolean;
  homeAddress: string | null;
  subscriptionTier: 'free' | 'pro' | 'premium';
  isAdmin: boolean;
  onboardingCompleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminUserStats extends Profile {
  spotsCount: number;
  triggersCount: number;
  alertsSent: number;
  lastActivity: string | null;
}

export interface SurfSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
  countryGroup: 'USA' | 'Mexico' | 'Central America' | 'Canada';
  country: string | null;
  buoyId: string | null;
  buoyName: string | null;
  verified: boolean;
  source: 'official' | 'community' | 'user';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserSpot {
  id: string;
  userId: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  buoyId: string | null;
  icon: string | null;
  masterSpotId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Trigger {
  id: string;
  userId: string;
  spotId: string;
  name: string;
  emoji: string | null;
  condition: string | null;
  minHeight: number | null;
  maxHeight: number | null;
  minPeriod: number | null;
  maxPeriod: number | null;
  minWindSpeed: number | null;
  maxWindSpeed: number | null;
  minWindDirection: number | null;
  maxWindDirection: number | null;
  minSwellDirection: number | null;
  maxSwellDirection: number | null;
  tideType: 'rising' | 'falling' | 'any' | null;
  minTideHeight: number | null;
  maxTideHeight: number | null;
  messageTemplate: string | null;
  notificationStyle: 'local' | 'hype' | 'custom' | null;
  priority: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SentAlert {
  id: string;
  userId: string;
  spotId: string | null;
  triggerId: string | null;
  alertType: string | null;
  conditionMatched: string | null;
  messageContent: string | null;
  deliveryChannel: string | null;
  deliveryStatus: string | null;
  sentAt: string | null;
  createdAt: string | null;
}

export interface AlertSchedule {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: string;
  checkTime: string | null;
  activeDays: string[] | null;
  enabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserPreferences {
  id: string;
  userId: string;
  aiPersonality: string | null;
  includeEmoji: boolean;
  includeBuoyData: boolean;
  includeTraffic: boolean;
  updatedAt: string | null;
}

export interface AlertSettings {
  id: string;
  userId: string;
  windowMode: 'solar' | 'clock' | 'always';
  windowStartTime: string;
  windowEndTime: string;
  activeDays: string[];
  forecastAlertsEnabled: boolean;
  twoDayForecastEnabled: boolean;
  liveAlertsEnabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

// =============================================================================
// DB Row Types (for reference)
// =============================================================================

type DbProfile = Tables<'profiles'>;
type DbSurfSpot = Tables<'surf_spots'>;
type DbUserSpot = Tables<'user_spots'>;
type DbTrigger = Tables<'triggers'>;
type DbSentAlert = Tables<'sent_alerts'>;
type DbAlertSchedule = Tables<'alert_schedules'>;
type DbUserPreferences = Tables<'user_preferences'>;
type DbAlertSettings = Tables<'alert_settings'>;

// =============================================================================
// Mappers: DB -> Frontend
// =============================================================================

export function mapProfile(row: DbProfile): Profile {
  // Map database tier to frontend tier (unlimited -> premium, pro = Free Beta)
  const tierMap: Record<string, Profile['subscriptionTier']> = {
    free: 'free',
    pro: 'pro',        // 'pro' in DB = Free Beta tier
    premium: 'premium',
    unlimited: 'premium', // DB stores 'unlimited', frontend uses 'premium'
  };
  const tier = tierMap[row.subscription_tier?.toLowerCase() ?? 'free'] ?? 'free';

  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    phoneVerified: row.phone_verified ?? false,
    homeAddress: row.home_address,
    subscriptionTier: tier,
    isAdmin: row.is_admin ?? false,
    onboardingCompleted: row.onboarding_completed ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Database row type for admin_user_stats view
interface DbAdminUserStats {
  id: string;
  email: string | null;
  phone: string | null;
  phone_verified: boolean | null;
  home_address: string | null;
  subscription_tier: string | null;
  is_admin: boolean | null;
  onboarding_completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  spots_count: number;
  triggers_count: number;
  alerts_sent: number;
  last_activity: string | null;
}

export function mapAdminUserStats(row: DbAdminUserStats): AdminUserStats {
  const tierMap: Record<string, Profile['subscriptionTier']> = {
    free: 'free',
    pro: 'pro',
    premium: 'premium',
    unlimited: 'premium',
  };
  const tier = tierMap[row.subscription_tier ?? 'free'] ?? 'free';

  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    phoneVerified: row.phone_verified ?? false,
    homeAddress: row.home_address,
    subscriptionTier: tier,
    isAdmin: row.is_admin ?? false,
    onboardingCompleted: row.onboarding_completed ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    spotsCount: row.spots_count ?? 0,
    triggersCount: row.triggers_count ?? 0,
    alertsSent: row.alerts_sent ?? 0,
    lastActivity: row.last_activity,
  };
}

export function mapSurfSpot(row: DbSurfSpot): SurfSpot {
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lon: row.lon,
    region: row.region,
    countryGroup: row.country_group as SurfSpot['countryGroup'],
    country: row.country,
    buoyId: row.buoy_id,
    buoyName: row.buoy_name,
    verified: row.verified ?? false,
    source: (row.source as SurfSpot['source']) ?? 'official',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUserSpot(row: DbUserSpot): UserSpot {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    region: row.region,
    buoyId: row.buoy_id,
    icon: row.icon,
    masterSpotId: row.master_spot_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTrigger(row: DbTrigger): Trigger {
  return {
    id: row.id,
    userId: row.user_id,
    spotId: row.spot_id,
    name: row.name,
    emoji: row.emoji,
    condition: row.condition,
    minHeight: row.min_height,
    maxHeight: row.max_height,
    minPeriod: row.min_period,
    maxPeriod: row.max_period,
    minWindSpeed: row.min_wind_speed,
    maxWindSpeed: row.max_wind_speed,
    minWindDirection: row.min_wind_direction,
    maxWindDirection: row.max_wind_direction,
    minSwellDirection: row.min_swell_direction,
    maxSwellDirection: row.max_swell_direction,
    tideType: row.tide_type as any,
    minTideHeight: row.min_tide_height,
    maxTideHeight: row.max_tide_height,
    messageTemplate: row.message_template,
    notificationStyle: row.notification_style as any,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSentAlert(row: DbSentAlert): SentAlert {
  return {
    id: row.id,
    userId: row.user_id,
    spotId: row.spot_id,
    triggerId: row.trigger_id,
    alertType: row.alert_type,
    conditionMatched: row.condition_matched,
    messageContent: row.message_content,
    deliveryChannel: row.delivery_channel,
    deliveryStatus: row.delivery_status,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

export function mapAlertSchedule(row: DbAlertSchedule): AlertSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    type: row.type,
    checkTime: row.check_time,
    activeDays: row.active_days,
    enabled: row.enabled ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUserPreferences(row: DbUserPreferences): UserPreferences {
  return {
    id: row.id,
    userId: row.user_id,
    aiPersonality: row.ai_personality,
    includeEmoji: row.include_emoji ?? true,
    includeBuoyData: row.include_buoy_data ?? true,
    includeTraffic: row.include_traffic ?? false,
    updatedAt: row.updated_at,
  };
}

export function mapAlertSettings(row: DbAlertSettings): AlertSettings {
  return {
    id: row.id,
    userId: row.user_id,
    windowMode: row.window_mode ?? 'solar',
    windowStartTime: row.window_start_time ?? '06:00',
    windowEndTime: row.window_end_time ?? '22:00',
    activeDays: row.active_days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    forecastAlertsEnabled: row.forecast_alerts_enabled ?? false,
    twoDayForecastEnabled: row.two_day_forecast_enabled ?? false,
    liveAlertsEnabled: row.live_alerts_enabled ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Mappers: Frontend -> DB (for inserts/updates)
// =============================================================================

export function toDbProfileUpdate(
  profile: Partial<Omit<Profile, 'id' | 'isAdmin' | 'subscriptionTier' | 'createdAt' | 'updatedAt'>>
): TablesUpdate<'profiles'> {
  const update: TablesUpdate<'profiles'> = {};
  if (profile.email !== undefined) update.email = profile.email;
  if (profile.phone !== undefined) update.phone = profile.phone;
  if (profile.phoneVerified !== undefined) update.phone_verified = profile.phoneVerified;
  if (profile.homeAddress !== undefined) update.home_address = profile.homeAddress;
  if (profile.onboardingCompleted !== undefined) update.onboarding_completed = profile.onboardingCompleted;
  return update;
}

export function toDbUserSpotInsert(
  spot: Omit<UserSpot, 'id' | 'createdAt' | 'updatedAt'>
): TablesInsert<'user_spots'> {
  return {
    user_id: spot.userId,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    region: spot.region,
    buoy_id: spot.buoyId,
    icon: spot.icon,
    master_spot_id: spot.masterSpotId,
  };
}

export function toDbUserSpotUpdate(
  spot: Partial<Omit<UserSpot, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): TablesUpdate<'user_spots'> {
  const update: TablesUpdate<'user_spots'> = {};
  if (spot.name !== undefined) update.name = spot.name;
  if (spot.latitude !== undefined) update.latitude = spot.latitude;
  if (spot.longitude !== undefined) update.longitude = spot.longitude;
  if (spot.region !== undefined) update.region = spot.region;
  if (spot.buoyId !== undefined) update.buoy_id = spot.buoyId;
  if (spot.icon !== undefined) update.icon = spot.icon;
  if (spot.masterSpotId !== undefined) update.master_spot_id = spot.masterSpotId;
  return update;
}

export function toDbTriggerInsert(
  trigger: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'>
): TablesInsert<'triggers'> {
  return {
    user_id: trigger.userId,
    spot_id: trigger.spotId,
    name: trigger.name,
    emoji: trigger.emoji,
    condition: trigger.condition,
    min_height: trigger.minHeight,
    max_height: trigger.maxHeight,
    min_period: trigger.minPeriod,
    max_period: trigger.maxPeriod,
    min_wind_speed: trigger.minWindSpeed,
    max_wind_speed: trigger.maxWindSpeed,
    min_wind_direction: trigger.minWindDirection,
    max_wind_direction: trigger.maxWindDirection,
    min_swell_direction: trigger.minSwellDirection,
    max_swell_direction: trigger.maxSwellDirection,
    tide_type: trigger.tideType,
    min_tide_height: trigger.minTideHeight,
    max_tide_height: trigger.maxTideHeight,
    message_template: trigger.messageTemplate,
    notification_style: trigger.notificationStyle,
    priority: trigger.priority,
  };
}

export function toDbTriggerUpdate(
  trigger: Partial<Omit<Trigger, 'id' | 'userId' | 'spotId' | 'createdAt' | 'updatedAt'>>
): TablesUpdate<'triggers'> {
  const update: TablesUpdate<'triggers'> = {};
  if (trigger.name !== undefined) update.name = trigger.name;
  if (trigger.emoji !== undefined) update.emoji = trigger.emoji;
  if (trigger.condition !== undefined) update.condition = trigger.condition;
  if (trigger.minHeight !== undefined) update.min_height = trigger.minHeight;
  if (trigger.maxHeight !== undefined) update.max_height = trigger.maxHeight;
  if (trigger.minPeriod !== undefined) update.min_period = trigger.minPeriod;
  if (trigger.maxPeriod !== undefined) update.max_period = trigger.maxPeriod;
  if (trigger.minWindSpeed !== undefined) update.min_wind_speed = trigger.minWindSpeed;
  if (trigger.maxWindSpeed !== undefined) update.max_wind_speed = trigger.maxWindSpeed;
  if (trigger.minWindDirection !== undefined) update.min_wind_direction = trigger.minWindDirection;
  if (trigger.maxWindDirection !== undefined) update.max_wind_direction = trigger.maxWindDirection;
  if (trigger.minSwellDirection !== undefined) update.min_swell_direction = trigger.minSwellDirection;
  if (trigger.maxSwellDirection !== undefined) update.max_swell_direction = trigger.maxSwellDirection;
  if (trigger.tideType !== undefined) update.tide_type = trigger.tideType;
  if (trigger.minTideHeight !== undefined) update.min_tide_height = trigger.minTideHeight;
  if (trigger.maxTideHeight !== undefined) update.max_tide_height = trigger.maxTideHeight;
  if (trigger.messageTemplate !== undefined) update.message_template = trigger.messageTemplate;
  if (trigger.notificationStyle !== undefined) update.notification_style = trigger.notificationStyle;
  if (trigger.priority !== undefined) update.priority = trigger.priority;
  return update;
}

export function toDbAlertScheduleInsert(
  schedule: Omit<AlertSchedule, 'id' | 'createdAt' | 'updatedAt'>
): TablesInsert<'alert_schedules'> {
  return {
    user_id: schedule.userId,
    name: schedule.name,
    description: schedule.description,
    type: schedule.type,
    check_time: schedule.checkTime,
    active_days: schedule.activeDays,
    enabled: schedule.enabled,
  };
}

export function toDbAlertScheduleUpdate(
  schedule: Partial<Omit<AlertSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): TablesUpdate<'alert_schedules'> {
  const update: TablesUpdate<'alert_schedules'> = {};
  if (schedule.name !== undefined) update.name = schedule.name;
  if (schedule.description !== undefined) update.description = schedule.description;
  if (schedule.type !== undefined) update.type = schedule.type;
  if (schedule.checkTime !== undefined) update.check_time = schedule.checkTime;
  if (schedule.activeDays !== undefined) update.active_days = schedule.activeDays;
  if (schedule.enabled !== undefined) update.enabled = schedule.enabled;
  return update;
}

export function toDbUserPreferencesInsert(
  prefs: Omit<UserPreferences, 'id' | 'updatedAt'>
): TablesInsert<'user_preferences'> {
  return {
    user_id: prefs.userId,
    ai_personality: prefs.aiPersonality,
    include_emoji: prefs.includeEmoji,
    include_buoy_data: prefs.includeBuoyData,
    include_traffic: prefs.includeTraffic,
  };
}

export function toDbUserPreferencesUpdate(
  prefs: Partial<Omit<UserPreferences, 'id' | 'userId' | 'updatedAt'>>
): TablesUpdate<'user_preferences'> {
  const update: TablesUpdate<'user_preferences'> = {};
  if (prefs.aiPersonality !== undefined) update.ai_personality = prefs.aiPersonality;
  if (prefs.includeEmoji !== undefined) update.include_emoji = prefs.includeEmoji;
  if (prefs.includeBuoyData !== undefined) update.include_buoy_data = prefs.includeBuoyData;
  if (prefs.includeTraffic !== undefined) update.include_traffic = prefs.includeTraffic;
  return update;
}

// Admin-only mapper for surf_spots
export function toDbSurfSpotInsert(
  spot: Omit<SurfSpot, 'createdAt' | 'updatedAt'>
): TablesInsert<'surf_spots'> {
  return {
    id: spot.id,
    name: spot.name,
    lat: spot.lat,
    lon: spot.lon,
    region: spot.region,
    country_group: spot.countryGroup,
    country: spot.country,
    buoy_id: spot.buoyId,
    buoy_name: spot.buoyName,
    verified: spot.verified,
    source: spot.source,
  };
}

export function toDbSurfSpotUpdate(
  spot: Partial<Omit<SurfSpot, 'id' | 'createdAt' | 'updatedAt'>>
): TablesUpdate<'surf_spots'> {
  const update: TablesUpdate<'surf_spots'> = {};
  if (spot.name !== undefined) update.name = spot.name;
  if (spot.lat !== undefined) update.lat = spot.lat;
  if (spot.lon !== undefined) update.lon = spot.lon;
  if (spot.region !== undefined) update.region = spot.region;
  if (spot.countryGroup !== undefined) update.country_group = spot.countryGroup;
  if (spot.country !== undefined) update.country = spot.country;
  if (spot.buoyId !== undefined) update.buoy_id = spot.buoyId;
  if (spot.buoyName !== undefined) update.buoy_name = spot.buoyName;
  if (spot.verified !== undefined) update.verified = spot.verified;
  if (spot.source !== undefined) update.source = spot.source;
  return update;
}

export function toDbAlertSettingsInsert(
  settings: Omit<AlertSettings, 'id' | 'createdAt' | 'updatedAt'>
): TablesInsert<'alert_settings'> {
  return {
    user_id: settings.userId,
    window_mode: settings.windowMode,
    window_start_time: settings.windowStartTime,
    window_end_time: settings.windowEndTime,
    active_days: settings.activeDays,
    forecast_alerts_enabled: settings.forecastAlertsEnabled,
    two_day_forecast_enabled: settings.twoDayForecastEnabled,
    live_alerts_enabled: settings.liveAlertsEnabled,
  };
}

export function toDbAlertSettingsUpdate(
  settings: Partial<Omit<AlertSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): TablesUpdate<'alert_settings'> {
  const update: TablesUpdate<'alert_settings'> = {};
  if (settings.windowMode !== undefined) update.window_mode = settings.windowMode;
  if (settings.windowStartTime !== undefined) update.window_start_time = settings.windowStartTime;
  if (settings.windowEndTime !== undefined) update.window_end_time = settings.windowEndTime;
  if (settings.activeDays !== undefined) update.active_days = settings.activeDays;
  if (settings.forecastAlertsEnabled !== undefined) update.forecast_alerts_enabled = settings.forecastAlertsEnabled;
  if (settings.twoDayForecastEnabled !== undefined) update.two_day_forecast_enabled = settings.twoDayForecastEnabled;
  if (settings.liveAlertsEnabled !== undefined) update.live_alerts_enabled = settings.liveAlertsEnabled;
  return update;
}
