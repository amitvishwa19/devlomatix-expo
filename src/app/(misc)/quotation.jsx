import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import * as quotationService from '~/services/quotation';

const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
];

const defaultModules = [
  { id: 'opd', name: 'OPD Management System', features: ['OPD appointments', 'Case management', 'Billing & payment', 'Medicine prescription', 'Health certificates', 'Analysis reports'] },
  { id: 'ipd', name: 'IPD Management System', features: ['Indoor admission & discharge', 'Day-to-day billing', 'Room transfer', 'Medical discharge summary', 'TPA & company payment', 'Bed vacancy report'] },
  { id: 'pharmacy', name: 'Pharmacy Management', features: ['Cloud based system', 'Hospital integration', 'Sales & return', 'Purchase & return', 'Supplier ledger', 'Expiry product alerts'] },
  { id: 'inventory', name: 'Inventory Management', features: ['Financial reports', 'GST reports', 'Schedule H drug reports', 'User access restrictions'] },
  { id: 'pathology', name: 'Pathology Management', features: ['Dynamic dashboard', 'Patient records', 'Billing system', 'Investigation templates', 'Financial reports'] },
  { id: 'radiology', name: 'Radiology Management', features: ['Dynamic dashboard', 'Patient records', 'Billing system', 'Investigation templates', 'Financial reports'] },
  { id: 'centralStore', name: 'Central Store', features: ['Inventory issue & return', 'Purchase & return', 'Supplier ledger', 'Expiry alerts', 'Financial reports'] },
  { id: 'doctorSharing', name: 'Doctor Sharing', features: ['Doctor-wise sharing policy', 'Service-wise sharing', 'Referring doctor sharing', 'Sharing statement', 'TDS report'] },
  { id: 'tallyIntegration', name: 'Tally Integration', features: ['Transfer hospital & pharmacy data to Tally'] },
  { id: 'whatsapp', name: 'WhatsApp Integration', features: ['Welcome messages', 'Transactional messages', 'Report sharing', 'Ref. Dr. thanks messages'] },
];

const defaultTerms = [
  'First-time training provided by the catalyst software team.',
  'Yearly renewal charges will be 20% from next year onwards.',
  '70% payment at PO placement, 30% after training completed.',
  'New module development charged extra based on work hours.',
  '18% GST applicable as per govt regulation.',
];

const defaultNotes = [
  'Catalyst Tally interface transfers data into Tally only (one-way).',
  'First 10,000 WhatsApp messages free for 1 year.',
  'After exhaustion, Rs. 0.50 per message (min 5000 package).',
];

