import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';

export default function DealBillingModal({ visible, onClose, deal }) {
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
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="max-h-[85%] rounded-t-3xl bg-white p-5 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
            <View className="flex-row items-center gap-x-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-100 border border-purple-200">
                <Ionicons name="card" size={18} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-base font-black text-slate-900">PayFlow Billing Engine</Text>
                <Text className="text-xs text-slate-500 font-medium">1-Click Commercial Invoicing & Quotations</Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
            >
              <Ionicons name="close" size={18} color="#475569" />
            </Pressable>
          </View>

          {/* Mode Switcher */}
          <View className="mt-3 flex-row rounded-xl border border-slate-200 bg-slate-100 p-1">
            <Pressable
              onPress={() => { setMode('INVOICE'); setResult(null); }}
              className={`flex-1 items-center justify-center rounded-lg py-2 ${
                mode === 'INVOICE' ? 'bg-white shadow-sm' : 'bg-transparent'
              }`}
            >
              <Text className={`text-xs font-bold ${mode === 'INVOICE' ? 'text-purple-700' : 'text-slate-600'}`}>
                💳 PayFlow Invoice
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode('QUOTATION'); setResult(null); }}
              className={`flex-1 items-center justify-center rounded-lg py-2 ${
                mode === 'QUOTATION' ? 'bg-white shadow-sm' : 'bg-transparent'
              }`}
            >
              <Text className={`text-xs font-bold ${mode === 'QUOTATION' ? 'text-purple-700' : 'text-slate-600'}`}>
                📄 Commercial Quotation
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* Target Deal */}
            <View className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 mb-3">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Opportunity</Text>
              <Text className="text-sm font-black text-slate-900 mt-0.5">{deal.title}</Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5">
                Client: {deal.contact?.name || 'Individual'} {deal.account ? `(${deal.account.name})` : ''}
              </Text>
            </View>

            {/* Line Item Description */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Item Description</Text>
            <TextInput
              value={itemDescription}
              onChangeText={setItemDescription}
              placeholder="e.g. Implementation and enterprise software licensing"
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 mb-3"
            />

            {/* Rate & Tax */}
            <View className="flex-row items-center gap-x-2 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1">Subtotal Amount ({deal.currency})</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900"
                />
              </View>

              <View className="w-28">
                <Text className="text-xs font-bold text-slate-700 mb-1">GST Tax</Text>
                <View className="flex-row rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {[0, 18].map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setTaxRate(t)}
                      className={`flex-1 items-center justify-center rounded-lg py-1.5 ${
                        taxRate === t ? 'bg-purple-600' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          taxRate === t ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {t}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Totals Summary Card */}
            <View className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-slate-600">Subtotal:</Text>
                <Text className="text-xs font-semibold text-slate-800">
                  {deal.currency} {baseVal.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-xs text-slate-600">Tax ({taxRate}%):</Text>
                <Text className="text-xs font-semibold text-slate-800">
                  {deal.currency} {taxAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-purple-200/80 pt-2">
                <Text className="text-sm font-black text-purple-950">Grand Total:</Text>
                <Text className="text-sm font-black text-purple-700">
                  {deal.currency} {grandTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Success result banner */}
            {result && (
              <View className="mb-3 rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200">
                <View className="flex-row items-center gap-x-2">
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text className="text-xs font-bold text-emerald-800">
                    {mode === 'INVOICE' ? 'Invoice Issued Successfully!' : 'Quotation Generated!'}
                  </Text>
                </View>
                <Text className="text-[11px] text-emerald-700 mt-1 font-mono">
                  Document ID: {result.invoiceId || result.quotationId || 'SUCCESS'}
                </Text>

                {deal.contact?.phone && (
                  <Pressable
                    onPress={handleShareWhatsApp}
                    className="mt-2.5 flex-row items-center justify-center gap-x-1.5 rounded-xl bg-emerald-600 py-2.5"
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#ffffff" />
                    <Text className="text-xs font-black text-white">Share via WhatsApp</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Error banner */}
            {error && (
              <View className="mb-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200">
                <Text className="text-xs font-bold text-rose-700 text-center">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Button */}
          {!result && (
            <Pressable
              onPress={handleGenerate}
              disabled={submitting || baseVal <= 0}
              className={`mt-3 flex-row items-center justify-center gap-x-2 rounded-2xl bg-purple-600 py-3.5 shadow-md shadow-purple-500/20 active:bg-purple-700 ${
                submitting || baseVal <= 0 ? 'opacity-50' : ''
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#ffffff" />
                  <Text className="text-sm font-black text-white">
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
