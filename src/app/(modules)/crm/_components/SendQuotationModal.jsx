import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmTheme } from '../utils/colors';
import { formatQuotationWhatsAppText, updateQuotationStatus } from '~/services/quotation';

export default function SendQuotationModal({ quotation, visible, onClose, onSent }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();

  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (quotation) {
      const qData = quotation.data || {};
      const clientPhone = qData.client?.phone || '';
      setPhone(clientPhone);
      setMessage(formatQuotationWhatsAppText(quotation));
      setStatusMsg(null);
    }
  }, [quotation]);

  if (!visible || !quotation) return null;

  const handleSendViaWhatsApp = async () => {
    if (!message.trim()) return;

    try {
      setSending(true);
      setStatusMsg(null);

      // Clean phone number
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      const encodedMsg = encodeURIComponent(message.trim());
      const waUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;

      // Open WhatsApp app
      const canOpen = await Linking.canOpenURL(waUrl);
      if (canOpen) {
        await Linking.openURL(waUrl);
      } else {
        await Linking.openURL(`https://wa.me/?text=${encodedMsg}`);
      }

      // Mark quotation as sent in database
      await updateQuotationStatus(quotation.id, 'sent');

      setStatusMsg({ type: 'success', text: 'Quotation marked as Sent!' });
      if (onSent) onSent();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Error opening WhatsApp' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="rounded-t-3xl p-4 shadow-2xl border-t flex flex-col gap-4"
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
                  Send Quotation Proposal
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  {quotation.quotationNumber} • {quotation.clientName || 'Client'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="close" size={15} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Status Message */}
          {statusMsg && (
            <View
              className="rounded-xl p-2.5 border"
              style={{
                backgroundColor: statusMsg.type === 'success' ? colors.successSoft : colors.dangerSoft,
                borderColor: statusMsg.type === 'success' ? colors.successBorder : colors.dangerBorder,
              }}
            >
              <Text
                className="text-[11px] font-bold text-center"
                style={{ color: statusMsg.type === 'success' ? colors.success : colors.danger }}
              >
                {statusMsg.text}
              </Text>
            </View>
          )}

          {/* Recipient Phone Field */}
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
              Recipient WhatsApp Phone
            </Text>
            <View
              className="flex-row items-center gap-x-2 rounded-xl px-3.5 py-2.5 border min-h-[46px]"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
            >
              <Ionicons name="call" size={14} color={colors.textMuted} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="phone-pad"
                className="flex-1 text-xs py-1"
                style={{ color: colors.text }}
              />
            </View>
          </View>

          {/* Message Preview & Editor */}
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
              Quotation Message (WhatsApp Formatted)
            </Text>
            <View
              className="rounded-xl p-3 border min-h-[110px]"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="Type proposal message..."
                placeholderTextColor={colors.inputPlaceholder}
                className="text-xs leading-relaxed"
                style={{ color: colors.text, minHeight: 90, maxHeight: 150 }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-4 flex-row items-center gap-x-2">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl py-3 border active:opacity-75"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSendViaWhatsApp}
              disabled={sending || !message.trim()}
              className="flex-2 flex-row items-center justify-center gap-x-2 rounded-xl py-3 active:opacity-80"
              style={{
                backgroundColor: colors.whatsapp,
                opacity: sending || !message.trim() ? 0.6 : 1,
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Send on WhatsApp</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
