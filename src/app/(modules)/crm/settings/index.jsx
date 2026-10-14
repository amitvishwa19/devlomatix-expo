import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../utils/colors';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';

export default function CrmSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { pipelines, activePipeline, refreshAll, refreshing } = useCrm();

  const [syncingWa, setSyncingWa] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSyncWhatsApp = async () => {
    try {
      setSyncingWa(true);
      setSyncResult(null);
      const res = await crmService.syncWhatsAppChats();
      if (res.success) {
        setSyncResult({
          type: 'success',
          text: `WhatsApp Synced! ${res.data?.newContactsCreated || 0} contacts created, ${res.data?.messagesLinked || 0} messages attached to CRM timeline.`,
        });
        refreshAll();
      } else {
        setSyncResult({ type: 'error', text: res.error || 'Failed to sync WhatsApp chats' });
      }
    } catch (e) {
      setSyncResult({ type: 'error', text: e.message || 'Sync error' });
    } finally {
      setSyncingWa(false);
    }
  };

  const stages = activePipeline?.stages || [];

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title="CRM Settings & Bridges"
        subtitle="Ecosystem Integrations & Pipeline Config"
        showBack={true}
        showSettings={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
        className="px-3 pt-2.5"
      >
        {/* Active Pipeline & Stage Config */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between mb-2.5">
            <View>
              <Text
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Active Deal Pipeline
              </Text>
              <Text className="text-sm font-black mt-0.5" style={{ color: colors.text }}>
                {activePipeline?.name || 'Default Sales Pipeline'}
              </Text>
            </View>
            <View
              className="rounded-full px-2 py-0.5 border"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.primary }}>
                {stages.length} Stages
              </Text>
            </View>
          </View>

          {/* Stages List */}
          {stages.map((stage, idx) => (
            <View
              key={stage.id}
              className="flex-row items-center justify-between py-2"
              style={{
                borderTopWidth: idx !== 0 ? 1 : 0,
                borderTopColor: colors.borderLight,
              }}
            >
              <View className="flex-row items-center gap-x-2">
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.color || colors.primary }}
                />
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  {idx + 1}. {stage.name}
                </Text>
              </View>
              <Text className="text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                {stage.probability}% win probability
              </Text>
            </View>
          ))}
        </View>

        {/* 1-Click WhatsApp Chat Sync Card */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-3"
          style={{
            backgroundColor: colors.whatsappSoft,
            borderColor: colors.whatsappBorder,
          }}
        >
          <View className="flex-row items-center gap-x-2 mb-1.5">
            <View
              className="h-7 w-7 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.whatsapp }}
            >
              <Ionicons name="logo-whatsapp" size={15} color="#ffffff" />
            </View>
            <View>
              <Text className="text-xs font-black" style={{ color: colors.whatsapp }}>
                KonnectX WhatsApp Bridge
              </Text>
              <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                Auto-scan conversations & sync contacts
              </Text>
            </View>
          </View>

          <Text className="text-xs mt-1.5 leading-5" style={{ color: colors.textSecondary }}>
            Scans your KonnectX WhatsApp Cloud inbox, auto-registers new client profiles into CRM, and links full chat history to contact dossiers.
          </Text>

          {syncResult && (
            <View
              className="mt-2.5 rounded-xl p-2 border"
              style={{
                backgroundColor: syncResult.type === 'success' ? colors.successSoft : colors.dangerSoft,
                borderColor: syncResult.type === 'success' ? colors.successBorder : colors.dangerBorder,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{
                  color: syncResult.type === 'success' ? colors.success : colors.danger,
                }}
              >
                {syncResult.text}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleSyncWhatsApp}
            disabled={syncingWa}
            className="mt-2.5 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2.5 shadow-sm active:opacity-80"
            style={{
              backgroundColor: colors.whatsapp,
              opacity: syncingWa ? 0.5 : 1,
            }}
          >
            {syncingWa ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="sync" size={15} color="#ffffff" />
                <Text className="text-xs font-black text-white">Sync WhatsApp Chats Now</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Cross-Module Bridges Overview */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-xs font-black uppercase tracking-wider mb-2.5"
            style={{ color: colors.textMuted }}
          >
            Active Ecosystem Bridges
          </Text>

          {/* PayFlow Bridge */}
          <View
            className="flex-row items-center justify-between py-2 border-b"
            style={{ borderBottomColor: colors.borderLight }}
          >
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="card-outline" size={16} color={colors.copilot} />
              <View>
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  PayFlow Billing Bridge
                </Text>
                <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                  1-Click Invoice & Quotations
                </Text>
              </View>
            </View>
            <View
              className="rounded-full px-2 py-0.5 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.success }}>
                Connected
              </Text>
            </View>
          </View>

          {/* FlowGenix Bridge */}
          <View
            className="flex-row items-center justify-between py-2 border-b"
            style={{ borderBottomColor: colors.borderLight }}
          >
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              <View>
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  FlowGenix AI Agent
                </Text>
                <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                  Sales Intelligence & Health Scoring
                </Text>
              </View>
            </View>
            <View
              className="rounded-full px-2 py-0.5 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.success }}>
                Active
              </Text>
            </View>
          </View>

          {/* Hireflow Bridge */}
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="briefcase-outline" size={16} color={colors.info} />
              <View>
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  Hireflow ATS Bridge
                </Text>
                <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                  Candidate ⇄ Lead Conversion
                </Text>
              </View>
            </View>
            <View
              className="rounded-full px-2 py-0.5 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.success }}>
                Connected
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
