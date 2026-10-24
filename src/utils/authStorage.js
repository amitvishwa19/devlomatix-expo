import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { storageKey } from '~/utils/constants';
import { apiUrls } from '~/utils/api';

import { Alert } from 'react-native';
import { router } from 'expo-router';

const AUTH_SESSION_KEY = 'auth.session';

let isRefreshing = false;
let refreshPromise = null;

// Reactive state listeners for instant auth reactivity across app layouts
const authListeners = new Set();

export function onAuthStateChanged(listener) {
  if (typeof listener === 'function') {
    authListeners.add(listener);
    return () => authListeners.delete(listener);
  }
  return () => {};
}

function notifyAuthState(session) {
  authListeners.forEach((listener) => {
    try {
      listener(session);
    } catch (e) {
      console.warn('[AUTH_LISTENER_ERR]', e?.message);
    }
  });
}

let isTerminatingSession = false;

/**
 * Centrally triggers a single-device kick-out:
 * 1. Clears stored session tokens
 * 2. Notifies all auth state listeners (e.g. Tab layouts immediately unmount)
 * 3. Navigates out to /(auth)/login
 * 4. Displays iOS-style Alert dialog
 */
export async function triggerSessionSuperseded(details = {}) {
  // If the event was caused by a mobile login, mobile should NOT terminate itself!
  const platform = (details?.platform || '').toLowerCase();
  if (platform === 'mobile' || platform === 'android' || platform === 'ios') {
    console.log('[AUTH] Ignoring session superseded event originating from mobile login');
    return;
  }

  if (isTerminatingSession) return;
  isTerminatingSession = true;

  console.warn('[AUTH] Mobile session superseded by external login:', details);

  try {
    await clearSession();
  } catch (_) {}

  try {
    if (typeof router.canDismiss === 'function' && router.canDismiss()) {
      router.dismissAll();
    }
  } catch (_) {}

  try {
    router.replace('/(auth)/login');
  } catch (_) {}

  const device = details.device || details.deviceModel || 'Web Browser';
  Alert.alert(
    'Session Terminated',
    `You signed into Devlomatix on ${device}. Devlomatix enforces single-device session protection, so this mobile session has been closed.`,
    [
      {
        text: 'Sign In Again',
        style: 'default',
        onPress: () => {
          isTerminatingSession = false;
          try {
            router.replace('/(auth)/login');
          } catch (_) {}
        },
      },
    ],
    {
      cancelable: false,
      icon: 'shield-outline',
      iconColor: '#f59e0b',
    }
  );

  setTimeout(() => {
    isTerminatingSession = false;
  }, 3000);
}

export async function saveSession(user) {
  if (!user) {
    throw new Error('Cannot save an empty user session');
  }

  const session = {
    isLoggedIn: true,
    user,
    accessToken: user.accessToken ?? null,
    refreshToken: user.refreshToken ?? null,
    savedAt: Date.now()
  };

  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  await SecureStore.setItemAsync(storageKey.ACCESSTOKEN, session.accessToken ?? '');

  notifyAuthState(session);

  return session;
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    let decodedStr = '';
    if (typeof atob === 'function') {
      decodedStr = atob(base64);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = base64.replace(/=+$/, '');
      for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (decodedStr += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
        buffer = chars.indexOf(buffer);
      }
    }
    return JSON.parse(decodedStr);
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

/**
 * Automatically refresh the user's session using /auth/userfromtoken
 * Returns the fresh session or null if refresh failed
 */
export async function refreshAuthSession() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!rawSession) return null;

      let parsed = null;
      try {
        parsed = JSON.parse(rawSession);
      } catch {
        return null;
      }

      if (!parsed?.user) return null;

      let token =
        parsed.accessToken ||
        (await SecureStore.getItemAsync(storageKey.ACCESSTOKEN)) ||
        parsed.refreshToken ||
        parsed.user?.accessToken;

      if (!token) {
        console.warn('[AUTH] No stored token available for session refresh.');
        return null;
      }

      console.log('[AUTH] Refreshing session automatically from backend...');

      const response = await fetch(apiUrls.userfromtoken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        console.warn('[AUTH] Session refresh returned status:', response.status);
        if (response.status === 401 || response.status === 403) {
          try {
            const errData = await response.json();
            if (errData?.message && String(errData.message).includes('SESSION_SUPERSEDED')) {
              await triggerSessionSuperseded({ device: 'Web Browser' });
              return null;
            }
          } catch (_) {}
          await clearSession();
          return null;
        }
        return parsed;
      }

      const data = await response.json();
      const updatedUser = data?.user;
      const newAccessToken = data?.accessToken || updatedUser?.accessToken;
      const newRefreshToken = data?.refreshToken || updatedUser?.refreshToken;

      if (updatedUser && newAccessToken) {
        updatedUser.accessToken = newAccessToken;
        if (newRefreshToken) {
          updatedUser.refreshToken = newRefreshToken;
        }
        const updatedSession = await saveSession(updatedUser);
        console.log('[AUTH] Session successfully refreshed with new access token.');
        return updatedSession;
      }

      return parsed;
    } catch (err) {
      console.warn('[AUTH] Automatic session refresh error:', err?.message || err);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getSession(allowRefresh = true) {
  const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession);

    if (!parsedSession?.isLoggedIn || !parsedSession?.user) {
      await clearSession();
      return null;
    }

    if (!parsedSession.accessToken) {
      parsedSession.accessToken =
        (await SecureStore.getItemAsync(storageKey.ACCESSTOKEN)) || null;
    }

    // Automatically refresh if access token has expired
    if (parsedSession.accessToken && isJwtExpired(parsedSession.accessToken)) {
      if (allowRefresh) {
        console.log('[AUTH] Access token expired. Triggering automatic refresh...');
        const refreshed = await refreshAuthSession();
        if (refreshed) {
          return refreshed;
        }
      }
      await clearSession();
      return null;
    }

    return parsedSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function isLoggedIn() {
  const session = await getSession();
  return Boolean(session?.isLoggedIn);
}

export async function clearSession() {
  try {
    const token = await SecureStore.getItemAsync(storageKey.ACCESSTOKEN);
    if (token) {
      fetch(apiUrls.logout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
  } catch (_) {}

  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  await SecureStore.deleteItemAsync(storageKey.ACCESSTOKEN);
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    if (GoogleSignin) {
      await GoogleSignin.signOut();
    }
  } catch (_) {}
  notifyAuthState(null);
}

