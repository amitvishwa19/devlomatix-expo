import React, { useState, useEffect, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../../utils/colors';
import CrmHeader from '../../_components/CrmHeader';
import SendQuotationModal from '../../_components/SendQuotationModal';
import * as quotationService from '~/services/quotation';

export default function QuotationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useCrmTheme();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadQuotation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await quotationService.getQuotation(id);
      if (res?.data?.quotation) {
        setQuotation(res.data.quotation);
      } else if (res?.data) {
        setQuotation(res.data);
      } else if (res?.quotation) {
        setQuotation(res.quotation);
      }
    } catch (err) {
      console.warn('Error loading quotation:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotation();
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await quotationService.updateQuotationStatus(id, newStatus);
      setQuotation((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleShareSystem = async () => {
    if (!quotation) return;
    const shareText = quotationService.formatQuotationWhatsAppText(quotation);
    try {
      await Share.share({
        message: shareText,
        title: `Quotation ${quotation.quotationNumber}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Quotation',
      'Are you sure you want to permanently delete this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await quotationService.deleteQuotation(id);
              router.replace('/(modules)/crm/quotations');
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete quotation');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <AppScreen>
        <CrmHeader title="Quotation Proposal" showBack={true} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-xs font-semibold" style={{ color: colors.textMuted }}>
            Loading Quotation...
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (!quotation) {
    return (
      <AppScreen>
        <CrmHeader title="Quotation Proposal" showBack={true} />
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
            Quotation Not Found
          </Text>
          <Pressable
            onPress={() => router.replace('/(modules)/crm/quotations')}
            className="mt-4 px-4 py-2 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-xs font-bold text-white">Back to Quotations</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const qData = quotation.data || {};
  const client = qData.client || {};
  const items = Array.isArray(qData.items) ? qData.items : [];
  const summary = qData.summary || {};
  const currency = qData.quotation?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  const status = (quotation.status || 'draft').toLowerCase();

  const getStatusBadge = () => {
    switch (status) {
      case 'accepted':
        return { bg: colors.successSoft, border: colors.successBorder, text: colors.success, label: 'Accepted' };
      case 'sent':
        return { bg: colors.infoSoft, border: colors.infoBorder, text: colors.info, label: 'Sent' };
      case 'declined':
        return { bg: colors.dangerSoft, border: colors.dangerBorder, text: colors.danger, label: 'Declined' };
      case 'expired':
        return { bg: colors.warningSoft, border: colors.warningBorder, text: colors.warning, label: 'Expired' };
      default:
        return { bg: colors.cardAlt, border: colors.border, text: colors.textMuted, label: 'Draft' };
    }
  };

  const badge = getStatusBadge();

  return (
    <AppScreen>
      <CrmHeader
        title={quotation.quotationNumber || 'Quotation'}
        subtitle={quotation.clientName || 'Client Proposal'}
        showBack={true}
        rightActions={
          <Pressable
            onPress={handleDelete}
            className="h-8 w-8 items-center justify-center rounded-xl border active:opacity-75"
            style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
          >
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
          </Pressable>
        }
      />

      <SendQuotationModal
        quotation={quotation}
        visible={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={loadQuotation}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Document Header Card */}
        <View
          className="rounded-[16px] border p-4 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between border-b pb-3 mb-3" style={{ borderColor: colors.borderLight }}>
            <View>
              <Text className="text-[10px] font-mono font-black uppercase tracking-wider" style={{ color: colors.primary }}>
                Official Proposal
              </Text>
              <Text className="text-base font-black tracking-tight" style={{ color: colors.text }}>
                {quotation.quotationNumber}
              </Text>
            </View>

            <View
              className="flex-row items-center gap-x-1 rounded-full border px-2.5 py-1"
              style={{ backgroundColor: badge.bg, borderColor: badge.border }}
            >
              <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: badge.text }}>
                {badge.label}
              </Text>
            </View>
          </View>

          {/* Proposal Title */}
          {qData.quotation?.title && (
            <Text className="text-sm font-bold mb-2" style={{ color: colors.text }}>
              {qData.quotation.title}
            </Text>
          )}

          {/* Client Info Grid */}
          <View className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
            <Text className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Prepared For:</Text>
            <Text className="text-xs font-black" style={{ color: colors.text }}>
              {quotation.clientName || client.name || 'Client'}
            </Text>
            {client.phone ? (
              <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
                Phone: {client.phone}
              </Text>
            ) : null}
            {client.email ? (
              <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                Email: {client.email}
              </Text>
            ) : null}
          </View>

          {/* Dates Strip */}
          <View className="flex-row items-center justify-between mt-3 text-[10px]">
            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
              Issued: {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
              Valid: {qData.quotation?.validUntil || '30 Days'}
            </Text>
          </View>
        </View>

        {/* Deliverables & Line Items */}
        <View
          className="rounded-[16px] border p-4 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text className="text-xs font-black tracking-tight mb-2.5" style={{ color: colors.text }}>
            Deliverables & Line Items ({items.length})
          </Text>

          {items.map((item, idx) => {
            const itemSub = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            const itemDiscount = itemSub * ((Number(item.discountPercent) || 0) / 100);
            const itemTax = (itemSub - itemDiscount) * ((Number(item.taxPercent) || 0) / 100);
            const itemTotal = Math.round(itemSub - itemDiscount + itemTax);

            return (
              <View
                key={item.id || idx}
                className="mb-2 rounded-xl p-2.5 border"
                style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold" style={{ color: colors.text }}>
                      {item.name || 'Service Item'}
                    </Text>
                    {item.description ? (
                      <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-xs font-black" style={{ color: colors.primaryLight }}>
                    {currencySymbol} {itemTotal.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between border-t pt-1.5 mt-2" style={{ borderColor: colors.border }}>
                  <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                    {item.quantity || 1} x {currencySymbol}{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                  </Text>
                  {Number(item.taxPercent) > 0 && (
                    <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                      GST {item.taxPercent}%
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Pricing Summary */}
          <View className="rounded-xl p-3 border mt-1" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
            <View className="flex-row justify-between py-0.5">
              <Text className="text-[11px]" style={{ color: colors.textMuted }}>Subtotal:</Text>
              <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                {currencySymbol} {(summary.subtotal || quotation.total || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            {Number(summary.discountTotal) > 0 && (
              <View className="flex-row justify-between py-0.5">
                <Text className="text-[11px]" style={{ color: colors.danger }}>Discount:</Text>
                <Text className="text-[11px] font-bold" style={{ color: colors.danger }}>
                  - {currencySymbol} {Number(summary.discountTotal).toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            {Number(summary.taxTotal) > 0 && (
              <View className="flex-row justify-between py-0.5">
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>Tax Total:</Text>
                <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                  + {currencySymbol} {Number(summary.taxTotal).toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between border-t pt-2 mt-1.5" style={{ borderColor: colors.border }}>
              <Text className="text-xs font-black" style={{ color: colors.text }}>Grand Total:</Text>
              <Text className="text-base font-black" style={{ color: colors.primaryLight }}>
                {currencySymbol} {(summary.grandTotal || quotation.total || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Commercial Terms & Notes */}
        {(qData.notes || qData.terms) && (
          <View
            className="rounded-[16px] border p-4 shadow-sm mb-3"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text className="text-xs font-black tracking-tight mb-2" style={{ color: colors.text }}>
              Commercial Terms
            </Text>
            {qData.notes ? (
              <View className="mb-2">
                <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Payment Terms:</Text>
                <Text className="text-[11px] leading-relaxed" style={{ color: colors.text }}>
                  {qData.notes}
                </Text>
              </View>
            ) : null}
            {qData.terms ? (
              <div>
                <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Terms & Conditions:</Text>
                <Text className="text-[11px] leading-relaxed" style={{ color: colors.text }}>
                  {qData.terms}
                </Text>
              </div>
            ) : null}
          </View>
        )}

        {/* Status Lifecycle Controls */}
        <View
          className="rounded-[16px] border p-3.5 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text className="text-xs font-black tracking-tight mb-2" style={{ color: colors.text }}>
            Update Client Status
          </Text>
          <View className="flex-row gap-x-1.5">
            {[
              { id: 'draft', label: 'Draft', color: colors.cardAlt },
              { id: 'sent', label: 'Sent', color: colors.infoSoft },
              { id: 'accepted', label: 'Accepted', color: colors.successSoft },
              { id: 'declined', label: 'Declined', color: colors.dangerSoft },
            ].map((st) => (
              <Pressable
                key={st.id}
                onPress={() => handleUpdateStatus(st.id)}
                disabled={updatingStatus}
                className="flex-1 py-1.5 rounded-lg border items-center justify-center active:opacity-75"
                style={{
                  backgroundColor: status === st.id ? colors.primary : st.color,
                  borderColor: status === st.id ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-[10px] font-bold capitalize"
                  style={{ color: status === st.id ? '#ffffff' : colors.text }}
                >
                  {st.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Primary Actions Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 p-3 border-t flex-row items-center gap-x-2 shadow-2xl"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleShareSystem}
          className="h-11 w-11 items-center justify-center rounded-xl border active:opacity-75"
          style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
        >
          <Ionicons name="share-social" size={18} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => setShowSendModal(true)}
          className="flex-1 h-11 flex-row items-center justify-center gap-x-2 rounded-xl active:opacity-85 shadow-md"
          style={{ backgroundColor: colors.whatsapp }}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
          <Text className="text-xs font-black text-white">Send on WhatsApp</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}
