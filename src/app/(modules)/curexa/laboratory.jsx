import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { CreateLabOrderModal } from './_components/CurexaModals';

export default function CurexaLaboratoryScreen() {
  const { palette } = useAppTheme();
  const { labOrders, setLabOrders, addLabOrderLocally } = useCurexa();

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resultNotes, setResultNotes] = useState('');

  const statuses = ['ALL', 'PENDING_COLLECTION', 'IN_PROCESSING', 'COMPLETED'];

  const filteredOrders = useMemo(() => {
    return labOrders.filter((o) => {
      return selectedStatus === 'ALL' || o.status === selectedStatus;
    });
  }, [labOrders, selectedStatus]);

  const updateOrderStatus = (id, newStatus, results = null) => {
    setLabOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: newStatus,
              resultsReady: newStatus === 'COMPLETED',
              resultNotes: results || o.resultNotes || 'Values within normal physiological reference ranges.',
            }
          : o
      )
    );
    setSelectedOrder(null);
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Diagnostics & Lab Tests"
        subtitle={`${filteredOrders.length} Diagnostic Orders`}
        showBack
        rightAction={
          <Pressable
            onPress={() => setShowOrderModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-cyan-600 px-2.5 py-1.5"
          >
            <Ionicons name="add" size={15} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Order Test</Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-8">
          <View className="flex-row gap-1.5">
            {statuses.map((st) => (
              <Pressable
                key={st}
                onPress={() => setSelectedStatus(st)}
                className={`rounded-[10px] px-2.5 py-1 ${
                  selectedStatus === st ? 'bg-cyan-600' : palette.surface
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

        {/* Orders List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {filteredOrders.map((order) => (
              <View
                key={order.id}
                className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-cyan-500/15">
                      <Ionicons name="flask" size={17} color="#06b6d4" />
                    </View>
                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className={`text-[13px] font-bold ${palette.text}`}>
                          {order.patientName}
                        </Text>
                        <View className="rounded bg-cyan-500/15 px-1 py-0.2">
                          <Text className="text-[9px] font-bold text-cyan-700">{order.orderNumber}</Text>
                        </View>
                      </View>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        By {order.doctorName} • {order.sampleType || 'Whole Blood'}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-500/20'
                        : order.status === 'IN_PROCESSING'
                        ? 'bg-amber-500/20'
                        : 'bg-cyan-500/20'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold ${
                        order.status === 'COMPLETED'
                          ? 'text-emerald-700'
                          : order.status === 'IN_PROCESSING'
                          ? 'text-amber-700'
                          : 'text-cyan-700'
                      }`}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Tests Tags */}
                <View className="mt-2 flex-row flex-wrap gap-1">
                  {(order.tests || ['Complete Blood Count']).map((t, idx) => (
                    <View key={idx} className={`rounded-[8px] px-2 py-0.5 ${palette.surfaceInset}`}>
                      <Text className={`text-[10px] font-medium ${palette.text}`}>{t}</Text>
                    </View>
                  ))}
                </View>

                {/* Workflow Actions */}
                <View className="mt-2.5 flex-row items-center justify-end gap-1.5 border-t border-gray-200/15 pt-2">
                  {order.status === 'PENDING_COLLECTION' && (
                    <Pressable
                      onPress={() => updateOrderStatus(order.id, 'IN_PROCESSING')}
                      className="rounded-[10px] bg-amber-500/20 px-2.5 py-1"
                    >
                      <Text className="text-[10px] font-bold text-amber-700">Sample Collected</Text>
                    </Pressable>
                  )}
                  {order.status === 'IN_PROCESSING' && (
                    <Pressable
                      onPress={() => {
                        setSelectedOrder(order);
                      }}
                      className="rounded-[10px] bg-cyan-600 px-2.5 py-1"
                    >
                      <Text className="text-[10px] font-bold text-white">Enter Results</Text>
                    </Pressable>
                  )}
                  {order.status === 'COMPLETED' && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text className="text-[10px] font-bold text-emerald-600">Report Published</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Result Entry Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
            <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
              <Text className={`text-[15px] font-bold ${palette.text}`}>
                Submit Lab Results ({selectedOrder?.orderNumber})
              </Text>
              <Pressable onPress={() => setSelectedOrder(null)} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={18} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-2 mb-3">
              <Text className={`text-[12px] font-semibold ${palette.text}`}>
                Patient: {selectedOrder?.patientName}
              </Text>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Diagnostic Findings / Values</Text>
              <TextInput
                value={resultNotes}
                onChangeText={setResultNotes}
                placeholder="e.g. Hemoglobin: 14.2 g/dL, WBC: 6,800 /uL, Platelets: 240,000 /uL. All normal."
                placeholderTextColor={palette.textMutedColor}
                multiline
                numberOfLines={4}
                className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
              />
            </View>

            <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
              <Pressable onPress={() => setSelectedOrder(null)} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
                <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => updateOrderStatus(selectedOrder.id, 'COMPLETED', resultNotes)}
                className="flex-1 rounded-[12px] bg-emerald-600 py-2.5 items-center"
              >
                <Text className="text-[12px] font-bold text-white">Publish Report</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <CreateLabOrderModal
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSave={(newOrder) => addLabOrderLocally(newOrder)}
      />
    </AppScreen>
  );
}
