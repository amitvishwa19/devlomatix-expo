import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmTheme } from '../utils/colors';
import * as crmService from '~/services/crm';

export default function ConvertCandidateModal({ candidate, visible, onClose, onConverted }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();

  const [title, setTitle] = useState('');
  const [value, setValue] = useState('150000');
  const [currency, setCurrency] = useState('INR');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (candidate) {
      const jobTitle = candidate.job?.title || candidate.jobTitle || 'Role';
      setTitle(`Staffing Placement: ${candidate.name} (${jobTitle})`);
      const parsedSalary = candidate.expectedSalary || candidate.parsedData?.expectedSalary;
      if (parsedSalary && !isNaN(Number(parsedSalary))) {
        setValue(String(Math.round(Number(parsedSalary) * 0.083))); // 1 month placement fee approx
      }
      setErrorMsg(null);
    }
  }, [candidate]);

  if (!visible || !candidate) return null;

  const handleConvert = async () => {
    if (!title.trim()) {
      setErrorMsg('Deal title is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        title: title.trim(),
        value: Number(value) || 0,
        currency,
        priority: 'HIGH',
        metadata: {
          convertedFromCandidateId: candidate.id,
          candidateName: candidate.name,
          jobId: candidate.jobId,
        },
      };

      const res = await crmService.createDeal(payload);
      if (res?.success || res?.data?.id) {
        if (onConverted) onConverted();
        onClose();
        const dealId = res.data?.id || res.data?.deal?.id;
        if (dealId) {
          router.push(`/(modules)/crm/deals/${dealId}`);
        }
      } else {
        setErrorMsg(res?.error || 'Failed to create deal');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Error converting candidate to deal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="rounded-t-3xl p-4 shadow-2xl border-t"
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
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="funnel" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Convert to CRM Deal
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  Bridge candidate into sales revenue pipeline
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-full border"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="close" size={15} color={colors.textMuted} />
            </Pressable>
          </View>

          {errorMsg && (
            <View className="mt-3 rounded-xl p-2.5 border" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder }}>
              <Text className="text-[11px] font-bold text-center" style={{ color: colors.danger }}>
                {errorMsg}
              </Text>
            </View>
          )}

          {/* Deal Title */}
          <View className="mt-3">
            <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
              Deal / Opportunity Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Staffing Placement: John Doe"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl px-3.5 py-3 border text-xs min-h-[46px]"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />
          </View>

          {/* Expected Placement Value */}
          <View className="mt-3">
            <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
              Commercial Value (Fee / Margin)
            </Text>
            <View
              className="flex-row items-center gap-x-2 rounded-xl px-3.5 py-2.5 border min-h-[46px]"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.textMuted }}>
                ₹
              </Text>
              <TextInput
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                placeholder="150000"
                placeholderTextColor={colors.inputPlaceholder}
                className="flex-1 text-xs font-bold py-1"
                style={{ color: colors.text }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-4 flex-row items-center gap-x-2">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl py-3 border active:opacity-75"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.text }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleConvert}
              disabled={submitting}
              className="flex-2 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 active:opacity-85 shadow-md"
              style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Create Pipeline Deal</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
