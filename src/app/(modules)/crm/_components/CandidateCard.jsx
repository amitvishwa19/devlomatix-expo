import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useCrmTheme } from '../utils/colors';

export default function CandidateCard({ candidate, onSendWhatsApp, onConvertDeal }) {
  const router = useRouter();
  const { colors } = useCrmTheme();

  if (!candidate) return null;

  const parsed = candidate.parsedData || candidate.metadata || {};
  const currentCtc = parsed.currentSalary || parsed.currentCtc || candidate.currentSalary || null;
  const expectedCtc = parsed.expectedSalary || parsed.expectedCtc || candidate.expectedSalary || null;
  const noticePeriod = parsed.noticePeriod || candidate.noticePeriod || null;
  const stage = (candidate.status || candidate.stage || 'APPLIED').toUpperCase();
  const jobTitle = candidate.job?.title || candidate.jobTitle || 'General Application';

  const getStageBadge = () => {
    switch (stage) {
      case 'HIRED':
        return { bg: colors.successSoft, border: colors.successBorder, text: colors.success, label: 'Hired' };
      case 'OFFER':
        return { bg: colors.infoSoft, border: colors.infoBorder, text: colors.info, label: 'Offer Sent' };
      case 'INTERVIEW':
        return { bg: colors.warningSoft, border: colors.warningBorder, text: colors.warning, label: 'Interview' };
      case 'SCREENING':
        return { bg: colors.copilotSoft, border: colors.copilotBorder, text: colors.copilot, label: 'Screening' };
      case 'REJECTED':
        return { bg: colors.dangerSoft, border: colors.dangerBorder, text: colors.danger, label: 'Rejected' };
      default:
        return { bg: colors.cardAlt, border: colors.border, text: colors.textMuted, label: 'Applied' };
    }
  };

  const badge = getStageBadge();

  const handleCall = () => {
    if (candidate.phone) {
      Linking.openURL(`tel:${candidate.phone}`);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/(modules)/crm/candidates/${candidate.id}`)}
      className="mb-2.5 rounded-[16px] border p-3 shadow-sm active:opacity-80"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      {/* Top Meta: Job Role & Stage Badge */}
      <View className="flex-row items-center justify-between gap-x-2">
        <View className="flex-row items-center gap-x-1.5 flex-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: badge.text }}
          />
          <Text
            className="text-[11px] font-bold tracking-tight"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {jobTitle}
          </Text>
        </View>

        <View
          className="flex-row items-center gap-x-1 rounded-full border px-2 py-0.5"
          style={{
            backgroundColor: badge.bg,
            borderColor: badge.border,
          }}
        >
          <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: badge.text }}>
            {badge.label}
          </Text>
        </View>
      </View>

      {/* Candidate Name & Contact Preview */}
      <View className="mt-2 flex-row items-center gap-x-2.5">
        <View
          className="h-9 w-9 rounded-full items-center justify-center border shadow-xs"
          style={{
            backgroundColor: colors.primarySoft,
            borderColor: colors.primaryBorder,
          }}
        >
          <Text className="text-xs font-black" style={{ color: colors.primaryDark }}>
            {(candidate.name || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-sm font-black tracking-tight" style={{ color: colors.text }} numberOfLines={1}>
            {candidate.name || 'Candidate'}
          </Text>
          <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }} numberOfLines={1}>
            {candidate.email || candidate.phone || 'No direct contact'}
          </Text>
        </View>
      </View>

      {/* Candidate Economics: Notice Period & Salary Badges */}
      {(noticePeriod || currentCtc || expectedCtc) && (
        <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5">
          {noticePeriod && (
            <View
              className="rounded-md px-2 py-0.5 border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Text className="text-[9px] font-semibold" style={{ color: colors.textMuted }}>
                ⏱️ Notice: <Text className="font-bold" style={{ color: colors.text }}>{noticePeriod}</Text>
              </Text>
            </View>
          )}

          {expectedCtc && (
            <View
              className="rounded-md px-2 py-0.5 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Text className="text-[9px] font-semibold" style={{ color: colors.success }}>
                💰 Exp: <Text className="font-bold">{expectedCtc}</Text>
              </Text>
            </View>
          )}

          {currentCtc && (
            <View
              className="rounded-md px-2 py-0.5 border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Text className="text-[9px] font-semibold" style={{ color: colors.textMuted }}>
                Cur: {currentCtc}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Action Strip */}
      <View className="mt-3 flex-row items-center justify-between border-t pt-2" style={{ borderColor: colors.borderLight }}>
        <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
          HireFlow ATS Bridge
        </Text>

        <View className="flex-row items-center gap-x-1.5">
          {candidate.phone && (
            <Pressable
              onPress={handleCall}
              className="h-7 w-7 items-center justify-center rounded-lg border active:opacity-75"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="call" size={13} color={colors.info} />
            </Pressable>
          )}

          {onSendWhatsApp && (
            <Pressable
              onPress={() => onSendWhatsApp(candidate)}
              className="flex-row items-center gap-x-1 rounded-lg px-2 py-1 active:opacity-75"
              style={{ backgroundColor: colors.whatsapp }}
            >
              <Ionicons name="logo-whatsapp" size={12} color="#ffffff" />
              <Text className="text-[10px] font-bold text-white">WhatsApp</Text>
            </Pressable>
          )}

          {onConvertDeal && (
            <Pressable
              onPress={() => onConvertDeal(candidate)}
              className="flex-row items-center gap-x-1 rounded-lg px-2 py-1 active:opacity-75"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="funnel" size={11} color="#ffffff" />
              <Text className="text-[10px] font-bold text-white">Deal</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
