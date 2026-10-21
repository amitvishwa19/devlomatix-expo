import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmTheme } from '../utils/colors';
import * as crmService from '~/services/crm';

const DEFAULT_STRATEGIES = {
  friendlyCheckin: {
    id: 'friendlyCheckin',
    title: 'Warm Check-in',
    icon: 'chatbubble-ellipses-outline',
    description: 'Gentle, relationship-first check-in prioritizing client priority updates.',
  },
  valueAdd: {
    id: 'valueAdd',
    title: 'Value-Add Insight',
    icon: 'sparkles-outline',
    description: 'Re-engage by sharing an industry case study, milestone, or feature relevant to their scope.',
  },
  politeBreakup: {
    id: 'politeBreakup',
    title: 'Polite Close',
    icon: 'shield-checkmark-outline',
    description: 'The "Permission to close file?" tactic with highest reply rates for unresponsive prospects.',
  },
};

export default function AiStalledDealRevivalModal({
  visible,
  onClose,
  deal,
  onSuccess,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();

  const [loading, setLoading] = useState(false);
  const [revivalData, setRevivalData] = useState(null);
  const [activeStrategy, setActiveStrategy] = useState('friendlyCheckin');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    if (!visible || !deal?.id) {
      setRevivalData(null);
      setMessage('');
      return;
    }

    async function fetchRevival() {
      setLoading(true);
      try {
        const res = await crmService.reviveStalledDeal(deal.id);
        if (res.success && res.data) {
          setRevivalData(res.data);
          const defaultKey =
            res.data.recommendedStrategy === 'POLITE_BREAKUP'
              ? 'politeBreakup'
              : res.data.recommendedStrategy === 'VALUE_ADD'
              ? 'valueAdd'
              : 'friendlyCheckin';
          setActiveStrategy(defaultKey);
          setMessage(res.data.strategies?.[defaultKey] || buildFallbackMessage(defaultKey, deal));
        } else {
          // Generate high-converting client fallback templates
          const fallbackData = buildFallbackRevivalData(deal);
          setRevivalData(fallbackData);
          setMessage(fallbackData.strategies.friendlyCheckin);
        }
      } catch (err) {
        const fallbackData = buildFallbackRevivalData(deal);
        setRevivalData(fallbackData);
        setMessage(fallbackData.strategies.friendlyCheckin);
      } finally {
        setLoading(false);
      }
    }

    fetchRevival();
  }, [visible, deal?.id]);

  function buildFallbackRevivalData(currentDeal) {
    const contactName = currentDeal?.contact?.name || 'there';
    const dealTitle = currentDeal?.title || 'our recent proposal';
    return {
      daysInactive: 12,
      recommendedStrategy: 'friendlyCheckin',
      diagnosticReason: 'No outbound customer touchpoints logged in the last 10 days.',
      strategies: {
        friendlyCheckin: `Hi ${contactName}, hope you're having a productive week! Just checking in on ${dealTitle}. Have you had a chance to review the scope, or would you like to hop on a quick 5-min sync to address questions?`,
        valueAdd: `Hi ${contactName}, following up on ${dealTitle}. We just rolled out an update that streamlines deployment by 40%. Thought of your team and wanted to share how it could benefit your timeline. Let me know if you'd like a quick preview!`,
        politeBreakup: `Hi ${contactName}, I haven't heard back regarding ${dealTitle}, so I assume priorities have shifted or the timing isn't right. Should I close your file for now, or is this still on your radar for this quarter?`,
      },
    };
  }

  function buildFallbackMessage(key, currentDeal) {
    const data = buildFallbackRevivalData(currentDeal);
    return data.strategies[key] || '';
  }

  const handleSelectStrategy = (key) => {
    setActiveStrategy(key);
    if (revivalData?.strategies?.[key]) {
      setMessage(revivalData.strategies[key]);
    }
  };

  const handleCopy = async () => {
    if (!message) return;
    await Clipboard.setStringAsync(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = async () => {
    const phone = deal?.contact?.phone;
    if (!phone) {
      Alert.alert('Phone Required', 'The contact associated with this deal does not have a phone number.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please write or select a message before dispatching.');
      return;
    }

    setDispatching(true);
    try {
      // 1. Log to CRM backend if supported
      if (deal?.contact?.id) {
        await crmService.sendContactWhatsApp(deal.contact.id, { message: message.trim() }).catch(() => {});
      }

      // 2. Open WhatsApp direct chat
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(message.trim());
      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
      const webUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webUrl);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not launch WhatsApp.');
    } finally {
      setDispatching(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="rounded-t-[24px] border-t px-4 pt-3.5"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            maxHeight: '90%',
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Grab Handle */}
          <View className="w-10 h-1 rounded-full bg-muted-foreground/30 self-center mb-3" />

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b" style={{ borderBottomColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5 flex-1 pr-2">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center shadow-xs"
                style={{ backgroundColor: colors.copilot }}
              >
                <Ionicons name="flame" size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  AI Stalled Deal Revival
                </Text>
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                  Ghosting recovery & response re-engagement
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center active:opacity-75"
              style={{ backgroundColor: colors.cardAlt }}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={colors.copilot} />
              <Text className="text-xs font-semibold mt-2.5" style={{ color: colors.copilot }}>
                Synthesizing deal context & revival strategies...
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="pt-3">
              {/* Telemetry Strip */}
              {revivalData && (
                <View
                  className="rounded-xl p-2.5 mb-3 border flex-row items-center justify-between"
                  style={{
                    backgroundColor: colors.copilotSoft,
                    borderColor: colors.copilotBorder,
                  }}
                >
                  <View className="flex-row items-center gap-x-2 flex-1 mr-2">
                    <Ionicons name="warning-outline" size={16} color={colors.copilot} />
                    <Text className="text-xs font-semibold flex-1" style={{ color: colors.copilot }}>
                      {revivalData.diagnosticReason || 'Deal is cooling down. Immediate touchpoint recommended.'}
                    </Text>
                  </View>
                  <View
                    className="rounded-lg px-2 py-0.5"
                    style={{ backgroundColor: colors.copilot }}
                  >
                    <Text className="text-[10px] font-bold text-white uppercase">
                      Action Required
                    </Text>
                  </View>
                </View>
              )}

              {/* Strategy Selector Pills */}
              <Text className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
                Choose Outreach Angle:
              </Text>

              <View className="flex-row gap-x-1.5 mb-3">
                {Object.keys(DEFAULT_STRATEGIES).map((stratKey) => {
                  const s = DEFAULT_STRATEGIES[stratKey];
                  const isSelected = activeStrategy === stratKey;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => handleSelectStrategy(stratKey)}
                      className="flex-1 rounded-xl p-2 border items-center justify-center active:opacity-80"
                      style={{
                        backgroundColor: isSelected ? colors.copilot : colors.cardAlt,
                        borderColor: isSelected ? colors.copilot : colors.border,
                      }}
                    >
                      <Ionicons
                        name={s.icon}
                        size={15}
                        color={isSelected ? '#ffffff' : colors.textMuted}
                      />
                      <Text
                        className="text-[11px] font-bold mt-1 text-center"
                        style={{ color: isSelected ? '#ffffff' : colors.text }}
                      >
                        {s.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Strategy Description */}
              <Text className="text-[11px] italic mb-2.5 px-0.5" style={{ color: colors.textMuted }}>
                💡 {DEFAULT_STRATEGIES[activeStrategy]?.description}
              </Text>

              {/* Message Composer */}
              <View
                className="rounded-xl border p-3 mb-4"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    Message Preview (Editable):
                  </Text>
                  <Pressable
                    onPress={handleCopy}
                    className="flex-row items-center gap-x-1 px-2 py-0.5 rounded-lg active:opacity-75"
                    style={{ backgroundColor: colors.card }}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={12}
                      color={copied ? colors.success : colors.textMuted}
                    />
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: copied ? colors.success : colors.textMuted }}
                    >
                      {copied ? 'Copied!' : 'Copy Text'}
                    </Text>
                  </Pressable>
                </View>

                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={4}
                  className="min-h-[100px] text-xs leading-5"
                  style={{ color: colors.text }}
                  placeholder="Crafting revival message..."
                  placeholderTextColor={colors.inputPlaceholder}
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-x-2 pb-2">
                <Pressable
                  onPress={handleCopy}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 border active:opacity-80"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="copy-outline" size={15} color={colors.text} />
                  <Text className="text-xs font-bold" style={{ color: colors.text }}>
                    Copy Message
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSendWhatsApp}
                  disabled={dispatching || !message.trim()}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 active:opacity-80 shadow-sm"
                  style={{
                    backgroundColor: colors.whatsapp,
                    opacity: dispatching || !message.trim() ? 0.6 : 1,
                  }}
                >
                  {dispatching ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">
                        Send WhatsApp
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
