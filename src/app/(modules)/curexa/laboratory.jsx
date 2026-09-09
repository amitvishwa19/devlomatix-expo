import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { createLabOrder, getLaboratoryOrders, updateLabOrder } from '~/services/curexa';

const initialLabRequests = [
  { id: 'LAB-501', patient: 'Robert Fox', testName: 'Comprehensive Blood Panel (CBC, Lipid, KFT)', doctor: 'Dr. Sarah Jenkins', date: '2026-08-02', status: 'Pending Sample', result: null },
  { id: 'LAB-502', patient: 'Eleanor Vance', testName: 'Chest X-Ray & Arterial Blood Gas', doctor: 'Dr. Alan Vance', date: '2026-08-01', status: 'In Analysis', result: null },
  { id: 'LAB-503', patient: 'Marcus Brody', testName: 'Right Knee Joint MRI Scan', doctor: 'Dr. Emily Watson', date: '2026-07-31', status: 'Completed', result: 'Moderate osteoarthritis. Intact cruciate ligaments.' },
  { id: 'LAB-504', patient: 'Clara Oswald', testName: 'Stool Culture & Electrolyte Panel', doctor: 'Dr. Alan Vance', date: '2026-07-30', status: 'Completed', result: 'Normal bacterial flora. Electrolytes within normal limits.' },
];

