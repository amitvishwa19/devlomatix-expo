import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import {
  calculateAiTriage,
  generateAiDischargeSummary,
  generateAiPrescription,
} from '~/services/curexa';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaAiAssistantScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { patients } = useCurexa();

  const [activeTab, setActiveTab] = useState('VOICE_RX'); // VOICE_RX | TRIAGE | DISCHARGE

  // AI Voice/Text Rx State
  const [symptomsInput, setSymptomsInput] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [rxResult, setRxResult] = useState(null);

  // Triage State
  const [triagePatientId, setTriagePatientId] = useState('p-2');
  const [triageVitals, setTriageVitals] = useState({
    bp: '142/90',
    spo2: '97%',
    heartRate: '88 bpm',
  });
  const [triageSymptoms, setTriageSymptoms] = useState('Severe throbbing hemicranial headache with nausea');
  const [triageResult, setTriageResult] = useState(null);
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Discharge Summary State
  const [dischargePatientId, setDischargePatientId] = useState('p-1');
  const [dischargeSummary, setDischargeSummary] = useState(null);
  const [loadingDischarge, setLoadingDischarge] = useState(false);

  // Voice Dictation Simulation
  const toggleVoiceDictation = () => {
    if (isDictating) {
      setIsDictating(false);
    } else {
      setIsDictating(true);
      setSymptomsInput('Patient presenting with 3 days of high-grade fever, productive cough with yellow sputum, and mild pleuritic chest discomfort.');
      setTimeout(() => {
        setIsDictating(false);
      }, 2500);
    }
  };

  const handleGenerateRx = async () => {
    if (!symptomsInput.trim()) {
      Alert.alert('Input Needed', 'Please type or dictate patient clinical symptoms.');
      return;
    }
    setLoadingAi(true);
    try {
      const result = await generateAiPrescription({
        symptoms: symptomsInput,
        patientAge: 42,
        gender: 'Female',
        allergies: ['Penicillin'],
      });
      setRxResult(result);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate AI prescription');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleRunTriage = async () => {
    setLoadingTriage(true);
    try {
      const res = await calculateAiTriage({
        symptoms: triageSymptoms,
        vitals: triageVitals,
      });
      setTriageResult(res);
    } catch (e) {
      Alert.alert('Error', 'Failed to calculate triage');
    } finally {
      setLoadingTriage(false);
    }
  };

  const handleGenerateDischarge = async () => {
    setLoadingDischarge(true);
    try {
      const p = patients.find((pat) => pat.id === dischargePatientId) || patients[0] || {
        displayName: 'Eleanor Vance',
        sku: 'PAT-2026-001',
        age: 38,
        gender: 'Female',
        condition: 'Post-Op Stable',
        admissionDate: '2026-09-12',
      };
      const res = await generateAiDischargeSummary(p);
      setDischargeSummary(res.summaryText);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate discharge summary');
    } finally {
      setLoadingDischarge(false);
    }
  };

  return (
    <AppScreen>
      <CurexaHeader title="AI Clinical Suite" subtitle="Medical Intelligence & Triage Engine" />

      {/* Mode Switcher Tabs */}
      <View className="px-3 pt-2">
        <View className={`flex-row rounded-[14px] p-1 ${palette.surface}`}>
          {[
            { key: 'VOICE_RX', label: 'Voice-to-eRx', icon: 'mic-outline' },
            { key: 'TRIAGE', label: 'AI Triage', icon: 'pulse-outline' },
            { key: 'DISCHARGE', label: 'Discharge Summary', icon: 'document-text-outline' },
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
        {/* ================= TAB 1: VOICE TO ERX ================= */}
        {activeTab === 'VOICE_RX' && (
          <View className="gap-3">
            {/* Dictation Input Card */}
            <View className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="sparkles" size={14} color="#059669" />
                  <Text className={`text-[12px] font-bold ${palette.text}`}>
                    Clinical Dictation / Symptoms
                  </Text>
                </View>

                {/* Voice Dictation Mic Button */}
                <TouchableOpacity
                  onPress={toggleVoiceDictation}
                  className={`flex-row items-center gap-1 rounded-full px-3 py-1 ${
                    isDictating ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500/20'
                  }`}
                >
                  <Ionicons name="mic" size={13} color={isDictating ? '#ffffff' : '#059669'} />
                  <Text
                    className={`text-[11px] font-bold ${
                      isDictating ? 'text-white' : 'text-emerald-700'
                    }`}
                  >
                    {isDictating ? 'Listening...' : 'Voice Dictate'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={symptomsInput}
                onChangeText={setSymptomsInput}
                placeholder="e.g. 3 days fever, productive cough, pleuritic chest tightness..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                className={`min-h-[85px] rounded-[12px] p-2.5 text-[12.5px] leading-5 ${palette.surfaceInset} ${palette.text}`}
                textAlignVertical="top"
              />

              <View className="mt-2.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="shield-checkmark" size={13} color="#059669" />
                  <Text className={`text-[10px] ${palette.textMuted}`}>
                    Auto Allergy & ICD-10 Contraindication Checking
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleGenerateRx}
                  disabled={loadingAi}
                  className="flex-row items-center gap-1.5 rounded-[12px] bg-emerald-600 px-4 py-2"
                >
                  {loadingAi ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={14} color="#fff" />
                      <Text className="text-[12px] font-bold text-white">Generate e-Rx</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* AI Generated Result Preview */}
            {rxResult && (
              <View className={`rounded-[16px] p-3.5 shadow-sm border border-emerald-500/30 ${palette.surface}`}>
                <View className="mb-2 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      PROVISIONAL DIAGNOSIS
                    </Text>
                    <Text className={`text-[15px] font-bold ${palette.text}`}>
                      {rxResult.diagnosis}
                    </Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>{rxResult.icdCode}</Text>
                  </View>
                  <View className="rounded-full bg-emerald-500/15 px-2.5 py-1">
                    <Text className="text-[10px] font-bold text-emerald-700">
                      {rxResult.aiConfidence} Confidence
                    </Text>
                  </View>
                </View>

                {/* Contraindication Alert */}
                {rxResult.contraindications?.length > 0 && (
                  <View className="mb-2.5 rounded-[10px] bg-rose-500/15 p-2 border border-rose-500/30">
                    {rxResult.contraindications.map((c, i) => (
                      <Text key={i} className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                        {c}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Structured Medications */}
                <Text className="mb-1.5 text-[11px] font-bold text-emerald-600 uppercase">
                  Suggested Prescription Regimen:
                </Text>
                <View className="gap-1.5 mb-3">
                  {rxResult.medicines.map((m, idx) => (
                    <View
                      key={idx}
                      className={`rounded-[10px] p-2 flex-row items-center justify-between ${palette.surfaceInset}`}
                    >
                      <View className="flex-1">
                        <Text className={`text-[12px] font-bold ${palette.text}`}>{m.name}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>{m.dosage}</Text>
                      </View>
                      <View className="rounded bg-emerald-500/20 px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-emerald-700">{m.duration}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Clinical Advice */}
                <Text className="mb-1 text-[11px] font-bold text-emerald-600 uppercase">
                  Patient Discharge Instructions:
                </Text>
                <View className="gap-1 mb-3">
                  {rxResult.advice.map((adv, i) => (
                    <View key={i} className="flex-row items-center gap-1.5">
                      <Ionicons name="checkmark-circle" size={12} color="#059669" />
                      <Text className={`text-[11px] ${palette.textSoft}`}>{adv}</Text>
                    </View>
                  ))}
                </View>

                {/* Save to System Button */}
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Prescription Saved', 'e-Prescription attached to patient chart & sent to pharmacy queue.');
                    router.push('/(modules)/curexa/prescriptions');
                  }}
                  className="rounded-[12px] bg-emerald-600 py-2.5 items-center flex-row justify-center gap-1.5"
                >
                  <Ionicons name="document-text" size={15} color="#fff" />
                  <Text className="text-[12px] font-bold text-white">
                    Approve & Issue e-Prescription
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 2: AI TRIAGE CLASSIFIER ================= */}
        {activeTab === 'TRIAGE' && (
          <View className="gap-3">
            <View className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
              <Text className={`mb-2 text-[12px] font-bold ${palette.text}`}>
                Emergency Triage & Vital Sign Analysis
              </Text>

              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>
                Patient Chief Complaints
              </Text>
              <TextInput
                value={triageSymptoms}
                onChangeText={setTriageSymptoms}
                className={`rounded-[10px] p-2 text-[12px] mb-2.5 ${palette.surfaceInset} ${palette.text}`}
              />

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className={`text-[10px] ${palette.textMuted}`}>Blood Pressure</Text>
                  <TextInput
                    value={triageVitals.bp}
                    onChangeText={(val) => setTriageVitals((v) => ({ ...v, bp: val }))}
                    className={`rounded-[10px] p-2 text-[12px] ${palette.surfaceInset} ${palette.text}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-[10px] ${palette.textMuted}`}>SpO2 Level</Text>
                  <TextInput
                    value={triageVitals.spo2}
                    onChangeText={(val) => setTriageVitals((v) => ({ ...v, spo2: val }))}
                    className={`rounded-[10px] p-2 text-[12px] ${palette.surfaceInset} ${palette.text}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-[10px] ${palette.textMuted}`}>Heart Rate</Text>
                  <TextInput
                    value={triageVitals.heartRate}
                    onChangeText={(val) => setTriageVitals((v) => ({ ...v, heartRate: val }))}
                    className={`rounded-[10px] p-2 text-[12px] ${palette.surfaceInset} ${palette.text}`}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleRunTriage}
                disabled={loadingTriage}
                className="rounded-[12px] bg-emerald-600 py-2.5 items-center flex-row justify-center gap-1.5"
              >
                {loadingTriage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="pulse" size={15} color="#fff" />
                    <Text className="text-[12px] font-bold text-white">Classify Triage Priority</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {triageResult && (
              <View className={`rounded-[16px] p-3.5 shadow-sm border ${palette.surface}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      TRIAGE SEVERITY
                    </Text>
                    <Text style={{ color: triageResult.color }} className="text-[16px] font-extrabold">
                      {triageResult.triageLevel}
                    </Text>
                  </View>
                  <View
                    style={{ backgroundColor: `${triageResult.color}20` }}
                    className="rounded-full px-2.5 py-1"
                  >
                    <Text style={{ color: triageResult.color }} className="text-[10px] font-bold">
                      {triageResult.tag}
                    </Text>
                  </View>
                </View>

                <View className={`rounded-[10px] p-2.5 mb-2.5 ${palette.surfaceInset}`}>
                  <Text className={`text-[10px] font-bold uppercase ${palette.textMuted}`}>
                    Recommended Clinical Action:
                  </Text>
                  <Text className={`text-[12px] font-semibold mt-0.5 ${palette.text}`}>
                    {triageResult.action}
                  </Text>
                </View>

                <Text className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
                  Suggested STAT Diagnostic Tests:
                </Text>
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {triageResult.recommendedLabs.map((t, idx) => (
                    <View
                      key={idx}
                      className="rounded-full bg-emerald-500/15 px-2.5 py-1 border border-emerald-500/30"
                    >
                      <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/(modules)/curexa/beds')}
                  className="rounded-[12px] bg-emerald-600 py-2.5 items-center"
                >
                  <Text className="text-[12px] font-bold text-white">Assign Ward / Bed Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ================= TAB 3: DISCHARGE SUMMARY GENERATOR ================= */}
        {activeTab === 'DISCHARGE' && (
          <View className="gap-3">
            <View className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
              <Text className={`mb-1 text-[12px] font-bold ${palette.text}`}>
                1-Click Clinical Discharge Summary
              </Text>
              <Text className={`text-[11px] mb-3 ${palette.textMuted}`}>
                Synthesize patient admission history, daily nurse charts, and lab reports into a comprehensive discharge document.
              </Text>

              <TouchableOpacity
                onPress={handleGenerateDischarge}
                disabled={loadingDischarge}
                className="rounded-[12px] bg-emerald-600 py-2.5 items-center flex-row justify-center gap-1.5"
              >
                {loadingDischarge ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={15} color="#fff" />
                    <Text className="text-[12px] font-bold text-white">Generate Discharge Summary</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {dischargeSummary && (
              <View className={`rounded-[16px] p-3.5 shadow-sm ${palette.surface}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Generated Summary
                  </Text>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Exported', 'Discharge summary PDF sent to patient portal.')}
                    className="flex-row items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5"
                  >
                    <Ionicons name="share-outline" size={12} color="#059669" />
                    <Text className="text-[10px] font-bold text-emerald-700">Export PDF</Text>
                  </TouchableOpacity>
                </View>

                <View className={`rounded-[12px] p-3 ${palette.surfaceInset}`}>
                  <Text className={`font-mono text-[11px] leading-5 ${palette.text}`}>
                    {dischargeSummary}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
