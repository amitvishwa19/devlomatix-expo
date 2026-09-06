import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import Toast from 'react-native-toast-message';
import { useLanguage } from '~/contexts/LanguageContext';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { apiUrls } from '../../utils/api';

export default function SignupScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleRegister() {
        if (!email || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: t('error'),
                text2: 'Please fill in all inputs before creating an account.'
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: t('error'),
                text2: 'Ensure both password inputs are identical.'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(apiUrls.register, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            console.log('register', data)

            if (response.status === 409 || data.status === 409) {
                Toast.show({
                    type: 'error',
                    text1: 'Account exists',
                    text2: 'An account with this email already exists. Please log in.'
                });
                router.replace('./login');
                return;
            }

            if (response.ok && (data.status === 200 || !data.status)) {
                Toast.show({
                    type: 'success',
                    text1: t('success'),
                    text2: 'Welcome aboard! Redirecting to login.'
                });
                router.replace('./login');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Registration failed',
                    text2: data.error || data.message || 'An unknown error occurred on the server.'
                });
            }
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: t('error'),
                text2: 'Could not reach the server right now.'
            });
            console.log('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <CustomInput
                label={t('email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none" />

            <CustomInput
                label={t('password')}
                value={password}
                onChangeText={setPassword}
                placeholder={t('passwordPlaceholder')}
                secureTextEntry />

            <CustomInput
                label={t('confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('reEnterPassword')}
                secureTextEntry />

            <CustomButton
                title={isLoading ? t('creatingAccount') : t('signUp')}
                variant="primary"
                className="mt-1"
                disabled={isLoading}
                onPress={handleRegister} />

            <CustomButton
                title={t('backToLogin')}
                variant="secondary"
                className="mt-3"
                onPress={() => router.replace('./login')} />

            <View className="mt-3.5">
                <Text className="text-center text-[13px] leading-5 text-slate-400">
                    Continuing will create a new user profile.
                </Text>
            </View>
        </>);
}
