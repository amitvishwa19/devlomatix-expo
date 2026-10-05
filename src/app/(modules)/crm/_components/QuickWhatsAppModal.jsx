import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';

const TEMPLATES = [
  {
    id: 'followup',
    title: 'Proposal Follow-up',
    text: 'Hi {{name}}, just following up on the proposal we shared. We would love to address any questions you have and finalize the next steps!',
  },
  {
    id: 'meeting',
    title: 'Meeting Confirmation',
    text: 'Hello {{name}}, confirming our upcoming discussion. Looking forward to connecting and reviewing the project scope with you.',
  },
  {
    id: 'payment',
    title: 'Commercial Milestone',
    text: 'Hi {{name}}, sharing our commercial details and invoice link for your review. Please let us know once processed.',
  },
  {
    id: 'checkin',
    title: 'Quick Check-in',
    text: 'Hope you are doing well {{name}}! Just checking in to see if you have any updates regarding our recent conversation.',
  },
];

export default function QuickWhatsAppModal() {
  const insets = useSafeAreaInsets();
  const { quickWhatsAppTarget, closeQuickWhatsApp, refreshAll } = useCrm();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const contact = quickWhatsAppTarget?.contact;
  const deal = quickWhatsAppTarget?.deal;

  useEffect(() => {
    if (contact) {
      if (quickWhatsAppTarget.message) {
        setMessage(quickWhatsAppTarget.message);
      } else {
        const defaultText = `Hi ${contact.name || 'there'}, reaching out regarding ${deal?.title || 'our recent conversation'}. Let me know if you have a moment to chat!`;
        setMessage(defaultText);
      }
      setStatusMsg(null);
    }
  }, [contact, deal, quickWhatsAppTarget]);

  if (!quickWhatsAppTarget || !contact) return null;

  const applyTemplate = (tpl) => {
    const customized = tpl.text.replace(/\{\{name\}\}/g, contact.name || 'there');
    setMessage(customized);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      setStatusMsg(null);
      const res = await crmService.sendContactWhatsApp(contact.id, {
        message: message.trim(),
        dealId: deal?.id,
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: 'WhatsApp message dispatched successfully via KonnectX Cloud API!' });
        setTimeout(() => {
          closeQuickWhatsApp();
          refreshAll();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to send WhatsApp message' });
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Error dispatching message' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={closeQuickWhatsApp}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={closeQuickWhatsApp} />

        <View
          className="rounded-t-3xl bg-white p-5 shadow-2xl"
          style={{ paddingBottom: Math.max(insets.bottom + 24, 44) }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3.5">
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200">
                <Ionicons name="logo-whatsapp" size={18} color="#059669" />
              </View>
              <View>
                <Text className="text-base font-black text-slate-900">WhatsApp Outreach</Text>
                <Text className="text-xs text-slate-500 font-medium">
                  To: <Text className="font-bold text-slate-800">{contact.name}</Text> ({contact.phone || 'No phone'})
                </Text>
              </View>
            </View>

            <Pressable
              onPress={closeQuickWhatsApp}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
            >
              <Ionicons name="close" size={18} color="#475569" />
            </Pressable>
          </View>

          {/* Attached Deal Context */}
          {deal && (
            <View className="mt-3 flex-row items-center gap-x-2 rounded-xl bg-indigo-50/70 px-3 py-2 border border-indigo-100">
              <Ionicons name="briefcase-outline" size={14} color="#4f46e5" />
              <Text className="text-xs font-semibold text-indigo-900" numberOfLines={1}>
                Attached Deal: <Text className="font-black">{deal.title}</Text> ({deal.currency} {deal.value})
              </Text>
            </View>
          )}

          {/* Quick Template Chips */}
          <Text className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quick AI & Standard Templates
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-1.5 flex-row gap-x-2 py-1"
          >
            {TEMPLATES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => applyTemplate(t)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 active:bg-slate-100"
              >
                <Text className="text-xs font-semibold text-slate-700">{t.title}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View className="mt-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <TextInput
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              placeholder="Type WhatsApp message here..."
              placeholderTextColor="#94a3b8"
              className="min-h-[90px] text-sm text-slate-900 leading-5"
              textAlignVertical="top"
            />
          </View>

          {/* Feedback Status */}
          {statusMsg && (
            <View
              className={`mt-3 rounded-xl p-2.5 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <Text
                className={`text-xs font-bold text-center ${
                  statusMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {statusMsg.text}
              </Text>
            </View>
          )}

          {/* Send Button */}
          <Pressable
            onPress={handleSend}
            disabled={sending || !contact.phone || !message.trim()}
            className={`mt-4 flex-row items-center justify-center gap-x-2 rounded-2xl bg-emerald-600 py-3.5 shadow-md active:bg-emerald-700 ${
              sending || !contact.phone || !message.trim() ? 'opacity-50' : ''
            }`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#ffffff" />
                <Text className="text-sm font-black text-white">Send via KonnectX Cloud</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
