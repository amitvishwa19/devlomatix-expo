import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import AuthScaffold from '~/components/AuthScaffold';

const inputClassName =
  'mb-4 h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthScaffold
      badge="CREATE ACCOUNT"
      title="Launch your workspace"
      subtitle="Set up your team identity and continue into the onboarding and verification flow.">
      <Text className="mb-2 text-sm font-semibold text-slate-700">Full name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your name"
        placeholderTextColor="#94a3b8"
        className={inputClassName}
      />

      <Text className="mb-2 text-sm font-semibold text-slate-700">Work email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="founder@devlomatix.com"
        placeholderTextColor="#94a3b8"
        keyboardType="email-address"
        autoCapitalize="none"
        className={inputClassName}
      />

      <Text className="mb-2 text-sm font-semibold text-slate-700">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Create a strong password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        className={inputClassName}
      />

      <Pressable
        className="mt-1 h-12 items-center justify-center rounded-md bg-teal-700"
        onPress={() => router.push('./verify')}>
        <Text className="text-base font-bold text-slate-50">Create account</Text>
      </Pressable>

      <Pressable
        className="mt-3 h-12 items-center justify-center rounded-md border border-slate-300 bg-slate-50"
        onPress={() => router.replace('./login')}>
        <Text className="text-base font-bold text-slate-900">Back to sign in</Text>
      </Pressable>

      <View className="mt-3.5">
        <Text className="text-center text-[13px] leading-5 text-slate-500">
          Next step is verification UI only. No account is created yet.
        </Text>
      </View>
    </AuthScaffold>
  );
}
