import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import CandidateDetailsModal from '../_components/CandidateDetailsModal';
import * as hireflowService from '~/services/hireflow';
import { resolveWorkspaceId } from '~/utils/workspace';

const STAGES = [
  { id: 'APPLIED', title: 'Applied', color: 'bg-blue-500', light: 'bg-blue-500/5', border: 'border-blue-500/20', icon: 'document-outline' },
  { id: 'SCREENING', title: 'Screening', color: 'bg-amber-500', light: 'bg-amber-500/5', border: 'border-amber-500/20', icon: 'search-outline' },
  { id: 'INTERVIEW', title: 'Interview', color: 'bg-indigo-500', light: 'bg-indigo-500/5', border: 'border-indigo-500/20', icon: 'chatbubbles-outline' },
  { id: 'OFFERED', title: 'Offered', color: 'bg-emerald-500', light: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: 'checkmark-circle-outline' },
  { id: 'HIRED', title: 'Hired', color: 'bg-violet-500', light: 'bg-violet-500/5', border: 'border-violet-500/20', icon: 'trophy-outline' },
];

function CandidateCard({ candidate, stageColor, onPress }) {
  return (
    <Pressable onPress={onPress} className="mb-2.5 rounded-xl border border-slate-200 bg-white p-3 active:opacity-80 shadow-sm">
      <View className="flex-row items-start gap-2.5">
        <View className={`h-8 w-8 items-center justify-center rounded-full ${stageColor}`}>
          <Text className="text-[10px] font-bold text-white">
            {candidate.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[12px] font-bold text-slate-900">{candidate.name || 'Unknown Candidate'}</Text>
          <Text className="text-[9px] text-slate-500 mt-0.5">{candidate.role || candidate.job?.title || 'Applicant'}</Text>
          <View className="flex-row items-center gap-1.5 mt-1.5">
            <View className="flex-row items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5">
              <Ionicons name="star" size={8} color="#f59e0b" />
              <Text className="text-[8px] font-bold text-amber-600">{candidate.score || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="location-outline" size={8} color="#94a3b8" />
              <Text className="text-[8px] text-slate-400">{candidate.location || 'Remote'}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function PipelineScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { workspaceId: paramWsId } = useLocalSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchApplications = useCallback(async () => {
    setError(null);
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) {
        setError('No workspace ID found.');
        return;
      }
      const data = await hireflowService.getApplications(wsId);
      setApplications(data.data || []);
    } catch (e) {
      console.error('Failed to fetch applications:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to fetch pipeline data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramWsId]);

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [fetchApplications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const getStageApplications = useCallback(
    (stageId) => applications.filter(a => (a.stage || '').toUpperCase() === stageId.toUpperCase()),
    [applications]
  );

  if (error && !applications.length) {
    return (
      <SafeAreaView className={`flex-1 ${palette.page}`}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 mb-4">
            <Ionicons name="alert-circle-outline" size={28} color="#f43f5e" />
          </View>
          <Text className="text-[15px] font-bold text-slate-800 text-center mb-2">Failed to Load Pipeline</Text>
          <Text className="text-[12px] text-slate-500 text-center mb-4">{error}</Text>
          <Pressable onPress={() => { setLoading(true); fetchApplications(); }} className="rounded-xl bg-indigo-600 px-5 py-2.5">
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
          <Text className={`text-[14px] ${palette.textSoft}`}>Loading pipeline...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className={`text-[11px] font-bold uppercase tracking-[2px] ${palette.accentText}`}>HIREFLOW</Text>
            <Text className={`mt-1 text-2xl font-bold ${palette.text}`}>Pipeline Board</Text>
          </View>
          <View className={`flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 bg-slate-100`}>
            <Ionicons name="funnel-outline" size={14} color="#64748b" />
            <Text className="text-[10px] font-bold text-slate-600">Filter</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3">
        <View className="flex-row gap-2">
          {STAGES.map(s => {
            const count = getStageApplications(s.id).length;
            return (
              <View key={s.id} className={`flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 ${s.light}`}>
                <View className={`h-2 w-2 rounded-full ${s.color}`} />
                <Text className="text-[10px] font-bold text-slate-700">{s.title}</Text>
                <View className="rounded-full px-1.5 py-0.5 bg-white">
                  <Text className="text-[8px] font-bold text-slate-500">{count}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 px-4">
        <View className="flex-row gap-3 pb-4" style={{ minHeight: Dimensions.get('window').height - 240 }}>
          {STAGES.map(stage => {
            const stageApplications = getStageApplications(stage.id);
            return (
              <View key={stage.id} className="w-[270px] rounded-xl p-3" style={{ backgroundColor: palette.colors.surfaceMuted }}>
                <View className="flex-row items-center justify-between mb-3 px-1">
                  <View className="flex-row items-center gap-2">
                    <View className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                    <Text className="text-[12px] font-bold text-slate-800">{stage.title}</Text>
                    <View className={`rounded-full px-2 py-0.5 ${stage.light}`}>
                      <Text className="text-[9px] font-bold text-slate-500">{stageApplications.length}</Text>
                    </View>
                  </View>
                  <Pressable className="h-6 w-6 items-center justify-center rounded-md">
                    <Ionicons name="ellipsis-horizontal" size={13} color="#94a3b8" />
                  </Pressable>
                </View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="flex-1"
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                  {stageApplications.map(app => (
                    <CandidateCard
                      key={app.id}
                      candidate={app.candidate ? { ...app.candidate, job: app.job, stage: app.stage } : { name: app.name || 'Unknown Candidate', stage: app.stage }}
                      stageColor={stage.color}
                      onPress={() => { setSelectedCandidate(app.candidate || { name: app.name, role: app.job?.title }); setShowDetails(true); }}
                    />
                  ))}
                  {stageApplications.length === 0 && (
                    <View className="h-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-300">
                      <Text className="text-[10px] italic text-slate-400">No candidates in stage</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <CandidateDetailsModal visible={showDetails} onClose={() => { setShowDetails(false); setSelectedCandidate(null); }} candidate={selectedCandidate} />
    </SafeAreaView>
  );
}