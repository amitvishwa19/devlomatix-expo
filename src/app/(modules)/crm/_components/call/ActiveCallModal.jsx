import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Image,
  StyleSheet,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  AppState,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmSocket } from '~/providers/CrmSocketProvider';

let RTCViewComponent = null;
try {
  const webrtc = require('react-native-webrtc');
  RTCViewComponent = webrtc?.RTCView || webrtc?.default?.RTCView || webrtc?.default || null;
} catch (e) {
  // RTCView native module fallback
}

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (e) {
  // Graceful fallback
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const QUICK_NOTE_TAGS = [
  '🔥 High Interest',
  '📄 Send Proposal',
  '⏰ Follow-up Tomorrow',
  '💰 Budget Approved',
  '🤝 Decision Maker',
  '❌ Price Objection',
];

const DIALPAD_KEYS = [
  { num: '1', sub: '' },
  { num: '2', sub: 'ABC' },
  { num: '3', sub: 'DEF' },
  { num: '4', sub: 'GHI' },
  { num: '5', sub: 'JKL' },
  { num: '6', sub: 'MNO' },
  { num: '7', sub: 'PQRS' },
  { num: '8', sub: 'TUV' },
  { num: '9', sub: 'WXYZ' },
  { num: '*', sub: '' },
  { num: '0', sub: '+' },
  { num: '#', sub: '' },
];

export default function ActiveCallModal() {
  const insets = useSafeAreaInsets();
  const {
    callStatus,
    activeCallSession,
    localStream,
    remoteStream,
    callDuration,
    isMuted,
    isCameraOff,
    endCall,
    toggleMute,
    toggleCamera,
    enableCamera,
    switchCamera,
  } = useCrmSocket();

  // In-Call Features State
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [inCallNotes, setInCallNotes] = useState('');
  const [keypadInput, setKeypadInput] = useState('');

  const isVisible = (callStatus === 'calling' || callStatus === 'connected') && !!activeCallSession;

  // Pulse animation for central avatar
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  // Equalizer soundwave bars
  const wave1 = useSharedValue(6);
  const wave2 = useSharedValue(14);
  const wave3 = useSharedValue(22);
  const wave4 = useSharedValue(16);
  const wave5 = useSharedValue(8);

  // Reset in-call state when call ends
  useEffect(() => {
    if (!isVisible) {
      setIsMinimized(false);
      setShowNotes(false);
      setShowKeypad(false);
      setKeypadInput('');
    }
  }, [isVisible]);

  // Audio wave rhythm animation when connected and unmuted
  useEffect(() => {
    if (isVisible && callStatus === 'connected' && !isMuted) {
      pulseScale.value = withRepeat(
        withTiming(1.22, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );

      wave1.value = withRepeat(
        withSequence(withTiming(20, { duration: 250 }), withTiming(6, { duration: 250 })),
        -1,
        true
      );
      wave2.value = withRepeat(
        withSequence(withTiming(8, { duration: 320 }), withTiming(26, { duration: 320 })),
        -1,
        true
      );
      wave3.value = withRepeat(
        withSequence(withTiming(28, { duration: 210 }), withTiming(10, { duration: 210 })),
        -1,
        true
      );
      wave4.value = withRepeat(
        withSequence(withTiming(12, { duration: 280 }), withTiming(24, { duration: 280 })),
        -1,
        true
      );
      wave5.value = withRepeat(
        withSequence(withTiming(22, { duration: 350 }), withTiming(6, { duration: 350 })),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
      wave1.value = 4;
      wave2.value = 4;
      wave3.value = 4;
      wave4.value = 4;
      wave5.value = 4;
    }
  }, [isVisible, callStatus, isMuted, pulseScale, pulseOpacity, wave1, wave2, wave3, wave4, wave5]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const waveStyle1 = useAnimatedStyle(() => ({ height: wave1.value }));
  const waveStyle2 = useAnimatedStyle(() => ({ height: wave2.value }));
  const waveStyle3 = useAnimatedStyle(() => ({ height: wave3.value }));
  const waveStyle4 = useAnimatedStyle(() => ({ height: wave4.value }));
  const waveStyle5 = useAnimatedStyle(() => ({ height: wave5.value }));

  const callType = activeCallSession?.callType;
  const isVideo = callType === 'video';
  const isConnected = callStatus === 'connected';

  const hasRemoteVideo =
    isVideo &&
    remoteStream &&
    isConnected &&
    (typeof remoteStream.toURL === 'function' ? !!remoteStream.toURL() : true);

  const hasLocalVideo =
    isVideo &&
    localStream &&
    !isCameraOff &&
    (typeof localStream.toURL === 'function' ? !!localStream.toURL() : true) &&
    (typeof localStream.getVideoTracks === 'function' ? localStream.getVideoTracks().length > 0 : true);

  useEffect(() => {
    if (isVisible && isVideo) {
      console.log('🎥 [ActiveCallModal:PIP_DEBUG]', {
        hasLocalVideo,
        isCameraOff,
        localStreamUrl: localStream?.toURL?.(),
        videoTracks: localStream?.getVideoTracks?.()?.map((t) => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
        remoteStreamUrl: remoteStream?.toURL?.(),
        hasRemoteVideo,
      });
    }
  }, [isVisible, isVideo, hasLocalVideo, isCameraOff, localStream, remoteStream]);

  // When returning to app from Android Settings, auto-check and acquire camera if permitted
  useEffect(() => {
    if (!isVisible || !isVideo) return;
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const videoTracks = localStream && typeof localStream.getVideoTracks === 'function' ? localStream.getVideoTracks() : [];
        if (videoTracks.length === 0) {
          console.log('📱 [ActiveCallModal] Returned to foreground, re-checking camera permission...');
          enableCamera();
        }
      }
    });
    return () => subscription.remove();
  }, [isVisible, isVideo, localStream, enableCamera]);

  if (!isVisible || !activeCallSession) return null;

  const { targetName, targetAvatar, contactOrDealInfo } = activeCallSession;
  const initial = targetName?.charAt(0)?.toUpperCase() || 'U';

  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 16;
  const safeTop = Math.max(insets.top, 24) + 10;

  const dealContext =
    contactOrDealInfo?.title ||
    contactOrDealInfo?.dealTitle ||
    contactOrDealInfo?.companyName ||
    contactOrDealInfo?.email ||
    '';

  const dealStage =
    contactOrDealInfo?.stage ||
    contactOrDealInfo?.leadStatus ||
    '';

  const handleToggleMute = () => {
    try {
      if (HapticsModule?.impactAsync) {
        HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle?.Light ?? 'light').catch(() => {});
      }
    } catch (_) {}
    toggleMute();
  };

  const handleToggleSpeaker = () => {
    try {
      if (HapticsModule?.impactAsync) {
        HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle?.Light ?? 'light').catch(() => {});
      }
    } catch (_) {}
    setIsSpeakerOn((prev) => !prev);
  };

  const handleEndCall = () => {
    try {
      if (HapticsModule?.notificationAsync && HapticsModule?.NotificationFeedbackType) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Warning).catch(() => {});
      }
    } catch (_) {}
    endCall(inCallNotes);
  };

  const handleDialpadPress = (val) => {
    try {
      if (HapticsModule?.impactAsync) {
        HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle?.Light ?? 'light').catch(() => {});
      }
    } catch (_) {}
    setKeypadInput((prev) => prev + val);
  };

  const handleAddQuickTag = (tag) => {
    try {
      if (HapticsModule?.selectionAsync) {
        HapticsModule.selectionAsync().catch(() => {});
      }
    } catch (_) {}
    setInCallNotes((prev) => (prev ? `${prev}\n• ${tag}` : `• ${tag}`));
  };

  // ============================================================
  // 1. MINIMIZED FLOATING CALL CAPSULE (MULTITASKING)
  // ============================================================
  if (isMinimized) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: Math.max(insets.top, 24) + 8,
          left: 12,
          right: 12,
          zIndex: 99999,
          elevation: 999,
        }}
      >
        <Pressable
          onPress={() => setIsMinimized(false)}
          className="flex-row items-center justify-between rounded-full bg-slate-900/95 border border-indigo-500/40 px-3.5 py-2.5 shadow-2xl"
          style={{
            shadowColor: '#6366f1',
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 25,
          }}
        >
          {/* Left: Avatar + Live Indicator + Caller Info */}
          <View className="flex-row items-center gap-x-2.5 flex-1 mr-2">
            <View className="relative">
              <View className="w-8 h-8 rounded-full bg-slate-800 border border-indigo-400/50 items-center justify-center overflow-hidden">
                {targetAvatar ? (
                  <Image source={{ uri: targetAvatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-xs font-black text-indigo-400">{initial}</Text>
                )}
              </View>
              <View
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900"
                style={{ backgroundColor: isConnected ? '#10b981' : '#f59e0b' }}
              />
            </View>

            <View className="flex-1">
              <Text className="text-[12px] font-extrabold text-white" numberOfLines={1}>
                {targetName || 'Team Member'}
              </Text>
              <View className="flex-row items-center gap-x-1.5">
                <Text className="text-[10px] font-bold text-emerald-400">
                  {isConnected ? formatDuration(callDuration) : 'Connecting...'}
                </Text>
                {inCallNotes ? (
                  <Text className="text-[9px] font-bold text-amber-400">📝 Notes</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Right: Quick Action Controls */}
          <View className="flex-row items-center gap-x-1.5">
            {/* Quick Mute Toggle */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleToggleMute}
              className={`w-8 h-8 rounded-full items-center justify-center border ${
                isMuted ? 'bg-rose-500/30 border-rose-500' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={14}
                color={isMuted ? '#f43f5e' : '#ffffff'}
              />
            </TouchableOpacity>

            {/* Quick End Call */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleEndCall}
              className="w-8 h-8 rounded-full bg-rose-600 items-center justify-center shadow-md shadow-rose-600/50"
            >
              <Ionicons
                name="call"
                size={14}
                color="#ffffff"
                style={{ transform: [{ rotate: '135deg' }] }}
              />
            </TouchableOpacity>

            {/* Expand Icon */}
            <View className="w-6 h-6 items-center justify-center ml-0.5">
              <Ionicons name="expand-outline" size={15} color="#94a3b8" />
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  // ============================================================
  // 2. FULLSCREEN ACTIVE CALL MODAL
  // ============================================================
  return (
    <Modal
      visible={isVisible && !isMinimized}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-slate-950">
        {/* ============================================================ */}
        {/* VIDEO MODE: FULLSCREEN REMOTE STREAM + FLOATING LOCAL PIP     */}
        {/* ============================================================ */}
        {isVideo ? (
          <View style={StyleSheet.absoluteFill}>
            {/* Remote Video Stream or Waiting Screen */}
            {hasRemoteVideo && RTCViewComponent && remoteStream?.toURL?.() ? (
              <RTCViewComponent
                streamURL={remoteStream.toURL()}
                style={StyleSheet.absoluteFill}
                objectFit="cover"
                zOrder={0}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-slate-950 px-6">
                <View className="w-28 h-28 rounded-full border-2 border-indigo-500/50 bg-slate-900 items-center justify-center overflow-hidden mb-4 shadow-2xl">
                  {targetAvatar ? (
                    <Image source={{ uri: targetAvatar }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Text className="text-4xl font-black text-indigo-400">{initial}</Text>
                  )}
                </View>
                <Text className="text-xl font-bold text-white mb-1" numberOfLines={1}>{targetName}</Text>
                <Text className="text-xs text-indigo-300 font-semibold">
                  {isConnected ? 'Connecting video...' : 'Calling...'}
                </Text>
              </View>
            )}

            {/* Video Top Controls Overlay */}
            <View
              style={{
                position: 'absolute',
                top: safeTop,
                left: 16,
                right: 16,
                zIndex: 40,
              }}
              className="flex-row items-center justify-between"
            >
              {/* Minimize Action */}
              <TouchableOpacity
                onPress={() => setIsMinimized(true)}
                activeOpacity={0.75}
                className="w-10 h-10 rounded-full bg-slate-950/70 border border-white/10 items-center justify-center shadow-lg"
              >
                <Ionicons name="chevron-down" size={20} color="#ffffff" />
              </TouchableOpacity>

              {/* Status Pill */}
              <View className="flex-row items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-full border border-white/10">
                <View className="w-2 h-2 rounded-full bg-emerald-400" />
                <Text className="text-[12px] font-extrabold text-white">
                  {formatDuration(callDuration)}
                </Text>
                <Text className="text-[11px] text-slate-300 font-semibold" numberOfLines={1}>
                  • {targetName}
                </Text>
              </View>

              {/* In-Call Notes Toggle */}
              <TouchableOpacity
                onPress={() => setShowNotes(true)}
                activeOpacity={0.75}
                className="w-10 h-10 rounded-full bg-slate-950/70 border border-white/10 items-center justify-center shadow-lg relative"
              >
                <Ionicons name="document-text-outline" size={18} color="#ffffff" />
                {inCallNotes ? (
                  <View className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
                ) : null}
              </TouchableOpacity>
            </View>

            {/* Floating Local Self-View PIP */}
            {!isCameraOff && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={hasLocalVideo ? switchCamera : enableCamera}
                style={{
                  position: 'absolute',
                  top: safeTop + 54,
                  right: 16,
                  width: 105,
                  height: 150,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: hasLocalVideo ? '#818cf8' : '#f59e0b',
                  backgroundColor: hasLocalVideo ? 'transparent' : '#0f172a',
                  elevation: 25,
                  zIndex: 50,
                }}
              >
                {hasLocalVideo && RTCViewComponent && localStream?.toURL?.() ? (
                  <RTCViewComponent
                    key={localStream.toURL()}
                    streamURL={localStream.toURL()}
                    style={{ width: 105, height: 150 }}
                    objectFit="cover"
                    mirror={true}
                    zOrder={Platform.OS === 'android' ? 2 : 1}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-slate-900 p-2">
                    <Ionicons name="videocam-outline" size={26} color="#f59e0b" />
                    <Text className="text-[10px] font-bold text-slate-200 text-center mt-1">
                      {!localStream
                        ? 'Connecting...'
                        : localStream?.getVideoTracks?.()?.length === 0
                        ? 'Permission Needed'
                        : 'Starting Camera...'}
                    </Text>
                    <View className="mt-2 px-2 py-1 rounded-full bg-indigo-600 active:bg-indigo-700 shadow-sm flex-row items-center gap-1">
                      <Ionicons name="lock-open-outline" size={10} color="#ffffff" />
                      <Text className="text-[9px] font-bold text-white text-center">
                        Allow Camera
                      </Text>
                    </View>
                  </View>
                )}
                {/* Camera switch indicator badge */}
                {hasLocalVideo ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: 10,
                      padding: 3,
                    }}
                  >
                    <Ionicons name="camera-reverse-outline" size={13} color="#ffffff" />
                  </View>
                ) : null}
              </TouchableOpacity>
            )}

            {/* Bottom Controls Overlay (Video Mode) */}
            <View
              style={{
                position: 'absolute',
                bottom: safeBottom,
                left: 0,
                right: 0,
                zIndex: 100,
                elevation: 30,
              }}
              className="items-center px-6"
            >
              <View className="flex-row items-center justify-around w-full max-w-sm bg-slate-900/90 border border-slate-700/60 rounded-3xl px-4 py-3.5 shadow-2xl">
                {/* Mute Mic */}
                <View className="items-center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleToggleMute}
                    style={{
                      width: 50,
                      height: 50,
                      backgroundColor: isMuted ? '#f43f5e' : '#1e293b',
                      borderColor: isMuted ? '#f43f5e' : '#334155',
                      borderWidth: 1,
                    }}
                    className="rounded-full items-center justify-center shadow-md"
                  >
                    <Ionicons
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={22}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                  <Text className="text-[10px] font-bold mt-1 text-slate-300">
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Text>
                </View>

                {/* Camera Toggle */}
                <View className="items-center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={toggleCamera}
                    style={{
                      width: 50,
                      height: 50,
                      backgroundColor: isCameraOff ? '#f43f5e' : '#1e293b',
                      borderColor: isCameraOff ? '#f43f5e' : '#334155',
                      borderWidth: 1,
                    }}
                    className="rounded-full items-center justify-center shadow-md"
                  >
                    <Ionicons
                      name={isCameraOff ? 'videocam-off' : 'videocam'}
                      size={22}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                  <Text className="text-[10px] font-bold mt-1 text-slate-300">
                    Camera
                  </Text>
                </View>

                {/* Flip Camera */}
                {!isCameraOff && (
                  <View className="items-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={switchCamera}
                      style={{
                        width: 50,
                        height: 50,
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderWidth: 1,
                      }}
                      className="rounded-full items-center justify-center shadow-md"
                    >
                      <Ionicons name="camera-reverse" size={22} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-bold mt-1 text-slate-300">
                      Flip
                    </Text>
                  </View>
                )}

                {/* End Call */}
                <View className="items-center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleEndCall}
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: '#e11d48',
                      shadowColor: '#e11d48',
                      shadowOpacity: 0.5,
                      shadowRadius: 10,
                      elevation: 8,
                    }}
                    className="rounded-full items-center justify-center"
                  >
                    <Ionicons
                      name="call"
                      size={26}
                      color="#ffffff"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                  </TouchableOpacity>
                  <Text className="text-[10px] font-bold mt-1 text-rose-400">
                    End Call
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ============================================================ */
          /* AUDIO / VOICE MODE: CLEAN SAFE-AREA VERTICAL FLOW            */
          /* ============================================================ */
          <View
            className="flex-1 justify-between px-5"
            style={{
              paddingTop: safeTop,
              paddingBottom: safeBottom,
            }}
          >
            {/* 1. TOP HEADER BAR: Minimize • Connection & Security • Notes/Keypad */}
            <View className="w-full">
              <View className="flex-row items-center justify-between">
                {/* Minimize Button */}
                <TouchableOpacity
                  onPress={() => setIsMinimized(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-sm"
                >
                  <Ionicons name="chevron-down" size={17} color="#cbd5e1" />
                  <Text className="text-[11px] font-bold text-slate-300">Minimize</Text>
                </TouchableOpacity>

                {/* Encrypted HD Quality Pill */}
                <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-sm">
                  <Ionicons name="lock-closed" size={11} color="#10b981" />
                  <Text className="text-[10px] font-extrabold text-slate-300 tracking-wider uppercase">
                    HD Voice • 256-Bit
                  </Text>
                </View>

                {/* Dialpad Toggle */}
                <TouchableOpacity
                  onPress={() => setShowKeypad((prev) => !prev)}
                  activeOpacity={0.7}
                  className={`w-9 h-9 rounded-full items-center justify-center border shadow-sm ${
                    showKeypad ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900/90 border-slate-700/70'
                  }`}
                >
                  <Ionicons
                    name={showKeypad ? 'keypad' : 'keypad-outline'}
                    size={17}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>

              {/* Status Duration Badge */}
              <View className="items-center mt-3">
                <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 mb-2">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isConnected ? '#10b981' : '#f59e0b' }}
                  />
                  <Text className="text-[12px] font-extrabold text-slate-200">
                    {isConnected ? formatDuration(callDuration) : 'Establishing Link...'}
                  </Text>
                </View>

                {/* Contact Name */}
                <Text
                  className="text-[24px] font-black text-white text-center tracking-tight max-w-[280px]"
                  numberOfLines={1}
                >
                  {targetName || 'Team Member'}
                </Text>

                {/* Deal Context / Stage Preview */}
                {dealContext ? (
                  <View className="flex-row items-center gap-1 mt-1 px-3 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30">
                    <Ionicons name="briefcase-outline" size={11} color="#a5b4fc" />
                    <Text className="text-[11px] font-semibold text-indigo-200" numberOfLines={1}>
                      {dealContext} {dealStage ? `• ${dealStage}` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[12px] text-slate-400 font-medium mt-0.5">
                    Devlomatix Sales • Direct Line
                  </Text>
                )}
              </View>
            </View>

            {/* 2. CENTER CONTENT: AVATAR + SOUNDWAVE OR DIALPAD */}
            {showKeypad ? (
              /* INTERACTIVE DTMF KEYPAD */
              <View className="my-auto w-full max-w-xs self-center bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-2xl">
                {/* Number Readout */}
                <View className="h-10 items-center justify-center border-b border-slate-800 mb-3 px-2">
                  <Text className="text-xl font-bold text-white tracking-widest" numberOfLines={1}>
                    {keypadInput || 'Enter Extension'}
                  </Text>
                </View>

                {/* Keypad Grid */}
                <View className="flex-row flex-wrap justify-between gap-y-2.5">
                  {DIALPAD_KEYS.map((k) => (
                    <TouchableOpacity
                      key={k.num}
                      activeOpacity={0.65}
                      onPress={() => handleDialpadPress(k.num)}
                      className="w-[29%] h-12 rounded-2xl bg-slate-800/90 border border-slate-700/60 items-center justify-center"
                    >
                      <Text className="text-base font-black text-white leading-none">{k.num}</Text>
                      {k.sub ? (
                        <Text className="text-[8px] font-bold text-slate-400 tracking-tighter uppercase mt-0.5">
                          {k.sub}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Clear / Hide Row */}
                <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                  <TouchableOpacity
                    onPress={() => setKeypadInput('')}
                    activeOpacity={0.7}
                    className="px-3 py-1"
                  >
                    <Text className="text-xs font-bold text-slate-400">Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowKeypad(false)}
                    activeOpacity={0.7}
                    className="px-3 py-1"
                  >
                    <Text className="text-xs font-bold text-indigo-400">Hide Keypad</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* AVATAR + LIVE EQUALIZER SOUNDWAVE */
              <View className="items-center justify-center my-auto">
                <View className="relative items-center justify-center">
                  {/* Glowing Pulse Aura (Pure style to avoid css-interop animation upgrade warning) */}
                  {isConnected && !isMuted ? (
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          width: 176,
                          height: 176,
                          borderRadius: 9999,
                          borderWidth: 2,
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                        animatedPulseStyle,
                      ]}
                    />
                  ) : null}

                  {/* Contact Avatar Circle */}
                  <View className="w-32 h-32 rounded-full border-2 border-indigo-500/50 bg-slate-900 items-center justify-center overflow-hidden shadow-2xl">
                    {targetAvatar ? (
                      <Image source={{ uri: targetAvatar }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Text className="text-5xl font-black text-indigo-400">{initial}</Text>
                    )}
                  </View>

                  {/* Muted Badge on Avatar */}
                  {isMuted && (
                    <View className="absolute -bottom-1 -right-1 p-2 rounded-full bg-rose-600 border-2 border-slate-950 items-center justify-center shadow-lg">
                      <Ionicons name="mic-off" size={14} color="#ffffff" />
                    </View>
                  )}
                </View>

                {/* Rhythmic Voice Wave Equalizer (Pure styles on Animated.View to avoid css-interop warning) */}
                <View className="mt-6 flex-row items-center justify-center gap-1.5 h-8">
                  {isMuted ? (
                    <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40">
                      <Ionicons name="mic-off" size={12} color="#f43f5e" />
                      <Text className="text-[11px] font-bold text-rose-300">Microphone Muted</Text>
                    </View>
                  ) : isConnected ? (
                    <View className="flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-sm">
                      <Animated.View
                        style={[
                          { width: 4, borderRadius: 9999, backgroundColor: '#34d399' },
                          waveStyle1,
                        ]}
                      />
                      <Animated.View
                        style={[
                          { width: 4, borderRadius: 9999, backgroundColor: '#6ee7b7' },
                          waveStyle2,
                        ]}
                      />
                      <Animated.View
                        style={[
                          { width: 4, borderRadius: 9999, backgroundColor: '#818cf8' },
                          waveStyle3,
                        ]}
                      />
                      <Animated.View
                        style={[
                          { width: 4, borderRadius: 9999, backgroundColor: '#6ee7b7' },
                          waveStyle4,
                        ]}
                      />
                      <Animated.View
                        style={[
                          { width: 4, borderRadius: 9999, backgroundColor: '#34d399' },
                          waveStyle5,
                        ]}
                      />
                      <Text className="text-[11px] font-extrabold text-slate-300 ml-1">Live Audio</Text>
                    </View>
                  ) : (
                    <Text className="text-[11px] font-medium text-slate-500">Ringing client device...</Text>
                  )}
                </View>
              </View>
            )}

            {/* 3. BOTTOM CONTROLS DOCK: Mute • Speaker • Notes • Keypad + Large End Call */}
            <View
              className="w-full items-center"
              style={{
                zIndex: 100,
                elevation: 30,
              }}
            >
              <View className="w-full max-w-sm bg-slate-900/90 border border-slate-700/60 rounded-3xl p-4 shadow-2xl">
                {/* 4 Feature Action Buttons Row */}
                <View className="flex-row items-center justify-around mb-3">
                  {/* Mute Button */}
                  <View className="items-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggleMute}
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: isMuted ? '#f43f5e' : '#1e293b',
                        borderColor: isMuted ? '#f43f5e' : '#334155',
                        borderWidth: 1.5,
                      }}
                      className="rounded-2xl items-center justify-center shadow-md"
                    >
                      <Ionicons
                        name={isMuted ? 'mic-off' : 'mic'}
                        size={24}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-bold mt-1.5 text-slate-300">
                      {isMuted ? 'Muted' : 'Mute'}
                    </Text>
                  </View>

                  {/* Speaker Button */}
                  <View className="items-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggleSpeaker}
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: isSpeakerOn ? '#3b82f6' : '#1e293b',
                        borderColor: isSpeakerOn ? '#3b82f6' : '#334155',
                        borderWidth: 1.5,
                      }}
                      className="rounded-2xl items-center justify-center shadow-md"
                    >
                      <Ionicons
                        name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                        size={24}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-bold mt-1.5 text-slate-300">
                      {isSpeakerOn ? 'Speaker' : 'Audio'}
                    </Text>
                  </View>

                  {/* Notes Button */}
                  <View className="items-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowNotes(true)}
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: inCallNotes ? '#4f46e5' : '#1e293b',
                        borderColor: inCallNotes ? '#818cf8' : '#334155',
                        borderWidth: 1.5,
                      }}
                      className="rounded-2xl items-center justify-center shadow-md relative"
                    >
                      <Ionicons name="document-text-outline" size={24} color="#ffffff" />
                      {inCallNotes ? (
                        <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                      ) : null}
                    </TouchableOpacity>
                    <Text className="text-[10px] font-bold mt-1.5 text-slate-300">
                      Notes
                    </Text>
                  </View>

                  {/* Keypad Toggle Button */}
                  <View className="items-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowKeypad((prev) => !prev)}
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: showKeypad ? '#4f46e5' : '#1e293b',
                        borderColor: showKeypad ? '#818cf8' : '#334155',
                        borderWidth: 1.5,
                      }}
                      className="rounded-2xl items-center justify-center shadow-md"
                    >
                      <Ionicons name="keypad-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-[10px] font-bold mt-1.5 text-slate-300">
                      Keypad
                    </Text>
                  </View>
                </View>

                {/* Large Disconnect / End Call Bar */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleEndCall}
                  style={{
                    backgroundColor: '#e11d48',
                    shadowColor: '#e11d48',
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                  className="w-full h-13 rounded-2xl flex-row items-center justify-center gap-x-2 py-3"
                >
                  <Ionicons
                    name="call"
                    size={22}
                    color="#ffffff"
                    style={{ transform: [{ rotate: '135deg' }] }}
                  />
                  <Text className="text-sm font-black text-white tracking-wide uppercase">
                    End Call
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* 4. IN-CALL LIVE NOTES BOTTOM SHEET                           */}
        {/* ============================================================ */}
        <Modal
          visible={showNotes}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNotes(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-end bg-black/70"
          >
            <View
              className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5"
              style={{
                paddingBottom: Math.max(insets.bottom, 20) + 16,
                maxHeight: '80%',
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-800">
                <View>
                  <Text className="text-base font-extrabold text-white">Live Call Scratchpad</Text>
                  <Text className="text-[11px] text-slate-400 font-medium">
                    Auto-attaches to {targetName}'s CRM DCR Summary
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowNotes(false)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600"
                >
                  <Text className="text-xs font-bold text-white">Done</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Tags Scroll */}
              <View className="my-3">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Tags (Tap to add)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2">
                  {QUICK_NOTE_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => handleAddQuickTag(tag)}
                      activeOpacity={0.7}
                      className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700"
                    >
                      <Text className="text-[11px] font-bold text-slate-200">{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Note Text Area */}
              <TextInput
                value={inCallNotes}
                onChangeText={setInCallNotes}
                placeholder="Type real-time takeaways, questions, pricing discussed..."
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                className="w-full h-32 rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-slate-100 text-[13px] leading-5"
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </Modal>
  );
}
