import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { createDepartmentOrDoctor, getDepartmentsAndDoctors, updateDoctorRoster } from '~/services/curexa';

const initialDepartments = [
  { id: 'DEP-1', name: 'Cardiology', head: 'Dr. Sarah Jenkins', doctorsCount: 8, bedsCount: 50, icon: 'heart', color: '#ef4444' },
  { id: 'DEP-2', name: 'Emergency Care', head: 'Dr. Alan Vance', doctorsCount: 12, bedsCount: 20, icon: 'flash', color: '#f59e0b' },
  { id: 'DEP-3', name: 'Orthopedics & Spine', head: 'Dr. Emily Watson', doctorsCount: 7, bedsCount: 45, icon: 'fitness', color: '#3b82f6' },
  { id: 'DEP-4', name: 'Neurology Unit', head: 'Dr. Jonathan Reed', doctorsCount: 6, bedsCount: 35, icon: 'pulse', color: '#8b5cf6' },
  { id: 'DEP-5', name: 'Pediatrics', head: 'Dr. Clara Oswald', doctorsCount: 9, bedsCount: 40, icon: 'happy', color: '#ec4899' },
  { id: 'DEP-6', name: 'Intensive Care (ICU)', head: 'Dr. Alan Vance', doctorsCount: 10, bedsCount: 20, icon: 'medical', color: '#10b981' },
];

