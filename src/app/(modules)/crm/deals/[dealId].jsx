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
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import DealBillingModal from '../_components/DealBillingModal';
import * as crmService from '~/services/crm';

export default function DealDossierScreen() {
  const { dealId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
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
      <AppScreen style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
            Loading Opportunity Dossier...
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!deal) {
    return (
      <AppScreen style={{ backgroundColor: colors.background }}>
        <CrmHeader title="Opportunity" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Deal Not Found
          </Text>
        </View>
      </AppScreen>
    );
  }

  const stages = deal.pipeline?.stages || [];
  const formattedVal = (parseFloat(deal.value) || 0).toLocaleString('en-IN');
  const currencySymbol = deal.currency === 'USD' ? '$' : deal.currency === 'EUR' ? '€' : '₹';
  const dealPriority = colors.priority[deal.priority] || colors.priority.MEDIUM;

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title={deal.title}
        subtitle={`${deal.currency} ${formattedVal} • ${deal.stage?.name || 'In Funnel'}`}
        showBack={true}
        rightActions={
          <Pressable
            onPress={() => setBillingModalVisible(true)}
            className="h-8 px-2.5 flex-row items-center justify-center gap-x-1 rounded-xl active:opacity-80"
            style={{ backgroundColor: colors.copilot }}
          >
            <Ionicons name="card" size={13} color="#ffffff" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        className="px-3 pt-2.5"
      >
        {/* Stage Progress Stepper */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-2.5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-[10px] font-black uppercase tracking-wider mb-2"
            style={{ color: colors.textMuted }}
          >
            Pipeline Stage Progression
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-2 py-0.5">
            {stages.map((stg, idx) => {
              const isActive = deal.stageId === stg.id;
              return (
                <Pressable
                  key={stg.id}
                  onPress={() => handleStageSelect(stg.id)}
                  disabled={stageUpdating}
                  className="rounded-xl border px-2.5 py-1.5 flex-row items-center gap-x-1.5"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.cardAlt,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: isActive ? '#ffffff' : colors.text }}
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
        <View
          className="rounded-2xl border p-3 shadow-sm mb-2.5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Commercial Value
              </Text>
              <Text className="text-xl font-black mt-0.5" style={{ color: colors.primary }}>
                {currencySymbol} {formattedVal}
              </Text>
            </View>

            <View className="items-end">
              <View
                className="rounded-full px-2 py-0.5 border"
                style={{
                  backgroundColor: dealPriority.bg,
                  borderColor: dealPriority.border,
                }}
              >
                <Text className="text-[10px] font-bold" style={{ color: dealPriority.text }}>
                  {deal.priority || 'MEDIUM'}
                </Text>
              </View>
              <Text className="text-[11px] font-semibold mt-1" style={{ color: colors.textMuted }}>
                Win Prob: {deal.stage?.probability ?? 50}%
              </Text>
            </View>
          </View>
        </View>

        {/* FlowGenix AI Intelligence Health Card */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-2.5"
          style={{
            backgroundColor: colors.copilotSoft,
            borderColor: colors.copilotBorder,
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-x-2">
              <View
                className="h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: colors.copilot }}
              >
                <Ionicons name="sparkles" size={13} color="#ffffff" />
              </View>
              <Text className="text-xs font-black" style={{ color: colors.copilot }}>
                AI Health & Win Score
              </Text>
            </View>

            {healthAi?.healthScore !== undefined ? (
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.copilot }}
              >
                <Text className="text-[10px] font-black text-white">
                  {healthAi.healthScore}/100 Score
                </Text>
              </View>
            ) : null}
          </View>

          {loadingAi ? (
            <View className="py-2.5 items-center justify-center">
              <ActivityIndicator size="small" color={colors.copilot} />
              <Text className="text-[11px] font-semibold mt-1" style={{ color: colors.copilot }}>
                Evaluating deal velocity and momentum...
              </Text>
            </View>
          ) : healthAi ? (
            <View>
              <Text className="text-xs font-medium leading-5" style={{ color: colors.textSecondary }}>
                {healthAi.summary}
              </Text>

              {healthAi.nextBestActions && healthAi.nextBestActions.length > 0 && (
                <View
                  className="mt-2 pt-2 border-t"
                  style={{ borderTopColor: colors.copilotBorder }}
                >
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: colors.copilot }}
                  >
                    Recommended Next Actions:
                  </Text>
                  {healthAi.nextBestActions.map((act, i) => (
                    <Text
                      key={i}
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      • {act}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text className="text-xs italic" style={{ color: colors.textMuted }}>
              No AI telemetry computed yet.
            </Text>
          )}
        </View>

        {/* Linked Contact Card */}
        {deal.contact && (
          <View
            className="rounded-2xl border p-3 shadow-sm mb-2.5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-[10px] font-black uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Primary Contact
              </Text>
              <Pressable onPress={() => router.push(`/(modules)/crm/contacts/${deal.contact.id}`)}>
                <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                  View Dossier →
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-black" style={{ color: colors.text }}>
                  {deal.contact.name}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                  {deal.contact.jobTitle || 'Lead'}
                </Text>
                {deal.contact.phone && (
                  <Text className="text-xs font-mono mt-0.5" style={{ color: colors.textSoft }}>
                    {deal.contact.phone}
                  </Text>
                )}
              </View>

              {deal.contact.phone && (
                <View className="flex-row items-center gap-x-1.5">
                  <Pressable
                    onPress={() => openQuickWhatsApp(deal.contact, deal)}
                    className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-75"
                    style={{
                      backgroundColor: colors.whatsappSoft,
                      borderColor: colors.whatsappBorder,
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color={colors.whatsapp} />
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${deal.contact.phone}`)}
                    className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-75"
                    style={{
                      backgroundColor: colors.callSoft,
                      borderColor: colors.callBorder,
                    }}
                  >
                    <Ionicons name="call-outline" size={15} color={colors.call} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Linked Company Account Card */}
        {deal.account && (
          <View
            className="rounded-2xl border p-3 shadow-sm mb-2.5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="text-[10px] font-black uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Company Account
              </Text>
              <Pressable onPress={() => router.push(`/(modules)/crm/accounts/${deal.account.id}`)}>
                <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                  Account Sheet →
                </Text>
              </Pressable>
            </View>
            <Text className="text-sm font-black" style={{ color: colors.text }}>
              {deal.account.name}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
              {deal.account.industry || 'General Industry'} • {deal.account.size || 'Enterprise'}
            </Text>
          </View>
        )}

        {/* Notes & Context */}
        {deal.notes && (
          <View
            className="rounded-2xl border p-3 shadow-sm mb-2.5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text
              className="text-[10px] font-black uppercase tracking-wider mb-1"
              style={{ color: colors.textMuted }}
            >
              Internal Deal Notes
            </Text>
            <Text className="text-xs leading-5" style={{ color: colors.text }}>
              {deal.notes}
            </Text>
          </View>
        )}

        {/* Action Shortcuts */}
        <View className="flex-row gap-x-2 mt-1.5">
          <Pressable
            onPress={() => openCreateTask({ dealId: deal.id, contactId: deal.contactId, title: `Follow up on ${deal.title}` })}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 shadow-sm active:opacity-80"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="calendar" size={15} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Add Task</Text>
          </Pressable>

          <Pressable
            onPress={() => setBillingModalVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 shadow-sm active:opacity-80"
            style={{ backgroundColor: colors.copilot }}
          >
            <Ionicons name="card" size={15} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Issue Invoice</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