export default function CurexaLaboratoryScreen() {
  const { palette } = useAppTheme();
  const [labRequests, setLabRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLab, setSelectedLab] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // Form states
  const [resultText, setResultText] = useState('');
  const [newPatient, setNewPatient] = useState('');
  const [newTest, setNewTest] = useState('Full Lipid Profile');

  useEffect(() => {
    async function loadLabOrders() {
      const res = await getLaboratoryOrders();
      if (res && res.labOrders) {
        const formatted = res.labOrders.map((o) => ({
          id: o.id.slice(-4),
          patient: o.patient?.displayName || 'Patient',
          testName: o.notes || 'Diagnostic Lab Order',
          doctor: o.requester?.displayName || 'Dr. Sarah Jenkins',
          date: o.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: o.status === 'COMPLETED' ? 'Completed' : o.status === 'SAMPLE_COLLECTED' ? 'In Analysis' : 'Pending Sample',
          result: o.results?.[0]?.value || null,
        }));
        setLabRequests(formatted);
      } else {
        setLabRequests([]);
      }
    }
    loadLabOrders();
  }, []);

  const filteredRequests = useMemo(() => {
    return labRequests.filter((r) => statusFilter === 'All' || r.status === statusFilter);
  }, [labRequests, statusFilter]);

  const handleUpdateStatus = async (id, nextStatus) => {
    setLabRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    );
    const apiStatus = nextStatus === 'In Analysis' ? 'SAMPLE_COLLECTED' : nextStatus === 'Completed' ? 'COMPLETED' : 'ORDERED';
    await updateLabOrder({ orderId: id, status: apiStatus });
  };

  const handleSaveResult = async () => {
    if (!selectedLab || !resultText.trim()) return;
    setLabRequests((prev) =>
      prev.map((r) =>
        r.id === selectedLab.id
          ? { ...r, status: 'Completed', result: resultText }
          : r
      )
    );
    await updateLabOrder({ orderId: selectedLab.id, status: 'COMPLETED', testName: selectedLab.testName, resultText });
    setResultText('');
    setShowResultModal(false);
    setSelectedLab(null);
  };


  const handleCreateRequest = () => {
    if (!newPatient.trim()) return;
    const req = {
      id: `LAB-${Date.now().toString().slice(-3)}`,
      patient: newPatient,
      testName: newTest,
      doctor: 'Dr. Sarah Jenkins',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending Sample',
      result: null,
    };
    setLabRequests((prev) => [req, ...prev]);
    setNewPatient('');
    setShowNewRequestModal(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending Sample':
        return { bg: 'bg-amber-500/20', text: 'text-amber-600' };
      case 'In Analysis':
        return { bg: 'bg-sky-500/20', text: 'text-sky-600' };
      case 'Completed':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600' };
      default:
        return { bg: 'bg-amber-500/20', text: 'text-amber-600' };
    }
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Diagnostics & Lab"
        showBack={true}
        rightAction={
          <Pressable
            onPress={() => setShowNewRequestModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
          >
            <Ionicons name="flask" size={16} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Order Test</Text>
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-3 pb-4">

        {/* Status Filter Tabs */}
        <View className="mb-3 flex-row gap-1.5">
          {['All', 'Pending Sample', 'In Analysis', 'Completed'].map((st) => (
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

        {/* Lab Requests List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="gap-2.5 pb-8">
            {filteredRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              return (
                <View key={req.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-[16px] font-bold ${palette.text}`}>{req.patient}</Text>
                      <Text className={`text-[11px] ${palette.textMuted}`}>#{req.id}</Text>
                    </View>
                    <View className={`rounded-full px-2.5 py-0.5 ${badge.bg}`}>
                      <Text className={`text-[10px] font-bold ${badge.text}`}>{req.status}</Text>
                    </View>
                  </View>

                  <Text className={`mt-1 text-[13px] font-semibold text-emerald-600`}>
                    {req.testName}
                  </Text>
                  <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`}>
                    Ordered by: {req.doctor} • Date: {req.date}
                  </Text>

                  {req.result ? (
                    <View className="mt-2.5 rounded-xl bg-emerald-500/10 p-3">
                      <Text className="text-[11px] font-bold text-emerald-600">Lab Result / Findings:</Text>
                      <Text className={`mt-0.5 text-[12px] ${palette.text}`}>{req.result}</Text>
                    </View>
                  ) : null}

                  {/* Actions */}
                  <View className="mt-3 flex-row items-center justify-end gap-2 border-t border-gray-200/10 pt-2.5">
                    {req.status === 'Pending Sample' && (
                      <Pressable
                        onPress={() => handleUpdateStatus(req.id, 'In Analysis')}
                        className="rounded-lg bg-sky-600 px-3 py-1.5"
                      >
                        <Text className="text-[11px] font-bold text-white">Collect Sample</Text>
                      </Pressable>
                    )}

                    {req.status === 'In Analysis' && (
                      <Pressable
                        onPress={() => {
                          setSelectedLab(req);
                          setShowResultModal(true);
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5"
                      >
                        <Text className="text-[11px] font-bold text-white">Enter Lab Results</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Enter Result Modal */}
      <Modal visible={showResultModal} transparent animationType="slide" onRequestClose={() => setShowResultModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-[28px] p-5 ${palette.surface}`}>
            <View className="mb-3 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
              <Text className={`text-[17px] font-bold ${palette.text}`}>
                Enter Findings: {selectedLab?.patient}
              </Text>
              <Pressable onPress={() => setShowResultModal(false)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={20} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-3">
              <Text className={`text-[12px] font-semibold text-emerald-600`}>{selectedLab?.testName}</Text>
              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Lab Observations & Findings *</Text>
                <TextInput
                  value={resultText}
                  onChangeText={setResultText}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter lab readings and pathologist notes..."
                  placeholderTextColor={palette.textMutedColor}
                  className={`min-h-[90px] rounded-xl border p-3 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setShowResultModal(false)} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveResult} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
                <Text className="text-[13px] font-bold text-white">Save Results</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Test Modal */}
      <Modal visible={showNewRequestModal} transparent animationType="slide" onRequestClose={() => setShowNewRequestModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-[28px] p-5 ${palette.surface}`}>
            <View className="mb-3 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
              <Text className={`text-[17px] font-bold ${palette.text}`}>Order Diagnostic Lab Test</Text>
              <Pressable onPress={() => setShowNewRequestModal(false)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={20} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-3">
              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Patient Name *</Text>
                <TextInput
                  value={newPatient}
                  onChangeText={setNewPatient}
                  placeholder="Enter patient name"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>

              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Lab Test Name</Text>
                <TextInput
                  value={newTest}
                  onChangeText={setNewTest}
                  placeholder="e.g. Thyroid Panel (T3, T4, TSH)"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setShowNewRequestModal(false)} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreateRequest} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
                <Text className="text-[13px] font-bold text-white">Submit Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
