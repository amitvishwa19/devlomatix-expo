import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { apiUrls } from '../../utils/api';
import { saveSession } from '../../utils/authStorage';
import { registerForPushNotificationsAsync } from '~/utils/notification';
import * as SecureStore from 'expo-secure-store';
import { storageKey } from '~/utils/constants';
import { getMessaging, getToken } from '@react-native-firebase/messaging';


export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('amitvishwa19@gmail.com');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    //webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '120757819823-iiq1pjeq9mpu8mom6vqvpi845pgb0dvs.apps.googleusercontent.com',

    useEffect(() => {
        GoogleSignin.configure({
            webClientId:'245235062421-rugl7hdlgdfqieia79tjeqar9m1j2tvf.apps.googleusercontent.com',
            offlineAccess: false,
        });
    }, []);

    const getTokens = useCallback(async () => {
        let expoPushToken, fcmToken;
        try { expoPushToken = await registerForPushNotificationsAsync(); } catch {}
        try { fcmToken = await getToken(getMessaging()); } catch {}
        console.log('Expo push token:', expoPushToken);
        console.log('FCM device token:', fcmToken);
        return { expoPushToken, fcmToken };
    }, []);

    const handleAuthSuccess = async (user, successMessage) => {
        await saveSession(user);
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: successMessage,
        });
        router.replace('/(tabs)/home');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter email and password',
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
                await handleAuthSuccess(res.data.user, 'Login successful');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: res.data?.message || 'Invalid credentials',
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.response?.data?.message || error.message || 'Something went wrong. Please try again.',
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
              console.error('Google sign-in returned no user:', JSON.stringify(userInfo));
              Toast.show({ type: 'error', text1: 'Google sign-in failed', text2: 'Could not retrieve user profile. Try reconfiguring the app.' });
              return;
            }

            const { expoPushToken, fcmToken } = await getTokens();
            const res = await axios.post(apiUrls.googleLogin, {
                uid: user.id,
                email: user.email,
                displayName: user.name,
                avatar: user.photo,
                provider: 'google',
                deviceToken: fcmToken,
                expoPushToken,
            });

            console.log('res',res.data.status)

            if (res.data?.status === 200 && res.data?.user) {
                await handleAuthSuccess(res.data.user, 'Google login successful');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Google login failed',
                    text2: res.data?.message || 'Verification failed on server',
                });
            }
        } catch (error) {
            console.error('Google Sign In error:', error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
                return;
            }
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.response?.data?.message || error.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <>
            <CustomInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                keyboardType="email-address"
                autoCapitalize="none" />

            <CustomInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry />


            <Pressable className="mb-4 self-end" onPress={() => router.push('./forgot-password')}>
                <Text className="text-sm font-semibold text-teal-700">Forgot password?</Text>
            </Pressable>

            <CustomButton
                title={loading ? 'Signing in...' : 'Sign In'}
                variant="primary"
                onPress={handleLogin}
                disabled={loading}
                className='mb-4' />

            <View className="mb-4 flex-row items-center">
                <View className="h-[1px] flex-1 bg-slate-200" />
                <Text className="mx-4 text-xs font-bold text-slate-400">OR</Text>
                <View className="h-[1px] flex-1 bg-slate-200" />
            </View>

            <CustomButton
                title={googleLoading ? "Connecting Google..." : "Continue with Google"}
                variant="secondary"
                icon={<FontAwesome name="google" size={18} color="#0f172a" />}
                onPress={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="mb-4" />

            <CustomButton
                title="Create new account"
                variant="secondary"
                onPress={() => router.push('./signup')} />

            <View className="mt-3.5">
                <Text className="text-center text-[13px] leading-5 text-slate-500">
                    UI only for now. Primary login flow goes to Home.
                </Text>
            </View>
        </>);

}
