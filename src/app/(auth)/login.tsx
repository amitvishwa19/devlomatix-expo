import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import AuthScaffold from '~/components/AuthScaffold';

const inputClassName =
  'mb-4 h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to access your workspace, projects, and product delivery dashboard.">
      <Text className="mb-2 text-sm font-semibold text-slate-700">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="name@company.com"
        placeholderTextColor="#94a3b8"
        keyboardType="email-address"
        autoCapitalize="none"
        className={inputClassName}
      />

      <Text className="mb-2 text-sm font-semibold text-slate-700">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        className={inputClassName}
      />

      <Pressable className="mb-4 self-end" onPress={() => router.push('./forgot-password')}>
        <Text className="text-sm font-semibold text-teal-700">Forgot password?</Text>
      </Pressable>

      <Pressable
        className="h-12 items-center justify-center rounded-md bg-teal-700"
        onPress={() => router.replace('/home')}>
        <Text className="text-base font-bold text-slate-50">Sign In</Text>
      </Pressable>

      <Pressable
        className="mt-3 h-12 items-center justify-center rounded-md border border-slate-300 bg-slate-50"
        onPress={() => router.push('./signup')}>
        <Text className="text-base font-bold text-slate-900">Create new account</Text>
      </Pressable>

      <View className="mt-3.5">
        <Text className="text-center text-[13px] leading-5 text-slate-500">
          UI only for now. Primary login flow goes to Home.
        </Text>
      </View>
    </AuthScaffold>
  );
}
