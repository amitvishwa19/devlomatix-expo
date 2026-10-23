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

import Toast from "react-native-toast-message";
import { toastConfig } from "~/components/CustomToast";
import { NotificationProvider } from "~/contexts/NotificationContext";
import { NotificationStoreProvider } from "~/contexts/NotificationStore";
import { NetworkProvider } from "~/contexts/NetworkContext";
import OfflineBanner from "~/components/OfflineBanner";
import { WidgetProvider } from "~/contexts/WidgetContext";
import { AppThemeProvider, useAppTheme } from "~/theme/AppTheme";

import { UniversalLoaderProvider } from "~/providers/UniversalLoaderProvider";
import { IosAlertProvider } from "~/providers/IosAlertProvider";
import { RbacProvider } from "~/contexts/RbacContext";
import { CrmSocketProvider } from "~/providers/CrmSocketProvider";
import IncomingCallModal from "~/app/_components/call/IncomingCallModal";
import ActiveCallModal from "~/app/_components/call/ActiveCallModal";
import PostCallSummaryModal from "~/app/_components/call/PostCallSummaryModal";
import CallEndedModal from "~/app/_components/call/CallEndedModal";
import { CrmProvider } from "~/providers/CrmProvider";
import { CrmDrawerProvider } from "~/app/_components/CrmDrawer";

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
            <NetworkProvider>
                <IosAlertProvider>
                    <UniversalLoaderProvider>
                        <RbacProvider>
                            <RootLayoutNav />
                        </RbacProvider>
                    </UniversalLoaderProvider>
                </IosAlertProvider>
            </NetworkProvider>
        </AppThemeProvider>
    );
}

function RootLayoutNav() {
    const { palette } = useAppTheme();

    return (
        <ThemeProvider value={palette.navigation === "dark" ? DarkTheme : DefaultTheme} >
            <NotificationStoreProvider>
                <NotificationProvider>
                <WidgetProvider>
                    <CrmSocketProvider>
                        <CrmProvider>
                            <CrmDrawerProvider>
                                <Stack screenOptions={{ headerShown: false }}>
                                    <Stack.Screen name="index" />
                                    <Stack.Screen name="(misc)" />
                                    <Stack.Screen name="(auth)" />
                                    <Stack.Screen name="(tabs)" />
                                    <Stack.Screen name="(modules)" />
                                    <Stack.Screen name="chat/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="chat/[chatId]" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="deals/[dealId]" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="contacts/[contactId]" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="accounts/[accountId]" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="analytics/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="dcr/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="settings/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="quotations/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="quotations/new" options={{ animation: 'slide_from_bottom' }} />
                                    <Stack.Screen name="quotations/[id]" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="candidates/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="candidates/[id]" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="mailbox/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="mailbox/[threadId]" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="mailbox/compose" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                                    <Stack.Screen name="tasks/index" options={{ animation: 'slide_from_right' }} />
                                    <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                                </Stack>
                                <OfflineBanner />
                                {/* Global In-App Calling Modals */}
                                <IncomingCallModal />
                                <ActiveCallModal />
                                <PostCallSummaryModal />
                                <CallEndedModal />
                                {/* <GlobalChatbot bottom={-10} right={20} /> */}
                                <Toast config={toastConfig} topOffset={34} />
                            </CrmDrawerProvider>
                        </CrmProvider>
                    </CrmSocketProvider>
                </WidgetProvider>
                </NotificationProvider>
            </NotificationStoreProvider>
        </ThemeProvider>
    );
}
