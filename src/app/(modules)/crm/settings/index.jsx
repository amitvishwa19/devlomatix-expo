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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';

export default function CrmSettingsScreen() {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
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
        <View className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs font-black uppercase tracking-wider text-slate-400">
                Active Deal Pipeline
              </Text>
              <Text className="text-base font-black text-slate-900 mt-0.5">
                {activePipeline?.name || 'Default Sales Pipeline'}
              </Text>
            </View>
            <View className="rounded-full bg-indigo-50 px-2 py-0.5 border border-indigo-100">
              <Text className="text-[9px] font-bold text-indigo-700">{stages.length} Stages</Text>
            </View>
          </View>

          {/* Stages List */}
          {stages.map((stage, idx) => (
            <View
              key={stage.id}
              className={`flex-row items-center justify-between py-2.5 ${
                idx !== 0 ? 'border-t border-slate-100' : ''
              }`}
            >
              <View className="flex-row items-center gap-x-2.5">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || '#4f46e5' }} />
                <Text className="text-xs font-bold text-slate-800">
                  {idx + 1}. {stage.name}
                </Text>
              </View>
              <Text className="text-xs font-semibold text-slate-500">
                {stage.probability}% win probability
              </Text>
            </View>
          ))}
        </View>

        {/* 1-Click WhatsApp Chat Sync Card */}
        <View className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm mb-4">
          <View className="flex-row items-center gap-x-2.5 mb-1.5">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
              <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
            </View>
            <View>
              <Text className="text-sm font-black text-emerald-950">KonnectX WhatsApp Bridge</Text>
              <Text className="text-[11px] text-emerald-700">Auto-scan conversations & sync contacts</Text>
            </View>
          </View>

          <Text className="text-xs text-slate-600 mt-2 leading-5">
            Scans your KonnectX WhatsApp Cloud inbox, auto-registers new client profiles into CRM, and links full chat history to contact dossiers.
          </Text>

          {syncResult && (
            <View
              className={`mt-3 rounded-xl p-2.5 border ${
                syncResult.type === 'success' ? 'bg-emerald-100/70 border-emerald-300' : 'bg-rose-100 border-rose-300'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  syncResult.type === 'success' ? 'text-emerald-900' : 'text-rose-900'
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
        <View className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm mb-4">
          <Text className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Active Ecosystem Bridges
          </Text>

          {/* PayFlow Bridge */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-100">
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="card-outline" size={18} color="#7c3aed" />
              <View>
                <Text className="text-xs font-bold text-slate-900">PayFlow Billing Bridge</Text>
                <Text className="text-[10px] text-slate-500">1-Click Invoice & Quotations</Text>
              </View>
            </View>
            <View className="rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              <Text className="text-[9px] font-bold text-emerald-700">Connected</Text>
            </View>
          </View>

          {/* FlowGenix Bridge */}
          <View className="flex-row items-center justify-between py-2.5 border-b border-slate-100">
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="sparkles-outline" size={18} color="#4f46e5" />
              <View>
                <Text className="text-xs font-bold text-slate-900">FlowGenix AI Agent</Text>
                <Text className="text-[10px] text-slate-500">Sales Intelligence & Health Scoring</Text>
              </View>
            </View>
            <View className="rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              <Text className="text-[9px] font-bold text-emerald-700">Active</Text>
            </View>
          </View>

          {/* Hireflow Bridge */}
          <View className="flex-row items-center justify-between py-2.5">
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="briefcase-outline" size={18} color="#0284c7" />
              <View>
                <Text className="text-xs font-bold text-slate-900">Hireflow ATS Bridge</Text>
                <Text className="text-[10px] text-slate-500">Candidate ⇄ Lead Conversion</Text>
              </View>
            </View>
            <View className="rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              <Text className="text-[9px] font-bold text-emerald-700">Connected</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
