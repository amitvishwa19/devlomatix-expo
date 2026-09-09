import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

const initialBeds = [
  { id: 'ICU-01', ward: 'ICU Ward', bedNo: 'Bed 01', status: 'Occupied', patient: 'Eleanor Vance', doctor: 'Dr. Alan Vance', date: '2026-07-31' },
  { id: 'ICU-02', ward: 'ICU Ward', bedNo: 'Bed 02', status: 'Occupied', patient: 'Robert Fox', doctor: 'Dr. Sarah Jenkins', date: '2026-07-28' },
  { id: 'ICU-03', ward: 'ICU Ward', bedNo: 'Bed 03', status: 'Available', patient: null, doctor: null, date: null },
  { id: 'ICU-04', ward: 'ICU Ward', bedNo: 'Bed 04', status: 'Cleaning', patient: null, doctor: null, date: null },
  { id: 'GEN-01', ward: 'General Male Ward', bedNo: 'Bed 12', status: 'Occupied', patient: 'Marcus Brody', doctor: 'Dr. Emily Watson', date: '2026-07-30' },
  { id: 'GEN-02', ward: 'General Male Ward', bedNo: 'Bed 13', status: 'Available', patient: null, doctor: null, date: null },
  { id: 'GEN-03', ward: 'General Female Ward', bedNo: 'Bed 08', status: 'Occupied', patient: 'Clara Oswald', doctor: 'Dr. Alan Vance', date: '2026-07-29' },
  { id: 'GEN-04', ward: 'General Female Ward', bedNo: 'Bed 09', status: 'Maintenance', patient: null, doctor: null, date: null },
  { id: 'STE-01', ward: 'Private Suite', bedNo: 'Suite 101', status: 'Occupied', patient: 'Samantha Wright', doctor: 'Dr. Sarah Jenkins', date: '2026-07-27' },
  { id: 'STE-02', ward: 'Private Suite', bedNo: 'Suite 102', status: 'Available', patient: null, doctor: null, date: null },
];

