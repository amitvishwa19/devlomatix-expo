import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    GoogleSignin,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { getMessaging, getToken } from "@react-native-firebase/messaging";
import { useLanguage } from "~/contexts/LanguageContext";
import { registerForPushNotificationsAsync } from "~/utils/notification";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { apiUrls } from "../../utils/api";
import { saveSession } from "../../utils/authStorage";

export default function LoginScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    //webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '120757819823-iiq1pjeq9mpu8mom6vqvpi845pgb0dvs.apps.googleusercontent.com',

    useEffect(() => {
        GoogleSignin.configure({
            webClientId:
                "245235062421-rugl7hdlgdfqieia79tjeqar9m1j2tvf.apps.googleusercontent.com",
            offlineAccess: false,
        });
    }, []);

    const getTokens = useCallback(async () => {
        let expoPushToken, fcmToken;
        try {
            expoPushToken = await registerForPushNotificationsAsync();
        } catch { }
        try {
            fcmToken = await getToken(getMessaging());
        } catch { }
        console.log("Expo push token:", expoPushToken);
        console.log("FCM device token:", fcmToken);
        return { expoPushToken, fcmToken };
    }, []);

    const handleAuthSuccess = async (user, successMessage) => {
        await saveSession(user);
        Toast.show({
            type: "success",
            text1: t("success"),
            text2: successMessage,
        });
        router.replace("/(tabs)/home");
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: "error",
                text1: t("error"),
                text2: "Please enter email and password",
            });
            return;
        }

        setLoading(true);
        try {
            const { expoPushToken, fcmToken } = await getTokens();
            const res = await axios.post(apiUrls.login, {
                email,
                password,
                deviceToken: fcmToken,
                expoPushToken,
            });

            if (res.data?.status === 200 && res.data?.user) {
                //console.log('User', res.data?.user)
                await handleAuthSuccess(res.data.user, "Login successful");
            } else {
                Toast.show({
                    type: "error",
                    text1: t("error"),
                    text2: res.data?.message || "Invalid credentials",
                });
            }
        } catch (error) {
            console.error("Login error:", error);
            Toast.show({
                type: "error",
                text1: t("error"),
                text2:
                    error?.response?.data?.message ||
                    error.message ||
                    "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            //console.log('user info',userInfo?.data?.user)

            const user = userInfo?.data?.user;

            if (!user) {
                console.error(
                    "Google sign-in returned no user:",
                    JSON.stringify(userInfo),
                );
                Toast.show({
                    type: "error",
                    text1: "Google sign-in failed",
                    text2: "Could not retrieve user profile. Try reconfiguring the app.",
                });
                return;
            }

            const { expoPushToken, fcmToken } = await getTokens();
            const res = await axios.post(apiUrls.googleLogin, {
                uid: user.id,
                email: user.email,
                displayName: user.name,
                avatar: user.photo,
                provider: "google",
                deviceToken: fcmToken,
                expoPushToken,
            });

            console.log("res user data", res.data?.user);

            if (res.data?.status === 200 && res.data?.user) {
                await handleAuthSuccess(res.data.user, "Google login successful");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Google login failed",
                    text2: res.data?.message || "Verification failed on server",
                });
            }
        } catch (error) {
            console.error("Google Sign In error:", error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
                return;
            }
            Toast.show({
                type: "error",
                text1: t("error"),
                text2:
                    error?.response?.data?.message ||
                    error.message ||
                    "Something went wrong. Please try again.",
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <>
            <CustomInput
                label={t("email")}
                value={email}
                onChangeText={setEmail}
                placeholder={t("emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <CustomInput
                label={t("password")}
                value={password}
                onChangeText={setPassword}
                placeholder={t("passwordPlaceholder")}
                secureTextEntry
            />

            <Pressable
                className="mb-4 self-end"
                onPress={() => router.push("./forgot-password")}
            >
                <Text className="text-xs font-semibold text-emerald-400">
                    {t("forgotPassword")}
                </Text>
            </Pressable>

            <CustomButton
                title={loading ? t("signingIn") : t("signIn")}
                variant="primary"
                onPress={handleLogin}
                disabled={loading}
                className="mb-4"
            />

            <View className="mb-4 flex-row items-center">
                <View className="h-[1px] flex-1 bg-slate-700/60" />
                <Text className="mx-4 text-[11px] font-bold tracking-wider text-slate-400">{t("or")}</Text>
                <View className="h-[1px] flex-1 bg-slate-700/60" />
            </View>

            <CustomButton
                title={googleLoading ? t("connectingGoogle") : t("continueWithGoogle")}
                variant="secondary"
                icon={<FontAwesome name="google" size={16} color="#ffffff" />}
                onPress={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="mb-3.5"
            />

            <CustomButton
                title={t("createNewAccount")}
                variant="secondary"
                onPress={() => router.push("./signup")}
            />
        </>
    );
}

