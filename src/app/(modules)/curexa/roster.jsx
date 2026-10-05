import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaRosterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { handovers, onCallDoctors, addHandoverLocally } = useCurexa();

  const [activeTab, setActiveTab] = useState('HANDOVERS'); // HANDOVERS | ON_CALL
  const [showAddHandover, setShowAddHandover] = useState(false);

  // Form State
  const [newShift, setNewShift] = useState('Evening -> Night Shift');
  const [newWard, setNewWard] = useState('ICU & Emergency');
  const [newSituation, setNewSituation] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [newAssessment, setNewAssessment] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');

  const handleSaveHandover = () => {
    if (!newSituation.trim()) {
      Alert.alert('Incomplete SBAR', 'Please fill in the Situation and Assessment fields.');
      return;
    }
    const h = {
      id: `h-${Date.now()}`,
      shift: newShift,
      ward: newWard,
      fromDoctor: 'Dr. Sarah Lin, MD',
      toDoctor: 'Dr. James Wilson, MD',
      timestamp: 'Just now',
      sbar: {
        situation: newSituation,
        background: newBackground || 'Patients stabilized on current management.',
        assessment: newAssessment || 'All parameters monitored regularly.',
        recommendation: newRecommendation || 'Routine night review at 10 PM.',
      },
    };
    addHandoverLocally(h);
    setShowAddHandover(false);
    Alert.alert('Shift Handover Saved', 'SBAR notes recorded in hospital handover log.');
    setNewSituation('');
    setNewBackground('');
    setNewAssessment('');
    setNewRecommendation('');
  };

  return (
    <AppScreen>
      <CurexaHeader title="Doctor Roster & Shift Handovers" subtitle="SBAR Handovers & On-Call Matrix" />

      {/* Tabs */}
      <View className="px-3 pt-2">
        <View className={`flex-row rounded-[14px] p-1 ${palette.surface}`}>
          {[
            { key: 'HANDOVERS', label: 'SBAR Shift Handovers', icon: 'swap-horizontal-outline' },
            { key: 'ON_CALL', label: 'On-Call Specialists', icon: 'medkit-outline' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-[10px] py-2 ${
                activeTab === tab.key ? 'bg-emerald-600' : 'bg-transparent'
              }`}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={activeTab === tab.key ? '#ffffff' : '#64748b'}
              />
              <Text
                className={`text-[11px] font-bold ${
                  activeTab === tab.key ? 'text-white' : palette.textMuted
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-3 pt-3 pb-24" showsVerticalScrollIndicator={false}>
        {/* ================= TAB 1: SBAR HANDOVERS ================= */}
        {activeTab === 'HANDOVERS' && (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">
                Clinical Shift Transfer Logs
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddHandover(true)}
                className="flex-row items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 shadow-sm"
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text className="text-[11px] font-bold text-white">Record SBAR</Text>
              </TouchableOpacity>
            </View>

            {handovers.map((h) => (
              <View
                key={h.id}
                className={`rounded-[16px] p-3.5 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>{h.shift}</Text>
                    <Text className={`text-[10.5px] ${palette.textMuted}`}>
                      {h.ward} • {h.timestamp}
                    </Text>
                  </View>
                  <View className="rounded bg-emerald-500/20 px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-emerald-700">COMPLETED</Text>
                  </View>
                </View>

                <View className={`rounded-[12px] p-2.5 mb-2 ${palette.surfaceInset}`}>
                  <Text className="text-[10px] font-bold text-emerald-600">
                    From: {h.fromDoctor} ➔ To: {h.toDoctor}
                  </Text>
                </View>

                {/* SBAR 4 Quadrants */}
                <View className="gap-1.5">
                  <View className="flex-row items-start gap-1.5">
                    <View className="rounded bg-rose-500/20 px-1.5 py-0.5">
                      <Text className="text-[9px] font-black text-rose-700 dark:text-rose-300">S</Text>
                    </View>
                    <Text className={`flex-1 text-[11px] ${palette.textSoft}`}>
                      <Text className="font-bold text-rose-600">Situation: </Text>
                      {h.sbar.situation}
                    </Text>
                  </View>

                  <View className="flex-row items-start gap-1.5">
                    <View className="rounded bg-sky-500/20 px-1.5 py-0.5">
                      <Text className="text-[9px] font-black text-sky-700 dark:text-sky-300">B</Text>
                    </View>
                    <Text className={`flex-1 text-[11px] ${palette.textSoft}`}>
                      <Text className="font-bold text-sky-600">Background: </Text>
                      {h.sbar.background}
                    </Text>
                  </View>

                  <View className="flex-row items-start gap-1.5">
                    <View className="rounded bg-amber-500/20 px-1.5 py-0.5">
                      <Text className="text-[9px] font-black text-amber-700 dark:text-amber-300">A</Text>
                    </View>
                    <Text className={`flex-1 text-[11px] ${palette.textSoft}`}>
                      <Text className="font-bold text-amber-600">Assessment: </Text>
                      {h.sbar.assessment}
                    </Text>
                  </View>

                  <View className="flex-row items-start gap-1.5">
                    <View className="rounded bg-emerald-500/20 px-1.5 py-0.5">
                      <Text className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">R</Text>
                    </View>
                    <Text className={`flex-1 text-[11px] ${palette.textSoft}`}>
                      <Text className="font-bold text-emerald-600">Recommendation: </Text>
                      {h.sbar.recommendation}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 2: ON-CALL ROSTER ================= */}
        {activeTab === 'ON_CALL' && (
          <View className="gap-2.5">
            <Text className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider mb-1">
              Active Hospital On-Call Specialist Directory
            </Text>

            {onCallDoctors.map((doc) => (
              <View
                key={doc.id}
                className={`flex-row items-center justify-between rounded-[16px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Ionicons name="medkit" size={18} color="#059669" />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className={`text-[13px] font-bold ${palette.text}`}>{doc.name}</Text>
                      <View className="rounded-full bg-emerald-500/20 px-1.5 py-0.2">
                        <Text className="text-[8.5px] font-bold text-emerald-700">
                          {doc.badge}
                        </Text>
                      </View>
                    </View>
                    <Text className={`text-[10.5px] ${palette.textMuted}`}>
                      {doc.specialty} • {doc.status}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => Alert.alert('Paging Doctor', `Emergency page sent to ${doc.name} (${doc.phone}).`)}
                  className="flex-row items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 shadow-sm"
                >
                  <Ionicons name="call" size={13} color="#fff" />
                  <Text className="text-[11px] font-bold text-white">Page Doctor</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* SBAR Shift Handover Modal */}
      <Modal visible={showAddHandover} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <Pressable className="absolute inset-0" onPress={() => setShowAddHandover(false)} />
          <View
            style={{
              maxHeight: '88%',
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            }}
            className={`rounded-t-[28px] p-4 ${palette.surface}`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="swap-horizontal" size={18} color="#059669" />
                <Text className={`text-[15px] font-bold ${palette.text}`}>
                  New SBAR Clinical Handover
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddHandover(false)}>
                <Ionicons name="close-circle" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="gap-2.5">
              <View>
                <Text className={`text-[10px] font-bold ${palette.textMuted}`}>
                  [S] SITUATION (Current status & critical patients)
                </Text>
                <TextInput
                  value={newSituation}
                  onChangeText={setNewSituation}
                  placeholder="e.g. 8 IPD patients in ICU, 1 pending ventilator weaning..."
                  placeholderTextColor="#94a3b8"
                  className={`rounded-[10px] p-2 text-[12px] mt-1 ${palette.surfaceInset} ${palette.text}`}
                />
              </View>

              <View>
                <Text className={`text-[10px] font-bold ${palette.textMuted}`}>
                  [B] BACKGROUND (Clinical history & interventions)
                </Text>
                <TextInput
                  value={newBackground}
                  onChangeText={setNewBackground}
                  placeholder="e.g. Post-Op day 2, stable hemodynamics..."
                  placeholderTextColor="#94a3b8"
                  className={`rounded-[10px] p-2 text-[12px] mt-1 ${palette.surfaceInset} ${palette.text}`}
                />
              </View>

              <View>
                <Text className={`text-[10px] font-bold ${palette.textMuted}`}>
                  [A] ASSESSMENT (Clinical impressions & pending labs)
                </Text>
                <TextInput
                  value={newAssessment}
                  onChangeText={setNewAssessment}
                  placeholder="e.g. Arterial blood gas pending at 6 PM..."
                  placeholderTextColor="#94a3b8"
                  className={`rounded-[10px] p-2 text-[12px] mt-1 ${palette.surfaceInset} ${palette.text}`}
                />
              </View>

              <View>
                <Text className={`text-[10px] font-bold ${palette.textMuted}`}>
                  [R] RECOMMENDATION (Action items for next shift doctor)
                </Text>
                <TextInput
                  value={newRecommendation}
                  onChangeText={setNewRecommendation}
                  placeholder="e.g. Check repeat potassium; if < 3.5, replace IV..."
                  placeholderTextColor="#94a3b8"
                  className={`rounded-[10px] p-2 text-[12px] mt-1 ${palette.surfaceInset} ${palette.text}`}
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveHandover}
                className="rounded-[14px] bg-emerald-600 py-3 items-center mt-3 mb-6"
              >
                <Text className="text-[13px] font-bold text-white">Record SBAR Handover</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
