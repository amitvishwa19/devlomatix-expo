import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { createInvoice, getBillingInvoices, recordPayment } from '~/services/curexa';

const initialInvoices = [
  {
    id: 'INV-9021',
    patient: 'Eleanor Vance',
    date: '2026-07-30',
    amount: '$1,450.00',
    status: 'Paid',
    items: ['ICU Ward Stay (2 Days) - $900', 'Chest X-Ray & ABG - $350', 'Pharmacy Medication - $200'],
  },
  {
    id: 'INV-9022',
    patient: 'Marcus Brody',
    date: '2026-07-31',
    amount: '$3,800.00',
    status: 'Pending',
    items: ['Right Knee MRI - $1,200', 'Orthopedic Surgery Consult - $1,600', 'Physical Therapy Package - $1,000'],
  },
  {
    id: 'INV-9023',
    patient: 'Clara Oswald',
    date: '2026-07-31',
    amount: '$620.00',
    status: 'Paid',
    items: ['General OPD Consultation - $150', 'Stool Culture Lab Test - $270', 'Pharmacy Prescriptions - $200'],
  },
  {
    id: 'INV-9024',
    patient: 'Robert Fox',
    date: '2026-08-01',
    amount: '$2,100.00',
    status: 'Partial',
    items: ['Ward A Stay (4 Days) - $1,400', 'ECG & Cardiac Panel - $450', 'Pharmacy Dispensed - $250'],
  },
];

export default function CurexaBillingScreen() {
  const { palette } = useAppTheme();
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Invoice Form
  const [patientName, setPatientName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    async function loadInvoices() {
      const res = await getBillingInvoices();
      if (res && res.invoices) {
        const formatted = res.invoices.map((inv) => ({
          id: inv.invoiceNumber || inv.id,
          patient: inv.patient?.displayName || 'Patient',
          date: inv.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          amount: `$${(inv.total || 0).toFixed(2)}`,
          status: inv.status === 'PAID' ? 'Paid' : inv.status === 'PARTIAL' ? 'Partial' : 'Pending',
          items: inv.items?.map((i) => `${i.description} - $${i.unitPrice}`) || ['Hospital Charges'],
        }));
        setInvoices(formatted);
      } else {
        setInvoices([]);
      }
    }
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => statusFilter === 'All' || i.status === statusFilter);
  }, [invoices, statusFilter]);

  const summaryMetrics = useMemo(() => {
    const totalCollected = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((acc, i) => acc + parseFloat(i.amount.replace('$', '').replace(',', '')), 0);
    const pendingAmount = invoices
      .filter((i) => i.status === 'Pending' || i.status === 'Partial')
      .reduce((acc, i) => acc + parseFloat(i.amount.replace('$', '').replace(',', '')), 0);
    return { totalCollected, pendingAmount };
  }, [invoices]);

  const handleMarkPaid = (id) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'Paid' } : i))
    );
  };

  const handleCreateInvoice = () => {
    if (!patientName.trim()) return;
    const newInv = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      patient: patientName,
      date: new Date().toISOString().split('T')[0],
      amount: amount.startsWith('$') ? amount : `$${amount}`,
      status: 'Pending',
      items: [serviceName],
    };
    setInvoices((prev) => [newInv, ...prev]);
    setPatientName('');
    setShowCreateModal(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600' };
      case 'Pending':
        return { bg: 'bg-amber-500/20', text: 'text-amber-600' };
      case 'Partial':
        return { bg: 'bg-sky-500/20', text: 'text-sky-600' };
      default:
        return { bg: 'bg-amber-500/20', text: 'text-amber-600' };
    }
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Billing & Invoices"
        showBack={true}
        rightAction={
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
          >
            <Ionicons name="receipt" size={16} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Create Bill</Text>
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-3 pb-4">

        {/* Revenue Summary Cards */}
        <View className="mb-3 flex-row gap-2">
          <View className={`flex-1 rounded-[20px] p-3.5 bg-emerald-500/15`}>
            <Text className={`text-[11px] ${palette.textMuted}`}>Total Collected</Text>
            <Text className={`mt-0.5 text-[20px] font-bold ${palette.text}`}>
              ${summaryMetrics.totalCollected.toLocaleString()}
            </Text>
          </View>
          <View className={`flex-1 rounded-[20px] p-3.5 bg-amber-500/15`}>
            <Text className={`text-[11px] ${palette.textMuted}`}>Pending Claims</Text>
            <Text className={`mt-0.5 text-[20px] font-bold ${palette.text}`}>
              ${summaryMetrics.pendingAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View className="mb-3 flex-row gap-1.5">
          {['All', 'Paid', 'Pending', 'Partial'].map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              className={`rounded-full px-3.5 py-1.5 ${
                statusFilter === st ? 'bg-emerald-600' : palette.surfaceInset
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  statusFilter === st ? 'text-white' : palette.textMuted
                }`}
              >
                {st}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Invoice List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="gap-2.5 pb-8">
            {filteredInvoices.map((inv) => {
              const badge = getStatusBadge(inv.status);
              return (
                <View key={inv.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-[16px] font-bold ${palette.text}`}>{inv.patient}</Text>
                      <Text className={`text-[11px] ${palette.textMuted}`}>#{inv.id}</Text>
                    </View>
                    <View className={`rounded-full px-2.5 py-0.5 ${badge.bg}`}>
                      <Text className={`text-[10px] font-bold ${badge.text}`}>{inv.status}</Text>
                    </View>
                  </View>

                  <Text className={`mt-0.5 text-[11px] ${palette.textMuted}`}>Billed Date: {inv.date}</Text>

                  {/* Itemized list */}
                  <View className="mt-2.5 rounded-xl bg-gray-500/10 p-3 gap-1">
                    {inv.items.map((item, idx) => (
                      <View key={idx} className="flex-row items-center justify-between">
                        <Text className={`text-[12px] ${palette.text}`}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-gray-200/10 pt-2.5">
                    <Text className={`text-[15px] font-bold ${palette.text}`}>Total: {inv.amount}</Text>
                    {inv.status !== 'Paid' && (
                      <Pressable
                        onPress={() => handleMarkPaid(inv.id)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5"
                      >
                        <Text className="text-[11px] font-bold text-white">Collect Payment</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Create Bill Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-[28px] p-5 ${palette.surface}`}>
            <View className="mb-3 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
              <Text className={`text-[17px] font-bold ${palette.text}`}>Create Hospital Invoice</Text>
              <Pressable onPress={() => setShowCreateModal(false)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={20} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-3">
              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Patient Name *</Text>
                <TextInput
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="Enter patient name"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>

              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Service & Tariff Item</Text>
                <TextInput
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholder="e.g. Inpatient Care & Lab Diagnostics"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>

              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Billed Amount ($)</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="$350.00"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setShowCreateModal(false)} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreateInvoice} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
                <Text className="text-[13px] font-bold text-white">Generate Bill</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
