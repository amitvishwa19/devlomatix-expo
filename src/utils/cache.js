import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'devlomatix.cache.';

export async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

export async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(
      `${PREFIX}${key}`,
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch (_) {}
}

export async function removeCache(key) {
  try {
    await AsyncStorage.removeItem(`${PREFIX}${key}`);
  } catch (_) {}
}

export function isStale(entry, ttlMs = 5 * 60 * 1000) {
  if (!entry?.savedAt) return true;
  return Date.now() - entry.savedAt > ttlMs;
}
