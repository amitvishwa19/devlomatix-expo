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
import { useAppTheme } from '~/theme/AppTheme';

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
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className={`flex-1 ${palette.page}`}>
          <View className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-teal-700/10" />
          <View className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-sky-500/10" />

          <ScrollView bounces={false} showsVerticalScrollIndicator={false} className="flex-1">
            <View className="min-h-full justify-center px-6 py-7">
              <View className="mb-6 items-center">
                <Text className={`mb-4 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1.6px] text-teal-700 ${palette.accentSoft}`}>
                  {badge}
                </Text>
                <BrandLogo variant="auth" />
                <Text className={`mt-5 text-center text-3xl font-bold ${palette.text}`}>{title}</Text>
                <Text className={`mt-2.5 max-w-80 text-center text-[15px] leading-6 ${palette.textSoft}`}>
                  {subtitle}
                </Text>
              </View>

              <View className={`rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
                {children}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
