import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Platform, Alert, Vibration, AppState } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '~/utils/notification';

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

let getMessaging = null;
try {
  getMessaging = require('@react-native-firebase/messaging').getMessaging;
} catch (e) {
  // Firebase messaging fallback
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
  const [callEndNotice, setCallEndNotice] = useState(null);
  const dismissCallEndNotice = useCallback(() => setCallEndNotice(null), []);

  // Audio/Video control states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Media Streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [deviceToken, setDeviceToken] = useState(null);

  const webrtcClientRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const soundRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const hapticIntervalRef = useRef(null);
  const incomingNotificationIdRef = useRef(null);
  const incomingCallDataRef = useRef(null);
  const activeCallSessionRef = useRef(null);
  const callStatusRef = useRef('idle');
  const callDurationRef = useRef(0);

  // Register push notifications on mount
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          console.log('[CRM_SOCKET] Registered push token for calls:', token);
          setPushToken(token);
        }
      })
      .catch((err) => {
        console.warn('[CRM_SOCKET] Push notification registration notice:', err?.message);
      });

    // Also obtain direct Firebase FCM token
    try {
      if (getMessaging) {
        getMessaging().getToken().then((fcmTok) => {
          if (fcmTok) {
            console.log('[CRM_SOCKET] Retrieved native FCM deviceToken:', fcmTok.substring(0, 20) + '...');
            setDeviceToken(fcmTok);
          }
        }).catch((err) => {
          console.warn('[CRM_SOCKET] FCM token retrieval notice:', err?.message);
        });
      }
    } catch (_) {}
  }, []);

  // Monitor AppState (foreground/background) & notification taps
  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        if (socketRef.current && !socketRef.current.connected) {
          console.log('[CRM_SOCKET] App foregrounded. Reconnecting socket...');
          socketRef.current.connect();
        }
      }
    });

    // 1. Expo notification tap listener
    const notifSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.type === 'incoming_call') {
        console.log('[CRM_NOTIFICATION] User tapped incoming call notification:', data);
        setIncomingCallData(data);
        setCallStatus('incoming');
      }
    });

    // 2. Direct FCM notification tap listener (when opened from background)
    let unsubFcmOpened = null;
    try {
      if (getMessaging) {
        unsubFcmOpened = getMessaging().onNotificationOpenedApp((remoteMessage) => {
          const data = remoteMessage?.data;
          if (data?.type === 'incoming_call') {
            console.log('[CRM_FCM] App opened from background by call notification:', data);
            setIncomingCallData(data);
            setCallStatus('incoming');
          }
        });
      }
    } catch (_) {}

    // 3. Direct FCM notification tap listener (when app cold-started from killed state)
    try {
      if (getMessaging) {
        getMessaging().getInitialNotification().then((remoteMessage) => {
          const data = remoteMessage?.data;
          if (data?.type === 'incoming_call') {
            console.log('[CRM_FCM] App cold-started by call notification:', data);
            setIncomingCallData(data);
            setCallStatus('incoming');
          }
        }).catch(() => {});
      }
    } catch (_) {}

    return () => {
      appStateSub.remove();
      notifSub.remove();
      if (unsubFcmOpened) unsubFcmOpened();
    };
  }, []);

  useEffect(() => {
    activeCallSessionRef.current = activeCallSession;
  }, [activeCallSession]);

  useEffect(() => {
    incomingCallDataRef.current = incomingCallData;
  }, [incomingCallData]);

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
    if (incomingNotificationIdRef.current) {
      Notifications.dismissNotificationAsync(incomingNotificationIdRef.current).catch(() => {});
      incomingNotificationIdRef.current = null;
    }
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
        expoPushToken: pushToken,
        deviceToken: deviceToken,
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

      // If app is running in background, pop high-priority heads-up notification banner
      if (AppState.currentState !== 'active') {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `📞 Incoming ${data.callType === 'video' ? 'Video' : 'Voice'} Call`,
            body: `${data.callerName || 'Sales Representative'} is calling you on Devlomatix CRM`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 800, 1000, 800],
            channelId: 'calls',
            data: {
              type: 'incoming_call',
              ...data,
            },
          },
          trigger: null,
        })
          .then((id) => {
            incomingNotificationIdRef.current = id;
          })
          .catch(() => {});
      }

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
      const targetName = activeCallSessionRef.current?.targetName || 'User';
      const targetAvatar = activeCallSessionRef.current?.targetAvatar || null;
      const callType = activeCallSessionRef.current?.callType || 'audio';

      cleanupCall();
      setCallStatus('idle');
      setActiveCallSession(null);
      setIncomingCallData(null);

      const msg =
        data?.reason === 'busy'
          ? 'User is busy on another call.'
          : data?.reason === 'timeout'
          ? 'Call timed out (no answer).'
          : 'Call was declined.';

      setCallEndNotice({
        title: 'Call Ended',
        subtitle: msg,
        reason: data?.reason || 'declined',
        targetName,
        targetAvatar,
        callType,
      });
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
    socket.on('call:ended', ({ duration, reason }) => {
      const finishedSession = activeCallSessionRef.current;
      const finalDuration = duration || callDurationRef.current;

      cleanupCall();
      setCallStatus('idle');
      setActiveCallSession(null);
      setIncomingCallData(null);

      if (finishedSession && finalDuration > 0) {
        setPostCallRecord({
          ...finishedSession,
          duration: finalDuration,
        });
      } else if (finishedSession) {
        const msg =
          reason === 'declined'
            ? 'Call was declined.'
            : reason === 'busy'
            ? 'User is busy on another call.'
            : reason === 'timeout'
            ? 'Call timed out (no answer).'
            : 'Call was ended.';

        setCallEndNotice({
          title: 'Call Ended',
          subtitle: msg,
          reason: reason || 'ended',
          targetName: finishedSession.targetName,
          targetAvatar: finishedSession.targetAvatar,
          callType: finishedSession.callType,
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
          const targetName = activeCallSessionRef.current?.targetName || calleeName || 'User';
          endCall();
          setCallEndNotice({
            title: 'Call Ended',
            subtitle: `${targetName} did not answer. Call timed out.`,
            reason: 'timeout',
            targetName,
            targetAvatar: calleeAvatar,
            callType,
          });
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

    const activeIncoming = incomingCallData || incomingCallDataRef.current;
    const activeSocket = socketRef.current || socket;
    if (!activeIncoming || !activeSocket) {
      console.warn('⚠️ [ACCEPT_CALL] Missing active incoming data or socket:', { hasIncoming: !!activeIncoming, hasSocket: !!activeSocket });
      return;
    }

    try {
      const { roomId, callerId, callerName, callerAvatar, callType } = activeIncoming;

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
      if (incomingCallDataRef.current) incomingCallDataRef.current = null;

      activeSocket.emit('call:response', {
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

    const activeIncoming = incomingCallData || incomingCallDataRef.current;
    const activeSocket = socketRef.current || socket;
    const roomId = activeIncoming?.roomId || activeCallSessionRef.current?.roomId;
    if (roomId && activeSocket) {
      activeSocket.emit('call:response', {
        roomId,
        accepted: false,
        reason,
      });
      activeSocket.emit('call:hangup', {
        roomId,
        duration: 0,
        reason,
      });
      activeSocket.emit('call:end', {
        roomId,
        duration: 0,
        reason,
      });
    }

    cleanupCall();
    setIncomingCallData(null);
    incomingCallDataRef.current = null;
    setCallStatus('idle');
  };

  const endCall = () => {
    stopRingtone();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    const currentSession = activeCallSessionRef.current;
    const currentIncoming = incomingCallData;
    const roomId = currentSession?.roomId || currentIncoming?.roomId;
    const finalDuration = callDurationRef.current;

    if (roomId && socket) {
      socket.emit('call:hangup', {
        roomId,
        duration: finalDuration,
      });
      socket.emit('call:end', {
        roomId,
        duration: finalDuration,
      });
      socket.emit('call:response', {
        roomId,
        accepted: false,
        reason: 'declined',
      });
    }

    cleanupCall();
    setCallStatus('idle');
    setActiveCallSession(null);
    setIncomingCallData(null);

    if (currentSession && finalDuration > 0) {
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
        callEndNotice,
        setCallEndNotice,
        dismissCallEndNotice,
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
