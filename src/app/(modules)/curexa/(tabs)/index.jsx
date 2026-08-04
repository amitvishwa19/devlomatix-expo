import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import { getAppointments, getBeds, getBillingInvoices, getCrmLeads, getDepartmentsAndDoctors } from '~/services/curexa';

import CurexaHeader from '../_components/CurexaHeader';
import {
  AddPatientModal,
  BedStatusModal,
  BillingSummaryModal,
  BookAppointmentModal,
} from '../_components/CurexaModals';

export default function CurexaOverviewScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showBookVisit, setShowBookVisit] = useState(false);
  const [showBedStatus, setShowBedStatus] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [statsData, setStatsData] = useState([
    { label: 'Active Beds', value: '0', total: '0', tone: 'bg-emerald-500/15', color: '#059669', icon: 'bed-outline' },
    { label: "Today's Visits", value: '0', total: '0', tone: 'bg-sky-500/15', color: '#0284c7', icon: 'calendar-outline' },
    { label: 'Revenue (Today)', value: '$0.00', tone: 'bg-amber-500/15', color: '#d97706', icon: 'wallet-outline' },
    { label: 'CRM Leads', value: '0', tone: 'bg-purple-500/15', color: '#9333ea', icon: 'sparkles-outline' },
  ]);

  useEffect(() => {
    async function loadStats() {
      const [bedsRes, appRes, billRes, crmRes, deptRes] = await Promise.all([
        getBeds(),
        getAppointments(),
        getBillingInvoices(),
        getCrmLeads(),
        getDepartmentsAndDoctors(),
      ]);

      const activeBedsCount = bedsRes?.summary?.occupied || bedsRes?.beds?.filter(b => b.status === 'OCCUPIED')?.length || 0;
      const totalBedsCount = bedsRes?.summary?.total || bedsRes?.beds?.length || 0;

      const visitsCount = appRes?.appointments?.length || 0;
      const revTotal = billRes?.summary?.totalCollected || 0;
      const crmCount = crmRes?.leads?.length || 0;

      setStatsData([
        { label: 'Active Beds', value: `${activeBedsCount}`, total: `${totalBedsCount}`, tone: 'bg-emerald-500/15', color: '#059669', icon: 'bed-outline' },
        { label: "Today's Visits", value: `${visitsCount}`, total: `${visitsCount}`, tone: 'bg-sky-500/15', color: '#0284c7', icon: 'calendar-outline' },
        { label: 'Revenue (Today)', value: `$${revTotal.toFixed(2)}`, tone: 'bg-amber-500/15', color: '#d97706', icon: 'wallet-outline' },
        { label: 'CRM Leads', value: `${crmCount}`, tone: 'bg-purple-500/15', color: '#9333ea', icon: 'sparkles-outline' },
      ]);

      if (deptRes && deptRes.departments && deptRes.departments.length > 0) {
        const formattedDepts = deptRes.departments.map((d) => ({
          name: d.name,
          doctors: d.users?.length || 0,
          occupiedBeds: d.bedCount || 0,
          totalBeds: (d.bedCount || 0) + 10,
          color: d.color || '#3b82f6',
        }));
        setDepartments(formattedDepts);
      } else {
        setDepartments([]);
      }
    }
    loadStats();
  }, []);


  return (
    <AppScreen>
      <CurexaHeader title="Overview Command Center" />
      <ScrollView className="flex-1 px-4 pt-3 pb-28" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className={`mb-3.5 rounded-[24px] p-4 shadow-sm ${palette.surface}`}>
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-2">
                <Text className={`text-[12px] font-bold uppercase tracking-[1.5px] text-emerald-600`}>
                  CUREXA HEALTHCARE
                </Text>
                <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-emerald-600">LIVE HMS</Text>
                </View>
              </View>
              <Text className={`mt-1 text-[24px] font-bold leading-7 ${palette.text}`}>
                Hospital Command Center
              </Text>
              <Text className={`mt-1 text-[12px] ${palette.textSoft}`}>
                Real-time ward occupancy, OPD scheduling, and patient EMR overview.
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="mb-3.5 flex-row flex-wrap gap-2">
          {statsData.map((item) => (
            <View key={item.label} className={`w-[48%] rounded-[20px] p-3.5 ${item.tone}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-[11px] font-semibold ${palette.textMuted}`}>{item.label}</Text>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <Text className={`mt-1 text-[22px] font-bold ${palette.text}`}>{item.value}</Text>
              {item.total ? (
                <Text className={`text-[10px] ${palette.textSoft}`}>Out of {item.total} total</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Quick Action Shortcuts */}
        <View className={`mb-3.5 rounded-[24px] p-4 ${palette.surface}`}>
          <Text className={`mb-2.5 text-[13px] font-bold ${palette.text}`}>Quick Hospital Actions</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowBookVisit(true)}
              className="flex-1 items-center rounded-2xl bg-emerald-600 py-2.5"
            >
              <Ionicons name="calendar" size={16} color="#ffffff" />
              <Text className="mt-1 text-[10px] font-bold text-white">Book Visit</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowAddPatient(true)}
              className="flex-1 items-center rounded-2xl bg-sky-600 py-2.5"
            >
              <Ionicons name="person-add" size={16} color="#ffffff" />
              <Text className="mt-1 text-[10px] font-bold text-white">Add Patient</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(modules)/curexa/beds')}
              className="flex-1 items-center rounded-2xl bg-amber-600 py-2.5"
            >
              <Ionicons name="bed" size={16} color="#ffffff" />
              <Text className="mt-1 text-[10px] font-bold text-white">Check Beds</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(modules)/curexa/billing')}
              className="flex-1 items-center rounded-2xl bg-purple-600 py-2.5"
            >
              <Ionicons name="receipt" size={16} color="#ffffff" />
              <Text className="mt-1 text-[10px] font-bold text-white">Invoices</Text>
            </Pressable>
          </View>
        </View>

        {/* Department Occupancy Breakdown */}
        <View className={`mb-3.5 rounded-[24px] p-4 ${palette.surface}`}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className={`text-[14px] font-bold ${palette.text}`}>Department Occupancy</Text>
            <Pressable onPress={() => router.push('/(modules)/curexa/beds')}>
              <Text className="text-[11px] font-bold text-emerald-600">View Wards →</Text>
            </Pressable>
          </View>

          <View className="gap-2.5">
            {departments.map((dept) => {
              const occPct = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
              return (
                <View key={dept.name} className={`rounded-xl p-2.5 ${palette.surfaceInset}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: dept.color }} />
                      <Text className={`text-[12px] font-semibold ${palette.text}`}>{dept.name}</Text>
                    </View>
                    <Text className={`text-[11px] font-bold ${palette.text}`}>
                      {dept.occupiedBeds}/{dept.totalBeds} beds ({occPct}%)
                    </Text>
                  </View>
                  {/* Mini Progress bar */}
                  <View className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-500/20">
                    <View className="h-full rounded-full" style={{ width: `${occPct}%`, backgroundColor: dept.color }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Hospital Activity Log */}
        <View className={`mb-6 rounded-[24px] p-4 ${palette.surface}`}>
          <Text className={`mb-2.5 text-[14px] font-bold ${palette.text}`}>Recent Clinical Activity</Text>
          <View className="gap-2">
            {recentActivity.map((act) => (
              <View key={act.id} className={`flex-row items-center gap-3 rounded-xl p-2.5 ${palette.surfaceInset}`}>
                <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${act.color}20` }}>
                  <Ionicons name={act.icon} size={15} color={act.color} />
                </View>
                <View className="flex-1">
                  <Text className={`text-[12px] font-semibold ${palette.text}`}>{act.text}</Text>
                  <Text className={`text-[10px] ${palette.textMuted}`}>{act.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Modals */}
      <AddPatientModal visible={showAddPatient} onClose={() => setShowAddPatient(false)} onAdd={() => {}} />
      <BookAppointmentModal visible={showBookVisit} onClose={() => setShowBookVisit(false)} onBook={() => {}} />
      <BedStatusModal visible={showBedStatus} onClose={() => setShowBedStatus(false)} />
      <BillingSummaryModal visible={showBilling} onClose={() => setShowBilling(false)} />
    </AppScreen>
  );
}
