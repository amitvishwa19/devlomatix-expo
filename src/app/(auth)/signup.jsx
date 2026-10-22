import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { apiUrls } from '../../utils/api';

export default function SignupScreen() {
    const router = useRouter();
    const { isDark } = useAppTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleRegister() {
        if (!email || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Missing fields',
                text2: 'Please fill in all inputs before creating an account.'
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Passwords mismatch',
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

            console.log('register', data);

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
                    text1: 'Account Created',
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
                text1: 'Network issue',
                text2: 'Could not reach the server right now.'
            });
            console.log('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    }

    const iconColor  = isDark ? '#64748b' : '#94a3b8';
    const footerColor= isDark ? '#374151' : '#94a3b8';
    const linkColor  = isDark ? '#818cf8' : '#2563eb';
    const backColor  = isDark ? '#64748b' : '#94a3b8';

    return (
        <>
            <CustomInput
                label="Work email"
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

            <CustomInput
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                leftIcon={<FontAwesome name="shield" size={14} color={iconColor} />}
            />

            {/* Primary CTA */}
            <CustomButton
                title={isLoading ? 'Creating account…' : 'Create Account'}
                variant="primary"
                style={{ marginTop: 4, marginBottom: 20 }}
                disabled={isLoading}
                loading={isLoading}
                onPress={handleRegister}
            />

            {/* Footer row */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                <Text style={{ fontSize: 13, color: backColor }}>Already have an account?</Text>
                <Pressable onPress={() => router.replace('./login')}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: linkColor }}>Sign in</Text>
                </Pressable>
            </View>

            <Text style={{ textAlign: 'center', fontSize: 11, lineHeight: 17, color: footerColor }}>
                By creating an account you agree to our{' '}
                <Text
                    onPress={() => router.push('/(misc)/terms-conditions')}
                    style={{ color: linkColor, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                    onPress={() => router.push('/(misc)/privacy-policy')}
                    style={{ color: linkColor, fontWeight: '600', textDecorationLine: 'underline' }}>
                    Privacy Policy
                </Text>
                .
            </Text>
        </>
    );
}

