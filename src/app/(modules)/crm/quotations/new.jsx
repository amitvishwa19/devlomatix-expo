import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '~/components/AppScreen';
import * as crmService from '~/services/crm';
import * as quotationService from '~/services/quotation';
import CrmHeader from '../_components/CrmHeader';
import { useCrmTheme } from '../utils/colors';

const TAX_PRESETS = [0, 5, 12, 18, 28];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const VALIDITY_OPTIONS = ['15 Days', '30 Days', '45 Days', '60 Days'];

export default function NewQuotationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();

  // Active Wizard Tab ('client' | 'items' | 'review')
  const [activeStep, setActiveStep] = useState('client');

  // Client Details
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);

  // Quotation Metadata
  const [title, setTitle] = useState('Commercial Proposal & Scope');
  const [currency, setCurrency] = useState('INR');
  const [validUntil, setValidUntil] = useState('30 Days');
  const [notes, setNotes] = useState(
    'Payment terms: 50% advance on order confirmation, 50% upon delivery / milestone completion.'
  );
  const [terms, setTerms] = useState(
    '1. Scope includes software architecture, UI/UX, and cloud deployment.\n2. Warranty: 30 days post-launch support.\n3. Taxes charged as applicable.'
  );

  // Line Items
  const [items, setItems] = useState([
    {
      id: 'item-1',
      name: 'Software Implementation',
      description: 'System design, core architecture, and onboarding',
      quantity: 1,
      unitPrice: 50000,
      discountPercent: 0,
      taxPercent: 18,
    },
  ]);

  // Which item is actively expanded in the accordion
  const [expandedItemId, setExpandedItemId] = useState('item-1');

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
      } catch { }
    }
    loadContacts();
  }, []);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setClientName(contact.account?.name || contact.company || contact.name || '');
    setContactPerson(contact.name || '');
    setClientPhone(contact.phone || '');
    setClientEmail(contact.email || '');
    setClientCompany(contact.account?.name || contact.company || '');
    setShowContactPicker(false);
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setClientName('');
    setContactPerson('');
    setClientPhone('');
    setClientEmail('');
    setClientCompany('');
  };

  const handleAddItem = () => {
    const newId = `item-${Date.now()}`;
    const newItem = {
      id: newId,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 18,
    };
    setItems((prev) => [...prev, newItem]);
    setExpandedItemId(newId);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (expandedItemId === id) {
      const remaining = items.filter((it) => it.id !== id);
      setExpandedItemId(remaining[0]?.id || null);
    }
  };

  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, [field]: value };
      })
    );
  };

  const handleStepQuantity = (id, delta) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const currentQty = Number(it.quantity) || 1;
        const nextQty = Math.max(1, currentQty + delta);
        return { ...it, quantity: nextQty };
      })
    );
  };

  const toggleExpand = (id) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  // Calculations
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
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

  const currencySymbol =
    currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;

  const handleSave = async (status = 'draft') => {
    if (!clientName.trim()) {
      setErrorMsg('Please enter or select a client name.');
      setActiveStep('client');
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
            contactPerson: contactPerson.trim(),
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

      {/* Segmented Top Wizard Steps Bar - Perfectly distributed, clean, zero wrapping */}
      <View
        className="flex-row border-b"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        {[
          { key: 'client', step: '1', title: 'Client' },
          { key: 'items', step: '2', title: `Items (${items.length})` },
          { key: 'review', step: '3', title: 'Terms & Total' },
        ].map((tab) => {
          const isSelected = activeStep === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveStep(tab.key)}
              className="flex-1 py-2.5 items-center justify-center border-b-2 active:opacity-75"
              style={{
                borderBottomColor: isSelected ? colors.primary : 'transparent',
                backgroundColor: isSelected ? colors.primarySoft : 'transparent',
              }}
            >
              <View className="flex-row items-center gap-x-1.5">
                <View
                  className="h-4 w-4 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                  }}
                >
                  <Text
                    className="text-[9px] font-black"
                    style={{ color: isSelected ? '#ffffff' : colors.textMuted }}
                  >
                    {tab.step}
                  </Text>
                </View>
                <Text
                  className="text-xs font-bold"
                  style={{ color: isSelected ? colors.primary : colors.textMuted }}
                >
                  {tab.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 12,
            paddingBottom: Math.max(90, insets.bottom + 80),
          }}
        >
          {/* Error Alert */}
          {errorMsg && (
            <View
              className="mb-3 rounded-xl p-3 border flex-row items-center gap-x-2"
              style={{
                backgroundColor: colors.dangerSoft,
                borderColor: colors.dangerBorder,
              }}
            >
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text className="text-xs font-bold flex-1" style={{ color: colors.danger }}>
                {errorMsg}
              </Text>
            </View>
          )}

          {/* ================= STEP 1: CLIENT & SCOPE ================= */}
          {activeStep === 'client' && (
            <View className="flex flex-col gap-4">
              {/* Client Info Card */}
              <View
                className="rounded-[16px] border p-3.5 shadow-sm flex flex-col gap-4"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <View
                  className="flex-row items-center justify-between border-b pb-2.5"
                  style={{ borderColor: colors.borderLight }}
                >
                  <View className="flex-row items-center gap-x-2">
                    <View
                      className="h-6 w-6 items-center justify-center rounded-lg"
                      style={{ backgroundColor: colors.primarySoft }}
                    >
                      <Ionicons name="person" size={13} color={colors.primary} />
                    </View>
                    <Text className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                      Client & Recipient
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setShowContactPicker(true)}
                    className="flex-row items-center gap-x-1 px-2.5 py-1 rounded-lg border active:opacity-75"
                    style={{
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primaryBorder,
                    }}
                  >
                    <Ionicons name="people" size={12} color={colors.primary} />
                    <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                      {selectedContact ? 'Change Contact' : 'Pick Contact'}
                    </Text>
                  </Pressable>
                </View>

                {/* If Contact is Picked, Show Summary Pill */}
                {selectedContact ? (
                  <View
                    className="rounded-xl p-2.5 border flex-row items-center justify-between"
                    style={{
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primaryBorder,
                    }}
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-bold" style={{ color: colors.primaryDark }}>
                        {selectedContact.name}
                      </Text>
                      <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                        {selectedContact.account?.name || selectedContact.company || 'Individual Client'}
                        {selectedContact.phone ? ` • ${selectedContact.phone}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleClearContact}
                      className="h-6 w-6 items-center justify-center rounded-full bg-white/70 active:opacity-75"
                    >
                      <Ionicons name="close" size={12} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ) : null}

                {/* Full-width Stacked Inputs (No horizontal cramping) */}
                <View className="flex flex-col gap-4">
                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Client / Company Name *
                    </Text>
                    <TextInput
                      value={clientName}
                      onChangeText={setClientName}
                      placeholder="e.g. Acme Corp or John Doe"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="rounded-xl px-3 py-2 border text-xs"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Contact Person (Optional)
                    </Text>
                    <TextInput
                      value={contactPerson}
                      onChangeText={setContactPerson}
                      placeholder="e.g. Mr. Johnathan Smith"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="rounded-xl px-3 py-2 border text-xs"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Phone / WhatsApp
                    </Text>
                    <View
                      className="flex-row items-center rounded-xl border px-3"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                      }}
                    >
                      <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                      <TextInput
                        value={clientPhone}
                        onChangeText={setClientPhone}
                        placeholder="+91 98765 43210"
                        placeholderTextColor={colors.inputPlaceholder}
                        keyboardType="phone-pad"
                        className="flex-1 py-2 px-2 text-xs"
                        style={{ color: colors.text }}
                      />
                    </View>
                  </View>

                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Email Address
                    </Text>
                    <View
                      className="flex-row items-center rounded-xl border px-3"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                      }}
                    >
                      <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
                      <TextInput
                        value={clientEmail}
                        onChangeText={setClientEmail}
                        placeholder="billing@acmecorp.com"
                        placeholderTextColor={colors.inputPlaceholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="flex-1 py-2 px-2 text-xs"
                        style={{ color: colors.text }}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Proposal Metadata Card */}
              <View
                className="rounded-[16px] border p-3.5 shadow-sm flex flex-col gap-4"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <View
                  className="flex-row items-center gap-x-2 border-b pb-2.5"
                  style={{ borderColor: colors.borderLight }}
                >
                  <View
                    className="h-6 w-6 items-center justify-center rounded-lg"
                    style={{ backgroundColor: colors.infoSoft }}
                  >
                    <Ionicons name="document-text" size={13} color={colors.info} />
                  </View>
                  <Text className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                    Proposal Scope & Currency
                  </Text>
                </View>

                <View className="flex flex-col gap-4">
                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Proposal Title
                    </Text>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. Next.js & Mobile App Architecture"
                      placeholderTextColor={colors.inputPlaceholder}
                      className="rounded-xl px-3 py-2 border text-xs"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Currency
                    </Text>
                    <View className="flex-row gap-x-1.5">
                      {CURRENCIES.map((curr) => {
                        const isCurr = currency === curr;
                        return (
                          <Pressable
                            key={curr}
                            onPress={() => setCurrency(curr)}
                            className="flex-1 py-1.5 rounded-lg border items-center justify-center active:opacity-75"
                            style={{
                              backgroundColor: isCurr ? colors.primary : colors.cardAlt,
                              borderColor: isCurr ? colors.primary : colors.border,
                            }}
                          >
                            <Text
                              className="text-[11px] font-black"
                              style={{ color: isCurr ? '#ffffff' : colors.text }}
                            >
                              {curr}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Proposal Validity
                    </Text>
                    <View className="flex-row gap-x-1.5">
                      {VALIDITY_OPTIONS.map((val) => {
                        const isVal = validUntil === val;
                        return (
                          <Pressable
                            key={val}
                            onPress={() => setValidUntil(val)}
                            className="flex-1 py-1.5 rounded-lg border items-center justify-center active:opacity-75"
                            style={{
                              backgroundColor: isVal ? colors.primary : colors.cardAlt,
                              borderColor: isVal ? colors.primary : colors.border,
                            }}
                          >
                            <Text
                              className="text-[10px] font-bold"
                              style={{ color: isVal ? '#ffffff' : colors.textSecondary }}
                            >
                              {val}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 2: LINE ITEMS & PRICING ================= */}
          {activeStep === 'items' && (
            <View className="flex flex-col gap-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-bold" style={{ color: colors.text }}>
                    Deliverables & Items
                  </Text>
                  <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                    {items.length} {items.length === 1 ? 'item' : 'items'} in quotation
                  </Text>
                </View>
                <Pressable
                  onPress={handleAddItem}
                  className="flex-row items-center gap-x-1 px-3 py-1.5 rounded-lg border active:opacity-75 shadow-xs"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  }}
                >
                  <Ionicons name="add" size={13} color="#ffffff" />
                  <Text className="text-xs font-black text-white">Add Deliverable</Text>
                </Pressable>
              </View>

              {/* Items List - Accordion Pattern to eliminate congestion */}
              {items.map((item, index) => {
                const isExpanded = expandedItemId === item.id;
                const itemSub = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                const itemDiscount = itemSub * ((Number(item.discountPercent) || 0) / 100);
                const itemTax = (itemSub - itemDiscount) * ((Number(item.taxPercent) || 0) / 100);
                const itemTotal = Math.round(itemSub - itemDiscount + itemTax);

                if (!isExpanded) {
                  // Compact 1-line collapsed summary card
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleExpand(item.id)}
                      className="rounded-[14px] border p-2.5 flex-row items-center justify-between active:opacity-80"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      }}
                    >
                      <View className="flex-row items-center gap-x-2.5 flex-1 mr-2">
                        <View
                          className="h-6 w-6 rounded-lg items-center justify-center"
                          style={{ backgroundColor: colors.primarySoft }}
                        >
                          <Text className="text-[10px] font-black" style={{ color: colors.primary }}>
                            {index + 1}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-xs font-bold"
                            style={{ color: colors.text }}
                            numberOfLines={1}
                          >
                            {item.name || `Deliverable #${index + 1}`}
                          </Text>
                          <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                            {item.quantity} × {currencySymbol} {Number(item.unitPrice || 0).toLocaleString('en-IN')}
                            {Number(item.taxPercent) > 0 ? ` (+${item.taxPercent}% GST)` : ''}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-x-2">
                        <Text className="text-xs font-black" style={{ color: colors.primaryDark }}>
                          {currencySymbol} {itemTotal.toLocaleString('en-IN')}
                        </Text>
                        <View
                          className="h-6 w-6 rounded-lg items-center justify-center border"
                          style={{
                            backgroundColor: colors.cardAlt,
                            borderColor: colors.border,
                          }}
                        >
                          <Ionicons name="create-outline" size={12} color={colors.primary} />
                        </View>
                        {items.length > 1 && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation?.();
                              handleRemoveItem(item.id);
                            }}
                            className="h-6 w-6 items-center justify-center rounded-lg border active:opacity-75"
                            style={{
                              backgroundColor: colors.dangerSoft,
                              borderColor: colors.dangerBorder,
                            }}
                          >
                            <Ionicons name="trash-outline" size={11} color={colors.danger} />
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  );
                }

                // Expanded Item Editor Card
                return (
                  <View
                    key={item.id}
                    className="rounded-[16px] border p-3.5 shadow-sm flex flex-col gap-4"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.primary,
                    }}
                  >
                    {/* Item Card Header */}
                    <View
                      className="flex-row items-center justify-between border-b pb-2"
                      style={{ borderColor: colors.borderLight }}
                    >
                      <View className="flex-row items-center gap-x-1.5">
                        <View
                          className="h-5 w-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Text className="text-[10px] font-black text-white">
                            {index + 1}
                          </Text>
                        </View>
                        <Text className="text-xs font-black" style={{ color: colors.primary }}>
                          Editing Item #{index + 1}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-x-1.5">
                        <Pressable
                          onPress={() => toggleExpand(item.id)}
                          className="px-2 py-0.5 rounded-md border active:opacity-75"
                          style={{
                            backgroundColor: colors.cardAlt,
                            borderColor: colors.border,
                          }}
                        >
                          <Text className="text-[10px] font-bold" style={{ color: colors.textSecondary }}>
                            Done
                          </Text>
                        </Pressable>

                        {items.length > 1 && (
                          <Pressable
                            onPress={() => handleRemoveItem(item.id)}
                            className="h-6 w-6 items-center justify-center rounded-lg border active:opacity-75"
                            style={{
                              backgroundColor: colors.dangerSoft,
                              borderColor: colors.dangerBorder,
                            }}
                          >
                            <Ionicons name="trash-outline" size={12} color={colors.danger} />
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Item Name */}
                    <View>
                      <Text
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: colors.textMuted }}
                      >
                        Deliverable / Service Title *
                      </Text>
                      <TextInput
                        value={item.name}
                        onChangeText={(val) => handleUpdateItem(item.id, 'name', val)}
                        placeholder="e.g. Backend API Architecture & Auth"
                        placeholderTextColor={colors.inputPlaceholder}
                        className="rounded-xl px-3 py-2 border text-xs"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        }}
                      />
                    </View>

                    {/* Description */}
                    <View>
                      <Text
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: colors.textMuted }}
                      >
                        Scope Description (Optional)
                      </Text>
                      <TextInput
                        value={item.description}
                        onChangeText={(val) => handleUpdateItem(item.id, 'description', val)}
                        placeholder="e.g. Setup Supabase, NextAuth, and RBAC tables"
                        placeholderTextColor={colors.inputPlaceholder}
                        multiline
                        numberOfLines={2}
                        className="rounded-xl px-3 py-1.5 border text-[11px]"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                          textAlignVertical: 'top',
                        }}
                      />
                    </View>

                    {/* Quantity & Unit Price */}
                    <View className="flex-row gap-x-2.5">
                      {/* Quantity Stepper */}
                      <View className="flex-1">
                        <Text
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: colors.textMuted }}
                        >
                          Quantity
                        </Text>
                        <View
                          className="flex-row items-center rounded-xl border overflow-hidden"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                          }}
                        >
                          <Pressable
                            onPress={() => handleStepQuantity(item.id, -1)}
                            className="h-9 w-9 items-center justify-center border-r active:opacity-70"
                            style={{ borderColor: colors.borderLight }}
                          >
                            <Ionicons name="remove" size={14} color={colors.textSecondary} />
                          </Pressable>
                          <TextInput
                            value={String(item.quantity)}
                            onChangeText={(val) => handleUpdateItem(item.id, 'quantity', val)}
                            keyboardType="numeric"
                            className="flex-1 text-center font-bold text-xs"
                            style={{ color: colors.text }}
                          />
                          <Pressable
                            onPress={() => handleStepQuantity(item.id, 1)}
                            className="h-9 w-9 items-center justify-center border-l active:opacity-70"
                            style={{ borderColor: colors.borderLight }}
                          >
                            <Ionicons name="add" size={14} color={colors.textSecondary} />
                          </Pressable>
                        </View>
                      </View>

                      {/* Unit Price */}
                      <View className="flex-1">
                        <Text
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: colors.textMuted }}
                        >
                          Unit Price ({currencySymbol})
                        </Text>
                        <TextInput
                          value={String(item.unitPrice)}
                          onChangeText={(val) => handleUpdateItem(item.id, 'unitPrice', val)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.inputPlaceholder}
                          className="h-9 rounded-xl px-3 border text-xs font-bold"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                            color: colors.text,
                          }}
                        />
                      </View>
                    </View>

                    {/* Dedicated GST Tax Rate Chips Row */}
                    <View>
                      <Text
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: colors.textMuted }}
                      >
                        GST Tax Rate
                      </Text>
                      <View className="flex-row gap-x-1.5">
                        {TAX_PRESETS.map((rate) => {
                          const isTax = Number(item.taxPercent) === rate;
                          return (
                            <Pressable
                              key={rate}
                              onPress={() => handleUpdateItem(item.id, 'taxPercent', rate)}
                              className="flex-1 py-1 rounded-lg border items-center justify-center active:opacity-75"
                              style={{
                                backgroundColor: isTax ? colors.primary : colors.cardAlt,
                                borderColor: isTax ? colors.primary : colors.border,
                              }}
                            >
                              <Text
                                className="text-[10px] font-black"
                                style={{ color: isTax ? '#ffffff' : colors.textSecondary }}
                              >
                                {rate}%
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Item Total Footer */}
                    <View
                      className="rounded-xl p-2.5 border flex-row items-center justify-between"
                      style={{
                        backgroundColor: colors.cardAlt,
                        borderColor: colors.border,
                      }}
                    >
                      <View>
                        <Text className="text-[9px] font-medium" style={{ color: colors.textMuted }}>
                          Net: {currencySymbol} {itemSub.toLocaleString('en-IN')}
                          {itemTax > 0 ? ` + Tax: ${currencySymbol} ${Math.round(itemTax).toLocaleString('en-IN')}` : ''}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-x-1">
                        <Text className="text-[10px] font-bold" style={{ color: colors.textSecondary }}>
                          Item Total:
                        </Text>
                        <Text className="text-xs font-black" style={{ color: colors.primaryDark }}>
                          {currencySymbol} {itemTotal.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Running Total Card on Step 2 */}
              <View
                className="rounded-xl p-3 border flex-row items-center justify-between"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <View>
                  <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                    Running Total ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </Text>
                  <Text className="text-sm font-black" style={{ color: colors.primary }}>
                    {currencySymbol} {grandTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setActiveStep('review')}
                  className="flex-row items-center gap-x-1.5 px-3 py-1.5 rounded-xl active:opacity-85 shadow-sm"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-xs font-black text-white">Review Summary</Text>
                  <Ionicons name="arrow-forward" size={13} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= STEP 3: REVIEW & TERMS ================= */}
          {activeStep === 'review' && (
            <View className="flex flex-col gap-4">
              {/* Business Issuer Info */}
              <View
                className="rounded-[16px] border p-3 shadow-sm flex-row items-center gap-x-3"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <View
                  className="h-10 w-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: colors.primarySoft }}
                >
                  <Ionicons name="business" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black" style={{ color: colors.text }}>
                    Devlomatix Solutions
                  </Text>
                  <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                    Registered Business Details & Bank Coordinates automatically attached
                  </Text>
                </View>
              </View>

              {/* Grand Total Financial Breakdown Card */}
              <View
                className="rounded-[16px] border p-3.5 shadow-sm flex flex-col gap-4"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <View
                  className="flex-row items-center gap-x-2 border-b pb-2 mb-1"
                  style={{ borderColor: colors.borderLight }}
                >
                  <Ionicons name="calculator-outline" size={14} color={colors.primary} />
                  <Text className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                    Financial Summary
                  </Text>
                </View>

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
                    Taxable Subtotal:
                  </Text>
                  <Text className="text-xs font-bold" style={{ color: colors.text }}>
                    {currencySymbol} {subtotal.toLocaleString('en-IN')}
                  </Text>
                </View>

                {discountTotal > 0 && (
                  <View className="flex-row justify-between py-1">
                    <Text className="text-xs font-medium" style={{ color: colors.danger }}>
                      Total Discount:
                    </Text>
                    <Text className="text-xs font-bold" style={{ color: colors.danger }}>
                      - {currencySymbol} {discountTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
                    Total Estimated GST / Taxes:
                  </Text>
                  <Text className="text-xs font-bold" style={{ color: colors.text }}>
                    + {currencySymbol} {taxTotal.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View
                  className="flex-row justify-between items-center rounded-xl p-3 border mt-1"
                  style={{
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primaryBorder,
                  }}
                >
                  <Text
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ color: colors.primaryDark }}
                  >
                    Grand Total ({currency})
                  </Text>
                  <Text className="text-base font-black" style={{ color: colors.primaryDark }}>
                    {currencySymbol} {grandTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Commercial Terms & Notes Card */}
              <View
                className="rounded-[16px] border p-3.5 shadow-sm flex flex-col gap-4"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                <View
                  className="flex-row items-center gap-x-2 border-b pb-2"
                  style={{ borderColor: colors.borderLight }}
                >
                  <Ionicons name="document-lock-outline" size={14} color={colors.primary} />
                  <Text className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                    Commercial Terms & Disclaimers
                  </Text>
                </View>

                <View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: colors.textMuted }}
                  >
                    Payment Terms
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    className="rounded-xl p-2.5 border text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                <View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: colors.textMuted }}
                  >
                    Scope Terms & Warranty
                  </Text>
                  <TextInput
                    value={terms}
                    onChangeText={setTerms}
                    multiline
                    numberOfLines={3}
                    className="rounded-xl p-2.5 border text-xs"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Navigation Bar (The Single Source of Truth for Navigation & Actions) */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-2.5 border-t flex-row items-center justify-between"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingBottom: Math.max(12, insets.bottom + 6),
        }}
      >
        <View>
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: colors.textMuted }}
          >
            {activeStep === 'client' ? 'Step 1 of 3' : activeStep === 'items' ? 'Step 2 of 3' : 'Final Step'}
          </Text>
          <Text className="text-xs font-black" style={{ color: colors.text }}>
            Total: {currencySymbol} {grandTotal.toLocaleString('en-IN')}
          </Text>
        </View>

        <View className="flex-row items-center gap-x-2">
          {activeStep !== 'client' && (
            <Pressable
              onPress={() => {
                if (activeStep === 'review') setActiveStep('items');
                else if (activeStep === 'items') setActiveStep('client');
              }}
              className="px-3 py-1.5 rounded-lg border active:opacity-70"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                Back
              </Text>
            </Pressable>
          )}

          {activeStep === 'client' && (
            <Pressable
              onPress={() => {
                if (!clientName.trim()) {
                  setErrorMsg('Please enter a client name to continue.');
                  return;
                }
                setErrorMsg(null);
                setActiveStep('items');
              }}
              className="flex-row items-center gap-x-1 px-4 py-1.5 rounded-lg active:opacity-85 shadow-xs"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-black text-white">Next</Text>
              <Ionicons name="chevron-forward" size={13} color="#ffffff" />
            </Pressable>
          )}

          {activeStep === 'items' && (
            <Pressable
              onPress={() => setActiveStep('review')}
              className="flex-row items-center gap-x-1 px-4 py-1.5 rounded-lg active:opacity-85 shadow-xs"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-black text-white">Next</Text>
              <Ionicons name="chevron-forward" size={13} color="#ffffff" />
            </Pressable>
          )}

          {activeStep === 'review' && (
            <View className="flex-row items-center gap-x-2">
              <Pressable
                onPress={() => handleSave('draft')}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg border active:opacity-75"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  Draft
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSave('sent')}
                disabled={saving}
                className="flex-row items-center gap-x-1 px-3.5 py-1.5 rounded-lg active:opacity-85 shadow-xs"
                style={{ backgroundColor: colors.primary }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                    <Text className="text-xs font-black text-white">Create</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>

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
            className="rounded-t-3xl p-4 shadow-2xl border-t max-h-[80%] flex flex-col gap-4"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Math.max(16, insets.bottom + 8),
            }}
          >
            <View
              className="flex-row items-center justify-between border-b pb-3"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-sm font-black" style={{ color: colors.text }}>
                Select Contact to Auto-Fill
              </Text>
              <Pressable onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <View
              className="flex-row items-center gap-x-2 rounded-xl px-3 py-1.5 border"
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
