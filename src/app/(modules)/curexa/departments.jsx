import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaDepartmentsScreen() {
  const { palette } = useAppTheme();
  const { departments, setDepartments } = useCurexa();

  const [activeTab, setActiveTab] = useState('DEPARTMENTS'); // 'DEPARTMENTS' | 'ROSTER'
  const [showAddModal, setShowAddModal] = useState(false);

  // New Department Form
  const [deptName, setDeptName] = useState('');
  const [headName, setHeadName] = useState('');
  const [specialtyText, setSpecialtyText] = useState('');

  const doctorsList = [
    { id: 'd-1', name: 'Dr. Sarah Lin, MD', specialty: 'Cardiology', hours: '08:00 AM - 02:00 PM', status: 'ON_DUTY' },
    { id: 'd-2', name: 'Dr. Mark Bennett, MD', specialty: 'Neurology', hours: '09:00 AM - 04:00 PM', status: 'ON_DUTY' },
    { id: 'd-3', name: 'Dr. Rachel Patel, MD', specialty: 'Obstetrics & Gyn', hours: '10:00 AM - 05:00 PM', status: 'ON_CALL' },
    { id: 'd-4', name: 'Dr. Alan Harper, MS', specialty: 'Orthopedics', hours: '01:00 PM - 08:00 PM', status: 'OFF_DUTY' },
    { id: 'd-5', name: 'Dr. James Wilson, MD', specialty: 'Emergency / Critical', hours: '24/7 Shift', status: 'ON_DUTY' },
  ];

  const handleAddDept = () => {
    if (!deptName) return;
    const newDept = {
      id: `dept-${Date.now()}`,
      name: deptName,
      code: deptName.slice(0, 5).toUpperCase(),
      color: '#059669',
      icon: 'business-outline',
      headOfDepartment: headName || 'Chief Consultant',
      doctorsCount: 4,
      bedCount: 15,
      activePatients: 8,
      specialties: specialtyText ? specialtyText.split(',') : ['Clinical Care'],
    };
    setDepartments((prev) => [...prev, newDept]);
    setShowAddModal(false);
    setDeptName('');
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Departments & Doctors"
        subtitle={`${departments.length} Specialties Active`}
        showBack
        rightAction={
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-emerald-600 px-2.5 py-1.5"
          >
            <Ionicons name="add" size={15} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Add Specialty</Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* Tab Switcher */}
        <View className="mb-2.5 flex-row gap-1 rounded-[12px] bg-gray-500/10 p-1">
          {[
            { key: 'DEPARTMENTS', label: 'Clinical Departments' },
            { key: 'ROSTER', label: 'Doctor Shift Roster' },
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

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          {activeTab === 'DEPARTMENTS' ? (
            <View className="gap-2">
              {departments.map((dept) => (
                <View
                  key={dept.id}
                  className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View
                        style={{ backgroundColor: `${dept.color || '#059669'}20` }}
                        className="h-9 w-9 items-center justify-center rounded-[12px]"
                      >
                        <Ionicons name={dept.icon || 'business'} size={18} color={dept.color || '#059669'} />
                      </View>
                      <View>
                        <Text className={`text-[14px] font-bold ${palette.text}`}>{dept.name}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          Head: {dept.headOfDepartment}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-[11px] font-bold text-emerald-600">{dept.doctorsCount} Doctors</Text>
                      <Text className={`text-[9px] ${palette.textMuted}`}>{dept.bedCount} Beds Assigned</Text>
                    </View>
                  </View>

                  {/* Specialties */}
                  {dept.specialties && dept.specialties.length > 0 && (
                    <View className="mt-2 flex-row flex-wrap gap-1">
                      {dept.specialties.map((s, idx) => (
                        <View key={idx} className={`rounded-[8px] px-2 py-0.5 ${palette.surfaceInset}`}>
                          <Text className={`text-[9px] font-medium ${palette.text}`}>{s.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-2">
              {doctorsList.map((doc) => (
                <View
                  key={doc.id}
                  className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-emerald-500/15">
                        <Ionicons name="person" size={17} color="#059669" />
                      </View>
                      <View>
                        <Text className={`text-[13px] font-bold ${palette.text}`}>{doc.name}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {doc.specialty} • Shift: {doc.hours}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        doc.status === 'ON_DUTY'
                          ? 'bg-emerald-500/20'
                          : doc.status === 'ON_CALL'
                          ? 'bg-amber-500/20'
                          : 'bg-gray-500/20'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold ${
                          doc.status === 'ON_DUTY'
                            ? 'text-emerald-700'
                            : doc.status === 'ON_CALL'
                            ? 'text-amber-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {doc.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add Specialty Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
            <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
              <Text className={`text-[15px] font-bold ${palette.text}`}>Add Medical Department</Text>
              <Pressable onPress={() => setShowAddModal(false)} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={18} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-2 mb-3">
              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Department Name *</Text>
                <TextInput
                  value={deptName}
                  onChangeText={setDeptName}
                  placeholder="e.g. Dermatology & Cosmetology"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                />
              </View>

              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Head of Department</Text>
                <TextInput
                  value={headName}
                  onChangeText={setHeadName}
                  placeholder="e.g. Dr. Arthur Weasley, MD"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                />
              </View>

              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Specialties (comma separated)</Text>
                <TextInput
                  value={specialtyText}
                  onChangeText={setSpecialtyText}
                  placeholder="Clinical Care, Laser, Minor Surgery"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                />
              </View>
            </View>

            <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
              <Pressable onPress={() => setShowAddModal(false)} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
                <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddDept} className="flex-1 rounded-[12px] bg-emerald-600 py-2.5 items-center">
                <Text className="text-[12px] font-bold text-white">Save Department</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
