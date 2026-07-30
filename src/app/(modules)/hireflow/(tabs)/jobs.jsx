import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import JobCreateModal from '../_components/JobCreateModal';
import AdvancedFilters from '../_components/AdvancedFilters';
import * as hireflowService from '~/services/hireflow';
import { resolveWorkspaceId } from '~/utils/workspace';

const statusConfig = {
  OPEN: { label: 'Open', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  DRAFT: { label: 'Draft', dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-500/10' },
  CLOSED: { label: 'Closed', dot: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-500/10' },
  ARCHIVED: { label: 'Archived', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function JobsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { workspaceId: paramWsId } = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [view, setView] = useState('list');
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setError(null);
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) {
        setError('No workspace ID found.');
        return;
      }
      const data = await hireflowService.getJobs(wsId);
      setJobs(data.data || []);
    } catch (e) {
      console.error('Failed to fetch jobs:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramWsId]);

  useEffect(() => {
    setLoading(true);
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleCreateJob = async (form) => {
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) return;
      const body = { ...form, workspaceId: wsId };
      await hireflowService.createJob(body);
      fetchJobs();
    } catch (e) {
      console.error('Failed to create job:', e);
    }
  };

  const handleEditJob = async (form) => {
    try {
      if (!form.id) return;
      await hireflowService.updateJob(form.id, form);
      fetchJobs();
    } catch (e) {
      console.error('Failed to update job:', e);
    }
  };

  const filtered = jobs.filter(j => {
    const titleMatch = j.title ? j.title.toLowerCase().includes(search.toLowerCase()) : false;
    const deptMatch = j.department ? j.department.toLowerCase().includes(search.toLowerCase()) : (j.dept ? j.dept.toLowerCase().includes(search.toLowerCase()) : false);
    const locMatch = j.location ? j.location.toLowerCase().includes(search.toLowerCase()) : false;
    const matchSearch = titleMatch || deptMatch || locMatch;
    if (tab === 'all') return matchSearch;
    return matchSearch && j.status === tab;
  });

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <ScrollView
        className={`flex-1 ${palette.page}`}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8 pt-4">
          {/* Header */}
          <View className="mb-4">
            <Text className={`text-[11px] font-bold uppercase tracking-[2px] ${palette.accentText}`}>HIREFLOW</Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className={`text-2xl font-bold ${palette.text}`}>Job Management</Text>
              <Pressable onPress={() => setShowCreate(true)} className="flex-row items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2">
                <Ionicons name="add" size={16} color="#fff" />
                <Text className="text-[11px] font-bold text-white">Create</Text>
              </Pressable>
            </View>
          </View>

          {/* Search + Filter */}
          <View className="flex-row gap-2 mb-3">
            <View className={`flex-1 flex-row items-center rounded-xl border px-3.5 py-2.5 ${palette.surface} ${palette.border}`}>
              <Ionicons name="search-outline" size={16} color={palette.textMutedColor} />
              <TextInput placeholder="Search positions..." placeholderTextColor={palette.textMutedColor} value={search} onChangeText={setSearch} className={`ml-2 flex-1 text-[12px] ${palette.text}`} />
              {search ? <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={palette.textMutedColor} /></Pressable> : null}
            </View>
            <Pressable onPress={() => setShowFilters(true)} className={`h-11 w-11 items-center justify-center rounded-xl border ${palette.surface} ${palette.border}`}>
              <Ionicons name="options-outline" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          {/* Tabs + View toggle */}
          <View className="mb-4 flex-row gap-1.5">
            {[{ key: 'all', label: 'All' }, { key: 'OPEN', label: 'Open' }, { key: 'DRAFT', label: 'Draft' }, { key: 'CLOSED', label: 'Closed' }].map(t => (
              <Pressable key={t.key} onPress={() => setTab(t.key)} className={`rounded-lg px-3 py-1.5 ${tab === t.key ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                <Text className={`text-[11px] font-bold ${tab === t.key ? 'text-white' : 'text-slate-600'}`}>{t.label}</Text>
              </Pressable>
            ))}
            <View className="flex-1" />
            <View className="flex-row rounded-lg p-0.5 bg-slate-100">
              <Pressable onPress={() => setView('list')} className={`rounded-md px-2.5 py-1.5 ${view === 'list' ? 'bg-indigo-600' : ''}`}>
                <Ionicons name="list-outline" size={14} color={view === 'list' ? '#fff' : '#64748b'} />
              </Pressable>
              <Pressable onPress={() => setView('grid')} className={`rounded-md px-2.5 py-1.5 ${view === 'grid' ? 'bg-indigo-600' : ''}`}>
                <Ionicons name="grid-outline" size={14} color={view === 'grid' ? '#fff' : '#64748b'} />
              </Pressable>
            </View>
          </View>

          {/* Department link */}
          <Pressable onPress={() => router.push('/(modules)/hireflow/departments')} className="flex-row items-center gap-2 mb-3 rounded-lg px-3 py-2 bg-slate-100">
            <Ionicons name="business-outline" size={14} color="#64748b" />
            <Text className="flex-1 text-[11px] text-slate-600">Manage departments</Text>
            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
          </Pressable>

          {/* Error state */}
          {error && !jobs.length ? (
            <View className="items-center py-12 px-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 mb-3">
                <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 text-center mb-1">Failed to Load Jobs</Text>
              <Text className="text-[11px] text-slate-500 text-center mb-3">{error}</Text>
              <Pressable onPress={() => { setLoading(true); fetchJobs(); }} className="rounded-xl bg-indigo-600 px-4 py-2">
                <Text className="text-[11px] font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View className="items-center py-16">
              <Text className={`text-[14px] ${palette.textSoft}`}>Loading jobs...</Text>
            </View>
          ) : view === 'list' ? filtered.map(job => {
            const sc = statusConfig[job.status] || statusConfig.OPEN;
            return (
              <Pressable key={job.id} className="mb-2.5 rounded-xl border p-4 bg-white border-slate-200 active:opacity-80">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className={`h-10 w-10 items-center justify-center rounded-xl ${sc.bg}`}>
                      <Ionicons name="briefcase-outline" size={18} color={sc.text === 'text-emerald-600' ? '#16a34a' : sc.text === 'text-blue-600' ? '#2563eb' : '#e11d48'} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14px] font-bold text-slate-900">{job.title}</Text>
                      <Text className="text-[10px] text-slate-500">{job.department || job.dept || 'General'} · {job.type || 'Full-time'}</Text>
                    </View>
                  </View>
                  <Pressable className="h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                    <Ionicons name="ellipsis-horizontal" size={14} color="#64748b" />
                  </Pressable>
                </View>
                <View className="mt-2 flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1"><Ionicons name="location-outline" size={11} color="#94a3b8" /><Text className="text-[10px] text-slate-500">{job.location || 'Remote'}</Text></View>
                  <View className="flex-row items-center gap-1"><Ionicons name="people-outline" size={11} color="#94a3b8" /><Text className="text-[10px] text-slate-500">{job._count?.applications || job.applicants || 0} applicants</Text></View>
                  <View className={`ml-auto flex-row items-center gap-1 rounded-full px-2 py-0.5 ${sc.bg}`}>
                    <View className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    <Text className={`text-[9px] font-bold ${sc.text}`}>{sc.label}</Text>
                  </View>
                </View>
                <View className="mt-2 flex-row items-center gap-1"><Text className="text-[9px] text-slate-400">{job.salaryRange || job.salary || 'Not specified'}</Text></View>
                <View className="mt-2 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[9px] text-slate-400">Created {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : job.created || 'recently'}</Text>
                  <Pressable onPress={() => router.push('/(modules)/hireflow/pipeline')} className="rounded-lg bg-indigo-600 px-3 py-1.5">
                    <Text className="text-[9px] font-bold text-white">View Pipeline</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }) : (
            <View className="flex-row flex-wrap gap-3">
              {filtered.map(job => {
                const sc = statusConfig[job.status] || statusConfig.OPEN;
                return (
                  <Pressable key={job.id} className="w-[48%] rounded-xl border p-3.5 bg-white border-slate-200 active:opacity-80">
                    <View className={`h-9 w-9 items-center justify-center rounded-lg ${sc.bg} mb-2.5`}>
                      <Ionicons name="briefcase-outline" size={16} color={sc.text === 'text-emerald-600' ? '#16a34a' : sc.text === 'text-blue-600' ? '#2563eb' : '#e11d48'} />
                    </View>
                    <Text className="text-[13px] font-bold text-slate-900 mb-1">{job.title}</Text>
                    <Text className="text-[9px] text-slate-500 mb-1.5">{job.department || job.dept || 'General'} · {job.type || 'Full-time'}</Text>
                    <View className="flex-row items-center gap-1 mb-2"><Ionicons name="location-outline" size={10} color="#94a3b8" /><Text className="text-[9px] text-slate-500 flex-1">{job.location || 'Remote'}</Text></View>
                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
                      <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${sc.bg}`}>
                        <View className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        <Text className={`text-[8px] font-bold ${sc.text}`}>{sc.label}</Text>
                      </View>
                      <Text className="text-[11px] font-bold text-slate-900">{job._count?.applications || job.applicants || 0}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {filtered.length === 0 && !loading && !error && (
            <View className="items-center py-16">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <Ionicons name="briefcase-outline" size={24} color="#94a3b8" />
              </View>
              <Text className="text-[15px] font-bold text-slate-400">No positions found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <JobCreateModal visible={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleCreateJob} />
      <AdvancedFilters visible={showFilters} onClose={() => setShowFilters(false)} />
    </SafeAreaView>
  );
}