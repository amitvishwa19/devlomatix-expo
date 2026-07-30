import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useLocalSearchParams } from 'expo-router';
import InterviewScheduler from './_components/InterviewScheduler';
import * as hireflowService from '~/services/hireflow';
import { resolveWorkspaceId } from '~/utils/workspace';

const statusConfig = {
  upcoming: { label: 'Upcoming', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  scheduled: { label: 'Scheduled', dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  completed: { label: 'Completed', dot: 'bg-slate-400', bg: 'bg-slate-500/10', text: 'text-slate-500' },
  cancelled: { label: 'Cancelled', dot: 'bg-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-600' },
};

export default function InterviewsScreen() {
  const { palette } = useAppTheme();
  const { workspaceId: paramWsId } = useLocalSearchParams();
  const [filter, setFilter] = useState('all');
  const [showScheduler, setShowScheduler] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchInterviews = useCallback(async () => {
    setError(null);
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) {
        setError('No workspace ID found.');
        return;
      }
      const data = await hireflowService.getInterviews(wsId);
      setInterviews(data.data || []);
    } catch (e) {
      console.error('Failed to fetch interviews:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to fetch interviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramWsId]);

  useEffect(() => {
    setLoading(true);
    fetchInterviews();
  }, [fetchInterviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInterviews();
  };

  const handleSchedule = async (form) => {
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) return;
      await hireflowService.createInterview({ ...form, workspaceId: wsId });
      fetchInterviews();
    } catch (e) {
      console.error('Failed to schedule interview:', e);
    }
  };

  const filtered = filter === 'all' ? interviews : interviews.filter(i => i.status === filter);

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <ScrollView
        className={`flex-1 ${palette.page}`}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8 pt-4">
          <View className="mb-5">
            <Text className={`text-[11px] font-bold uppercase tracking-[2px] ${palette.accentText}`}>HIREFLOW</Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className={`text-2xl font-bold ${palette.text}`}>Interviews</Text>
              <Pressable onPress={() => setShowScheduler(true)} className="flex-row items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2">
                <Ionicons name="add" size={16} color="#fff" />
                <Text className="text-[11px] font-bold text-white">Schedule</Text>
              </Pressable>
            </View>
          </View>

          {/* Summary cards */}
          <View className="flex-row gap-3 mb-4">
            {[
              { label: 'Today', count: interviews.filter(i => i.date === 'Today').length, color: 'bg-indigo-500', icon: 'calendar-outline' },
              { label: 'Upcoming', count: interviews.filter(i => i.status === 'upcoming' || i.status === 'scheduled').length, color: 'bg-emerald-500', icon: 'time-outline' },
              { label: 'Completed', count: interviews.filter(i => i.status === 'completed').length, color: 'bg-blue-500', icon: 'checkmark-outline' },
              { label: 'Total', count: interviews.length, color: 'bg-slate-500', icon: 'stats-chart-outline' },
            ].map((s, i) => (
              <View key={i} className="flex-1 rounded-xl border p-3 bg-white border-slate-200 items-center">
                <View className={`h-7 w-7 items-center justify-center rounded-lg ${s.color}/10 mb-1`}>
                  <Ionicons name={s.icon} size={12} color={s.color.replace('bg-', '#')} />
                </View>
                <Text className="text-[16px] font-bold text-slate-900">{s.count}</Text>
                <Text className="text-[8px] text-slate-500">{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-1.5">
              {[
                { key: 'all', label: 'All', count: interviews.length },
                { key: 'upcoming', label: 'Upcoming', count: interviews.filter(i => i.status === 'upcoming').length },
                { key: 'scheduled', label: 'Scheduled', count: interviews.filter(i => i.status === 'scheduled').length },
                { key: 'completed', label: 'Completed', count: interviews.filter(i => i.status === 'completed').length },
                { key: 'cancelled', label: 'Cancelled', count: interviews.filter(i => i.status === 'cancelled').length },
              ].map(t => (
                <Pressable key={t.key} onPress={() => setFilter(t.key)} className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 ${filter === t.key ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                  <Text className={`text-[10px] font-bold ${filter === t.key ? 'text-white' : 'text-slate-600'}`}>{t.label}</Text>
                  <View className={`rounded-full px-1.5 py-0.5 ${filter === t.key ? 'bg-white/20' : 'bg-slate-200'}`}>
                    <Text className={`text-[8px] font-bold ${filter === t.key ? 'text-white' : 'text-slate-500'}`}>{t.count}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Interview list */}
          {error && !interviews.length ? (
            <View className="items-center py-12 px-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 mb-3">
                <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 text-center mb-1">Failed to Load Interviews</Text>
              <Text className="text-[11px] text-slate-500 text-center mb-3">{error}</Text>
              <Pressable onPress={() => { setLoading(true); fetchInterviews(); }} className="rounded-xl bg-indigo-600 px-4 py-2">
                <Text className="text-[11px] font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View className="items-center py-16"><Text className={`text-[14px] ${palette.textSoft}`}>Loading interviews...</Text></View>
          ) : filtered.map(i => {
            const sc = statusConfig[i.status] || statusConfig.scheduled;
            return (
              <View key={i.id} className={`mb-3 rounded-xl border p-4 bg-white border-slate-200`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                      <Text className="text-[12px] font-bold text-indigo-600">
                        {i.candidate?.name?.split(' ').map(n => n[0]).join('') || '?'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14px] font-bold text-slate-900">{i.candidate?.name || i.candidateName || 'Unknown Candidate'}</Text>
                      <Text className="text-[10px] text-slate-500">{i.application?.job?.title || i.title || 'Interview'}</Text>
                    </View>
                    <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${sc.bg}`}>
                      <View className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                      <Text className={`text-[8px] font-bold ${sc.text}`}>{sc.label}</Text>
                    </View>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
                      <Text className="text-[10px] text-slate-500">{i.date || i.startTime?.split('T')[0] || 'TBD'}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time-outline" size={11} color="#94a3b8" />
                      <Text className="text-[10px] text-slate-500">{i.time || i.startTime?.split('T')[1]?.substring(0, 5) || 'TBD'}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="hourglass-outline" size={11} color="#94a3b8" />
                      <Text className="text-[10px] text-slate-500">{i.duration || '60 min'}</Text>
                    </View>
                  </View>
                </View>

                <View className="mt-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="person-outline" size={10} color="#94a3b8" />
                      <Text className="text-[9px] text-slate-400">{i.interviewer || i.interviewers?.[0] || 'TBD'}</Text>
                    </View>
                    <View className={`rounded-md px-1.5 py-0.5 ${palette.surfaceMuted}`}>
                      <Text className={`text-[8px] ${palette.textMuted}`}>{i.mode || i.location || 'Video Call'}</Text>
                    </View>
                  </View>
                  {i.status === 'upcoming' && (
                    <Pressable className="rounded-lg bg-indigo-600 px-3 py-1.5">
                      <Text className="text-[9px] font-bold text-white">Join</Text>
                    </Pressable>
                  )}
                  {i.status === 'completed' && (
                    <Pressable className="rounded-lg bg-slate-100 px-3 py-1.5">
                      <Text className="text-[9px] font-bold text-slate-600">View Notes</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {filtered.length === 0 && !loading && !error && (
            <View className="items-center py-16">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <Ionicons name="calendar-outline" size={24} color="#94a3b8" />
              </View>
              <Text className="text-[15px] font-bold text-slate-400">No interviews found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <InterviewScheduler visible={showScheduler} onClose={() => setShowScheduler(false)} candidateName="" onSuccess={handleSchedule} />
    </SafeAreaView>
  );
}