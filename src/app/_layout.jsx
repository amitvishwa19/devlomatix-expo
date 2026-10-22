import "../../global.css";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { setNotificationHandler } from "expo-notifications";
import Toast from "react-native-toast-message";
import { toastConfig } from "~/components/CustomToast";
import { NotificationProvider } from "~/contexts/NotificationContext";
import { NotificationStoreProvider } from "~/contexts/NotificationStore";
import { WidgetProvider } from "~/contexts/WidgetContext";
import { AppThemeProvider, useAppTheme } from "~/theme/AppTheme";

import { UniversalLoaderProvider } from "~/providers/UniversalLoaderProvider";
import { IosAlertProvider } from "~/providers/IosAlertProvider";
import { RbacProvider } from "~/contexts/RbacContext";
import { CrmSocketProvider } from "~/providers/CrmSocketProvider";
import IncomingCallModal from "~/app/(modules)/crm/_components/call/IncomingCallModal";
import ActiveCallModal from "~/app/(modules)/crm/_components/call/ActiveCallModal";
import PostCallSummaryModal from "~/app/(modules)/crm/_components/call/PostCallSummaryModal";
import CallEndedModal from "~/app/(modules)/crm/_components/call/CallEndedModal";

import * as Notifications from "expo-notifications";
import { getMessaging } from "@react-native-firebase/messaging";

setNotificationHandler({
    handleNotification: async (notification) => {
        const data = notification?.request?.content?.data || {};
        const isCall = data?.type === 'incoming_call';
        return {
            shouldShowBanner: !isCall,
            shouldShowList: !isCall,
            shouldPlaySound: !isCall,
            shouldSetBadge: !isCall,
        };
    },
});

try {
    getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log("🔥 [FCM Background] Remote message received:", remoteMessage?.data);
        const data = remoteMessage?.data || {};
        if (data.type === 'incoming_call' && !remoteMessage?.notification) {
            const isVideo = data.callType === 'video';
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `📞 Incoming ${isVideo ? 'Video' : 'Voice'} Call`,
                    body: `${data.callerName || 'Devlomatix Rep'} is calling you on Devlomatix CRM`,
                    data,
                    sound: 'default',
                },
                trigger: null,
            });
        }
    });
} catch (e) {
    // Non-native or web fallback
}

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
    // Ensure that reloading on deeper routes keeps a back button present.
    initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...FontAwesome.font,
    });

    useEffect(() => {
        if (error) {
            console.error("Font loading error:", error);
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [error]);

    if (!loaded) {
        return null;
    }

    return (
        <AppThemeProvider>
            <IosAlertProvider>
                <UniversalLoaderProvider>
                    <RbacProvider>
                        <RootLayoutNav />
                    </RbacProvider>
                </UniversalLoaderProvider>
            </IosAlertProvider>
        </AppThemeProvider>
    );
}

function RootLayoutNav() {
    const { palette } = useAppTheme();

    return (
        <ThemeProvider value={palette.navigation === "dark" ? DarkTheme : DefaultTheme} >
            <NotificationProvider>
                <NotificationStoreProvider>
                <WidgetProvider>
                    <CrmSocketProvider>
                        <Stack>
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="(misc)" options={{ headerShown: false }} />
                            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                            <Stack.Screen name="(modules)" options={{ headerShown: false }} />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                        </Stack>
                        {/* Global In-App Calling Modals */}
                        <IncomingCallModal />
                        <ActiveCallModal />
                        <PostCallSummaryModal />
                        <CallEndedModal />
                        {/* <GlobalChatbot bottom={-10} right={20} /> */}
                        <Toast config={toastConfig} topOffset={34} />
                    </CrmSocketProvider>
                </WidgetProvider>
                </NotificationStoreProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}
