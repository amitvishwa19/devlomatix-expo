import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';

import CurexaHeader from '../_components/CurexaHeader';
import {
  AddPatientModal,
  BookAppointmentModal,
  CreatePrescriptionModal,
  CreateLabOrderModal,
  CreateInvoiceModal,
  PatientDetailModal,
} from '../_components/CurexaModals';

export default function CurexaOverviewScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const {
    patients,
    appointments,
    wards,
    departments,
    invoices,
    labOrders,
    selectedPatient,
    showPatientDetail,
    setShowPatientDetail,
    viewPatientDetails,
    addPatientLocally,
    addAppointmentLocally,
    addLabOrderLocally,
    addInvoiceLocally,
  } = useCurexa();

  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showBookVisit, setShowBookVisit] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Computed metrics
  const totalBeds = wards.reduce((sum, w) => sum + (w.totalBeds || 0), 0) || 40;
  const occupiedBeds = wards.reduce((sum, w) => sum + (w.occupiedBeds || 0), 0) || 30;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);
  const todayVisits = appointments.length || 4;
  const totalRev = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0) || 1650.0;
  const pendingLabs = labOrders.filter((l) => l.status !== 'COMPLETED').length || 2;

  const quickStats = [
    {
      label: 'IPD Bed Occupancy',
      value: `${occupiedBeds}/${totalBeds}`,
      badge: `${occupancyRate}% Full`,
      icon: 'bed-outline',
      color: '#059669',
      tone: 'bg-emerald-500/15',
      route: '/(modules)/curexa/beds',
    },
    {
      label: "Today's OPD Queue",
      value: `${todayVisits}`,
      badge: 'Live',
      icon: 'calendar-outline',
      color: '#0284c7',
      tone: 'bg-sky-500/15',
      route: '/(modules)/curexa/(tabs)/appointments',
    },
    {
      label: 'Collected Revenue',
      value: `$${totalRev.toFixed(0)}`,
      badge: 'Today',
      icon: 'wallet-outline',
      color: '#d97706',
      tone: 'bg-amber-500/15',
      route: '/(modules)/curexa/billing',
    },
    {
      label: 'Pending Diagnostics',
      value: `${pendingLabs}`,
      badge: 'Active',
      icon: 'flask-outline',
      color: '#06b6d4',
      tone: 'bg-cyan-500/15',
      route: '/(modules)/curexa/laboratory',
    },
  ];

  const quickActions = [
    { label: 'Add Patient', icon: 'person-add-outline', color: '#059669', action: () => setShowAddPatient(true) },
    { label: 'Book OPD', icon: 'calendar-outline', color: '#0284c7', action: () => setShowBookVisit(true) },
    { label: 'Write e-Rx', icon: 'document-text-outline', color: '#8b5cf6', action: () => setShowRxModal(true) },
    { label: 'Order Lab', icon: 'flask-outline', color: '#06b6d4', action: () => setShowLabModal(true) },
    { label: 'Quick Bill', icon: 'receipt-outline', color: '#f59e0b', action: () => setShowInvoiceModal(true) },
    { label: 'Bed Grid', icon: 'bed-outline', color: '#10b981', action: () => router.push('/(modules)/curexa/beds') },
    { label: 'Workflow', icon: 'git-network-outline', color: '#ec4899', action: () => router.push('/(modules)/curexa/workflow') },
    { label: 'Reports', icon: 'bar-chart-outline', color: '#6366f1', action: () => router.push('/(modules)/curexa/reports') },
  ];

  return (
    <AppScreen>
      <CurexaHeader title="Hospital Command Center" subtitle="Real-time Clinical Operations" />

      <ScrollView className="flex-1 px-3 pt-2 pb-24" showsVerticalScrollIndicator={false}>
        {/* Hospital Banner */}
        <View className={`mb-2.5 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-emerald-600">
                  CUREXA SUPER SPECIALTY
                </Text>
                <View className="rounded-full bg-emerald-500/20 px-1.5 py-0.2">
                  <Text className="text-[9px] font-bold text-emerald-600">MAIN CAMPUS</Text>
                </View>
              </View>
              <Text className={`mt-0.5 text-[18px] font-bold ${palette.text}`}>
                Emergency & Clinical Operations
              </Text>
              <Text className={`text-[11px] ${palette.textMuted}`}>
                Tertiary Care • 40 Beds • 5 Specialties Active
              </Text>
            </View>
          </View>
        </View>

        {/* 4 Core KPI Cards */}
        <View className="mb-2.5 flex-row flex-wrap gap-2">
          {quickStats.map((st, idx) => (
            <Pressable
              key={idx}
              onPress={() => router.push(st.route)}
              className={`w-[48%] flex-1 rounded-[16px] p-2.5 shadow-sm ${palette.surface}`}
            >
              <View className="flex-row items-center justify-between">
                <View className={`h-7 w-7 items-center justify-center rounded-[10px] ${st.tone}`}>
                  <Ionicons name={st.icon} size={15} color={st.color} />
                </View>
                <View className={`rounded-full px-1.5 py-0.2 ${st.tone}`}>
                  <Text style={{ color: st.color }} className="text-[9px] font-bold">
                    {st.badge}
                  </Text>
                </View>
              </View>
              <Text className={`mt-2 text-[17px] font-bold ${palette.text}`}>{st.value}</Text>
              <Text className={`text-[10px] font-medium ${palette.textMuted}`}>{st.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Quick Clinical Launchpad */}
        <View className={`mb-2.5 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
          <Text className={`mb-2 text-[12px] font-bold uppercase tracking-[0.8px] text-emerald-600`}>
            Quick Clinical Actions
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {quickActions.map((qa, i) => (
              <Pressable
                key={i}
                onPress={qa.action}
                className={`w-[22%] flex-1 min-w-[70px] items-center rounded-[12px] p-2 ${palette.surfaceInset}`}
              >
                <View
                  style={{ backgroundColor: `${qa.color}20` }}
                  className="h-8 w-8 items-center justify-center rounded-[10px] mb-1"
                >
                  <Ionicons name={qa.icon} size={16} color={qa.color} />
                </View>
                <Text className={`text-[10px] font-bold text-center ${palette.text}`} numberOfLines={1}>
                  {qa.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Live OPD Schedule Strip */}
        <View className={`mb-2.5 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
          <View className="mb-2 flex-row items-center justify-between">
            <View>
              <Text className={`text-[13px] font-bold ${palette.text}`}>Live OPD Visits Queue</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Tokens & In-Consultation Queue</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(modules)/curexa/(tabs)/appointments')}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-[11px] font-semibold text-emerald-600">View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#059669" />
            </Pressable>
          </View>

          <View className="gap-1.5">
            {appointments.slice(0, 3).map((apt) => (
              <Pressable
                key={apt.id}
                onPress={() => router.push('/(modules)/curexa/(tabs)/appointments')}
                className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}
              >
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-sky-500/20">
                    <Text className="text-[10px] font-bold text-sky-700">{apt.token || 'OPD'}</Text>
                  </View>
                  <View>
                    <Text className={`text-[12px] font-bold ${palette.text}`}>{apt.patientName}</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>
                      {apt.doctorName} • {apt.timeSlot}
                    </Text>
                  </View>
                </View>
                <View
                  className={`rounded-full px-2 py-0.5 ${
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
              </Pressable>
            ))}
          </View>
        </View>

        {/* Admitted Patients EMR Snapshot */}
        <View className={`mb-3 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
          <View className="mb-2 flex-row items-center justify-between">
            <View>
              <Text className={`text-[13px] font-bold ${palette.text}`}>Admitted Inpatients (IPD)</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Live Ward & Vitals Monitoring</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(modules)/curexa/(tabs)/patients')}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-[11px] font-semibold text-emerald-600">All Patients</Text>
              <Ionicons name="chevron-forward" size={12} color="#059669" />
            </Pressable>
          </View>

          <View className="gap-1.5">
            {patients.slice(0, 3).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => viewPatientDetails(p)}
                className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}
              >
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-[10px] bg-emerald-500/15">
                    <Ionicons name="person" size={15} color="#059669" />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className={`text-[12px] font-bold ${palette.text}`}>
                        {p.displayName || p.name}
                      </Text>
                      <View className="rounded bg-emerald-500/15 px-1">
                        <Text className="text-[9px] font-bold text-emerald-700">{p.bloodGroup || 'O+'}</Text>
                      </View>
                    </View>
                    <Text className={`text-[10px] ${palette.textMuted}`}>
                      {p.ward || 'General'} • {p.vitals?.bp ? `BP: ${p.vitals.bp}` : 'Vitals Recorded'}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-bold text-emerald-600">{p.status || 'Stable'}</Text>
                  <Text className={`text-[9px] ${palette.textMuted}`}>Tap for EMR</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddPatientModal
        visible={showAddPatient}
        onClose={() => setShowAddPatient(false)}
        onSave={(newP) => addPatientLocally(newP)}
      />
      <BookAppointmentModal
        visible={showBookVisit}
        onClose={() => setShowBookVisit(false)}
        onSave={(newApt) => addAppointmentLocally(newApt)}
      />
      <CreatePrescriptionModal
        visible={showRxModal}
        onClose={() => setShowRxModal(false)}
      />
      <CreateLabOrderModal
        visible={showLabModal}
        onClose={() => setShowLabModal(false)}
        onSave={(newOrder) => addLabOrderLocally(newOrder)}
      />
      <CreateInvoiceModal
        visible={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSave={(newInv) => addInvoiceLocally(newInv)}
      />
      <PatientDetailModal
        patient={selectedPatient}
        visible={showPatientDetail}
        onClose={() => setShowPatientDetail(false)}
      />
    </AppScreen>
  );
}
