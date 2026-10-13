import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Platform, Alert, Vibration } from 'react-native';
import Constants from 'expo-constants';

// Safely resolve native modules to prevent crashes if dev client hasn't been rebuilt yet
let AudioModule = null;
try {
  AudioModule = require('expo-av').Audio;
} catch (e) {
  // ExponentAV native module not compiled into current binary
}

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (e) {
  // Haptics native module not compiled into current binary
}

import { getSession } from '~/utils/authStorage';
import { resolveWorkspaceId } from '~/utils/workspace';
import { WebRtcClient } from '~/lib/webrtc/webrtc-client';
import { socket_server_url } from '~/utils/constants';

export const CrmSocketContext = createContext(null);

export const useCrmSocket = () => {
  const context = useContext(CrmSocketContext);
  if (!context) {
    throw new Error('useCrmSocket must be used within a CrmSocketProvider');
  }
  return context;
};

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_SERVER) {
    return process.env.EXPO_PUBLIC_SOCKET_SERVER.replace(/\/+$/, '');
  }

  // 1. Try to detect Metro bundler host IP from expo-constants
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5001`;
    }
  }

  // 2. Fallback to configured socket_server_url if non-localhost
  if (socket_server_url && !socket_server_url.includes('localhost') && !socket_server_url.includes('127.0.0.1')) {
    return socket_server_url.replace(/\/+$/, '');
  }

  // 3. Fallback to host machine Wi-Fi LAN IP
  return 'http://192.168.29.31:5001';
};

export function CrmSocketProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);

  const currentUserId = currentUser?.id || currentUser?.userId || currentUser?._id;
  const currentUserName = currentUser?.displayName || currentUser?.name || currentUser?.username || 'Mobile Rep';
  const currentUserAvatar = currentUser?.avatar || currentUser?.image || null;
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Call states: 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  const [callStatus, setCallStatus] = useState('idle');
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [activeCallSession, setActiveCallSession] = useState(null);
  const [postCallRecord, setPostCallRecord] = useState(null);

  // Audio/Video control states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Media Streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const webrtcClientRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const soundRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const hapticIntervalRef = useRef(null);
  const activeCallSessionRef = useRef(null);
  const callStatusRef = useRef('idle');
  const callDurationRef = useRef(0);

  useEffect(() => {
    activeCallSessionRef.current = activeCallSession;
  }, [activeCallSession]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  // 1. Resolve active user session & workspace (checks periodically if user logs in after launch)
  useEffect(() => {
    let isMounted = true;
    async function checkSessionAndWs() {
      try {
        const session = await getSession();
        if (isMounted && session?.user) {
          const u = session.user;
          setCurrentUser((prev) => {
            const prevId = prev?.id || prev?.userId || prev?._id;
            const newId = u?.id || u?.userId || u?._id;
            return prevId !== newId ? u : prev;
          });
        }
        const ws = await resolveWorkspaceId();
        if (isMounted && ws) {
          setWorkspaceId(ws);
        }
      } catch (e) {
        console.warn('[CRM_SOCKET] Could not resolve session or workspaceId:', e?.message);
      }
    }

    checkSessionAndWs();
    const interval = setInterval(checkSessionAndWs, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Ringtone & Audio Tone Controls
  const stopRingtone = useCallback(async () => {
    try {
      Vibration.cancel();
    } catch (_) {}
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
  }, []);

  const startRingtone = useCallback(async (type) => {
    await stopRingtone();

    // 1. Native Vibration (Persistent ring cadence)
    if (type === 'incoming') {
      try {
        Vibration.vibrate([0, 800, 1000, 800], true);
      } catch (_) {}

      if (HapticsModule?.notificationAsync) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Warning).catch(() => {});
        hapticIntervalRef.current = setInterval(() => {
          HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Warning).catch(() => {});
        }, 2000);
      }
    }

    // 2. Native AudioModule (expo-av if native module is linked)
    if (AudioModule) {
      try {
        await AudioModule.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        if (type === 'incoming') {
          const { sound } = await AudioModule.Sound.createAsync(
            require('~/assets/tones/call-ring-tone.mp3'),
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          soundRef.current = sound;
        }
      } catch (err) {
        // Fallback handled by RingtoneAudioFallback in IncomingCallModal
        console.warn('[RINGTONE_AUDIO_WARN] expo-av playback unavailable (using RingtoneAudioFallback):', err?.message);
      }
    }
  }, [stopRingtone]);

  // Cleanup WebRTC and Call State
  const cleanupCall = useCallback(() => {
    stopRingtone();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (webrtcClientRef.current) {
      webrtcClientRef.current.cleanup();
      webrtcClientRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
  }, [stopRingtone]);

  // 3. Connect Socket.IO Client
  useEffect(() => {
    if (!currentUserId) {
      console.log('[CRM_SOCKET] Waiting for user session to initialize socket connection...');
      return;
    }

    const socketUrl = getSocketUrl();
    console.log(`[CRM_SOCKET] Connecting user ${currentUserId} to socket server at ${socketUrl}...`);

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log(`[CRM_SOCKET] Mobile client successfully connected to ${socketUrl} (Socket ID: ${s.id})`);

      s.emit('user:join', {
        userId: currentUserId,
        workspaceId: workspaceId || 'default',
        userName: currentUserName,
        avatar: currentUserAvatar,
        platform: Platform.OS,
      });
    });

    s.on('connect_error', (err) => {
      setIsConnected(false);
      console.warn(`[CRM_SOCKET] Connection failed to ${socketUrl}:`, err?.message || err);
    });

    s.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log(`[CRM_SOCKET] Mobile client disconnected (${reason})`);
    });

    s.on('presence:sync', (users) => {
      setOnlineUsers(users.filter((u) => u.userId !== currentUserId));
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [currentUserId, workspaceId, currentUserName, currentUserAvatar]);

  // 4. WebRTC Signaling Listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming Call
    socket.on('call:incoming', (data) => {
      if (callStatusRef.current !== 'idle') {
        socket.emit('call:response', { roomId: data.roomId, accepted: false, reason: 'busy' });
        return;
      }

      setIncomingCallData(data);
      setCallStatus('incoming');
      startRingtone('incoming');

      // Auto-decline after 35 seconds if unanswered
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === 'incoming') {
          stopRingtone();
          socket.emit('call:response', {
            roomId: data.roomId,
            accepted: false,
            reason: 'timeout',
          });
          setIncomingCallData(null);
          setCallStatus('idle');
        }
      }, 35000);
    });

    // Caller: Callee accepted
    socket.on('call:accepted', async (data) => {
      stopRingtone();
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      if (!activeCallSessionRef.current?.isCaller) return;

      setCallStatus('connected');
      if (HapticsModule?.notificationAsync) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Success).catch(() => {});
      }

      // Caller creates SDP Offer
      if (webrtcClientRef.current) {
        try {
          const isAudioOnly = activeCallSessionRef.current?.callType === 'audio';
          const offer = await webrtcClientRef.current.createOffer({ isAudioOnly });
          socket.emit('call:sdp:offer', { roomId: data.roomId, sdp: offer });
        } catch (err) {
          console.error('[WEBRTC_OFFER_ERROR]', err);
        }
      }

      // Start call duration timer
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    });

    // Caller: Callee rejected
    socket.on('call:rejected', (data) => {
      cleanupCall();
      setCallStatus('idle');
      setActiveCallSession(null);
      setIncomingCallData(null);
      const msg =
        data.reason === 'busy'
          ? 'User is busy on another call.'
          : data.reason === 'timeout'
          ? 'Call timed out (no answer).'
          : 'Call was declined.';
      Alert.alert('Call Ended', msg);
    });

    // Callee: Receives SDP Offer -> creates Answer
    socket.on('call:sdp:offer', async ({ roomId, sdp }) => {
      if (webrtcClientRef.current) {
        try {
          const answer = await webrtcClientRef.current.handleOfferAndCreateAnswer(sdp);
          socket.emit('call:sdp:answer', { roomId, sdp: answer });

          // Start timer for callee
          setCallDuration(0);
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        } catch (err) {
          console.error('[WEBRTC_ANSWER_ERROR]', err);
        }
      }
    });

    // Caller: Receives SDP Answer
    socket.on('call:sdp:answer', async ({ sdp }) => {
      if (webrtcClientRef.current) {
        try {
          await webrtcClientRef.current.handleAnswer(sdp);
        } catch (err) {
          console.error('[WEBRTC_HANDLE_ANSWER_ERROR]', err);
        }
      }
    });

    // Receive ICE Candidates
    socket.on('call:ice:candidate', async ({ candidate }) => {
      if (webrtcClientRef.current) {
        await webrtcClientRef.current.addIceCandidate(candidate);
      }
    });

    // Call Ended
    socket.on('call:ended', ({ duration }) => {
      const finishedSession = activeCallSessionRef.current;
      const finalDuration = duration || callDurationRef.current;

      cleanupCall();
      setCallStatus('idle');
      setActiveCallSession(null);
      setIncomingCallData(null);

      // Open Post-Call Summary Modal
      if (finishedSession) {
        setPostCallRecord({
          ...finishedSession,
          duration: finalDuration,
        });
      }
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:sdp:offer');
      socket.off('call:sdp:answer');
      socket.off('call:ice:candidate');
      socket.off('call:ended');
    };
  }, [socket, cleanupCall, startRingtone, stopRingtone]);

  // 5. User Calling Actions
  const startCall = async ({ calleeId, calleeName, calleeAvatar, callType = 'audio', contactOrDealInfo = null }) => {
    if (!socket || !socket.connected) {
      Alert.alert('Signaling Server', 'Connecting to real-time service... Please try again.');
      return;
    }

    try {
      const currentRoomId = `call_${currentUserId}_${calleeId}_${Date.now()}`;

      const rtc = new WebRtcClient({
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
        },
        onIceCandidate: (candidate) => {
          if (socketRef.current && currentRoomId) {
            socketRef.current.emit('call:ice:candidate', { roomId: currentRoomId, candidate });
          }
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setCallStatus('connected');
          }
        },
      });

      const stream = await rtc.initLocalMedia({
        audio: true,
        video: callType === 'video',
      });

      setLocalStream(stream);
      webrtcClientRef.current = rtc;

      setActiveCallSession({
        roomId: currentRoomId,
        targetUserId: calleeId,
        targetName: calleeName,
        targetAvatar: calleeAvatar,
        callType,
        isCaller: true,
        contactOrDealInfo,
      });

      setCallStatus('calling');

      // 35s calling timeout
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === 'calling') {
          endCall();
          Alert.alert('No Answer', `${calleeName || 'User'} is unavailable.`);
        }
      }, 35000);

      // Dispatch invitation
      socket.emit('call:invite', {
        calleeId,
        roomId: currentRoomId,
        callType,
        workspaceId,
        callerInfo: {
          id: currentUserId,
          name: currentUserName,
          avatar: currentUserAvatar,
          title: 'Sales Team Rep',
        },
      });
    } catch (err) {
      console.error('[START_CALL_ERROR]', err);
      cleanupCall();
      setCallStatus('idle');
      Alert.alert('Microphone/Camera Access', err?.message || 'Could not start call.');
    }
  };

  const acceptCall = async () => {
    stopRingtone();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (!incomingCallData || !socket) return;

    try {
      const { roomId, callerId, callerName, callerAvatar, callType } = incomingCallData;

      const rtc = new WebRtcClient({
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
        },
        onIceCandidate: (candidate) => {
          if (socketRef.current && roomId) {
            socketRef.current.emit('call:ice:candidate', { roomId, candidate });
          }
        },
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setCallStatus('connected');
          }
        },
      });

      const stream = await rtc.initLocalMedia({
        audio: true,
        video: callType === 'video',
      });

      setLocalStream(stream);
      webrtcClientRef.current = rtc;

      setActiveCallSession({
        roomId,
        targetUserId: callerId,
        targetName: callerName,
        targetAvatar: callerAvatar,
        callType,
        isCaller: false,
      });

      setCallStatus('connected');
      setIncomingCallData(null);

      socket.emit('call:response', {
        roomId,
        accepted: true,
      });
    } catch (err) {
      console.error('[ACCEPT_CALL_ERROR]', err);
      rejectCall('error');
      Alert.alert('Call Error', err?.message || 'Failed to connect media stream.');
    }
  };

  const rejectCall = (reason = 'declined') => {
    stopRingtone();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (incomingCallData && socket) {
      socket.emit('call:response', {
        roomId: incomingCallData.roomId,
        accepted: false,
        reason,
      });
    }

    setIncomingCallData(null);
    setCallStatus('idle');
  };

  const endCall = () => {
    const currentSession = activeCallSessionRef.current;
    const finalDuration = callDurationRef.current;

    if (currentSession && socket) {
      socket.emit('call:end', {
        roomId: currentSession.roomId,
        duration: finalDuration,
      });
    }

    cleanupCall();
    setCallStatus('idle');
    setActiveCallSession(null);
    setIncomingCallData(null);

    if (currentSession) {
      setPostCallRecord({
        ...currentSession,
        duration: finalDuration,
      });
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (webrtcClientRef.current) {
      webrtcClientRef.current.toggleAudio(!next);
    }
  };

  const toggleCamera = () => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    if (webrtcClientRef.current) {
      webrtcClientRef.current.toggleVideo(!next);
    }
  };

  const switchCamera = () => {
    if (webrtcClientRef.current) {
      webrtcClientRef.current.switchCamera();
    }
  };

  return (
    <CrmSocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        callStatus,
        incomingCallData,
        activeCallSession,
        postCallRecord,
        setPostCallRecord,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        callDuration,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        switchCamera,
      }}
    >
      {children}
    </CrmSocketContext.Provider>
  );
}
