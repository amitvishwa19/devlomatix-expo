import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
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
  const { colors } = useCrmTheme();
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
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={closeQuickWhatsApp} />

        <View
          className="rounded-t-3xl p-4 shadow-2xl border-t"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 20, 40),
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.whatsapp }}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-black" style={{ color: colors.text }}>
                  WhatsApp Outreach
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  To: <Text className="font-bold" style={{ color: colors.text }}>{contact.name}</Text> ({contact.phone || 'No phone'})
                </Text>
              </View>
            </View>

            <Pressable
              onPress={closeQuickWhatsApp}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>

          {/* Attached Deal Context */}
          {deal && (
            <View
              className="mt-2.5 flex-row items-center gap-x-2 rounded-xl px-3 py-1.5 border"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Ionicons name="briefcase-outline" size={13} color={colors.primary} />
              <Text className="text-[11px] font-semibold" style={{ color: colors.primary }} numberOfLines={1}>
                Attached Deal: <Text className="font-black">{deal.title}</Text> ({deal.currency} {deal.value})
              </Text>
            </View>
          )}

          {/* Quick Template Chips */}
          <Text
            className="mt-2.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: colors.textMuted }}
          >
            Quick AI & Standard Templates
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-1 flex-row gap-x-2 py-0.5"
          >
            {TEMPLATES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => applyTemplate(t)}
                className="rounded-xl border px-2.5 py-1.5 active:opacity-75 mr-1"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-[11px] font-semibold" style={{ color: colors.text }}>
                  {t.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View
            className="mt-2.5 rounded-xl border p-2.5"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            }}
          >
            <TextInput
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              placeholder="Type WhatsApp message here..."
              placeholderTextColor={colors.inputPlaceholder}
              className="min-h-[80px] text-xs leading-5"
              style={{ color: colors.text }}
              textAlignVertical="top"
            />
          </View>

          {/* Feedback Status */}
          {statusMsg && (
            <View
              className="mt-2.5 rounded-xl p-2 border"
              style={{
                backgroundColor: statusMsg.type === 'success' ? colors.successSoft : colors.dangerSoft,
                borderColor: statusMsg.type === 'success' ? colors.successBorder : colors.dangerBorder,
              }}
            >
              <Text
                className="text-xs font-bold text-center"
                style={{ color: statusMsg.type === 'success' ? colors.success : colors.danger }}
              >
                {statusMsg.text}
              </Text>
            </View>
          )}

          {/* Send Button */}
          <Pressable
            onPress={handleSend}
            disabled={sending || !contact.phone || !message.trim()}
            className="mt-3 flex-row items-center justify-center gap-x-2 rounded-xl py-3 shadow-md active:opacity-80"
            style={{
              backgroundColor: colors.whatsapp,
              opacity: sending || !contact.phone || !message.trim() ? 0.5 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send" size={15} color="#ffffff" />
                <Text className="text-xs font-black text-white">Send via KonnectX Cloud</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

