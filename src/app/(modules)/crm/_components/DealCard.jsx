import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';

export default function DealCard({ deal, onStageChange, onDeletePrompt }) {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { openQuickWhatsApp } = useCrm();

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
  const stageOrder = deal.stage?.order || 2;
  const totalStages = 5;

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

      {/* 5-Segment Visual Stage Progression Bar */}
      <View className="mt-2.5 flex-row items-center gap-x-1">
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

      {/* Contact & Company Association Pill */}
      {(deal.contact || deal.account) && (
        <View
          className="mt-2.5 flex-row items-center gap-x-2 rounded-xl px-2.5 py-1.5 border"
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
        <View className="flex-row items-center gap-x-1.5">
          {deal.contact?.phone ? (
            <>
              <Pressable
                onPress={handleWhatsApp}
                className="flex-row items-center gap-x-1 rounded-xl px-2.5 py-1 border active:opacity-75"
                style={{
                  backgroundColor: colors.whatsappSoft,
                  borderColor: colors.whatsappBorder,
                }}
              >
                <Ionicons name="logo-whatsapp" size={12} color={colors.whatsapp} />
                <Text className="text-[10px] font-bold" style={{ color: colors.whatsapp }}>
                  WhatsApp
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCall}
                className="flex-row items-center gap-x-1 rounded-xl px-2.5 py-1 border active:opacity-75"
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
          ) : (
            <Text className="text-[10px] italic" style={{ color: colors.textMuted }}>
              No direct contact
            </Text>
          )}
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
              View Dossier
            </Text>
            <Ionicons name="chevron-forward" size={12} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