const initialStaff = [
  { id: 'DOC-1', name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', hours: '09:00 AM - 02:00 PM', status: 'On Duty' },
  { id: 'DOC-2', name: 'Dr. Alan Vance', specialty: 'Emergency Medicine', hours: '08:00 AM - 04:00 PM', status: 'On Duty' },
  { id: 'DOC-3', name: 'Dr. Emily Watson', specialty: 'Orthopedics', hours: '10:00 AM - 03:00 PM', status: 'On Call' },
  { id: 'DOC-4', name: 'Dr. Jonathan Reed', specialty: 'Neurology', hours: '01:00 PM - 07:00 PM', status: 'Off Duty' },
];

export default function CurexaDepartmentsScreen() {
  const { palette } = useAppTheme();
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'staff'
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  // Form states
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Cardiology');
  const [docHours, setDocHours] = useState('09:00 AM - 05:00 PM');

  useEffect(() => {
    async function loadDeptsAndDoctors() {
      const res = await getDepartmentsAndDoctors();
      if (res) {
        if (res.departments) {
          const formattedDepts = res.departments.map((d) => ({
            id: d.id,
            name: d.name,
            head: d.users?.[0]?.displayName || 'Dr. Head Consultant',
            doctorsCount: d.users?.length || 5,
            bedsCount: d.bedCount || 30,
            icon: d.icon || 'hospital',
            color: d.color || '#3b82f6',
          }));
          setDepartments(formattedDepts);
        } else {
          setDepartments([]);
        }

        if (res.doctors) {
          const formattedStaff = res.doctors.map((doc) => ({
            id: doc.id,
            name: doc.displayName || 'Doctor',
            specialty: doc.demographic?.specialty || doc.department?.name || 'General OPD',
            hours: doc.demographic?.hours || '09:00 AM - 05:00 PM',
            status: doc.demographic?.status || 'On Duty',
          }));
          setStaff(formattedStaff);
        } else {
          setStaff([]);
        }
      } else {
        setDepartments([]);
        setStaff([]);
      }
    }
    loadDeptsAndDoctors();
  }, []);

  const toggleDutyStatus = async (id) => {
    let newStatus = 'On Duty';
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus =
            s.status === 'On Duty'
              ? 'On Call'
              : s.status === 'On Call'
              ? 'Off Duty'
              : 'On Duty';
          newStatus = nextStatus;
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
    await updateDoctorRoster({ doctorId: id, status: newStatus });
  };

  const handleAddDoctor = async () => {
    if (!docName.trim()) return;
    const newDoc = {
      id: `DOC-${Date.now().toString().slice(-3)}`,
      name: docName,
      specialty: docSpecialty,
      hours: docHours,
      status: 'On Duty',
    };
    setStaff((prev) => [newDoc, ...prev]);
    await createDepartmentOrDoctor({ type: 'doctor', doctorName: docName, specialty: docSpecialty, hours: docHours });
    setDocName('');
    setShowAddDoctorModal(false);
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Departments & Roster"
        showBack={true}
        rightAction={
          <Pressable
            onPress={() => setShowAddDoctorModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
          >
            <Ionicons name="person-add" size={16} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Add Doctor</Text>
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-3 pb-4">

        {/* Tab Switcher */}
        <View className="mb-3 flex-row rounded-2xl bg-gray-500/10 p-1">
          <Pressable
            onPress={() => setActiveTab('departments')}
            className={`flex-1 items-center rounded-xl py-2 ${
              activeTab === 'departments' ? 'bg-emerald-600' : 'transparent'
            }`}
          >
            <Text className={`text-[12px] font-semibold ${activeTab === 'departments' ? 'text-white' : palette.textMuted}`}>
              Departments ({departments.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('staff')}
            className={`flex-1 items-center rounded-xl py-2 ${
              activeTab === 'staff' ? 'bg-emerald-600' : 'transparent'
            }`}
          >
            <Text className={`text-[12px] font-semibold ${activeTab === 'staff' ? 'text-white' : palette.textMuted}`}>
              Doctor Roster ({staff.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'departments' ? (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="gap-2.5 pb-8">
              {departments.map((dept) => (
                <View key={dept.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${dept.color}20` }}>
                        <Ionicons name={dept.icon} size={20} color={dept.color} />
                      </View>
                      <View>
                        <Text className={`text-[16px] font-bold ${palette.text}`}>{dept.name}</Text>
                        <Text className={`text-[11px] ${palette.textMuted}`}>Head: {dept.head}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="mt-3 flex-row justify-between border-t border-gray-200/10 pt-2.5">
                    <Text className={`text-[12px] ${palette.textSoft}`}>Doctors: <Text className="font-bold">{dept.doctorsCount}</Text></Text>
                    <Text className={`text-[12px] ${palette.textSoft}`}>Beds Allocated: <Text className="font-bold">{dept.bedsCount}</Text></Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="gap-2.5 pb-8">
              {staff.map((doc) => (
                <View key={doc.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className={`text-[16px] font-bold ${palette.text}`}>{doc.name}</Text>
                      <Text className={`text-[12px] text-emerald-600 font-semibold`}>{doc.specialty}</Text>
                      <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`}>{doc.hours}</Text>
                    </View>

                    <Pressable
                      onPress={() => toggleDutyStatus(doc.id)}
                      className={`rounded-full px-3 py-1 ${
                        doc.status === 'On Duty'
                          ? 'bg-emerald-500/20'
                          : doc.status === 'On Call'
                          ? 'bg-amber-500/20'
                          : 'bg-gray-500/20'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          doc.status === 'On Duty'
                            ? 'text-emerald-600'
                            : doc.status === 'On Call'
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {doc.status}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Add Doctor Modal */}
      <Modal visible={showAddDoctorModal} transparent animationType="slide" onRequestClose={() => setShowAddDoctorModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-[28px] p-5 ${palette.surface}`}>
            <View className="mb-3 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
              <Text className={`text-[17px] font-bold ${palette.text}`}>Register Doctor to Roster</Text>
              <Pressable onPress={() => setShowAddDoctorModal(false)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={20} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-3">
              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Doctor Full Name *</Text>
                <TextInput
                  value={docName}
                  onChangeText={setDocName}
                  placeholder="e.g. Dr. Alan Vance"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>

              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Specialty & Department</Text>
                <TextInput
                  value={docSpecialty}
                  onChangeText={setDocSpecialty}
                  placeholder="Cardiology / OPD"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>

              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>OPD Shift Timings</Text>
                <TextInput
                  value={docHours}
                  onChangeText={setDocHours}
                  placeholder="09:00 AM - 05:00 PM"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setShowAddDoctorModal(false)} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddDoctor} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
                <Text className="text-[13px] font-bold text-white">Save Doctor</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
