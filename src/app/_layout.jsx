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

setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
    // Ensure that reloading on deeper routes keeps a back button present.
    initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...FontAwesome.font,
    });

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <AppThemeProvider>
            <RootLayoutNav />
        </AppThemeProvider>
    );
}

function RootLayoutNav() {
    const { palette } = useAppTheme();

    return (
        <ThemeProvider
            value={palette.navigation === "dark" ? DarkTheme : DefaultTheme}
        >
            <NotificationProvider>
                <NotificationStoreProvider>
                <WidgetProvider>
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(misc)" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(modules)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                </Stack>
                {/* <GlobalChatbot bottom={-10} right={20} /> */}
                <Toast config={toastConfig} topOffset={34} />
                </WidgetProvider>
                </NotificationStoreProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}
