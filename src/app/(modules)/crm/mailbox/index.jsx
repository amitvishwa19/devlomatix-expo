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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppScreen from '~/components/AppScreen';
import CrmHeader from '../_components/CrmHeader';
import { useCrmTheme } from '../utils/colors';
import { getMailboxThreads, updateMailboxThread, deleteMailboxThread } from '~/services/mailbox';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import Toast from 'react-native-toast-message';
import IosDeleteConfirmModal from './_components/IosDeleteConfirmModal';

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

export default function CrmMailboxScreen({ isTab = false }) {
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

  // Multi-Mailbox Identity state from Org Builder
  const [mailboxes, setMailboxes] = useState([]);
  const [activeMailboxEmail, setActiveMailboxEmail] = useState('ALL');
  const [isMailboxModalVisible, setIsMailboxModalVisible] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Active mailbox object for header / switchers
  const activeMailbox = useMemo(() => {
    const cleanActive = (activeMailboxEmail || 'ALL').trim().toLowerCase();
    return (
      mailboxes.find((m) => (m.email || '').trim().toLowerCase() === cleanActive) ||
      mailboxes[0] || {
        id: 'all',
        email: 'ALL',
        label: 'All Inboxes',
        type: 'ALL',
      }
    );
  }, [mailboxes, activeMailboxEmail]);

  // Load threads supporting both options object and positional arguments
  const loadThreads = useCallback(
    async (folderOrOpts, searchParam, mailboxEmailParam, isRefreshParam) => {
      let folder = currentFolder;
      let search = searchQuery;
      let mailboxEmail = activeMailboxEmail;
      let isRefresh = false;

      if (folderOrOpts && typeof folderOrOpts === 'object') {
        if (folderOrOpts.folder !== undefined) folder = folderOrOpts.folder;
        if (folderOrOpts.search !== undefined) search = folderOrOpts.search;
        if (folderOrOpts.mailboxEmail !== undefined) mailboxEmail = folderOrOpts.mailboxEmail;
        if (folderOrOpts.isRefresh !== undefined) isRefresh = !!folderOrOpts.isRefresh;
      } else {
        if (folderOrOpts !== undefined) folder = folderOrOpts;
        if (searchParam !== undefined) search = searchParam;
        if (mailboxEmailParam !== undefined) mailboxEmail = mailboxEmailParam;
        if (isRefreshParam !== undefined) isRefresh = !!isRefreshParam;
      }

      // Safeguard: ensure mailboxEmail is never a boolean or invalid
      if (typeof mailboxEmail !== 'string' || !mailboxEmail.trim()) {
        mailboxEmail = activeMailboxEmail || 'ALL';
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await getMailboxThreads({ folder, search, mailboxEmail, limit: 50 });
        if (res.success) {
          setThreads(res.data || []);
          if (res.counts) setCounts(res.counts);
          if (res.mailboxes && Array.isArray(res.mailboxes) && res.mailboxes.length > 0) {
            setMailboxes(res.mailboxes);
          }
        }
      } catch (err) {
        console.warn('[MAILBOX_LOAD_ERR]', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentFolder, searchQuery, activeMailboxEmail]
  );

  useEffect(() => {
    loadThreads({ folder: currentFolder, search: searchQuery, mailboxEmail: activeMailboxEmail });
  }, [currentFolder, activeMailboxEmail]);

  const handleSelectMailbox = (email) => {
    const clean = (email || 'ALL').trim();
    setIsMailboxModalVisible(false);
    if (clean.toLowerCase() !== (activeMailboxEmail || 'ALL').toLowerCase()) {
      setActiveMailboxEmail(clean);
    } else {
      loadThreads({ folder: currentFolder, search: searchQuery, mailboxEmail: clean });
    }
  };

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

  // Toggle Read / Unread with instant optimistic state
  const handleToggleRead = async (thread) => {
    try {
      HapticsModule?.selectionAsync?.();
    } catch (_) {}

    const isCurrentlyUnread = (thread.unreadCount || 0) > 0;
    const nextUnread = isCurrentlyUnread ? 0 : 1;

    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: nextUnread } : t))
    );
    setCounts((prev) => ({
      ...prev,
      unread: isCurrentlyUnread ? Math.max(0, (prev.unread || 0) - 1) : (prev.unread || 0) + 1,
    }));

    await updateMailboxThread(thread.id, { action: isCurrentlyUnread ? 'markRead' : 'markUnread' });
  };

  // Trigger iOS Delete Confirmation Modal
  const handlePromptDelete = (thread) => {
    try {
      HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Light);
    } catch (_) {}
    setDeleteConfirmTarget(thread);
  };

  // Instantaneous optimistic delete execution
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    const target = deleteConfirmTarget;
    setDeleteConfirmTarget(null);

    const prevThreads = threads;
    const prevCounts = counts;

    // 1. Instant optimistic update to local useState
    setThreads((prev) => prev.filter((t) => t.id !== target.id));
    setCounts((prev) => ({
      ...prev,
      inbox: currentFolder === 'INBOX' ? Math.max(0, (prev.inbox || 0) - 1) : prev.inbox,
      unread: (target.unreadCount || 0) > 0 ? Math.max(0, (prev.unread || 0) - 1) : prev.unread,
      starred: target.isStarred ? Math.max(0, (prev.starred || 0) - 1) : prev.starred,
      trash: currentFolder === 'TRASH' ? Math.max(0, (prev.trash || 0) - 1) : (prev.trash || 0) + 1,
    }));

    Toast.show({
      type: 'success',
      text1: currentFolder === 'TRASH' ? 'Permanently deleted' : 'Moved to Trash',
    });

    try {
      const res = await deleteMailboxThread(target.id);
      if (!res.success) {
        // Rollback state if backend returns error
        setThreads(prevThreads);
        setCounts(prevCounts);
        Toast.show({
          type: 'error',
          text1: 'Delete failed',
          text2: res.error || 'Server error',
        });
      }
    } catch (err) {
      setThreads(prevThreads);
      setCounts(prevCounts);
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: err.message,
      });
    }
  };

  // Render individual email thread item with uniform card height and density
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
          // Optimistically mark as read in local state when opened
          if (isUnread) {
            setThreads((prev) =>
              prev.map((t) => (t.id === item.id ? { ...t, unreadCount: 0 } : t))
            );
            setCounts((prev) => ({
              ...prev,
              unread: Math.max(0, (prev.unread || 0) - 1),
            }));
          }
          router.push(`/(modules)/crm/mailbox/${item.id}`);
        }}
        onLongPress={() => handlePromptDelete(item)}
        delayLongPress={300}
        className="mx-3 mb-2 rounded-[16px] border p-2.5 active:opacity-75"
        style={{
          backgroundColor: isUnread
            ? isDark ? '#1e293b' : '#f0f7ff'
            : colors.card,
          borderColor: isUnread
            ? colors.primaryBorder
            : colors.border,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <View className="flex-row items-center gap-2.5">
          {/* Avatar / Direction Icon */}
          <View className="relative shrink-0">
            <View
              className="h-9 w-9 items-center justify-center rounded-xl overflow-hidden"
              style={{
                backgroundColor: isOutbound
                  ? isDark ? '#064e3b' : '#ecfdf5'
                  : isDark ? '#1e3a8a' : '#eff6ff',
              }}
            >
              <Text
                className="font-bold text-[11px]"
                style={{ color: isOutbound ? '#10b981' : colors.primary }}
              >
                {initials}
              </Text>
            </View>

            {/* Unread indicator dot */}
            {isUnread && (
              <View
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  backgroundColor: colors.primary,
                  borderColor: isDark ? '#1e293b' : '#f0f7ff',
                }}
              />
            )}
          </View>

          {/* Center Column: Uniform 3-line layout */}
          <View className="flex-1 min-w-0 justify-center">
            {/* Line 1: Sender Name & Count + Time, Star & Trash */}
            <View className="flex-row items-center justify-between">
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

              <View className="flex-row items-center gap-1 shrink-0">
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  {formatTime(item.lastMessageAt || item.createdAt)}
                </Text>
                <Pressable
                  onPress={() => handleToggleStar(item)}
                  hitSlop={8}
                  className="p-0.5 active:opacity-60"
                >
                  <Ionicons
                    name={item.isStarred ? 'star' : 'star-outline'}
                    size={16}
                    color={item.isStarred ? '#f59e0b' : colors.textSoft}
                  />
                </Pressable>
                <Pressable
                  onPress={() => handlePromptDelete(item)}
                  hitSlop={8}
                  className="p-0.5 ml-0.5 active:opacity-60"
                >
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color={colors.textSoft}
                  />
                </Pressable>
              </View>
            </View>

            {/* Line 2: Subject + Optional Deal Pill */}
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text
                className={`text-[12px] flex-1 ${isUnread ? 'font-bold' : 'font-medium'}`}
                style={{ color: isUnread ? colors.text : colors.textSecondary }}
                numberOfLines={1}
              >
                {item.subject || '(No Subject)'}
              </Text>
              {item.deal && (
                <View
                  className="flex-row items-center gap-0.5 px-1.5 py-0.2 rounded shrink-0"
                  style={{ backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }}
                >
                  <Ionicons name="pricetag-outline" size={9} color={colors.primary} />
                  <Text className="text-[9px] font-semibold" style={{ color: colors.primary }}>
                    {item.deal.title}
                  </Text>
                </View>
              )}
            </View>

            {/* Line 3: Snippet (1 line, exact same height across all cards) */}
            <Text
              className="text-[11px] mt-0.5"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {item.snippet || 'No message preview'}
            </Text>
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
        showBack={!isTab}
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
              onPress={() =>
                router.push({
                  pathname: '/(modules)/crm/mailbox/compose',
                  params: {
                    fromEmail: activeMailboxEmail !== 'ALL' ? activeMailboxEmail : '',
                  },
                })
              }
              className="h-8 px-3 flex-row items-center gap-1.5 rounded-xl shadow-xs active:opacity-75"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="create-outline" size={15} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Compose</Text>
            </Pressable>
          </View>
        }
      />

      {/* Multi-Mailbox Switcher Bar (Org Builder Identities) */}
      {mailboxes.length > 1 && (
        <View
          className="px-3 py-1.5 border-b flex-row items-center justify-between"
          style={{ backgroundColor: colors.header, borderColor: colors.headerBorder }}
        >
          <Pressable
            onPress={() => {
              try {
                HapticsModule?.selectionAsync?.();
              } catch (_) {}
              setIsMailboxModalVisible(true);
            }}
            className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl border active:opacity-70 flex-1 max-w-[85%]"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Ionicons
              name={
                activeMailbox.type === 'ALL'
                  ? 'layers-outline'
                  : activeMailbox.type === 'PERSONAL'
                  ? 'person-outline'
                  : 'briefcase-outline'
              }
              size={13}
              color={colors.primary}
            />
            <Text className="text-[11px] font-bold flex-1" style={{ color: colors.text }} numberOfLines={1}>
              {activeMailbox.label || activeMailbox.postTitle || 'All Inboxes'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
          </Pressable>

          <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
            {activeMailbox.type === 'ALL' ? 'Unified' : activeMailbox.email?.split('@')[0]}
          </Text>
        </View>
      )}

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
              onSubmitEditing={() => loadThreads({ folder: currentFolder, search: searchQuery })}
              returnKeyType="search"
              className="flex-1 ml-2 text-xs"
              style={{ color: colors.text }}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  loadThreads({ folder: currentFolder, search: '' });
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
          contentContainerStyle={{ paddingTop: 10, paddingBottom: isTab ? 115 : 90 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadThreads({ isRefresh: true })}
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

      {/* Mailbox Identity Switcher Modal */}
      <Modal
        visible={isMailboxModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMailboxModalVisible(false)}
      >
        <Pressable
          onPress={() => setIsMailboxModalVisible(false)}
          className="flex-1 bg-black/60 items-center justify-center p-4"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border p-4 shadow-xl"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View
              className="flex-row items-center justify-between pb-2 mb-2 border-b"
              style={{ borderColor: colors.borderLight }}
            >
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Switch CRM Mailbox
                </Text>
                <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                  Assigned roles and personal email
                </Text>
              </View>
              <Pressable
                onPress={() => setIsMailboxModalVisible(false)}
                hitSlop={8}
                className="p-1"
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View className="gap-1.5">
              {mailboxes.map((mb) => {
                const isSelected =
                  (activeMailboxEmail || 'ALL').trim().toLowerCase() ===
                  (mb.email || '').trim().toLowerCase();
                return (
                  <Pressable
                    key={mb.id || mb.email}
                    onPress={() => {
                      try {
                        HapticsModule?.selectionAsync?.();
                      } catch (_) {}
                      handleSelectMailbox(mb.email);
                    }}
                    className="flex-row items-center justify-between p-2.5 rounded-xl border active:opacity-75"
                    style={{
                      backgroundColor: isSelected
                        ? isDark ? '#1e3a8a' : '#eff6ff'
                        : colors.cardAlt,
                      borderColor: isSelected ? colors.primaryBorder : colors.borderLight,
                    }}
                  >
                    <View className="flex-row items-center gap-2 flex-1 pr-2">
                      <Ionicons
                        name={
                          mb.type === 'ALL'
                            ? 'layers'
                            : mb.type === 'PERSONAL'
                            ? 'person'
                            : 'briefcase'
                        }
                        size={16}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <View className="flex-1">
                        <Text
                          className={`text-xs ${isSelected ? 'font-bold' : 'font-medium'}`}
                          style={{ color: isSelected ? colors.primary : colors.text }}
                          numberOfLines={1}
                        >
                          {mb.label || mb.postTitle || mb.email}
                        </Text>
                        {mb.email !== 'ALL' && (
                          <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                            {mb.email} {mb.department && mb.department !== 'Personal' ? `• ${mb.department}` : ''}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* iOS-Style Delete Confirmation Modal */}
      <IosDeleteConfirmModal
        visible={!!deleteConfirmTarget}
        title={
          currentFolder === 'TRASH'
            ? 'Permanently Delete Email'
            : deleteConfirmTarget?.subject
            ? `Delete "${deleteConfirmTarget.subject}"`
            : 'Delete Conversation'
        }
        message={
          currentFolder === 'TRASH'
            ? 'This conversation will be permanently deleted from the server and cannot be recovered.'
            : 'Are you sure you want to move this conversation to Trash?'
        }
        confirmText={currentFolder === 'TRASH' ? 'Delete Permanently' : 'Move to Trash'}
        isPermanent={currentFolder === 'TRASH'}
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteConfirmTarget(null)}
      />
    </AppScreen>
  );
}