const formatCurrency = (amount, currencyCode) => {
  const cfg = currencies.find((c) => c.code === currencyCode) || currencies[0];
  return `${cfg.symbol}${amount.toLocaleString(cfg.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
};

export default function QuotationScreen() {
  const { palette } = useAppTheme();

  const [activeTab, setActiveTab] = useState('form');
  const [quotationData, setQuotationData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Company info
  const [companyName, setCompanyName] = useState('CareWell');
  const [companyTagline, setCompanyTagline] = useState('The Health Care Software');
  const [companyEmail, setCompanyEmail] = useState('info@carewell.com');
  const [companyWebsite, setCompanyWebsite] = useState('www.carewell.com');
  const [companyPhone1, setCompanyPhone1] = useState('+91 79849 58806');

  // Basic info
  const [quotationNumber, setQuotationNumber] = useState('PRO-001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validTill, setValidTill] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [quotationTitle, setQuotationTitle] = useState('Quotation for Hospital Management Software');

  // Pricing
  const [currency, setCurrency] = useState('INR');
  const [totalBeds, setTotalBeds] = useState(100);
  const [perBedPrice, setPerBedPrice] = useState(7000);
  const [gstPercent, setGstPercent] = useState(18);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Modules
  const [selectedModules, setSelectedModules] = useState(defaultModules.map((m) => m.id));

  // Custom line items
  const [customItems, setCustomItems] = useState([]);

  // Notes & Terms
  const [notes, setNotes] = useState(defaultNotes.join('\n'));
  const [terms, setTerms] = useState(defaultTerms.join('\n'));

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    company: false, basic: true, client: true, pricing: true, modules: true, notes: false, terms: false,
  });

  const toggleSection = (key) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleModule = (id) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m.id !== id) : [...prev, id]
    );
  };

  const addItem = () => setCustomItems((prev) => [...prev, { id: `item-${Date.now()}`, description: '', quantity: 1, rate: 0, amount: 0 }]);

  const updateItem = (id, field, value) => {
    setCustomItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: field === 'description' ? value : Number(value) };
      if (field === 'quantity' || field === 'rate') updated.amount = updated.quantity * updated.rate;
      return updated;
    }));
  };

  const removeItem = (id) => setCustomItems((prev) => prev.filter((i) => i.id !== id));

  const handleGenerate = async () => {
    const mainAmount = totalBeds * perBedPrice;
    const mainItem = { id: 'main', description: 'Hospital Management Software', quantity: 1, rate: mainAmount, amount: mainAmount };
    const allItems = [mainItem, ...customItems.filter((i) => i.description)];
    const subtotal = allItems.reduce((s, i) => s + i.amount, 0);
    const discountAmt = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
    const afterDiscount = subtotal - discountAmt;
    const gstAmount = (afterDiscount * gstPercent) / 100;
    const total = afterDiscount + gstAmount;

    const selectedModuleData = defaultModules.filter((m) => selectedModules.includes(m.id));

    const payload = {
      companyInfo: { name: companyName, tagline: companyTagline, email: companyEmail, website: companyWebsite, phone1: companyPhone1 },
      date: formatDate(date), validTill: formatDate(validTill),
      clientName: clientName || 'Client Name', clientAddress, quotationTitle,
      lineItems: allItems, totalBeds, perBedPrice,
      modules: selectedModuleData,
      subtotal, discountType, discountValue, discountAmount: discountAmt,
      gstPercent, gstAmount, total, currency,
      termsAndConditions: terms.split('\n').filter((t) => t.trim()),
      notes: notes.split('\n').filter((n) => n.trim()),
    };

    setSaving(true);
    try {
      const res = await quotationService.saveQuotation({
        quotationNumber,
        clientName: clientName || 'Client Name',
        total,
        data: payload,
      });
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'Quotation saved' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to save', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }

    setQuotationData({ ...payload, quotationNumber });
    setActiveTab('preview');
  };

  const SectionToggle = ({ section, label }) => (
    <TouchableOpacity onPress={() => toggleSection(section)}
      className="flex-row items-center justify-between px-4 py-3 rounded-t-[16px]"
      style={{ backgroundColor: palette.colors.surface }}>
      <Text className={`text-[15px] font-bold ${palette.text}`}>{label}</Text>
      <Ionicons name={expandedSections[section] ? 'chevron-up' : 'chevron-down'} size={18} color={palette.textMutedColor} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
        <Text className={`text-[18px] font-bold ${palette.text}`}>Quotation Generator</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setActiveTab('form')}
            className={`rounded-full px-3 py-1.5 ${activeTab === 'form' ? 'bg-amber-600' : 'border'}`}
            style={activeTab !== 'form' ? { borderColor: palette.colors.border } : {}}>
            <Text className={`text-[11px] font-bold ${activeTab === 'form' ? 'text-white' : palette.text}`}>Form</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('preview')}
            className={`rounded-full px-3 py-1.5 ${activeTab === 'preview' ? 'bg-amber-600' : 'border'}`}
            style={activeTab !== 'preview' ? { borderColor: palette.colors.border } : {}}
            disabled={!quotationData}>
            <Text className={`text-[11px] font-bold ${activeTab === 'preview' ? 'text-white' : palette.textMuted}`}>Preview</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'form' ? (
          <View className="px-4 pt-4 gap-3">
            {/* Company Info */}
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <SectionToggle section="company" label="Company Information" />
              {expandedSections.company && (
                <View className="px-4 py-3 gap-3" style={{ backgroundColor: palette.colors.surface }}>
                  <Input label="Company Name" value={companyName} onChange={setCompanyName} palette={palette} />
                  <Input label="Tagline" value={companyTagline} onChange={setCompanyTagline} palette={palette} />
                  <Input label="Email" value={companyEmail} onChange={setCompanyEmail} palette={palette} />
                  <Input label="Website" value={companyWebsite} onChange={setCompanyWebsite} palette={palette} />
                  <Input label="Phone" value={companyPhone1} onChange={setCompanyPhone1} palette={palette} />
                </View>
              )}
            </View>

            {/* Basic Info */}
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <SectionToggle section="basic" label="Basic Information" />
              {expandedSections.basic && (
                <View className="px-4 py-3 gap-3" style={{ backgroundColor: palette.colors.surface }}>
                  <Input label="Quotation Number" value={quotationNumber} onChange={setQuotationNumber} palette={palette} />
                  <Input label="Date" value={date} onChange={setDate} palette={palette} />
                  <Input label="Valid Till" value={validTill} onChange={setValidTill} palette={palette} />
                </View>
              )}
            </View>

            {/* Client Info */}
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <SectionToggle section="client" label="Client Information" />
              {expandedSections.client && (
                <View className="px-4 py-3 gap-3" style={{ backgroundColor: palette.colors.surface }}>
                  <Input label="Client / Hospital Name" value={clientName} onChange={setClientName} palette={palette} />
                  <Input label="Address" value={clientAddress} onChange={setClientAddress} palette={palette} multiline />
                  <Input label="Quotation Title" value={quotationTitle} onChange={setQuotationTitle} palette={palette} />
                </View>
              )}
            </View>

            {/* Pricing */}
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <SectionToggle section="pricing" label="Pricing" />
              {expandedSections.pricing && (
                <View className="px-4 py-3 gap-3" style={{ backgroundColor: palette.colors.surface }}>
                  {/* Currency selector */}
                  <View>
                    <Text className={`text-[12px] font-semibold mb-1 ${palette.text}`}>Currency</Text>
                    <View className="flex-row gap-2">
                      {currencies.map((c) => (
                        <TouchableOpacity key={c.code} onPress={() => setCurrency(c.code)}
                          className={`px-3 py-2 rounded-[10px] ${currency === c.code ? 'bg-amber-600' : 'border'}`}
                          style={currency !== c.code ? { borderColor: palette.colors.border } : {}}>
                          <Text className={`text-[12px] font-bold ${currency === c.code ? 'text-white' : palette.text}`}>
                            {c.symbol} {c.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Input label="Total Beds" value={String(totalBeds)} onChange={(v) => setTotalBeds(Number(v))} palette={palette} numeric />
                  <Input label={`Per Bed Price (${currencies.find((c) => c.code === currency)?.symbol})`} value={String(perBedPrice)} onChange={(v) => setPerBedPrice(Number(v))} palette={palette} numeric />
                  <Input label="GST / Tax (%)" value={String(gstPercent)} onChange={(v) => setGstPercent(Number(v))} palette={palette} numeric />

                  {/* Discount */}
                  <View className="border-t pt-3" style={{ borderColor: palette.colors.border }}>
                    <Text className={`text-[12px] font-semibold mb-2 ${palette.text}`}>Discount</Text>
                    <View className="flex-row gap-2 mb-2">
                      {['percentage', 'fixed'].map((t) => (
                        <TouchableOpacity key={t} onPress={() => setDiscountType(t)}
                          className={`px-3 py-1.5 rounded-[8px] ${discountType === t ? 'bg-amber-600' : 'border'}`}
                          style={discountType !== t ? { borderColor: palette.colors.border } : {}}>
                          <Text className={`text-[11px] font-bold ${discountType === t ? 'text-white' : palette.text}`}>
                            {t === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Input
                      label={discountType === 'percentage' ? 'Discount (%)' : `Discount (${currencies.find((c) => c.code === currency)?.symbol})`}
                      value={String(discountValue)}
                      onChange={(v) => setDiscountValue(Number(v))}
                      palette={palette} numeric />
                  </View>

                  {/* Custom Line Items */}
                  <View className="border-t pt-3" style={{ borderColor: palette.colors.border }}>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className={`text-[12px] font-semibold ${palette.text}`}>Additional Items</Text>
                      <TouchableOpacity onPress={addItem} className="rounded-full bg-amber-600 px-3 py-1">
                        <Ionicons name="add" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    {customItems.map((item) => (
                      <View key={item.id} className="flex-row items-center gap-1 mb-2">
                        <TextInput
                          className="flex-1 rounded-[10px] border px-2 py-1.5 text-[11px]"
                          style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                          placeholder="Description" placeholderTextColor={palette.textMutedColor}
                          value={item.description} onChangeText={(v) => updateItem(item.id, 'description', v)} />
                        <TextInput
                          className="w-12 rounded-[10px] border px-2 py-1.5 text-[11px] text-center"
                          style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                          placeholder="Qty" placeholderTextColor={palette.textMutedColor}
                          value={String(item.quantity)} onChangeText={(v) => updateItem(item.id, 'quantity', v)}
                          keyboardType="numeric" />
                        <TextInput
                          className="w-16 rounded-[10px] border px-2 py-1.5 text-[11px] text-right"
                          style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                          placeholder="Rate" placeholderTextColor={palette.textMutedColor}
                          value={String(item.rate)} onChangeText={(v) => updateItem(item.id, 'rate', v)}
                          keyboardType="numeric" />
                        <Text className={`text-[11px] font-semibold w-16 text-right ${palette.text}`}>
                          {formatCurrency(item.amount, currency)}
                        </Text>
                        <TouchableOpacity onPress={() => removeItem(item.id)} className="p-1">
                          <Ionicons name="trash-outline" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Modules */}
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <SectionToggle section="modules" label="Modules" />
              {expandedSections.modules && (
                <View className="px-4 py-3 gap-2" style={{ backgroundColor: palette.colors.surface }}>
                  {defaultModules.map((mod) => (
                    <TouchableOpacity key={mod.id} onPress={() => toggleModule(mod.id)}
                      className="flex-row items-center gap-2 rounded-[12px] border px-3 py-2.5"
                      style={{ borderColor: selectedModules.includes(mod.id) ? '#d97706' : palette.colors.border, backgroundColor: selectedModules.includes(mod.id) ? '#d9770615' : 'transparent' }}>
                      <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selectedModules.includes(mod.id) ? 'border-amber-600 bg-amber-600' : ''}`} style={{ borderColor: selectedModules.includes(mod.id) ? '#d97706' : palette.colors.border }}>
                        {selectedModules.includes(mod.id) && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <Text className={`text-[13px] font-semibold flex-1 ${palette.text}`}>{mod.name}</Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>{mod.features.length} features</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <SectionToggle section="notes" label="Notes" />
              {expandedSections.notes && (
                <View className="px-4 py-3" style={{ backgroundColor: palette.colors.surface }}>
                  <TextInput
                    className="rounded-[12px] border px-3 py-2 text-[12px] min-h-[120px]"
                    style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
                    placeholder="Enter notes (one per line)" placeholderTextColor={palette.textMutedColor}
                    value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
                </View>
              )}
            </View>

            {/* Terms */}
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <SectionToggle section="terms" label="Terms & Conditions" />
              {expandedSections.terms && (
                <View className="px-4 py-3" style={{ backgroundColor: palette.colors.surface }}>
                  <TextInput
                    className="rounded-[12px] border px-3 py-2 text-[12px] min-h-[120px]"
                    style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
                    placeholder="Enter terms (one per line)" placeholderTextColor={palette.textMutedColor}
                    value={terms} onChangeText={setTerms} multiline textAlignVertical="top" />
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleGenerate} disabled={saving} className="items-center rounded-[16px] bg-amber-600 py-4 mt-2 opacity-100" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-[15px] font-bold text-white">Generate Quotation</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          quotationData && (
            <View className="px-4 pt-4">
              <QuotationPreview data={quotationData} palette={palette} />
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, value, onChange, palette, multiline, numeric }) {
  return (
    <View>
      <Text className={`text-[12px] font-semibold mb-1 ${palette.text}`}>{label}</Text>
      <TextInput
        className={`rounded-[12px] border px-3 py-2.5 text-[13px] ${multiline ? 'min-h-[60px]' : ''}`}
        style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
        value={value} onChangeText={onChange}
        placeholderTextColor={palette.textMutedColor}
        multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={numeric ? 'numeric' : 'default'} />
    </View>
  );
}

