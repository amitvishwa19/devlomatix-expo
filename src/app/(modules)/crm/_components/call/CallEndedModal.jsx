import React, { useEffect } from 'react';
import { Modal, Text, View, TouchableOpacity, Image, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useCrmSocket } from '~/providers/CrmSocketProvider';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

export default function CallEndedModal() {
  const { callEndNotice, dismissCallEndNotice } = useCrmSocket();

  const isVisible = !!callEndNotice;

  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Trigger subtle iOS warning haptic
      try {
        if (HapticsModule?.notificationAsync && HapticsModule?.NotificationFeedbackType) {
          HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Warning).catch(() => {});
        }
      } catch (_) {}

      // Spring in
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.ease) });

      // Auto dismiss after 3.8 seconds
      const timer = setTimeout(() => {
        dismissCallEndNotice();
      }, 3800);

      return () => clearTimeout(timer);
    } else {
      scale.value = 0.85;
      opacity.value = 0;
    }
  }, [isVisible, dismissCallEndNotice, scale, opacity]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isVisible || !callEndNotice) return null;

  const { title = 'Call Ended', subtitle = 'Call was declined.', targetName, targetAvatar, callType } = callEndNotice;
  const isVideo = callType === 'video';
  const initial = targetName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Modal visible={isVisible} transparent animationType="none" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <Pressable className="absolute inset-0" onPress={dismissCallEndNotice} />
        <Animated.View
          style={animatedCardStyle}
          className="w-full max-w-[320px] rounded-[28px] bg-[#1c1c1e] border border-white/10 px-6 pt-7 pb-6 items-center shadow-2xl shadow-black/90"
        >
          {/* Top Hungup Icon Circle */}
          <View className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/25 items-center justify-center mb-3.5">
            <Ionicons
              name="call"
              size={28}
              color="#f43f5e"
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </View>

          {/* Title */}
          <Text className="text-[19px] font-bold text-white text-center tracking-tight">
            {title}
          </Text>

          {/* Subtitle / Reason */}
          <Text className="text-[14px] text-slate-300 font-medium text-center mt-1 leading-5">
            {subtitle}
          </Text>

          {/* Contact Pill (if target info available) */}
          {targetName ? (
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 mt-3.5">
              {targetAvatar ? (
                <Image
                  source={{ uri: targetAvatar }}
                  className="w-4 h-4 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-4 h-4 rounded-full bg-indigo-500/40 items-center justify-center">
                  <Text className="text-[9px] font-bold text-indigo-200">{initial}</Text>
                </View>
              )}
              <Text className="text-[12px] text-slate-300 font-medium max-w-[180px]" numberOfLines={1}>
                {targetName}
              </Text>
              <Text className="text-[11px] text-slate-500">•</Text>
              <Ionicons
                name={isVideo ? 'videocam' : 'call'}
                size={11}
                color="#94a3b8"
              />
            </View>
          ) : null}

          {/* iOS Dismiss Action Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={dismissCallEndNotice}
            className="w-full mt-6 py-3.5 rounded-2xl bg-white/10 items-center justify-center border border-white/5"
          >
            <Text className="text-[15px] font-semibold text-white">
              Dismiss
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
