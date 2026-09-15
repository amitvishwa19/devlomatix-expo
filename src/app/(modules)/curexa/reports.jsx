import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaReportsScreen() {
  const { palette } = useAppTheme();
  const { patients, appointments, wards, invoices } = useCurexa();

  const totalRevenue = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0) || 1650.0;
  const totalBilled = invoices.reduce((sum, i) => sum + (i.amount || 0), 0) || 2280.0;
  const collectionRate = Math.round((totalRevenue / totalBilled) * 100) || 72;

  const totalBeds = 40;
  const occupiedBeds = 30;
  const bedOccupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const kpis = [
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}`, change: '+14% vs last week', color: '#059669', icon: 'wallet' },
    { label: 'Bed Occupancy', value: `${bedOccupancyRate}%`, change: 'Optimal Capacity', color: '#8b5cf6', icon: 'bed' },
    { label: 'OPD Footfall', value: '48 Visits', change: 'Today', color: '#0284c7', icon: 'people' },
    { label: 'Collection Rate', value: `${collectionRate}%`, change: 'Target: >85%', color: '#f59e0b', icon: 'pie-chart' },
  ];

  const departmentRevenues = [
    { dept: 'Cardiology & Vascular', revenue: '$14,200', pct: '38%', color: '#ef4444' },
    { dept: 'Orthopedics & Trauma', revenue: '$9,800', pct: '26%', color: '#f59e0b' },
    { dept: 'Neurology Unit', revenue: '$6,400', pct: '18%', color: '#8b5cf6' },
    { dept: 'Obstetrics & Gyn', revenue: '$4,100', pct: '11%', color: '#ec4899' },
    { dept: 'General OPD & Labs', revenue: '$2,600', pct: '7%', color: '#06b6d4' },
  ];

  return (
    <AppScreen>
      <CurexaHeader
        title="Reports & Analytics"
        subtitle="Hospital Key Performance Indicators"
        showBack
      />

      <ScrollView className="flex-1 px-3 pt-2 pb-24" showsVerticalScrollIndicator={false}>
        {/* KPI Grid */}
        <View className="mb-2.5 flex-row flex-wrap gap-2">
          {kpis.map((kpi, idx) => (
            <View
              key={idx}
              className={`w-[48%] flex-1 rounded-[16px] p-3 shadow-sm ${palette.surface}`}
            >
              <View className="flex-row items-center justify-between">
                <View
                  style={{ backgroundColor: `${kpi.color}20` }}
                  className="h-8 w-8 items-center justify-center rounded-[10px]"
                >
                  <Ionicons name={kpi.icon} size={16} color={kpi.color} />
                </View>
                <Text style={{ color: kpi.color }} className="text-[9px] font-bold">
                  {kpi.change}
                </Text>
              </View>
              <Text className={`mt-2 text-[18px] font-bold ${palette.text}`}>{kpi.value}</Text>
              <Text className={`text-[10px] font-medium ${palette.textMuted}`}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Department Revenue Breakdown */}
        <View className={`mb-2.5 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
          <Text className="mb-1 text-[13px] font-bold text-emerald-600 uppercase tracking-[0.8px]">
            Department Revenue Share
          </Text>
          <Text className={`text-[10px] ${palette.textMuted} mb-3`}>
            Cumulative monthly earnings by clinical division
          </Text>

          <View className="gap-2.5">
            {departmentRevenues.map((d, i) => (
              <View key={i}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`text-[11px] font-bold ${palette.text}`}>{d.dept}</Text>
                  <Text className={`text-[11px] font-bold ${palette.text}`}>
                    {d.revenue} <Text className="text-[9px] font-normal text-emerald-600">({d.pct})</Text>
                  </Text>
                </View>
                <View className="h-2 w-full rounded-full bg-gray-200/20 overflow-hidden">
                  <View
                    style={{ width: d.pct, backgroundColor: d.color }}
                    className="h-full rounded-full"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Operational Efficiency Card */}
        <View className={`mb-3 rounded-[16px] p-3 shadow-sm ${palette.surface}`}>
          <Text className="mb-1 text-[13px] font-bold text-sky-600 uppercase tracking-[0.8px]">
            Operational Quality Metrics
          </Text>
          <View className="mt-2 gap-2">
            <View className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
              <Text className={`text-[11px] font-medium ${palette.text}`}>Average Length of Stay (ALOS)</Text>
              <Text className="text-[12px] font-bold text-emerald-600">3.4 Days</Text>
            </View>
            <View className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
              <Text className={`text-[11px] font-medium ${palette.text}`}>OPD Doctor Wait Time</Text>
              <Text className="text-[12px] font-bold text-sky-600">14 Mins</Text>
            </View>
            <View className={`flex-row items-center justify-between rounded-[12px] p-2.5 ${palette.surfaceInset}`}>
              <Text className={`text-[11px] font-medium ${palette.text}`}>Lab Result Turnaround (TAT)</Text>
              <Text className="text-[12px] font-bold text-purple-600">45 Mins</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
