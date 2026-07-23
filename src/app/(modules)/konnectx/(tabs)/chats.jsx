import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import * as chatsService from '~/services/konnectx/chats';
import * as contactsService from '~/services/konnectx/contacts';
import * as templatesService from '~/services/konnectx/templates';
import { useKonnectx } from '~/providers/KonnectxProvider';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDistance(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function MessageStatus({ status }) {
  const size = 14;
  switch (status) {
    case 'PENDING':
      return <ActivityIndicator size={10} color="#94a3b8" />;
    case 'READ':
      return <Ionicons name="checkmark-done" size={size} color="#60a5fa" />;
    case 'DELIVERED':
      return <Ionicons name="checkmark-done" size={size} color="#6ee7b7" />;
    case 'SENT':
      return <Ionicons name="checkmark" size={size} color="#6ee7b7" />;
    case 'FAILED':
      return <Ionicons name="alert-circle" size={size} color="#ef4444" />;
    default:
      return <Ionicons name="time" size={size} color="#94a3b8" />;
  }
}

function TemplateMessageBubble({ msg, templateDefinition }) {
  const { palette } = useAppTheme();
  const isFromMe = msg.fromMe;

  const body = msg.text || msg.metadata?.originalPayload?.template?.components?.[0]?.text || templateDefinition?.body || '';
  const header = templateDefinition?.header || msg.metadata?.header;
  const footer = templateDefinition?.footer || msg.metadata?.footer;
  const buttons = templateDefinition?.buttons || msg.metadata?.buttons || [];

  return (
    <View className="rounded-2xl overflow-hidden border" style={{
      backgroundColor: isFromMe ? '#1e293b' : palette.colors.surface,
      borderColor: isFromMe ? '#334155' : palette.colors.border,
      maxWidth: 300,
    }}>
      {header ? (
        <View className="px-3 pt-2.5">
          <Text className="text-[11px] font-bold text-purple-400 uppercase">{header}</Text>
        </View>
      ) : null}
      <View className="px-3 py-2">
        <View className="flex-row items-center gap-1.5 mb-1">
          <View className="rounded bg-purple-600/20 px-1.5 py-0.5">
            <Text className="text-[9px] font-bold text-purple-400">TEMPLATE</Text>
          </View>
          {msg.metadata?.templateName ? (
            <Text className="text-[9px] text-purple-400" numberOfLines={1}>{msg.metadata.templateName}</Text>
          ) : null}
        </View>
        <Text className={`text-[14px] leading-5 ${isFromMe ? 'text-gray-100' : palette.text}`}>{body}</Text>
      </View>
      {footer ? (
        <View className="px-3 pb-2">
          <Text className={`text-[11px] ${isFromMe ? 'text-gray-400' : palette.textMuted}`}>{footer}</Text>
        </View>
      ) : null}
      {buttons.length > 0 ? (
        <View className={`border-t ${isFromMe ? 'border-gray-700' : palette.border}`}>
          {buttons.slice(0, 3).map((btn, i) => (
            <View key={i} className={`py-2 px-3 ${i < buttons.length - 1 ? `border-b ${isFromMe ? 'border-gray-700' : palette.border}` : ''}`}>
              <Text className={`text-[13px] font-medium ${isFromMe ? 'text-blue-400' : 'text-blue-600'}`}>
                {btn.text || btn.buttonText}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MediaBubble({ msg }) {
  const type = msg.metadata?.type || 'text';
  const mediaUrl = msg.metadata?.mediaUrl || msg.text;

  if (type === 'image') {
    return (
      <View className="rounded-2xl overflow-hidden">
        <Image source={{ uri: mediaUrl }} className="h-48 w-64" resizeMode="cover" />
        {msg.metadata?.caption ? (
          <View className="px-3 py-2 bg-black/40">
            <Text className="text-[13px] text-white">{msg.metadata.caption}</Text>
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-2 px-4 py-3 rounded-2xl border"
      style={{ borderColor: '#334155' }}>
      <Ionicons name={
        type === 'video' ? 'videocam' :
        type === 'audio' ? 'musical-notes' :
        type === 'document' ? 'document' : 'image'
      } size={20} color="#94a3b8" />
      <View className="flex-1">
        <Text className="text-[12px] font-medium text-gray-200">{msg.metadata?.filename || type}</Text>
        <Text className="text-[10px] text-gray-400">{type.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function fillTemplatePreview(body, vars) {
  let text = body || '';
  Object.entries(vars).forEach(([key, val]) => {
    text = text.replace(key, val || key);
  });
  return text;
}

export default function KonnectXChatsScreen() {
  const { palette } = useAppTheme();
  const { userId, selectedCredential } = useKonnectx();

  const [conversations, setConversations] = useState([]);
  const [selectedJid, setSelectedJid] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('chats');

  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVars, setTemplateVars] = useState({});

  const flatListRef = useRef(null);
  const pollRef = useRef(null);

  const selectedChat = conversations.find((c) => c.jid === selectedJid);
  const activeName = selectedChat?.name || selectedJid?.split('@')[0] || 'Unknown';

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await chatsService.getConversations(userId);
      const list = Array.isArray(data) ? data : data?.conversations ?? [];
      setConversations((prev) => {
        const incomingMap = new Map(list.map((c) => [c.jid, c]));
        const merged = list.map((newConv) => {
          const prevConv = prev.find((p) => p.jid === newConv.jid);
          if (!prevConv) return newConv;
          const localTemp = (prevConv.messages || []).filter(
            (m) => String(m.id).startsWith('temp_') &&
              !(newConv.messages || []).some(
                (nm) => nm.text === m.text && Math.abs(nm.timestamp - m.timestamp) < 30
              )
          );
          return { ...newConv, messages: [...localTemp, ...(newConv.messages || [])] };
        });
        prev.forEach((prevConv) => {
          if (!incomingMap.has(prevConv.jid) && (prevConv.messages || []).some((m) => String(m.id).startsWith('temp_'))) {
            merged.push(prevConv);
          }
        });
        return merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
      setLoading(false);
    } catch (err) {
      console.error('Conversations error:', err);
      setLoading(false);
    }
  }, [userId]);

  const fetchMessages = useCallback(async (jid) => {
    if (!jid || !userId) return;
    try {
      const data = await chatsService.getMessages(userId, jid.replace('@s.whatsapp.net', ''));
      const msgs = Array.isArray(data) ? data : data?.messages ?? data?.data ?? [];
      setMessages(msgs);
    } catch {}
  }, [userId]);

  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await contactsService.getContacts(userId);
      const list = Array.isArray(data) ? data : data?.contacts ?? data?.data ?? [];
      setContacts(list);
    } catch {}
  }, [userId]);

  const fetchTemplates = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await templatesService.getTemplates(userId);
      const list = Array.isArray(data) ? data : data?.templates ?? [];
      setTemplates(list);
    } catch {}
  }, [userId]);

  useEffect(() => {
    fetchConversations();
    fetchTemplates();
    fetchContacts();
    pollRef.current = setInterval(fetchConversations, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchConversations, fetchTemplates, fetchContacts]);

  useEffect(() => {
    if (selectedJid) {
      fetchMessages(selectedJid);
      const msgPoll = setInterval(() => fetchMessages(selectedJid), 5000);
      return () => clearInterval(msgPoll);
    }
  }, [selectedJid, fetchMessages]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    if (selectedJid) await fetchMessages(selectedJid);
    await fetchContacts();
    setRefreshing(false);
  }, [fetchConversations, fetchMessages, fetchContacts, selectedJid]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend?.trim() || !selectedJid || isSending) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId, text: textToSend, fromMe: true,
      timestamp: Math.floor(Date.now() / 1000), status: 'PENDING',
      metadata: { type: 'text' }
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setConversations((prev) => prev.map((conv) =>
      conv.jid === selectedJid
        ? { ...conv, lastMessage: textToSend, timestamp: optimisticMsg.timestamp, messages: [optimisticMsg, ...(conv.messages || [])] }
        : conv
    ));
    setInputText('');
    setIsSending(true);

    try {
      await chatsService.sendMessage(userId, {
        to: selectedJid.replace('@s.whatsapp.net', ''),
        type: 'text', body: textToSend
      });
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'SENT' } : m));
      fetchMessages(selectedJid);
    } catch (err) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'FAILED' } : m));
      Toast.show({ type: 'error', text1: 'Send failed', text2: err?.response?.data?.error || err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleGetAiSuggestions = async () => {
    if (!selectedChat || !selectedChat.messages?.length) return;
    setIsAiLoading(true);
    try {
      const data = await chatsService.getAiSuggestions(selectedChat.messages.slice(-10));
      const suggestions = Array.isArray(data) ? data : data?.suggestions ?? [];
      setAiSuggestions(suggestions);
    } catch {
      setAiSuggestions(['Sure, let me check on that.', 'Could you share more details?', 'I\'ll get back to you shortly.']);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplySuggestion = (text) => {
    setInputText(text);
    setAiSuggestions([]);
  };

  const handleOpenTemplatePicker = () => {
    setSelectedTemplate(null);
    setTemplateVars({});
    setShowTemplatePicker(true);
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    const matches = (tpl.body || '').match(/\{\{(\d+)\}\}/g) || [];
    const vars = {};
    matches.forEach((m) => { vars[m] = ''; });
    setTemplateVars(vars);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !selectedJid) return;

    const templateName = selectedTemplate.templateName || selectedTemplate.name;
    const bodyParams = Object.entries(templateVars).map(([, val]) => ({
      type: 'text', text: val || ' '
    }));
    const components = bodyParams.length > 0 ? [{ type: 'body', parameters: bodyParams }] : [];

    let previewText = selectedTemplate.body || `[Template: ${templateName}]`;
    Object.entries(templateVars).forEach(([key, val]) => {
      previewText = previewText.replace(key, val || key);
    });

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId, text: previewText, fromMe: true,
      timestamp: Math.floor(Date.now() / 1000), status: 'PENDING',
      metadata: { type: 'template', templateName }
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setShowTemplatePicker(false);
    setSelectedTemplate(null);
    setTemplateVars({});
    setIsSending(true);

    try {
      await chatsService.sendMessage(userId, {
        to: selectedJid.replace('@s.whatsapp.net', ''),
        type: 'template',
        template: { name: templateName, language: { code: selectedTemplate.language || 'en_US' }, components }
      });
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'SENT' } : m));
      fetchMessages(selectedJid);
    } catch (err) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'FAILED' } : m));
      Toast.show({ type: 'error', text1: 'Template send failed', text2: err?.response?.data?.error || err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplatePreview = (msg) => {
    const templateName = msg.metadata?.originalPayload?.template?.name || msg.metadata?.templateName;
    if (!templateName) return;
    const found = templates.find((t) => t.templateName === templateName || t.name === templateName);
    if (found) {
      Toast.show({ type: 'info', text1: templateName, text2: found.body || 'Template details' });
    }
  };

  const selectConversation = (jid) => {
    setSelectedJid(jid);
    setMessages([]);
    setAiSuggestions([]);
  };

  const deleteConversation = async (jid) => {
    try {
      await chatsService.deleteConversation(userId, jid);
      if (selectedJid === jid) { setSelectedJid(null); setMessages([]); }
      setConversations((prev) => prev.filter((c) => c.jid !== jid));
      Toast.show({ type: 'success', text1: 'Conversation deleted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.jid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter((c) => {
    const name = c.name || '';
    const phone = c.phone || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
  });

  const approvedTemplates = templates.filter((t) => t.approved || t.status === 'APPROVED' || t.status === 'approved');

  // Conversation List / Contacts View
  if (!selectedJid) {
    return (
      <SafeAreaView className={`flex-1 ${palette.page}`}>
        <StatusBar style={palette.statusBar} />
        <View className="flex-1 px-4 pt-5">
          <View className="mb-4">
            <View className="mb-3 self-start rounded-full bg-sky-600 px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">CHATS</Text>
            </View>
            <Text className={`text-[28px] font-bold ${palette.text}`}>Inbox</Text>
            <Text className={`mt-1 text-[14px] ${palette.textSoft}`}>
              {activeTab === 'chats' ? `${conversations.length} conversations` : `${contacts.length} contacts`}
            </Text>
          </View>

          <View className={`mb-4 flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${palette.border}`}
            style={{ backgroundColor: palette.colors.surface }}>
            <Ionicons name="search" size={18} color={palette.textMutedColor} />
            <TextInput
              className="flex-1 text-[15px]" style={{ color: palette.textColor }}
              placeholder={`Search ${activeTab}...`} placeholderTextColor={palette.textMutedColor}
              value={searchTerm} onChangeText={setSearchTerm} />
          </View>

          <View className="mb-4 flex-row gap-2">
            {['chats', 'contacts'].map((tab) => (
              <TouchableOpacity key={tab} onPress={() => { setActiveTab(tab); setSearchTerm(''); }}
                className={`flex-1 items-center rounded-xl py-2.5 ${activeTab === tab ? 'bg-sky-600' : 'border'}`}
                style={activeTab !== tab ? { borderColor: palette.colors.border } : {}}>
                <Text className={`text-[13px] font-bold ${activeTab === tab ? 'text-white' : palette.text}`}>
                  {tab === 'chats' ? 'Chats' : 'Contacts'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'chats' ? (
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.jid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
              ListEmptyComponent={
                loading ? null : (
                  <KonnectxEmptyState icon="chatbubbles-outline" title="No conversations"
                    description="Start a conversation by selecting a contact." />
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
                      <Text className={`text-[15px] font-bold flex-1 ${palette.text}`} numberOfLines={1}>
                        {item.name || item.jid?.split('@')[0]}
                      </Text>
                      <Text className={`text-[11px] ${palette.textMuted}`}>{formatTime(item.timestamp)}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      {item.fromMe ? (
                        <Text className="text-[11px] font-semibold text-sky-500">You: </Text>
                      ) : null}
                      <Text className={`text-[13px] flex-1 ${palette.textSoft}`} numberOfLines={1}>
                        {item.lastMessage || item.messages?.[0]?.text || ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id || item.phone}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <KonnectxEmptyState icon="people-outline" title="No contacts"
                  description="Contacts will appear here once imported." />
              }
              renderItem={({ item }) => {
                const normalizedJid = item.phone?.replace(/\D/g, '') + '@s.whatsapp.net';
                return (
                  <TouchableOpacity
                    onPress={() => selectConversation(normalizedJid)}
                    className={`mb-2 flex-row items-center gap-3 rounded-[20px] border p-4 ${palette.surface} ${palette.border}`}>
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                      <Text className="text-[16px] font-bold text-emerald-600">
                        {(item.name || item.phone)?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`text-[15px] font-bold ${palette.text}`}>{item.name || item.phone}</Text>
                      <Text className={`mt-0.5 text-[12px] ${palette.textSoft}`}>{item.phone}</Text>
                    </View>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={palette.textMutedColor} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Chat View
  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
        {/* Header */}
        <View className={`flex-row items-center gap-3 border-b px-4 py-3 ${palette.surface} ${palette.border}`}>
          <TouchableOpacity onPress={() => { setSelectedJid(null); setMessages([]); setAiSuggestions([]); }}>
            <Ionicons name="arrow-back" size={24} color={palette.textColor} />
          </TouchableOpacity>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
            <Text className="text-[14px] font-bold text-sky-600">{activeName?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-[16px] font-bold ${palette.text}`} numberOfLines={1}>{activeName}</Text>
            <Text className={`text-[10px] text-emerald-500 font-bold uppercase tracking-tight`}>
              {selectedChat ? 'Active Conversation' : 'New Chat'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => deleteConversation(selectedJid)}>
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id?.toString()}
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            windowSize={10}
            ListEmptyComponent={
              <KonnectxEmptyState icon="chatbubble-ellipses-outline" title="No messages yet"
                description="Send a message to start the conversation." />
            }
            renderItem={({ item }) => {
              const isFromMe = item.fromMe;
              const type = item.metadata?.type || 'text';
              const isTemplate = type === 'template';
              const isMedia = ['image', 'video', 'audio', 'document'].includes(type);

              return (
                <View className={`mb-3 max-w-[85%] ${isFromMe ? 'self-end' : 'self-start'}`}>
                  {isTemplate ? (
                    <TouchableOpacity onPress={() => handleTemplatePreview(item)} activeOpacity={0.8}>
                      <TemplateMessageBubble msg={item} templateDefinition={null} />
                    </TouchableOpacity>
                  ) : isMedia ? (
                    <MediaBubble msg={item} />
                  ) : (
                    <View className="rounded-[20px] px-4 py-2.5" style={{
                      backgroundColor: isFromMe ? '#0284c7' : palette.colors.surface,
                      borderColor: isFromMe ? 'transparent' : palette.colors.border,
                      borderWidth: isFromMe ? 0 : 1,
                    }}>
                      <Text className={`text-[15px] leading-5 ${isFromMe ? 'text-white' : palette.text}`}>
                        {item.text}
                      </Text>
                    </View>
                  )}
                  <View className={`mt-1 flex-row items-center gap-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                    <Text className={`text-[10px] ${palette.textMuted}`}>{formatDistance(item.timestamp)}</Text>
                    {isFromMe ? <MessageStatus status={item.status} /> : null}
                  </View>
                </View>
              );
            }}
          />

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 ? (
            <View className={`flex-row flex-wrap gap-2 px-4 py-2 border-t ${palette.border}`}>
              {aiSuggestions.map((s, idx) => (
                <TouchableOpacity key={idx} onPress={() => handleApplySuggestion(s)}
                  className="rounded-full bg-sky-600/15 border border-sky-600/30 px-3 py-1.5">
                  <Text className="text-[11px] font-medium text-sky-600" numberOfLines={1}>{s}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setAiSuggestions([])} className="px-2 py-1.5">
                <Text className="text-[11px] text-gray-400">Clear</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Input */}
          <View className={`flex-row items-center gap-2 border-t px-4 py-3 ${palette.surface} ${palette.border}`}>
            <TouchableOpacity onPress={handleGetAiSuggestions} disabled={isAiLoading || !selectedChat}
              className="h-10 w-10 items-center justify-center rounded-full">
              {isAiLoading ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <Ionicons name="sparkles" size={20} color="#0284c7" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenTemplatePicker}
              className="h-10 w-10 items-center justify-center rounded-full">
              <Ionicons name="layers-outline" size={20} color={palette.textMutedColor} />
            </TouchableOpacity>
            <TextInput
              className={`flex-1 rounded-[24px] border px-4 py-2.5 text-[15px] ${palette.page}`}
              style={{ borderColor: palette.colors.border, color: palette.textColor, maxHeight: 100 }}
              placeholder="Type a message..."
              placeholderTextColor={palette.textMutedColor}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isSending}
              className="h-11 w-11 items-center justify-center rounded-full bg-sky-600"
              style={{ opacity: inputText.trim() && !isSending ? 1 : 0.5 }}>
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Template Picker Modal */}
      <Modal visible={showTemplatePicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTemplatePicker(false)}>
        <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="layers-outline" size={20} color="#0284c7" />
              <Text className={`text-[18px] font-bold ${palette.text}`}>
                {selectedTemplate ? 'Fill Variables' : 'Select a Template'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setShowTemplatePicker(false); setSelectedTemplate(null); }}>
              <Text className="text-[16px] font-bold text-sky-600">Close</Text>
            </TouchableOpacity>
          </View>

          {!selectedTemplate ? (
            <FlatList
              data={approvedTemplates}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              ListEmptyComponent={
                <KonnectxEmptyState icon="layers-outline" title="No approved templates"
                  description="Sync your templates from the Templates page first." />
              }
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectTemplate(item)}
                  className="mb-3 rounded-[20px] border p-4"
                  style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className={`text-[15px] font-bold ${palette.text}`}>{item.name}</Text>
                      {item.body ? (
                        <Text className={`mt-1 text-[12px] leading-[18px] ${palette.textSoft}`} numberOfLines={2}>
                          {item.body}
                        </Text>
                      ) : null}
                    </View>
                    <View className="items-end gap-1">
                      <View className="rounded-full bg-emerald-500/15 px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-emerald-600">APPROVED</Text>
                      </View>
                      <Text className={`text-[9px] ${palette.textMuted}`}>{item.language || 'en'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <ScrollView className="flex-1 px-5 pt-6">
              <View className={`mb-4 rounded-[20px] border p-4 ${palette.surface} ${palette.border}`}>
                <Text className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${palette.textMuted}`}>Preview</Text>
                <Text className={`text-[13px] leading-5 ${palette.text}`}>
                  {fillTemplatePreview(selectedTemplate.body || '', templateVars)}
                </Text>
              </View>

              {Object.keys(templateVars).length > 0 ? (
                <View className="gap-3 mb-6">
                  <Text className={`text-[12px] font-medium ${palette.textMuted}`}>Fill in the variables:</Text>
                  {Object.keys(templateVars).map((key, idx) => (
                    <View key={key}>
                      <Text className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${palette.textMuted}`}>
                        Variable {idx + 1} <Text className="text-sky-500">{key}</Text>
                      </Text>
                      <TextInput
                        className="rounded-xl border px-4 py-3 text-[14px]"
                        style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                        placeholder={`Enter value for ${key}...`} placeholderTextColor={palette.textMutedColor}
                        value={templateVars[key]} onChangeText={(v) => setTemplateVars((prev) => ({ ...prev, [key]: v }))}
                        autoFocus={idx === 0} />
                    </View>
                  ))}
                </View>
              ) : (
                <Text className={`text-center py-4 text-[12px] ${palette.textSoft}`}>No variables required for this template.</Text>
              )}

              <View className="flex-row gap-3 mb-8">
                <TouchableOpacity onPress={() => setSelectedTemplate(null)}
                  className="flex-1 items-center rounded-xl border py-3.5" style={{ borderColor: palette.colors.border }}>
                  <Text className={`text-[15px] font-bold ${palette.text}`}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendTemplate} disabled={isSending}
                  className="flex-1 items-center rounded-xl bg-sky-600 py-3.5">
                  <Text className="text-[15px] font-bold text-white">
                    {isSending ? 'Sending...' : 'Send Template'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
