import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';

export default function DealCard({ deal, onStageChange }) {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { openQuickWhatsApp } = useCrm();

  if (!deal) return null;

  const priorityStyle = colors.priority[deal.priority] || colors.priority.MEDIUM;
  const stageColor = deal.stage?.color || colors.primary;
  const formattedVal = (parseFloat(deal.value) || 0).toLocaleString('en-IN');
  const currencySymbol = deal.currency === 'USD' ? '$' : deal.currency === 'EUR' ? '€' : '₹';

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
      className="mb-2.5 rounded-[16px] border p-3 shadow-sm active:opacity-80"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      {/* Top Meta: Stage Pill & Priority */}
      <View className="flex-row items-center justify-between gap-x-2">
        <View className="flex-row items-center gap-x-1.5 flex-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: stageColor }}
          />
          <Text
            className="text-[11px] font-bold tracking-tight"
            style={{ color: stageColor }}
            numberOfLines={1}
          >
            {deal.stage?.name || 'In Pipeline'}
          </Text>
        </View>

        <View
          className="flex-row items-center gap-x-1 rounded-full border px-2 py-0.5"
          style={{
            backgroundColor: priorityStyle.bg,
            borderColor: priorityStyle.border,
          }}
        >
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityStyle.dot }} />
          <Text
            className="text-[9px] font-bold tracking-wider"
            style={{ color: priorityStyle.text }}
          >
            {deal.priority || 'MEDIUM'}
          </Text>
        </View>
      </View>

      {/* Deal Title */}
      <Text
        className="mt-1.5 text-sm font-black tracking-tight"
        style={{ color: colors.text }}
        numberOfLines={2}
      >
        {deal.title}
      </Text>

      {/* Value & Win Probability */}
      <View className="mt-1.5 flex-row items-baseline gap-x-1.5">
        <Text className="text-base font-black" style={{ color: colors.primaryLight }}>
          {currencySymbol} {formattedVal}
        </Text>
        {deal.stage?.probability !== undefined ? (
          <Text className="text-[10px] font-semibold" style={{ color: colors.textMuted }}>
            ({deal.stage.probability}% win prob)
          </Text>
        ) : null}
      </View>

      {/* Contact & Company Association */}
      {(deal.contact || deal.account) && (
        <View
          className="mt-2.5 flex-row items-center gap-x-2.5 rounded-xl px-2.5 py-1.5 border"
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
        className="mt-2.5 flex-row items-center justify-between border-t pt-2.5"
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
              No phone attached
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-x-1">
          <Text className="text-[10px] font-bold" style={{ color: colors.primaryLight }}>
            View Dossier
          </Text>
          <Ionicons name="chevron-forward" size={12} color={colors.primaryLight} />
        </View>
      </View>
    </Pressable>
  );
}

