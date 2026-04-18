import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandLogo from '~/components/BrandLogo';

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
};

export default function AuthScaffold({
  title,
  subtitle,
  badge = 'DEVLOMATIX',
  children,
}: AuthScaffoldProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 bg-slate-50">
          <View className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-teal-700/10" />
          <View className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-sky-500/10" />

          <ScrollView bounces={false} showsVerticalScrollIndicator={false} className="flex-1">
            <View className="min-h-full justify-center px-6 py-7">
              <View className="mb-6 items-center">
                <Text className="mb-4 rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.6px] text-teal-700">
                  {badge}
                </Text>
                <BrandLogo variant="auth" />
                <Text className="mt-5 text-center text-3xl font-bold text-slate-900">{title}</Text>
                <Text className="mt-2.5 max-w-80 text-center text-[15px] leading-6 text-slate-600">
                  {subtitle}
                </Text>
              </View>

              <View className="rounded-[28px] bg-white p-5 shadow-xl shadow-slate-900/10">
                {children}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
