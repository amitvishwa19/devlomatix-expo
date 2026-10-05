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
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';

export default function CrmSettingsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
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
    <AppScreen>
      <CrmHeader
        title="CRM Settings & Bridges"
        subtitle="Ecosystem Integrations & Pipeline Config"
        showBack={true}
        showSettings={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        className="px-4 pt-3.5"
      >
        {/* Active Pipeline & Stage Config */}
        <View className={`rounded-2xl border ${palette.border} ${palette.surface} p-4 shadow-sm mb-4`}>
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className={`text-xs font-black uppercase tracking-wider ${palette.textMuted}`}>
                Active Deal Pipeline
              </Text>
              <Text className={`text-base font-black ${palette.text} mt-0.5`}>
                {activePipeline?.name || 'Default Sales Pipeline'}
              </Text>
            </View>
            <View className="rounded-full bg-indigo-500/15 px-2 py-0.5 border border-indigo-500/30">
              <Text className="text-[9px] font-bold text-indigo-400">{stages.length} Stages</Text>
            </View>
          </View>

          {/* Stages List */}
          {stages.map((stage, idx) => (
            <View
              key={stage.id}
              className={`flex-row items-center justify-between py-2.5 ${
                idx !== 0 ? `border-t ${palette.border}` : ''
              }`}
            >
              <View className="flex-row items-center gap-x-2.5">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || '#4f46e5' }} />
                <Text className={`text-xs font-bold ${palette.text}`}>
                  {idx + 1}. {stage.name}
                </Text>
              </View>
              <Text className={`text-xs font-semibold ${palette.textMuted}`}>
                {stage.probability}% win probability
              </Text>
            </View>
          ))}
        </View>

        {/* 1-Click WhatsApp Chat Sync Card */}
        <View className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 shadow-sm mb-4">
          <View className="flex-row items-center gap-x-2.5 mb-1.5">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
              <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
            </View>
            <View>
              <Text className="text-sm font-black text-emerald-400">KonnectX WhatsApp Bridge</Text>
              <Text className="text-[11px] text-emerald-300">Auto-scan conversations & sync contacts</Text>
            </View>
          </View>

          <Text className={`text-xs ${palette.textSoft} mt-2 leading-5`}>
            Scans your KonnectX WhatsApp Cloud inbox, auto-registers new client profiles into CRM, and links full chat history to contact dossiers.
          </Text>

          {syncResult && (
            <View
              className={`mt-3 rounded-xl p-2.5 border ${
                syncResult.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-rose-500/20 border-rose-500/40'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  syncResult.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {syncResult.text}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleSyncWhatsApp}
            disabled={syncingWa}
            className={`mt-3 flex-row items-center justify-center gap-x-2 rounded-xl bg-emerald-600 py-3 shadow-sm active:bg-emerald-700 ${
              syncingWa ? 'opacity-50' : ''
            }`}
          >
            {syncingWa ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="sync" size={16} color="#ffffff" />
                <Text className="text-xs font-black text-white">Sync WhatsApp Chats Now</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Cross-Module Bridges Overview */}
        <View className={`rounded-2xl border ${palette.border} ${palette.surface} p-4 shadow-sm mb-4`}>
          <Text className={`text-xs font-black uppercase tracking-wider ${palette.textMuted} mb-3`}>
            Active Ecosystem Bridges
          </Text>

          {/* PayFlow Bridge */}
          <View className={`flex-row items-center justify-between py-2.5 border-b ${palette.border}`}>
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="card-outline" size={18} color="#a855f7" />
              <View>
                <Text className={`text-xs font-bold ${palette.text}`}>PayFlow Billing Bridge</Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>1-Click Invoice & Quotations</Text>
              </View>
            </View>
            <View className="rounded-full bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/30">
              <Text className="text-[9px] font-bold text-emerald-400">Connected</Text>
            </View>
          </View>

          {/* FlowGenix Bridge */}
          <View className={`flex-row items-center justify-between py-2.5 border-b ${palette.border}`}>
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="sparkles-outline" size={18} color="#818cf8" />
              <View>
                <Text className={`text-xs font-bold ${palette.text}`}>FlowGenix AI Agent</Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>Sales Intelligence & Health Scoring</Text>
              </View>
            </View>
            <View className="rounded-full bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/30">
              <Text className="text-[9px] font-bold text-emerald-400">Active</Text>
            </View>
          </View>

          {/* Hireflow Bridge */}
          <View className="flex-row items-center justify-between py-2.5">
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="briefcase-outline" size={18} color="#0ea5e9" />
              <View>
                <Text className={`text-xs font-bold ${palette.text}`}>Hireflow ATS Bridge</Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>Candidate ⇄ Lead Conversion</Text>
              </View>
            </View>
            <View className="rounded-full bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/30">
              <Text className="text-[9px] font-bold text-emerald-400">Connected</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
