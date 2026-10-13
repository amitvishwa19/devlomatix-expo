import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import { getSession } from '~/utils/authStorage';

const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function CrmConversationScreen() {
  const router = useRouter();
  const { chatId, name, avatar, phone, email, role, type } = useLocalSearchParams();
  const { palette } = useAppTheme();
  const { socket, onlineUsers, startCall } = useCrmSocket();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadUserSession() {
      try {
        const session = await getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (e) {
        console.warn('Could not load user session in chat:', e);
      }
    }
    loadUserSession();
  }, []);

  const currentUserId = currentUser?.id || currentUser?.userId || currentUser?._id;
  const currentUserName = currentUser?.displayName || currentUser?.name || 'Mobile User';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Deterministic 1-on-1 Room ID (matches socket-webrtc-server)
  const roomId = currentUserId && chatId ? [currentUserId, chatId].sort().join('_') : null;
  const isPeerOnline = onlineUsers.some((u) => u.userId === chatId);

  // 1. Join Chat Room & Setup Listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    setLoadingHistory(true);
    socket.emit('chat:room:join', { roomId });

    const handleHistory = (data) => {
      if (data.roomId === roomId && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setLoadingHistory(false);
      }
    };

    const handleReceive = (msg) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => {
          // Avoid duplicate insertion
          if (prev.some((m) => m.id === msg.id || (msg.clientMessageId && m.clientMessageId === msg.clientMessageId))) {
            return prev.map((m) => (m.clientMessageId === msg.clientMessageId ? msg : m));
          }
          return [...prev, msg];
        });

        // Mark as read
        socket.emit('chat:read', { roomId, messageIds: [msg.id], readerId: currentUserId });
      }
    };

    const handleAck = (ack) => {
      if (ack.roomId === roomId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === ack.clientMessageId ? { ...m, delivered: true, id: ack.serverId } : m
          )
        );
      }
    };

    const handleTyping = (data) => {
      if (data.roomId === roomId && data.userId === chatId) {
        setRemoteTyping(!!data.isTyping);
      }
    };

    socket.on('chat:room:history', handleHistory);
    socket.on('chat:message:receive', handleReceive);
    socket.on('chat:message:ack', handleAck);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.emit('chat:room:leave', { roomId });
      socket.off('chat:room:history', handleHistory);
      socket.off('chat:message:receive', handleReceive);
      socket.off('chat:message:ack', handleAck);
      socket.off('chat:typing', handleTyping);
    };
  }, [socket, roomId, chatId, currentUserId]);

  // 2. Typing indicator emitter
  const handleTextChange = (text) => {
    setInputText(text);

    if (socket && roomId) {
      socket.emit('chat:typing', { roomId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing', { roomId, isTyping: false });
      }, 1800);
    }
  };

  // 3. Send Message
  const handleSend = () => {
    if (!inputText.trim() || !socket || !roomId) return;

    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg = {
      id: clientMessageId,
      clientMessageId,
      roomId,
      senderId: currentUserId,
      senderName: currentUserName,
      recipientId: chatId,
      message: inputText.trim(),
      attachments: [],
      timestamp: new Date().toISOString(),
      delivered: false,
      read: false,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    socket.emit('chat:message:send', {
      roomId,
      recipientId: chatId,
      message: newMsg.message,
      senderId: currentUserId,
      senderName: currentUserName,
      clientMessageId,
    });

    if (socket) {
      socket.emit('chat:typing', { roomId, isTyping: false });
    }
  };

  // 4. Attach image via ImagePicker
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const clientMessageId = `img_${Date.now()}`;
        const newMsg = {
          id: clientMessageId,
          clientMessageId,
          roomId,
          senderId: currentUserId,
          senderName: currentUserName,
          recipientId: chatId,
          message: '📷 Image Attachment',
          attachments: [{ type: 'image', url: result.assets[0].uri }],
          timestamp: new Date().toISOString(),
          delivered: true,
          read: false,
        };

        setMessages((prev) => [...prev, newMsg]);
        socket.emit('chat:message:send', {
          roomId,
          recipientId: chatId,
          message: newMsg.message,
          attachments: newMsg.attachments,
          senderId: currentUserId,
          senderName: currentUserName,
          clientMessageId,
        });
      }
    } catch (e) {
      console.warn('Error attaching image:', e);
    }
  };

  const handleStartCall = (callType = 'audio') => {
    startCall({
      calleeId: chatId,
      calleeName: name || 'Contact',
      calleeAvatar: avatar,
      callType,
      contactOrDealInfo: { contactId: chatId },
    });
  };

  // Render individual message or inline call log
  const renderMessage = ({ item }) => {
    const isSelf = item.senderId === currentUserId;
    const callLog = item.attachments?.find((a) => a?.type === 'call_log');

    // INLINE CALL LOG CARD
    if (callLog || item.message?.includes('Voice Call') || item.message?.includes('Video Call')) {
      const isVideo = callLog?.callType === 'video' || item.message?.includes('Video');
      const isMissed = callLog?.callStatus === 'missed' || item.message?.includes('Missed');
      const durSecs = callLog?.duration || 0;
      const mins = Math.floor(durSecs / 60);
      const secs = durSecs % 60;
      const durLabel = durSecs > 0 ? (mins > 0 ? `${mins}m ${secs}s` : `${secs}s`) : null;

      return (
        <View className="items-center my-2">
          <View className="flex-row items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md max-w-[85%]">
            <View
              className={`w-9 h-9 rounded-xl items-center justify-center ${
                isMissed ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-indigo-500/20 border border-indigo-500/30'
              }`}
            >
              <Ionicons
                name={isVideo ? 'videocam' : isMissed ? 'call-outline' : 'call'}
                size={16}
                color={isMissed ? '#f43f5e' : '#6366f1'}
              />
            </View>

            <View className="flex-1">
              <Text className="text-[12px] font-bold text-white">
                {isMissed ? `Missed ${isVideo ? 'Video' : 'Voice'} Call` : `${isVideo ? 'Video' : 'Voice'} Call`}
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                {durLabel ? `Duration: ${durLabel} • ` : ''}
                {formatTime(item.timestamp)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStartCall(isVideo ? 'video' : 'audio')}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 active:opacity-75"
            >
              <Text className="text-[10px] font-bold text-white">Call Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // STANDARD CHAT BUBBLE
    return (
      <View className={`my-1 flex-row ${isSelf ? 'justify-end' : 'justify-start'}`}>
        <View
          className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
            isSelf ? 'bg-indigo-600 rounded-br-xs' : `${palette.surface} border ${palette.border} rounded-bl-xs`
          } shadow-sm`}
        >
          {item.attachments && item.attachments[0]?.url ? (
            <Image
              source={{ uri: item.attachments[0].url }}
              className="w-48 h-36 rounded-xl mb-1.5"
              resizeMode="cover"
            />
          ) : null}

          <Text className={`text-[13px] ${isSelf ? 'text-white' : palette.text} leading-4`}>
            {item.message}
          </Text>

          <View className="flex-row items-center justify-end gap-1 mt-1">
            <Text className={`text-[9px] ${isSelf ? 'text-indigo-200' : palette.textMuted}`}>
              {formatTime(item.timestamp)}
            </Text>
            {isSelf && (
              <Ionicons
                name={item.delivered ? 'checkmark-done' : 'checkmark'}
                size={12}
                color={item.read ? '#38bdf8' : '#c7d2fe'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* CUSTOM CONVERSATION HEADER */}
        <View className={`flex-row items-center justify-between px-4 py-2.5 border-b ${palette.border} ${palette.surface}`}>
          <View className="flex-row items-center gap-2.5 flex-1">
            <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
              <Ionicons name="arrow-back" size={20} color={palette.textMutedColor} />
            </TouchableOpacity>

            <View className="relative">
              <View className="w-9 h-9 rounded-full bg-indigo-500/15 border border-indigo-500/30 items-center justify-center overflow-hidden">
                {avatar ? (
                  <Image source={{ uri: avatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-[14px] font-extrabold text-indigo-400">
                    {(name || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              {isPeerOnline && (
                <View className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
              )}
            </View>

            <View className="flex-1">
              <Text className={`text-[13px] font-extrabold ${palette.text} truncate`}>{name}</Text>
              <View className="flex-row items-center gap-1 flex-wrap">
                <Text className="text-[10px] text-emerald-400 font-semibold">
                  {remoteTyping ? 'Typing...' : isPeerOnline ? 'Online' : 'Offline'}
                </Text>
                {role ? (
                  <Text className={`text-[10px] ${palette.textMuted} truncate`}>
                    • {role}
                  </Text>
                ) : null}
                {email ? (
                  <Text className={`text-[10px] ${palette.textMuted} truncate`}>
                    • {email}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Call Launcher Icons */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStartCall('audio')}
              className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 items-center justify-center"
            >
              <Ionicons name="call" size={15} color="#6366f1" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStartCall('video')}
              className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center"
            >
              <Ionicons name="videocam" size={15} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MESSAGES STREAM */}
        <View className="flex-1 px-4 pt-2">
          {loadingHistory ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color="#6366f1" />
              <Text className={`text-[11px] ${palette.textMuted} mt-2`}>Loading conversation history...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => String(item.id || item.clientMessageId)}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {/* Remote Typing Notice */}
          {remoteTyping && (
            <View className="flex-row items-center gap-1.5 py-1 px-2 mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <Text className={`text-[11px] italic ${palette.textMuted}`}>{name} is typing...</Text>
            </View>
          )}
        </View>

        {/* INPUT BAR */}
        <View className={`flex-row items-center px-3 py-2 border-t ${palette.border} ${palette.surface} gap-2`}>
          <TouchableOpacity onPress={handlePickImage} className="p-1.5 rounded-full">
            <Ionicons name="image-outline" size={20} color={palette.textMutedColor} />
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={palette.textMutedColor}
            className={`flex-1 rounded-2xl border ${palette.border} ${palette.surfaceAlt} px-3.5 py-2 text-[13px] ${palette.text}`}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={`w-9 h-9 rounded-full items-center justify-center ${
              inputText.trim() ? 'bg-indigo-600 shadow-sm' : 'bg-slate-800'
            }`}
          >
            <Ionicons name="send" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
