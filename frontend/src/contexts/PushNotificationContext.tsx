/**
 * Push Notification Context
 *
 * Manages push notification state and syncs subscriptions to Supabase.
 * Provides hooks for enabling/disabling push notifications.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  initializeOneSignal,
  promptForPushPermission,
  getPlayerId,
  isPushSupported,
  getPushPermissionState,
  setExternalUserId,
  clearExternalUserId,
  isIos,
  isRunningAsPwa,
  canReceivePush,
} from '../lib/onesignal';

interface PushNotificationContextType {
  /** Whether push is supported in this browser */
  isSupported: boolean;
  /** Whether the user has an active push subscription */
  isSubscribed: boolean;
  /** Current permission state */
  permissionState: 'default' | 'granted' | 'denied';
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Whether this is iOS without PWA (can't receive push) */
  isIosWithoutPwa: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios_pwa';
  if (/android/i.test(ua)) return 'android_pwa';
  return 'web';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Chrome')) return 'chrome';
  if (ua.includes('Edge')) return 'edge';
  return 'unknown';
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionState, setPermissionState] = useState<'default' | 'granted' | 'denied'>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [isIosWithoutPwa, setIsIosWithoutPwa] = useState(false);

  // Initialize OneSignal on mount
  useEffect(() => {
    async function init() {
      await initializeOneSignal();

      const supported = await isPushSupported();
      setIsSupported(supported);

      // Check iOS PWA status
      if (isIos() && !isRunningAsPwa()) {
        setIsIosWithoutPwa(true);
      }

      if (supported && canReceivePush()) {
        const permission = await getPushPermissionState();
        setPermissionState(permission);

        // Check if we have a subscription
        const playerId = await getPlayerId();
        setIsSubscribed(!!playerId && permission === 'granted');
      }

      setIsLoading(false);
    }

    init();
  }, []);

  // Sync player ID to Supabase when user logs in and is subscribed
  useEffect(() => {
    async function syncPlayerId() {
      if (!user || !isSubscribed) return;

      const playerId = await getPlayerId();
      if (!playerId) return;

      // Link user to OneSignal
      await setExternalUserId(user.id);

      // Upsert player ID to push_subscriptions
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            onesignal_player_id: playerId,
            device_type: detectDeviceType(),
            browser: detectBrowser(),
            is_active: true,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,onesignal_player_id',
          }
        );

      if (error) {
        console.error('[PushNotification] Failed to sync subscription:', error);
      } else {
        console.log('[PushNotification] Subscription synced to Supabase');
      }
    }

    syncPlayerId();
  }, [user, isSubscribed]);

  // Clear external user ID on logout
  useEffect(() => {
    if (!user && isSubscribed) {
      clearExternalUserId();
    }
  }, [user, isSubscribed]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!canReceivePush()) {
      console.warn('[PushNotification] Cannot receive push on this device');
      return false;
    }

    setIsLoading(true);

    try {
      const success = await promptForPushPermission();

      if (success) {
        const permission = await getPushPermissionState();
        setPermissionState(permission);

        // Wait for OneSignal to assign player ID (can take a moment)
        let playerId: string | null = null;
        for (let i = 0; i < 10; i++) {
          playerId = await getPlayerId();
          if (playerId) break;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const subscribed = !!playerId && permission === 'granted';
        setIsSubscribed(subscribed);

        // Link to user if logged in
        if (user && playerId) {
          await setExternalUserId(user.id);

          // Save to Supabase
          const { error } = await supabase.from('push_subscriptions').upsert(
            {
              user_id: user.id,
              onesignal_player_id: playerId,
              device_type: detectDeviceType(),
              browser: detectBrowser(),
              is_active: true,
              last_used_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,onesignal_player_id',
            }
          );

          if (error) {
            console.error('[PushNotification] Failed to save subscription:', error);
          } else {
            console.log('[PushNotification] Subscription saved to Supabase');
          }
        }

        setIsLoading(false);
        return subscribed;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('[PushNotification] Subscribe error:', error);
      setIsLoading(false);
      return false;
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      // Mark subscription as inactive in Supabase
      if (user) {
        const playerId = await getPlayerId();
        if (playerId) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('onesignal_player_id', playerId);
        }
      }

      // Clear OneSignal external user ID
      await clearExternalUserId();

      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permissionState,
        isLoading,
        isIosWithoutPwa,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotification(): PushNotificationContextType {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotification must be used within PushNotificationProvider');
  }
  return context;
}
