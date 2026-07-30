import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { resolveWorkspaceId } from '~/utils/workspace';
import * as hireflowService from '~/services/hireflow';

const quickActions = [
  { id: 'jobs', label: 'Create Job', icon: 'briefcase-outline', color: '#6366f1', route: '/(modules)/hireflow/jobs' },
  { id: 'candidates', label: 'Add Candidate', icon: 'person-add-outline', color: '#22c55e', route: '/(modules)/hireflow/candidates' },
  { id: 'interviews', label: 'Schedule Interview', icon: 'calendar-outline', color: '#f59e0b', route: '/(modules)/hireflow/interviews' },
  { id: 'departments', label: 'Departments', icon: 'business-outline', color: '#8b5cf6', route: '/(modules)/hireflow/departments' },
];

function MetricCard({ m }) {
  return (
    <View className="w-[48%] rounded-xl border p-3.5 bg-white border-slate-200">
      <View className="flex-row items-center justify-between mb-2.5">
        <View className={`h-9 w-9 items-center justify-center rounded-lg ${m.bg}`}>
          <Ionicons name={m.icon} size={16} color={m.color} />
        </View>
        {m.change ? (
          <View className={`flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5 ${m.trend === 'up' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
            <Ionicons name={m.trend === 'up' ? 'arrow-up' : 'arrow-down'} size={8} color={m.trend === 'up' ? '#22c55e' : '#f43f5e'} />
            <Text className={`text-[8px] font-bold ${m.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.change}</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-xl font-bold text-slate-900">{m.value}</Text>
      <Text className="text-[10px] text-slate-500 mt-0.5">{m.label}</Text>
    </View>
  );
}

export default function HireFlowDashboard() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { workspaceId: paramsWorkspaceId } = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setError(null);
    try {
      const wsId = await resolveWorkspaceId(paramsWorkspaceId);
      if (!wsId) {
        setError("No workspace ID found. Please log in again.");
        return;
      }
      const res = await hireflowService.getSummary(wsId);
      setSummary(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramsWorkspaceId]);

  useEffect(() => {
    setLoading(true);
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const s = summary || {};

  const metrics = [
    { id: '1', label: 'Total Applicants', value: s.totalCandidates ?? s.stats?.[0]?.value ?? '--', icon: 'people-outline', color: '#6366f1', bg: 'bg-indigo-500/10', change: null, trend: 'up' },
    { id: '2', label: 'Active Openings', value: s.activeJobs ?? s.stats?.[1]?.value ?? '--', icon: 'briefcase-outline', color: '#22c55e', bg: 'bg-emerald-500/10', change: null, trend: 'up' },
    { id: '3', label: 'Interviews Scheduled', value: s.upcomingInterviews ?? s.interviews?.length ?? '--', icon: 'calendar-outline', color: '#f59e0b', bg: 'bg-amber-500/10', change: null, trend: 'up' },
    { id: '6', label: 'Candidates in Pipeline', value: s.pipelineCandidates ?? '--', icon: 'funnel-outline', color: '#8b5cf6', bg: 'bg-violet-500/10', change: null, trend: 'up' },
  ];

  const pipelineData = s.pipelineStats || [];
  const pipelineStages = [
    { label: 'Applied', count: pipelineData.find(p => p.label === 'APPLIED')?.count ?? pipelineData[0]?._count ?? '--', color: 'bg-blue-500', pct: pipelineData.find(p => p.label === 'APPLIED')?.percentage ?? 0 },
    { label: 'Screening', count: pipelineData.find(p => p.label === 'SCREENING')?.count ?? '--', color: 'bg-amber-500', pct: pipelineData.find(p => p.label === 'SCREENING')?.percentage ?? 0 },
    { label: 'Interview', count: pipelineData.find(p => p.label === 'INTERVIEW')?.count ?? '--', color: 'bg-indigo-500', pct: pipelineData.find(p => p.label === 'INTERVIEW')?.percentage ?? 0 },
    { label: 'Offered', count: pipelineData.find(p => p.label === 'OFFERED')?.count ?? '--', color: 'bg-emerald-500', pct: pipelineData.find(p => p.label === 'OFFERED')?.percentage ?? 0 },
    { label: 'Hired', count: pipelineData.find(p => p.label === 'HIRED')?.count ?? '--', color: 'bg-violet-500', pct: pipelineData.find(p => p.label === 'HIRED')?.percentage ?? 0 },
  ];

  const todayInterviews = s.interviews || [];

  if (error && !summary) {
    return (
      <SafeAreaView className={`flex-1 ${palette.page}`}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 mb-4">
            <Ionicons name="alert-circle-outline" size={28} color="#f43f5e" />
          </View>
          <Text className="text-[15px] font-bold text-slate-800 text-center mb-2">Failed to Load Data</Text>
          <Text className="text-[12px] text-slate-500 text-center mb-4">{error}</Text>
          <Pressable onPress={() => { setLoading(true); fetchSummary(); }} className="rounded-xl bg-indigo-600 px-5 py-2.5">
            <Text className="text-[12px] font-bold text-white">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${palette.page}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={`text-[14px] ${palette.textSoft}`}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <Animated.ScrollView
        className={`flex-1 ${palette.page}`}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View className="px-4 pb-8 pt-4">
          {/* Header */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-[11px] font-bold uppercase tracking-[2px] ${palette.accentText}`}>HIREFLOW</Text>
                <Text className={`mt-1 text-2xl font-bold ${palette.text}`}>Recruitment Hub</Text>
              </View>
              <Pressable onPress={() => router.push('/(modules)/hireflow/settings')} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="settings-outline" size={18} color="#64748b" />
              </Pressable>
            </View>
            <Text className={`mt-1 text-[12px] ${palette.textSoft}`}>Manage your talent pipeline and job openings from one place.</Text>
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-2 mb-5">
            {quickActions.map(a => (
              <Pressable key={a.id} onPress={() => router.push(a.route)} className="flex-1 items-center gap-1 rounded-xl border border-slate-200 bg-white py-3">
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: a.color + '15' }}>
                  <Ionicons name={a.icon} size={14} color={a.color} />
                </View>
                <Text className="text-[9px] font-bold text-slate-700 text-center">{a.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Metrics Grid */}
          <View className="flex-row flex-wrap gap-3 mb-5">
            {metrics.map((m) => <MetricCard key={m.id} m={m} />)}
          </View>

          {/* Pipeline Funnel */}
          <View className="rounded-xl border p-4 mb-4 bg-white border-slate-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[13px] font-bold text-slate-900">Pipeline Funnel</Text>
              <Pressable onPress={() => router.push('/(modules)/hireflow/pipeline')}>
                <Text className="text-[10px] font-bold text-indigo-600">View Board →</Text>
              </Pressable>
            </View>
            {pipelineStages.map((stg, i) => (
              <View key={i} className="flex-row items-center gap-3 py-1.5">
                <View className={`h-2.5 w-2.5 rounded-full ${stg.color}`} />
                <Text className="flex-1 text-[12px] text-slate-700">{stg.label}</Text>
                <View className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <View className={`h-full rounded-full ${stg.color}`} style={{ width: `${stg.pct}%` }} />
                </View>
                <Text className="text-[12px] font-bold text-slate-900 w-8 text-right">{stg.count}</Text>
              </View>
            ))}
          </View>

          {/* Upcoming Interviews */}
          <View className="rounded-xl border p-4 mb-4 bg-white border-slate-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[13px] font-bold text-slate-900">Today's Interviews</Text>
              <Pressable onPress={() => router.push('/(modules)/hireflow/interviews')}>
                <Text className="text-[10px] font-bold text-indigo-600">View All →</Text>
              </Pressable>
            </View>
            {todayInterviews.length > 0 ? todayInterviews.map(i => (
              <View key={i.id} className="flex-row items-center gap-3 p-3 bg-slate-50 rounded-lg mb-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
                  <Text className="text-[11px] font-bold text-indigo-600">{i.name?.split(' ').map(n => n[0]).join('') || '?'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold text-slate-900">{i.name || 'Candidate'}</Text>
                  <Text className="text-[11px] text-slate-500">{i.role || 'Interview'}</Text>
                </View>
                <Text className="text-[11px] text-slate-600">{i.time || i.startTime}</Text>
              </View>
            )) : (
              <View className="py-6 items-center">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 mb-2">
                  <Ionicons name="calendar-outline" size={18} color="#f59e0b" />
                </View>
                <Text className="text-[12px] text-slate-400">No interviews scheduled today</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}