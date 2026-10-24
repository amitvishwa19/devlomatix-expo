import FontAwesome from "@expo/vector-icons/FontAwesome";
import { getMessaging, getToken } from "@react-native-firebase/messaging";
import {
    GoogleSignin,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { useAuthLoading } from "~/contexts/AuthLoadingContext";
import { useAppTheme } from "~/theme/AppTheme";
import { registerForPushNotificationsAsync } from "~/utils/notification";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { apiUrls } from "../../utils/api";
import { saveSession } from "../../utils/authStorage";

export default function LoginScreen() {
    const router = useRouter();
    const { isDark } = useAppTheme();
    const { setScreenLoading } = useAuthLoading() || {};
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

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
            text1: "Success",
            text2: successMessage,
        });
        router.replace('/(tabs)');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please enter email and password",
            });
            return;
        }

        setLoading(true);
        setScreenLoading?.(true);
        try {
            const { expoPushToken, fcmToken } = await getTokens();
            const deviceModel = `${Platform.OS === 'android' ? 'Android' : 'iOS'} (${Platform.constants?.Model || Platform.constants?.Brand || 'Mobile App'})`;
            const res = await axios.post(apiUrls.login, {
                email,
                password,
                deviceToken: fcmToken,
                expoPushToken,
                deviceModel,
                device: deviceModel,
            });

            if (res.data?.status === 200 && res.data?.user) {
                await handleAuthSuccess(res.data.user, "Login successful");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: res.data?.message || "Invalid credentials",
                });
            }
        } catch (error) {
            console.error("Login error:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2:
                    error?.response?.data?.message ||
                    error.message ||
                    "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
            setScreenLoading?.(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setScreenLoading?.(true);
        try {
            await GoogleSignin.hasPlayServices();
            try {
                await GoogleSignin.signOut();
            } catch (_) {}
            const userInfo = await GoogleSignin.signIn();

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
            const deviceModel = `${Platform.OS === 'android' ? 'Android' : 'iOS'} (${Platform.constants?.Model || Platform.constants?.Brand || 'Mobile App'})`;
            const res = await axios.post(apiUrls.googleLogin, {
                uid: user.id,
                email: user.email,
                displayName: user.name,
                avatar: user.photo,
                provider: "google",
                deviceToken: fcmToken,
                expoPushToken,
                deviceModel,
                device: deviceModel,
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
                return;
            }
            Toast.show({
                type: "error",
                text1: "Error",
                text2:
                    error?.response?.data?.message ||
                    error.message ||
                    "Something went wrong. Please try again.",
            });
        } finally {
            setGoogleLoading(false);
            setScreenLoading?.(false);
        }
    };

    const accentColor = isDark ? '#818cf8' : '#2563eb';
    const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9';
    const dividerTextColor = isDark ? '#374151' : '#c0cad8';
    const iconColor = isDark ? '#64748b' : '#94a3b8';
    const linkColor = isDark ? '#94a3b8' : '#64748b';
    const linkAccent = isDark ? '#818cf8' : '#2563eb';
    const footerColor = isDark ? '#374151' : '#94a3b8';


    return (
        <>
            {/* ── Credential fields ── */}
            <CustomInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<FontAwesome name="envelope-o" size={13} color={iconColor} />}
            />

            <CustomInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                leftIcon={<FontAwesome name="lock" size={15} color={iconColor} />}
            />

            {/* Forgot password link */}
            <Pressable
                style={{ alignSelf: 'flex-end', marginBottom: 20, marginTop: -6 }}
                onPress={() => router.push('./forgot-password')}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: accentColor }}>
                    Forgot password?
                </Text>
            </Pressable>

            {/* ── Primary CTA ── */}
            <CustomButton
                title={loading ? 'Signing in…' : 'Sign In'}
                variant="primary"
                onPress={handleLogin}
                disabled={loading}
                loading={loading}
                style={{ marginBottom: 18 }}
            />

            {/* ── Divider ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                <Text style={{
                    marginHorizontal: 14, fontSize: 10, fontWeight: '700',
                    letterSpacing: 1.2, color: dividerTextColor,
                }}>
                    OR CONTINUE WITH
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
            </View>

            {/* ── Google sign-in ── */}
            <CustomButton
                title={googleLoading ? 'Connecting…' : 'Continue with Google'}
                variant="secondary"
                icon={<FontAwesome name="google" size={15} color={isDark ? '#e2e8f0' : '#3c4043'} />}
                onPress={handleGoogleLogin}
                disabled={googleLoading || loading}
                style={{ marginBottom: 20 }}
            />

            {/* ── Footer link ── */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                <Text style={{ fontSize: 13, color: linkColor }}>Don't have an account?</Text>
                <Pressable onPress={() => router.push('./signup')}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: linkAccent }}>
                        Sign up
                    </Text>
                </Pressable>
            </View >

            <Text style={{ textAlign: 'center', fontSize: 11, lineHeight: 17, color: footerColor }}>
                By logging in you agree to our{' '}
                <Text
                    onPress={() => router.push('/(misc)/terms-conditions')}
                    style={{ color: linkAccent, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                    onPress={() => router.push('/(misc)/privacy-policy')}
                    style={{ color: linkAccent, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Privacy Policy
                </Text>
                .
            </Text>
        </>

    );
}
