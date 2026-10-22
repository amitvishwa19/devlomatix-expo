import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { registerForPushNotificationsAsync } from "~/utils/notification";

const NotificationContext = createContext(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    console.log("New Notification");

    const unsubFcm = onMessage(getMessaging(), async (remoteMessage) => {
      const data = remoteMessage.data || {}; // FCM puts data at the root, not inside notification

      // Suppress notification when app is in foreground for incoming calls (handled by in-app modal)
      if (data.type === 'incoming_call') {
        console.log("🔥 FCM incoming call received in foreground (suppressing system notification)");
        return;
      }

      const { title, body } = remoteMessage.notification || {};
      console.log("🔥 FCM Message received:", { title, body, data });
      Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null,
      });
    });

    registerForPushNotificationsAsync().then(
      (token) => {
        setExpoPushToken(token);
      },
      (error) => setError(error),
    );

    const sub = Notifications.addNotificationReceivedListener((n) => {
      console.log("🔔 Notification Received:", n.request.content);
      setNotification(n);
    });
    notificationListener.current = sub;

    const resSub = Notifications.addNotificationResponseReceivedListener(
      (r) => {
        const content = r.notification?.request?.content;
        console.log("🔔 Notification Tapped:", content);
        const data = content?.data;
        if (data?.type === 'crm_email') {
          if (data?.threadId) {
            router.push(`/(modules)/crm/mailbox/${data.threadId}`);
          } else {
            router.push('/(modules)/crm/mailbox');
          }
        }
      },
    );
    responseListener.current = resSub;

    // Direct FCM background/killed app tap handler
    let unsubFcmOpened = null;
    try {
      const msg = getMessaging();
      if (msg) {
        unsubFcmOpened = msg.onNotificationOpenedApp((remoteMessage) => {
          const data = remoteMessage?.data;
          if (data?.type === 'crm_email') {
            if (data?.threadId) {
              router.push(`/(modules)/crm/mailbox/${data.threadId}`);
            } else {
              router.push('/(modules)/crm/mailbox');
            }
          }
        });

        msg.getInitialNotification().then((remoteMessage) => {
          const data = remoteMessage?.data;
          if (data?.type === 'crm_email') {
            if (data?.threadId) {
              router.push(`/(modules)/crm/mailbox/${data.threadId}`);
            } else {
              router.push('/(modules)/crm/mailbox');
            }
          }
        }).catch(() => {});
      }
    } catch (_) {}

    return () => {
      unsubFcm();
      sub.remove();
      resSub.remove();
      if (unsubFcmOpened) unsubFcmOpened();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
