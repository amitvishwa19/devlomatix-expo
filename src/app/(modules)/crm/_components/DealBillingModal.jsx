import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import * as crmService from '~/services/crm';

export default function DealBillingModal({ visible, onClose, deal }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();
  const { openQuickWhatsApp, refreshAll } = useCrm();
  const [mode, setMode] = useState('INVOICE'); // 'INVOICE' | 'QUOTATION'
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (deal) {
      setItemDescription(deal.title || 'Professional Deliverables');
      setAmount(deal.value ? deal.value.toString() : '0');
      setNotes('Payment due within 15 days of invoice date.');
      setResult(null);
      setError(null);
    }
  }, [deal, visible]);

  if (!visible || !deal) return null;

  const baseVal = parseFloat(amount) || 0;
  const taxAmount = (baseVal * taxRate) / 100;
  const grandTotal = baseVal + taxAmount;

  const handleGenerate = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const items = [
        {
          description: itemDescription || deal.title,
          quantity: 1,
          rate: baseVal,
          amount: baseVal,
        },
      ];

      let res;
      if (mode === 'INVOICE') {
        res = await crmService.createDealInvoice(deal.id, {
          items,
          taxRate,
          discount: 0,
        });
      } else {
        res = await crmService.generateDealQuotation(deal.id, {
          items,
          notes,
        });
      }

      if (res.success) {
        setResult(res.data);
        refreshAll();
      } else {
        setError(res.error || 'Failed to process commercial billing');
      }
    } catch (e) {
      setError(e.message || 'Error executing billing request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (deal.contact) {
      const docLabel = mode === 'INVOICE' ? 'PayFlow Invoice' : 'Commercial Quotation';
      const docId = result?.invoiceId || result?.quotationId || 'DOC-READY';
      const text = `Hi ${deal.contact.name || 'there'}, here is your ${docLabel} (${docId}) for "${deal.title}". Grand Total: ${deal.currency} ${grandTotal.toLocaleString('en-IN')}. Please let us know once reviewed!`;
      onClose();
      openQuickWhatsApp(deal.contact, deal, text);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="max-h-[85%] rounded-t-3xl p-4 shadow-2xl border-t"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 20, 40),
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.copilot }}
              >
                <Ionicons name="card" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-black" style={{ color: colors.text }}>
                  PayFlow Billing Engine
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  1-Click Commercial Invoicing & Quotations
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </Pressable>
          </View>

          {/* Mode Switcher */}
          <View
            className="mt-2.5 flex-row rounded-xl border p-1"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => { setMode('INVOICE'); setResult(null); }}
              className="flex-1 items-center justify-center rounded-lg py-1.5"
              style={{
                backgroundColor: mode === 'INVOICE' ? colors.copilot : 'transparent',
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: mode === 'INVOICE' ? '#ffffff' : colors.textMuted }}
              >
                💳 PayFlow Invoice
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode('QUOTATION'); setResult(null); }}
              className="flex-1 items-center justify-center rounded-lg py-1.5"
              style={{
                backgroundColor: mode === 'QUOTATION' ? colors.copilot : 'transparent',
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: mode === 'QUOTATION' ? '#ffffff' : colors.textMuted }}
              >
                📄 Commercial Quotation
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-2.5">
            {/* Target Deal */}
            <View
              className="rounded-xl p-2.5 border mb-2.5"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Opportunity
              </Text>
              <Text className="text-xs font-black mt-0.5" style={{ color: colors.text }}>
                {deal.title}
              </Text>
              <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
                Client: {deal.contact?.name || 'Individual'} {deal.account ? `(${deal.account.name})` : ''}
              </Text>
            </View>

            {/* Line Item Description */}
            <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              Item Description
            </Text>
            <TextInput
              value={itemDescription}
              onChangeText={setItemDescription}
              placeholder="e.g. Implementation and enterprise software licensing"
              placeholderTextColor={colors.inputPlaceholder}
              className="rounded-xl border px-3 py-2 text-xs mb-2.5"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              }}
            />

            {/* Rate & Tax */}
            <View className="flex-row items-center gap-x-2 mb-2.5">
              <View className="flex-1">
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  Subtotal Amount ({deal.currency})
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.inputPlaceholder}
                  className="rounded-xl border px-3 py-2 text-xs font-bold"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </View>

              <View className="w-28">
                <Text className="text-xs font-bold mb-1" style={{ color: colors.text }}>
                  GST Tax
                </Text>
                <View
                  className="flex-row rounded-xl border p-1"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  {[0, 18].map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setTaxRate(t)}
                      className="flex-1 items-center justify-center rounded-lg py-1"
                      style={{
                        backgroundColor: taxRate === t ? colors.copilot : 'transparent',
                      }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: taxRate === t ? '#ffffff' : colors.textMuted }}
                      >
                        {t}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Totals Summary Card */}
            <View
              className="rounded-xl border p-3 mb-2.5"
              style={{
                backgroundColor: colors.copilotSoft,
                borderColor: colors.copilotBorder,
              }}
            >
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs" style={{ color: colors.textMuted }}>Subtotal:</Text>
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {deal.currency} {baseVal.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-xs" style={{ color: colors.textMuted }}>Tax ({taxRate}%):</Text>
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {deal.currency} {taxAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View
                className="flex-row justify-between border-t pt-1.5"
                style={{ borderColor: colors.copilotBorder }}
              >
                <Text className="text-xs font-black" style={{ color: colors.copilot }}>Grand Total:</Text>
                <Text className="text-sm font-black" style={{ color: colors.copilot }}>
                  {deal.currency} {grandTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Success result banner */}
            {result && (
              <View
                className="mb-2.5 rounded-xl p-3 border"
                style={{
                  backgroundColor: colors.successSoft,
                  borderColor: colors.successBorder,
                }}
              >
                <View className="flex-row items-center gap-x-2">
                  <Ionicons name="checkmark-circle" size={17} color={colors.success} />
                  <Text className="text-xs font-bold" style={{ color: colors.success }}>
                    {mode === 'INVOICE' ? 'Invoice Issued Successfully!' : 'Quotation Generated!'}
                  </Text>
                </View>
                <Text className="text-[11px] mt-1 font-mono" style={{ color: colors.success }}>
                  Document ID: {result.invoiceId || result.quotationId || 'SUCCESS'}
                </Text>

                {deal.contact?.phone && (
                  <Pressable
                    onPress={handleShareWhatsApp}
                    className="mt-2 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 active:opacity-80"
                    style={{ backgroundColor: colors.whatsapp }}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#ffffff" />
                    <Text className="text-xs font-black text-white">Share via WhatsApp</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Error banner */}
            {error && (
              <View
                className="mb-2.5 rounded-xl p-2 border"
                style={{
                  backgroundColor: colors.dangerSoft,
                  borderColor: colors.dangerBorder,
                }}
              >
                <Text className="text-xs font-bold text-center" style={{ color: colors.danger }}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Button */}
          {!result && (
            <Pressable
              onPress={handleGenerate}
              disabled={submitting || baseVal <= 0}
              className="mt-3 flex-row items-center justify-center gap-x-2 rounded-xl py-3 shadow-md active:opacity-80"
              style={{
                backgroundColor: colors.copilot,
                opacity: submitting || baseVal <= 0 ? 0.5 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash" size={15} color="#ffffff" />
                  <Text className="text-xs font-black text-white">
                    {mode === 'INVOICE' ? 'Issue PayFlow Invoice' : 'Generate Quotation'}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
