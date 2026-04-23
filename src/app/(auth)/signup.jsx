import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import Toast from 'react-native-toast-message';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { apiUrls } from '../../utils/api';

export default function SignupScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('founder@devlomatix.com');
    const [password, setPassword] = useState('111111');
    const [confirmPassword, setConfirmPassword] = useState('111111');
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


            console.log('register',data)

            if (response.ok) {

                if(data.status === 409){
                    Toast.show({
                        type: 'error',
                        text1: 'Account exists',
                        text2: 'An account with this email already exists. Please log in.'
                    });
                    router.replace('./login');
                    return;
                }
                
                Toast.show({
                    type: 'success',
                    text1: 'Account Created',
                    text2: 'Welcome aboard! Redirecting to verification.'
                });
                //router.push('./verify');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Registration failed',
                    text2: data.message || 'An unknown error occurred on the server.'
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

    return (
        <>


            <CustomInput
                label="Work email"
                value={email}
                onChangeText={setEmail}
                placeholder="founder@devlomatix.com"
                keyboardType="email-address"
                autoCapitalize="none" />

            <CustomInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a strong password"
                secureTextEntry />

            <CustomInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                secureTextEntry />


            <CustomButton
                title={isLoading ? "Creating account..." : "Create account"}
                variant="primary"
                className="mt-1"
                onPress={handleRegister} />

            <CustomButton
                title="Back to sign in"
                variant="secondary"
                className="mt-3"
                onPress={() => router.replace('./login')} />

            <View className="mt-3.5">
                <Text className="text-center text-[13px] leading-5 text-slate-500">
                    Continuing will create a new user profile.
                </Text>
            </View>
        </>);

}
