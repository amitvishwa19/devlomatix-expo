import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';
import { AddPatientModal, PatientDetailModal } from '../_components/CurexaModals';
import { createPatient, getPatients } from '~/services/curexa';

const initialPatients = [
  {
    id: '1042',
    name: 'Robert Fox',
    age: '45',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+1 (555) 234-5678',
    doctor: 'Dr. Sarah Jenkins',
    status: 'Inpatient',
    room: 'Ward A - Bed 04',
    admissionDate: '2026-07-28',
    vitals: { heartRate: '76', bp: '124/82', temp: '98.4', spo2: '99' },
    history: 'Hypertension, Type-2 Diabetes. Under observation post ECG.',
  },
  {
    id: '1043',
    name: 'Eleanor Vance',
    age: '32',
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '+1 (555) 876-5432',
    doctor: 'Dr. Alan Vance',
    status: 'Emergency',
    room: 'ICU Bed 02',
    admissionDate: '2026-07-31',
    vitals: { heartRate: '105', bp: '140/90', temp: '101.2', spo2: '94' },
    history: 'Acute respiratory distress. Oxygen support administered.',
  },
  {
    id: '1044',
    name: 'Marcus Brody',
    age: '58',
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+1 (555) 345-6789',
    doctor: 'Dr. Emily Watson',
    status: 'Outpatient',
    room: 'OPD Clinic 3',
    admissionDate: '2026-07-30',
    vitals: { heartRate: '70', bp: '118/75', temp: '98.6', spo2: '98' },
    history: 'Routine Orthopedic checkup. Scheduled X-Ray review.',
  },
  {
    id: '1045',
    name: 'Samantha Wright',
    age: '27',
    gender: 'Female',
    bloodGroup: 'O-',
    phone: '+1 (555) 901-2345',
    doctor: 'Dr. Sarah Jenkins',
    status: 'Discharged',
    room: 'Discharged Home',
    admissionDate: '2026-07-25',
    vitals: { heartRate: '72', bp: '120/80', temp: '98.6', spo2: '99' },
    history: 'Appendectomy recovery complete. Discharge summary issued.',
  },
  {
    id: '1046',
    name: 'Clara Oswald',
    age: '29',
    gender: 'Female',
    bloodGroup: 'AB+',
    phone: '+1 (555) 432-1098',
    doctor: 'Dr. Alan Vance',
    status: 'Inpatient',
    room: 'Ward B - Bed 12',
    admissionDate: '2026-07-29',
    vitals: { heartRate: '82', bp: '115/78', temp: '99.0', spo2: '98' },
    history: 'Mild gastroenteritis. IV fluids administered.',
  },
];

