import { Slot, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View } from
'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandLogo from '~/components/BrandLogo';

const authRouteCopy = {
  login: {
    badge: 'DEVLOMATIX',
    title: 'Welcome back',
    subtitle: 'Sign in to access your workspace, projects, and product delivery dashboard.'
  },
  signup: {
    badge: 'CREATE ACCOUNT',
    title: 'Launch your workspace',
    subtitle: 'Set up your team identity and continue into the onboarding and verification flow.'
  },
  'forgot-password': {
    badge: 'RECOVERY',
    title: 'Reset your password',
    subtitle:
    'Enter your email and we will move you into the verification step for password recovery.'
  },
  verify: {
    badge: 'VERIFICATION',
    title: 'Confirm your access',
    subtitle:
    'Enter the six-digit code. This is UI only, so any input can continue to the home screen.'
  }
};

export default function AuthLayout() {
  const segments = useSegments();
  const routeKey = segments[segments.length - 1];
  const copy = authRouteCopy[routeKey] ?? authRouteCopy.login;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 bg-slate-50">
          <View className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-teal-700/10" />
          <View className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-sky-500/10" />

          <View className="flex-1">
            <View className="min-h-full justify-center px-6 py-7">
              <View className="mb-6 items-center">
               
                <BrandLogo size={200} />
                <Text className="mt-5 text-center text-3xl font-bold text-slate-900">
                  {copy.title}
                </Text>
                <Text className="mt-2.5 max-w-80 text-center text-[15px] leading-6 text-slate-600">
                  {copy.subtitle}
                </Text>
              </View>

              <View className="rounded-[28px] bg-white p-5 shadow-xl shadow-slate-900/10">
                <Slot />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>);

}