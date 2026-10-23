import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'devlomatix.syncQueue';
const MAX_QUEUE = 100;

export async function getSyncQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

async function saveQueue(queue) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(0, MAX_QUEUE)));
  } catch (_) {}
}

export async function enqueueMutation(entry) {
  const queue = await getSyncQueue();
  const item = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  queue.push(item);
  await saveQueue(queue);
  return item;
}

export async function removeQueueItem(id) {
  const queue = await getSyncQueue();
  await saveQueue(queue.filter((item) => item.id !== id));
  return queue.length - 1;
}

export async function clearSyncQueue() {
  await saveQueue([]);
}

export async function flushSyncQueue(handler) {
  const queue = await getSyncQueue();
  if (!queue.length) return { processed: 0, remaining: 0, offline: false };

  let processed = 0;
  let remaining = queue.slice();

  for (const item of queue) {
    try {
      await handler(item);
      processed += 1;
      remaining = remaining.filter((entry) => entry.id !== item.id);
    } catch (error) {
      if (error?.isOffline || !error?.response) {
        await saveQueue(remaining);
        return { processed, remaining: remaining.length, offline: true };
      }
      // Drop permanent failures (validation, permissions, deleted rows) so the
      // queue cannot get stuck forever.
      processed += 1;
      remaining = remaining.filter((entry) => entry.id !== item.id);
    }
  }

  await saveQueue(remaining);
  return { processed, remaining: remaining.length, offline: false };
}
