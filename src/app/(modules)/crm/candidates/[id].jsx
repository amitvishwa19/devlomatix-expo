import React, { useState, useEffect, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../utils/colors';
import CrmHeader from '../_components/CrmHeader';
import ConvertCandidateModal from '../_components/ConvertCandidateModal';
import * as hireflowService from '~/services/hireflow';

export default function CandidateDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useCrmTheme();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const loadCandidate = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await hireflowService.getCandidate(id);
      if (res?.data) {
        setCandidate(res.data);
      } else if (res?.candidate) {
        setCandidate(res.candidate);
      }
    } catch (err) {
      console.warn('Error loading candidate:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadCandidate();
  }, [loadCandidate]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCandidate();
  };

  const handleCall = () => {
    if (candidate?.phone) {
      Linking.openURL(`tel:${candidate.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (!candidate?.phone) return;
    const cleanPhone = candidate.phone.replace(/[^\d+]/g, '');
    const text = encodeURIComponent(
      `Hello ${candidate.name || 'there'},\n\n` +
      `Reaching out from Devlomatix Talent & Staffing regarding your profile for the ${candidate.job?.title || 'position'}.\n` +
      `Could we connect for a brief call today?\n\n` +
      `Best regards,\nDevlomatix Hiring Team`
    );
    Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=${text}`);
  };

  if (loading && !refreshing) {
    return (
      <AppScreen>
        <CrmHeader title="Candidate Profile" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-xs font-semibold" style={{ color: colors.textMuted }}>
            Loading Candidate...
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!candidate) {
    return (
      <AppScreen>
        <CrmHeader title="Candidate Profile" showBack={true} />
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
            Candidate Profile Not Found
          </Text>
          <Pressable
            onPress={() => router.replace('/(modules)/crm/candidates')}
            className="mt-4 px-4 py-2 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-xs font-bold text-white">Back to Candidates</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const parsed = candidate.parsedData || candidate.metadata || {};
  const stage = (candidate.status || candidate.stage || 'APPLIED').toUpperCase();
  const jobTitle = candidate.job?.title || candidate.jobTitle || 'General Application';
  const noticePeriod = parsed.noticePeriod || candidate.noticePeriod || 'Not specified';
  const currentCtc = parsed.currentSalary || parsed.currentCtc || candidate.currentSalary || 'Not specified';
  const expectedCtc = parsed.expectedSalary || parsed.expectedCtc || candidate.expectedSalary || 'Not specified';

  return (
    <AppScreen>
      <CrmHeader
        title={candidate.name || 'Candidate'}
        subtitle={jobTitle}
        showBack={true}
      />

      <ConvertCandidateModal
        candidate={candidate}
        visible={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConverted={loadCandidate}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Candidate Profile Header Card */}
        <View
          className="rounded-[16px] border p-4 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center gap-x-3 mb-3 border-b pb-3" style={{ borderColor: colors.borderLight }}>
            <View
              className="h-12 w-12 rounded-full items-center justify-center border shadow-xs"
              style={{ backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }}
            >
              <Text className="text-base font-bold" style={{ color: colors.primaryDark }}>
                {(candidate.name || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold tracking-tight" style={{ color: colors.text }}>
                {candidate.name}
              </Text>
              <Text className="text-xs font-semibold" style={{ color: colors.primaryLight }}>
                {jobTitle}
              </Text>
            </View>

            <View
              className="rounded-full px-2.5 py-1 border"
              style={{ backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.primaryDark }}>
                {stage}
              </Text>
            </View>
          </View>

          {/* Contact Details */}
          <View className="space-y-1.5">
            {candidate.phone && (
              <View className="flex-row items-center gap-x-2 py-0.5">
                <Ionicons name="call" size={13} color={colors.textMuted} />
                <Text className="text-xs font-medium" style={{ color: colors.text }}>
                  {candidate.phone}
                </Text>
              </View>
            )}

            {candidate.email && (
              <View className="flex-row items-center gap-x-2 py-0.5">
                <Ionicons name="mail" size={13} color={colors.textMuted} />
                <Text className="text-xs font-medium" style={{ color: colors.text }}>
                  {candidate.email}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Commercial & Placement Economics */}
        <View
          className="rounded-[16px] border p-4 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text className="text-xs font-bold tracking-tight mb-2.5" style={{ color: colors.text }}>
            Candidate Compensation & Availability
          </Text>

          <View className="grid grid-cols-2 gap-2">
            <View className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
              <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Notice Period</Text>
              <Text className="text-xs font-bold mt-0.5" style={{ color: colors.text }}>
                {noticePeriod}
              </Text>
            </View>

            <View className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
              <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Current Salary</Text>
              <Text className="text-xs font-bold mt-0.5" style={{ color: colors.text }}>
                {currentCtc}
              </Text>
            </View>

            <View className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.successSoft, borderColor: colors.successBorder }}>
              <Text className="text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.success }}>Expected Salary</Text>
              <Text className="text-xs font-bold mt-0.5" style={{ color: colors.success }}>
                {expectedCtc}
              </Text>
            </View>

            <View className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
              <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Application Date</Text>
              <Text className="text-xs font-bold mt-0.5" style={{ color: colors.text }}>
                {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'Recent'}
              </Text>
            </View>
          </View>
        </View>

        {/* Resume & Notes Summary */}
        {(candidate.notes || parsed.summary || parsed.skills) && (
          <View
            className="rounded-[16px] border p-4 shadow-sm mb-3"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text className="text-xs font-bold tracking-tight mb-2" style={{ color: colors.text }}>
              Resume Highlights & Notes
            </Text>
            {parsed.summary ? (
              <Text className="text-xs leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
                {parsed.summary}
              </Text>
            ) : null}
            {candidate.notes ? (
              <View className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
                <Text className="text-[11px] leading-relaxed" style={{ color: colors.text }}>
                  {candidate.notes}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 p-3 border-t flex-row items-center gap-x-2 shadow-2xl"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        {candidate.phone && (
          <Pressable
            onPress={handleCall}
            className="h-11 w-11 items-center justify-center rounded-xl border active:opacity-75"
            style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
          >
            <Ionicons name="call" size={18} color={colors.info} />
          </Pressable>
        )}

        <Pressable
          onPress={handleWhatsApp}
          className="flex-1 h-11 flex-row items-center justify-center gap-x-1.5 rounded-xl active:opacity-85 shadow-md"
          style={{ backgroundColor: colors.whatsapp }}
        >
          <Ionicons name="logo-whatsapp" size={17} color="#ffffff" />
          <Text className="text-xs font-bold text-white">WhatsApp Outreach</Text>
        </Pressable>

        <Pressable
          onPress={() => setShowConvertModal(true)}
          className="flex-1 h-11 flex-row items-center justify-center gap-x-1.5 rounded-xl active:opacity-85 shadow-md"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="funnel" size={16} color="#ffffff" />
          <Text className="text-xs font-bold text-white">Convert to Deal</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}
