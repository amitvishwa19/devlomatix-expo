import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import AddCandidateModal from '../_components/AddCandidateModal';
import CandidateDetailsModal from '../_components/CandidateDetailsModal';
import AdvancedFilters from '../_components/AdvancedFilters';
import BulkActionsBar from '../_components/BulkActionsBar';
import * as hireflowService from '~/services/hireflow';
import { resolveWorkspaceId } from '~/utils/workspace';

const stageColors = {
  Applied: { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  Screening: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  Interview: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  Offered: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  Hired: { bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
};

export default function CandidatesScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { workspaceId: paramWsId } = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [view, setView] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCandidates = useCallback(async () => {
    setError(null);
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) {
        setError('No workspace ID found.');
        return;
      }
      const data = await hireflowService.getCandidates(wsId);
      setCandidates(data.data || []);
    } catch (e) {
      console.error('Failed to fetch candidates:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to fetch candidates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramWsId]);

  useEffect(() => {
    setLoading(true);
    fetchCandidates();
  }, [fetchCandidates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCandidates();
  };

  const handleCreateCandidate = async (form) => {
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) return;
      const body = {
        ...form,
        workspaceId: wsId,
        skills: form.skills?.split(',').map(s => s.trim()).filter(Boolean) || []
      };
      await hireflowService.createCandidate(body);
      fetchCandidates();
    } catch (e) {
      console.error('Failed to create candidate:', e);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = candidates.filter(c => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.role?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()));
    if (stageFilter === 'all') return matchSearch;
    return matchSearch && c.stage === stageFilter;
  });

  const stageCounts = candidates.reduce((acc, c) => {
    if (c.stage) acc[c.stage] = (acc[c.stage] || 0) + 1;
    return acc;
  }, {});

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
              <Text className={`text-2xl font-bold ${palette.text}`}>Talent Database</Text>
              <Pressable onPress={() => setShowAdd(true)} className="flex-row items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2">
                <Ionicons name="person-add" size={16} color="#fff" />
                <Text className="text-[11px] font-bold text-white">Add</Text>
              </Pressable>
            </View>
          </View>

          {/* Search + Filter */}
          <View className="flex-row gap-2 mb-3">
            <View className={`flex-1 flex-row items-center rounded-xl border px-3.5 py-2.5 ${palette.surface} ${palette.border}`}>
              <Ionicons name="search-outline" size={16} color={palette.textMutedColor} />
              <TextInput placeholder="Search name, role, skills..." placeholderTextColor={palette.textMutedColor} value={search} onChangeText={setSearch} className={`ml-2 flex-1 text-[12px] ${palette.text}`} />
              {search ? <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={palette.textMutedColor} /></Pressable> : null}
            </View>
            <Pressable onPress={() => setShowFilters(true)} className={`h-11 w-11 items-center justify-center rounded-xl border ${palette.surface} ${palette.border}`}>
              <Ionicons name="options-outline" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          {/* Stage Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-1.5">
              {[{ key: 'all', label: 'All', count: candidates.length }, ...Object.entries(stageColors).map(([key]) => ({ key, label: key, count: stageCounts[key] || 0 }))].map(s => (
                <Pressable key={s.key} onPress={() => setStageFilter(s.key)} className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${stageFilter === s.key ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                  <Text className={`text-[10px] font-bold ${stageFilter === s.key ? 'text-white' : 'text-slate-600'}`}>{s.label}</Text>
                  <View className={`rounded-full px-1.5 py-0.5 ${stageFilter === s.key ? 'bg-white/20' : 'bg-slate-200'}`}>
                    <Text className={`text-[8px] font-bold ${stageFilter === s.key ? 'text-white' : 'text-slate-500'}`}>{s.count}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* View toggle */}
          <View className={`mb-3 flex-row items-center justify-between rounded-lg px-3 py-2 bg-slate-100`}>
            <Text className="text-[10px] font-bold text-slate-500">{filtered.length} candidates</Text>
            <View className="flex-row gap-2">
              {selectedIds.length > 0 && <Text className="text-[10px] font-bold text-indigo-600">{selectedIds.length} selected</Text>}
              <View className="flex-row rounded-lg p-0.5 bg-white">
                <Pressable onPress={() => setView('list')} className={`rounded-md px-2.5 py-1 ${view === 'list' ? 'bg-indigo-600' : ''}`}>
                  <Ionicons name="list-outline" size={13} color={view === 'list' ? '#fff' : '#64748b'} />
                </Pressable>
                <Pressable onPress={() => setView('grid')} className={`rounded-md px-2.5 py-1 ${view === 'grid' ? 'bg-indigo-600' : ''}`}>
                  <Ionicons name="grid-outline" size={13} color={view === 'grid' ? '#fff' : '#64748b'} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Candidate cards */}
          {error && !candidates.length ? (
            <View className="items-center py-12 px-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 mb-3">
                <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 text-center mb-1">Failed to Load Candidates</Text>
              <Text className="text-[11px] text-slate-500 text-center mb-3">{error}</Text>
              <Pressable onPress={() => { setLoading(true); fetchCandidates(); }} className="rounded-xl bg-indigo-600 px-4 py-2">
                <Text className="text-[11px] font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View className="items-center py-16"><Text className={`text-[14px] ${palette.textSoft}`}>Loading candidates...</Text></View>
          ) : view === 'list' ? filtered.map(c => {
            const sc = stageColors[c.stage] || stageColors.Applied;
            const isSelected = selectedIds.includes(c.id);
            return (
              <Pressable key={c.id} onPress={() => toggleSelect(c.id)} className={`mb-2.5 rounded-xl border p-4 bg-white ${isSelected ? 'border-indigo-400' : 'border-slate-200'} active:opacity-80`}>
                <View className="flex-row items-start gap-3">
                  <Pressable onPress={() => { setSelectedCandidate(c); setShowDetails(true); }} className="h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                    <Text className="text-[13px] font-bold text-indigo-600">{c.name?.split(' ').map(n => n[0]).join('') || '?'}</Text>
                  </Pressable>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Pressable onPress={() => router.push(`/(modules)/hireflow/${c.id}`)}>
                        <Text className="text-[14px] font-bold text-slate-900">{c.name}</Text>
                      </Pressable>
                      <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${sc.bg}`}>
                        <View className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        <Text className={`text-[8px] font-bold ${sc.text}`}>{c.stage || 'Applied'}</Text>
                      </View>
                    </View>
                    <Text className="text-[11px] text-slate-500 mt-0.5">{c.role || 'Applicant'}</Text>
                    <View className="flex-row items-center gap-3 mt-1.5">
                      <View className="flex-row items-center gap-1"><Ionicons name="location-outline" size={10} color="#94a3b8" /><Text className="text-[9px] text-slate-400">{c.location || 'Remote'}</Text></View>
                      <View className="flex-row items-center gap-1"><Ionicons name="globe-outline" size={10} color="#94a3b8" /><Text className="text-[9px] text-slate-400">{c.source || 'Unknown'}</Text></View>
                    </View>
                  </View>
                </View>
                <View className="mt-2.5 flex-row items-center justify-between">
                  <View className="flex-row flex-wrap gap-1.5 flex-1">
                    {c.skills?.slice(0, 3).map((s, i) => (
                      <View key={i} className="rounded-md bg-slate-100 px-2 py-0.5"><Text className="text-[8px] text-slate-600">{s}</Text></View>
                    ))}
                    {c.skills && c.skills.length > 3 && <View className="rounded-md bg-slate-100 px-2 py-0.5"><Text className="text-[8px] text-slate-600">+{c.skills.length - 3}</Text></View>}
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5">
                      <Ionicons name="sparkles" size={10} color="#f59e0b" />
                      <Text className="text-[9px] font-bold text-amber-600">{c.score || 'N/A'}</Text>
                    </View>
                    {c.resume && <Ionicons name="document-text-outline" size={14} color="#6366f1" />}
                  </View>
                </View>
                <View className="mt-2 border-t border-slate-100 pt-2 flex-row items-center justify-between">
                  <Text className="text-[9px] text-slate-400">Applied {c.appliedAt ? new Date(c.appliedAt).toLocaleDateString() : c.applied || 'recently'}</Text>
                  <View className="flex-row gap-2">
                    <Pressable className="h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><Ionicons name="call-outline" size={12} color="#6366f1" /></Pressable>
                    <Pressable className="h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><Ionicons name="chatbubble-outline" size={12} color="#6366f1" /></Pressable>
                    <Pressable className="h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><Ionicons name="ellipsis-horizontal" size={12} color="#64748b" /></Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }) : (
            <View className="flex-row flex-wrap gap-3">
              {filtered.map(c => {
                const sc = stageColors[c.stage] || stageColors.Applied;
                return (
                  <Pressable key={c.id} onPress={() => router.push(`/(modules)/hireflow/${c.id}`)} className="w-[48%] rounded-xl border p-3.5 bg-white border-slate-200 active:opacity-80">
                    <View className="items-center mb-3">
                      <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 mb-2">
                        <Text className="text-[15px] font-bold text-indigo-600">{c.name?.split(' ').map(n => n[0]).join('') || '?'}</Text>
                      </View>
                      <Text className="text-[13px] font-bold text-slate-900 text-center">{c.name}</Text>
                      <Text className="text-[10px] text-slate-500 text-center mt-0.5">{c.role || 'Applicant'}</Text>
                    </View>
                    <View className="flex-row items-center justify-center gap-2 mb-2">
                      <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${sc.bg}`}>
                        <View className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        <Text className={`text-[8px] font-bold ${sc.text}`}>{c.stage || 'Applied'}</Text>
                      </View>
                      <View className="flex-row items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5">
                        <Ionicons name="sparkles" size={9} color="#f59e0b" />
                        <Text className="text-[8px] font-bold text-amber-600">{c.score || 'N/A'}</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-center gap-2 pt-2 border-t border-slate-100">
                      <Pressable className="h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><Ionicons name="mail-outline" size={11} color="#6366f1" /></Pressable>
                      <Pressable className="h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><Ionicons name="call-outline" size={11} color="#6366f1" /></Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {filtered.length === 0 && !loading && !error && (
            <View className="items-center py-16">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <Ionicons name="people-outline" size={24} color="#94a3b8" />
              </View>
              <Text className="text-[15px] font-bold text-slate-400">No candidates found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BulkActionsBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} />
      <AddCandidateModal visible={showAdd} onClose={() => setShowAdd(false)} onSuccess={handleCreateCandidate} />
      <CandidateDetailsModal visible={showDetails} onClose={() => { setShowDetails(false); setSelectedCandidate(null); }} candidate={selectedCandidate} />
      <AdvancedFilters visible={showFilters} onClose={() => setShowFilters(false)} />
    </SafeAreaView>
  );
}