import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';
import { BookAppointmentModal } from '../_components/CurexaModals';

export default function CurexaAppointmentsScreen() {
  const { palette } = useAppTheme();
  const { appointments, setAppointments, addAppointmentLocally } = useCurexa();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showBookModal, setShowBookModal] = useState(false);

  const statuses = ['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      return selectedStatus === 'ALL' || apt.status === selectedStatus;
    });
  }, [appointments, selectedStatus]);

  const updateStatus = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="OPD Visits & Queue"
        subtitle={`${filteredAppointments.length} Active Slots`}
        rightAction={
          <Pressable
            onPress={() => setShowBookModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-sky-600 px-2.5 py-1.5"
          >
            <Ionicons name="calendar" size={14} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Book Slot</Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-8">
          <View className="flex-row gap-1.5">
            {statuses.map((st) => (
              <Pressable
                key={st}
                onPress={() => setSelectedStatus(st)}
                className={`rounded-[10px] px-2.5 py-1 ${
                  selectedStatus === st ? 'bg-sky-600' : palette.surface
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

        {/* Appointments List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {filteredAppointments.map((apt) => (
              <View
                key={apt.id}
                className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-[14px] bg-sky-500/15">
                      <Text className="text-[11px] font-bold text-sky-700">{apt.token || 'OPD'}</Text>
                    </View>
                    <View>
                      <Text className={`text-[14px] font-bold ${palette.text}`}>{apt.patientName}</Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>
                        {apt.doctorName} • {apt.specialty || 'General OPD'}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-[11px] font-bold text-sky-600">{apt.timeSlot}</Text>
                    <View
                      className={`mt-0.5 rounded-full px-2 py-0.2 ${
                        apt.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/20'
                          : apt.status === 'COMPLETED'
                          ? 'bg-emerald-500/20'
                          : 'bg-sky-500/20'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold ${
                          apt.status === 'IN_PROGRESS'
                            ? 'text-amber-700'
                            : apt.status === 'COMPLETED'
                            ? 'text-emerald-700'
                            : 'text-sky-700'
                        }`}
                      >
                        {apt.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {apt.symptoms && (
                  <View className={`mt-2 rounded-[10px] p-2 ${palette.surfaceInset}`}>
                    <Text className={`text-[10px] font-medium ${palette.textMuted}`}>
                      Complaint: {apt.symptoms}
                    </Text>
                  </View>
                )}

                {/* Status Switcher Actions */}
                <View className="mt-2.5 flex-row items-center justify-end gap-1.5 border-t border-gray-200/15 pt-2">
                  {apt.status === 'SCHEDULED' && (
                    <Pressable
                      onPress={() => updateStatus(apt.id, 'IN_PROGRESS')}
                      className="rounded-[10px] bg-amber-500/15 px-2.5 py-1"
                    >
                      <Text className="text-[10px] font-bold text-amber-700">Start Consultation</Text>
                    </Pressable>
                  )}
                  {apt.status === 'IN_PROGRESS' && (
                    <Pressable
                      onPress={() => updateStatus(apt.id, 'COMPLETED')}
                      className="rounded-[10px] bg-emerald-500/15 px-2.5 py-1"
                    >
                      <Text className="text-[10px] font-bold text-emerald-700">Mark Completed</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => updateStatus(apt.id, 'CANCELLED')}
                    className={`rounded-[10px] px-2 py-1 ${palette.surfaceInset}`}
                  >
                    <Text className={`text-[10px] font-medium ${palette.textMuted}`}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {filteredAppointments.length === 0 && (
              <View className={`items-center justify-center rounded-[16px] p-8 ${palette.surface}`}>
                <Ionicons name="calendar-outline" size={36} color={palette.textMutedColor} />
                <Text className={`mt-2 text-[13px] font-bold ${palette.text}`}>No appointments found</Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>
                  Select a different status filter or book a new OPD visit.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <BookAppointmentModal
        visible={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSave={(newApt) => addAppointmentLocally(newApt)}
      />
    </AppScreen>
  );
}
