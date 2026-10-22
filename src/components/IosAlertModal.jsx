import React, { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

/**
 * Authentic iOS-styled Alert Dialog component.
 *
 * Designed according to Apple Human Interface Guidelines:
 * - Centered 275-300dp modal card with rounded corners
 * - Centered bold title and soft message text
 * - Optional subtle status icon (Checkmark, Warning, Location, Error)
 * - Standard iOS hairline button dividers
 * - Supports 1 button (OK), 2 buttons (Cancel | Confirm), or stacked multiple buttons
 */
export default function IosAlertModal({
  visible = false,
  onClose,
  title = '',
  message = '',
  icon = null,
  iconColor = null,
  buttons = [],
  closeOnBackdrop = false,
}) {
  const { palette } = useAppTheme();

  useEffect(() => {
    if (visible) {
      try {
        HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
      } catch (_) {}
    }
  }, [visible]);

  if (!visible) return null;

  const resolvedButtons =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: 'OK', style: 'default', onPress: onClose }];

  const handleBackdropPress = () => {
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const handleButtonPress = (btn) => {
    if (btn?.onPress) {
      btn.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  const isTwoButtons = resolvedButtons.length === 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
        />

        <View
          className="w-full max-w-[290px] overflow-hidden rounded-[20px] shadow-2xl"
          style={{
            backgroundColor: palette.isDark ? '#1e293b' : '#f8fafc',
            borderWidth: 1,
            borderColor: palette.isDark ? '#334155' : '#e2e8f0',
          }}
        >
          {/* Header & Body */}
          <View className="px-5 pt-5 pb-4 items-center">
            {icon ? (
              <View
                className="w-11 h-11 rounded-full items-center justify-center mb-3"
                style={{
                  backgroundColor: iconColor ? `${iconColor}18` : (palette.isDark ? '#334155' : '#e2e8f0'),
                }}
              >
                <Ionicons
                  name={icon}
                  size={24}
                  color={iconColor || (palette.isDark ? '#38bdf8' : '#0284c7')}
                />
              </View>
            ) : null}

            {title ? (
              <Text
                className="text-center text-[16px] font-bold leading-5 tracking-tight"
                style={{ color: palette.isDark ? '#f8fafc' : '#0f172a' }}
              >
                {title}
              </Text>
            ) : null}

            {message ? (
              <Text
                className="mt-1.5 text-center text-[13px] leading-4.5 font-normal"
                style={{ color: palette.isDark ? '#94a3b8' : '#64748b' }}
              >
                {message}
              </Text>
            ) : null}
          </View>

          {/* Divider */}
          <View
            className="w-full h-[0.8px]"
            style={{ backgroundColor: palette.isDark ? '#334155' : '#e2e8f0' }}
          />

          {/* Actions */}
          {isTwoButtons ? (
            <View className="flex-row">
              {resolvedButtons.map((btn, idx) => {
                const isFirst = idx === 0;
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';

                let textColor = '#007AFF';
                if (isDestructive) {
                  textColor = '#ef4444';
                } else if (isCancel) {
                  textColor = palette.isDark ? '#cbd5e1' : '#475569';
                } else if (palette.isDark) {
                  textColor = '#38bdf8';
                }

                return (
                  <TouchableOpacity
                    key={`${btn.text}-${idx}`}
                    onPress={() => handleButtonPress(btn)}
                    activeOpacity={0.65}
                    className={`flex-1 items-center justify-center py-3.5 px-2 ${
                      isFirst ? 'border-r' : ''
                    }`}
                    style={{
                      borderRightColor: palette.isDark ? '#334155' : '#e2e8f0',
                      borderRightWidth: isFirst ? 0.8 : 0,
                    }}
                  >
                    {btn.loading ? (
                      <ActivityIndicator size="small" color={textColor} />
                    ) : (
                      <Text
                        className={`text-[15px] ${
                          isCancel ? 'font-medium' : 'font-bold'
                        }`}
                        style={{ color: textColor }}
                        numberOfLines={1}
                      >
                        {btn.text}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="flex-col">
              {resolvedButtons.map((btn, idx) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';

                let textColor = '#007AFF';
                if (isDestructive) {
                  textColor = '#ef4444';
                } else if (isCancel) {
                  textColor = palette.isDark ? '#cbd5e1' : '#475569';
                } else if (palette.isDark) {
                  textColor = '#38bdf8';
                }

                return (
                  <View key={`${btn.text}-${idx}`} className="w-full">
                    {idx > 0 && (
                      <View
                        className="w-full h-[0.8px]"
                        style={{ backgroundColor: palette.isDark ? '#334155' : '#e2e8f0' }}
                      />
                    )}
                    <TouchableOpacity
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.65}
                      className="w-full items-center justify-center py-3.5 px-4"
                    >
                      {btn.loading ? (
                        <ActivityIndicator size="small" color={textColor} />
                      ) : (
                        <Text
                          className={`text-[15px] ${
                            isCancel ? 'font-medium' : 'font-bold'
                          }`}
                          style={{ color: textColor }}
                          numberOfLines={1}
                        >
                          {btn.text}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
