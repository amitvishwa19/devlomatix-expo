import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '../utils/colors';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';
import * as quotationService from '~/services/quotation';

export default function NewQuotationScreen() {
  const router = useRouter();
  const { colors } = useCrmTheme();

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');

  // Quotation Metadata
  const [title, setTitle] = useState('Commercial Proposal & Scope');
  const [currency, setCurrency] = useState('INR');
  const [validUntil, setValidUntil] = useState('30 Days from Issue');
  const [notes, setNotes] = useState('Payment terms: 50% advance, 50% on deployment.');
  const [terms, setTerms] = useState('Scope includes design, development, and 30-day post-launch warranty.');

  // Line Items
  const [items, setItems] = useState([
    {
      id: 'item-1',
      name: 'Software Implementation',
      description: 'Design, configuration and system onboarding',
      quantity: 1,
      unitPrice: 50000,
      discountPercent: 0,
      taxPercent: 18,
    },
  ]);

  // Contact Picker Modal
  const [contacts, setContacts] = useState([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await crmService.getContacts();
        if (res?.data) setContacts(res.data);
      } catch {}
    }
    loadContacts();
  }, []);

  const handleSelectContact = (contact) => {
    setClientName(contact.name || '');
    setClientPhone(contact.phone || '');
    setClientEmail(contact.email || '');
    setClientCompany(contact.account?.name || '');
    setShowContactPicker(false);
  };

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 18,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, [field]: value };
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const discountTotal = items.reduce((sum, it) => {
    const itemSub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
    return sum + itemSub * ((Number(it.discountPercent) || 0) / 100);
  }, 0);
  const taxTotal = items.reduce((sum, it) => {
    const itemSub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
    const discounted = itemSub - itemSub * ((Number(it.discountPercent) || 0) / 100);
    return sum + discounted * ((Number(it.taxPercent) || 0) / 100);
  }, 0);
  const grandTotal = Math.round(subtotal - discountTotal + taxTotal);

  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;

  const handleSave = async (status = 'draft') => {
    if (!clientName.trim()) {
      setErrorMsg('Please enter or select a client name.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const quotationNumber = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        quotationNumber,
        clientName: clientName.trim(),
        total: grandTotal,
        status,
        data: {
          client: {
            name: clientName.trim(),
            phone: clientPhone.trim(),
            email: clientEmail.trim(),
            company: clientCompany.trim(),
          },
          quotation: {
            title: title.trim(),
            currency,
            validUntil,
            issueDate: new Date().toISOString().split('T')[0],
          },
          items,
          summary: {
            subtotal,
            discountTotal,
            taxTotal,
            grandTotal,
          },
          notes,
          terms,
        },
      };

      const res = await quotationService.saveQuotation(payload);
      if (res?.success || res?.data?.quotation) {
        const createdId = res?.data?.quotation?.id || res?.data?.id;
        if (createdId) {
          router.replace(`/(modules)/crm/quotations/${createdId}`);
        } else {
          router.replace('/(modules)/crm/quotations');
        }
      } else {
        setErrorMsg(res?.error || 'Failed to save quotation');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Error saving quotation');
    } finally {
      setSaving(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.account?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <AppScreen>
      <CrmHeader title="Create Quotation" subtitle="Commercial Proposal Builder" showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        >
          {/* Error Alert */}
          {errorMsg && (
            <View
              className="mb-3 rounded-xl p-3 border"
              style={{
                backgroundColor: colors.dangerSoft,
                borderColor: colors.dangerBorder,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.danger }}>
                {errorMsg}
              </Text>
            </View>
          )}

          {/* Section 1: Client Information */}
          <View
            className="mb-3 rounded-[16px] border p-3.5 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between border-b pb-2 mb-3" style={{ borderColor: colors.borderLight }}>
              <View className="flex-row items-center gap-x-2">
                <View
                  className="h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: colors.primarySoft }}
                >
                  <Ionicons name="person" size={13} color={colors.primary} />
                </View>
                <Text className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                  Client Details
                </Text>
              </View>

              <Pressable
                onPress={() => setShowContactPicker(true)}
                className="flex-row items-center gap-x-1 px-2.5 py-1 rounded-lg border active:opacity-75"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="people" size={12} color={colors.primary} />
                <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                  Pick Contact
                </Text>
              </Pressable>
            </View>

            <View className="space-y-2">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                  Client / Company Name *
                </Text>
                <TextInput
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder="e.g. Acme Corporation or John Doe"
                  placeholderTextColor={colors.inputPlaceholder}
                  className="rounded-xl px-3 py-2 border text-xs"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </View>

              <View className="flex-row gap-x-2 mt-2">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                    WhatsApp Phone
                  </Text>
                  <TextInput
                    value={clientPhone}
                    onChangeText={setClientPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="phone-pad"
                    className="rounded-xl px-3 py-2 border text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                    Email
                  </Text>
                  <TextInput
                    value={clientEmail}
                    onChangeText={setClientEmail}
                    placeholder="client@acme.com"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="rounded-xl px-3 py-2 border text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Section 2: Proposal Scope & Currency */}
          <View
            className="mb-3 rounded-[16px] border p-3.5 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-x-2 border-b pb-2 mb-3" style={{ borderColor: colors.borderLight }}>
              <View
                className="h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: colors.infoSoft }}
              >
                <Ionicons name="document-text" size={13} color={colors.info} />
              </View>
              <Text className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                Quotation Scope & Terms
              </Text>
            </View>

            <View className="space-y-2">
              <div>
                <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                  Proposal Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Next.js Web App & Mobile Architecture"
                  placeholderTextColor={colors.inputPlaceholder}
                  className="rounded-xl px-3 py-2 border text-xs"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </div>

              <View className="flex-row gap-x-2 mt-2">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                    Currency
                  </Text>
                  <View className="flex-row gap-x-1">
                    {['INR', 'USD', 'EUR'].map((curr) => (
                      <Pressable
                        key={curr}
                        onPress={() => setCurrency(curr)}
                        className="flex-1 py-1.5 rounded-lg border items-center justify-center"
                        style={{
                          backgroundColor: currency === curr ? colors.primary : colors.cardAlt,
                          borderColor: currency === curr ? colors.primary : colors.border,
                        }}
                      >
                        <Text
                          className="text-[10px] font-black"
                          style={{ color: currency === curr ? '#ffffff' : colors.text }}
                        >
                          {curr}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                    Validity
                  </Text>
                  <TextInput
                    value={validUntil}
                    onChangeText={setValidUntil}
                    placeholder="30 Days"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-xl px-3 py-2 border text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Section 3: Line Items Table */}
          <View
            className="mb-3 rounded-[16px] border p-3.5 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between border-b pb-2 mb-3" style={{ borderColor: colors.borderLight }}>
              <View className="flex-row items-center gap-x-2">
                <View
                  className="h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: colors.successSoft }}
                >
                  <Ionicons name="list" size={13} color={colors.success} />
                </View>
                <Text className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                  Deliverables & Pricing ({items.length})
                </Text>
              </View>

              <Pressable
                onPress={handleAddItem}
                className="flex-row items-center gap-x-1 px-2.5 py-1 rounded-lg border active:opacity-75"
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                }}
              >
                <Ionicons name="add" size={12} color="#ffffff" />
                <Text className="text-[10px] font-bold text-white">Add Item</Text>
              </Pressable>
            </View>

            {/* Items List */}
            {items.map((item, index) => {
              const itemSub = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              const itemDiscount = itemSub * ((Number(item.discountPercent) || 0) / 100);
              const itemTax = (itemSub - itemDiscount) * ((Number(item.taxPercent) || 0) / 100);
              const itemTotal = Math.round(itemSub - itemDiscount + itemTax);

              return (
                <View
                  key={item.id}
                  className="mb-2.5 rounded-xl border p-2.5"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>
                      Item #{index + 1}
                    </Text>
                    {items.length > 1 && (
                      <Pressable
                        onPress={() => handleRemoveItem(item.id)}
                        className="h-5 w-5 items-center justify-center rounded-md border"
                        style={{
                          backgroundColor: colors.dangerSoft,
                          borderColor: colors.dangerBorder,
                        }}
                      >
                        <Ionicons name="trash" size={11} color={colors.danger} />
                      </Pressable>
                    )}
                  </View>

                  <TextInput
                    value={item.name}
                    onChangeText={(val) => handleUpdateItem(item.id, 'name', val)}
                    placeholder="Item / Service Name *"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-lg px-2.5 py-1.5 border text-xs mb-1.5"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />

                  <TextInput
                    value={item.description}
                    onChangeText={(val) => handleUpdateItem(item.id, 'description', val)}
                    placeholder="Description / Specifications (optional)"
                    placeholderTextColor={colors.inputPlaceholder}
                    className="rounded-lg px-2.5 py-1.5 border text-[11px] mb-2"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    }}
                  />

                  <View className="flex-row items-center gap-x-2">
                    <View className="flex-1">
                      <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Qty</Text>
                      <TextInput
                        value={String(item.quantity)}
                        onChangeText={(val) => handleUpdateItem(item.id, 'quantity', val)}
                        keyboardType="numeric"
                        className="rounded-lg px-2 py-1 border text-xs text-center"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        }}
                      />
                    </View>

                    <View className="flex-2">
                      <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Unit Price ({currencySymbol})</Text>
                      <TextInput
                        value={String(item.unitPrice)}
                        onChangeText={(val) => handleUpdateItem(item.id, 'unitPrice', val)}
                        keyboardType="numeric"
                        className="rounded-lg px-2 py-1 border text-xs text-center font-bold"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        }}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Tax %</Text>
                      <TextInput
                        value={String(item.taxPercent)}
                        onChangeText={(val) => handleUpdateItem(item.id, 'taxPercent', val)}
                        keyboardType="numeric"
                        className="rounded-lg px-2 py-1 border text-xs text-center"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        }}
                      />
                    </View>

                    <View className="flex-2 items-end justify-end">
                      <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Line Total</Text>
                      <Text className="text-xs font-black text-cyan-500 py-1">
                        {currencySymbol} {itemTotal.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Calculations Summary Card */}
            <View className="mt-2 rounded-xl p-3 border" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
              <View className="flex-row justify-between py-0.5">
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>Subtotal:</Text>
                <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                  {currencySymbol} {subtotal.toLocaleString('en-IN')}
                </Text>
              </View>
              {discountTotal > 0 && (
                <View className="flex-row justify-between py-0.5">
                  <Text className="text-[11px] font-medium" style={{ color: colors.danger }}>Discount:</Text>
                  <Text className="text-[11px] font-bold" style={{ color: colors.danger }}>
                    - {currencySymbol} {discountTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between py-0.5">
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>Estimated GST / Tax:</Text>
                <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                  + {currencySymbol} {taxTotal.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="flex-row justify-between border-t pt-1.5 mt-1" style={{ borderColor: colors.border }}>
                <Text className="text-xs font-black" style={{ color: colors.text }}>Grand Total:</Text>
                <Text className="text-sm font-black" style={{ color: colors.primaryLight }}>
                  {currencySymbol} {grandTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 4: Notes & Terms */}
          <View
            className="mb-4 rounded-[16px] border p-3.5 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Text className="text-xs font-black tracking-tight mb-2" style={{ color: colors.text }}>
              Payment Terms & Commercial Notes
            </Text>

            <View className="space-y-2">
              <div>
                <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Payment Terms</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  className="rounded-lg px-2.5 py-1.5 border text-[11px]"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </div>
              <div className="mt-2">
                <Text className="text-[9px] font-bold text-slate-400 mb-0.5">Commercial Terms & Warranty</Text>
                <TextInput
                  value={terms}
                  onChangeText={setTerms}
                  className="rounded-lg px-2.5 py-1.5 border text-[11px]"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  }}
                />
              </div>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-x-2.5 mb-6">
            <Pressable
              onPress={() => handleSave('draft')}
              disabled={saving}
              className="flex-1 items-center justify-center py-3 rounded-xl border active:opacity-75"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  Save Draft
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => handleSave('sent')}
              disabled={saving}
              className="flex-2 flex-row items-center justify-center gap-x-2 py-3 rounded-xl active:opacity-85 shadow-md"
              style={{
                backgroundColor: colors.primary,
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
              <Text className="text-xs font-black text-white">Save & View Proposal</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Contact Picker Modal */}
      <Modal
        visible={showContactPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactPicker(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
          <Pressable className="flex-1" onPress={() => setShowContactPicker(false)} />

          <View
            className="rounded-t-3xl p-4 shadow-2xl border-t max-h-[80%]"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between border-b pb-3 mb-2" style={{ borderColor: colors.border }}>
              <Text className="text-sm font-black" style={{ color: colors.text }}>
                Select Contact to Auto-Fill
              </Text>
              <Pressable onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <View
              className="flex-row items-center gap-x-2 rounded-xl px-3 py-1.5 border mb-3"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
            >
              <Ionicons name="search" size={14} color={colors.textMuted} />
              <TextInput
                value={contactSearch}
                onChangeText={setContactSearch}
                placeholder="Search contacts by name, company..."
                placeholderTextColor={colors.inputPlaceholder}
                className="flex-1 text-xs"
                style={{ color: colors.text }}
              />
            </View>

            <ScrollView className="max-h-72">
              {filteredContacts.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => handleSelectContact(c)}
                  className="flex-row items-center justify-between p-2.5 rounded-xl border mb-1.5 active:opacity-75"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.border,
                  }}
                >
                  <View>
                    <Text className="text-xs font-bold" style={{ color: colors.text }}>
                      {c.name}
                    </Text>
                    <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                      {c.account?.name || c.phone || c.email || 'No company'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
