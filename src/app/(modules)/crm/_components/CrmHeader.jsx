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
        paddingTop: Math.max(insets.top, 12),
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
              className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 active:bg-slate-100"
            >
              <Ionicons name="arrow-back" size={18} color="#334155" />
            </Pressable>
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-400">
              <Ionicons name="rocket" size={18} color="#ffffff" />
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-x-1.5">
              <Text className="text-base font-black tracking-tight text-slate-900" numberOfLines={1}>
                {title}
              </Text>
              {!showBack && (
                <View className="rounded-full bg-indigo-50 px-2 py-0.5 border border-indigo-100">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-indigo-700">v5 API</Text>
                </View>
              )}
            </View>
            {subtitle ? (
              <Text className="text-[11px] text-slate-500 font-medium" numberOfLines={1}>
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
              className="h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-100"
            >
              <Ionicons name="bar-chart-outline" size={16} color="#475569" />
            </Pressable>
          )}

          {showSettings && (
            <Pressable
              onPress={() => router.push('/(modules)/crm/settings')}
              className="h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-100"
            >
              <Ionicons name="settings-outline" size={16} color="#475569" />
            </Pressable>
          )}

          <Pressable
            onPress={refreshAll}
            disabled={refreshing}
            className={`h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-100 ${
              refreshing ? 'opacity-50' : ''
            }`}
          >
            <Ionicons name="refresh-outline" size={16} color="#475569" />
          </Pressable>

          {rightActions}
        </View>
      </View>
    </View>
  );
}