export default function CurexaPatientsScreen() {
  const { palette } = useAppTheme();
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function loadPatients() {
      const res = await getPatients({ status: statusFilter, bloodGroup: bloodGroupFilter, search: searchQuery });
      if (res && res.patients) {
        const formatted = res.patients.map((p) => ({
          id: p.id.slice(-4),
          name: p.displayName || p.name || 'Patient',
          age: p.demographic?.age || '30',
          gender: p.demographic?.gender || 'Male',
          bloodGroup: p.demographic?.bloodGroup || 'O+',
          phone: p.phone || 'N/A',
          doctor: p.demographic?.doctor || 'Dr. Sarah Jenkins',
          status: p.demographic?.status || 'Inpatient',
          room: p.demographic?.room || 'General Ward',
          admissionDate: p.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          vitals: p.vitals || { heartRate: '75', bp: '120/80', temp: '98.6', spo2: '98' },
          history: p.medicalHistory?.conditions || 'Under observation',
        }));
        setPatients(formatted);
      } else {
        setPatients([]);
      }
    }
    loadPatients();
  }, [statusFilter, bloodGroupFilter]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.includes(searchQuery) ||
        p.phone.includes(searchQuery);

      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesBlood = bloodGroupFilter === 'All' || p.bloodGroup === bloodGroupFilter;

      return matchesSearch && matchesStatus && matchesBlood;
    });
  }, [patients, searchQuery, statusFilter, bloodGroupFilter]);

  const handleAddPatient = async (newP) => {
    setPatients((prev) => [newP, ...prev]);
    await createPatient(newP);
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'Emergency':
        return { bg: 'bg-red-500/20', text: 'text-red-600', dot: 'bg-red-500' };
      case 'Inpatient':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600', dot: 'bg-emerald-500' };
      case 'Outpatient':
        return { bg: 'bg-sky-500/20', text: 'text-sky-600', dot: 'bg-sky-500' };
      case 'Discharged':
        return { bg: 'bg-gray-500/20', text: 'text-gray-500', dot: 'bg-gray-400' };
      default:
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600', dot: 'bg-emerald-500' };
    }
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Patient EHR Directory"
        rightAction={
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Add Patient</Text>
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-3 pb-28">

        {/* Search Bar */}
        <View className={`mb-3 flex-row items-center rounded-2xl border px-3 py-2 ${palette.surface} ${palette.border}`}>
          <Ionicons name="search-outline" size={18} color={palette.textMutedColor} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search patient name, ID, or phone..."
            placeholderTextColor={palette.textMutedColor}
            className={`ml-2 flex-1 text-[13px] ${palette.text}`}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={palette.textMutedColor} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
            {['All', 'Inpatient', 'Outpatient', 'Emergency', 'Discharged'].map((st) => (
              <Pressable
                key={st}
                onPress={() => setStatusFilter(st)}
                className={`rounded-full px-3 py-1.5 ${
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
          </ScrollView>
        </View>

        {/* View Switcher & Blood Filter */}
        <View className="mb-3 flex-row items-center justify-between">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1">
            {['All', 'O+', 'A+', 'B+', 'AB+', 'O-'].map((bg) => (
              <Pressable
                key={bg}
                onPress={() => setBloodGroupFilter(bg)}
                className={`rounded-lg px-2 py-1 ${
                  bloodGroupFilter === bg ? 'bg-emerald-500/20' : 'transparent'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    bloodGroupFilter === bg ? 'text-emerald-600' : palette.textMuted
                  }`}
                >
                  {bg}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex-row items-center gap-1 rounded-xl bg-gray-500/10 p-1">
            <Pressable
              onPress={() => setViewMode('cards')}
              className={`rounded-lg p-1 ${viewMode === 'cards' ? 'bg-emerald-600' : 'transparent'}`}
            >
              <Ionicons name="grid-outline" size={16} color={viewMode === 'cards' ? '#ffffff' : palette.textColor} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('table')}
              className={`rounded-lg p-1 ${viewMode === 'table' ? 'bg-emerald-600' : 'transparent'}`}
            >
              <Ionicons name="list-outline" size={16} color={viewMode === 'table' ? '#ffffff' : palette.textColor} />
            </Pressable>
          </View>
        </View>

        {/* Patient List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {viewMode === 'cards' ? (
            <View className="gap-2.5 pb-8">
              {filteredPatients.map((p) => {
                const badge = getStatusBadge(p.status);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedPatient(p)}
                    className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15">
                          <Text className="text-[13px] font-bold text-emerald-600">{p.bloodGroup}</Text>
                        </View>
                        <View>
                          <View className="flex-row items-center gap-2">
                            <Text className={`text-[15px] font-bold ${palette.text}`}>{p.name}</Text>
                            <Text className={`text-[11px] ${palette.textMuted}`}>#{p.id}</Text>
                          </View>
                          <Text className={`text-[11px] ${palette.textSoft}`}>
                            {p.gender} • {p.age} yrs • {p.phone}
                          </Text>
                        </View>
                      </View>

                      <View className={`rounded-full px-2.5 py-1 ${badge.bg}`}>
                        <Text className={`text-[10px] font-bold ${badge.text}`}>{p.status}</Text>
                      </View>
                    </View>

                    <View className="mt-3 flex-row items-center justify-between border-t border-gray-200/10 pt-2.5">
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="medkit-outline" size={14} color={palette.textMutedColor} />
                        <Text className={`text-[11px] ${palette.textSoft}`}>{p.doctor}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="bed-outline" size={14} color={palette.textMutedColor} />
                        <Text className={`text-[11px] font-semibold ${palette.text}`}>{p.room}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View className={`rounded-[22px] p-2 ${palette.surface}`}>
              {filteredPatients.map((p, idx) => {
                const badge = getStatusBadge(p.status);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedPatient(p)}
                    className={`flex-row items-center justify-between p-3 ${
                      idx !== filteredPatients.length - 1 ? 'border-b border-gray-200/10' : ''
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15">
                        <Text className="text-[10px] font-bold text-emerald-600">{p.bloodGroup}</Text>
                      </View>
                      <View>
                        <Text className={`text-[13px] font-bold ${palette.text}`}>{p.name}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>{p.doctor}</Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <View className={`rounded-full px-2 py-0.5 ${badge.bg}`}>
                        <Text className={`text-[9px] font-bold ${badge.text}`}>{p.status}</Text>
                      </View>
                      <Text className={`mt-0.5 text-[10px] ${palette.textSoft}`}>{p.room}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Patient Detail Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        visible={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      {/* Add Patient Modal */}
      <AddPatientModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPatient}
      />
    </AppScreen>
  );
}
