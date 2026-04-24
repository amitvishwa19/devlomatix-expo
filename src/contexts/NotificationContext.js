import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import { Subscription } from "expo-modules-core";
import { registerForPushNotificationsAsync } from "~/utils/notification";
import { useAuth } from "./AuthContext";
//import notifee from '@notifee/react-native';

const NotificationContext = createContext(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error(
            "useNotification must be used within a NotificationProvider"
        );
    }
    return context;
};

export const NotificationProvider = ({ children }) => {

    const [expoPushToken, setExpoPushToken] = useState(null);
    const [notification, setNotification] = useState(null);
    const [error, setError] = useState(null);
    const setExpoDeviceToken = useAuth()

    const notificationListener = useRef();
    const responseListener = useRef();


    console.log(setExpoDeviceToken)

    useEffect(() => {
        registerForPushNotificationsAsync().then(
            (token) => {
                setExpoPushToken(token);
            },
            (error) => setError(error)
        );

        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                console.log("🔔 Notification Received: ", notification);
                setNotification(notification);
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener((response) => {
                console.log(
                    "🔔 Notification Response: ",
                    JSON.stringify(response, null, 2),
                    JSON.stringify(response.notification.request.content.data, null, 2)
                );
                // Handle the notification response here
            });

        return () => {
            if (notificationListener.current) {
                // Notifications.removeNotificationSubscription(
                //     notificationListener.current
                // );
                Subscription.remove(
                    notificationListener.current
                )
            }
            if (responseListener.current) {
                //Notifications.removeNotificationSubscription(responseListener.current);
                Subscription.remove(
                    responseListener.current
                )
            }
        };
    }, []);

    const onDisplayNotification = async () => {
        // Request permissions (required for iOS)
        await notifee.requestPermission()

        // Create a channel (required for Android)
        const channelId = await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
        });

        // Display a notification
        await notifee.displayNotification({
            title: 'Notification Title',
            body: 'Main body content of the notification',
            android: {
                channelId,
                smallIcon: 'name-of-a-small-icon', // optional, defaults to 'ic_launcher'.
                // pressAction is needed if you want the notification to open the app when pressed
                pressAction: {
                    id: 'default',
                },
            },
        });
    }

    return (
        <NotificationContext.Provider
            value={{ expoPushToken, notification, error }}
        >
            {children}
        </NotificationContext.Provider>
    );
};