import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';
import { AddPatientModal, PatientDetailModal } from '../_components/CurexaModals';

export default function CurexaPatientsScreen() {
  const { palette } = useAppTheme();
  const { patients, addPatientLocally, selectedPatient, showPatientDetail, setShowPatientDetail, viewPatientDetails } =
    useCurexa();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const statuses = ['ALL', 'Admitted', 'OPD / Triage', 'Outpatient', 'ICU'];

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const name = p.displayName || p.name || '';
      const phone = p.phone || '';
      const sku = p.sku || '';
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (p.status && p.status.toLowerCase().includes(selectedStatus.toLowerCase()));

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, selectedStatus]);

  return (
    <AppScreen>
      <CurexaHeader
        title="Patient EMR Directory"
        subtitle={`${filteredPatients.length} Patients Recorded`}
        rightAction={
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-emerald-600 px-2.5 py-1.5"
          >
            <Ionicons name="person-add" size={14} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Add Patient</Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* Search Bar */}
        <View className="mb-2 flex-row items-center gap-2">
          <View
            className={`flex-1 flex-row items-center gap-2 rounded-[14px] px-2.5 py-1.5 border ${palette.surface} ${palette.border}`}
          >
            <Ionicons name="search-outline" size={16} color={palette.textMutedColor} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, phone, or PAT-ID..."
              placeholderTextColor={palette.textMutedColor}
              className={`flex-1 text-[12px] ${palette.text}`}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={15} color={palette.textMutedColor} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-8">
          <View className="flex-row gap-1.5">
            {statuses.map((st) => (
              <Pressable
                key={st}
                onPress={() => setSelectedStatus(st)}
                className={`rounded-[10px] px-2.5 py-1 ${
                  selectedStatus === st ? 'bg-emerald-600' : palette.surface
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    selectedStatus === st ? 'text-white font-bold' : palette.text
                  }`}
                >
                  {st}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Patient Cards List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {filteredPatients.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => viewPatientDetails(p)}
                className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-[14px] bg-emerald-500/15">
                      <Ionicons name="person" size={17} color="#059669" />
                    </View>
                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className={`text-[14px] font-bold ${palette.text}`}>
                          {p.displayName || p.name}
                        </Text>
                        <View className="rounded bg-emerald-500/15 px-1 py-0.2">
                          <Text className="text-[9px] font-bold text-emerald-700">
                            {p.bloodGroup || 'O+'}
                          </Text>
                        </View>
                      </View>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        {p.gender || 'Female'} • {p.age || 38} yrs • {p.sku || `ID: ${p.id}`}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      p.status === 'ICU'
                        ? 'bg-red-500/20'
                        : p.status === 'Admitted'
                        ? 'bg-purple-500/20'
                        : 'bg-emerald-500/20'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold ${
                        p.status === 'ICU'
                          ? 'text-red-700'
                          : p.status === 'Admitted'
                          ? 'text-purple-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {p.status || 'Active'}
                    </Text>
                  </View>
                </View>

                {/* Vitals Summary Strip */}
                <View className={`mt-2.5 flex-row items-center justify-between rounded-[12px] p-2 ${palette.surfaceInset}`}>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="heart" size={12} color="#ef4444" />
                    <Text className={`text-[10px] font-medium ${palette.text}`}>
                      {p.vitals?.heartRate || '76'} bpm
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="speedometer-outline" size={12} color="#0284c7" />
                    <Text className={`text-[10px] font-medium ${palette.text}`}>
                      {p.vitals?.bp || '120/80'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="water-outline" size={12} color="#06b6d4" />
                    <Text className={`text-[10px] font-medium ${palette.text}`}>
                      {p.vitals?.spo2 || '98%'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-0.5">
                    <Text className="text-[10px] font-bold text-emerald-600">EMR</Text>
                    <Ionicons name="chevron-forward" size={11} color="#059669" />
                  </View>
                </View>
              </Pressable>
            ))}

            {filteredPatients.length === 0 && (
              <View className={`items-center justify-center rounded-[16px] p-8 ${palette.surface}`}>
                <Ionicons name="people-outline" size={36} color={palette.textMutedColor} />
                <Text className={`mt-2 text-[13px] font-bold ${palette.text}`}>No patients found</Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>
                  Try clearing your search query or add a new patient.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Modals */}
      <AddPatientModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(newP) => addPatientLocally(newP)}
      />
      <PatientDetailModal
        patient={selectedPatient}
        visible={showPatientDetail}
        onClose={() => setShowPatientDetail(false)}
      />
    </AppScreen>
  );
}
