import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATION_STORAGE_KEY = 'devlomatix.notifications';
export const MAX_STORED_NOTIFICATIONS = 50;

export function normalizeNotification(notification = {}) {
  return {
    id: notification.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    module: notification.module || 'crm',
    title: notification.title || 'New notification',
    description: notification.description || '',
    icon: notification.icon || 'notifications',
    color: notification.color || '#6b7280',
    time: notification.time || new Date().toISOString(),
    read: notification.read ?? false,
    route: notification.route || null,
    data: notification.data || null,
    dedupeKey: notification.dedupeKey || null,
  };
}

export async function readStoredNotifications() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export async function appendStoredNotification(notification) {
  const entry = normalizeNotification(notification);
  const current = await readStoredNotifications();

  if (
    entry.dedupeKey &&
    current.some((item) => item.dedupeKey && item.dedupeKey === entry.dedupeKey)
  ) {
    return current;
  }

  const next = [entry, ...current].slice(0, MAX_STORED_NOTIFICATIONS);
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
  } catch (_) {}
  return next;
}
