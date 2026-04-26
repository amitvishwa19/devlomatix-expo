import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';

export default function KonnectXModuleShell({
  badge,
  title,
  description,
  children
}) {
  const router = useRouter();
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <StatusBar style={palette.statusBar} />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: palette.colors.page }}
        showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-28 pt-5">
          <Pressable
            className="mb-4 self-start rounded-full border px-4 py-2"
            style={{
              backgroundColor: palette.colors.surface,
              borderColor: palette.colors.border
            }}
            onPress={() => router.replace('/(tabs)/product')}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="arrow-back" size={16} color={palette.textColor} />
              <Text className="text-sm font-semibold" style={{ color: palette.textColor }}>
                Back to products
              </Text>
            </View>
          </Pressable>

          <View
            className="mb-4 rounded-[28px] p-5 shadow-xl"
            style={{ backgroundColor: palette.colors.surface, shadowColor: palette.colors.shadow }}>
            <View className="mb-4 self-start rounded-full bg-sky-600 px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">
                {badge}
              </Text>
            </View>
            <Text className="text-[32px] font-bold leading-[38px]" style={{ color: palette.textColor }}>
              {title}
            </Text>
            <Text className="mt-2.5 text-[15px] leading-6" style={{ color: palette.textSoftColor }}>
              {description}
            </Text>
          </View>

          {children}
        </View>
      </ScrollView>
    </SafeAreaView>);
}
