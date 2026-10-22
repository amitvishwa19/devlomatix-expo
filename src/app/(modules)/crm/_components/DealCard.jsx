import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useCrm } from '~/providers/CrmProvider';
import { printOrShareQuotationPdf } from '~/services/quotationPdf';
import { useCrmTheme } from '../utils/colors';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (_) {}

export default function DealCard({ deal, onStageChange, onDeletePrompt }) {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { openQuickWhatsApp, stages, optimisticMoveDealStage } = useCrm();
  const [sharingPdf, setSharingPdf] = useState(false);
  const [advancingStage, setAdvancingStage] = useState(false);

  if (!deal) return null;

  const priorityStyle = colors.priority[deal.priority] || colors.priority.MEDIUM;
  const stageColor = deal.stage?.color || colors.primary;
  const formattedVal = (parseFloat(deal.value) || 0).toLocaleString('en-IN');
  const currencySymbol = deal.currency === 'USD' ? '$' : deal.currency === 'EUR' ? '€' : '₹';

  // Calculate Deal Age & Stalled Status
  const dealMomentum = useMemo(() => {
    const updatedTime = new Date(deal.updatedAt || deal.createdAt || Date.now()).getTime();
    const diffHours = Math.round((Date.now() - updatedTime) / (1000 * 60 * 60));
    const diffDays = Math.round(diffHours / 24);

    if (diffDays >= 7 && deal.status !== 'WON' && deal.status !== 'LOST') {
      return { label: `Stalled ${diffDays}d`, isStalled: true };
    }
    if (diffDays > 0) {
      return { label: `${diffDays}d ago`, isStalled: false };
    }
    if (diffHours > 0) {
      return { label: `${diffHours}h ago`, isStalled: false };
    }
    return { label: 'Active today', isStalled: false };
  }, [deal]);

  // Stage Progress: Order 1 to 5
  const currentStageIndex = useMemo(() => {
    if (!stages || stages.length === 0) return 0;
    const idx = stages.findIndex((s) => s.id === deal.stageId);
    return idx >= 0 ? idx : 0;
  }, [stages, deal.stageId]);

  const totalStages = Math.max(stages?.length || 5, 5);
  const stageOrder = (currentStageIndex + 1);

  // Next Stage in Pipeline
  const nextStage = useMemo(() => {
    if (!stages || stages.length === 0) return null;
    if (currentStageIndex < stages.length - 1) {
      return stages[currentStageIndex + 1];
    }
    return null;
  }, [stages, currentStageIndex]);

  const handleAdvanceStage = async () => {
    if (!nextStage || advancingStage) return;
    try {
      setAdvancingStage(true);
      try {
        HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle.Medium);
      } catch (_) {}
      await optimisticMoveDealStage(deal.id, nextStage.id);
      Toast.show({
        type: 'success',
        text1: 'Stage Advanced',
        text2: `Moved to "${nextStage.name}"`,
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Failed to advance stage',
        text2: e.message || 'Please try again',
      });
    } finally {
      setAdvancingStage(false);
    }
  };

  const handleShareQuotation = async () => {
    if (sharingPdf) return;
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

  const handleCall = () => {
    if (deal.contact?.phone) {
      Linking.openURL(`tel:${deal.contact.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (deal.contact) {
      openQuickWhatsApp(deal.contact, deal);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/(modules)/crm/deals/${deal.id}`)}
      onLongPress={() => onDeletePrompt?.(deal)}
      delayLongPress={350}
      className="mb-2.5 rounded-[16px] border p-3 active:opacity-85"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: colors.shadowColor,
        shadowOpacity: colors.shadowOpacity,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {/* Top Meta: Stage Pill, Momentum, & Priority */}
      <View className="flex-row items-center justify-between gap-x-2">
        <View className="flex-row items-center gap-x-1.5 flex-1">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: stageColor }} />
          <Text
            className="text-[11px] font-bold tracking-tight"
            style={{ color: stageColor }}
            numberOfLines={1}
          >
            {deal.stage?.name || 'In Pipeline'}
          </Text>

          {dealMomentum.isStalled ? (
            <View
              className="rounded-full px-1.5 py-0.5 border"
              style={{
                backgroundColor: colors.warningSoft,
                borderColor: colors.warningBorder,
              }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.warning }}>
                ⚠️ {dealMomentum.label}
              </Text>
            </View>
          ) : (
            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
              • {dealMomentum.label}
            </Text>
          )}
        </View>

        <View
          className="flex-row items-center gap-x-1 rounded-full border px-2 py-0.5"
          style={{
            backgroundColor: priorityStyle.bg,
            borderColor: priorityStyle.border,
          }}
        >
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityStyle.dot }} />
          <Text className="text-[9px] font-bold" style={{ color: priorityStyle.text }}>
            {deal.priority || 'MEDIUM'}
          </Text>
        </View>
      </View>

      {/* Deal Title */}
      <Text
        className="mt-1.5 text-sm font-bold tracking-tight"
        style={{ color: colors.text }}
        numberOfLines={2}
      >
        {deal.title}
      </Text>

      {/* Value & Win Probability */}
      <View className="mt-1 flex-row items-baseline justify-between">
        <View className="flex-row items-baseline gap-x-1.5">
          <Text className="text-base font-bold" style={{ color: colors.primary }}>
            {currencySymbol} {formattedVal}
          </Text>
          {deal.stage?.probability !== undefined ? (
            <Text className="text-[10px] font-semibold" style={{ color: colors.textMuted }}>
              ({deal.stage.probability}% win prob)
            </Text>
          ) : null}
        </View>

        {deal.billingType && (
          <View
            className="rounded-full px-2 py-0.5 border"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <Text className="text-[9px] font-semibold" style={{ color: colors.textSecondary }}>
              {deal.billingType}
            </Text>
          </View>
        )}
      </View>

      {/* Stage Progression & 1-Tap Advance Bar */}
      <View className="mt-2.5">
        <View className="flex-row items-center gap-x-1">
          {Array.from({ length: totalStages }).map((_, idx) => {
            const isFilled = idx < stageOrder;
            return (
              <View
                key={idx}
                className="h-1 flex-1 rounded-full"
                style={{
                  backgroundColor: isFilled ? stageColor : colors.border,
                }}
              />
            );
          })}
        </View>

        {/* 1-Tap Stage Advancement Strip */}
        <View className="mt-2 flex-row items-center justify-between">
          {nextStage ? (
            <Pressable
              onPress={handleAdvanceStage}
              disabled={advancingStage}
              className="flex-row items-center gap-x-1.5 rounded-lg px-2.5 py-1 border active:opacity-75"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.primaryBorder,
              }}
            >
              {advancingStage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="arrow-forward-circle" size={13} color={colors.primary} />
              )}
              <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                Advance: {nextStage.name}
              </Text>
            </Pressable>
          ) : (
            <View
              className="flex-row items-center gap-x-1 rounded-lg px-2 py-0.5 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Ionicons name="trophy" size={11} color={colors.success} />
              <Text className="text-[10px] font-bold" style={{ color: colors.success }}>
                Final Stage (Won / Closed)
              </Text>
            </View>
          )}

          <Text className="text-[9px] font-semibold" style={{ color: colors.textMuted }}>
            Stage {stageOrder} of {totalStages}
          </Text>
        </View>
      </View>

      {/* Contact & Company Association Pill */}
      {(deal.contact || deal.account) && (
        <View
          className="mt-2 flex-row items-center gap-x-2 rounded-xl px-2.5 py-1.5 border"
          style={{
            backgroundColor: colors.cardAlt,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="business-outline" size={13} color={colors.textSoft} />
          <View className="flex-1 flex-row items-center justify-between">
            <Text className="text-xs font-semibold" style={{ color: colors.text }} numberOfLines={1}>
              {deal.account?.name || deal.contact?.name}
            </Text>
            {deal.account?.name && deal.contact?.name && (
              <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }} numberOfLines={1}>
                • {deal.contact.name}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Footer */}
      <View
        className="mt-2.5 flex-row items-center justify-between border-t pt-2"
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row items-center gap-x-1.5 flex-wrap">
          {/* PDF Quotation Generator & Share */}
          <Pressable
            onPress={handleShareQuotation}
            disabled={sharingPdf}
            className="flex-row items-center gap-x-1 rounded-xl px-2.5 py-1 border active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            {sharingPdf ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="document-text-outline" size={12} color={colors.primary} />
            )}
            <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
              PDF Quote
            </Text>
          </Pressable>

          {deal.contact?.phone ? (
            <>
              <Pressable
                onPress={handleWhatsApp}
                className="flex-row items-center gap-x-1 rounded-xl px-2 py-1 border active:opacity-75"
                style={{
                  backgroundColor: colors.whatsappSoft,
                  borderColor: colors.whatsappBorder,
                }}
              >
                <Ionicons name="logo-whatsapp" size={12} color={colors.whatsapp} />
                <Text className="text-[10px] font-bold" style={{ color: colors.whatsapp }}>
                  WA
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCall}
                className="flex-row items-center gap-x-1 rounded-xl px-2 py-1 border active:opacity-75"
                style={{
                  backgroundColor: colors.callSoft,
                  borderColor: colors.callBorder,
                }}
              >
                <Ionicons name="call-outline" size={12} color={colors.call} />
                <Text className="text-[10px] font-bold" style={{ color: colors.call }}>
                  Call
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View className="flex-row items-center gap-x-2">
          {onDeletePrompt && (
            <Pressable
              onPress={() => onDeletePrompt(deal)}
              hitSlop={8}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="trash-outline" size={14} color={colors.textSoft} />
            </Pressable>
          )}
          <View className="flex-row items-center gap-x-1">
            <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
              Dossier
            </Text>
            <Ionicons name="chevron-forward" size={12} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