function QuotationPreview({ data, palette }) {
  const cfg = currencies.find((c) => c.code === data.currency) || currencies[0];
  const fmt = (amt) => formatCurrency(amt, data.currency);

  return (
    <View className="rounded-[20px] border overflow-hidden" style={{ backgroundColor: '#fff', borderColor: '#e5e7eb' }}>
      {/* Header */}
      <View className="px-5 py-4 border-b" style={{ borderColor: '#e5e7eb' }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-600">
              <Text className="text-[16px] font-bold text-white">C</Text>
            </View>
            <View>
              <Text className="text-[18px] font-bold text-gray-900">{data.companyInfo.name}</Text>
              <Text className="text-[11px] text-gray-500 italic">{data.companyInfo.tagline}</Text>
            </View>
          </View>
          <Text className="text-[20px] font-light text-gray-800 tracking-widest">QUOTATION</Text>
        </View>
        <View className="flex-row flex-wrap gap-3 mt-3 pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
          <Text className="text-[10px] text-gray-500">{data.companyInfo.email}</Text>
          <Text className="text-[10px] text-gray-500">{data.companyInfo.website}</Text>
          <Text className="text-[10px] text-gray-500">{data.companyInfo.phone1}</Text>
        </View>
      </View>

      {/* Quotation Info */}
      <View className="px-5 py-3 border-b flex-row justify-between" style={{ borderColor: '#e5e7eb', backgroundColor: '#fefce8' }}>
        <View>
          <Text className="text-[10px] text-gray-500">Quotation #</Text>
          <Text className="text-[14px] font-bold text-gray-900">{data.quotationNumber}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-gray-500">Date / Valid Till</Text>
          <Text className="text-[12px] font-semibold text-gray-900">{data.date} — {data.validTill}</Text>
        </View>
      </View>

      {/* Client */}
      <View className="px-5 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
        <Text className="text-[10px] text-gray-500 mb-0.5">Client</Text>
        <Text className="text-[15px] font-bold text-gray-900">{data.clientName}</Text>
        {data.clientAddress ? <Text className="text-[11px] text-gray-500 mt-0.5">{data.clientAddress}</Text> : null}
        <Text className="text-[11px] text-gray-600 mt-1">{data.quotationTitle}</Text>
      </View>

      {/* Line Items */}
      <View className="px-5 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
        <View className="flex-row bg-gray-100 rounded-[8px] px-3 py-2 mb-2">
          <Text className="text-[9px] font-bold text-gray-500 w-6">#</Text>
          <Text className="text-[9px] font-bold text-gray-500 flex-1">Item</Text>
          <Text className="text-[9px] font-bold text-gray-500 w-10 text-center">QTY</Text>
          <Text className="text-[9px] font-bold text-gray-500 w-20 text-right">Rate ({cfg.symbol})</Text>
          <Text className="text-[9px] font-bold text-gray-500 w-20 text-right">Amount ({cfg.symbol})</Text>
        </View>
        {data.lineItems.map((item, i) => (
          <View key={item.id} className="flex-row items-center px-3 py-2 border-b" style={{ borderColor: '#f3f4f6' }}>
            <Text className="text-[11px] font-medium text-gray-500 w-6">{i + 1}</Text>
            <View className="flex-1">
              <Text className="text-[12px] font-semibold text-gray-900">{item.description}</Text>
              {data.totalBeds && data.perBedPrice && i === 0 && (
                <Text className="text-[10px] text-amber-700 mt-0.5">
                  Total Beds: {data.totalBeds} × {cfg.symbol}{data.perBedPrice}
                </Text>
              )}
            </View>
            <Text className="text-[11px] text-gray-700 w-10 text-center">{item.quantity}</Text>
            <Text className="text-[11px] font-medium text-gray-900 w-20 text-right">{fmt(item.rate)}</Text>
            <Text className="text-[11px] font-bold text-gray-900 w-20 text-right">{fmt(item.amount)}</Text>
          </View>
        ))}
      </View>

      {/* Modules */}
      {data.modules?.length > 0 && (
        <View className="px-5 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
          <Text className="text-[13px] font-bold text-gray-900 mb-2">Included Modules</Text>
          {data.modules.map((mod) => (
            <View key={mod.id} className="mb-2">
              <Text className="text-[12px] font-semibold text-amber-700">{mod.name}</Text>
              <View className="flex-row flex-wrap gap-1 mt-0.5">
                {mod.features.map((f, i) => (
                  <View key={i} className="rounded-full bg-amber-50 px-2 py-0.5 border" style={{ borderColor: '#fde68a' }}>
                    <Text className="text-[9px] text-amber-800">{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Financial Summary */}
      <View className="px-5 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
        <View className="ml-auto max-w-[200px] gap-1.5">
          <View className="flex-row justify-between">
            <Text className="text-[11px] text-gray-500">Sub Total</Text>
            <Text className="text-[11px] font-semibold text-gray-900">{fmt(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-[11px] text-green-600">Discount{data.discountType === 'percentage' ? ` (${data.discountValue}%)` : ''}</Text>
              <Text className="text-[11px] font-semibold text-green-600">- {fmt(data.discountAmount)}</Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-[11px] text-gray-500">GST ({data.gstPercent}%)</Text>
            <Text className="text-[11px] font-semibold text-gray-900">{fmt(data.gstAmount)}</Text>
          </View>
          <View className="border-t pt-1.5 mt-1 flex-row justify-between" style={{ borderColor: '#e5e7eb' }}>
            <Text className="text-[14px] font-bold text-gray-900">Total</Text>
            <Text className="text-[14px] font-bold text-amber-700">{fmt(data.total)}</Text>
          </View>
        </View>
      </View>

      {/* Notes & Terms */}
      <View className="px-5 py-3 gap-3">
        {data.notes?.length > 0 && (
          <View>
            <Text className="text-[11px] font-bold text-gray-700 mb-1">Notes:</Text>
            {data.notes.map((n, i) => (
              <Text key={i} className="text-[10px] text-gray-500 mb-0.5">• {n}</Text>
            ))}
          </View>
        )}
        {data.termsAndConditions?.length > 0 && (
          <View>
            <Text className="text-[11px] font-bold text-gray-700 mb-1">Terms & Conditions:</Text>
            {data.termsAndConditions.map((t, i) => (
              <Text key={i} className="text-[10px] text-gray-500 mb-0.5">• {t}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