export default function CurexaBedsScreen() {
  const { palette } = useAppTheme();
  const [beds, setBeds] = useState([]);
  const [wardFilter, setWardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBed, setSelectedBed] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form state for assignment
  const [assignPatient, setAssignPatient] = useState('');
  const [assignDoctor, setAssignDoctor] = useState('Dr. Sarah Jenkins');

  useEffect(() => {
    async function loadBeds() {
      const res = await getBeds({ ward: wardFilter });
      if (res && res.beds) {
        const formatted = res.beds.map((b) => ({
          id: b.id,
          ward: b.room?.type ? `${b.room.type} Ward` : 'General Ward',
          bedNo: `Bed ${b.bedNumber}`,
          status: b.status === 'OCCUPIED' ? 'Occupied' : b.status === 'AVAILABLE' ? 'Available' : 'Cleaning',
          patient: b.admissions?.[0]?.patient?.displayName || null,
          doctor: 'Dr. Sarah Jenkins',
          date: b.admissions?.[0]?.createdAt?.split('T')[0] || null,
        }));
        setBeds(formatted);
      } else {
        setBeds([]);
      }
    }
    loadBeds();
  }, [wardFilter]);

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const matchesWard = wardFilter === 'All' || b.ward === wardFilter;
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesWard && matchesStatus;
    });
  }, [beds, wardFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter((b) => b.status === 'Occupied').length;
    const available = beds.filter((b) => b.status === 'Available').length;
    const cleaning = beds.filter((b) => b.status === 'Cleaning' || b.status === 'Maintenance').length;
    return { total, occupied, available, cleaning };
  }, [beds]);

  const handleAssignBed = async () => {
    if (!selectedBed || !assignPatient.trim()) return;
    setBeds((prev) =>
      prev.map((b) =>
        b.id === selectedBed.id
          ? {
              ...b,
              status: 'Occupied',
              patient: assignPatient,
              doctor: assignDoctor,
              date: new Date().toISOString().split('T')[0],
            }
          : b
      )
    );
    await assignBed({ bedId: selectedBed.id, patientId: assignPatient, reason: 'Ward Admission' });
    setAssignPatient('');
    setShowAssignModal(false);
    setSelectedBed(null);
  };

  const handleDischargeBed = (bedId) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? { ...b, status: 'Cleaning', patient: null, doctor: null, date: null }
          : b
      )
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Occupied':
        return { bg: 'bg-red-500/20', text: 'text-red-600', color: '#ef4444' };
      case 'Available':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600', color: '#10b981' };
      case 'Cleaning':
        return { bg: 'bg-amber-500/20', text: 'text-amber-600', color: '#f59e0b' };
      case 'Maintenance':
        return { bg: 'bg-gray-500/20', text: 'text-gray-500', color: '#6b7280' };
      default:
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600', color: '#10b981' };
    }
  };

  return (
    <AppScreen>
      <CurexaHeader title="Inpatient Bed Grid" showBack={true} />
      <View className="flex-1 px-4 pt-3 pb-4">

        {/* Summary Metric Strip */}
        <View className="mb-3 flex-row gap-2">
          <View className={`flex-1 rounded-[18px] p-3 bg-red-500/15`}>
            <Text className={`text-[10px] ${palette.textMuted}`}>Occupied</Text>
            <Text className={`text-[18px] font-bold ${palette.text}`}>{summary.occupied}</Text>
          </View>
          <View className={`flex-1 rounded-[18px] p-3 bg-emerald-500/15`}>
            <Text className={`text-[10px] ${palette.textMuted}`}>Available</Text>
            <Text className={`text-[18px] font-bold ${palette.text}`}>{summary.available}</Text>
          </View>
          <View className={`flex-1 rounded-[18px] p-3 bg-amber-500/15`}>
            <Text className={`text-[10px] ${palette.textMuted}`}>Cleaning</Text>
            <Text className={`text-[18px] font-bold ${palette.text}`}>{summary.cleaning}</Text>
          </View>
        </View>

        {/* Ward Filter Tabs */}
        <View className="mb-2.5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
            {['All', 'ICU Ward', 'General Male Ward', 'General Female Ward', 'Private Suite'].map((w) => (
              <Pressable
                key={w}
                onPress={() => setWardFilter(w)}
                className={`rounded-full px-3 py-1.5 ${
                  wardFilter === w ? 'bg-emerald-600' : palette.surfaceInset
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    wardFilter === w ? 'text-white' : palette.textMuted
                  }`}
                >
                  {w}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Status Filter Tabs */}
        <View className="mb-3 flex-row gap-1.5">
          {['All', 'Available', 'Occupied', 'Cleaning', 'Maintenance'].map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 ${
                statusFilter === st ? 'bg-emerald-500/20' : 'transparent'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  statusFilter === st ? 'text-emerald-600' : palette.textMuted
                }`}
              >
                {st}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Bed Grid List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="flex-row flex-wrap gap-2.5 pb-8">
            {filteredBeds.map((bed) => {
              const badge = getStatusBadge(bed.status);
              return (
                <Pressable
                  key={bed.id}
                  onPress={() => {
                    if (bed.status === 'Available') {
                      setSelectedBed(bed);
                      setShowAssignModal(true);
                    }
                  }}
                  className={`w-[48%] rounded-[22px] p-3.5 shadow-sm ${palette.surface}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="bed" size={16} color={badge.color} />
                      <Text className={`text-[14px] font-bold ${palette.text}`}>{bed.bedNo}</Text>
                    </View>
                    <View className={`rounded-full px-2 py-0.5 ${badge.bg}`}>
                      <Text className={`text-[9px] font-bold ${badge.text}`}>{bed.status}</Text>
                    </View>
                  </View>

                  <Text className={`mt-1 text-[10px] font-semibold ${palette.textMuted}`}>{bed.ward}</Text>

                  {bed.patient ? (
                    <View className="mt-2 border-t border-gray-200/10 pt-2">
                      <Text className={`text-[12px] font-bold ${palette.text}`}>{bed.patient}</Text>
                      <Text className={`text-[10px] ${palette.textSoft}`}>{bed.doctor}</Text>
                      <Text className={`text-[9px] ${palette.textMuted}`}>Admitted: {bed.date}</Text>

                      <Pressable
                        onPress={() => handleDischargeBed(bed.id)}
                        className="mt-2 rounded-lg bg-red-500/15 py-1 items-center"
                      >
                        <Text className="text-[10px] font-bold text-red-600">Discharge Patient</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="mt-3 border-t border-gray-200/10 pt-2 items-center">
                      <Text className={`text-[11px] ${palette.textMuted}`}>
                        {bed.status === 'Available' ? 'Tap to Assign' : bed.status}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Bed Assignment Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide" onRequestClose={() => setShowAssignModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-[28px] p-5 ${palette.surface}`}>
            <View className="mb-3 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
              <Text className={`text-[17px] font-bold ${palette.text}`}>
                Assign {selectedBed?.bedNo} ({selectedBed?.ward})
              </Text>
              <Pressable onPress={() => setShowAssignModal(false)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={20} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-3">
              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Patient Name *</Text>
                <TextInput
                  value={assignPatient}
                  onChangeText={setAssignPatient}
                  placeholder="Enter patient name"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>

              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Attending Doctor</Text>
                <TextInput
                  value={assignDoctor}
                  onChangeText={setAssignDoctor}
                  placeholder="Dr. Sarah Jenkins"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setShowAssignModal(false)} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAssignBed} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
                <Text className="text-[13px] font-bold text-white">Assign Bed</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
