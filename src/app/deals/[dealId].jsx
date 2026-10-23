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
import Toast from 'react-native-toast-message';
import AppScreen from '~/components/AppScreen';
import MarkdownMessage from '~/components/MarkdownMessage';
import { useCrmTheme } from '~/utils/crm/colors';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import DealBillingModal from '../_components/DealBillingModal';
import AiStalledDealRevivalModal from '../_components/AiStalledDealRevivalModal';
import * as crmService from '~/services/crm';
import { printOrShareQuotationPdf } from '~/services/quotationPdf';
import IosDeleteConfirmModal from '../_components/IosDeleteConfirmModal';
import { PermissionGate } from '~/components/PermissionGate';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

export default function DealDossierScreen() {
  const { dealId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { openQuickWhatsApp, openCreateTask, refreshAll, optimisticMoveDealStage, optimisticDeleteDeal } = useCrm();

  const [deal, setDeal] = useState(null);
  const [healthAi, setHealthAi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [actionPlan, setActionPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [revivalModalVisible, setRevivalModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);

  const handleShareQuotation = async () => {
    if (!deal || sharingPdf) return;
    try {
      setSharingPdf(true);
      try {
        HapticsModule?.selectionAsync?.();
      } catch (_) {}

      const val = parseFloat(deal.value) || 0;
      const currency = deal.currency || 'INR';

      const quotationObj = {
        quotationNumber: `Q-${(deal.id || 'DEAL').slice(-6).toUpperCase()}`,
        dealId: deal.id,
        total: val,
        createdAt: deal.createdAt || new Date().toISOString(),
        data: {
          quotation: {
            quotationNumber: `Q-${(deal.id || 'DEAL').slice(-6).toUpperCase()}`,
            date: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            currency,
            subject: `Commercial Proposal: ${deal.title}`,
          },
          client: {
            companyName: deal.account?.name || deal.contact?.name || 'Valued Partner',
            contactPerson: deal.contact?.name || deal.account?.name || '',
            email: deal.contact?.email || '',
            phone: deal.contact?.phone || '',
          },
          items: [
            {
              name: deal.title || 'Enterprise Commercial Deliverables',
              description: `Scope of delivery for ${deal.account?.name || deal.contact?.name || 'Client Engagement'}. Dedicated implementation, commercial rollout & support.`,
              quantity: 1,
              unitPrice: val,
              discountPercent: 0,
              taxPercent: 18,
            },
          ],
          summary: {
            subtotal: val,
            discountTotal: 0,
            taxTotal: Math.round(val * 0.18),
            grandTotal: Math.round(val * 1.18),
          },
        },
      };

      const res = await printOrShareQuotationPdf(quotationObj, null, 'share');
      if (res.success) {
        try {
          HapticsModule?.notificationAsync?.(HapticsModule.NotificationFeedbackType.Success);
        } catch (_) {}
      } else {
        Toast.show({
          type: 'error',
          text1: 'Quotation Share Error',
          text2: res.error || 'Could not export proposal PDF',
        });
      }
    } catch (err) {
      console.warn('Share quote error:', err);
      Toast.show({
        type: 'error',
        text1: 'Quotation Export Failed',
        text2: err.message || 'Error compiling PDF',
      });
    } finally {
      setSharingPdf(false);
    }
  };

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

  const generateActionPlan = useCallback(async () => {
    if (!dealId || loadingPlan) return;
    try {
      setLoadingPlan(true);
      const res = await crmService.generateDealActionPlan(dealId);
      if (res.success && res.data) {
        setActionPlan(res.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Action plan unavailable',
          text2: res.error || 'Please try again.',
        });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Action plan failed', text2: e.message });
    } finally {
      setLoadingPlan(false);
    }
  }, [dealId, loadingPlan]);

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
    const stages = deal.pipeline?.stages || [];
    const targetStage = stages.find((s) => s.id === newStageId);

    // Instant optimistic update
    setDeal((prev) => ({
      ...prev,
      stageId: newStageId,
      stage: targetStage || prev.stage,
    }));

    optimisticMoveDealStage(deal.id, newStageId).catch(() => {});
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
          <View className="flex-row items-center gap-x-1.5">
            <Pressable
              onPress={handleShareQuotation}
              disabled={sharingPdf}
              className="h-8 px-2.5 flex-row items-center justify-center gap-x-1 rounded-xl border active:opacity-80"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              {sharingPdf ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="document-text-outline" size={13} color={colors.primary} />
              )}
              <Text className="text-xs font-bold" style={{ color: colors.primary }}>Quote</Text>
            </Pressable>

            <Pressable
              onPress={() => setBillingModalVisible(true)}
              className="h-8 px-2.5 flex-row items-center justify-center gap-x-1 rounded-xl active:opacity-80"
              style={{ backgroundColor: colors.copilot }}
            >
              <Ionicons name="card" size={13} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Invoice</Text>
            </Pressable>

            <PermissionGate action="delete" resource="deal">
              <Pressable
                onPress={() => setDeleteModalVisible(true)}
                hitSlop={8}
                className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-70"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
              </Pressable>
            </PermissionGate>
          </View>
        }
      />

      <QuickWhatsAppModal />
      <DealBillingModal
        visible={billingModalVisible}
        onClose={() => setBillingModalVisible(false)}
        deal={deal}
      />
      <AiStalledDealRevivalModal
        visible={revivalModalVisible}
        onClose={() => setRevivalModalVisible(false)}
        deal={deal}
        onSuccess={onRefresh}
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
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
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
              <Text className="text-xl font-bold mt-0.5" style={{ color: colors.primary }}>
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
              <Text className="text-xs font-bold" style={{ color: colors.copilot }}>
                AI Health & Win Score
              </Text>
            </View>

            {healthAi?.healthScore !== undefined ? (
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.copilot }}
              >
                <Text className="text-[10px] font-bold text-white">
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

              <View className="mt-3 flex-row gap-x-2">
                <Pressable
                  onPress={() => setRevivalModalVisible(true)}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 active:opacity-80"
                  style={{ backgroundColor: colors.copilot }}
                >
                  <Ionicons name="flame" size={14} color="#ffffff" />
                  <Text className="text-[11px] font-bold text-white">Revive Deal</Text>
                </Pressable>
                <Pressable
                  onPress={generateActionPlan}
                  disabled={loadingPlan}
                  className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 border active:opacity-80"
                  style={{ backgroundColor: colors.card, borderColor: colors.copilotBorder }}
                >
                  {loadingPlan ? (
                    <ActivityIndicator size="small" color={colors.copilot} />
                  ) : (
                    <Ionicons name="list-outline" size={14} color={colors.copilot} />
                  )}
                  <Text className="text-[11px] font-bold" style={{ color: colors.copilot }}>
                    Action Plan
                  </Text>
                </Pressable>
              </View>

              {actionPlan && (
                <View
                  className="mt-2 rounded-xl border p-2.5"
                  style={{ backgroundColor: colors.card, borderColor: colors.copilotBorder }}
                >
                  {actionPlan.plan || actionPlan.summary || actionPlan.actionPlan ? (
                    <MarkdownMessage
                      content={
                        actionPlan.plan || actionPlan.summary || actionPlan.actionPlan
                      }
                    />
                  ) : null}
                  {Array.isArray(actionPlan.steps || actionPlan.actions) &&
                    (actionPlan.steps || actionPlan.actions).map((step, index) => (
                      <Text
                        key={index}
                        className="text-[11px] font-medium mt-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {index + 1}. {typeof step === 'string' ? step : step.title || step.action || JSON.stringify(step)}
                      </Text>
                    ))}
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text className="text-xs italic mb-2" style={{ color: colors.textMuted }}>
                No AI telemetry computed yet.
              </Text>
              <Pressable
                onPress={() => setRevivalModalVisible(true)}
                className="flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 active:opacity-80"
                style={{ backgroundColor: colors.copilot }}
              >
                <Ionicons name="flame" size={14} color="#ffffff" />
                <Text className="text-xs font-bold text-white">
                  AI Ghosting Recovery Options
                </Text>
              </Pressable>
            </View>
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
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Primary Contact
              </Text>
              <Pressable onPress={() => router.push(`/contacts/${deal.contact.id}`)}>
                <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                  View Dossier →
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
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
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Company Account
              </Text>
              <Pressable onPress={() => router.push(`/accounts/${deal.account.id}`)}>
                <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                  Account Sheet →
                </Text>
              </Pressable>
            </View>
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
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
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
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
            onPress={() => setRevivalModalVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 shadow-sm active:opacity-80"
            style={{ backgroundColor: colors.copilot }}
          >
            <Ionicons name="flame" size={15} color="#ffffff" />
            <Text className="text-xs font-bold text-white">AI Revive</Text>
          </Pressable>

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
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 border active:opacity-80"
            style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
          >
            <Ionicons name="card-outline" size={15} color={colors.text} />
            <Text className="text-xs font-bold" style={{ color: colors.text }}>Invoice</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* iOS-Style Delete Confirmation Modal */}
      <IosDeleteConfirmModal
        visible={deleteModalVisible}
        title={deal?.title ? `Delete "${deal.title}"` : 'Delete Opportunity'}
        message="Are you sure you want to delete this opportunity? This action cannot be undone."
        confirmText="Delete Deal"
        isPermanent={true}
        onConfirm={() => {
          setDeleteModalVisible(false);
          optimisticDeleteDeal(deal.id);
          router.back();
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </AppScreen>
  );
}
