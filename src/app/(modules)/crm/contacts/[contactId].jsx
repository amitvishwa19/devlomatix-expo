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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../../_components/CrmHeader';
import DealCard from '../../_components/DealCard';
import QuickWhatsAppModal from '../../_components/QuickWhatsAppModal';
import * as crmService from '~/services/crm';

export default function ContactDossierScreen() {
  const { contactId } = useLocalSearchParams();
  const router = useRouter();
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
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-xs text-slate-400 font-semibold mt-2">Loading 360° Contact Dossier...</Text>
      </SafeAreaView>
    );
  }

  if (!contact) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <CrmHeader title="Contact Dossier" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-bold text-slate-700">Contact Not Found</Text>
        </View>
      </SafeAreaView>
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
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
        <View className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm mb-3.5">
          <View className="flex-row items-center gap-x-3.5">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 border border-indigo-200">
              <Text className="text-lg font-black text-indigo-800">{initials}</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-black text-slate-900">{contact.name}</Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                {contact.account?.name || 'Individual Prospect'}
              </Text>
              {contact.phone && (
                <Text className="text-xs font-mono font-bold text-slate-700 mt-1">{contact.phone}</Text>
              )}
            </View>
          </View>

          {/* Quick Action Dialers */}
          <View className="mt-3.5 flex-row gap-x-2 pt-3 border-t border-slate-100">
            {contact.phone && (
              <>
                <Pressable
                  onPress={() => openQuickWhatsApp(contact)}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl bg-emerald-50 py-2.5 border border-emerald-200 active:bg-emerald-100"
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#059669" />
                  <Text className="text-xs font-bold text-emerald-700">WhatsApp</Text>
                </Pressable>

                <Pressable
                  onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl bg-sky-50 py-2.5 border border-sky-200 active:bg-sky-100"
                >
                  <Ionicons name="call-outline" size={16} color="#0284c7" />
                  <Text className="text-xs font-bold text-sky-700">Direct Call</Text>
                </Pressable>
              </>
            )}

            {contact.email && (
              <Pressable
                onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl bg-slate-100 py-2.5 border border-slate-200 active:bg-slate-200"
              >
                <Ionicons name="mail-outline" size={16} color="#475569" />
                <Text className="text-xs font-bold text-slate-700">Email</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Quick In-Page WhatsApp Messenger */}
        {contact.phone && (
          <View className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 shadow-sm mb-3.5">
            <View className="flex-row items-center gap-x-2 mb-2">
              <Ionicons name="logo-whatsapp" size={16} color="#059669" />
              <Text className="text-xs font-black text-emerald-950">Quick WhatsApp Touchpoint</Text>
            </View>

            <View className="flex-row items-center gap-x-2">
              <TextInput
                value={quickMsg}
                onChangeText={setQuickMsg}
                placeholder="Type quick message..."
                placeholderTextColor="#94a3b8"
                className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-900"
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
                  msgFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {msgFeedback.text}
              </Text>
            )}
          </View>
        )}

        {/* Linked Deals */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-black uppercase tracking-wider text-slate-400">
            Active Deals ({deals.length})
          </Text>
          <Pressable onPress={() => openCreateDeal()}>
            <Text className="text-xs font-bold text-indigo-600">+ New Deal</Text>
          </Pressable>
        </View>

        {deals.length > 0 ? (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View className="rounded-2xl border border-dashed border-slate-300 p-6 items-center justify-center bg-white mb-3.5">
            <Text className="text-xs text-slate-500 font-semibold">No active deals with this contact yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
