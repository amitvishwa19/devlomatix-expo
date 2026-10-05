import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';
import { BookAppointmentModal } from '../_components/CurexaModals';

export default function CurexaAppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { portalMode, currentPatientProfile, appointments, setAppointments, addAppointmentLocally } = useCurexa();

  const isPatient = portalMode === 'PATIENT';

  // Hospital View State
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showBookModal, setShowBookModal] = useState(false);

  // Patient View State
  const [patientTab, setPatientTab] = useState('UPCOMING'); // 'UPCOMING' | 'PAST' | 'TELEMED'
  const [selectedVisitDetail, setSelectedVisitDetail] = useState(null);

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

  // Patient appointments
  const myAppointments = useMemo(() => {
    return appointments.filter(
      (a) => a.patientName === currentPatientProfile.displayName || a.patientId === currentPatientProfile.id
    );
  }, [appointments, currentPatientProfile]);

  const liveTokenApt = myAppointments[0] || appointments[0];

  return (
    <AppScreen>
      <CurexaHeader
        title={isPatient ? 'My Visits & OPD Tracker' : 'OPD Visits & Queue'}
        subtitle={
          isPatient
            ? 'Live Token & Consultation Queue'
            : `${filteredAppointments.length} Active Slots`
        }
        rightAction={
          <Pressable
            onPress={() => setShowBookModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-sky-600 px-2.5 py-1.5 shadow-sm"
          >
            <Ionicons name="calendar" size={14} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Book Slot</Text>
          </Pressable>
        }
      />

      {isPatient ? (
        /* ========================================================================= */
        /*                       PATIENT VISITS & TOKEN VIEW                         */
        /* ========================================================================= */
        <View className="flex-1 px-3 pt-2">
          {/* Live Queue Hero Widget */}
          {liveTokenApt && (
            <View className={`mb-2.5 rounded-[18px] p-3.5 shadow-sm ${palette.surface}`}>
              <View className="flex-row items-center justify-between border-b border-gray-200/15 pb-2">
                <View className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Text className="text-[11px] font-bold uppercase tracking-[1px] text-emerald-600">
                    LIVE OPD TOKEN STATUS
                  </Text>
                </View>
                <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                  <Text className="text-[9.5px] font-bold text-emerald-700">Estimated Wait: ~8 mins</Text>
                </View>
              </View>

              <View className="my-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-14 w-14 items-center justify-center rounded-[16px] bg-sky-600 shadow-md">
                    <Text className="text-[20px] font-black text-white">{liveTokenApt.token || 'A-01'}</Text>
                    <Text className="text-[8.5px] font-bold uppercase tracking-[0.5px] text-sky-100">Your Token</Text>
                  </View>
                  <View>
                    <Text className={`text-[15px] font-bold ${palette.text}`}>{liveTokenApt.doctorName}</Text>
                    <Text className={`text-[11px] ${palette.textMuted}`}>{liveTokenApt.specialty} • Cabin 3B</Text>
                    <Text className="text-[10.5px] font-semibold text-sky-600">Slot: {liveTokenApt.timeSlot}</Text>
                  </View>
                </View>

                <View className="items-center rounded-[12px] bg-amber-500/15 p-2 min-w-[75px]">
                  <Text className="text-[9px] font-bold text-amber-700 uppercase">Now Serving</Text>
                  <Text className="text-[16px] font-extrabold text-amber-700">A-00</Text>
                  <Text className="text-[8.5px] text-amber-700 font-medium">1 Ahead</Text>
                </View>
              </View>

              {/* Consultation Journey Stepper */}
              <View className={`rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500 mb-2`}>
                  Consultation Journey
                </Text>
                <View className="flex-row items-center justify-between">
                  {[
                    { label: 'Check-In', done: true, active: false },
                    { label: 'Vitals', done: true, active: false },
                    { label: 'Queue', done: false, active: true },
                    { label: 'Doctor', done: false, active: false },
                    { label: 'Pharmacy', done: false, active: false },
                  ].map((st, i) => (
                    <View key={i} className="items-center flex-1">
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-full mb-1 ${
                          st.done
                            ? 'bg-emerald-600'
                            : st.active
                            ? 'bg-sky-600 border-2 border-sky-300'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        {st.done ? (
                          <Ionicons name="checkmark" size={10} color="#ffffff" />
                        ) : (
                          <Text className="text-[9px] font-bold text-white">{i + 1}</Text>
                        )}
                      </View>
                      <Text
                        className={`text-[8.5px] ${
                          st.active ? 'font-bold text-sky-600' : st.done ? 'font-medium text-emerald-600' : palette.textMuted
                        }`}
                      >
                        {st.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="mt-2.5 flex-row gap-2">
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      'Cabin Directions',
                      'Dr. Sarah Lin is in Cabin 3B, 2nd Floor (Cardiology Wing). Take Elevator B to Level 2.'
                    )
                  }
                  className="flex-1 flex-row items-center justify-center gap-1 rounded-[10px] bg-sky-600/15 py-2"
                >
                  <Ionicons name="navigate-outline" size={13} color="#0284c7" />
                  <Text className="text-[11px] font-bold text-sky-700">Cabin Directions</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(modules)/curexa/telemedicine')}
                  className="flex-1 flex-row items-center justify-center gap-1 rounded-[10px] bg-emerald-600 py-2"
                >
                  <Ionicons name="videocam" size={13} color="#ffffff" />
                  <Text className="text-[11px] font-bold text-white">Join Video OPD</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Patient Subtabs */}
          <View className={`mb-2 flex-row rounded-[14px] p-1 ${palette.surface}`}>
            {[
              { key: 'UPCOMING', label: 'Upcoming Visits', count: 2 },
              { key: 'PAST', label: 'Past Consultations', count: 4 },
              { key: 'TELEMED', label: 'Teleconsults', count: 1 },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setPatientTab(tab.key)}
                className={`flex-1 items-center justify-center rounded-[10px] py-1.5 ${
                  patientTab === tab.key ? 'bg-sky-600 shadow-sm' : 'transparent'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    patientTab === tab.key ? 'text-white' : palette.textMuted
                  }`}
                >
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
            <View className="gap-2">
              {(patientTab === 'UPCOMING'
                ? appointments.filter((a) => a.status !== 'COMPLETED')
                : patientTab === 'PAST'
                ? appointments.filter((a) => a.status === 'COMPLETED')
                : appointments.filter((a) => a.specialty?.includes('Video') || a.type?.includes('Consultation'))
              ).map((apt) => (
                <Pressable
                  key={apt.id}
                  onPress={() => setSelectedVisitDetail(apt)}
                  className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="h-9 w-9 items-center justify-center rounded-[14px] bg-sky-500/15">
                        <Text className="text-[11px] font-bold text-sky-700">{apt.token || 'OPD'}</Text>
                      </View>
                      <View>
                        <Text className={`text-[13.5px] font-bold ${palette.text}`}>{apt.doctorName}</Text>
                        <Text className={`text-[10.5px] ${palette.textMuted}`}>
                          {apt.specialty || 'Cardiology'} • {apt.date}
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
                      <Text className={`text-[10.5px] ${palette.text}`}>Reason: {apt.symptoms}</Text>
                    </View>
                  )}

                  <View className="mt-2.5 flex-row items-center justify-between border-t border-gray-200/15 pt-2">
                    <Text className="text-[10px] font-medium text-emerald-600">Verified Booking ID #{apt.id}</Text>
                    <View className="flex-row items-center gap-1.5">
                      <Pressable
                        onPress={() => Alert.alert('Reschedule', 'Contacting reception for alternative slot...')}
                        className={`rounded-[8px] px-2 py-1 ${palette.surfaceInset}`}
                      >
                        <Text className={`text-[10px] font-medium ${palette.textMuted}`}>Reschedule</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => router.push('/(modules)/curexa/telemedicine')}
                        className="rounded-[8px] bg-sky-600 px-2 py-1"
                      >
                        <Text className="text-[10px] font-bold text-white">Join Video</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : (
        /* ========================================================================= */
        /*                       HOSPITAL OPD QUEUE VIEW                             */
        /* ========================================================================= */
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
                <View key={apt.id} className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
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
      )}

      {/* Appointment Detail Modal for Patient */}
      {selectedVisitDetail && (
        <Modal
          visible={!!selectedVisitDetail}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedVisitDetail(null)}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View
              className={`rounded-t-[24px] p-4 ${palette.surface}`}
              style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
            >
              <View className="flex-row items-center justify-between pb-3 border-b border-gray-200/15">
                <Text className={`text-[15px] font-bold ${palette.text}`}>Appointment Pass</Text>
                <Pressable onPress={() => setSelectedVisitDetail(null)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                  <Ionicons name="close" size={16} color={palette.textMutedColor} />
                </Pressable>
              </View>

              <View className={`my-3 rounded-[16px] p-3.5 border ${palette.border} ${palette.surfaceInset}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[16px] font-extrabold text-sky-600">Token {selectedVisitDetail.token || 'A-01'}</Text>
                  <View className="rounded bg-sky-500/20 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-sky-700">{selectedVisitDetail.status}</Text>
                  </View>
                </View>

                <Text className={`text-[14px] font-bold ${palette.text}`}>{selectedVisitDetail.doctorName}</Text>
                <Text className={`text-[11px] ${palette.textMuted} mb-2`}>
                  {selectedVisitDetail.specialty} • {selectedVisitDetail.date} ({selectedVisitDetail.timeSlot})
                </Text>

                {selectedVisitDetail.symptoms && (
                  <View className="rounded-[10px] bg-white/60 dark:bg-black/20 p-2.5 mb-2">
                    <Text className="text-[10px] font-bold text-sky-600 uppercase mb-0.5">Chief Complaint</Text>
                    <Text className={`text-[11.5px] ${palette.text}`}>{selectedVisitDetail.symptoms}</Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setSelectedVisitDetail(null);
                    router.push('/(modules)/curexa/telemedicine');
                  }}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[12px] bg-sky-600 py-2.5"
                >
                  <Ionicons name="videocam" size={16} color="#ffffff" />
                  <Text className="text-[12px] font-bold text-white">Open Telemedicine Room</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedVisitDetail(null)}
                  className={`rounded-[12px] px-4 py-2.5 ${palette.surfaceInset}`}
                >
                  <Text className={`text-[12px] font-medium ${palette.text}`}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Book Slot Modal */}
      <BookAppointmentModal
        visible={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSave={(newApt) => addAppointmentLocally(newApt)}
      />
    </AppScreen>
  );
}
