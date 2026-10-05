import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';

export default function CrmHeader({
  title = 'DevX CRM',
  subtitle,
  rightActions,
  showBack = false,
  showAnalytics = true,
  showSettings = true,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { refreshAll, refreshing } = useCrm();

  return (
    <View
      className="border-b px-4 pb-3"
      style={{
        paddingTop: 6,
        paddingBottom: 10,
        backgroundColor: palette.colors.surface || '#ffffff',
        borderColor: palette.colors.border || '#f1f5f9',
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Side: Back button or Module Badge */}
        <View className="flex-row items-center gap-x-2.5 flex-1">
          {showBack ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(modules)/crm/(tabs)'))}
              className={`h-9 w-9 items-center justify-center rounded-xl border ${palette.surfaceAlt} ${palette.border}`}
            >
              <Ionicons name="arrow-back" size={18} color={palette.textColor} />
            </Pressable>
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <Ionicons name="rocket" size={18} color="#ffffff" />
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-x-1.5">
              <Text className={`text-base font-black tracking-tight ${palette.text}`} numberOfLines={1}>
                {title}
              </Text>
              {!showBack && (
                <View className={`rounded-full px-2 py-0.5 border ${palette.accentSoft} ${palette.border}`}>
                  <Text className={`text-[9px] font-bold uppercase tracking-wider ${palette.accentText}`}>v5 API</Text>
                </View>
              )}
            </View>
            {subtitle ? (
              <Text className={`text-[11px] font-medium ${palette.textMuted}`} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right Side: Action Shortcuts */}
        <View className="flex-row items-center gap-x-1.5">
          {showAnalytics && (
            <Pressable
              onPress={() => router.push('/(modules)/crm/analytics')}
              className={`h-9 w-9 items-center justify-center rounded-xl border ${palette.surfaceAlt} ${palette.border}`}
            >
              <Ionicons name="bar-chart-outline" size={16} color={palette.textMutedColor} />
            </Pressable>
          )}

          {showSettings && (
            <Pressable
              onPress={() => router.push('/(modules)/crm/settings')}
              className={`h-9 w-9 items-center justify-center rounded-xl border ${palette.surfaceAlt} ${palette.border}`}
            >
              <Ionicons name="settings-outline" size={16} color={palette.textMutedColor} />
            </Pressable>
          )}

          <Pressable
            onPress={refreshAll}
            disabled={refreshing}
            className={`h-9 w-9 items-center justify-center rounded-xl border ${palette.surfaceAlt} ${palette.border} ${
              refreshing ? 'opacity-50' : ''
            }`}
          >
            <Ionicons name="refresh-outline" size={16} color={palette.textMutedColor} />
          </Pressable>

          {rightActions}
        </View>
      </View>
    </View>
  );
}
