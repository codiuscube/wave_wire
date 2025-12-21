/**
 * Push Notification Delivery via OneSignal
 *
 * Sends push notifications to users via OneSignal REST API.
 * Uses player IDs stored in the push_subscriptions table.
 */

import * as OneSignal from 'onesignal-node';

// Initialize OneSignal client
const client = new OneSignal.Client(
  process.env.ONESIGNAL_APP_ID!,
  process.env.ONESIGNAL_REST_API_KEY!
);

export interface PushContent {
  /** OneSignal player IDs to send to */
  playerIds: string[];
  /** Notification title */
  title: string;
  /** Notification body message */
  message: string;
  /** Spot name for data payload */
  spotName: string;
  /** Condition level (epic, good, fair) */
  condition: string;
  /** Optional URL to open on click */
  url?: string;
  /** Optional emoji for data payload */
  emoji?: string;
}

export interface PushSendResult {
  success: boolean;
  onesignalId?: string;
  recipients?: number;
  error?: string;
}

/**
 * Check if OneSignal is configured
 */
export function isOneSignalConfigured(): boolean {
  return !!(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY);
}

/**
 * Send a push notification to specific player IDs
 */
export async function sendPushNotification(content: PushContent): Promise<PushSendResult> {
  const { playerIds, title, message, spotName, condition, url, emoji } = content;

  if (!isOneSignalConfigured()) {
    console.warn('[Push] OneSignal not configured - skipping push');
    return { success: false, error: 'OneSignal not configured' };
  }

  if (!playerIds.length) {
    return { success: false, error: 'No player IDs provided' };
  }

  try {
    const notification = {
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: message },
      url: url || 'https://wave-wire.com/dashboard',
      // Data payload for app handling
      data: {
        spotName,
        condition,
        emoji,
        type: 'surf_alert',
      },
      // TTL - 2 hours (conditions may change quickly)
      ttl: 7200,
      // iOS specific
      ios_badgeType: 'Increase' as const,
      ios_badgeCount: 1,
    };

    const response = await client.createNotification(notification);

    console.log(`[Push] Sent to ${playerIds.length} devices: ${response.body.id}`);

    return {
      success: true,
      onesignalId: response.body.id,
      recipients: response.body.recipients,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Push] Send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send push notification by external user ID (Supabase user ID)
 * This is an alternative to player IDs - OneSignal will resolve to all devices
 */
export async function sendPushByUserId(
  userId: string,
  content: Omit<PushContent, 'playerIds'>
): Promise<PushSendResult> {
  const { title, message, spotName, condition, url, emoji } = content;

  if (!isOneSignalConfigured()) {
    console.warn('[Push] OneSignal not configured - skipping push');
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    const notification = {
      include_external_user_ids: [userId],
      headings: { en: title },
      contents: { en: message },
      url: url || 'https://wave-wire.com/dashboard',
      data: {
        spotName,
        condition,
        emoji,
        type: 'surf_alert',
      },
      ttl: 7200,
    };

    const response = await client.createNotification(notification);

    console.log(`[Push] Sent to user ${userId}: ${response.body.id}`);

    return {
      success: true,
      onesignalId: response.body.id,
      recipients: response.body.recipients,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Push] Send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
