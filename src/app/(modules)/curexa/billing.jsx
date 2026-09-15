import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { CreateInvoiceModal } from './_components/CurexaModals';

export default function CurexaBillingScreen() {
  const { palette } = useAppTheme();
  const { invoices, setInvoices, addInvoiceLocally } = useCurexa();

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const statuses = ['ALL', 'PAID', 'PARTIAL', 'PENDING'];

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      return selectedStatus === 'ALL' || inv.status === selectedStatus;
    });
  }, [invoices, selectedStatus]);

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalPending = totalBilled - totalCollected;
    return { totalBilled, totalCollected, totalPending };
  }, [invoices]);

  const markInvoicePaid = (id) => {
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'PAID', paidAmount: i.amount, balance: 0 } : i
      )
    );
    setSelectedInvoice(null);
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Billing & Invoices"
        subtitle={`${filteredInvoices.length} Patient Bills`}
        showBack
        rightAction={
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-amber-600 px-2.5 py-1.5"
          >
            <Ionicons name="add" size={15} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Create Bill</Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* Revenue KPI Strip */}
        <View className="mb-2 flex-row gap-2">
          <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surface}`}>
            <Text className="text-[9px] font-bold uppercase text-emerald-600">Collected</Text>
            <Text className={`mt-0.5 text-[15px] font-bold ${palette.text}`}>
              ${summary.totalCollected.toFixed(0)}
            </Text>
          </View>
          <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surface}`}>
            <Text className="text-[9px] font-bold uppercase text-amber-600">Pending</Text>
            <Text className={`mt-0.5 text-[15px] font-bold ${palette.text}`}>
              ${summary.totalPending.toFixed(0)}
            </Text>
          </View>
          <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surface}`}>
            <Text className="text-[9px] font-bold uppercase text-sky-600">Total Billed</Text>
            <Text className={`mt-0.5 text-[15px] font-bold ${palette.text}`}>
              ${summary.totalBilled.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-8">
          <View className="flex-row gap-1.5">
            {statuses.map((st) => (
              <Pressable
                key={st}
                onPress={() => setSelectedStatus(st)}
                className={`rounded-[10px] px-2.5 py-1 ${
                  selectedStatus === st ? 'bg-amber-600' : palette.surface
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    selectedStatus === st ? 'text-white font-bold' : palette.text
                  }`}
                >
                  {st}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Invoice List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {filteredInvoices.map((inv) => (
              <Pressable
                key={inv.id}
                onPress={() => setSelectedInvoice(inv)}
                className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-amber-500/15">
                      <Ionicons name="receipt" size={17} color="#d97706" />
                    </View>
                    <View>
                      <Text className={`text-[13px] font-bold ${palette.text}`}>{inv.patientName}</Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        {inv.invoiceNumber} • {inv.date}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-[14px] font-bold text-amber-600">
                      ${typeof inv.amount === 'number' ? inv.amount.toFixed(2) : inv.amount}
                    </Text>
                    <View
                      className={`mt-0.5 rounded-full px-2 py-0.2 ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/20'
                          : inv.status === 'PARTIAL'
                          ? 'bg-purple-500/20'
                          : 'bg-amber-500/20'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold ${
                          inv.status === 'PAID'
                            ? 'text-emerald-700'
                            : inv.status === 'PARTIAL'
                            ? 'text-purple-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {inv.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Line Items Preview */}
                {inv.items && inv.items.length > 0 && (
                  <View className={`mt-2 rounded-[10px] p-2 gap-1 ${palette.surfaceInset}`}>
                    {inv.items.slice(0, 2).map((item, idx) => (
                      <View key={idx} className="flex-row items-center justify-between">
                        <Text className={`text-[10px] ${palette.textMuted}`} numberOfLines={1}>
                          • {item.name}
                        </Text>
                        <Text className={`text-[10px] font-semibold ${palette.text}`}>${item.total}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Invoice Detail Sheet */}
      <Modal visible={!!selectedInvoice} transparent animationType="slide" onRequestClose={() => setSelectedInvoice(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
            <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
              <View>
                <Text className={`text-[15px] font-bold ${palette.text}`}>
                  {selectedInvoice?.invoiceNumber}
                </Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>Patient: {selectedInvoice?.patientName}</Text>
              </View>
              <Pressable onPress={() => setSelectedInvoice(null)} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={18} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-2 mb-3">
              <View className={`rounded-[12px] p-3 ${palette.surfaceInset}`}>
                <View className="flex-row justify-between mb-1">
                  <Text className={`text-[11px] ${palette.textMuted}`}>Total Billed</Text>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>${selectedInvoice?.amount}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className={`text-[11px] ${palette.textMuted}`}>Amount Paid</Text>
                  <Text className="text-[12px] font-bold text-emerald-600">${selectedInvoice?.paidAmount}</Text>
                </View>
                <View className="flex-row justify-between border-t border-gray-200/15 pt-1">
                  <Text className={`text-[11px] font-bold ${palette.text}`}>Outstanding Balance</Text>
                  <Text className="text-[12px] font-bold text-amber-600">${selectedInvoice?.balance}</Text>
                </View>
              </View>

              {selectedInvoice?.status !== 'PAID' && (
                <Pressable
                  onPress={() => markInvoicePaid(selectedInvoice.id)}
                  className="rounded-[12px] bg-emerald-600 py-2.5 items-center mt-1"
                >
                  <Text className="text-[12px] font-bold text-white">Record Full Payment ($ {selectedInvoice?.balance})</Text>
                </Pressable>
              )}
            </View>

            <Pressable onPress={() => setSelectedInvoice(null)} className="rounded-[12px] bg-gray-500/15 py-2 items-center">
              <Text className={`text-[11px] font-bold ${palette.text}`}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <CreateInvoiceModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={(newInv) => addInvoiceLocally(newInv)}
      />
    </AppScreen>
  );
}
