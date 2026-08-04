import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from '../_components/CurexaHeader';
import { BookAppointmentModal } from '../_components/CurexaModals';
import { createAppointment, getAppointments } from '~/services/curexa';

const initialAppointments = [
  {
    id: '201',
    patientName: 'Robert Fox',
    doctor: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    time: '09:30 AM',
    date: '2026-08-02',
    type: 'In-Person',
    reason: 'Follow-up post ECG & Lipid profile review',
    status: 'Scheduled',
  },
  {
    id: '202',
    patientName: 'Marcus Brody',
    doctor: 'Dr. Emily Watson',
    department: 'Orthopedics',
    time: '10:45 AM',
    date: '2026-08-02',
    type: 'In-Person',
    reason: 'Knee joint pain & mobility assessment',
    status: 'In-Progress',
  },
  {
    id: '203',
    patientName: 'Clara Oswald',
    doctor: 'Dr. Alan Vance',
    department: 'General OPD',
    time: '11:15 AM',
    date: '2026-08-02',
    type: 'Teleconsult',
    reason: 'Virtual consult for medication dosage adjustment',
    status: 'Completed',
  },
  {
    id: '204',
    patientName: 'Samantha Wright',
    doctor: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    time: '02:00 PM',
    date: '2026-08-02',
    type: 'In-Person',
    reason: 'Routine cardiac risk screening',
    status: 'Scheduled',
  },
  {
    id: '205',
    patientName: 'David Tennant',
    doctor: 'Dr. Alan Vance',
    department: 'Neurology',
    time: '03:30 PM',
    date: '2026-08-02',
    type: 'In-Person',
    reason: 'Migraine consultation & EEG review',
    status: 'Cancelled',
  },
];

const datesList = [
  { day: 'Sun', date: '02', fullDate: '2026-08-02', label: 'Today' },
  { day: 'Mon', date: '03', fullDate: '2026-08-03' },
  { day: 'Tue', date: '04', fullDate: '2026-08-04' },
  { day: 'Wed', date: '05', fullDate: '2026-08-05' },
  { day: 'Thu', date: '06', fullDate: '2026-08-06' },
  { day: 'Fri', date: '07', fullDate: '2026-08-07' },
];

