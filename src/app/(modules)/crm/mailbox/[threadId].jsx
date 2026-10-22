import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import AppScreen from '~/components/AppScreen';
import CrmHeader from '../_components/CrmHeader';
import { useCrmTheme } from '../utils/colors';
import { getMailboxThreadDetail, sendMailboxEmail, updateMailboxThread, deleteMailboxThread } from '~/services/mailbox';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import IosDeleteConfirmModal from './_components/IosDeleteConfirmModal';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

function formatFullDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return dateString;
  }
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function MailboxThreadDetailScreen() {
  const { threadId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { socket } = useCrmSocket() || {};

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [htmlModalContent, setHtmlModalContent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const scrollViewRef = useRef(null);

  const loadThread = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await getMailboxThreadDetail(threadId);
      if (res.success && res.data) {
        setThread(res.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error loading email thread',
          text2: res.error || 'Thread not found',
        });
      }
    } catch (err) {
      console.warn('[THREAD_DETAIL_ERR]', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Real-time updates via Socket
  useEffect(() => {
    if (!socket || !threadId) return;

    const handleNewMessage = (data) => {
      if (data?.threadId === threadId) {
        try {
          HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
        } catch (_) {}
        loadThread();
      }
    };

    socket.on('crm:mailbox:new_email', handleNewMessage);
    socket.on('crm:mailbox:email_sent', handleNewMessage);

    return () => {
      socket.off('crm:mailbox:new_email', handleNewMessage);
      socket.off('crm:mailbox:email_sent', handleNewMessage);
    };
  }, [socket, threadId, loadThread]);

  // Toggle star
  const handleToggleStar = async () => {
    if (!thread) return;
    const nextState = !thread.isStarred;
    setThread((prev) => ({ ...prev, isStarred: nextState }));
    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
      await updateMailboxThread(thread.id, { action: 'toggleStar' });
    } catch (_) {}
  };

  // Move folder (ARCHIVE / TRASH / INBOX)
  const handleSetFolder = async (folder) => {
    if (!thread) return;
    try {
      HapticsModule?.selectionAsync?.();
      await updateMailboxThread(thread.id, { action: 'setFolder', folder });
      Toast.show({
        type: 'success',
        text1: folder === 'TRASH' ? 'Moved to Trash' : folder === 'ARCHIVE' ? 'Archived' : 'Moved to Inbox',
      });
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Action failed', text2: err.message });
    }
  };

  // iOS-style delete prompt & execution
  const handlePromptDelete = () => {
    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
    } catch (_) {}
    setShowDeleteConfirm(true);
  };

  const handleExecuteDelete = async () => {
    if (!thread) return;
    setShowDeleteConfirm(false);

    const isPermanent = thread.folder === 'TRASH';
    Toast.show({
      type: 'success',
      text1: isPermanent ? 'Permanently deleted' : 'Moved to Trash',
    });

    try {
      HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
    } catch (_) {}

    router.back();

    deleteMailboxThread(thread.id).catch((err) => {
      console.warn('[DELETE_ERR]', err);
    });
  };

  // Quick Reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !thread) return;
    const cleanReply = replyText.trim();
    setIsSending(true);

    // Identify recipient: reply to contact or last inbound sender
    const lastInbound = thread.messages?.slice().reverse().find((m) => m.direction === 'INBOUND');
    let toRecipient = lastInbound?.fromEmail || thread.contact?.email;
    if (!toRecipient && lastInbound?.from) {
      const match = lastInbound.from.match(/<([^>]+)>/);
      toRecipient = match ? match[1] : lastInbound.from;
    }
    if (!toRecipient) {
      toRecipient = thread.contact?.email;
    }

    if (!toRecipient) {
      setIsSending(false);
      Toast.show({
        type: 'error',
        text1: 'Cannot Reply',
        text2: 'No valid recipient email address found.',
      });
      return;
    }

    const replySubject = thread.subject?.startsWith('Re:')
      ? thread.subject
      : `Re: ${thread.subject || 'Conversation'}`;

    // Optimistic UI message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      direction: 'OUTBOUND',
      from: 'You',
      fromEmail: 'me',
      to: [toRecipient],
      subject: replySubject,
      bodyText: cleanReply,
      bodyHtml: `<p>${cleanReply.replace(/\n/g, '<br/>')}</p>`,
      createdAt: new Date().toISOString(),
      status: 'SENDING',
    };

    setThread((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), tempMessage],
    }));
    setReplyText('');

    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Medium);
      const inboundRecipient = lastInbound?.to && Array.isArray(lastInbound.to) ? lastInbound.to[0] : undefined;
      const res = await sendMailboxEmail({
        threadId: thread.id,
        to: [toRecipient],
        fromEmail: inboundRecipient && inboundRecipient !== 'ALL' ? inboundRecipient : undefined,
        subject: replySubject,
        bodyText: cleanReply,
        bodyHtml: `<p>${cleanReply.replace(/\n/g, '<br/>')}</p>`,
      });

      if (res.success) {
        Toast.show({ type: 'success', text1: 'Reply sent' });
        loadThread();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to send reply',
          text2: res.error || 'Server error',
        });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Send error', text2: err.message });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <AppScreen safeArea="none" className="flex-1" style={{ backgroundColor: colors.background }}>
        <CrmHeader title="Email Thread" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
            Loading conversation...
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!thread) {
    return (
      <AppScreen safeArea="none" className="flex-1" style={{ backgroundColor: colors.background }}>
        <CrmHeader title="Thread Not Found" showBack={true} />
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSoft} />
          <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
            This conversation is no longer available.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-4 py-2 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-xs font-semibold text-white">Return to Mailbox</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const messages = thread.messages || [];

  return (
    <AppScreen safeArea="none" className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <CrmHeader
        title={thread.subject || '(No Subject)'}
        subtitle={`${messages.length} message${messages.length === 1 ? '' : 's'}`}
        showBack={true}
        rightActions={
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={handleToggleStar}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Ionicons
                name={thread.isStarred ? 'star' : 'star-outline'}
                size={16}
                color={thread.isStarred ? '#f59e0b' : colors.text}
              />
            </Pressable>

            {thread.folder !== 'ARCHIVE' && (
              <Pressable
                onPress={() => handleSetFolder('ARCHIVE')}
                hitSlop={8}
                className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Ionicons name="archive-outline" size={16} color={colors.text} />
              </Pressable>
            )}

            {thread.folder === 'TRASH' ? (
              <>
                {/* Restore to Inbox */}
                <Pressable
                  onPress={() => handleSetFolder('INBOX')}
                  hitSlop={8}
                  className="h-8 px-2.5 flex-row items-center justify-center gap-1 rounded-xl border active:opacity-70"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                >
                  <Ionicons name="arrow-undo-outline" size={15} color={colors.primary} />
                  <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                    Restore
                  </Text>
                </Pressable>

                {/* Permanent Delete */}
                <Pressable
                  onPress={handlePromptDelete}
                  hitSlop={8}
                  className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                >
                  <Ionicons name="trash" size={16} color="#ef4444" />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={handlePromptDelete}
                hitSlop={8}
                className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </Pressable>
            )}
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Thread Overview Card */}
          <View
            className="p-3 mb-3 rounded-2xl border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text className="text-[15px] font-bold tracking-tight mb-2" style={{ color: colors.text }}>
              {thread.subject || '(No Subject)'}
            </Text>

            <View className="flex-row items-center gap-1.5 flex-wrap">
              {/* Folder Badge */}
              <View
                className="px-2 py-0.5 rounded-md"
                style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
              >
                <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {thread.folder || 'INBOX'}
                </Text>
              </View>

              {/* Linked Contact */}
              {thread.contact && (
                <Pressable
                  onPress={() => router.push(`/(modules)/crm/contacts/${thread.contact.id}`)}
                  className="flex-row items-center gap-1 px-2 py-0.5 rounded-md border active:opacity-70"
                  style={{ backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderColor: colors.primaryBorder }}
                >
                  <Ionicons name="person-outline" size={11} color={colors.primary} />
                  <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                    {thread.contact.name}
                  </Text>
                  {thread.contact.email && (
                    <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                      ({thread.contact.email})
                    </Text>
                  )}
                </Pressable>
              )}

              {/* Linked Deal */}
              {thread.deal && (
                <View
                  className="flex-row items-center gap-1 px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }}
                >
                  <Ionicons name="pricetag-outline" size={11} color="#10b981" />
                  <Text className="text-[11px] font-semibold text-emerald-600">
                    {thread.deal.title}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Messages Sequence */}
          {messages.map((msg, index) => {
            const isOutbound = msg.direction === 'OUTBOUND';
            const cleanFrom = (msg.from || 'Unknown').replace(/[<>]/g, ' ').trim();
            const senderInitial = (cleanFrom.replace(/[^a-zA-Z]/g, '').slice(0, 1) || 'E').toUpperCase();
            const isExpanded = !!expandedDetails[msg.id];
            const cleanText = msg.bodyText || stripHtml(msg.bodyHtml) || 'No message content';
            const hasHtml = !!msg.bodyHtml;

            const toList = Array.isArray(msg.to)
              ? msg.to
              : typeof msg.to === 'string'
              ? [msg.to]
              : [];

            return (
              <View
                key={msg.id || index}
                className="mb-3 rounded-2xl border p-3"
                style={{
                  backgroundColor: colors.card,
                  borderColor: isOutbound ? colors.borderLight : colors.border,
                }}
              >
                {/* Message Header */}
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center gap-2 flex-1 pr-2">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: isOutbound
                          ? isDark ? '#064e3b' : '#ecfdf5'
                          : isDark ? '#1e3a8a' : '#eff6ff',
                      }}
                    >
                      <Text
                        className="font-bold text-xs"
                        style={{ color: isOutbound ? '#10b981' : colors.primary }}
                      >
                        {senderInitial}
                      </Text>
                    </View>

                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5">
                        <Text
                          className="text-[13px] font-bold"
                          style={{ color: colors.text }}
                          numberOfLines={1}
                        >
                          {isOutbound ? 'You' : cleanFrom}
                        </Text>
                        <View
                          className="px-1.5 py-0.2 rounded-md"
                          style={{
                            backgroundColor: isOutbound
                              ? isDark ? '#064e3b' : '#d1fae5'
                              : isDark ? '#1e3a8a' : '#dbeafe',
                          }}
                        >
                          <Text
                            className="text-[9px] font-bold tracking-tight uppercase"
                            style={{ color: isOutbound ? '#059669' : colors.primary }}
                          >
                            {isOutbound ? 'Sent' : 'Received'}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                        {formatFullDate(msg.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Expand Headers Toggle */}
                  <Pressable
                    onPress={() =>
                      setExpandedDetails((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                    }
                    hitSlop={6}
                    className="p-1"
                  >
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color={colors.textSoft}
                    />
                  </Pressable>
                </View>

                {/* Expanded Details: To, Cc, Bcc */}
                {isExpanded && (
                  <View
                    className="p-2 mb-2 rounded-xl border"
                    style={{ backgroundColor: colors.cardAlt, borderColor: colors.borderLight }}
                  >
                    <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                      <Text className="font-bold" style={{ color: colors.text }}>From: </Text>
                      {msg.from || msg.fromEmail || 'N/A'}
                    </Text>
                    {toList.length > 0 && (
                      <Text className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                        <Text className="font-bold" style={{ color: colors.text }}>To: </Text>
                        {toList.join(', ')}
                      </Text>
                    )}
                    {msg.cc?.length > 0 && (
                      <Text className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                        <Text className="font-bold" style={{ color: colors.text }}>Cc: </Text>
                        {Array.isArray(msg.cc) ? msg.cc.join(', ') : msg.cc}
                      </Text>
                    )}
                  </View>
                )}

                {/* Message Body Content */}
                <View className="pt-1 pb-1">
                  <Text
                    className="text-[13px] leading-relaxed"
                    style={{ color: colors.text }}
                    selectable={true}
                  >
                    {cleanText}
                  </Text>
                </View>

                {/* HTML View Modal Launcher */}
                {hasHtml && (
                  <Pressable
                    onPress={() => setHtmlModalContent(msg.bodyHtml)}
                    className="mt-2.5 py-1.5 px-2.5 rounded-xl border flex-row items-center justify-between active:opacity-75"
                    style={{ backgroundColor: colors.cardAlt, borderColor: colors.borderLight }}
                  >
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="globe-outline" size={13} color={colors.primary} />
                      <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                        View Original HTML Layout
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={13} color={colors.primary} />
                  </Pressable>
                )}

                {/* Attachments (if any) */}
                {msg.attachments?.length > 0 && (
                  <View className="mt-2.5 pt-2 border-t" style={{ borderColor: colors.borderLight }}>
                    <Text className="text-[11px] font-bold mb-1.5" style={{ color: colors.textMuted }}>
                      Attachments ({msg.attachments.length})
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {msg.attachments.map((att, attIdx) => (
                        <View
                          key={att.id || attIdx}
                          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
                          style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                        >
                          <Ionicons name="attach" size={14} color={colors.textSecondary} />
                          <Text
                            className="text-[11px] font-medium"
                            style={{ color: colors.text }}
                            numberOfLines={1}
                          >
                            {att.filename || 'Attachment'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Reply Bar */}
        <View
          className="px-3 py-2 border-t flex-row items-end gap-2"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View
            className="flex-1 rounded-2xl border px-3 py-1.5 max-h-28"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
          >
            <TextInput
              placeholder="Write a quick reply..."
              placeholderTextColor={colors.inputPlaceholder}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              className="text-[13px] leading-tight py-1"
              style={{ color: colors.text, maxHeight: 90 }}
            />
          </View>

          {/* Expand to full composer */}
          <Pressable
            onPress={() => {
              const lastInbound = thread.messages?.slice().reverse().find((m) => m.direction === 'INBOUND');
              const threadInboundTo = (lastInbound?.to && Array.isArray(lastInbound.to) && lastInbound.to[0]) || '';
              let recipient = lastInbound?.fromEmail || thread.contact?.email;
              if (!recipient && lastInbound?.from) {
                const match = lastInbound.from.match(/<([^>]+)>/);
                recipient = match ? match[1] : lastInbound.from;
              }
              if (!recipient) {
                recipient = thread.contact?.email || '';
              }
              router.push({
                pathname: '/(modules)/crm/mailbox/compose',
                params: {
                  threadId: thread.id,
                  contactId: thread.contact?.id || '',
                  dealId: thread.deal?.id || '',
                  subject: thread.subject?.startsWith('Re:') ? thread.subject : `Re: ${thread.subject || ''}`,
                  fromEmail: threadInboundTo && threadInboundTo !== 'ALL' ? threadInboundTo : '',
                  to: recipient,
                },
              });
            }}
            hitSlop={6}
            className="h-10 w-10 items-center justify-center rounded-xl border active:opacity-70"
            style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
          >
            <Ionicons name="expand-outline" size={18} color={colors.text} />
          </Pressable>

          {/* Send Reply Button */}
          <Pressable
            onPress={handleSendReply}
            disabled={isSending || !replyText.trim()}
            className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
            style={{
              backgroundColor: replyText.trim() ? colors.primary : colors.cardAlt,
              opacity: isSending || !replyText.trim() ? 0.6 : 1,
            }}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons
                name="send"
                size={17}
                color={replyText.trim() ? '#ffffff' : colors.textSoft}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* HTML Email Modal */}
      <Modal
        visible={!!htmlModalContent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHtmlModalContent(null)}
      >
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <View
            className="px-4 py-3 border-b flex-row items-center justify-between"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Email HTML Layout
            </Text>
            <Pressable
              onPress={() => setHtmlModalContent(null)}
              className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>
          {htmlModalContent && (
            <WebView
              originWhitelist={['*']}
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <style>
                        body {
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                          font-size: 14px;
                          line-height: 1.5;
                          padding: 12px;
                          margin: 0;
                          color: ${isDark ? '#f1f5f9' : '#0f172a'};
                          background-color: ${isDark ? '#0f172a' : '#ffffff'};
                          word-break: break-word;
                        }
                        img { max-width: 100% !important; height: auto !important; }
                        a { color: #3b82f6; }
                      </style>
                    </head>
                    <body>${htmlModalContent}</body>
                  </html>
                `,
              }}
              style={{ flex: 1, backgroundColor: colors.background }}
            />
          )}
        </View>
      </Modal>

      {/* iOS-Style Delete Confirmation Modal */}
      <IosDeleteConfirmModal
        visible={showDeleteConfirm}
        title={
          thread?.folder === 'TRASH'
            ? 'Permanently Delete Email'
            : thread?.subject
            ? `Delete "${thread.subject}"`
            : 'Delete Conversation'
        }
        message={
          thread?.folder === 'TRASH'
            ? 'This conversation will be permanently deleted from the server and cannot be recovered.'
            : 'Are you sure you want to move this conversation to Trash?'
        }
        confirmText={thread?.folder === 'TRASH' ? 'Delete Permanently' : 'Move to Trash'}
        isPermanent={thread?.folder === 'TRASH'}
        onConfirm={handleExecuteDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppScreen>
  );
}
