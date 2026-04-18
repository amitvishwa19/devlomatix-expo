import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

const inputClassName =
  'mb-4 h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <>
      <Text className="mb-2 text-sm font-semibold text-slate-700">Email address</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="name@company.com"
        placeholderTextColor="#94a3b8"
        keyboardType="email-address"
        autoCapitalize="none"
        className={inputClassName}
      />

      <View className="mb-4 rounded-[18px] bg-sky-50 p-4">
        <Text className="mb-1.5 text-sm font-bold text-slate-900">Recovery preview</Text>
        <Text className="text-[13px] leading-5 text-slate-600">
          This screen is UI only. Continue to the OTP verification screen to preview the next step.
        </Text>
      </View>

      <Pressable
        className="h-12 items-center justify-center rounded-md bg-teal-700"
        onPress={() => router.push('./verify')}>
        <Text className="text-base font-bold text-slate-50">Send code</Text>
      </Pressable>

      <Pressable
        className="mt-3 h-12 items-center justify-center rounded-md border border-slate-300 bg-slate-50"
        onPress={() => router.replace('./login')}>
        <Text className="text-base font-bold text-slate-900">Back to sign in</Text>
      </Pressable>
    </>
  );
}
