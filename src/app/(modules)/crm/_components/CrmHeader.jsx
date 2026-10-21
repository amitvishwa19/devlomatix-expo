import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCrmTheme } from '../utils/colors';
import { useCrmDrawer } from './CrmDrawer';

export default function CrmHeader({
  title = 'DevX CRM',
  subtitle,
  rightActions,
  showBack = false,
  showAnalytics = true,
  showSettings = true,
}) {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { openDrawer } = useCrmDrawer();

  return (
    <View
      className="px-4 pb-3 border-b"
      style={{
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: colors.header,
        borderColor: colors.headerBorder,
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Side: Back button or Module Badge */}
        <View className="flex-row items-center gap-x-2.5 flex-1">
          {showBack ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(modules)/crm/(tabs)'))}
              className="h-9 w-9 items-center justify-center rounded-xl border active:opacity-70"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </Pressable>
          ) : (
            <Pressable
              onPress={openDrawer}
              className="h-9 w-9 items-center justify-center rounded-xl shadow-sm active:opacity-75"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="menu" size={20} color="#ffffff" />
            </Pressable>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-x-1.5">
              <Text
                className="text-base font-bold tracking-tight"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {title}
              </Text>
              {!showBack && (
                <View
                  className="rounded-full px-2 py-0.5 border"
                  style={{
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primaryBorder,
                  }}
                >
                  <Text
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: colors.primary }}
                  >
                    CRM
                  </Text>
                </View>
              )}
            </View>
            {subtitle ? (
              <Text
                className="text-[11px] font-medium mt-0.5"
                style={{ color: colors.textMuted }}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {rightActions ? (
          <View className="flex-row items-center gap-x-1.5">
            {rightActions}
          </View>
        ) : null}
      </View>
    </View>
  );
}
