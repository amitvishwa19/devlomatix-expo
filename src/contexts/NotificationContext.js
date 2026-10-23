import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNotificationStore } from '~/contexts/NotificationStore';
import {
  handleNotificationData,
  notificationEntryFromRemote,
} from '~/utils/notificationRouter';
import { registerForPushNotificationsAsync } from '~/utils/notification';
import { getPreferences, shouldNotify } from '~/utils/preferences';

const NotificationContext = createContext(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const notificationListener = useRef();
  const responseListener = useRef();

  const routeFromData = useCallback(
    (data) => {
      if (!data || data.type === 'incoming_call') return;
      handleNotificationData(data, router);
    },
    [router]
  );

  const addNotificationFromContent = useCallback(
    (content) => {
      const data = content?.data || {};
      if (!content || data.type === 'incoming_call') return;
      addNotification(
        notificationEntryFromRemote({
          data,
          notification: { title: content.title, body: content.body },
          messageId: data.messageId || data['google.message_id'] || undefined,
        })
      );
    },
    [addNotification]
  );

  useEffect(() => {
    let isMounted = true;
    let unsubFcm = null;
    let unsubFcmOpened = null;

    const setup = async () => {
      const prefs = await getPreferences();
      if (!isMounted) return;

      if (prefs.pushNotifications) {
        registerForPushNotificationsAsync().then(
          (token) => {
            if (isMounted) setExpoPushToken(token);
          },
          (err) => {
            if (isMounted) setError(err);
          }
        );
      }

      try {
        const messaging = getMessaging();
        unsubFcm = onMessage(messaging, async (remoteMessage) => {
          const data = remoteMessage.data || {};

          // Incoming calls are handled by the in-app call modal.
          if (data.type === 'incoming_call') return;

          const currentPrefs = await getPreferences();
          if (!shouldNotify(data.type, currentPrefs)) return;

          addNotification(notificationEntryFromRemote(remoteMessage));

          const { title, body } = remoteMessage.notification || {};
          Notifications.scheduleNotificationAsync({
            content: {
              title: title || data.title || 'Devlomatix',
              body: body || data.body || '',
              data: { ...data, messageId: remoteMessage.messageId },
            },
            trigger: null,
          }).catch(() => {});
        });
      } catch (_) {
        // Non-native / web fallback
      }
    };

    setup();

    const sub = Notifications.addNotificationReceivedListener((n) => {
      setNotification(n);
    });
    notificationListener.current = sub;

    const handledResponseIds = new Set();
    const handleResponse = (response) => {
      const request = response?.notification?.request;
      if (!request) return;
      if (request.identifier && handledResponseIds.has(request.identifier)) return;
      if (request.identifier) handledResponseIds.add(request.identifier);

      const content = request.content;
      addNotificationFromContent(content);
      routeFromData(content?.data || {});
    };

    const resSub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    responseListener.current = resSub;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        handleResponse(response);
        Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
      })
      .catch(() => {});

    try {
      const messaging = getMessaging();
      unsubFcmOpened = messaging.onNotificationOpenedApp((remoteMessage) => {
        if (!remoteMessage) return;
        if (remoteMessage.data?.type !== 'incoming_call') {
          addNotification(notificationEntryFromRemote(remoteMessage));
        }
        routeFromData(remoteMessage.data || {});
      });

      messaging
        .getInitialNotification()
        .then((remoteMessage) => {
          if (!remoteMessage) return;
          if (remoteMessage.data?.type !== 'incoming_call') {
            addNotification(notificationEntryFromRemote(remoteMessage));
          }
          routeFromData(remoteMessage.data || {});
        })
        .catch(() => {});
    } catch (_) {}

    return () => {
      isMounted = false;
      if (unsubFcm) unsubFcm();
      if (unsubFcmOpened) unsubFcmOpened();
      sub.remove();
      resSub.remove();
    };
  }, [addNotification, addNotificationFromContent, routeFromData]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationContext.Provider>
  );
};
