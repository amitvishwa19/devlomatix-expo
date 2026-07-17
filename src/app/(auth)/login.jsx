import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { apiUrls } from '../../utils/api';
import { saveSession } from '../../utils/authStorage';


export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('founder@devlomatix.com');
    const [password, setPassword] = useState('111111');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '580846317760-8gg8m94idkk1og5uan7vu7c1big3hpfb.apps.googleusercontent.com',
            offlineAccess: true,
        });
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
            const res = await axios.post(apiUrls.login, {
                email,
                password,
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

            const res = await axios.post(apiUrls.googleLogin, {
                uid: userInfo.user.id,
                email: userInfo.user.email,
                displayName: userInfo.user.name,
                avatar: userInfo.user.photo,
                provider: 'google',
            });

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
