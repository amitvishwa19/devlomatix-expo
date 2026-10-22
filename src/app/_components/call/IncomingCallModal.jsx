import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import RingtoneAudioFallback from './RingtoneAudioFallback';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

const CALL_ACTION_MODE_KEY = '@devlomatix:incoming_call_action_mode';

export default function IncomingCallModal() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { callStatus, incomingCallData, acceptCall, rejectCall } = useCrmSocket();

  const isVisible = callStatus === 'incoming' && !!incomingCallData;

  const [actionMode, setActionMode] = useState('swipe'); // 'swipe' | 'buttons'

  // Pulse animation for avatar ring
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  // Drag Slider Configuration
  const trackWidth = Math.min(windowWidth - 48, 350);
  const trackHeight = 72;
  const thumbSize = 56;
  const maxDrag = Math.max(80, (trackWidth - thumbSize) / 2 - 8);
  const threshold = maxDrag * 0.45;

  const panX = useRef(new Animated.Value(0)).current;
  const hasTriggeredRef = useRef(false);
  const hasPassedThresholdRef = useRef(false);

  // Fresh refs to prevent stale closure in panResponder
  const acceptCallRef = useRef(acceptCall);
  acceptCallRef.current = acceptCall;

  const rejectCallRef = useRef(rejectCall);
  rejectCallRef.current = rejectCall;

  const maxDragRef = useRef(maxDrag);
  maxDragRef.current = maxDrag;

  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;

  // Load saved action mode preference
  useEffect(() => {
    AsyncStorage.getItem(CALL_ACTION_MODE_KEY)
      .then((saved) => {
        if (saved === 'swipe' || saved === 'buttons') {
          setActionMode(saved);
        }
      })
      .catch(() => {});
  }, []);

  const handleModeChange = async (mode) => {
    setActionMode(mode);
    try {
      if (HapticsModule?.selectionAsync) {
        HapticsModule.selectionAsync().catch(() => {});
      }
      await AsyncStorage.setItem(CALL_ACTION_MODE_KEY, mode);
    } catch (_) {}
  };

  // Avatar pulse animation
  useEffect(() => {
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

  // Reset and guide hint on visibility change
  useEffect(() => {
    if (isVisible) {
      hasTriggeredRef.current = false;
      hasPassedThresholdRef.current = false;
      panX.setValue(0);

      // Interactive hint animation nudging right then left
      if (actionMode === 'swipe') {
        const hintTimer = setTimeout(() => {
          Animated.sequence([
            Animated.timing(panX, { toValue: 18, duration: 220, useNativeDriver: true }),
            Animated.timing(panX, { toValue: -18, duration: 260, useNativeDriver: true }),
            Animated.spring(panX, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
          ]).start();
        }, 500);

        return () => clearTimeout(hintTimer);
      }
    }
  }, [isVisible, actionMode, panX]);

  const currentXRef = useRef(0);

  const triggerAccept = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    console.log('📞 [IncomingCallModal] Action triggered: ACCEPT');

    try {
      if (HapticsModule?.notificationAsync && HapticsModule?.NotificationFeedbackType) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (_) {}

    Animated.timing(panX, {
      toValue: maxDragRef.current,
      duration: 100,
      useNativeDriver: true,
    }).start();

    if (acceptCallRef.current) {
      acceptCallRef.current();
    } else {
      acceptCall();
    }
  }, [acceptCall]);

  const triggerDecline = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    console.log('📞 [IncomingCallModal] Action triggered: DECLINE');

    try {
      if (HapticsModule?.notificationAsync && HapticsModule?.NotificationFeedbackType) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Warning).catch(() => {});
      }
    } catch (_) {}

    Animated.timing(panX, {
      toValue: -maxDragRef.current,
      duration: 100,
      useNativeDriver: true,
    }).start();

    if (rejectCallRef.current) {
      rejectCallRef.current('declined');
    } else {
      rejectCall('declined');
    }
  }, [rejectCall]);

  const triggerAcceptRef = useRef(triggerAccept);
  triggerAcceptRef.current = triggerAccept;

  const triggerDeclineRef = useRef(triggerDecline);
  triggerDeclineRef.current = triggerDecline;

  // PanResponder for smooth native-driven swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        hasTriggeredRef.current = false;
        hasPassedThresholdRef.current = false;
        currentXRef.current = 0;
        try {
          if (HapticsModule?.selectionAsync) {
            HapticsModule.selectionAsync().catch(() => {});
          }
        } catch (_) {}
      },
      onPanResponderMove: (_, gestureState) => {
        if (hasTriggeredRef.current) return;
        const curMaxDrag = maxDragRef.current;
        const curThreshold = thresholdRef.current;
        const clampedX = Math.max(-curMaxDrag, Math.min(curMaxDrag, gestureState.dx));
        panX.setValue(clampedX);
        currentXRef.current = clampedX;

        // Instant trigger as soon as user slides into the end zone (80% travel)
        if (clampedX >= curMaxDrag * 0.8) {
          triggerAcceptRef.current?.();
          return;
        } else if (clampedX <= -curMaxDrag * 0.8) {
          triggerDeclineRef.current?.();
          return;
        }

        // Haptic feedback bump on passing activation threshold
        if (clampedX >= curThreshold && !hasPassedThresholdRef.current) {
          hasPassedThresholdRef.current = true;
          try {
            if (HapticsModule?.impactAsync && HapticsModule?.ImpactFeedbackStyle) {
              HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Medium).catch(() => {});
            }
          } catch (_) {}
        } else if (clampedX <= -curThreshold && !hasPassedThresholdRef.current) {
          hasPassedThresholdRef.current = true;
          try {
            if (HapticsModule?.impactAsync && HapticsModule?.ImpactFeedbackStyle) {
              HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Medium).catch(() => {});
            }
          } catch (_) {}
        } else if (Math.abs(clampedX) < curThreshold) {
          hasPassedThresholdRef.current = false;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (hasTriggeredRef.current) return;
        const curThreshold = thresholdRef.current;
        const currentX = currentXRef.current;

        const isRight =
          currentX >= curThreshold ||
          gestureState.dx >= curThreshold ||
          (gestureState.dx > 15 && gestureState.vx > 0.2);
        const isLeft =
          currentX <= -curThreshold ||
          gestureState.dx <= -curThreshold ||
          (gestureState.dx < -15 && gestureState.vx < -0.2);

        if (isRight) {
          triggerAcceptRef.current?.();
        } else if (isLeft) {
          triggerDeclineRef.current?.();
        } else {
          currentXRef.current = 0;
          Animated.spring(panX, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: (_, gestureState) => {
        if (hasTriggeredRef.current) return;
        const curThreshold = thresholdRef.current;
        const currentX = currentXRef.current;

        if (currentX >= curThreshold || gestureState?.dx >= curThreshold) {
          triggerAcceptRef.current?.();
        } else if (currentX <= -curThreshold || gestureState?.dx <= -curThreshold) {
          triggerDeclineRef.current?.();
        } else {
          currentXRef.current = 0;
          Animated.spring(panX, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!isVisible || !incomingCallData) return null;

  const { callerName, callerAvatar, callType } = incomingCallData;
  const isVideo = callType === 'video';
  const initial = callerName?.charAt(0)?.toUpperCase() || 'U';

  // Dynamic visual interpolations
  const labelOpacity = panX.interpolate({
    inputRange: [-35, 0, 35],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const greenGlowOpacity = panX.interpolate({
    inputRange: [0, threshold, maxDrag],
    outputRange: [0, 0.4, 0.75],
    extrapolate: 'clamp',
  });

  const redGlowOpacity = panX.interpolate({
    inputRange: [-maxDrag, -threshold, 0],
    outputRange: [0.75, 0.4, 0],
    extrapolate: 'clamp',
  });

  const knobScale = panX.interpolate({
    inputRange: [-maxDrag, -threshold, 0, threshold, maxDrag],
    outputRange: [1.12, 1.07, 1, 1.07, 1.12],
    extrapolate: 'clamp',
  });

  const neutralKnobOpacity = panX.interpolate({
    inputRange: [-threshold * 0.75, 0, threshold * 0.75],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const greenKnobOpacity = panX.interpolate({
    inputRange: [0, threshold * 0.8, maxDrag],
    outputRange: [0, 0.85, 1],
    extrapolate: 'clamp',
  });

  const redKnobOpacity = panX.interpolate({
    inputRange: [-maxDrag, -threshold * 0.8, 0],
    outputRange: [1, 0.85, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={isVisible} transparent animationType="slide" statusBarTranslucent>
      <RingtoneAudioFallback />
      <View
        className="flex-1 items-center justify-between bg-slate-950/95 px-6"
        style={{
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 20) + 16,
        }}
      >
        {/* Top Header */}
        <View className="items-center mt-2">
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-3">
            <Ionicons name={isVideo ? 'videocam' : 'call'} size={14} color="#818cf8" />
            <Text className="text-[12px] font-bold text-indigo-300">
              Devlomatix CRM • {isVideo ? 'HD Video Call' : 'Voice Call'}
            </Text>
          </View>
          <Text className="text-[22px] font-extrabold text-white text-center">
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
            <Reanimated.View
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

        {/* Bottom Call Action Section */}
        <View className="w-full items-center">
          {/* Mode Switcher Pill */}
          <View className="flex-row items-center justify-center p-1 rounded-full bg-white/5 border border-white/10 mb-4 self-center">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleModeChange('swipe')}
              className={`px-3.5 py-1 rounded-full flex-row items-center gap-1.5 ${
                actionMode === 'swipe' ? 'bg-indigo-600 shadow-sm' : 'bg-transparent'
              }`}
            >
              <Ionicons name="swap-horizontal" size={13} color={actionMode === 'swipe' ? '#ffffff' : '#94a3b8'} />
              <Text className={`text-[11px] font-bold ${actionMode === 'swipe' ? 'text-white' : 'text-slate-400'}`}>
                Swipe to Respond
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleModeChange('buttons')}
              className={`px-3.5 py-1 rounded-full flex-row items-center gap-1.5 ${
                actionMode === 'buttons' ? 'bg-indigo-600 shadow-sm' : 'bg-transparent'
              }`}
            >
              <Ionicons name="radio-button-on" size={13} color={actionMode === 'buttons' ? '#ffffff' : '#94a3b8'} />
              <Text className={`text-[11px] font-bold ${actionMode === 'buttons' ? 'text-white' : 'text-slate-400'}`}>
                Buttons
              </Text>
            </TouchableOpacity>
          </View>

          {/* SWIPE MODE SLIDER */}
          {actionMode === 'swipe' ? (
            <View className="w-full items-center">
              <View
                style={{ width: trackWidth, height: trackHeight }}
                className="relative rounded-full bg-slate-900/90 border border-white/15 px-2 flex-row items-center justify-between overflow-hidden shadow-2xl"
              >
                {/* Dynamic Green Glow Layer */}
                <Animated.View
                  pointerEvents="none"
                  style={{ opacity: greenGlowOpacity }}
                  className="absolute inset-0 bg-emerald-600/30"
                />

                {/* Dynamic Red Glow Layer */}
                <Animated.View
                  pointerEvents="none"
                  style={{ opacity: redGlowOpacity }}
                  className="absolute inset-0 bg-rose-600/30"
                />

                {/* Left Decline Target (also directly tappable) */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={triggerDecline}
                  className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 items-center justify-center z-10 shadow-sm"
                >
                  <Ionicons name="call" size={20} color="#f43f5e" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>

                {/* Left Decline Direction Cue */}
                <Animated.View
                  pointerEvents="none"
                  style={{ opacity: labelOpacity }}
                  className="absolute left-16 flex-row items-center gap-1"
                >
                  <Ionicons name="chevron-back" size={13} color="#f87171" />
                  <Text className="text-[11px] font-bold text-rose-400/90 tracking-wide uppercase">Decline</Text>
                </Animated.View>

                {/* Center Draggable Knob */}
                <View pointerEvents="box-none" className="absolute inset-0 items-center justify-center">
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={{
                      width: thumbSize,
                      height: thumbSize,
                      transform: [{ translateX: panX }, { scale: knobScale }],
                    }}
                    className="items-center justify-center rounded-full shadow-2xl shadow-black z-30"
                  >
                    {/* Layer 1: Neutral White Knob */}
                    <Animated.View
                      style={{ opacity: neutralKnobOpacity }}
                      className="absolute inset-0 rounded-full bg-white border-2 border-slate-200 items-center justify-center shadow-lg"
                    >
                      <Ionicons name={isVideo ? 'videocam' : 'call'} size={24} color="#0f172a" />
                    </Animated.View>

                    {/* Layer 2: Glowing Green Answer Knob */}
                    <Animated.View
                      style={{ opacity: greenKnobOpacity }}
                      className="absolute inset-0 rounded-full bg-emerald-500 border-2 border-emerald-300 items-center justify-center shadow-lg shadow-emerald-500/60"
                    >
                      <Ionicons name={isVideo ? 'videocam' : 'call'} size={24} color="#ffffff" />
                    </Animated.View>

                    {/* Layer 3: Glowing Red Decline Knob */}
                    <Animated.View
                      style={{ opacity: redKnobOpacity }}
                      className="absolute inset-0 rounded-full bg-rose-600 border-2 border-rose-300 items-center justify-center shadow-lg shadow-rose-600/60"
                    >
                      <Ionicons
                        name="call"
                        size={24}
                        color="#ffffff"
                        style={{ transform: [{ rotate: '135deg' }] }}
                      />
                    </Animated.View>
                  </Animated.View>
                </View>

                {/* Right Answer Direction Cue */}
                <Animated.View
                  pointerEvents="none"
                  style={{ opacity: labelOpacity }}
                  className="absolute right-16 flex-row items-center gap-1"
                >
                  <Text className="text-[11px] font-bold text-emerald-400/90 tracking-wide uppercase">Answer</Text>
                  <Ionicons name="chevron-forward" size={13} color="#34d399" />
                </Animated.View>

                {/* Right Accept Target (also directly tappable) */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={triggerAccept}
                  className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center z-10 shadow-sm"
                >
                  <Ionicons name={isVideo ? 'videocam' : 'call'} size={20} color="#10b981" />
                </TouchableOpacity>
              </View>

              {/* Helper text */}
              <Text className="text-[11px] text-slate-400 font-medium text-center mt-2.5">
                Swipe right to answer • Swipe left to decline
              </Text>
            </View>
          ) : (
            /* CLASSIC BUTTONS MODE */
            <View className="w-full flex-row items-center justify-around mb-2">
              {/* Decline Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={triggerDecline}
                className="items-center gap-2"
              >
                <View className="w-16 h-16 rounded-full bg-rose-600 items-center justify-center shadow-lg shadow-rose-600/40">
                  <Ionicons name="call" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
                </View>
                <Text className="text-[12px] font-bold text-rose-400">Decline</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={triggerAccept}
                className="items-center gap-2"
              >
                <View className="w-16 h-16 rounded-full bg-emerald-600 items-center justify-center shadow-xl shadow-emerald-500/50">
                  <Ionicons name={isVideo ? 'videocam' : 'call'} size={28} color="#ffffff" />
                </View>
                <Text className="text-[12px] font-bold text-emerald-400">Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
