import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../utils/colors';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import ShareContactModal from '../_components/ShareContactModal';
import IosDeleteConfirmModal from '../_components/IosDeleteConfirmModal';
import * as crmService from '~/services/crm';
import { getMailboxThreads } from '~/services/mailbox';

function formatTimelineDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffHours = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch (_) {
    return '';
  }
}

export default function ContactDossierScreen() {
  const { contactId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { openQuickWhatsApp, openCreateTask, openCreateDeal, refreshAll, optimisticDeleteContact } = useCrm();
  const { startCall } = useCrmSocket();

  const [contact, setContact] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);
  const [mailboxThreads, setMailboxThreads] = useState([]);
  const [dcrRecords, setDcrRecords] = useState([]);
  const [timelineFilter, setTimelineFilter] = useState('ALL'); // 'ALL' | 'EMAIL' | 'WHATSAPP' | 'CALL_VISIT' | 'SUPPORT'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [deleteContactVisible, setDeleteContactVisible] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState(null);

  const fetchContact = useCallback(async () => {
    if (!contactId) return;
    try {
      const res = await crmService.getContact(contactId);
      if (res.success && res.data) {
        setContact(res.data);

        // 1. Fetch linked Deskflow support tickets for 360° customer context
        crmService
          .getContactDeskflowTickets(contactId, res.data.email)
          .then((tRes) => {
            if (tRes.success && Array.isArray(tRes.data)) {
              setSupportTickets(tRes.data);
            }
          })
          .catch(() => {});

        // 2. Fetch linked Mailbox email threads
        getMailboxThreads({ contactId, folder: 'ALL' })
          .then((mRes) => {
            if (mRes.success && Array.isArray(mRes.data)) {
              setMailboxThreads(mRes.data);
            }
          })
          .catch(() => {});

        // 3. Fetch linked DCR field records
        if (res.data?.name || res.data?.phone) {
          crmService
            .getDcrRecords({ search: res.data.name || res.data.phone, date: 'ALL' })
            .then((dRes) => {
              if (dRes.success && Array.isArray(dRes.data)) {
                setDcrRecords(dRes.data);
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Failed to load contact:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContact();
    refreshAll();
  };

  const handleSendInlineWhatsApp = async () => {
    if (!quickMsg.trim() || !contact?.phone) return;
    try {
      setSendingMsg(true);
      setMsgFeedback(null);
      const res = await crmService.sendContactWhatsApp(contact.id, {
        message: quickMsg.trim(),
      });
      if (res.success) {
        setMsgFeedback({ type: 'success', text: 'WhatsApp sent via KonnectX!' });
        setQuickMsg('');
        fetchContact();
      } else {
        setMsgFeedback({ type: 'error', text: res.error || 'Failed to dispatch WhatsApp' });
      }
    } catch (e) {
      setMsgFeedback({ type: 'error', text: e.message || 'Error sending message' });
    } finally {
      setSendingMsg(false);
      setSendingMsg(false);
      setTimeout(() => setMsgFeedback(null), 4000);
    }
  };

  if (loading && !contact) {
    return (
      <AppScreen style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
            Loading 360° Contact Dossier...
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!contact) {
    return (
      <AppScreen style={{ backgroundColor: colors.background }}>
        <CrmHeader title="Contact Dossier" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Contact Not Found
          </Text>
        </View>
      </AppScreen>
    );
  }

  const omnichannelTimeline = useMemo(() => {
    if (!contact) return [];
    const items = [];

    // 1. Mailbox Threads / Inbound & Outbound Emails
    (mailboxThreads || []).forEach((thread) => {
      const lastMsg = thread.messages?.[0];
      const isSent = thread.folder === 'SENT';
      items.push({
        id: `mail_${thread.id}`,
        type: 'EMAIL',
        channel: 'EMAIL',
        icon: 'mail',
        color: '#3b82f6',
        badge: isSent ? 'Sent Email' : 'Received Email',
        title: thread.subject || 'No Subject',
        subtitle: lastMsg
          ? `${isSent ? 'To' : 'From'}: ${lastMsg.fromEmail || lastMsg.from || contact.email || 'Contact'}`
          : (thread.snippet || ''),
        body: thread.snippet || '',
        date: new Date(thread.lastMessageAt || thread.updatedAt || thread.createdAt || Date.now()),
        actionLabel: 'Open Thread',
        onPress: () => router.push(`/(modules)/crm/mailbox/${thread.id}`),
      });
    });

    // 2. CRM Activities (WhatsApp messages, Touchpoints, Call notes)
    (contact?.crmActivities || []).forEach((act) => {
      const titleLower = (act.title || '').toLowerCase();
      const isWa = act.type === 'WHATSAPP' || titleLower.includes('whatsapp');
      const isCall = act.type === 'CALL' || titleLower.includes('call');
      const isVisit =
        act.type === 'FIELD_VISIT' ||
        act.type === 'MEETING' ||
        titleLower.includes('visit') ||
        titleLower.includes('meeting');
      const isEmail = act.type === 'EMAIL' || titleLower.includes('email');

      // Deduplicate if we already have the email thread
      if (isEmail && mailboxThreads?.some((t) => t.id === act.metadata?.threadId)) {
        return;
      }

      const channel = isWa ? 'WHATSAPP' : isCall || isVisit ? 'CALL_VISIT' : isEmail ? 'EMAIL' : 'SYSTEM';
      const icon = isWa ? 'logo-whatsapp' : isCall ? 'call' : isVisit ? 'car' : isEmail ? 'mail' : 'flash';
      const color = isWa ? '#10b981' : isCall ? '#0ea5e9' : isVisit ? '#f59e0b' : isEmail ? '#3b82f6' : '#8b5cf6';

      items.push({
        id: `act_${act.id}`,
        type: act.type,
        channel,
        icon,
        color,
        badge: isWa ? 'WhatsApp' : isCall ? 'Phone Call' : isVisit ? 'Meeting / Visit' : isEmail ? 'Email' : 'CRM Event',
        title: act.title,
        subtitle: act.user?.displayName ? `By ${act.user.displayName}` : null,
        body: act.description || '',
        date: new Date(act.createdAt || Date.now()),
        actionLabel: isWa && contact.phone ? 'Reply WA' : null,
        onPress: isWa && contact.phone ? () => openQuickWhatsApp(contact) : null,
      });
    });

    // 3. DCR Field Records (Visits, Calls with GPS coordinates)
    (dcrRecords || []).forEach((dcr) => {
      const isVisit = dcr.callType === 'FIELD_VISIT';
      const hasGps = Boolean(dcr.latitude || dcr.rawMetadata?.geolocation);

      items.push({
        id: `dcr_${dcr.id}`,
        type: 'DCR',
        channel: 'CALL_VISIT',
        icon: isVisit ? 'car' : 'call',
        color: isVisit ? '#f59e0b' : '#3b82f6',
        badge: isVisit ? (hasGps ? '📍 GPS Verified Visit' : 'Field Visit') : 'Field Call',
        title: `${dcr.callPurpose || 'Client Consultation'} • ${dcr.outcome || 'Logged'}`,
        subtitle: dcr.location ? `📍 ${dcr.location}` : (dcr.contactPerson ? `Met: ${dcr.contactPerson}` : null),
        body: dcr.conversation || dcr.description || '',
        date: new Date(dcr.createdAt || Date.now()),
        actionLabel: 'View DCR',
        onPress: () => router.push('/(modules)/crm/dcr'),
      });
    });

    // 4. Deskflow Support Tickets
    (supportTickets || []).forEach((t) => {
      items.push({
        id: `ticket_${t.id}`,
        type: 'SUPPORT',
        channel: 'SUPPORT',
        icon: 'headset',
        color: t.status === 'OPEN' ? '#ef4444' : '#10b981',
        badge: `Support #${t.id?.slice(-4) || 'HD'}`,
        title: t.subject || t.title || 'Support Request',
        subtitle: `Status: ${t.status || 'OPEN'} • Category: ${t.category || 'General'}`,
        body: t.description || '',
        date: new Date(t.createdAt || Date.now()),
      });
    });

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [mailboxThreads, contact, dcrRecords, supportTickets, openQuickWhatsApp, router]);

  const timelineCounts = useMemo(() => {
    return {
      ALL: omnichannelTimeline.length,
      EMAIL: omnichannelTimeline.filter((i) => i.channel === 'EMAIL').length,
      WHATSAPP: omnichannelTimeline.filter((i) => i.channel === 'WHATSAPP').length,
      CALL_VISIT: omnichannelTimeline.filter((i) => i.channel === 'CALL_VISIT').length,
      SUPPORT: omnichannelTimeline.filter((i) => i.channel === 'SUPPORT').length,
    };
  }, [omnichannelTimeline]);

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'ALL') return omnichannelTimeline;
    return omnichannelTimeline.filter((i) => i.channel === timelineFilter);
  }, [omnichannelTimeline, timelineFilter]);

  const initials = (contact.name || 'C')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const deals = contact.deals || [];

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title={contact.name}
        subtitle={`${contact.jobTitle || 'Lead'} • ${contact.account?.name || 'Individual'}`}
        showBack={true}
        rightActions={
          <View className="flex-row items-center gap-x-1.5">
            <Pressable
              onPress={() => setShareVisible(true)}
              className="h-9 px-2.5 flex-row items-center justify-center gap-x-1.5 rounded-xl border active:opacity-75"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="share-social-outline" size={15} color={colors.primary} />
              <Text className="text-xs font-bold" style={{ color: colors.primary }}>Share</Text>
            </Pressable>

            <Pressable
              onPress={() => setDeleteContactVisible(true)}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-xl border active:opacity-70"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          </View>
        }
      />

      <QuickWhatsAppModal />
      <ShareContactModal
        contact={contact}
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        onUpdated={() => {
          fetchContact();
          refreshAll();
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        className="px-3 pt-2.5"
      >
        {/* Contact Profile Header Card */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-2.5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          {Array.isArray(contact.sharedWith) && contact.sharedWith.length > 0 && (
            <View
              className="mb-2.5 flex-row items-center justify-between rounded-xl p-2 border"
              style={{ backgroundColor: colors.copilotSoft, borderColor: colors.copilotBorder }}
            >
              <View className="flex-row items-center gap-x-1.5 flex-1 pr-2">
                <Ionicons name="share-social" size={14} color={colors.copilot} />
                <Text className="text-[11px] font-bold" style={{ color: colors.copilot }}>
                  Shared with {contact.sharedWith.length} team {contact.sharedWith.length === 1 ? 'member' : 'members'}
                </Text>
              </View>
              <Pressable
                onPress={() => setShareVisible(true)}
                className="rounded-lg px-2 py-0.5"
                style={{ backgroundColor: colors.copilot }}
              >
                <Text className="text-[10px] font-bold text-white">Manage</Text>
              </Pressable>
            </View>
          )}
          <View className="flex-row items-center gap-x-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl border"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Text className="text-base font-bold" style={{ color: colors.primary }}>
                {initials}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {contact.name}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                {contact.account?.name || 'Individual Prospect'}
              </Text>
              {contact.phone && (
                <Text className="text-xs font-mono font-bold mt-0.5" style={{ color: colors.textSoft }}>
                  {contact.phone}
                </Text>
              )}
            </View>
          </View>

          {/* Quick Action Dialers */}
          <View
            className="mt-3 flex-row gap-x-2 pt-2.5 border-t"
            style={{ borderTopColor: colors.border }}
          >
            {contact.phone && (
              <>
                <Pressable
                  onPress={() => openQuickWhatsApp(contact)}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 border active:opacity-75"
                  style={{
                    backgroundColor: colors.whatsappSoft,
                    borderColor: colors.whatsappBorder,
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={15} color={colors.whatsapp} />
                  <Text className="text-xs font-bold" style={{ color: colors.whatsapp }}>
                    WhatsApp
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 border active:opacity-75"
                  style={{
                    backgroundColor: colors.callSoft,
                    borderColor: colors.callBorder,
                  }}
                >
                  <Ionicons name="call-outline" size={15} color={colors.call} />
                  <Text className="text-xs font-bold" style={{ color: colors.call }}>
                    Direct Call
                  </Text>
                </Pressable>
              </>
            )}

            {contact.email && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(modules)/crm/mailbox/compose',
                    params: {
                      contactId: contact.id,
                      to: contact.email,
                    },
                  })
                }
                className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 border active:opacity-75"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="mail-outline" size={15} color={colors.primary} />
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  Email
                </Text>
              </Pressable>
            )}
          </View>

          {/* Real-Time In-App Calling & Chat */}
          <View
            className="mt-2 flex-row gap-x-2 pt-2 border-t"
            style={{ borderTopColor: colors.border }}
          >
            <Pressable
              onPress={() =>
                startCall({
                  calleeId: contact.id,
                  calleeName: contact.name,
                  calleeAvatar: null,
                  callType: 'audio',
                  contactOrDealInfo: { contactId: contact.id },
                })
              }
              className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 border active:opacity-75"
              style={{
                backgroundColor: colors.callSoft,
                borderColor: colors.callBorder,
              }}
            >
              <Ionicons name="call" size={14} color={colors.call} />
              <Text className="text-xs font-bold" style={{ color: colors.call }}>
                In-App Call
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                startCall({
                  calleeId: contact.id,
                  calleeName: contact.name,
                  calleeAvatar: null,
                  callType: 'video',
                  contactOrDealInfo: { contactId: contact.id },
                })
              }
              className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 border active:opacity-75"
              style={{
                backgroundColor: colors.whatsappSoft,
                borderColor: colors.whatsappBorder,
              }}
            >
              <Ionicons name="videocam" size={14} color={colors.whatsapp} />
              <Text className="text-xs font-bold" style={{ color: colors.whatsapp }}>
                HD Video
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(modules)/crm/chat/[chatId]',
                  params: {
                    chatId: contact.id,
                    name: contact.name,
                    phone: contact.phone || '',
                    type: 'contacts',
                  },
                })
              }
              className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 border active:opacity-75"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="chatbubbles" size={14} color={colors.textMuted} />
              <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                CRM Chat
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quick In-Page WhatsApp Messenger */}
        {contact.phone && (
          <View
            className="rounded-2xl border p-3 shadow-sm mb-2.5"
            style={{
              backgroundColor: colors.whatsappSoft,
              borderColor: colors.whatsappBorder,
            }}
          >
            <View className="flex-row items-center gap-x-2 mb-2">
              <Ionicons name="logo-whatsapp" size={15} color={colors.whatsapp} />
              <Text className="text-xs font-bold" style={{ color: colors.whatsapp }}>
                Quick WhatsApp Touchpoint
              </Text>
            </View>

            <View className="flex-row items-center gap-x-2">
              <TextInput
                value={quickMsg}
                onChangeText={setQuickMsg}
                placeholder="Type quick message..."
                placeholderTextColor={colors.inputPlaceholder}
                className="flex-1 rounded-xl border px-3.5 py-2.5 min-h-[46px] text-xs"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.whatsappBorder,
                  color: colors.text,
                }}
              />
              <Pressable
                onPress={handleSendInlineWhatsApp}
                disabled={sendingMsg || !quickMsg.trim()}
                className="h-11 px-3 flex-row items-center justify-center rounded-xl active:opacity-80"
                style={{
                  backgroundColor: colors.whatsapp,
                  opacity: sendingMsg || !quickMsg.trim() ? 0.5 : 1,
                }}
              >
                {sendingMsg ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="send" size={14} color="#ffffff" />
                )}
              </Pressable>
            </View>

            {msgFeedback && (
              <Text
                className="text-[11px] font-bold mt-2"
                style={{
                  color: msgFeedback.type === 'success' ? colors.success : colors.danger,
                }}
              >
                {msgFeedback.text}
              </Text>
            )}
          </View>
        )}

        {/* Linked Deals */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.textMuted }}
          >
            Active Deals ({deals.length})
          </Text>
          <Pressable onPress={() => openCreateDeal()}>
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              + New Deal
            </Text>
          </Pressable>
        </View>

        {deals.length > 0 ? (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View
            className="rounded-2xl border border-dashed p-4 items-center justify-center mb-2.5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>
              No active deals with this contact yet.
            </Text>
          </View>
        )}

        {/* ==================================================== */}
        {/* 🌐 OMNICHANNEL 360° CONTACT TIMELINE                 */}
        {/* ==================================================== */}
        <View className="mt-4 mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-1.5">
            <Ionicons name="git-commit" size={15} color={colors.primary} />
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              Omnichannel Timeline 360° ({omnichannelTimeline.length})
            </Text>
          </View>

          {contact.email && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(modules)/crm/mailbox/compose',
                  params: {
                    contactId: contact.id,
                    to: contact.email,
                  },
                })
              }
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-circle" size={13} color={colors.primary} />
              <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
                New Touchpoint
              </Text>
            </Pressable>
          )}
        </View>

        {/* Omnichannel Channel Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-x-1.5 mb-2.5 py-0.5"
        >
          {[
            { key: 'ALL', label: `All (${timelineCounts.ALL})`, icon: 'apps' },
            { key: 'EMAIL', label: `Emails (${timelineCounts.EMAIL})`, icon: 'mail' },
            { key: 'WHATSAPP', label: `WhatsApp (${timelineCounts.WHATSAPP})`, icon: 'logo-whatsapp' },
            { key: 'CALL_VISIT', label: `Visits & Calls (${timelineCounts.CALL_VISIT})`, icon: 'car' },
            { key: 'SUPPORT', label: `Support (${timelineCounts.SUPPORT})`, icon: 'headset' },
          ].map((tab) => {
            const isSelected = timelineFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setTimelineFilter(tab.key)}
                className="flex-row items-center gap-x-1 rounded-xl px-2.5 py-1.5 border active:opacity-75"
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={12}
                  color={isSelected ? '#ffffff' : colors.textMuted}
                />
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: isSelected ? '#ffffff' : colors.text }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Timeline Stream */}
        {filteredTimeline.length > 0 ? (
          <View className="space-y-2 mb-3">
            {filteredTimeline.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border p-3 shadow-xs mb-2"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View className="flex-row items-start gap-x-2.5">
                  {/* Channel Icon Avatar */}
                  <View
                    className="h-8 w-8 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Ionicons name={item.icon} size={15} color={item.color} />
                  </View>

                  <View className="flex-1">
                    {/* Meta row: Badge + Timestamp */}
                    <View className="flex-row items-center justify-between">
                      <View
                        className="rounded-full px-2 py-0.5 border"
                        style={{
                          backgroundColor: `${item.color}12`,
                          borderColor: `${item.color}35`,
                        }}
                      >
                        <Text
                          className="text-[9px] font-bold uppercase tracking-tight"
                          style={{ color: item.color }}
                        >
                          {item.badge}
                        </Text>
                      </View>

                      <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                        {formatTimelineDate(item.date)}
                      </Text>
                    </View>

                    {/* Title */}
                    <Text
                      className="text-xs font-bold mt-1 tracking-tight"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    {/* Subtitle */}
                    {item.subtitle ? (
                      <Text
                        className="text-[10px] font-semibold mt-0.5"
                        style={{ color: colors.textMuted }}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}

                    {/* Body snippet */}
                    {item.body ? (
                      <Text
                        className="text-[11px] mt-1 leading-4"
                        style={{ color: colors.textSecondary }}
                        numberOfLines={2}
                      >
                        {item.body}
                      </Text>
                    ) : null}

                    {/* Action Trigger Button */}
                    {item.actionLabel && item.onPress ? (
                      <View className="mt-2 flex-row items-center justify-end">
                        <Pressable
                          onPress={item.onPress}
                          className="flex-row items-center gap-x-1 rounded-lg px-2.5 py-1 border active:opacity-75"
                          style={{
                            backgroundColor: colors.cardAlt,
                            borderColor: `${item.color}40`,
                          }}
                        >
                          <Text
                            className="text-[10px] font-bold"
                            style={{ color: item.color }}
                          >
                            {item.actionLabel}
                          </Text>
                          <Ionicons name="arrow-forward" size={10} color={item.color} />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            className="rounded-2xl border border-dashed p-4 items-center justify-center mb-3"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={colors.textSoft} />
            <Text className="text-xs font-bold mt-1.5" style={{ color: colors.text }}>
              No Touchpoints in this Channel
            </Text>
            <Text className="text-[11px] text-center mt-0.5" style={{ color: colors.textMuted }}>
              {timelineFilter === 'ALL'
                ? 'No emails, WhatsApp messages, or visits logged for this contact yet.'
                : `No ${timelineFilter.toLowerCase()} records found for this contact.`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* iOS-Style Delete Confirmation Modal */}
      <IosDeleteConfirmModal
        visible={deleteContactVisible}
        title={contact?.name ? `Delete "${contact.name}"` : 'Delete Contact'}
        message="Are you sure you want to delete this contact? This will remove all their details from your CRM."
        confirmText="Delete Contact"
        isPermanent={true}
        onConfirm={() => {
          setDeleteContactVisible(false);
          optimisticDeleteContact(contact.id);
          router.back();
        }}
        onCancel={() => setDeleteContactVisible(false)}
      />
    </AppScreen>
  );
}
