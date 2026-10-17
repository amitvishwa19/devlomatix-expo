import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useCrmTheme } from '../utils/colors';

export default function QuotationCard({ quotation, onSendWhatsApp, onStatusChange }) {
  const router = useRouter();
  const { colors } = useCrmTheme();

  if (!quotation) return null;

  const status = (quotation.status || 'draft').toLowerCase();
  const qData = quotation.data || {};
  const items = Array.isArray(qData.items) ? qData.items : [];
  const currency = qData.quotation?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  const formattedVal = (parseFloat(quotation.total) || 0).toLocaleString('en-IN');
  const clientName = quotation.clientName || qData.client?.name || qData.client?.contactPerson || 'Unknown Client';
  const createdDate = quotation.createdAt
    ? new Date(quotation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const getStatusBadge = () => {
    switch (status) {
      case 'accepted':
        return {
          bg: colors.successSoft,
          border: colors.successBorder,
          text: colors.success,
          label: 'Accepted',
          icon: 'checkmark-circle',
        };
      case 'sent':
        return {
          bg: colors.infoSoft,
          border: colors.infoBorder,
          text: colors.info,
          label: 'Sent',
          icon: 'send',
        };
      case 'declined':
        return {
          bg: colors.dangerSoft,
          border: colors.dangerBorder,
          text: colors.danger,
          label: 'Declined',
          icon: 'close-circle',
        };
      case 'expired':
        return {
          bg: colors.warningSoft,
          border: colors.warningBorder,
          text: colors.warning,
          label: 'Expired',
          icon: 'time',
        };
      default:
        return {
          bg: colors.cardAlt,
          border: colors.border,
          text: colors.textMuted,
          label: 'Draft',
          icon: 'document-text',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <Pressable
      onPress={() => router.push(`/(modules)/crm/quotations/${quotation.id}`)}
      className="mb-2.5 rounded-[16px] border p-3 shadow-sm active:opacity-80"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
      {/* Top Meta: Quotation Number & Status Badge */}
      <View className="flex-row items-center justify-between gap-x-2">
        <View className="flex-row items-center gap-x-1.5 flex-1">
          <View
            className="rounded-lg px-2 py-0.5 border"
            style={{
              backgroundColor: colors.primarySoft,
              borderColor: colors.primaryBorder,
            }}
          >
            <Text className="text-[10px] font-mono font-bold" style={{ color: colors.primaryDark }}>
              {quotation.quotationNumber || 'QT-DRAFT'}
            </Text>
          </View>
          {createdDate ? (
            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
              • {createdDate}
            </Text>
          ) : null}
        </View>

        <View
          className="flex-row items-center gap-x-1 rounded-full border px-2 py-0.5"
          style={{
            backgroundColor: badge.bg,
            borderColor: badge.border,
          }}
        >
          <Ionicons name={badge.icon} size={11} color={badge.text} />
          <Text className="text-[9px] font-bold tracking-wider uppercase" style={{ color: badge.text }}>
            {badge.label}
          </Text>
        </View>
      </View>

      {/* Client Name */}
      <Text
        className="mt-1.5 text-sm font-black tracking-tight"
        style={{ color: colors.text }}
        numberOfLines={1}
      >
        {clientName}
      </Text>

      {/* Proposal Title / Scope */}
      {qData.quotation?.title ? (
        <Text
          className="text-[11px] font-medium mt-0.5"
          style={{ color: colors.textMuted }}
          numberOfLines={1}
        >
          {qData.quotation.title}
        </Text>
      ) : null}

      {/* Commercial Value & Items */}
      <View className="mt-2 flex-row items-baseline justify-between border-t pt-2" style={{ borderColor: colors.borderLight }}>
        <View className="flex-row items-baseline gap-x-1.5">
          <Text className="text-base font-black" style={{ color: colors.primaryLight }}>
            {currencySymbol} {formattedVal}
          </Text>
          <Text className="text-[10px] font-semibold" style={{ color: colors.textMuted }}>
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center gap-x-1.5">
          {onSendWhatsApp && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onSendWhatsApp(quotation);
              }}
              className="flex-row items-center gap-x-1 rounded-lg px-2.5 py-1 active:opacity-75"
              style={{ backgroundColor: colors.whatsapp }}
            >
              <Ionicons name="logo-whatsapp" size={12} color="#ffffff" />
              <Text className="text-[10px] font-bold text-white">Send</Text>
            </Pressable>
          )}

          <View
            className="h-6 w-6 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
