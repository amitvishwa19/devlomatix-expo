import React from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCrmSocket } from '~/providers/CrmSocketProvider';

let RTCViewComponent = null;
try {
  RTCViewComponent = require('react-native-webrtc').RTCView;
} catch (e) {
  // RTCView native module fallback
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function ActiveCallModal() {
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

  const isVisible = (callStatus === 'calling' || callStatus === 'connected') && !!activeCallSession;

  if (!isVisible || !activeCallSession) return null;

  const { targetName, targetAvatar, callType } = activeCallSession;
  const isVideo = callType === 'video';
  const isConnected = callStatus === 'connected';
  const initial = targetName?.charAt(0)?.toUpperCase() || 'U';

  const hasRemoteVideo = isVideo && remoteStream && isConnected;
  const hasLocalVideo = isVideo && localStream && !isCameraOff;

  return (
    <Modal visible={isVisible} transparent={false} animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-slate-950">
        {/* VIDEO MODE: REMOTE STREAM FULLSCREEN */}
        {hasRemoteVideo && RTCViewComponent ? (
          <View style={StyleSheet.absoluteFill}>
            <RTCViewComponent
              streamURL={remoteStream.toURL()}
              style={StyleSheet.absoluteFill}
              objectFit="cover"
            />
          </View>
        ) : (
          /* AUDIO / CALLING BACKDROP */
          <View className="flex-1 items-center justify-between px-6 py-14">
            {/* Top Info */}
            <View className="items-center mt-6">
              <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 mb-2">
                {isConnected ? (
                  <View
                    key="dot-connected"
                    className="w-2 h-2 rounded-full bg-emerald-400"
                  />
                ) : (
                  <View
                    key="dot-ringing"
                    className="w-2 h-2 rounded-full bg-amber-400"
                  />
                )}
                <Text className="text-[12px] font-bold text-slate-300">
                  {isConnected ? formatDuration(callDuration) : 'Ringing...'}
                </Text>
              </View>

              <Text className="text-[22px] font-extrabold text-white text-center">
                {targetName || 'Team Member'}
              </Text>

              <Text className="text-[13px] text-slate-400 font-medium mt-1">
                {isConnected
                  ? isVideo
                    ? 'Encrypted HD Video Session'
                    : 'Encrypted HD Voice Session'
                  : 'Establishing Connection...'}
              </Text>
            </View>

            {/* Center Avatar Representation */}
            <View className="items-center justify-center my-auto">
              <View className="relative">
                <View className="w-32 h-32 rounded-full border-2 border-indigo-500/40 bg-slate-900 items-center justify-center overflow-hidden shadow-2xl">
                  {targetAvatar ? (
                    <Image source={{ uri: targetAvatar }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Text className="text-5xl font-black text-indigo-400">{initial}</Text>
                  )}
                </View>

                {isMuted && (
                  <View className="absolute -bottom-1 -right-1 p-2 rounded-full bg-rose-600 border-2 border-slate-950 items-center justify-center">
                    <Ionicons name="mic-off" size={14} color="#ffffff" />
                  </View>
                )}
              </View>
            </View>

            <View style={{ height: 60 }} />
          </View>
        )}

        {/* FLOATING LOCAL SELF-VIEW PIP (VIDEO MODE) */}
        {hasLocalVideo && RTCViewComponent && (
          <View
            style={{
              position: 'absolute',
              top: 50,
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
            <RTCViewComponent
              streamURL={localStream.toURL()}
              style={{ flex: 1 }}
              objectFit="cover"
              mirror={true}
            />
          </View>
        )}

        {/* OVERLAY HEADER (VIDEO MODE) */}
        {hasRemoteVideo && (
          <View
            style={{
              position: 'absolute',
              top: 45,
              left: 20,
              right: 140,
              zIndex: 40,
            }}
          >
            <View className="flex-row items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 self-start">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-[12px] font-bold text-white">
                {formatDuration(callDuration)}
              </Text>
              <Text className="text-[11px] text-slate-300 font-semibold truncate max-w-[120px]">
                • {targetName}
              </Text>
            </View>
          </View>
        )}

        {/* BOTTOM CONTROLS TOOLBAR */}
        <View className="absolute bottom-10 left-0 right-0 px-6 items-center z-50">
          <View className="flex-row items-center justify-between w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl px-5 py-3 shadow-2xl">
            {/* Mute Mic */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleMute}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                isMuted ? 'bg-rose-600/30 border border-rose-500' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={20}
                color={isMuted ? '#f43f5e' : '#ffffff'}
              />
            </TouchableOpacity>

            {/* Camera Toggle (Video Call) */}
            {isVideo && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleCamera}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  isCameraOff ? 'bg-rose-600/30 border border-rose-500' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <Ionicons
                  name={isCameraOff ? 'videocam-off' : 'videocam'}
                  size={20}
                  color={isCameraOff ? '#f43f5e' : '#ffffff'}
                />
              </TouchableOpacity>
            )}

            {/* Flip Camera (Video Call) */}
            {isVideo && !isCameraOff && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={switchCamera}
                className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 items-center justify-center"
              >
                <Ionicons name="camera-reverse" size={20} color="#ffffff" />
              </TouchableOpacity>
            )}

            {/* End Call */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={endCall}
              className="w-13 h-13 rounded-full bg-rose-600 items-center justify-center shadow-lg shadow-rose-600/40"
            >
              <Ionicons name="call" size={24} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
