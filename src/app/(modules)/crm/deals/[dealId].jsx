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
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import DealBillingModal from '../_components/DealBillingModal';
import * as crmService from '~/services/crm';

export default function DealDossierScreen() {
  const { dealId } = useLocalSearchParams();
  const router = useRouter();
  const { openQuickWhatsApp, openCreateTask, refreshAll } = useCrm();

  const [deal, setDeal] = useState(null);
  const [healthAi, setHealthAi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [stageUpdating, setStageUpdating] = useState(false);

  const fetchDeal = useCallback(async () => {
    if (!dealId) return;
    try {
      const res = await crmService.getDeal(dealId);
      if (res.success && res.data) {
        setDeal(res.data);
      }
    } catch (e) {
      console.warn('Failed to load deal:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dealId]);

  const fetchHealthScore = useCallback(async () => {
    if (!dealId) return;
    try {
      setLoadingAi(true);
      const res = await crmService.getDealHealthScore(dealId);
      if (res.success && res.data) {
        setHealthAi(res.data);
      }
    } catch (e) {
      console.warn('Failed to score deal health:', e.message);
    } finally {
      setLoadingAi(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
    fetchHealthScore();
  }, [fetchDeal, fetchHealthScore]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeal();
    fetchHealthScore();
    refreshAll();
  };

  const handleStageSelect = async (newStageId) => {
    if (!deal || deal.stageId === newStageId) return;
    try {
      setStageUpdating(true);
      await crmService.updateDealStage(deal.id, newStageId);
      fetchDeal();
      refreshAll();
    } catch (e) {
      console.warn('Failed to update stage:', e.message);
    } finally {
      setStageUpdating(false);
    }
  };

  if (loading && !deal) {
    return (
      <AppScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-xs text-slate-400 font-semibold mt-2">Loading Opportunity Dossier...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!deal) {
    return (
      <AppScreen>
        <CrmHeader title="Opportunity" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-bold text-slate-700">Deal Not Found</Text>
        </View>
      </AppScreen>
    );
  }

  const stages = deal.pipeline?.stages || [];
  const formattedVal = (parseFloat(deal.value) || 0).toLocaleString('en-IN');
  const currencySymbol = deal.currency === 'USD' ? '$' : deal.currency === 'EUR' ? '€' : '₹';

  return (
    <AppScreen>
      <CrmHeader
        title={deal.title}
        subtitle={`${deal.currency} ${formattedVal} • ${deal.stage?.name || 'In Funnel'}`}
        showBack={true}
        rightActions={
          <Pressable
            onPress={() => setBillingModalVisible(true)}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl bg-purple-600 active:bg-purple-700"
          >
            <Ionicons name="card" size={14} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Invoice</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <DealBillingModal
        visible={billingModalVisible}
        onClose={() => setBillingModalVisible(false)}
        deal={deal}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="px-4 pt-3.5"
      >
        {/* Stage Progress Stepper */}
        <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3.5">
          <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Pipeline Stage Progression
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-1">
            {stages.map((stg, idx) => {
              const isActive = deal.stageId === stg.id;
              return (
                <Pressable
                  key={stg.id}
                  onPress={() => handleStageSelect(stg.id)}
                  disabled={stageUpdating}
                  className={`rounded-xl border px-3 py-2 flex-row items-center gap-x-1.5 ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      isActive ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {idx + 1}. {stg.name}
                  </Text>
                  {isActive && <Ionicons name="checkmark-circle" size={13} color="#ffffff" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Financial Value & Metrics Card */}
        <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3.5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Commercial Value
              </Text>
              <Text className="text-2xl font-black text-indigo-700 mt-0.5">
                {currencySymbol} {formattedVal}
              </Text>
            </View>

            <View className="items-end">
              <View className="rounded-full bg-slate-100 px-2.5 py-1 border border-slate-200">
                <Text className="text-[10px] font-bold text-slate-700">
                  Priority: {deal.priority || 'MEDIUM'}
                </Text>
              </View>
              <Text className="text-[11px] font-semibold text-slate-500 mt-1">
                Win Prob: {deal.stage?.probability ?? 50}%
              </Text>
            </View>
          </View>
        </View>

        {/* FlowGenix AI Intelligence Health Card */}
        <View className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm mb-3.5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-x-2">
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <Ionicons name="sparkles" size={14} color="#ffffff" />
              </View>
              <Text className="text-xs font-black text-indigo-950">FlowGenix AI Health & Win Score</Text>
            </View>

            {healthAi?.healthScore !== undefined ? (
              <View className="rounded-full bg-indigo-600 px-2.5 py-0.5">
                <Text className="text-[10px] font-black text-white">{healthAi.healthScore}/100 Score</Text>
              </View>
            ) : null}
          </View>

          {loadingAi ? (
            <View className="py-3 items-center justify-center">
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text className="text-[11px] text-indigo-700 font-semibold mt-1">
                Evaluating deal velocity and momentum...
              </Text>
            </View>
          ) : healthAi ? (
            <View>
              <Text className="text-xs text-indigo-900 font-medium leading-5">{healthAi.summary}</Text>

              {healthAi.nextBestActions && healthAi.nextBestActions.length > 0 && (
                <View className="mt-2.5 pt-2 border-t border-indigo-100">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 mb-1">
                    Recommended Next Actions:
                  </Text>
                  {healthAi.nextBestActions.map((act, i) => (
                    <Text key={i} className="text-xs text-indigo-900 font-semibold mt-0.5">
                      • {act}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text className="text-xs text-slate-500 italic">No AI telemetry computed yet.</Text>
          )}
        </View>

        {/* Linked Contact Card */}
        {deal.contact && (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3.5">
            <View className="flex-row items-center justify-between mb-2.5">
              <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Primary Contact
              </Text>
              <Pressable onPress={() => router.push(`/(modules)/crm/contacts/${deal.contact.id}`)}>
                <Text className="text-xs font-bold text-indigo-600">View Dossier →</Text>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-black text-slate-900">{deal.contact.name}</Text>
                <Text className="text-xs text-slate-500 mt-0.5">{deal.contact.jobTitle || 'Lead'}</Text>
                {deal.contact.phone && (
                  <Text className="text-xs font-mono text-slate-700 mt-0.5">{deal.contact.phone}</Text>
                )}
              </View>

              {deal.contact.phone && (
                <View className="flex-row items-center gap-x-1.5">
                  <Pressable
                    onPress={() => openQuickWhatsApp(deal.contact, deal)}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 active:bg-emerald-100"
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#059669" />
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${deal.contact.phone}`)}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 active:bg-sky-100"
                  >
                    <Ionicons name="call-outline" size={16} color="#0284c7" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Linked Company Account Card */}
        {deal.account && (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3.5">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Company Account
              </Text>
              <Pressable onPress={() => router.push(`/(modules)/crm/accounts/${deal.account.id}`)}>
                <Text className="text-xs font-bold text-indigo-600">Account Sheet →</Text>
              </Pressable>
            </View>
            <Text className="text-sm font-black text-slate-900">{deal.account.name}</Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {deal.account.industry || 'General Industry'} • {deal.account.size || 'Enterprise'}
            </Text>
          </View>
        )}

        {/* Notes & Context */}
        {deal.notes && (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3.5">
            <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              Internal Deal Notes
            </Text>
            <Text className="text-xs text-slate-700 leading-5">{deal.notes}</Text>
          </View>
        )}

        {/* Action Shortcuts */}
        <View className="flex-row gap-x-2 mt-2">
          <Pressable
            onPress={() => openCreateTask({ dealId: deal.id, contactId: deal.contactId, title: `Follow up on ${deal.title}` })}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-2xl bg-indigo-600 py-3.5 shadow-sm active:bg-indigo-700"
          >
            <Ionicons name="calendar" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Add Task</Text>
          </Pressable>

          <Pressable
            onPress={() => setBillingModalVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-2xl bg-purple-600 py-3.5 shadow-sm active:bg-purple-700"
          >
            <Ionicons name="card" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Issue Invoice</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
