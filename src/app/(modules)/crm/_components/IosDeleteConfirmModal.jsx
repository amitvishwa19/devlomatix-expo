import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmTheme } from '../utils/colors';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

/**
 * Shared iOS-style ActionSheet confirmation modal for CRM deletions and irreversible actions.
 */
export default function IosDeleteConfirmModal({
  visible,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  isPermanent = false,
  onConfirm,
  onCancel,
}) {
  const { colors, isDark } = useCrmTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      try {
        HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
      } catch (_) {}
    }
  }, [visible]);

  if (!visible) return null;

  const handleConfirm = () => {
    try {
      HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
    } catch (_) {}
    onConfirm?.();
  };

  const handleCancel = () => {
    try {
      HapticsModule?.selectionAsync?.();
    } catch (_) {}
    onCancel?.();
  };

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const dividerColor = isDark ? '#334155' : '#f1f5f9';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <Pressable
        onPress={handleCancel}
        className="flex-1 justify-end px-3.5"
        style={{
          backgroundColor: 'rgba(2, 6, 23, 0.55)',
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          {/* Top Grouped Card: Description & Destructive Action */}
          <View
            className="rounded-xl overflow-hidden shadow-lg border"
            style={{
              backgroundColor: cardBg,
              borderColor: isDark ? '#334155' : '#e2e8f0',
            }}
          >
            {/* Header info */}
            <View className="px-4 py-3.5 items-center">
              <Text
                className="text-[13px] font-bold text-center"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {title}
              </Text>
              {message ? (
                <Text
                  className="text-[11px] text-center mt-1 leading-4"
                  style={{ color: colors.textMuted }}
                >
                  {message}
                </Text>
              ) : null}
            </View>

            {/* Divider */}
            <View className="h-[1px] w-full" style={{ backgroundColor: dividerColor }} />

            {/* Destructive Confirm Button */}
            <Pressable
              onPress={handleConfirm}
              className="py-3.5 flex-row items-center justify-center gap-2 active:opacity-60"
              style={({ pressed }) => ({
                backgroundColor: pressed ? (isDark ? '#334155' : '#fee2e2') : 'transparent',
              })}
            >
              <Ionicons
                name={isPermanent ? 'trash' : 'trash-outline'}
                size={17}
                color="#ef4444"
              />
              <Text className="text-[15px] font-semibold text-red-500">
                {confirmText}
              </Text>
            </Pressable>
          </View>

          {/* Bottom Card: Independent Cancel Button */}
          <View
            className="mt-2.5 rounded-xl overflow-hidden shadow-sm border mb-2"
            style={{
              backgroundColor: cardBg,
              borderColor: isDark ? '#334155' : '#e2e8f0',
            }}
          >
            <Pressable
              onPress={handleCancel}
              className="py-3.5 items-center justify-center active:opacity-75"
              style={({ pressed }) => ({
                backgroundColor: pressed ? (isDark ? '#334155' : '#f1f5f9') : cardBg,
              })}
            >
              <Text
                className="text-[15px] font-bold"
                style={{ color: colors.primary }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
