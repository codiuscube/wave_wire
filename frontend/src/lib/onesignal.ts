/**
 * OneSignal Web Push Notification Integration
 *
 * Handles initialization, permission prompts, and player ID management
 * for web push notifications via OneSignal.
 */

import OneSignal from 'react-onesignal';

let initialized = false;

/**
 * Initialize OneSignal SDK
 * Should be called once when the app loads
 */
export async function initializeOneSignal(): Promise<void> {
  if (initialized) return;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId) {
    console.warn('[OneSignal] App ID not configured - push notifications disabled');
    return;
  }

  try {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    });

    initialized = true;
    console.log('[OneSignal] Initialized successfully');
  } catch (error) {
    console.error('[OneSignal] Initialization failed:', error);
  }
}

/**
 * Show the push notification permission prompt
 * Returns true if user granted permission
 */
export async function promptForPushPermission(): Promise<boolean> {
  if (!initialized) {
    console.warn('[OneSignal] Not initialized, cannot prompt');
    return false;
  }

  try {
    await OneSignal.Slidedown.promptPush();

    // Wait a bit for the permission state to update
    await new Promise(resolve => setTimeout(resolve, 500));

    const permission = await OneSignal.Notifications.permission;
    return permission;
  } catch (error) {
    console.error('[OneSignal] Permission prompt error:', error);
    return false;
  }
}

/**
 * Get the OneSignal player ID (used for sending targeted notifications)
 */
export async function getPlayerId(): Promise<string | null> {
  if (!initialized) return null;

  try {
    // Use the onesignalId property
    const playerId = OneSignal.User.onesignalId;
    return playerId ?? null;
  } catch (error) {
    console.error('[OneSignal] Failed to get player ID:', error);
    return null;
  }
}

/**
 * Check if push notifications are supported in this browser
 */
export async function isPushSupported(): Promise<boolean> {
  if (!initialized) return false;

  try {
    return await OneSignal.Notifications.isPushSupported();
  } catch {
    return false;
  }
}

/**
 * Get the current push notification permission state
 */
export async function getPushPermissionState(): Promise<'default' | 'granted' | 'denied'> {
  if (!initialized) return 'default';

  try {
    const permission = await OneSignal.Notifications.permission;
    return permission ? 'granted' : 'default';
  } catch {
    return 'default';
  }
}

/**
 * Set the external user ID (links OneSignal subscription to Supabase user)
 */
export async function setExternalUserId(userId: string): Promise<void> {
  if (!initialized) return;

  try {
    await OneSignal.login(userId);
    console.log('[OneSignal] External user ID set:', userId);
  } catch (error) {
    console.error('[OneSignal] Failed to set external user ID:', error);
  }
}

/**
 * Clear the external user ID (on logout)
 */
export async function clearExternalUserId(): Promise<void> {
  if (!initialized) return;

  try {
    await OneSignal.logout();
    console.log('[OneSignal] External user ID cleared');
  } catch (error) {
    console.error('[OneSignal] Failed to clear external user ID:', error);
  }
}

/**
 * Check if we're running as a PWA (installed to home screen)
 */
export function isRunningAsPwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if we're on iOS
 */
export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * iOS requires PWA installation for push to work
 * This checks if push can work on the current device/browser
 */
export function canReceivePush(): boolean {
  // On iOS, must be running as PWA
  if (isIos() && !isRunningAsPwa()) {
    return false;
  }
  return true;
}

// Re-export OneSignal for advanced usage
export { OneSignal };
