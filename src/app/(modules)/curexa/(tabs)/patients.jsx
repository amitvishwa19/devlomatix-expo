import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';
import { AddPatientModal, PatientDetailModal } from '../_components/CurexaModals';

export default function CurexaPatientsScreen() {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const {
    portalMode,
    currentPatientProfile,
    prescriptions,
    patients,
    addPatientLocally,
    selectedPatient,
    showPatientDetail,
    setShowPatientDetail,
    viewPatientDetails,
  } = useCurexa();

  const isPatient = portalMode === 'PATIENT';

  // Hospital View State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Patient View State
  const [patientTab, setPatientTab] = useState('TIMELINE'); // 'TIMELINE' | 'PRESCRIPTIONS' | 'LABS' | 'VITALS'
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null);

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

  // Patient Medical Timeline Data
  const medicalTimeline = [
    {
      id: 'EVT-101',
      title: 'Cardiology Consultation & ECG',
      doctor: 'Dr. Sarah Lin, MD (Cardiology)',
      date: 'Today • 09:30 AM',
      type: 'OPD_VISIT',
      status: 'In Progress',
      summary: 'Follow-up review post-stent placement. Blood pressure controlled. Regular walking advised.',
      badgeColor: 'bg-sky-500/20 text-sky-700',
      icon: 'heart-pulse',
      iconColor: '#0284c7',
    },
    {
      id: 'EVT-102',
      title: 'Complete Blood Panel (CBC + Lipid)',
      doctor: 'Curexa Central Diagnostics',
      date: 'Today • 08:30 AM',
      type: 'LAB_REPORT',
      status: 'Completed',
      summary: 'Lipid profile shows Total Cholesterol 188 mg/dL. Hemoglobin normal at 13.8 g/dL.',
      badgeColor: 'bg-emerald-500/20 text-emerald-700',
      icon: 'flask',
      iconColor: '#059669',
    },
    {
      id: 'EVT-103',
      title: 'Hospital Discharge Summary (Ward 3B)',
      doctor: 'Dr. Sarah Lin • Attending Physician',
      date: 'Sep 14, 2026',
      type: 'ADMISSION',
      status: 'Discharged Stable',
      summary: '48-hour post-procedure observation in Room 302. Patient recovered well with zero complications.',
      badgeColor: 'bg-purple-500/20 text-purple-700',
      icon: 'business',
      iconColor: '#9333ea',
    },
    {
      id: 'EVT-104',
      title: 'Telemedicine Follow-Up Consultation',
      doctor: 'Dr. Rachel Patel, MD',
      date: 'Aug 22, 2026',
      type: 'TELEMEDICINE',
      status: 'Completed',
      summary: 'Virtual discussion regarding medication tolerance and routine prenatal vitamins review.',
      badgeColor: 'bg-blue-500/20 text-blue-700',
      icon: 'videocam',
      iconColor: '#2563eb',
    },
  ];

  const vitalsHistory = [
    { date: 'Today, 08:45 AM', bp: '128/84', hr: '76 bpm', spo2: '98%', temp: '98.6 °F', weight: '64 kg' },
    { date: 'Sep 14, 2026', bp: '124/82', hr: '74 bpm', spo2: '99%', temp: '98.4 °F', weight: '64.2 kg' },
    { date: 'Sep 12, 2026', bp: '136/88', hr: '82 bpm', spo2: '97%', temp: '99.0 °F', weight: '64.5 kg' },
    { date: 'Aug 22, 2026', bp: '120/80', hr: '70 bpm', spo2: '99%', temp: '98.6 °F', weight: '63.8 kg' },
  ];

  return (
    <AppScreen>
      <CurexaHeader
        title={isPatient ? 'My Health Records' : 'Patient EMR Directory'}
        subtitle={
          isPatient
            ? `${currentPatientProfile.displayName} • Health History`
            : `${filteredPatients.length} Patients Recorded`
        }
        rightAction={
          isPatient ? (
            <Pressable
              onPress={() => Alert.alert('Share Health Record', 'Generated secure 24-hour EMR share link: https://curexa.health/share/CUX-889102')}
              className="flex-row items-center gap-1 rounded-[12px] bg-sky-600 px-2.5 py-1.5 shadow-sm"
            >
              <Ionicons name="share-social-outline" size={14} color="#ffffff" />
              <Text className="text-[11px] font-bold text-white">Share EMR</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="flex-row items-center gap-1 rounded-[12px] bg-emerald-600 px-2.5 py-1.5"
            >
              <Ionicons name="person-add" size={14} color="#ffffff" />
              <Text className="text-[11px] font-bold text-white">Add Patient</Text>
            </Pressable>
          )
        }
      />

      {isPatient ? (
        /* ========================================================================= */
        /*                       PATIENT HEALTH RECORDS VIEW                         */
        /* ========================================================================= */
        <View className="flex-1 px-3 pt-2">
          {/* Patient Subtabs */}
          <View className={`mb-2 flex-row rounded-[14px] p-1 ${palette.surface}`}>
            {[
              { key: 'TIMELINE', label: 'Timeline', icon: 'git-commit-outline' },
              { key: 'PRESCRIPTIONS', label: 'e-Rx Prescriptions', icon: 'document-text-outline' },
              { key: 'LABS', label: 'Diagnostics', icon: 'flask-outline' },
              { key: 'VITALS', label: 'Vitals Trends', icon: 'analytics-outline' },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setPatientTab(tab.key)}
                className={`flex-1 flex-row items-center justify-center gap-1 rounded-[10px] py-1.5 ${
                  patientTab === tab.key ? 'bg-sky-600 shadow-sm' : 'transparent'
                }`}
              >
                <Ionicons
                  name={tab.icon}
                  size={13}
                  color={patientTab === tab.key ? '#ffffff' : palette.textMutedColor}
                />
                <Text
                  className={`text-[10.5px] font-bold ${
                    patientTab === tab.key ? 'text-white' : palette.textMuted
                  }`}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
            {/* TAB: TIMELINE */}
            {patientTab === 'TIMELINE' && (
              <View className="gap-2.5">
                {medicalTimeline.map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedTimelineItem(item)}
                    className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center gap-2.5">
                        <View
                          style={{ backgroundColor: `${item.iconColor}20` }}
                          className="h-9 w-9 items-center justify-center rounded-[14px]"
                        >
                          <Ionicons name={item.icon} size={17} color={item.iconColor} />
                        </View>
                        <View className="flex-1 mr-2">
                          <Text className={`text-[13px] font-bold ${palette.text}`}>{item.title}</Text>
                          <Text className={`text-[10px] ${palette.textMuted}`}>
                            {item.doctor} • {item.date}
                          </Text>
                        </View>
                      </View>
                      <View className={`rounded-full px-2 py-0.5 ${item.badgeColor.split(' ')[0]}`}>
                        <Text className={`text-[9px] font-bold ${item.badgeColor.split(' ')[1]}`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <View className={`mt-2 rounded-[10px] p-2 ${palette.surfaceInset}`}>
                      <Text className={`text-[11px] leading-4 ${palette.text}`}>{item.summary}</Text>
                    </View>

                    <View className="mt-2 flex-row items-center justify-between border-t border-gray-200/15 pt-1.5">
                      <Text className="text-[10px] font-bold text-sky-600">Tap to View Full Clinical Note</Text>
                      <Ionicons name="chevron-forward" size={13} color="#0284c7" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* TAB: PRESCRIPTIONS */}
            {patientTab === 'PRESCRIPTIONS' && (
              <View className="gap-2">
                {prescriptions.map((rx) => (
                  <View key={rx.id} className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
                    <View className="flex-row items-center justify-between border-b border-gray-200/15 pb-2">
                      <View>
                        <Text className={`text-[13px] font-bold ${palette.text}`}>{rx.diagnosis}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {rx.doctorName} • {rx.prescribedAt}
                        </Text>
                      </View>
                      <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-emerald-700">{rx.status}</Text>
                      </View>
                    </View>

                    <View className="my-2 gap-1.5">
                      {rx.medicines.map((m, i) => (
                        <View key={i} className={`rounded-[10px] p-2 flex-row justify-between ${palette.surfaceInset}`}>
                          <View>
                            <Text className={`text-[11.5px] font-bold ${palette.text}`}>{m.name}</Text>
                            <Text className={`text-[9.5px] ${palette.textMuted}`}>
                              {m.dosage} • {m.timing}
                            </Text>
                          </View>
                          <Text className="text-[10px] font-medium text-sky-600">{m.duration}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => Alert.alert('Download e-Rx', `Downloading official e-Prescription ${rx.id} PDF...`)}
                      className="flex-row items-center justify-center gap-1.5 rounded-[10px] bg-purple-600/15 py-2"
                    >
                      <Ionicons name="download-outline" size={14} color="#8b5cf6" />
                      <Text className="text-[11px] font-bold text-purple-700">Download Verified e-Rx PDF</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* TAB: LABS */}
            {patientTab === 'LABS' && (
              <View className="gap-2">
                {[
                  {
                    id: 'LAB-901',
                    name: 'Comprehensive Blood Panel (CBC + Lipid Profile)',
                    date: 'Today, 08:30 AM',
                    doctor: 'Dr. Sarah Lin',
                    status: 'Completed',
                    results: [
                      { test: 'Hemoglobin', value: '13.8 g/dL', status: 'Normal' },
                      { test: 'Total Cholesterol', value: '188 mg/dL', status: 'Normal' },
                      { test: 'HDL Cholesterol', value: '54 mg/dL', status: 'Optimal' },
                      { test: 'Triglycerides', value: '142 mg/dL', status: 'Normal' },
                    ],
                  },
                  {
                    id: 'LAB-902',
                    name: 'Non-Contrast Brain CT Scan Report',
                    date: 'Sep 14, 2026',
                    doctor: 'Dr. Mark Bennett',
                    status: 'Completed',
                    results: [
                      { test: 'Ventricular System', value: 'Normal Calibre', status: 'Normal' },
                      { test: 'Intracranial Hemorrhage', value: 'Negative / Absent', status: 'Clear' },
                    ],
                  },
                ].map((lab) => (
                  <View key={lab.id} className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
                    <View className="flex-row items-center justify-between border-b border-gray-200/15 pb-2">
                      <View>
                        <Text className={`text-[13px] font-bold ${palette.text}`}>{lab.name}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {lab.doctor} • {lab.date}
                        </Text>
                      </View>
                      <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-emerald-700">{lab.status}</Text>
                      </View>
                    </View>

                    <View className="my-2 gap-1.5">
                      {lab.results.map((r, i) => (
                        <View key={i} className={`flex-row items-center justify-between rounded-[8px] p-2 ${palette.surfaceInset}`}>
                          <Text className={`text-[11px] font-medium ${palette.text}`}>{r.test}</Text>
                          <View className="flex-row items-center gap-1.5">
                            <Text className={`text-[11px] font-bold ${palette.text}`}>{r.value}</Text>
                            <View className="rounded bg-emerald-500/15 px-1 py-0.2">
                              <Text className="text-[8.5px] font-bold text-emerald-700">{r.status}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => Alert.alert('Download Lab PDF', `Downloading Lab Report ${lab.id} PDF...`)}
                      className="flex-row items-center justify-center gap-1.5 rounded-[10px] bg-cyan-600/15 py-2"
                    >
                      <Ionicons name="download-outline" size={14} color="#06b6d4" />
                      <Text className="text-[11px] font-bold text-cyan-700">Download Diagnostic Report PDF</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* TAB: VITALS */}
            {patientTab === 'VITALS' && (
              <View className="gap-2">
                <View className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
                  <Text className={`text-[12px] font-bold uppercase tracking-[0.8px] text-teal-600 mb-2`}>
                    Biometric & Vitals Timeline
                  </Text>
                  <View className="gap-2">
                    {vitalsHistory.map((v, idx) => (
                      <View key={idx} className={`rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
                        <View className="flex-row items-center justify-between mb-1.5 border-b border-gray-200/15 pb-1">
                          <Text className="text-[11px] font-bold text-sky-600">{v.date}</Text>
                          <Text className={`text-[10px] ${palette.textMuted}`}>Weight: {v.weight}</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <View className="items-center">
                            <Text className={`text-[9px] ${palette.textMuted}`}>BP</Text>
                            <Text className={`text-[12px] font-bold ${palette.text}`}>{v.bp}</Text>
                          </View>
                          <View className="items-center">
                            <Text className={`text-[9px] ${palette.textMuted}`}>Pulse</Text>
                            <Text className={`text-[12px] font-bold ${palette.text}`}>{v.hr}</Text>
                          </View>
                          <View className="items-center">
                            <Text className={`text-[9px] ${palette.textMuted}`}>SpO2</Text>
                            <Text className={`text-[12px] font-bold ${palette.text}`}>{v.spo2}</Text>
                          </View>
                          <View className="items-center">
                            <Text className={`text-[9px] ${palette.textMuted}`}>Temp</Text>
                            <Text className={`text-[12px] font-bold ${palette.text}`}>{v.temp}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        /* ========================================================================= */
        /*                       HOSPITAL PATIENT DIRECTORY VIEW                     */
        /* ========================================================================= */
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
      )}

      {/* Patient Timeline Detail Modal */}
      {selectedTimelineItem && (
        <Modal
          visible={!!selectedTimelineItem}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTimelineItem(null)}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View
              className={`rounded-t-[24px] p-4 ${palette.surface}`}
              style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
            >
              <View className="flex-row items-center justify-between pb-3 border-b border-gray-200/15">
                <Text className={`text-[15px] font-bold ${palette.text}`}>Medical Record Entry</Text>
                <Pressable onPress={() => setSelectedTimelineItem(null)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                  <Ionicons name="close" size={16} color={palette.textMutedColor} />
                </Pressable>
              </View>

              <View className={`my-3 rounded-[16px] p-3.5 border ${palette.border} ${palette.surfaceInset}`}>
                <Text className={`text-[14px] font-bold ${palette.text}`}>{selectedTimelineItem.title}</Text>
                <Text className={`text-[11px] ${palette.textMuted} mb-2`}>
                  {selectedTimelineItem.doctor} • {selectedTimelineItem.date}
                </Text>

                <View className="rounded-[10px] bg-white/60 dark:bg-black/20 p-2.5 mb-2">
                  <Text className="text-[10px] font-bold text-sky-600 uppercase mb-0.5">Clinical Findings & Summary</Text>
                  <Text className={`text-[11.5px] leading-4 ${palette.text}`}>{selectedTimelineItem.summary}</Text>
                </View>

                <Text className={`text-[10px] ${palette.textMuted}`}>
                  Verified by Curexa EMR Audit Log • Encrypted Record
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    Alert.alert('Download Record', 'Downloading official record summary PDF...');
                    setSelectedTimelineItem(null);
                  }}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[12px] bg-sky-600 py-2.5"
                >
                  <Ionicons name="download-outline" size={16} color="#ffffff" />
                  <Text className="text-[12px] font-bold text-white">Download Clinical Summary</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedTimelineItem(null)}
                  className={`rounded-[12px] px-4 py-2.5 ${palette.surfaceInset}`}
                >
                  <Text className={`text-[12px] font-medium ${palette.text}`}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modals for Hospital */}
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
