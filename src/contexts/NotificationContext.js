import * as Notifications from "expo-notifications";
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
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

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const unsubFcm = onMessage(getMessaging(), async (remoteMessage) => {
      const { title, body, data } = remoteMessage.notification || {};
      console.log("🔥 FCM Message received:", { title, body, data });
      Notifications.scheduleNotificationAsync({
        content: { title, body, data: data || {} },
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

    const resSub = Notifications.addNotificationResponseReceivedListener((r) => {
      console.log("🔔 Notification Tapped:", r.notification.request.content);
    });
    responseListener.current = resSub;

    return () => {
      unsubFcm();
      sub.remove();
      resSub.remove();
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
