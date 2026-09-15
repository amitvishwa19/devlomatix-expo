import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

/**
 * 1. 360° Patient Detail & EMR Modal
 */
export function PatientDetailModal({ patient, visible, onClose }) {
  const { palette } = useAppTheme();
  const [activeTab, setActiveTab] = useState('vitals');

  if (!patient) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[88%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
          {/* Header */}
          <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2.5">
            <View className="flex-row items-center gap-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-[14px] bg-emerald-500/15">
                <Ionicons name="person-outline" size={18} color="#059669" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className={`text-[15px] font-bold ${palette.text}`}>{patient.displayName || patient.name}</Text>
                  <View className="rounded-full bg-emerald-500/20 px-1.5 py-0.2">
                    <Text className="text-[9px] font-bold text-emerald-600">{patient.bloodGroup || 'O+'}</Text>
                  </View>
                </View>
                <Text className={`text-[11px] ${palette.textMuted}`}>
                  {patient.gender || 'Female'} • {patient.age || 38} yrs • {patient.sku || `ID: ${patient.id}`}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          {/* Quick Action Contact Bar */}
          <View className="mb-2.5 flex-row gap-2">
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[12px] bg-emerald-600 py-2">
              <Ionicons name="call-outline" size={14} color="#ffffff" />
              <Text className="text-[11px] font-bold text-white">Call Patient</Text>
            </Pressable>
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[12px] bg-sky-600 py-2">
              <Ionicons name="logo-whatsapp" size={14} color="#ffffff" />
              <Text className="text-[11px] font-bold text-white">WhatsApp</Text>
            </Pressable>
            <Pressable className={`flex-row items-center justify-center rounded-[12px] px-3 py-2 ${palette.surfaceAlt}`}>
              <Ionicons name="document-text-outline" size={14} color={palette.textColor} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View className="mb-2.5 flex-row gap-1 rounded-[12px] bg-gray-500/10 p-1">
            {[
              { key: 'vitals', label: 'Vitals' },
              { key: 'history', label: 'History' },
              { key: 'allergies', label: 'Allergies' },
              { key: 'rx', label: 'Rx & Labs' },
            ].map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                className={`flex-1 items-center rounded-[10px] py-1.5 ${
                  activeTab === t.key ? 'bg-emerald-600' : 'transparent'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    activeTab === t.key ? 'text-white' : palette.textMuted
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Content Area */}
          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            {activeTab === 'vitals' && (
              <View className="gap-2">
                <View className="flex-row gap-2">
                  <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="heart" size={13} color="#ef4444" />
                      <Text className={`text-[10px] ${palette.textMuted}`}>Heart Rate</Text>
                    </View>
                    <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>
                      {patient.vitals?.heartRate || '76'} <Text className="text-[10px] font-normal">bpm</Text>
                    </Text>
                  </View>
                  <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="speedometer-outline" size={13} color="#3b82f6" />
                      <Text className={`text-[10px] ${palette.textMuted}`}>Blood Pressure</Text>
                    </View>
                    <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>
                      {patient.vitals?.bp || '128/84'} <Text className="text-[10px] font-normal">mmHg</Text>
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="thermometer-outline" size={13} color="#f59e0b" />
                      <Text className={`text-[10px] ${palette.textMuted}`}>Temperature</Text>
                    </View>
                    <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>
                      {patient.vitals?.temperature || '98.6 °F'}
                    </Text>
                  </View>
                  <View className={`flex-1 rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="water-outline" size={13} color="#06b6d4" />
                      <Text className={`text-[10px] ${palette.textMuted}`}>Oxygen (SpO2)</Text>
                    </View>
                    <Text className={`mt-0.5 text-[16px] font-bold ${palette.text}`}>
                      {patient.vitals?.spo2 || '98%'}
                    </Text>
                  </View>
                </View>

                <View className={`rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                  <Text className={`text-[10px] uppercase font-bold text-emerald-600`}>Clinical Status</Text>
                  <Text className={`mt-1 text-[12px] font-medium ${palette.text}`}>
                    {patient.condition || 'Under post-op monitoring. Vitals stable.'}
                  </Text>
                  <Text className={`mt-0.5 text-[10px] ${palette.textMuted}`}>
                    Assigned Ward: {patient.ward || 'Cardiology 3B'} • Bed: {patient.bed || 'Bed 302'}
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'history' && (
              <View className="gap-2">
                <View className={`rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                  <Text className={`text-[10px] uppercase font-bold text-sky-600`}>Chronic Conditions</Text>
                  <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                    {(patient.chronicConditions || ['Hypertension', 'Type 2 Diabetes']).map((c, i) => (
                      <View key={i} className="rounded-[8px] bg-sky-500/15 px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-sky-600">{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className={`rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                  <Text className={`text-[10px] uppercase font-bold text-purple-600`}>Insurance & TPA</Text>
                  <Text className={`mt-1 text-[12px] font-semibold ${palette.text}`}>
                    {patient.insurance?.provider || 'Blue Cross Blue Shield'}
                  </Text>
                  <Text className={`text-[11px] ${palette.textMuted}`}>
                    Policy #{patient.insurance?.policyNumber || 'BCS-9923841'} (Coverage: {patient.insurance?.coverage || '80%'})
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'allergies' && (
              <View className="gap-2">
                <View className={`rounded-[14px] p-2.5 border border-red-500/30 bg-red-500/10`}>
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="warning-outline" size={14} color="#ef4444" />
                    <Text className="text-[11px] font-bold text-red-600">Documented Drug Allergies</Text>
                  </View>
                  <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                    {(patient.allergies || ['Penicillin', 'Sulfa Drugs']).map((a, i) => (
                      <View key={i} className="rounded-[8px] bg-red-500/20 px-2 py-0.5">
                        <Text className="text-[11px] font-bold text-red-600">{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'rx' && (
              <View className="gap-2">
                <View className={`rounded-[14px] p-2.5 ${palette.surfaceInset}`}>
                  <Text className={`text-[11px] font-bold ${palette.text}`}>Active Medications</Text>
                  <View className="mt-1.5 gap-1.5">
                    <View className="flex-row items-center justify-between border-b border-gray-200/10 pb-1">
                      <Text className={`text-[11px] font-medium ${palette.text}`}>Atorvastatin 20mg</Text>
                      <Text className="text-[10px] font-bold text-emerald-600">1 - 0 - 1 (After Food)</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-[11px] font-medium ${palette.text}`}>Metformin 500mg ER</Text>
                      <Text className="text-[10px] font-bold text-emerald-600">0 - 1 - 0 (Morning)</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close CTA */}
          <Pressable onPress={onClose} className="rounded-[12px] bg-gray-500/15 py-2.5 items-center">
            <Text className={`text-[12px] font-bold ${palette.text}`}>Close Sheet</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 2. Add New Patient Modal
 */
export function AddPatientModal({ visible, onClose, onSave }) {
  const { palette } = useAppTheme();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [condition, setCondition] = useState('');

  const handleSave = () => {
    if (!fullName || !phone) return;
    const newP = {
      id: `p-${Date.now()}`,
      sku: `PAT-2026-${Math.floor(100 + Math.random() * 900)}`,
      displayName: fullName,
      phone,
      gender,
      age: parseInt(age) || 30,
      bloodGroup,
      condition: condition || 'Routine Checkup',
      status: 'Outpatient',
      ward: 'None',
      bed: 'N/A',
      vitals: { bp: '120/80', heartRate: '74 bpm', temperature: '98.6 °F', spo2: '99%' },
    };
    onSave && onSave(newP);
    onClose();
    setFullName('');
    setPhone('');
    setAge('');
    setCondition('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[88%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
          <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
            <Text className={`text-[15px] font-bold ${palette.text}`}>Register New Patient</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            <View className="gap-2">
              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Full Name *</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Johnathan Davis"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Phone Number *</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                  />
                </View>
                <View className="w-24">
                  <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Age</Text>
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="35"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                  />
                </View>
              </View>

              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Gender</Text>
                <View className="flex-row gap-1.5">
                  {['Female', 'Male', 'Other'].map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setGender(g)}
                      className={`flex-1 items-center rounded-[10px] py-1.5 ${
                        gender === g ? 'bg-emerald-600' : palette.surfaceInset
                      }`}
                    >
                      <Text className={`text-[11px] font-semibold ${gender === g ? 'text-white' : palette.text}`}>
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Blood Group</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+'].map((bg) => (
                    <Pressable
                      key={bg}
                      onPress={() => setBloodGroup(bg)}
                      className={`rounded-[8px] px-2.5 py-1 ${
                        bloodGroup === bg ? 'bg-emerald-600' : palette.surfaceInset
                      }`}
                    >
                      <Text className={`text-[10px] font-bold ${bloodGroup === bg ? 'text-white' : palette.text}`}>
                        {bg}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Chief Complaint / Symptoms</Text>
                <TextInput
                  value={condition}
                  onChangeText={setCondition}
                  placeholder="e.g. Chest discomfort, high blood pressure"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                />
              </View>
            </View>
          </ScrollView>

          <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
            <Pressable onPress={onClose} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
              <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="flex-1 rounded-[12px] bg-emerald-600 py-2.5 items-center">
              <Text className="text-[12px] font-bold text-white">Save Patient</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 3. Book Appointment Modal
 */
export function BookAppointmentModal({ visible, onClose, onSave }) {
  const { palette } = useAppTheme();
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Sarah Lin (Cardio)');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [type, setType] = useState('Consultation');
  const [priority, setPriority] = useState('Normal');

  const handleSave = () => {
    if (!patientName) return;
    const newApt = {
      id: `apt-${Date.now()}`,
      token: `A-0${Math.floor(5 + Math.random() * 20)}`,
      patientName,
      doctorName,
      timeSlot,
      date: new Date().toISOString().split('T')[0],
      type,
      priority,
      status: 'SCHEDULED',
      symptoms: 'OPD Scheduled visit',
    };
    onSave && onSave(newApt);
    onClose();
    setPatientName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
          <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
            <Text className={`text-[15px] font-bold ${palette.text}`}>Book OPD Appointment</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <View className="gap-2.5 mb-3">
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
              <View className="flex-row flex-wrap gap-1.5">
                {['Dr. Sarah Lin (Cardio)', 'Dr. Mark Bennett (Neuro)', 'Dr. Rachel Patel (OBGYN)'].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDoctorName(d)}
                    className={`rounded-[10px] px-2.5 py-1.5 ${
                      doctorName === d ? 'bg-emerald-600' : palette.surfaceInset
                    }`}
                  >
                    <Text className={`text-[10px] font-semibold ${doctorName === d ? 'text-white' : palette.text}`}>
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Time Slot</Text>
              <View className="flex-row gap-1.5">
                {['09:30 AM', '10:15 AM', '11:00 AM', '02:30 PM'].map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => setTimeSlot(slot)}
                    className={`flex-1 items-center rounded-[8px] py-1.5 ${
                      timeSlot === slot ? 'bg-sky-600' : palette.surfaceInset
                    }`}
                  >
                    <Text className={`text-[10px] font-semibold ${timeSlot === slot ? 'text-white' : palette.text}`}>
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
            <Pressable onPress={onClose} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
              <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="flex-1 rounded-[12px] bg-emerald-600 py-2.5 items-center">
              <Text className="text-[12px] font-bold text-white">Confirm Booking</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 4. Create e-Prescription Modal
 */
export function CreatePrescriptionModal({ visible, onClose, onSave }) {
  const { palette } = useAppTheme();
  const [patientName, setPatientName] = useState('');
  const [medicine, setMedicine] = useState('Atorvastatin Calcium 20mg');
  const [dosage, setDosage] = useState('1 - 0 - 1');
  const [duration, setDuration] = useState('14 Days');
  const [notes, setNotes] = useState('Take after meals. Monitor lipid profile after 4 weeks.');

  const handleSave = () => {
    if (!patientName) return;
    onSave &&
      onSave({
        id: `rx-${Date.now()}`,
        patientName,
        medicine,
        dosage,
        duration,
        notes,
        prescribedAt: new Date().toISOString(),
      });
    onClose();
    setPatientName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
          <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
            <Text className={`text-[15px] font-bold ${palette.text}`}>Generate e-Prescription (e-Rx)</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <View className="gap-2 mb-3">
            <View>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Patient Name *</Text>
              <TextInput
                value={patientName}
                onChangeText={setPatientName}
                placeholder="e.g. Robert Sterling"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
              />
            </View>

            <View>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Select Medicine</Text>
              <TextInput
                value={medicine}
                onChangeText={setMedicine}
                placeholder="Medicine name"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Frequency</Text>
                <View className="flex-row gap-1">
                  {['1-0-1', '1-1-1', '0-1-0', '1-0-0'].map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => setDosage(f)}
                      className={`flex-1 items-center rounded-[8px] py-1.5 ${
                        dosage === f ? 'bg-emerald-600' : palette.surfaceInset
                      }`}
                    >
                      <Text className={`text-[10px] font-bold ${dosage === f ? 'text-white' : palette.text}`}>
                        {f}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Doctor Instructions</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Specific instructions"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
              />
            </View>
          </View>

          <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
            <Pressable onPress={onClose} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
              <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="flex-1 rounded-[12px] bg-emerald-600 py-2.5 items-center">
              <Text className="text-[12px] font-bold text-white">Issue e-Rx</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 5. Create Lab Order Modal
 */
export function CreateLabOrderModal({ visible, onClose, onSave }) {
  const { palette } = useAppTheme();
  const [patientName, setPatientName] = useState('');
  const [selectedTests, setSelectedTests] = useState(['Complete Blood Count (CBC)']);
  const [priority, setPriority] = useState('Routine');

  const availableTests = [
    'Complete Blood Count (CBC)',
    'Lipid Panel',
    'Serum Creatinine',
    'Thyroid (TSH, T3, T4)',
    'CT Scan / X-Ray',
  ];

  const toggleTest = (test) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleSave = () => {
    if (!patientName) return;
    onSave &&
      onSave({
        id: `lab-${Date.now()}`,
        orderNumber: `LAB-2026-${Math.floor(920 + Math.random() * 80)}`,
        patientName,
        tests: selectedTests,
        priority,
        status: 'PENDING_COLLECTION',
        orderedAt: new Date().toISOString(),
      });
    onClose();
    setPatientName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
          <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
            <Text className={`text-[15px] font-bold ${palette.text}`}>Order Diagnostic Lab Test</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <View className="gap-2 mb-3">
            <View>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Patient Name *</Text>
              <TextInput
                value={patientName}
                onChangeText={setPatientName}
                placeholder="e.g. Clara Oswald"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
              />
            </View>

            <View>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Select Tests</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {availableTests.map((t) => {
                  const isSelected = selectedTests.includes(t);
                  return (
                    <Pressable
                      key={t}
                      onPress={() => toggleTest(t)}
                      className={`rounded-[10px] px-2.5 py-1.5 ${
                        isSelected ? 'bg-cyan-600' : palette.surfaceInset
                      }`}
                    >
                      <Text className={`text-[10px] font-semibold ${isSelected ? 'text-white' : palette.text}`}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
            <Pressable onPress={onClose} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
              <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="flex-1 rounded-[12px] bg-cyan-600 py-2.5 items-center">
              <Text className="text-[12px] font-bold text-white">Place Lab Order</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 6. Create Invoice Modal
 */
export function CreateInvoiceModal({ visible, onClose, onSave }) {
  const { palette } = useAppTheme();
  const [patientName, setPatientName] = useState('');
  const [amount, setAmount] = useState('250.00');
  const [category, setCategory] = useState('Consultation');

  const handleSave = () => {
    if (!patientName || !amount) return;
    onSave &&
      onSave({
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(4500 + Math.random() * 500)}`,
        patientName,
        amount: parseFloat(amount) || 0,
        paidAmount: parseFloat(amount) || 0,
        balance: 0,
        status: 'PAID',
        paymentMethod: 'Cash / Instant Pay',
        date: new Date().toISOString().split('T')[0],
      });
    onClose();
    setPatientName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
          <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
            <Text className={`text-[15px] font-bold ${palette.text}`}>Generate Medical Invoice</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <View className="gap-2 mb-3">
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
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Billing Category</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {['Consultation', 'IPD Bed Stay', 'Pharmacy', 'Diagnostic Lab'].map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    className={`rounded-[10px] px-2.5 py-1.5 ${
                      category === c ? 'bg-amber-600' : palette.surfaceInset
                    }`}
                  >
                    <Text className={`text-[10px] font-semibold ${category === c ? 'text-white' : palette.text}`}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Total Amount ($) *</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="250.00"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
              />
            </View>
          </View>

          <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
            <Pressable onPress={onClose} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
              <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="flex-1 rounded-[12px] bg-amber-600 py-2.5 items-center">
              <Text className="text-[12px] font-bold text-white">Generate & Collect</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default PatientDetailModal;
