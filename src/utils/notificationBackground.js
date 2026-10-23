import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationEntryFromRemote } from '~/utils/notificationRouter';
import { appendStoredNotification } from '~/utils/notificationStorage';
import { getPreferences, shouldNotify } from '~/utils/preferences';

const DEFAULT_CHANNEL_ID = 'default';
const CALL_CHANNEL_ID = 'calls';

try {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification?.request?.content?.data || {};
      const isCall = data?.type === 'incoming_call';
      return {
        shouldShowBanner: !isCall,
        shouldShowList: !isCall,
        shouldPlaySound: !isCall,
        shouldSetBadge: false,
      };
    },
  });
} catch (_) {}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync(CALL_CHANNEL_ID, {
    name: 'Incoming Calls',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 800, 1000, 800],
    lightColor: '#818cf8',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    sound: 'default',
  });
}

function resolveTitle(data, isCall, isVideo) {
  if (data.title) return data.title;
  if (isCall) return `📞 Incoming ${isVideo ? 'Video' : 'Voice'} Call`;
  const sender = data.senderName || data.from || data.sender;
  if (sender) return `New message from ${sender}`;
  return 'New message';
}

function resolveBody(data) {
  const candidate =
    data.body || data.description || data.message || data.text || data.content || data.preview;
  return typeof candidate === 'string' ? candidate : '';
}

async function handleBackgroundMessage(remoteMessage) {
  const data = remoteMessage?.data || {};
  const type = String(data.type || '').toLowerCase();
  const prefs = await getPreferences();

  if (!shouldNotify(type, prefs)) return;

  await appendStoredNotification(notificationEntryFromRemote(remoteMessage)).catch(() => {});

  // Notification payloads are displayed by the OS automatically. Scheduling here as well
  // would produce duplicate notifications.
  if (remoteMessage?.notification) return;

  const isCall = type === 'incoming_call';
  const isVideo = String(data.callType || '').toLowerCase() === 'video';

  await ensureAndroidChannels().catch(() => {});

  await Notifications.scheduleNotificationAsync({
    content: {
      title: resolveTitle(data, isCall, isVideo),
      body: resolveBody(data),
      data: { ...data, messageId: remoteMessage?.messageId },
      sound: 'default',
      channelId: isCall ? CALL_CHANNEL_ID : DEFAULT_CHANNEL_ID,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: isCall ? [0, 800, 1000, 800] : [0, 250, 250, 250],
    },
    trigger: null,
  }).catch(() => {});
}

let getMessaging = null;
try {
  getMessaging = require('@react-native-firebase/messaging').getMessaging;
} catch (_) {
  // Non-native / web fallback
}

if (getMessaging) {
  try {
    getMessaging().setBackgroundMessageHandler(handleBackgroundMessage);
  } catch (_) {
    // Firebase messaging is not available in this client
  }
}
