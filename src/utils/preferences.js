import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREFERENCES_KEY = 'devlomatix.preferences';

export const DEFAULT_PREFERENCES = {
  pushNotifications: true,
  callAlerts: true,
  messageAlerts: true,
  dealAlerts: true,
  emailUpdates: false,
  autoSyncDrafts: true,
  teamVisibility: true,
  usageAnalytics: false,
  experimentalFeatures: false,
};

export function shouldNotify(type, prefs = DEFAULT_PREFERENCES) {
  if (!prefs?.pushNotifications) return false;
  const value = String(type || '').toLowerCase();
  if (value.includes('call')) return prefs.callAlerts !== false;
  if (value.includes('email') || value.includes('mail') || value.includes('message') || value.includes('chat')) {
    return prefs.messageAlerts !== false;
  }
  if (value.includes('deal') || value.includes('task') || value.includes('reminder')) {
    return prefs.dealAlerts !== false;
  }
  return true;
}

export async function getPreferences() {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!stored) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch (_) {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(next) {
  try {
    const merged = { ...DEFAULT_PREFERENCES, ...next };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged));
    return merged;
  } catch (_) {
    return { ...DEFAULT_PREFERENCES, ...next };
  }
}
