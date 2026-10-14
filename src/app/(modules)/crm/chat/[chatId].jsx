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
import { useCrmTheme } from '../utils/colors';
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
  const { colors, isDark } = useCrmTheme();
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
          <View
            className="flex-row items-center gap-3 px-3.5 py-2.5 rounded-2xl border shadow-md max-w-[85%]"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View
              className="w-8 h-8 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: isMissed ? colors.dangerSoft : colors.primarySoft,
                borderColor: isMissed ? colors.dangerBorder : colors.primaryBorder,
              }}
            >
              <Ionicons
                name={isVideo ? 'videocam' : isMissed ? 'call-outline' : 'call'}
                size={15}
                color={isMissed ? colors.danger : colors.primary}
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                {isMissed ? `Missed ${isVideo ? 'Video' : 'Voice'} Call` : `${isVideo ? 'Video' : 'Voice'} Call`}
              </Text>
              <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                {durLabel ? `Duration: ${durLabel} • ` : ''}
                {formatTime(item.timestamp)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStartCall(isVideo ? 'video' : 'audio')}
              className="px-2.5 py-1.5 rounded-xl active:opacity-75"
              style={{ backgroundColor: colors.primary }}
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
          className="max-w-[80%] rounded-2xl px-3 py-2 shadow-sm"
          style={{
            backgroundColor: isSelf ? colors.primary : colors.card,
            borderColor: isSelf ? colors.primary : colors.border,
            borderWidth: isSelf ? 0 : 1,
            borderBottomRightRadius: isSelf ? 2 : 16,
            borderBottomLeftRadius: isSelf ? 16 : 2,
          }}
        >
          {item.attachments && item.attachments[0]?.url ? (
            <Image
              source={{ uri: item.attachments[0].url }}
              className="w-48 h-36 rounded-xl mb-1.5"
              resizeMode="cover"
            />
          ) : null}

          <Text
            className="text-[13px] leading-4"
            style={{ color: isSelf ? '#ffffff' : colors.text }}
          >
            {item.message}
          </Text>

          <View className="flex-row items-center justify-end gap-1 mt-1">
            <Text
              className="text-[9px]"
              style={{ color: isSelf ? 'rgba(255, 255, 255, 0.7)' : colors.textMuted }}
            >
              {formatTime(item.timestamp)}
            </Text>
            {isSelf && (
              <Ionicons
                name={item.delivered ? 'checkmark-done' : 'checkmark'}
                size={12}
                color={item.read ? colors.info : '#ffffff'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* CUSTOM CONVERSATION HEADER */}
        <View
          className="flex-row items-center justify-between px-3 py-2 border-b"
          style={{ backgroundColor: colors.header, borderBottomColor: colors.border }}
        >
          <View className="flex-row items-center gap-2 flex-1">
            <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </TouchableOpacity>

            <View className="relative">
              <View
                className="w-8 h-8 rounded-full border items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primaryBorder,
                }}
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-xs font-black" style={{ color: colors.primary }}>
                    {(name || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              {isPeerOnline && (
                <View
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border"
                  style={{
                    backgroundColor: colors.whatsapp,
                    borderColor: colors.card,
                  }}
                />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-xs font-black truncate" style={{ color: colors.text }}>
                {name}
              </Text>
              <View className="flex-row items-center gap-1 flex-wrap">
                <Text
                  className="text-[10px] font-semibold"
                  style={{ color: isPeerOnline ? colors.whatsapp : colors.textMuted }}
                >
                  {remoteTyping ? 'Typing...' : isPeerOnline ? 'Online' : 'Offline'}
                </Text>
                {role ? (
                  <Text className="text-[10px] truncate" style={{ color: colors.textMuted }}>
                    • {role}
                  </Text>
                ) : null}
                {email ? (
                  <Text className="text-[10px] truncate" style={{ color: colors.textMuted }}>
                    • {email}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Call Launcher Icons */}
          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStartCall('audio')}
              className="w-8 h-8 rounded-full border items-center justify-center"
              style={{
                backgroundColor: colors.callSoft,
                borderColor: colors.callBorder,
              }}
            >
              <Ionicons name="call" size={14} color={colors.call} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStartCall('video')}
              className="w-8 h-8 rounded-full border items-center justify-center"
              style={{
                backgroundColor: colors.whatsappSoft,
                borderColor: colors.whatsappBorder,
              }}
            >
              <Ionicons name="videocam" size={14} color={colors.whatsapp} />
            </TouchableOpacity>
          </View>
        </View>

        {/* MESSAGES STREAM */}
        <View className="flex-1 px-3 pt-2">
          {loadingHistory ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
                Loading conversation history...
              </Text>
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
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
              <Text className="text-[11px] italic" style={{ color: colors.textMuted }}>
                {name} is typing...
              </Text>
            </View>
          )}
        </View>

        {/* INPUT BAR */}
        <View
          className="flex-row items-center px-3 py-2 border-t gap-2"
          style={{ backgroundColor: colors.card, borderTopColor: colors.border }}
        >
          <TouchableOpacity onPress={handlePickImage} className="p-1 rounded-full">
            <Ionicons name="image-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 rounded-xl border px-3 py-1.5 text-xs"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            }}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{
              backgroundColor: inputText.trim() ? colors.primary : colors.cardAlt,
              opacity: inputText.trim() ? 1 : 0.6,
            }}
          >
            <Ionicons
              name="send"
              size={13}
              color={inputText.trim() ? '#ffffff' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
