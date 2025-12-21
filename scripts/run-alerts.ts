/**
 * Homebreak Alert Runner
 *
 * This script runs periodically via GitHub Actions to:
 * 1. Evaluate all enabled triggers against current surf conditions
 * 2. Process matches: check surveillance windows, generate messages, send emails
 * 3. Record alerts in the database for dashboard display
 *
 * Usage: npx tsx run-alerts.ts
 */

import { createClient } from '@supabase/supabase-js';
import { fetchSpotConditions, type SolarData } from './lib/dataFetcher.js';
import { evaluateTrigger, mapDbTrigger, type Trigger, type ConditionData } from './lib/evaluator.js';
import { generateMessage, generateSubject } from './lib/messenger.js';
import { sendAlertEmail, isValidEmail } from './lib/emailer.js';
import { sendPushNotification, isOneSignalConfigured } from './lib/pushNotifier.js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========== TYPES ==========

interface AlertSettings {
  windowMode: 'solar' | 'clock' | 'always';
  windowStartTime: string;
  windowEndTime: string;
  activeDays: string[];
  liveAlertsEnabled: boolean;
  forecastAlertsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

interface SpotInfo {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  buoyId: string | null;
  tideStationId: string | null;
  tideStationName: string | null;
}

interface TriggerWithContext extends Trigger {
  spot: SpotInfo;
  userEmail: string;
  userTimezone: string;
  alertSettings: AlertSettings;
  emoji: string | null;
}

// ========== MAIN ENTRY POINT ==========

async function main() {
  console.log('=== Homebreak Alert Runner ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Stage 1: Evaluate triggers and insert matches
    const matchCount = await evaluateAllTriggers();
    console.log(`\nStage 1 complete: ${matchCount} new matches`);

    // Stage 2: Process pending matches
    const processedCount = await processPendingMatches();
    console.log(`\nStage 2 complete: ${processedCount} alerts processed`);

    console.log(`\n=== Finished at: ${new Date().toISOString()} ===`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// ========== STAGE 1: EVALUATE TRIGGERS ==========

async function evaluateAllTriggers(): Promise<number> {
  console.log('\n--- Stage 1: Evaluating Triggers ---');

  // Fetch all enabled triggers with user settings and spot info
  const { data: triggers, error } = await supabase
    .from('triggers')
    .select(`
      *,
      user_spots!inner (
        id, name, latitude, longitude, buoy_id,
        master_spot_id,
        surf_spots (lat, lon, buoy_id)
      ),
      profiles!inner (
        id, email, timezone,
        alert_settings (
          window_mode, window_start_time, window_end_time,
          active_days, live_alerts_enabled, forecast_alerts_enabled
        )
      )
    `)
    .eq('enabled', true);

  if (error) {
    console.error('Error fetching triggers:', error);
    return 0;
  }

  if (!triggers || triggers.length === 0) {
    console.log('No enabled triggers found');
    return 0;
  }

  console.log(`Found ${triggers.length} enabled triggers`);

  // Group triggers by spot for efficient data fetching
  const triggersBySpot = new Map<string, TriggerWithContext[]>();

  for (const row of triggers) {
    const userSpot = row.user_spots;
    const surfSpot = userSpot.surf_spots;
    const profile = row.profiles;
    const alertSettings = profile.alert_settings;

    // Skip if no alert settings or live alerts disabled
    if (!alertSettings || !alertSettings.live_alerts_enabled) {
      continue;
    }

    const spot: SpotInfo = {
      id: userSpot.id,
      name: userSpot.name,
      latitude: userSpot.latitude ?? surfSpot?.lat ?? 0,
      longitude: userSpot.longitude ?? surfSpot?.lon ?? 0,
      buoyId: userSpot.buoy_id ?? surfSpot?.buoy_id ?? null,
      tideStationId: null, // Would need tide station lookup
      tideStationName: null,
    };

    const trigger: TriggerWithContext = {
      ...mapDbTrigger(row),
      spot,
      userEmail: profile.email,
      userTimezone: profile.timezone || 'America/Chicago',
      alertSettings: {
        windowMode: alertSettings.window_mode || 'solar',
        windowStartTime: alertSettings.window_start_time || '06:00',
        windowEndTime: alertSettings.window_end_time || '22:00',
        activeDays: alertSettings.active_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        liveAlertsEnabled: alertSettings.live_alerts_enabled ?? true,
        forecastAlertsEnabled: alertSettings.forecast_alerts_enabled ?? false,
        pushEnabled: alertSettings.push_enabled ?? false,
        emailEnabled: alertSettings.email_enabled ?? true,
      },
      emoji: row.emoji,
    };

    const spotKey = spot.id;
    if (!triggersBySpot.has(spotKey)) {
      triggersBySpot.set(spotKey, []);
    }
    triggersBySpot.get(spotKey)!.push(trigger);
  }

  console.log(`Grouped into ${triggersBySpot.size} unique spots`);

  let matchCount = 0;

  // Process each spot
  for (const [spotId, spotTriggers] of triggersBySpot) {
    const spot = spotTriggers[0].spot;
    console.log(`\nProcessing spot: ${spot.name} (${spotTriggers.length} triggers)`);

    // Fetch conditions for this spot
    const conditions = await fetchSpotConditions(
      spot.latitude,
      spot.longitude,
      spot.buoyId ?? undefined,
      spot.tideStationId ?? undefined,
      spot.tideStationName ?? undefined
    );

    if (!conditions.buoy && !conditions.forecast) {
      console.log(`  No wave data available for ${spot.name}`);
      continue;
    }

    // Evaluate each trigger
    for (const trigger of spotTriggers) {
      const result = evaluateTrigger(trigger, conditions, spot.name);

      if (result.matches) {
        console.log(`  MATCH: ${trigger.name} (${result.matchType})`);

        // Insert match (with dedup)
        const { error: insertError } = await supabase
          .from('trigger_matches')
          .insert({
            trigger_id: trigger.id,
            user_id: trigger.userId,
            spot_id: trigger.spotId,
            match_type: result.matchType,
            condition_matched: trigger.condition,
            condition_data: result.conditionData,
            status: 'pending',
          });

        if (insertError) {
          if (insertError.code === '23505') {
            // Unique constraint violation - already fired today
            console.log(`    Already fired today, skipping`);
          } else {
            console.error(`    Insert error:`, insertError);
          }
        } else {
          matchCount++;
        }
      } else {
        console.log(`  No match: ${trigger.name} - ${result.reason}`);
      }
    }
  }

  return matchCount;
}

// ========== STAGE 2: PROCESS MATCHES ==========

async function processPendingMatches(): Promise<number> {
  console.log('\n--- Stage 2: Processing Pending Matches ---');

  // Fetch all pending matches with related data
  const { data: matches, error } = await supabase
    .from('trigger_matches')
    .select(`
      *,
      triggers!inner (
        name, condition, notification_style, message_template, emoji
      ),
      user_spots!inner (name),
      profiles!inner (
        email, timezone,
        alert_settings (
          window_mode, window_start_time, window_end_time, active_days,
          push_enabled, email_enabled
        )
      )
    `)
    .eq('status', 'pending')
    .order('matched_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending matches:', error);
    return 0;
  }

  if (!matches || matches.length === 0) {
    console.log('No pending matches to process');
    return 0;
  }

  console.log(`Found ${matches.length} pending matches`);

  let processedCount = 0;

  for (const match of matches) {
    const profile = match.profiles;
    const trigger = match.triggers;
    const spotName = match.user_spots.name;
    const alertSettings = profile.alert_settings;
    const conditionData = match.condition_data as ConditionData;

    console.log(`\nProcessing: ${spotName} - ${trigger.name}`);

    // Mark as processing
    await supabase
      .from('trigger_matches')
      .update({ status: 'processing' })
      .eq('id', match.id);

    // Check surveillance window
    const timezone = profile.timezone || 'America/Chicago';
    const windowCheck = checkSurveillanceWindow(timezone, alertSettings, null);

    if (!windowCheck.inWindow) {
      console.log(`  Skipped: ${windowCheck.reason}`);
      await supabase
        .from('trigger_matches')
        .update({
          status: 'skipped',
          skip_reason: windowCheck.reason,
          processed_at: new Date().toISOString(),
        })
        .eq('id', match.id);
      continue;
    }

    // Check active day
    const today = getDayOfWeek(timezone);
    const activeDays = alertSettings?.active_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!activeDays.includes(today)) {
      console.log(`  Skipped: inactive day (${today})`);
      await supabase
        .from('trigger_matches')
        .update({
          status: 'skipped',
          skip_reason: `inactive_day_${today}`,
          processed_at: new Date().toISOString(),
        })
        .eq('id', match.id);
      continue;
    }

    // Get channel preferences (default: email enabled, push disabled)
    const emailEnabled = alertSettings?.email_enabled ?? true;
    const pushEnabled = alertSettings?.push_enabled ?? false;

    // Check if at least one channel is available
    const hasValidEmail = profile.email && isValidEmail(profile.email);
    const canSendEmail = emailEnabled && hasValidEmail;
    const canSendPush = pushEnabled && isOneSignalConfigured();

    if (!canSendEmail && !canSendPush) {
      console.log(`  Skipped: no valid delivery channels`);
      await supabase
        .from('trigger_matches')
        .update({
          status: 'skipped',
          skip_reason: 'no_valid_channels',
          processed_at: new Date().toISOString(),
        })
        .eq('id', match.id);
      continue;
    }

    // Generate message
    const message = await generateMessage(
      trigger.notification_style,
      trigger.message_template,
      {
        spotName,
        condition: trigger.condition,
        triggerName: trigger.name,
        conditionData,
      }
    );

    const subject = generateSubject(trigger.emoji, spotName, trigger.condition);

    console.log(`  Message: ${message.substring(0, 50)}...`);

    // Track delivery results
    let anySuccess = false;

    // Send via EMAIL if enabled
    if (canSendEmail) {
      const emailResult = await sendAlertEmail({
        to: profile.email,
        subject,
        message,
        spotName,
        condition: trigger.condition || 'good',
        emoji: trigger.emoji,
      });

      // Record email delivery
      await supabase.from('sent_alerts').insert({
        user_id: match.user_id,
        spot_id: match.spot_id,
        trigger_id: match.trigger_id,
        match_id: match.id,
        alert_type: match.match_type,
        condition_matched: match.condition_matched,
        message_content: message,
        delivery_channel: 'email',
        delivery_status: emailResult.success ? 'sent' : 'failed',
        resend_id: emailResult.resendId,
        error_message: emailResult.error,
        sent_at: new Date().toISOString(),
      });

      if (emailResult.success) {
        console.log(`  Email sent: ${emailResult.resendId}`);
        anySuccess = true;
      } else {
        console.log(`  Email failed: ${emailResult.error}`);
      }
    }

    // Send via PUSH if enabled
    if (canSendPush) {
      // Fetch active push subscriptions for this user
      const { data: pushSubs } = await supabase
        .from('push_subscriptions')
        .select('onesignal_player_id')
        .eq('user_id', match.user_id)
        .eq('is_active', true);

      const playerIds = pushSubs?.map(s => s.onesignal_player_id) ?? [];

      if (playerIds.length > 0) {
        const pushTitle = `${trigger.emoji || '🌊'} ${spotName}`;
        const pushResult = await sendPushNotification({
          playerIds,
          title: pushTitle,
          message: message.substring(0, 200), // Truncate for push
          spotName,
          condition: trigger.condition || 'good',
          emoji: trigger.emoji,
        });

        // Record push delivery
        await supabase.from('sent_alerts').insert({
          user_id: match.user_id,
          spot_id: match.spot_id,
          trigger_id: match.trigger_id,
          match_id: match.id,
          alert_type: match.match_type,
          condition_matched: match.condition_matched,
          message_content: message.substring(0, 200),
          delivery_channel: 'push',
          delivery_status: pushResult.success ? 'sent' : 'failed',
          onesignal_id: pushResult.onesignalId,
          error_message: pushResult.error,
          sent_at: new Date().toISOString(),
        });

        if (pushResult.success) {
          console.log(`  Push sent to ${playerIds.length} device(s): ${pushResult.onesignalId}`);
          anySuccess = true;
        } else {
          console.log(`  Push failed: ${pushResult.error}`);
        }
      } else {
        console.log(`  Push skipped: no active subscriptions`);
      }
    }

    // Update trigger last_fired_at
    await supabase
      .from('triggers')
      .update({ last_fired_at: new Date().toISOString() })
      .eq('id', match.trigger_id);

    // Update match status (success if at least one channel succeeded)
    await supabase
      .from('trigger_matches')
      .update({
        status: anySuccess ? 'sent' : 'failed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    processedCount++;
  }

  return processedCount;
}

// ========== HELPER FUNCTIONS ==========

function checkSurveillanceWindow(
  timezone: string,
  alertSettings: AlertSettings | null,
  solarData: SolarData | null
): { inWindow: boolean; reason?: string } {
  if (!alertSettings) {
    return { inWindow: true };
  }

  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const hour = localTime.getHours();
  const minute = localTime.getMinutes();
  const currentMinutes = hour * 60 + minute;

  if (alertSettings.windowMode === 'always') {
    return { inWindow: true };
  }

  if (alertSettings.windowMode === 'clock') {
    const [startH, startM] = alertSettings.windowStartTime.split(':').map(Number);
    const [endH, endM] = alertSettings.windowEndTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return { inWindow: true };
    } else {
      return {
        inWindow: false,
        reason: `outside_clock_window_${alertSettings.windowStartTime}_${alertSettings.windowEndTime}`,
      };
    }
  }

  if (alertSettings.windowMode === 'solar') {
    if (solarData) {
      if (now >= solarData.sunrise && now <= solarData.sunset) {
        return { inWindow: true };
      } else {
        return { inWindow: false, reason: 'outside_solar_window' };
      }
    } else {
      // Fallback: 6am-8pm if no solar data
      if (hour >= 6 && hour <= 20) {
        return { inWindow: true };
      } else {
        return { inWindow: false, reason: 'outside_solar_window_fallback' };
      }
    }
  }

  return { inWindow: true };
}

function getDayOfWeek(timezone: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return days[localTime.getDay()];
}

// Run the script
main();
