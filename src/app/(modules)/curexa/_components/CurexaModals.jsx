import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

/**
 * 1. Patient Detail & EHR Sheet Modal
 */
export function PatientDetailModal({ patient, visible, onClose }) {
  const { palette } = useAppTheme();
  const [activeTab, setActiveTab] = useState('vitals');

  if (!patient) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[85%] rounded-t-[28px] p-4 ${palette.surface}`}>
          {/* Header */}
          <View className="mb-3 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15">
                <Ionicons name="person-outline" size={22} color="#059669" />
              </View>
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className={`text-[17px] font-bold ${palette.text}`}>{patient.name}</Text>
                  <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-emerald-600">{patient.bloodGroup || 'O+'}</Text>
                  </View>
                </View>
                <Text className={`text-[12px] ${palette.textMuted}`}>
                  {patient.gender || 'Male'} • {patient.age} yrs • ID: #{patient.id}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={20} color={palette.textMutedColor} />
            </Pressable>
          </View>

          {/* Quick Contact & Action Buttons */}
          <View className="mb-3 flex-row gap-2">
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5">
              <Ionicons name="call-outline" size={15} color="#ffffff" />
              <Text className="text-[12px] font-semibold text-white">Call Patient</Text>
            </Pressable>
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2.5">
              <Ionicons name="logo-whatsapp" size={15} color="#ffffff" />
              <Text className="text-[12px] font-semibold text-white">WhatsApp</Text>
            </Pressable>
            <Pressable className={`flex-row items-center justify-center rounded-xl px-3 py-2.5 ${palette.surfaceAlt}`}>
              <Ionicons name="create-outline" size={16} color={palette.textColor} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View className="mb-3 flex-row gap-1 rounded-xl bg-gray-500/10 p-1">
            {[
              { key: 'vitals', label: 'Vitals' },
              { key: 'history', label: 'History' },
              { key: 'rx', label: 'Prescriptions' },
              { key: 'visits', label: 'Visits' },
            ].map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                className={`flex-1 items-center rounded-lg py-1.5 ${
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
                  <View className={`flex-1 rounded-2xl p-3 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="heart" size={14} color="#ef4444" />
                      <Text className={`text-[11px] ${palette.textMuted}`}>Heart Rate</Text>
                    </View>
                    <Text className={`mt-1 text-[18px] font-bold ${palette.text}`}>
                      {patient.vitals?.heartRate || '78'} <Text className="text-[11px] font-normal">bpm</Text>
                    </Text>
                  </View>
                  <View className={`flex-1 rounded-2xl p-3 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="speedometer" size={14} color="#3b82f6" />
                      <Text className={`text-[11px] ${palette.textMuted}`}>Blood Pressure</Text>
                    </View>
                    <Text className={`mt-1 text-[18px] font-bold ${palette.text}`}>
                      {patient.vitals?.bp || '120/80'} <Text className="text-[11px] font-normal">mmHg</Text>
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <View className={`flex-1 rounded-2xl p-3 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="thermometer" size={14} color="#f59e0b" />
                      <Text className={`text-[11px] ${palette.textMuted}`}>Body Temp</Text>
                    </View>
                    <Text className={`mt-1 text-[18px] font-bold ${palette.text}`}>
                      {patient.vitals?.temp || '98.6'} <Text className="text-[11px] font-normal">°F</Text>
                    </Text>
                  </View>
                  <View className={`flex-1 rounded-2xl p-3 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="fitness" size={14} color="#10b981" />
                      <Text className={`text-[11px] ${palette.textMuted}`}>SpO2 Level</Text>
                    </View>
                    <Text className={`mt-1 text-[18px] font-bold ${palette.text}`}>
                      {patient.vitals?.spo2 || '99'} <Text className="text-[11px] font-normal">%</Text>
                    </Text>
                  </View>
                </View>

                {/* Admission Info */}
                <View className={`rounded-2xl p-3 ${palette.surfaceInset}`}>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>Current Room & Doctor</Text>
                  <View className="mt-2 flex-row justify-between">
                    <Text className={`text-[12px] ${palette.textSoft}`}>Ward / Room:</Text>
                    <Text className={`text-[12px] font-semibold ${palette.text}`}>
                      {patient.room || 'General Ward - Bed 12'}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row justify-between">
                    <Text className={`text-[12px] ${palette.textSoft}`}>Attending Doctor:</Text>
                    <Text className={`text-[12px] font-semibold ${palette.text}`}>
                      {patient.doctor || 'Dr. Sarah Jenkins'}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row justify-between">
                    <Text className={`text-[12px] ${palette.textSoft}`}>Admission Date:</Text>
                    <Text className={`text-[12px] font-semibold ${palette.text}`}>
                      {patient.admissionDate || '2026-07-28'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'history' && (
              <View className={`rounded-2xl p-3 ${palette.surfaceInset}`}>
                <Text className={`mb-2 text-[12px] font-bold ${palette.text}`}>Diagnosis & Allergies</Text>
                <Text className={`text-[12px] leading-5 ${palette.textSoft}`}>
                  {patient.history || 'Hypertension, Mild Asthma. No known drug allergies.'}
                </Text>
              </View>
            )}

            {activeTab === 'rx' && (
              <View className="gap-2">
                {[
                  { name: 'Amoxicillin 500mg', dose: '1 tab - 3x daily after meals', days: '5 Days' },
                  { name: 'Paracetamol 650mg', dose: '1 tab - SOS for fever', days: '3 Days' },
                  { name: 'Pantoprazole 40mg', dose: '1 tab - Empty stomach morning', days: '7 Days' },
                ].map((m, idx) => (
                  <View key={idx} className={`rounded-xl p-3 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-[13px] font-bold ${palette.text}`}>{m.name}</Text>
                      <Text className="text-[10px] font-semibold text-emerald-600">{m.days}</Text>
                    </View>
                    <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`}>{m.dose}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'visits' && (
              <View className="gap-2">
                {[
                  { date: '2026-07-28', dept: 'Cardiology', doctor: 'Dr. Sarah Jenkins', status: 'Completed' },
                  { date: '2026-06-14', dept: 'General OPD', doctor: 'Dr. Alan Vance', status: 'Completed' },
                ].map((v, idx) => (
                  <View key={idx} className={`rounded-xl p-3 ${palette.surfaceInset}`}>
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-[12px] font-bold ${palette.text}`}>{v.dept}</Text>
                      <Text className={`text-[11px] ${palette.textMuted}`}>{v.date}</Text>
                    </View>
                    <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`}>{v.doctor}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Close Footer */}
          <Pressable onPress={onClose} className="mt-2 rounded-xl bg-gray-500/15 py-3 items-center">
            <Text className={`text-[13px] font-bold ${palette.text}`}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 2. Add New Patient Modal
 */
export function AddPatientModal({ visible, onClose, onAdd }) {
  const { palette } = useAppTheme();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [doctor, setDoctor] = useState('Dr. Sarah Jenkins');
  const [admissionType, setAdmissionType] = useState('Inpatient');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: String(Date.now()).slice(-4),
      name,
      age: age || '30',
      gender,
      bloodGroup,
      phone,
      doctor,
      status: admissionType,
      admissionDate: new Date().toISOString().split('T')[0],
      vitals: { heartRate: '75', bp: '120/80', temp: '98.6', spo2: '98' },
    });
    setName('');
    setAge('');
    setPhone('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[90%] rounded-t-[28px] p-5 ${palette.surface}`}>
          <View className="mb-4 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
            <Text className={`text-[18px] font-bold ${palette.text}`}>Register New Patient</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={20} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Full Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Robert Fox"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Age</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="35"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>
              <View className="flex-1">
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Gender</Text>
                <View className="flex-row gap-1">
                  {['Male', 'Female'].map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setGender(g)}
                      className={`flex-1 items-center rounded-xl py-2.5 ${
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
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Blood Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                  {['O+', 'A+', 'B+', 'AB+', 'O-'].map((bg) => (
                    <Pressable
                      key={bg}
                      onPress={() => setBloodGroup(bg)}
                      className={`rounded-xl px-3 py-2 ${
                        bloodGroup === bg ? 'bg-emerald-600' : palette.surfaceInset
                      }`}
                    >
                      <Text className={`text-[11px] font-semibold ${bloodGroup === bg ? 'text-white' : palette.text}`}>
                        {bg}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+1 (555) 019-2834"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
              />
            </View>

            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Admission Status</Text>
              <View className="flex-row gap-2">
                {['Inpatient', 'Outpatient', 'Emergency'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setAdmissionType(type)}
                    className={`flex-1 items-center rounded-xl py-2 ${
                      admissionType === type ? 'bg-emerald-600' : palette.surfaceInset
                    }`}
                  >
                    <Text className={`text-[11px] font-semibold ${admissionType === type ? 'text-white' : palette.text}`}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="mt-4 flex-row gap-2">
            <Pressable onPress={onClose} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
              <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
              <Text className="text-[13px] font-bold text-white">Save Patient</Text>
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
export function BookAppointmentModal({ visible, onClose, onBook }) {
  const { palette } = useAppTheme();
  const [patientName, setPatientName] = useState('');
  const [doctor, setDoctor] = useState('Dr. Sarah Jenkins');
  const [department, setDepartment] = useState('Cardiology');
  const [timeSlot, setTimeSlot] = useState('10:30 AM');
  const [visitType, setVisitType] = useState('In-Person');

  const handleBook = () => {
    if (!patientName.trim()) return;
    onBook({
      id: String(Date.now()).slice(-4),
      patientName,
      doctor,
      department,
      time: timeSlot,
      date: new Date().toISOString().split('T')[0],
      type: visitType,
      status: 'Scheduled',
    });
    setPatientName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[90%] rounded-t-[28px] p-5 ${palette.surface}`}>
          <View className="mb-4 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
            <Text className={`text-[18px] font-bold ${palette.text}`}>Schedule Appointment</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={20} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Patient Name *</Text>
              <TextInput
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Enter patient name"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
              />
            </View>

            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General'].map((dept) => (
                  <Pressable
                    key={dept}
                    onPress={() => setDepartment(dept)}
                    className={`rounded-xl px-3 py-2 ${
                      department === dept ? 'bg-emerald-600' : palette.surfaceInset
                    }`}
                  >
                    <Text className={`text-[11px] font-semibold ${department === dept ? 'text-white' : palette.text}`}>
                      {dept}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Time Slot</Text>
              <View className="flex-row flex-wrap gap-2">
                {['09:00 AM', '10:30 AM', '02:00 PM', '04:15 PM'].map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => setTimeSlot(slot)}
                    className={`rounded-xl px-3 py-2 ${
                      timeSlot === slot ? 'bg-emerald-600' : palette.surfaceInset
                    }`}
                  >
                    <Text className={`text-[11px] font-semibold ${timeSlot === slot ? 'text-white' : palette.text}`}>
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Consultation Type</Text>
              <View className="flex-row gap-2">
                {['In-Person', 'Teleconsult'].map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setVisitType(t)}
                    className={`flex-1 items-center rounded-xl py-2.5 ${
                      visitType === t ? 'bg-emerald-600' : palette.surfaceInset
                    }`}
                  >
                    <Text className={`text-[11px] font-semibold ${visitType === t ? 'text-white' : palette.text}`}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="mt-4 flex-row gap-2">
            <Pressable onPress={onClose} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
              <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleBook} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
              <Text className="text-[13px] font-bold text-white">Confirm Visit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 4. Add Lead Modal (CRM)
 */
export function AddLeadModal({ visible, onClose, onAdd }) {
  const { palette } = useAppTheme();
  const [leadName, setLeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [treatment, setTreatment] = useState('Cardiac Checkup');
  const [source, setSource] = useState('Website');

  const handleAdd = () => {
    if (!leadName.trim()) return;
    onAdd({
      id: String(Date.now()).slice(-4),
      name: leadName,
      phone,
      treatment,
      source,
      value: '$1,200',
      stage: 'New Lead',
      score: '85',
      date: new Date().toISOString().split('T')[0],
    });
    setLeadName('');
    setPhone('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[90%] rounded-t-[28px] p-5 ${palette.surface}`}>
          <View className="mb-4 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
            <Text className={`text-[18px] font-bold ${palette.text}`}>Add CRM Patient Lead</Text>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={20} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Lead Name *</Text>
              <TextInput
                value={leadName}
                onChangeText={setLeadName}
                placeholder="e.g. Samantha Wright"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
              />
            </View>

            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+1 (555) 392-1049"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
              />
            </View>

            <View>
              <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Interested Treatment / Service</Text>
              <TextInput
                value={treatment}
                onChangeText={setTreatment}
                placeholder="e.g. MRI Scan & Consultation"
                placeholderTextColor={palette.textMutedColor}
                className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Lead Source</Text>
                <View className="flex-row gap-1">
                  {['Website', 'Google', 'Referral'].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setSource(s)}
                      className={`flex-1 items-center rounded-xl py-2 ${
                        source === s ? 'bg-emerald-600' : palette.surfaceInset
                      }`}
                    >
                      <Text className={`text-[10px] font-semibold ${source === s ? 'text-white' : palette.text}`}>
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="mt-4 flex-row gap-2">
            <Pressable onPress={onClose} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
              <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleAdd} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
              <Text className="text-[13px] font-bold text-white">Create Lead</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 5. Bed Status & Inpatient Ward Modal
 */
export function BedStatusModal({ visible, onClose }) {
  const { palette } = useAppTheme();
  const wards = [
    { name: 'ICU Ward', total: 20, occupied: 16, available: 4, color: '#ef4444' },
    { name: 'General Male Ward', total: 50, occupied: 38, available: 12, color: '#3b82f6' },
    { name: 'General Female Ward', total: 50, occupied: 41, available: 9, color: '#ec4899' },
    { name: 'Private Suites', total: 15, occupied: 12, available: 3, color: '#8b5cf6' },
    { name: 'Emergency Care', total: 10, occupied: 7, available: 3, color: '#f59e0b' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[85%] rounded-t-[28px] p-5 ${palette.surface}`}>
          <View className="mb-4 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
            <View>
              <Text className={`text-[18px] font-bold ${palette.text}`}>Inpatient Bed Occupancy</Text>
              <Text className={`text-[12px] ${palette.textMuted}`}>Real-time ward & bed availability</Text>
            </View>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={20} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
            {wards.map((w, idx) => {
              const occPct = Math.round((w.occupied / w.total) * 100);
              return (
                <View key={idx} className={`rounded-2xl p-4 ${palette.surfaceInset}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-[14px] font-bold ${palette.text}`}>{w.name}</Text>
                    <Text className="text-[12px] font-bold" style={{ color: w.color }}>
                      {occPct}% Occupied
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View className="my-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-500/20">
                    <View className="h-full rounded-full" style={{ width: `${occPct}%`, backgroundColor: w.color }} />
                  </View>

                  <View className="flex-row justify-between text-[11px]">
                    <Text className={`text-[11px] ${palette.textSoft}`}>Total Beds: {w.total}</Text>
                    <Text className={`text-[11px] ${palette.textSoft}`}>Occupied: {w.occupied}</Text>
                    <Text className="text-[11px] font-bold text-emerald-600">Available: {w.available}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <Pressable onPress={onClose} className="mt-4 rounded-xl bg-emerald-600 py-3 items-center">
            <Text className="text-[13px] font-bold text-white">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 6. Billing Summary Modal
 */
export function BillingSummaryModal({ visible, onClose }) {
  const { palette } = useAppTheme();
  const invoices = [
    { id: 'INV-9021', patient: 'Eleanor Vance', amount: '$1,450', status: 'Paid', date: '2026-07-30' },
    { id: 'INV-9022', patient: 'Marcus Brody', amount: '$3,800', status: 'Pending', date: '2026-07-31' },
    { id: 'INV-9023', patient: 'Clara Oswald', amount: '$620', status: 'Paid', date: '2026-07-31' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className={`max-h-[85%] rounded-t-[28px] p-5 ${palette.surface}`}>
          <View className="mb-4 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
            <View>
              <Text className={`text-[18px] font-bold ${palette.text}`}>Billing & Invoices</Text>
              <Text className={`text-[12px] ${palette.textMuted}`}>Hospital revenue & claims overview</Text>
            </View>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={20} color={palette.textMutedColor} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
            {invoices.map((inv) => (
              <View key={inv.id} className={`flex-row items-center justify-between rounded-2xl p-3.5 ${palette.surfaceInset}`}>
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className={`text-[13px] font-bold ${palette.text}`}>{inv.patient}</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>#{inv.id}</Text>
                  </View>
                  <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`}>{inv.date}</Text>
                </View>
                <View className="items-end">
                  <Text className={`text-[14px] font-bold ${palette.text}`}>{inv.amount}</Text>
                  <View className={`mt-1 rounded-full px-2 py-0.5 ${inv.status === 'Paid' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                    <Text className={`text-[10px] font-bold ${inv.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {inv.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={onClose} className="mt-4 rounded-xl bg-emerald-600 py-3 items-center">
            <Text className="text-[13px] font-bold text-white">Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
