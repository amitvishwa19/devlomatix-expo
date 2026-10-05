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
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import * as crmService from '~/services/crm';

export default function ContactDossierScreen() {
  const { contactId } = useLocalSearchParams();
  const router = useRouter();
  const { palette } = useAppTheme();
  const { openQuickWhatsApp, openCreateTask, openCreateDeal, refreshAll } = useCrm();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState(null);

  const fetchContact = useCallback(async () => {
    if (!contactId) return;
    try {
      const res = await crmService.getContact(contactId);
      if (res.success && res.data) {
        setContact(res.data);
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
      setTimeout(() => setMsgFeedback(null), 4000);
    }
  };

  if (loading && !contact) {
    return (
      <AppScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className={`text-xs ${palette.textMuted} font-semibold mt-2`}>Loading 360° Contact Dossier...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!contact) {
    return (
      <AppScreen>
        <CrmHeader title="Contact Dossier" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <Text className={`text-sm font-bold ${palette.text}`}>Contact Not Found</Text>
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
    <AppScreen>
      <CrmHeader
        title={contact.name}
        subtitle={`${contact.jobTitle || 'Lead'} • ${contact.account?.name || 'Individual'}`}
        showBack={true}
      />

      <QuickWhatsAppModal />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="px-4 pt-3.5"
      >
        {/* Contact Profile Header Card */}
        <View className={`rounded-2xl border ${palette.border} ${palette.surface} p-4 shadow-sm mb-3.5`}>
          <View className="flex-row items-center gap-x-3.5">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30">
              <Text className="text-lg font-black text-indigo-400">{initials}</Text>
            </View>

            <View className="flex-1">
              <Text className={`text-base font-black ${palette.text}`}>{contact.name}</Text>
              <Text className={`text-xs ${palette.textMuted} mt-0.5`}>
                {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                {contact.account?.name || 'Individual Prospect'}
              </Text>
              {contact.phone && (
                <Text className={`text-xs font-mono font-bold ${palette.textSoft} mt-1`}>{contact.phone}</Text>
              )}
            </View>
          </View>

          {/* Quick Action Dialers */}
          <View className={`mt-3.5 flex-row gap-x-2 pt-3 border-t ${palette.border}`}>
            {contact.phone && (
              <>
                <Pressable
                  onPress={() => openQuickWhatsApp(contact)}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl bg-emerald-500/15 py-2.5 border border-emerald-500/30 active:opacity-75"
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#10b981" />
                  <Text className="text-xs font-bold text-emerald-400">WhatsApp</Text>
                </Pressable>

                <Pressable
                  onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl bg-sky-500/15 py-2.5 border border-sky-500/30 active:opacity-75"
                >
                  <Ionicons name="call-outline" size={16} color="#0ea5e9" />
                  <Text className="text-xs font-bold text-sky-400">Direct Call</Text>
                </Pressable>
              </>
            )}

            {contact.email && (
              <Pressable
                onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                className={`flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl ${palette.surfaceAlt} py-2.5 border ${palette.border} active:opacity-75`}
              >
                <Ionicons name="mail-outline" size={16} color={palette.textMutedColor} />
                <Text className={`text-xs font-bold ${palette.text}`}>Email</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Quick In-Page WhatsApp Messenger */}
        {contact.phone && (
          <View className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 shadow-sm mb-3.5">
            <View className="flex-row items-center gap-x-2 mb-2">
              <Ionicons name="logo-whatsapp" size={16} color="#10b981" />
              <Text className="text-xs font-black text-emerald-400">Quick WhatsApp Touchpoint</Text>
            </View>

            <View className="flex-row items-center gap-x-2">
              <TextInput
                value={quickMsg}
                onChangeText={setQuickMsg}
                placeholder="Type quick message..."
                placeholderTextColor={palette.textMutedColor}
                className={`flex-1 rounded-xl border border-emerald-500/30 ${palette.surface} px-3 py-2 text-xs ${palette.text}`}
              />
              <Pressable
                onPress={handleSendInlineWhatsApp}
                disabled={sendingMsg || !quickMsg.trim()}
                className={`h-9 px-3 flex-row items-center justify-center rounded-xl bg-emerald-600 active:bg-emerald-700 ${
                  sendingMsg || !quickMsg.trim() ? 'opacity-50' : ''
                }`}
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
                className={`text-[11px] font-bold mt-2 ${
                  msgFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {msgFeedback.text}
              </Text>
            )}
          </View>
        )}

        {/* Linked Deals */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className={`text-xs font-black uppercase tracking-wider ${palette.textMuted}`}>
            Active Deals ({deals.length})
          </Text>
          <Pressable onPress={() => openCreateDeal()}>
            <Text className="text-xs font-bold text-indigo-400">+ New Deal</Text>
          </Pressable>
        </View>

        {deals.length > 0 ? (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View className={`rounded-2xl border border-dashed ${palette.border} p-6 items-center justify-center ${palette.surface} mb-3.5`}>
            <Text className={`text-xs ${palette.textMuted} font-semibold`}>No active deals with this contact yet.</Text>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
