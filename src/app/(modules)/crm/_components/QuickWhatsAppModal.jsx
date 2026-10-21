import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import * as crmService from '~/services/crm';
import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';
import { resolveWorkspaceId } from '~/utils/workspace';

const DEFAULT_TEMPLATES = [
  {
    id: 'followup',
    title: 'Proposal Follow-up',
    category: 'UTILITY',
    text: 'Hi {{name}}, just following up on the proposal we shared. We would love to address any questions you have and finalize the next steps!',
  },
  {
    id: 'meeting',
    title: 'Meeting Confirmation',
    category: 'UTILITY',
    text: 'Hello {{name}}, confirming our upcoming discussion. Looking forward to connecting and reviewing the project scope with you.',
  },
  {
    id: 'payment',
    title: 'Commercial Milestone',
    category: 'UTILITY',
    text: 'Hi {{name}}, sharing our commercial details and invoice link for your review. Please let us know once processed.',
  },
  {
    id: 'checkin',
    title: 'Quick Check-in',
    category: 'MARKETING',
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
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  const contact = quickWhatsAppTarget?.contact;
  const deal = quickWhatsAppTarget?.deal;

  // Load Approved Meta Templates
  useEffect(() => {
    async function loadMetaTemplates() {
      try {
        const wsId = await resolveWorkspaceId();
        const res = await api.get(apiUrls.templates, { params: { workspaceId: wsId } });
        const remote = res?.data?.templates || res?.data || [];
        if (Array.isArray(remote) && remote.length > 0) {
          const formatted = remote
            .map((t) => ({
              id: t.id || t._id,
              title: t.name || t.title,
              category: t.category || 'UTILITY',
              text: t.body || t.text || t.content || '',
            }))
            .filter((t) => t.text);
          if (formatted.length > 0) {
            setTemplates([...formatted, ...DEFAULT_TEMPLATES]);
          }
        }
      } catch {
        // Fallback to presets
      }
    }
    if (contact) {
      loadMetaTemplates();
    }
  }, [contact]);

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
    let customized = tpl.text
      .replace(/\{\{name\}\}/gi, contact.name || 'there')
      .replace(/\{\{1\}\}/g, contact.name || 'there')
      .replace(/\{\{company\}\}/gi, contact.account?.name || deal?.title || 'our firm')
      .replace(/\{\{2\}\}/g, deal?.title || contact.account?.name || 'our proposal');
    setMessage(customized);
  };

  const handleSendCloud = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      setStatusMsg(null);
      const res = await crmService.sendContactWhatsApp(contact.id, {
        message: message.trim(),
        dealId: deal?.id,
      });

      if (res?.success) {
        setStatusMsg({ type: 'success', text: 'WhatsApp message dispatched via KonnectX Cloud API!' });
        setTimeout(() => {
          closeQuickWhatsApp();
          refreshAll();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: res?.error || 'Failed to send WhatsApp message' });
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Error dispatching message' });
    } finally {
      setSending(false);
    }
  };

  const handleOpenWhatsAppApp = () => {
    if (!message.trim()) return;
    const cleanPhone = (contact.phone || '').replace(/[^\d+]/g, '');
    const encoded = encodeURIComponent(message.trim());
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    Linking.openURL(url);
    closeQuickWhatsApp();
  };

  return (
    <Modal visible={true} transparent={true} animationType="slide" onRequestClose={closeQuickWhatsApp}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={closeQuickWhatsApp} />

        <View
          className="rounded-t-3xl p-4 shadow-2xl border-t max-h-[85%]"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 15, 30),
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.whatsapp }}
              >
                <Ionicons name="logo-whatsapp" size={17} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  WhatsApp Outreach
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  To: <Text className="font-bold" style={{ color: colors.text }}>{contact.name}</Text> ({contact.phone || 'No phone'})
                </Text>
              </View>
            </View>

            <Pressable
              onPress={closeQuickWhatsApp}
              className="h-7 w-7 items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="close" size={15} color={colors.text} />
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
                Attached Deal: <Text className="font-bold">{deal.title}</Text> ({deal.currency} {deal.value})
              </Text>
            </View>
          )}

          {/* Quick Template Chips */}
          <Text
            className="mt-2.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: colors.textMuted }}
          >
            Meta Approved & Quick Templates
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-1 flex-row gap-x-1.5 py-0.5"
          >
            {templates.map((t, idx) => (
              <Pressable
                key={t.id || idx}
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

          {/* Interactive WhatsApp Bubble Preview */}
          <View
            className="mt-2.5 rounded-2xl p-3 border"
            style={{
              backgroundColor: '#0b141a',
              borderColor: '#1f2c34',
            }}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                Live WhatsApp Bubble Preview
              </Text>
              <Text className="text-[9px] text-slate-400">Outgoing</Text>
            </View>
            <View
              className="rounded-2xl rounded-tr-xs p-2.5 self-end max-w-[90%]"
              style={{ backgroundColor: '#005c4b' }}
            >
              <Text className="text-xs text-white leading-relaxed">
                {message || 'Type message below...'}
              </Text>
              <View className="flex-row items-center justify-end gap-x-1 mt-1">
                <Text className="text-[9px] text-emerald-200">Just now</Text>
                <Ionicons name="checkmark-done" size={12} color="#53bdeb" />
              </View>
            </View>
          </View>

          {/* Message Input */}
          <View
            className="mt-2 rounded-xl border p-3 min-h-[90px]"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            }}
          >
            <TextInput
              multiline
              numberOfLines={3}
              value={message}
              onChangeText={setMessage}
              placeholder="Edit WhatsApp message here..."
              placeholderTextColor={colors.inputPlaceholder}
              className="text-xs leading-5"
              style={{ color: colors.text, minHeight: 70, maxHeight: 120 }}
              textAlignVertical="top"
            />
          </View>

          {/* Feedback Status */}
          {statusMsg && (
            <View
              className="mt-2 rounded-xl p-2 border"
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

          {/* Dual Action Send Buttons */}
          <View className="mt-3 flex-row items-center gap-x-2">
            <Pressable
              onPress={handleOpenWhatsAppApp}
              disabled={!message.trim()}
              className="flex-1 flex-row items-center justify-center gap-x-1.5 py-3 rounded-xl border active:opacity-75"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="open-outline" size={14} color={colors.text} />
              <Text className="text-xs font-bold" style={{ color: colors.text }}>Open in App</Text>
            </Pressable>

            <Pressable
              onPress={handleSendCloud}
              disabled={sending || !contact.phone || !message.trim()}
              className="flex-2 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 shadow-md active:opacity-80"
              style={{
                backgroundColor: colors.whatsapp,
                opacity: sending || !contact.phone || !message.trim() ? 0.5 : 1,
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Send via Cloud API</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
