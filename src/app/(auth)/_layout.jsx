import { Slot, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandLogo from '~/components/BrandLogo';
import { pageBackground } from '~/utils/constants';

const authRouteCopy = {
  login: {
    badge: 'KRISHIMITRA',
    title: 'Welcome back',
    subtitle: 'Sign in to access your agricultural dashboard, solutions, and orders.',
  },
  signup: {
    badge: 'CREATE ACCOUNT',
    title: 'Join KrishiMitra',
    subtitle: 'Set up your account for personalized homeopathic crop and soil care.',
  },
  'forgot-password': {
    badge: 'RECOVERY',
    title: 'Reset your password',
    subtitle:
      'Enter your email and we will guide you into the verification step for password recovery.',
  },
  verify: {
    badge: 'VERIFICATION',
    title: 'Confirm your access',
    subtitle:
      'Enter the six-digit verification code sent to your registered contact.',
  },
};

export default function AuthLayout() {
  const segments = useSegments();
  const routeKey = segments[segments.length - 1];
  const copy = authRouteCopy[routeKey] ?? authRouteCopy.login;

  return (
    <ImageBackground
      source={pageBackground}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      imageStyle={{ opacity: 0.04 }}
      resizeMode="cover"
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Subtle ambient glow orbs */}
      <View className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
      <View className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center mb-5">
              <BrandLogo size={200} />
            </View>

            {/* Clean White Content Card */}
            <View className="rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-900/5">
              <Slot />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}


