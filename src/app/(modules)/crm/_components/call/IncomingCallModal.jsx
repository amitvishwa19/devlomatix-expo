import React from 'react';
import { Modal, Text, View, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import RingtoneAudioFallback from './RingtoneAudioFallback';

export default function IncomingCallModal() {
  const { palette } = useAppTheme();
  const { callStatus, incomingCallData, acceptCall, rejectCall } = useCrmSocket();

  const isVisible = callStatus === 'incoming' && !!incomingCallData;

  // Pulse animation for avatar ring
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  React.useEffect(() => {
    if (isVisible) {
      pulseScale.value = withRepeat(
        withTiming(1.35, { duration: 1200, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }
  }, [isVisible, pulseScale, pulseOpacity]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (!isVisible || !incomingCallData) return null;

  const { callerName, callerAvatar, callType } = incomingCallData;
  const isVideo = callType === 'video';
  const initial = callerName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Modal visible={isVisible} transparent animationType="slide" statusBarTranslucent>
      <RingtoneAudioFallback />
      <View className="flex-1 items-center justify-between bg-slate-950/95 px-6 py-14">
        {/* Top Header */}
        <View className="items-center mt-6">
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-3">
            <Ionicons name={isVideo ? 'videocam' : 'call'} size={14} color="#818cf8" />
            <Text className="text-[12px] font-bold text-indigo-300">
              Devlomatix CRM • {isVideo ? 'HD Video Call' : 'Voice Call'}
            </Text>
          </View>
          <Text className="text-[20px] font-extrabold text-white text-center">
            {callerName || 'Sales Representative'}
          </Text>
          <Text className="text-[13px] text-slate-400 font-medium mt-1">
            Incoming Real-Time Call...
          </Text>
        </View>

        {/* Center Pulsing Avatar */}
        <View className="items-center justify-center my-auto">
          <View className="relative items-center justify-center">
            {/* Animated Glow Ring */}
            <Animated.View
              style={animatedRingStyle}
              className="absolute w-36 h-36 rounded-full border-2 border-indigo-500/50 bg-indigo-500/20"
            />

            {/* Avatar Surface */}
            <View className="w-28 h-28 rounded-full border-2 border-indigo-400 bg-slate-900 items-center justify-center overflow-hidden shadow-2xl">
              {callerAvatar ? (
                <Image source={{ uri: callerAvatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-4xl font-extrabold text-indigo-400">{initial}</Text>
              )}
            </View>

            {/* Badge Indicator */}
            <View className="absolute bottom-0 right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-950 items-center justify-center shadow-md">
              <Ionicons name={isVideo ? 'videocam' : 'call'} size={16} color="#ffffff" />
            </View>
          </View>
        </View>

        {/* Bottom Call Action Buttons */}
        <View className="w-full flex-row items-center justify-around mb-8">
          {/* Decline */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => rejectCall('declined')}
            className="items-center gap-2"
          >
            <View className="w-16 h-16 rounded-full bg-rose-600 items-center justify-center shadow-lg shadow-rose-600/40">
              <Ionicons name="call" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
            </View>
            <Text className="text-[12px] font-bold text-rose-400">Decline</Text>
          </TouchableOpacity>

          {/* Accept */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={acceptCall}
            className="items-center gap-2"
          >
            <View className="w-16 h-16 rounded-full bg-emerald-600 items-center justify-center shadow-xl shadow-emerald-500/50">
              <Ionicons name={isVideo ? 'videocam' : 'call'} size={28} color="#ffffff" />
            </View>
            <Text className="text-[12px] font-bold text-emerald-400">Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