export default function CurexaAppointmentsScreen() {
  const { palette } = useAppTheme();
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2026-08-02');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showBookModal, setShowBookModal] = useState(false);

  useEffect(() => {
    async function loadAppointments() {
      const res = await getAppointments();
      if (res && res.appointments) {
        const formatted = res.appointments.map((a) => ({
          id: a.id.slice(-4),
          patient: a.patient?.displayName || 'Patient',
          doctor: a.doctor?.displayName || 'Dr. Sarah Jenkins',
          specialty: a.doctor?.profile?.specialty || 'General Physician',
          date: a.date?.split('T')[0] || selectedDate,
          time: a.time || '10:00 AM',
          type: a.type || 'OPD Consultation',
          status: a.status === 'CONFIRMED' ? 'Confirmed' : a.status === 'COMPLETED' ? 'Completed' : 'Pending',
          token: `#${a.id.slice(-3)}`,
          vitals: 'BP 120/80, Pulse 72',
        }));
        setAppointments(formatted);
      } else {
        setAppointments([]);
      }
    }
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const matchesDate = app.date === selectedDate;
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesDate && matchesStatus;
    });
  }, [appointments, selectedDate, statusFilter]);

  const handleBookVisit = async (newApp) => {
    setAppointments((prev) => [newApp, ...prev]);
    await createAppointment(newApp);
  };


  const updateStatus = (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In-Progress':
        return { bg: 'bg-amber-500/20', text: 'text-amber-600' };
      case 'Completed':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600' };
      case 'Scheduled':
        return { bg: 'bg-sky-500/20', text: 'text-sky-600' };
      case 'Cancelled':
        return { bg: 'bg-gray-500/20', text: 'text-gray-500' };
      default:
        return { bg: 'bg-sky-500/20', text: 'text-sky-600' };
    }
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="OPD Visits & Scheduler"
        rightAction={
          <Pressable
            onPress={() => setShowBookModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
          >
            <Ionicons name="calendar-outline" size={16} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Book Visit</Text>
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-3 pb-28">

        {/* Date Selector Strip */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {datesList.map((d) => {
              const isSelected = selectedDate === d.fullDate;
              return (
                <Pressable
                  key={d.fullDate}
                  onPress={() => setSelectedDate(d.fullDate)}
                  className={`items-center rounded-2xl px-4 py-2.5 ${
                    isSelected ? 'bg-emerald-600' : palette.surfaceInset
                  }`}
                >
                  <Text className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-100' : palette.textMuted}`}>
                    {d.day}
                  </Text>
                  <Text className={`text-[16px] font-bold ${isSelected ? 'text-white' : palette.text}`}>
                    {d.date}
                  </Text>
                  {d.label ? (
                    <Text className={`text-[9px] font-bold ${isSelected ? 'text-white' : 'text-emerald-600'}`}>
                      {d.label}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Pills */}
        <View className="mb-3 flex-row gap-1.5">
          {['All', 'Scheduled', 'In-Progress', 'Completed', 'Cancelled'].map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1.5 ${
                statusFilter === st ? 'bg-emerald-600' : palette.surfaceInset
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  statusFilter === st ? 'text-white' : palette.textMuted
                }`}
              >
                {st}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Appointments Cards List */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {filteredAppointments.length === 0 ? (
            <View className={`mt-8 items-center rounded-2xl p-6 ${palette.surface}`}>
              <Ionicons name="calendar-clear-outline" size={36} color={palette.textMutedColor} />
              <Text className={`mt-2 text-[15px] font-bold ${palette.text}`}>No appointments found</Text>
              <Text className={`mt-1 text-[12px] ${palette.textMuted}`}>
                No visits scheduled for this date or status filter.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5 pb-8">
              {filteredAppointments.map((app) => {
                const badge = getStatusBadge(app.status);
                return (
                  <View key={app.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="rounded-xl bg-emerald-500/15 px-2.5 py-1">
                          <Text className="text-[12px] font-bold text-emerald-600">{app.time}</Text>
                        </View>
                        <View className={`rounded-full px-2.5 py-0.5 ${badge.bg}`}>
                          <Text className={`text-[10px] font-bold ${badge.text}`}>{app.status}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5">
                        <Ionicons
                          name={app.type === 'Teleconsult' ? 'videocam-outline' : 'people-outline'}
                          size={12}
                          color={palette.textColor}
                        />
                        <Text className={`text-[10px] font-semibold ${palette.textSoft}`}>{app.type}</Text>
                      </View>
                    </View>

                    <View className="mt-3">
                      <Text className={`text-[16px] font-bold ${palette.text}`}>{app.patientName}</Text>
                      <Text className={`text-[12px] ${palette.textMuted}`}>
                        Doctor: <Text className="font-semibold">{app.doctor}</Text> • {app.department}
                      </Text>
                      <Text className={`mt-1.5 text-[12px] leading-5 ${palette.textSoft}`}>{app.reason}</Text>
                    </View>

                    {/* Quick Actions */}
                    <View className="mt-3 flex-row items-center justify-between border-t border-gray-200/10 pt-2.5">
                      <Text className={`text-[11px] ${palette.textMuted}`}>ID: #{app.id}</Text>
                      <View className="flex-row gap-1.5">
                        {app.status === 'Scheduled' && (
                          <Pressable
                            onPress={() => updateStatus(app.id, 'In-Progress')}
                            className="rounded-lg bg-amber-500/20 px-2.5 py-1"
                          >
                            <Text className="text-[10px] font-bold text-amber-600">Start Consultation</Text>
                          </Pressable>
                        )}
                        {app.status === 'In-Progress' && (
                          <Pressable
                            onPress={() => updateStatus(app.id, 'Completed')}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1"
                          >
                            <Text className="text-[10px] font-bold text-white">Complete Visit</Text>
                          </Pressable>
                        )}
                        {app.status !== 'Completed' && app.status !== 'Cancelled' && (
                          <Pressable
                            onPress={() => updateStatus(app.id, 'Cancelled')}
                            className="rounded-lg bg-gray-500/15 px-2 py-1"
                          >
                            <Text className={`text-[10px] font-bold ${palette.textMuted}`}>Cancel</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Book Visit Modal */}
      <BookAppointmentModal
        visible={showBookModal}
        onClose={() => setShowBookModal(false)}
        onBook={handleBookVisit}
      />
    </AppScreen>
  );
}
