import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaWorkflowScreen() {
  const { palette } = useAppTheme();
  const { viewPatientDetails } = useCurexa();

  const [stages, setStages] = useState([
    {
      id: 'stg-1',
      title: 'Triage / Reception',
      color: '#64748b',
      patients: [
        { id: 'p-101', name: 'John Doe', age: 42, condition: 'Fever & chills', token: 'T-01', doctor: 'Dr. Sarah Lin' },
        { id: 'p-102', name: 'Amy Pond', age: 28, condition: 'Sprained ankle', token: 'T-02', doctor: 'Dr. Alan Harper' },
      ],
    },
    {
      id: 'stg-2',
      title: 'In Consultation',
      color: '#0284c7',
      patients: [
        { id: 'p-103', name: 'Eleanor Vance', age: 38, condition: 'Post-catheter review', token: 'A-01', doctor: 'Dr. Sarah Lin' },
        { id: 'p-104', name: 'Robert Sterling', age: 52, condition: 'Severe migraine', token: 'A-02', doctor: 'Dr. Mark Bennett' },
      ],
    },
    {
      id: 'stg-3',
      title: 'Diagnostics / Labs',
      color: '#06b6d4',
      patients: [
        { id: 'p-105', name: 'Clara Oswald', age: 29, condition: 'Routine ultrasound', token: 'A-03', doctor: 'Dr. Rachel Patel' },
      ],
    },
    {
      id: 'stg-4',
      title: 'Pharmacy & Billing',
      color: '#f59e0b',
      patients: [
        { id: 'p-106', name: 'David H. Miller', age: 61, condition: 'Knee suture removal', token: 'A-04', doctor: 'Dr. Alan Harper' },
      ],
    },
    {
      id: 'stg-5',
      title: 'IPD Admitted',
      color: '#8b5cf6',
      patients: [
        { id: 'p-107', name: 'Marcus Vance', age: 67, condition: 'ICU Post-MI', token: 'ICU-02', doctor: 'Dr. James Wilson' },
      ],
    },
  ]);

  const [activeStageId, setActiveStageId] = useState('stg-2');

  const movePatientForward = (currentStageId, patientId) => {
    const stageIdx = stages.findIndex((s) => s.id === currentStageId);
    if (stageIdx === -1 || stageIdx >= stages.length - 1) return;

    const nextStageId = stages[stageIdx + 1].id;
    let movedPatient = null;

    setStages((prev) =>
      prev.map((s) => {
        if (s.id === currentStageId) {
          movedPatient = s.patients.find((p) => p.id === patientId);
          return { ...s, patients: s.patients.filter((p) => p.id !== patientId) };
        }
        return s;
      }).map((s) => {
        if (s.id === nextStageId && movedPatient) {
          return { ...s, patients: [...s.patients, movedPatient] };
        }
        return s;
      })
    );
  };

  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];

  return (
    <AppScreen>
      <CurexaHeader
        title="Clinical Workflow Kanban"
        subtitle="Patient Journey & Clinical Care Pathways"
        showBack
      />

      <View className="flex-1 px-3 pt-2">
        {/* Horizontal Pipeline Steps */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-11">
          <View className="flex-row gap-1.5">
            {stages.map((stg) => {
              const isSelected = activeStageId === stg.id;
              return (
                <Pressable
                  key={stg.id}
                  onPress={() => setActiveStageId(stg.id)}
                  className={`flex-row items-center gap-1.5 rounded-[12px] px-3 py-1.5 ${
                    isSelected ? 'bg-emerald-600' : palette.surface
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-white' : palette.text
                    }`}
                  >
                    {stg.title}
                  </Text>
                  <View
                    className={`rounded-full px-1.5 py-0.2 ${
                      isSelected ? 'bg-white/25' : 'bg-gray-500/15'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold ${
                        isSelected ? 'text-white' : palette.text
                      }`}
                    >
                      {stg.patients.length}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Active Stage Column Header */}
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <View
              style={{ backgroundColor: activeStage.color }}
              className="h-2.5 w-2.5 rounded-full"
            />
            <Text className={`text-[13px] font-bold ${palette.text}`}>
              Stage: {activeStage.title} ({activeStage.patients.length} Patients)
            </Text>
          </View>
          <Text className={`text-[10px] ${palette.textMuted}`}>Tap arrow to advance</Text>
        </View>

        {/* Patients In Selected Stage */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {activeStage.patients.map((p) => (
              <View
                key={p.id}
                className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-emerald-500/15">
                      <Ionicons name="person" size={17} color="#059669" />
                    </View>
                    <View>
                      <View className="flex-row items-center gap-1.5">
                        <Text className={`text-[14px] font-bold ${palette.text}`}>{p.name}</Text>
                        <View className="rounded bg-sky-500/15 px-1 py-0.2">
                          <Text className="text-[9px] font-bold text-sky-700">{p.token}</Text>
                        </View>
                      </View>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        {p.age} yrs • Assigned to {p.doctor}
                      </Text>
                    </View>
                  </View>

                  {/* Move Next Button */}
                  <Pressable
                    onPress={() => movePatientForward(activeStage.id, p.id)}
                    className="flex-row items-center gap-1 rounded-[10px] bg-emerald-600 px-2.5 py-1.5"
                  >
                    <Text className="text-[10px] font-bold text-white">Next Stage</Text>
                    <Ionicons name="arrow-forward" size={12} color="#ffffff" />
                  </Pressable>
                </View>

                {/* Condition Tag */}
                <View className={`mt-2 rounded-[10px] p-2 ${palette.surfaceInset}`}>
                  <Text className={`text-[10px] font-medium ${palette.text}`}>
                    Clinical Note: {p.condition}
                  </Text>
                </View>
              </View>
            ))}

            {activeStage.patients.length === 0 && (
              <View className={`items-center justify-center rounded-[16px] p-8 ${palette.surface}`}>
                <Ionicons name="git-network-outline" size={36} color={palette.textMutedColor} />
                <Text className={`mt-2 text-[13px] font-bold ${palette.text}`}>No patients in this stage</Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>
                  Advance patients from the previous stage or book new visits.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </AppScreen>
  );
}
