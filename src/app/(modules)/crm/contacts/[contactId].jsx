import React, { useState, useEffect, useCallback } from 'react';
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

export default function ContactDossierScreen() {
  const { contactId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { openQuickWhatsApp, openCreateTask, openCreateDeal, refreshAll, optimisticDeleteContact } = useCrm();
  const { startCall } = useCrmSocket();

  const [contact, setContact] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);
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
        // Fetch linked Deskflow support tickets for 360° customer context
        crmService
          .getContactDeskflowTickets(contactId, res.data.email)
          .then((tRes) => {
            if (tRes.success && Array.isArray(tRes.data)) {
              setSupportTickets(tRes.data);
            }
          })
          .catch(() => {});
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

        {/* Deskflow 360° Support Tickets Bridge */}
        <View className="mt-3 mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-1.5">
            <Ionicons name="headset" size={14} color={colors.copilot} />
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              Deskflow Support 360° ({supportTickets.length})
            </Text>
          </View>
          {supportTickets.some((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS') && (
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: colors.warningSoft }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.warning }}>
                Active Grievance
              </Text>
            </View>
          )}
        </View>

        {supportTickets.length > 0 ? (
          <View
            className="rounded-2xl border p-3 shadow-sm mb-3 space-y-2.5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            {supportTickets.map((ticket) => (
              <View
                key={ticket.id}
                className="p-2.5 rounded-xl border flex-row items-start justify-between"
                style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold" style={{ color: colors.text }}>
                    {ticket.subject || ticket.title || 'Support Request'}
                  </Text>
                  <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                    Ticket #{ticket.id?.slice(-6) || 'HD'} • {ticket.category || 'General'}
                  </Text>
                </View>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor:
                      ticket.status === 'OPEN'
                        ? colors.dangerSoft
                        : ticket.status === 'RESOLVED'
                        ? colors.successSoft
                        : colors.cardAlt,
                  }}
                >
                  <Text
                    className="text-[9px] font-bold uppercase"
                    style={{
                      color:
                        ticket.status === 'OPEN'
                          ? colors.danger
                          : ticket.status === 'RESOLVED'
                          ? colors.success
                          : colors.textMuted,
                    }}
                  >
                    {ticket.status || 'OPEN'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            className="rounded-2xl border border-dashed p-3.5 items-center justify-center mb-3"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
              No support tickets filed. Customer sentiment is clear.
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
