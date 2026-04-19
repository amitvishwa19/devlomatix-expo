import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import CustomButton from './CustomButton';
import CustomInput from './CustomInput';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
                title="Sign In"
                variant="primary"
                onPress={() => router.replace('/(tabs)/home')}
                className='mb-4' />

            <View className="mb-4 flex-row items-center">
                <View className="h-[1px] flex-1 bg-slate-200" />
                <Text className="mx-4 text-xs font-bold text-slate-400">OR</Text>
                <View className="h-[1px] flex-1 bg-slate-200" />
            </View>

            <CustomButton
                title="Continue with Google"
                variant="secondary"
                icon={<FontAwesome name="google" size={18} color="#0f172a" />}
                onPress={() => console.log('Google Sign in')}
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