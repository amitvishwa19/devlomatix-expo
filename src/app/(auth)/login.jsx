import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { saveSession } from '../../utils/authStorage';


export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('founder@devlomatix.com');
    const [password, setPassword] = useState('111111');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

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
            const mockUser = {
                id: 'mock-user-id',
                email,
                displayName: email.split('@')[0],
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            };
            await handleAuthSuccess(mockUser, 'Login successful');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const mockUser = {
                id: 'mock-google-user-id',
                email: 'google.user@gmail.com',
                displayName: 'Google User',
                avatar: null,
                accessToken: 'mock-google-access-token',
                refreshToken: 'mock-google-refresh-token',
            };
            await handleAuthSuccess(mockUser, 'Google login successful');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong. Please try again.',
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
