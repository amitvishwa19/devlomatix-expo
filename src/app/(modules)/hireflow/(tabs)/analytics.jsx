import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useLocalSearchParams } from 'expo-router';
import * as hireflowService from '~/services/hireflow';
import { resolveWorkspaceId } from '~/utils/workspace';

export default function AnalyticsScreen() {
  const { palette } = useAppTheme();
  const { workspaceId: paramWsId } = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) {
        setError('No workspace ID found.');
        return;
      }
      const [s, a] = await Promise.all([
        hireflowService.getSummary(wsId),
        hireflowService.getActivities(wsId),
      ]);
      setSummary(s.data);
      setActivities(a.data || []);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramWsId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (error && !summary) {
    return (
      <SafeAreaView className={`flex-1 ${palette.page}`}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 mb-4">
            <Ionicons name="alert-circle-outline" size={28} color="#f43f5e" />
          </View>
          <Text className="text-[15px] font-bold text-slate-800 text-center mb-2">Failed to Load Analytics</Text>
          <Text className="text-[12px] text-slate-500 text-center mb-4">{error}</Text>
          <Pressable onPress={() => { setLoading(true); fetchData(); }} className="rounded-xl bg-indigo-600 px-5 py-2.5">
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
          <Text className={`text-[14px] ${palette.textSoft}`}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const s = summary || {};

  const quickStats = [
    { id: '1', label: 'Avg Days to Hire', value: s.avgTimeToHire || '18', icon: 'time-outline', color: '#6366f1', bg: 'bg-indigo-500/10', trend: '+2' },
    { id: '2', label: 'Offer Acceptance', value: s.offerAcceptanceRate || '92%', icon: 'checkmark-circle-outline', color: '#22c55e', bg: 'bg-emerald-500/10', trend: '+5%' },
    { id: '3', label: 'Interview Pass Rate', value: s.interviewPassRate || '67%', icon: 'trending-up-outline', color: '#f59e0b', bg: 'bg-amber-500/10', trend: '-3%' },
    { id: '4', label: 'Cost per Hire', value: s.costPerHire || '₹--', icon: 'cash-outline', color: '#ec4899', bg: 'bg-pink-500/10', trend: '--' },
  ];

  const funnelStages = [
    { label: 'Applied', count: s.stageApplied || '--', pct: s.stageAppliedPct || 100, color: 'bg-blue-500' },
    { label: 'Screening', count: s.stageScreening || '--', pct: s.stageScreeningPct || 68, color: 'bg-amber-500' },
    { label: 'Interview', count: s.stageInterview || '--', pct: s.stageInterviewPct || 42, color: 'bg-indigo-500' },
    { label: 'Offered', count: s.stageOffered || '--', pct: s.stageOfferedPct || 18, color: 'bg-emerald-500' },
    { label: 'Hired', count: s.stageHired || '--', pct: s.stageHiredPct || 12, color: 'bg-violet-500' },
  ];

  const sourceData = [
    { label: 'LinkedIn', value: s.sourceLinkedIn || 45, color: 'bg-blue-500' },
    { label: 'Referrals', value: s.sourceReferrals || 25, color: 'bg-emerald-500' },
    { label: 'Company Site', value: s.sourceCompanySite || 18, color: 'bg-amber-500' },
    { label: 'Job Boards', value: s.sourceJobBoards || 8, color: 'bg-purple-500' },
    { label: 'Other', value: s.sourceOther || 4, color: 'bg-slate-400' },
  ];

  const teamData = (activities || []).filter(a => a && (a.type === 'interview' || a.type === 'scorecard'))
    .reduce((acc, a) => {
      const user = a.user || 'Unknown User';
      if (!acc[user]) acc[user] = { name: user, interviews: 0, scores: [] };
      if (a.type === 'interview') acc[user].interviews++;
      if (a.type === 'scorecard' && a.score) acc[user].scores.push(a.score);
      return acc;
    }, {});

  const teamList = Object.values(teamData).map(t => ({
    name: t.name,
    interviews: t.interviews,
    avgScore: t.scores.length ? (t.scores.reduce((a, b) => a + b, 0) / t.scores.length).toFixed(1) : 'N/A',
    acceptRate: 'N/A',
  }));

  const positionHealth = s.positionHealth || [
    { role: 'Frontend Developer', health: 78, velocity: 'Fast', candidates: 12 },
    { role: 'Product Designer', health: 65, velocity: 'Medium', candidates: 8 },
    { role: 'Backend Engineer', health: 45, velocity: 'Slow', candidates: 5 },
  ];

  const diversityData = s.diversity || [
    { label: 'Male', value: 58, color: 'bg-blue-500' },
    { label: 'Female', value: 38, color: 'bg-rose-500' },
    { label: 'Non-binary', value: 4, color: 'bg-amber-500' },
  ];

  const monthlyTrend = s.monthlyTrend || [
    { month: 'Feb', apps: 24, interviews: 12, hires: 3 },
    { month: 'Mar', apps: 32, interviews: 18, hires: 5 },
    { month: 'Apr', apps: 28, interviews: 15, hires: 4 },
    { month: 'May', apps: 36, interviews: 22, hires: 7 },
    { month: 'Jun', apps: 42, interviews: 25, hires: 6 },
    { month: 'Jul', apps: 38, interviews: 20, hires: 8 },
  ];

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
            <Text className={`text-[11px] font-bold uppercase tracking-[2px] ${palette.accentText}`}>HIREFLOW</Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className={`text-2xl font-bold ${palette.text}`}>Analytics</Text>
              <View className={`flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 bg-slate-100`}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text className="text-[10px] font-bold text-slate-600">Last 30 Days</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            {quickStats.map(stat => (
              <View key={stat.id} className="w-[48%] rounded-xl border p-3.5 bg-white border-slate-200">
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className={`h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                    <Ionicons name={stat.icon} size={16} color={stat.color} />
                  </View>
                  <View className="flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5 bg-slate-100">
                    <Text className="text-[8px] font-bold text-slate-500">{stat.trend}</Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-slate-900">{stat.value}</Text>
                <Text className="text-[10px] text-slate-500 mt-0.5">{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Monthly Trend */}
          <View className="rounded-xl border p-4 mb-4 bg-white border-slate-200">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Ionicons name="trending-up-outline" size={16} color="#6366f1" />
              </View>
              <Text className="text-[13px] font-bold text-slate-900">Monthly Hiring Trend</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4 pb-2">
                {monthlyTrend.map((m, i) => (
                  <View key={i} className="items-center" style={{ minWidth: 48 }}>
                    <Text className="text-[9px] text-slate-400 mb-2">{m.month}</Text>
                    <View className="h-24 justify-end items-center gap-0.5">
                      <View className="w-3 bg-indigo-500 rounded-t-sm" style={{ height: (m.apps / 42) * 60 }} />
                      <View className="w-3 bg-amber-500 rounded-t-sm" style={{ height: (m.interviews / 42) * 60 }} />
                      <View className="w-3 bg-emerald-500 rounded-t-sm" style={{ height: (m.hires / 42) * 60 }} />
                    </View>
                    <Text className="text-[7px] text-slate-400 mt-1">{m.apps}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View className="flex-row gap-3 mt-2 pt-2 border-t border-slate-100">
              <View className="flex-row items-center gap-1"><View className="h-2 w-2 rounded-sm bg-indigo-500" /><Text className="text-[8px] text-slate-500">Apps</Text></View>
              <View className="flex-row items-center gap-1"><View className="h-2 w-2 rounded-sm bg-amber-500" /><Text className="text-[8px] text-slate-500">Interviews</Text></View>
              <View className="flex-row items-center gap-1"><View className="h-2 w-2 rounded-sm bg-emerald-500" /><Text className="text-[8px] text-slate-500">Hires</Text></View>
            </View>
          </View>

          {/* Funnel Velocity */}
          <View className="rounded-xl border p-4 mb-4 bg-white border-slate-200">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Ionicons name="funnel-outline" size={16} color="#6366f1" />
              </View>
              <Text className="text-[13px] font-bold text-slate-900">Hiring Funnel Velocity</Text>
            </View>
            {funnelStages.map((stage, i) => (
              <View key={i} className="py-1.5">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[10px] text-slate-400 w-4">{i + 1}</Text>
                    <Text className="text-[11px] font-medium text-slate-700">{stage.label}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[11px] font-bold text-slate-900">{stage.count}</Text>
                    <Text className="text-[9px] text-slate-400">{stage.pct}%</Text>
                  </View>
                </View>
                <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <View className={`h-full rounded-full ${stage.color}`} style={{ width: `${stage.pct}%` }} />
                </View>
              </View>
            ))}
          </View>

          {/* Diversity */}
          <View className="rounded-xl border p-4 mb-4 bg-white border-slate-200">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Ionicons name="people-outline" size={16} color="#22c55e" />
              </View>
              <Text className="text-[13px] font-bold text-slate-900">Diversity & Inclusion</Text>
            </View>
            {diversityData.map((d, i) => (
              <View key={i} className="py-1.5">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[11px] text-slate-700">{d.label}</Text>
                  <Text className="text-[10px] font-bold text-slate-900">{d.value}%</Text>
                </View>
                <View className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <View className={`h-full rounded-full ${d.color}`} style={{ width: `${d.value}%` }} />
                </View>
              </View>
            ))}
          </View>

          {/* Sourcing Mix */}
          <View className="rounded-xl border p-4 mb-4 bg-white border-slate-200">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Ionicons name="pie-chart-outline" size={16} color="#f59e0b" />
              </View>
              <Text className="text-[13px] font-bold text-slate-900">Sourcing Mix</Text>
            </View>
            {sourceData.map((src, i) => (
              <View key={i} className="flex-row items-center gap-3 py-1.5">
                <View className={`h-2.5 w-2.5 rounded-full ${src.color}`} />
                <Text className="flex-1 text-[11px] text-slate-700">{src.label}</Text>
                <View className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <View className={`h-full rounded-full ${src.color}`} style={{ width: `${src.value}%` }} />
                </View>
                <Text className="text-[10px] font-bold text-slate-900 w-8 text-right">{src.value}%</Text>
              </View>
            ))}
          </View>

          {/* Team Performance */}
          <View className="rounded-xl border p-4 mb-4 bg-white border-slate-200">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                <Ionicons name="trophy-outline" size={16} color="#f43f5e" />
              </View>
              <Text className="text-[13px] font-bold text-slate-900">Hiring Team Impact</Text>
            </View>
            {teamList.length > 0 ? teamList.map((t, i) => (
              <View key={i} className="flex-row items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
                  <Text className="text-[10px] font-bold text-indigo-600">{t.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-bold text-slate-900">{t.name}</Text>
                  <Text className="text-[9px] text-slate-500">{t.interviews} interviews</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[11px] font-bold text-indigo-600">{t.avgScore}</Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-[8px] text-slate-400">Accept</Text>
                    <Text className="text-[9px] font-bold text-emerald-600">{t.acceptRate}</Text>
                  </View>
                </View>
              </View>
            )) : (
              <View className="items-center py-6">
                <Text className="text-[12px] text-slate-400">No team data available</Text>
              </View>
            )}
          </View>

          {/* Position Health */}
          <View className="rounded-xl border p-4 bg-white border-slate-200">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                <Ionicons name="briefcase-outline" size={16} color="#0ea5e9" />
              </View>
              <Text className="text-[13px] font-bold text-slate-900">Position Health & Velocity</Text>
            </View>
            {positionHealth.map((p, i) => (
              <View key={i} className="p-3 mb-2 rounded-lg bg-slate-50 border border-slate-100 last:mb-0">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[12px] font-bold text-slate-900">{p.role}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${p.velocity === 'Fast' ? 'bg-emerald-500/10' : p.velocity === 'Medium' ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                    <Text className={`text-[8px] font-bold ${p.velocity === 'Fast' ? 'text-emerald-600' : p.velocity === 'Medium' ? 'text-amber-600' : 'text-rose-600'}`}>{p.velocity}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-[8px] text-slate-400">Pipeline Health</Text>
                      <Text className="text-[9px] font-bold text-slate-700">{p.health}%</Text>
                    </View>
                    <View className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <View className={`h-full rounded-full ${p.health >= 60 ? 'bg-emerald-500' : p.health >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${p.health}%` }} />
                    </View>
                  </View>
                  <View className="items-center px-3">
                    <Text className="text-[13px] font-bold text-slate-900">{p.candidates}</Text>
                    <Text className="text-[8px] text-slate-400">Applicants</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}