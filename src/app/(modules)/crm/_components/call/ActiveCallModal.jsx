import React, { useState } from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmSocket } from '~/providers/CrmSocketProvider';

let RTCViewComponent = null;
try {
  RTCViewComponent = require('react-native-webrtc').RTCView;
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
    switchCamera,
  } = useCrmSocket();

  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const isVisible = (callStatus === 'calling' || callStatus === 'connected') && !!activeCallSession;

  if (!isVisible || !activeCallSession) return null;

  const { targetName, targetAvatar, callType } = activeCallSession;
  const isVideo = callType === 'video';
  const isConnected = callStatus === 'connected';
  const initial = targetName?.charAt(0)?.toUpperCase() || 'U';

  const hasRemoteVideo = isVideo && remoteStream && isConnected;
  const hasLocalVideo = isVideo && localStream && !isCameraOff;

  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 20;
  const safeTop = Math.max(insets.top, 24) + 12;

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
    endCall();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-slate-950">
        {/* ============================================================ */}
        {/* VIDEO MODE: FULLSCREEN REMOTE STREAM                         */}
        {/* ============================================================ */}
        {hasRemoteVideo && RTCViewComponent ? (
          <View style={StyleSheet.absoluteFill}>
            <RTCViewComponent
              streamURL={remoteStream.toURL()}
              style={StyleSheet.absoluteFill}
              objectFit="cover"
            />

            {/* Video Overlay Header */}
            <View
              style={{
                position: 'absolute',
                top: safeTop,
                left: 20,
                right: 140,
                zIndex: 40,
              }}
            >
              <View className="flex-row items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 self-start">
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <Text className="text-[13px] font-bold text-white">
                  {formatDuration(callDuration)}
                </Text>
                <Text
                  className="text-[12px] text-slate-300 font-semibold"
                  numberOfLines={1}
                >
                  • {targetName}
                </Text>
              </View>
            </View>

            {/* Floating Local Self-View PIP */}
            {isVideo && !isCameraOff && (
              <View
                style={{
                  position: 'absolute',
                  top: safeTop,
                  right: 18,
                  width: 105,
                  height: 150,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: '#818cf8',
                  backgroundColor: '#0f172a',
                  elevation: 20,
                  zIndex: 50,
                }}
              >
                {hasLocalVideo && RTCViewComponent ? (
                  <RTCViewComponent
                    streamURL={localStream.toURL()}
                    style={{ flex: 1 }}
                    objectFit="cover"
                    mirror={true}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-slate-900 p-2">
                    <Ionicons name="videocam" size={24} color="#818cf8" />
                    <Text className="text-[10px] font-bold text-slate-300 text-center mt-1">You</Text>
                  </View>
                )}
              </View>
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
              <View className="flex-row items-center justify-around w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl px-4 py-3.5 shadow-2xl">
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
            className="flex-1 justify-between px-6"
            style={{
              paddingTop: safeTop,
              paddingBottom: safeBottom,
            }}
          >
            {/* Top Info Header */}
            <View className="items-center mt-2">
              <View className="flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 mb-3 shadow-sm">
                {isConnected ? (
                  <View
                    key="dot-connected"
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                  />
                ) : (
                  <View
                    key="dot-ringing"
                    className="w-2.5 h-2.5 rounded-full bg-amber-400"
                  />
                )}
                <Text className="text-[12px] font-bold text-slate-200">
                  {isConnected ? formatDuration(callDuration) : 'Connecting...'}
                </Text>
              </View>

              <Text className="text-[26px] font-black text-white text-center tracking-tight">
                {targetName || 'Team Member'}
              </Text>

              <Text className="text-[13px] text-slate-400 font-medium mt-1">
                {isConnected
                  ? isVideo
                    ? 'Video Session Active (Voice Fallback)'
                    : 'Encrypted HD Voice Session'
                  : 'Establishing Secure Audio Bridge...'}
              </Text>
            </View>

            {/* Center Avatar Representation */}
            <View className="items-center justify-center my-auto">
              <View className="relative items-center justify-center">
                <View className="w-36 h-36 rounded-full border-2 border-indigo-500/40 bg-slate-900 items-center justify-center overflow-hidden shadow-2xl">
                  {targetAvatar ? (
                    <Image source={{ uri: targetAvatar }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Text className="text-5xl font-black text-indigo-400">{initial}</Text>
                  )}
                </View>

                {isMuted && (
                  <View className="absolute -bottom-1 -right-1 p-2.5 rounded-full bg-rose-600 border-2 border-slate-950 items-center justify-center shadow-lg">
                    <Ionicons name="mic-off" size={16} color="#ffffff" />
                  </View>
                )}
              </View>
            </View>

            {/* Bottom Controls Toolbar: Explicit Natural Flow with Safe-Area Padding */}
            <View
              className="w-full items-center"
              style={{
                zIndex: 100,
                elevation: 30,
              }}
            >
              <View
                className="flex-row items-center justify-around w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl px-5 py-4 shadow-2xl"
              >
                {/* 1. Mute / Unmute Mic Button */}
                <View className="items-center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleToggleMute}
                    style={{
                      width: 58,
                      height: 58,
                      backgroundColor: isMuted ? '#f43f5e' : '#1e293b',
                      borderColor: isMuted ? '#f43f5e' : '#334155',
                      borderWidth: 1.5,
                    }}
                    className="rounded-full items-center justify-center shadow-lg"
                  >
                    <Ionicons
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={26}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                  <Text className="text-[11px] font-bold mt-2 text-slate-300">
                    {isMuted ? 'Muted' : 'Mute'}
                  </Text>
                </View>

                {/* 2. Speaker Toggle Button */}
                <View className="items-center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleToggleSpeaker}
                    style={{
                      width: 58,
                      height: 58,
                      backgroundColor: isSpeakerOn ? '#3b82f6' : '#1e293b',
                      borderColor: isSpeakerOn ? '#3b82f6' : '#334155',
                      borderWidth: 1.5,
                    }}
                    className="rounded-full items-center justify-center shadow-lg"
                  >
                    <Ionicons
                      name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                      size={26}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                  <Text className="text-[11px] font-bold mt-2 text-slate-300">
                    {isSpeakerOn ? 'Speaker' : 'Audio'}
                  </Text>
                </View>

                {/* 3. Disconnect / End Call Button */}
                <View className="items-center">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleEndCall}
                    style={{
                      width: 62,
                      height: 62,
                      backgroundColor: '#e11d48',
                      shadowColor: '#e11d48',
                      shadowOpacity: 0.6,
                      shadowRadius: 12,
                      elevation: 10,
                    }}
                    className="rounded-full items-center justify-center"
                  >
                    <Ionicons
                      name="call"
                      size={28}
                      color="#ffffff"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                  </TouchableOpacity>
                  <Text className="text-[11px] font-bold mt-2 text-rose-400">
                    Disconnect
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
