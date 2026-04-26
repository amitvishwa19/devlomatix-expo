import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
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
    const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const location = null;

    useEffect(() => {
        GoogleSignin.configure({
            iosClientId: googleIosClientId || undefined,
            webClientId: googleWebClientId || googleAndroidClientId || undefined,
            profileImageSize: 120,
        });
    }, [googleAndroidClientId, googleIosClientId, googleWebClientId]);

    const handleAuthSuccess = async (user, successMessage) => {
        await saveSession(user);
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: successMessage,
        });
        router.replace('/(tabs)/home');
    };

    const getErrorMessage = async (response) => {
        try {
            const data = await response.json();
            return { data, message: data?.message || 'Unable to complete login.' };
        } catch {
            return { data: null, message: 'Unable to complete login.' };
        }
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
            const response = await fetch(apiUrls.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, location }),
            });

            const { data, message } = await getErrorMessage(response);

            const isSuccessfulLogin = response.ok && data?.status === 200 && data?.user;

            if (isSuccessfulLogin) {
                await handleAuthSuccess(data.user, 'Login successful');
            } else {
                if (data?.status === 401) {
                    Toast.show({
                        type: 'error',
                        text1: 'Unauthorized',
                        text2: data?.message || 'Account not found. Please check your credentials.',
                    });
                    router.replace('/(auth)/signup');
                    return;
                }

                Toast.show({
                    type: 'error',
                    text1: 'Login Failed',
                    text2: message,
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Network error. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const signInResult = await GoogleSignin.signIn()
            const user = signInResult.data?.user

            //Here the firebase authentication with google credential is optional, you can directly use the google user data to create a session in your backend and proceed with login without using firebase at all, its up to you, but if you want to use firebase then you can use the below code to authenticate with firebase using google credential
            //const googleCredential = GoogleAuthProvider.credential(signInResult.data.idToken);
            //signInWithCredential(getAuth(), googleCredential);

            const googleUser = {
                uid: user?.id,
                email: user?.email,
                provider: 'google-firebase',
                displayName: user?.name,
                avatar: user?.photo,
            };

            const response = await fetch(apiUrls.googleLogin, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...googleUser, location }),
            });

            const { data, message } = await getErrorMessage(response);

            if (response.ok && data?.status === 200 && data?.user) {
                await handleAuthSuccess(data.user, 'Google login successful');
                return;
            }

            Toast.show({
                type: 'error',
                text1: 'Google Login Failed',
                text2: message,
            });
        } catch (error) {
            if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
                return;
            }

            if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
                Toast.show({
                    type: 'info',
                    text1: 'Google Sign-In',
                    text2: 'A Google sign-in request is already in progress.',
                });
                return;
            }

            if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Toast.show({
                    type: 'error',
                    text1: 'Google Play Services',
                    text2: 'Google Play Services is not available on this device.',
                });
                return;
            }

            const isGoogleSdkError = isErrorWithCode(error);
            const errorMessage = isGoogleSdkError
                ? `${error.code}: ${error.message}`
                : error?.message || 'Unable to complete login.';

            Toast.show({
                type: 'error',
                text1: isGoogleSdkError ? 'Google Sign-In Failed' : 'Google Login Failed',
                text2: errorMessage,
            });
            console.log('Google sign-in error', error);
        } finally {
            setGoogleLoading(false);
            try {
                await GoogleSignin.signOut();
            } catch {
                // Ignore SDK sign-out failures after the backend session has been established.
            }
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
