import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaBedsScreen() {
  const { palette } = useAppTheme();
  const { wards, setWards } = useCurexa();

  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal State
  const [selectedBed, setSelectedBed] = useState(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [attendingDoctor, setAttendingDoctor] = useState('Dr. Sarah Lin, MD');

  // Flattened bed list
  const allBeds = useMemo(() => {
    const list = [];
    wards.forEach((w) => {
      w.rooms?.forEach((r) => {
        r.beds?.forEach((b) => {
          list.push({
            ...b,
            wardName: w.name,
            wardId: w.id,
            roomName: r.name,
            roomId: r.id,
          });
        });
      });
    });
    return list;
  }, [wards]);

  const filteredBeds = useMemo(() => {
    return allBeds.filter((b) => {
      const matchesWard = selectedWardFilter === 'ALL' || b.wardId === selectedWardFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || b.status === selectedStatusFilter;
      return matchesWard && matchesStatus;
    });
  }, [allBeds, selectedWardFilter, selectedStatusFilter]);

  const stats = useMemo(() => {
    const total = allBeds.length || 40;
    const occupied = allBeds.filter((b) => b.status === 'OCCUPIED').length || 30;
    const available = allBeds.filter((b) => b.status === 'AVAILABLE').length || 7;
    const cleaning = allBeds.filter((b) => b.status === 'CLEANING' || b.status === 'MAINTENANCE').length || 3;
    return { total, occupied, available, cleaning };
  }, [allBeds]);

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setShowAdmitModal(true);
  };

  const handleAdmit = () => {
    if (!selectedBed || !patientName) return;
    setWards((prevWards) =>
      prevWards.map((w) => ({
        ...w,
        rooms: w.rooms?.map((r) => ({
          ...r,
          beds: r.beds?.map((b) =>
            b.id === selectedBed.id
              ? { ...b, status: 'OCCUPIED', patientName, doctor: attendingDoctor, admittedAt: 'Just now' }
              : b
          ),
        })),
      }))
    );
    setShowAdmitModal(false);
    setPatientName('');
  };

  const handleDischarge = () => {
    if (!selectedBed) return;
    setWards((prevWards) =>
      prevWards.map((w) => ({
        ...w,
        rooms: w.rooms?.map((r) => ({
          ...r,
          beds: r.beds?.map((b) =>
            b.id === selectedBed.id
              ? { ...b, status: 'CLEANING', patientName: null, doctor: null, admittedAt: null }
              : b
          ),
        })),
      }))
    );
    setShowAdmitModal(false);
  };

  const handleMarkReady = () => {
    if (!selectedBed) return;
    setWards((prevWards) =>
      prevWards.map((w) => ({
        ...w,
        rooms: w.rooms?.map((r) => ({
          ...r,
          beds: r.beds?.map((b) =>
            b.id === selectedBed.id
              ? { ...b, status: 'AVAILABLE', patientName: null, doctor: null, admittedAt: null }
              : b
          ),
        })),
      }))
    );
    setShowAdmitModal(false);
  };

  return (
    <AppScreen>
      <CurexaHeader title="Wards & Bed Matrix (IPD)" subtitle="Inpatient Occupancy Control" showBack />

      <View className="flex-1 px-3 pt-2">
        {/* KPI Strip */}
        <View className="mb-2 flex-row gap-2">
          <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surface}`}>
            <Text className="text-[9px] font-bold uppercase text-emerald-600">Available</Text>
            <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>{stats.available}</Text>
          </View>
          <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surface}`}>
            <Text className="text-[9px] font-bold uppercase text-purple-600">Occupied</Text>
            <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>{stats.occupied}</Text>
          </View>
          <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surface}`}>
            <Text className="text-[9px] font-bold uppercase text-amber-600">Cleaning</Text>
            <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>{stats.cleaning}</Text>
          </View>
          <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surface}`}>
            <Text className="text-[9px] font-bold uppercase text-sky-600">Total</Text>
            <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>{stats.total}</Text>
          </View>
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-8">
          <View className="flex-row gap-1.5">
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'].map((st) => (
              <Pressable
                key={st}
                onPress={() => setSelectedStatusFilter(st)}
                className={`rounded-[10px] px-2.5 py-1 ${
                  selectedStatusFilter === st ? 'bg-emerald-600' : palette.surface
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    selectedStatusFilter === st ? 'text-white font-bold' : palette.text
                  }`}
                >
                  {st}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Bed Cards Grid */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {filteredBeds.map((bed) => {
              const isOccupied = bed.status === 'OCCUPIED';
              const isAvailable = bed.status === 'AVAILABLE';
              const isCleaning = bed.status === 'CLEANING';

              return (
                <Pressable
                  key={bed.id}
                  onPress={() => handleBedClick(bed)}
                  className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-[12px] ${
                          isOccupied
                            ? 'bg-purple-500/15'
                            : isAvailable
                            ? 'bg-emerald-500/15'
                            : 'bg-amber-500/15'
                        }`}
                      >
                        <Ionicons
                          name="bed"
                          size={18}
                          color={isOccupied ? '#9333ea' : isAvailable ? '#059669' : '#d97706'}
                        />
                      </View>
                      <View>
                        <Text className={`text-[14px] font-bold ${palette.text}`}>{bed.number}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {bed.wardName} • {bed.roomName}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        isOccupied
                          ? 'bg-purple-500/20'
                          : isAvailable
                          ? 'bg-emerald-500/20'
                          : 'bg-amber-500/20'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold ${
                          isOccupied
                            ? 'text-purple-700'
                            : isAvailable
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {bed.status}
                      </Text>
                    </View>
                  </View>

                  {isOccupied && (
                    <View className={`mt-2 rounded-[10px] p-2 flex-row items-center justify-between ${palette.surfaceInset}`}>
                      <View>
                        <Text className={`text-[11px] font-bold ${palette.text}`}>Patient: {bed.patientName}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>Doctor: {bed.doctor || 'Dr. Sarah Lin'}</Text>
                      </View>
                      <Text className="text-[10px] font-semibold text-purple-600">Since {bed.admittedAt || 'Sep 12'}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Bed Action / Admit Modal */}
      <Modal visible={showAdmitModal} transparent animationType="slide" onRequestClose={() => setShowAdmitModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
            <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
              <View>
                <Text className={`text-[15px] font-bold ${palette.text}`}>
                  {selectedBed?.number} ({selectedBed?.wardName})
                </Text>
                <Text className={`text-[10px] ${palette.textMuted}`}>Status: {selectedBed?.status}</Text>
              </View>
              <Pressable onPress={() => setShowAdmitModal(false)} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={18} color={palette.textMutedColor} />
              </Pressable>
            </View>

            {selectedBed?.status === 'AVAILABLE' ? (
              <View className="gap-2 mb-3">
                <Text className={`text-[12px] font-bold text-emerald-600`}>Admit Patient to this Bed</Text>
                <View>
                  <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Patient Name *</Text>
                  <TextInput
                    value={patientName}
                    onChangeText={setPatientName}
                    placeholder="e.g. Eleanor Vance"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                  />
                </View>
                <View>
                  <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Attending Doctor</Text>
                  <TextInput
                    value={attendingDoctor}
                    onChangeText={setAttendingDoctor}
                    className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                  />
                </View>
                <Pressable onPress={handleAdmit} className="rounded-[12px] bg-emerald-600 py-2.5 items-center mt-2">
                  <Text className="text-[12px] font-bold text-white">Confirm Admission</Text>
                </Pressable>
              </View>
            ) : selectedBed?.status === 'OCCUPIED' ? (
              <View className="gap-2 mb-3">
                <View className={`rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>Admitted: {selectedBed?.patientName}</Text>
                  <Text className={`text-[11px] ${palette.textMuted}`}>Doctor: {selectedBed?.doctor}</Text>
                </View>
                <Pressable onPress={handleDischarge} className="rounded-[12px] bg-red-600 py-2.5 items-center mt-2">
                  <Text className="text-[12px] font-bold text-white">Discharge Patient & Mark Cleaning</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2 mb-3">
                <Text className={`text-[12px] font-semibold ${palette.text}`}>
                  This bed is currently {selectedBed?.status?.toLowerCase()}.
                </Text>
                <Pressable onPress={handleMarkReady} className="rounded-[12px] bg-emerald-600 py-2.5 items-center mt-2">
                  <Text className="text-[12px] font-bold text-white">Sanitization Done (Mark Available)</Text>
                </Pressable>
              </View>
            )}

            <Pressable onPress={() => setShowAdmitModal(false)} className="rounded-[12px] bg-gray-500/15 py-2 items-center">
              <Text className={`text-[11px] font-bold ${palette.text}`}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
