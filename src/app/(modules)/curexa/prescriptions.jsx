import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { CreatePrescriptionModal } from './_components/CurexaModals';

export default function CurexaPrescriptionsScreen() {
  const { palette } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'rx-101',
      patientName: 'Eleanor Vance',
      patientSku: 'PAT-2026-001',
      doctorName: 'Dr. Sarah Lin, MD',
      diagnosis: 'Post-Catheterization Ischemia Prevention',
      prescribedAt: '2026-09-15',
      status: 'Active',
      medicines: [
        { name: 'Atorvastatin Calcium 20mg', dosage: '1 - 0 - 1', duration: '30 Days', timing: 'After Meals' },
        { name: 'Aspirin Cardio 75mg', dosage: '0 - 1 - 0', duration: '30 Days', timing: 'After Lunch' },
      ],
    },
    {
      id: 'rx-102',
      patientName: 'Robert Sterling',
      patientSku: 'PAT-2026-002',
      doctorName: 'Dr. Mark Bennett, MD',
      diagnosis: 'Acute Migraine Prophylaxis',
      prescribedAt: '2026-09-15',
      status: 'Active',
      medicines: [
        { name: 'Sumatriptan 50mg', dosage: 'SOS (When Needed)', duration: '10 Days', timing: 'Onset of aura' },
        { name: 'Pantoprazole 40mg', dosage: '1 - 0 - 0', duration: '14 Days', timing: 'Before Breakfast' },
      ],
    },
    {
      id: 'rx-103',
      patientName: 'Marcus Aurelius Vance',
      patientSku: 'PAT-2026-004',
      doctorName: 'Dr. James Wilson, MD',
      diagnosis: 'Acute Coronary Syndrome Maintenance',
      prescribedAt: '2026-09-13',
      status: 'Active',
      medicines: [
        { name: 'Metoprolol Tartrate 25mg', dosage: '1 - 0 - 1', duration: '60 Days', timing: 'After Meals' },
        { name: 'Clopidogrel 75mg', dosage: '0 - 1 - 0', duration: '30 Days', timing: 'After Meals' },
      ],
    },
  ]);

  const filteredRx = prescriptions.filter(
    (rx) =>
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRx = (newRx) => {
    setPrescriptions((prev) => [
      {
        id: newRx.id,
        patientName: newRx.patientName,
        patientSku: 'PAT-2026-NEW',
        doctorName: 'Dr. Sarah Lin, MD',
        diagnosis: newRx.notes || 'Clinical Care',
        prescribedAt: new Date().toISOString().split('T')[0],
        status: 'Active',
        medicines: [
          {
            name: newRx.medicine,
            dosage: newRx.dosage,
            duration: newRx.duration,
            timing: 'As Directed',
          },
        ],
      },
      ...prev,
    ]);
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="e-Prescriptions (e-Rx)"
        subtitle={`${filteredRx.length} Active Prescriptions`}
        showBack
        rightAction={
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-purple-600 px-2.5 py-1.5"
          >
            <Ionicons name="create-outline" size={15} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Write e-Rx</Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* Search */}
        <View className="mb-2 flex-row items-center gap-2">
          <View
            className={`flex-1 flex-row items-center gap-2 rounded-[14px] px-2.5 py-1.5 border ${palette.surface} ${palette.border}`}
          >
            <Ionicons name="search-outline" size={16} color={palette.textMutedColor} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by patient name, diagnosis, or Rx ID..."
              placeholderTextColor={palette.textMutedColor}
              className={`flex-1 text-[12px] ${palette.text}`}
            />
          </View>
        </View>

        {/* Prescription List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {filteredRx.map((rx) => (
              <View
                key={rx.id}
                className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-purple-500/15">
                      <Ionicons name="document-text" size={17} color="#9333ea" />
                    </View>
                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className={`text-[14px] font-bold ${palette.text}`}>{rx.patientName}</Text>
                        <View className="rounded bg-purple-500/15 px-1 py-0.2">
                          <Text className="text-[9px] font-bold text-purple-700">{rx.id.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        Prescribed by {rx.doctorName} • {rx.prescribedAt}
                      </Text>
                    </View>
                  </View>

                  <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-emerald-700">{rx.status}</Text>
                  </View>
                </View>

                {/* Diagnosis */}
                <View className={`mt-2 rounded-[10px] p-2 ${palette.surfaceInset}`}>
                  <Text className={`text-[10px] font-bold text-purple-600`}>Diagnosis: {rx.diagnosis}</Text>
                </View>

                {/* Medications List */}
                <View className="mt-2 gap-1">
                  {rx.medicines.map((med, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-center justify-between border-b border-gray-200/10 pb-1"
                    >
                      <View className="flex-1 pr-2">
                        <Text className={`text-[11px] font-bold ${palette.text}`}>{med.name}</Text>
                        <Text className={`text-[9px] ${palette.textMuted}`}>{med.timing}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-bold text-emerald-600">{med.dosage}</Text>
                        <Text className={`text-[9px] ${palette.textMuted}`}>{med.duration}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <CreatePrescriptionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleAddRx}
      />
    </AppScreen>
  );
}
