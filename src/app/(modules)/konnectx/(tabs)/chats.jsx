import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import * as chatsService from '~/services/konnectx/chats';

export default function KonnectXChatsScreen() {
  const { palette } = useAppTheme();

  const MOCK_CONVERSATIONS = [
    { jid: '918765432109@s.whatsapp.net', name: 'Rahul Sharma', lastMessage: 'Sure, I\'ll check the campaign metrics.', timestamp: Date.now() / 1000 - 120, unread: 2 },
    { jid: '918765432110@s.whatsapp.net', name: 'Priya Patel', lastMessage: 'The template was approved! 🎉', timestamp: Date.now() / 1000 - 3600, unread: 0 },
    { jid: '918765432111@s.whatsapp.net', name: 'Amit Verma', lastMessage: 'Can you send the audience report?', timestamp: Date.now() / 1000 - 7200, unread: 1 },
    { jid: '918765432112@s.whatsapp.net', name: 'Sneha Reddy', lastMessage: 'New campaign is ready for review.', timestamp: Date.now() / 1000 - 14400, unread: 0 },
    { jid: '918765432113@s.whatsapp.net', name: 'Vikram Singh', lastMessage: 'Contacts imported successfully.', timestamp: Date.now() / 1000 - 86400, unread: 0 },
  ];

  const MOCK_MESSAGES = {
    '918765432109@s.whatsapp.net': [
      { id: 'm1', text: 'Hey, how are the campaign metrics looking?', fromMe: true, timestamp: Math.floor(Date.now() / 1000) - 600, status: 'READ' },
      { id: 'm2', text: 'Let me check the dashboard.', fromMe: false, timestamp: Math.floor(Date.now() / 1000) - 540, status: 'READ' },
      { id: 'm3', text: 'Looks good! Conversions are up 12% this week.', fromMe: false, timestamp: Math.floor(Date.now() / 1000) - 480, status: 'READ' },
      { id: 'm4', text: 'Great, share the detailed report.', fromMe: true, timestamp: Math.floor(Date.now() / 1000) - 300, status: 'DELIVERED' },
      { id: 'm5', text: 'Sure, I\'ll check the campaign metrics.', fromMe: false, timestamp: Math.floor(Date.now() / 1000) - 120, status: 'DELIVERED' },
    ],
    '918765432110@s.whatsapp.net': [
      { id: 'm6', text: 'The template was submitted for review yesterday.', fromMe: false, timestamp: Math.floor(Date.now() / 1000) - 7200, status: 'READ' },
      { id: 'm7', text: 'Any update on the approval?', fromMe: true, timestamp: Math.floor(Date.now() / 1000) - 6000, status: 'READ' },
      { id: 'm8', text: 'The template was approved! 🎉', fromMe: false, timestamp: Math.floor(Date.now() / 1000) - 3600, status: 'SENT' },
    ],
  };

  const [conversations, setConversations] = useState([]);
  const [selectedJid, setSelectedJid] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showContactList, setShowContactList] = useState(false);

  const flatListRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await chatsService.getConversations(null);
      const list = Array.isArray(data) ? data : data?.conversations ?? [];
      setConversations(list.length > 0 ? list : MOCK_CONVERSATIONS);
    } catch {
      setConversations(MOCK_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (jid) => {
    if (!jid) return;
    try {
      const data = await chatsService.getMessages(null, jid);
      const msgs = Array.isArray(data) ? data : data?.messages ?? [];
      setMessages(msgs.length > 0 ? msgs : MOCK_MESSAGES[jid] || []);
    } catch {
      setMessages(MOCK_MESSAGES[jid] || []);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedJid) {
      fetchMessages(selectedJid);
      pollRef.current = setInterval(() => fetchMessages(selectedJid), 5000);
      return () => clearInterval(pollRef.current);
    }
  }, [selectedJid, fetchMessages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    if (selectedJid) await fetchMessages(selectedJid);
    setRefreshing(false);
  }, [fetchConversations, fetchMessages, selectedJid]);

  const selectConversation = (jid) => {
    setSelectedJid(jid);
    setShowContactList(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedJid) return;
    const text = inputText.trim();
    setInputText('');

    const optimistic = { id: `opt-${Date.now()}`, text, fromMe: true, timestamp: Math.floor(Date.now() / 1000), status: 'PENDING' };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await chatsService.sendMessage(null, { to: selectedJid.replace('@s.whatsapp.net', ''), type: 'text', body: text });
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'SENT' } : m)));
      fetchMessages(selectedJid);
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'FAILED' } : m)));
      Toast.show({ type: 'error', text1: 'Send failed', text2: err?.response?.data?.error || err.message });
    }
  };

  const deleteConversation = async (jid) => {
    try {
      await chatsService.deleteConversation(null, jid);
      if (selectedJid === jid) {
        setSelectedJid(null);
        setMessages([]);
      }
      setConversations((prev) => prev.filter((c) => c.jid !== jid));
      Toast.show({ type: 'success', text1: 'Conversation deleted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getContactName = (jid) => {
    const conv = conversations.find((c) => c.jid === jid);
    return conv?.name || jid?.split('@')[0] || 'Unknown';
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'SENT': return 'checkmark';
      case 'DELIVERED': return 'checkmark-done';
      case 'READ': return 'checkmark-done';
      case 'FAILED': return 'alert-circle';
      default: return 'time';
    }
  };

  if (!selectedJid) {
    return (
      <SafeAreaView className={`flex-1 ${palette.page}`}>
        <StatusBar style={palette.statusBar} />
        <FlatList
          data={loading ? [] : conversations}
          keyExtractor={(item) => item.jid}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 20, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListHeaderComponent={() => (
            <View className="mb-6">
              <View className="mb-3 self-start rounded-full bg-sky-600 px-3 py-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">CHATS</Text>
              </View>
              <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Inbox</Text>
              <Text className={`mt-1 text-[14px] ${palette.textSoft}`}>Active conversations</Text>
            </View>
          )}
          ListEmptyComponent={
            loading ? null : (
              <KonnectxEmptyState icon="chatbubbles-outline" title="No conversations"
                description="Start a conversation by sending a message from the Quick Message feature." />
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => selectConversation(item.jid)}
              onLongPress={() => deleteConversation(item.jid)}
              className={`mb-2 flex-row items-center gap-3 rounded-[20px] border p-4 ${palette.surface} ${palette.border}`}>
              <View className="h-12 w-12 items-center justify-center rounded-full bg-sky-500/20">
                <Text className="text-[16px] font-bold text-sky-600">
                  {(item.name || item.jid)?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className={`text-[15px] font-bold flex-1 ${palette.text}`}>{item.name || item.jid?.split('@')[0]}</Text>
                  <Text className={`text-[11px] ${palette.textMuted}`}>{formatTime(item.timestamp)}</Text>
                </View>
                <Text className={`mt-1 text-[13px] ${palette.textSoft}`} numberOfLines={1}>
                  {item.lastMessage || item.messages?.[item.messages.length - 1]?.text || ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        <View className={`flex-row items-center gap-3 border-b px-4 py-3 ${palette.surface} ${palette.border}`}>
          <TouchableOpacity onPress={() => { setSelectedJid(null); setMessages([]); }}>
            <Ionicons name="arrow-back" size={24} color={palette.textColor} />
          </TouchableOpacity>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
            <Text className="text-[14px] font-bold text-sky-600">
              {getContactName(selectedJid)?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-[16px] font-bold ${palette.text}`}>{getContactName(selectedJid)}</Text>
            <Text className={`text-[11px] ${palette.textMuted}`}>
              {conversations.find((c) => c.jid === selectedJid)?.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => deleteConversation(selectedJid)}>
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id?.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <KonnectxEmptyState icon="chatbubble-ellipses-outline" title="No messages yet"
                description="Send a message to start the conversation." />
            }
            renderItem={({ item }) => {
              const isSentByMe = item.fromMe;
              return (
                <View className={`mb-2 max-w-[80%] ${isSentByMe ? 'self-end' : 'self-start'}`}>
                  <View
                    className="rounded-[20px] px-4 py-3"
                    style={{ backgroundColor: isSentByMe ? '#0284c7' : palette.colors.surface, borderColor: palette.colors.border }}>
                    <Text className={`text-[15px] ${isSentByMe ? 'text-white' : palette.text}`}>{item.text}</Text>
                  </View>
                  <View className={`mt-1 flex-row items-center gap-1 ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                    <Text className={`text-[10px] ${palette.textMuted}`}>{formatTime(item.timestamp)}</Text>
                    {isSentByMe ? (
                      <Ionicons name={statusIcon(item.status)} size={12}
                        color={item.status === 'READ' ? '#60a5fa' : item.status === 'FAILED' ? '#dc2626' : palette.textMutedColor} />
                    ) : null}
                  </View>
                </View>
              );
            }}
          />

          <View className={`flex-row items-center gap-2 border-t px-4 py-3 ${palette.surface} ${palette.border}`}>
            <TextInput
              className={`flex-1 rounded-[24px] border px-4 py-3 text-[15px] ${palette.page}`}
              style={{ borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Type a message..."
              placeholderTextColor={palette.textMutedColor}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              multiline={false}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              className="h-11 w-11 items-center justify-center rounded-full bg-sky-600"
              style={{ opacity: inputText.trim() ? 1 : 0.5 }}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
