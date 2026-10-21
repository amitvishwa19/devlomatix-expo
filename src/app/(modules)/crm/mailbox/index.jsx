import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppScreen from '~/components/AppScreen';
import CrmHeader from '../_components/CrmHeader';
import { useCrmTheme } from '../utils/colors';
import { getMailboxThreads, updateMailboxThread } from '~/services/mailbox';
import { useCrmSocket } from '~/providers/CrmSocketProvider';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

const FOLDERS = [
  { id: 'INBOX', label: 'Inbox', icon: 'mail-outline', activeIcon: 'mail' },
  { id: 'SENT', label: 'Sent', icon: 'paper-plane-outline', activeIcon: 'paper-plane' },
  { id: 'STARRED', label: 'Starred', icon: 'star-outline', activeIcon: 'star' },
  { id: 'ARCHIVE', label: 'Archive', icon: 'archive-outline', activeIcon: 'archive' },
  { id: 'TRASH', label: 'Trash', icon: 'trash-outline', activeIcon: 'trash' },
];

function formatTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (_) {
    return '';
  }
}

export default function CrmMailboxScreen() {
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { socket } = useCrmSocket() || {};

  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [threads, setThreads] = useState([]);
  const [counts, setCounts] = useState({ unread: 0, inbox: 0, starred: 0, sent: 0, archive: 0, trash: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load threads
  const loadThreads = useCallback(async (folder = currentFolder, search = searchQuery, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getMailboxThreads({ folder, search, limit: 50 });
      if (res.success) {
        setThreads(res.data);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.warn('[MAILBOX_LOAD_ERR]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentFolder, searchQuery]);

  useEffect(() => {
    loadThreads(currentFolder, searchQuery);
  }, [currentFolder]);

  // Real-time socket updates for incoming and sent emails
  useEffect(() => {
    if (!socket) return;

    const handleNewEmail = (data) => {
      try {
        HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
      } catch (_) {}

      // Update counters immediately
      setCounts((prev) => ({
        ...prev,
        unread: (prev.unread || 0) + 1,
        inbox: (prev.inbox || 0) + 1,
      }));

      // Prepend thread if in INBOX
      if (currentFolder === 'INBOX' || currentFolder === 'ALL') {
        loadThreads(currentFolder, searchQuery);
      }
    };

    const handleEmailSent = () => {
      setCounts((prev) => ({
        ...prev,
        sent: (prev.sent || 0) + 1,
      }));
      if (currentFolder === 'SENT') {
        loadThreads(currentFolder, searchQuery);
      }
    };

    socket.on('crm:mailbox:new_email', handleNewEmail);
    socket.on('crm:mailbox:email_sent', handleEmailSent);

    return () => {
      socket.off('crm:mailbox:new_email', handleNewEmail);
      socket.off('crm:mailbox:email_sent', handleEmailSent);
    };
  }, [socket, currentFolder, searchQuery, loadThreads]);

  // Star / unstar handler with instant optimistic state
  const handleToggleStar = async (thread) => {
    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
    } catch (_) {}

    const nextStarred = !thread.isStarred;
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, isStarred: nextStarred } : t))
    );
    setCounts((prev) => ({
      ...prev,
      starred: nextStarred ? (prev.starred || 0) + 1 : Math.max(0, (prev.starred || 0) - 1),
    }));

    await updateMailboxThread(thread.id, { action: 'toggleStar' });
  };

  // Render individual email thread item
  const renderThreadCard = ({ item }) => {
    const isUnread = (item.unreadCount || 0) > 0;
    const senderName = item.contact?.name || item.messages?.[0]?.from || 'Unknown Sender';
    const cleanSender = senderName.replace(/[<>]/g, '').trim();
    const initials = (cleanSender.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'EM').toUpperCase();
    const lastMsgDirection = item.messages?.[0]?.direction || (item.folder === 'SENT' ? 'OUTBOUND' : 'INBOUND');
    const isOutbound = lastMsgDirection === 'OUTBOUND';

    return (
      <Pressable
        onPress={() => {
          try {
            HapticsModule?.selectionAsync?.();
          } catch (_) {}
          router.push(`/(modules)/crm/mailbox/${item.id}`);
        }}
        className="mx-3 mb-2 rounded-2xl border p-3 active:opacity-75"
        style={{
          backgroundColor: isUnread
            ? isDark ? '#1e293b' : '#f0f7ff'
            : colors.card,
          borderColor: isUnread
            ? colors.primaryBorder
            : colors.border,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <View className="flex-row items-start gap-2.5">
          {/* Avatar / Direction Icon */}
          <View
            className="h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
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
              {initials}
            </Text>
          </View>

          {/* Center Column: Sender, Subject, Snippet */}
          <View className="flex-1 min-w-0 pr-1">
            <View className="flex-row items-center justify-between mb-0.5">
              <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                <Text
                  className={`text-[13px] ${isUnread ? 'font-bold' : 'font-semibold'}`}
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {cleanSender}
                </Text>
                {item._count?.messages > 1 && (
                  <View
                    className="px-1.5 py-0.2 rounded-md"
                    style={{ backgroundColor: colors.borderLight }}
                  >
                    <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                      {item._count.messages}
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                {formatTime(item.lastMessageAt || item.createdAt)}
              </Text>
            </View>

            {/* Subject */}
            <Text
              className={`text-[13px] mb-1 ${isUnread ? 'font-bold' : 'font-medium'}`}
              style={{ color: isUnread ? colors.text : colors.textSecondary }}
              numberOfLines={1}
            >
              {item.subject || '(No Subject)'}
            </Text>

            {/* Snippet */}
            <Text
              className="text-[12px] leading-tight"
              style={{ color: colors.textMuted }}
              numberOfLines={2}
            >
              {item.snippet || 'No message preview'}
            </Text>

            {/* Bottom Meta Tags: Contact / Deal */}
            {(item.contact || item.deal) && (
              <View className="flex-row items-center gap-1.5 mt-2 flex-wrap">
                {item.contact && (
                  <View
                    className="flex-row items-center gap-1 px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
                  >
                    <Ionicons name="person-outline" size={10} color={colors.textMuted} />
                    <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                      {item.contact.name}
                    </Text>
                  </View>
                )}
                {item.deal && (
                  <View
                    className="flex-row items-center gap-1 px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }}
                  >
                    <Ionicons name="pricetag-outline" size={10} color={colors.primary} />
                    <Text className="text-[10px] font-semibold" style={{ color: colors.primary }}>
                      {item.deal.title}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Right Actions: Star toggle & unread dot */}
          <View className="items-center justify-between h-full pt-0.5">
            <Pressable
              onPress={() => handleToggleStar(item)}
              hitSlop={10}
              className="p-1"
            >
              <Ionicons
                name={item.isStarred ? 'star' : 'star-outline'}
                size={18}
                color={item.isStarred ? '#f59e0b' : colors.textSoft}
              />
            </Pressable>

            {isUnread && (
              <View
                className="w-2.5 h-2.5 rounded-full mt-2"
                style={{ backgroundColor: colors.primary }}
              />
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <AppScreen safeArea="none" className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <CrmHeader
        title="CRM Mailbox"
        subtitle={
          counts.unread > 0
            ? `${counts.unread} unread emails`
            : `${counts.inbox} emails in inbox`
        }
        showBack={true}
        rightActions={
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => setIsSearchVisible(!isSearchVisible)}
              className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Ionicons
                name={isSearchVisible ? 'close' : 'search-outline'}
                size={16}
                color={colors.text}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(modules)/crm/mailbox/compose')}
              className="h-8 px-3 flex-row items-center gap-1.5 rounded-xl shadow-xs active:opacity-75"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="create-outline" size={15} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Compose</Text>
            </Pressable>
          </View>
        }
      />

      {/* Collapsible Search Input */}
      {isSearchVisible && (
        <View
          className="px-3 py-2 border-b flex-row items-center gap-2"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View
            className="flex-1 flex-row items-center px-3 h-9 rounded-xl border"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
          >
            <Ionicons name="search-outline" size={15} color={colors.inputPlaceholder} />
            <TextInput
              placeholder="Search by sender, subject, content..."
              placeholderTextColor={colors.inputPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => loadThreads(currentFolder, searchQuery)}
              returnKeyType="search"
              className="flex-1 ml-2 text-xs"
              style={{ color: colors.text }}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  loadThreads(currentFolder, '');
                }}
              >
                <Ionicons name="close-circle" size={15} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      {/* Folder Filter Pills Bar */}
      <View
        className="py-2.5 border-b"
        style={{ backgroundColor: colors.header, borderColor: colors.headerBorder }}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FOLDERS}
          keyExtractor={(f) => f.id}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          renderItem={({ item: folder }) => {
            const isActive = currentFolder === folder.id;
            const count =
              folder.id === 'INBOX'
                ? counts.unread
                : folder.id === 'SENT'
                ? counts.sent
                : folder.id === 'STARRED'
                ? counts.starred
                : 0;

            return (
              <Pressable
                onPress={() => {
                  try {
                    HapticsModule?.selectionAsync?.();
                  } catch (_) {}
                  setCurrentFolder(folder.id);
                }}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border active:opacity-75"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
              >
                <Ionicons
                  name={isActive ? folder.activeIcon : folder.icon}
                  size={14}
                  color={isActive ? '#ffffff' : colors.textMuted}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isActive ? '#ffffff' : colors.text }}
                >
                  {folder.label}
                </Text>
                {count > 0 && (
                  <View
                    className="px-1.5 py-0.2 rounded-full"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.primarySoft,
                    }}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: isActive ? '#ffffff' : colors.primary }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* Threads List */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
            Loading emails...
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThreadCard}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 90 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadThreads(currentFolder, searchQuery, true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="py-20 px-6 items-center justify-center">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Ionicons name="mail-open-outline" size={32} color={colors.primary} />
              </View>
              <Text className="text-sm font-bold text-center mb-1" style={{ color: colors.text }}>
                No emails in {FOLDERS.find((f) => f.id === currentFolder)?.label || 'folder'}
              </Text>
              <Text className="text-xs text-center max-w-[240px]" style={{ color: colors.textMuted }}>
                {searchQuery
                  ? 'No matching emails found for your search query.'
                  : 'Your inbox is all caught up! You can compose a new email anytime.'}
              </Text>
              <Pressable
                onPress={() => router.push('/(modules)/crm/mailbox/compose')}
                className="mt-4 px-4 py-2 rounded-xl flex-row items-center gap-1.5 active:opacity-75"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="create-outline" size={15} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Send New Email</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}
