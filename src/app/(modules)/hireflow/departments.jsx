import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useCallback } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as hireflowService from '~/services/hireflow';
import { resolveWorkspaceId } from '~/utils/workspace';

const iconMap = {
  Engineering: 'code-slash-outline',
  Design: 'color-palette-outline',
  Marketing: 'megaphone-outline',
  Sales: 'trending-up-outline',
  HR: 'people-outline',
  Finance: 'cash-outline',
  Infrastructure: 'server-outline',
};

export default function DepartmentsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { workspaceId: paramWsId } = useLocalSearchParams();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', desc: '' });

  const fetchDepartments = useCallback(async () => {
    setError(null);
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) {
        setError('No workspace ID found.');
        return;
      }
      const res = await hireflowService.getDepartments(wsId);
      setDepts(res.data || []);
    } catch (e) {
      console.error('Failed to fetch departments:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramWsId]);

  useEffect(() => {
    setLoading(true);
    fetchDepartments();
  }, [fetchDepartments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDepartments();
  };

  const addDept = async () => {
    if (!newDept.name.trim()) return;
    try {
      const wsId = await resolveWorkspaceId(paramWsId);
      if (!wsId) return;
      await hireflowService.createDepartment({
        workspaceId: wsId,
        name: newDept.name.trim(),
        description: newDept.desc.trim()
      });
      setNewDept({ name: '', desc: '' });
      setShowCreate(false);
      fetchDepartments();
    } catch (e) {
      console.error('Failed to create department:', e);
      Alert.alert('Error', 'Failed to create department');
    }
  };

  const deleteDept = (id) => {
    Alert.alert('Delete Department', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await hireflowService.deleteDepartment(id);
            fetchDepartments();
          } catch (e) {
            console.error('Failed to delete department:', e);
          }
        }
      },
    ]);
  };

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
              <Text className={`text-2xl font-bold ${palette.text}`}>Departments</Text>
              <Pressable onPress={() => setShowCreate(true)} className="flex-row items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2">
                <Ionicons name="add" size={16} color="#fff" />
                <Text className="text-[11px] font-bold text-white">New</Text>
              </Pressable>
            </View>
          </View>

          {/* Summary bar */}
          <View className={`flex-row gap-3 mb-4`}>
            <View className={`flex-1 rounded-xl border p-3 ${palette.surface} ${palette.border}`}>
              <Text className={`text-xl font-bold ${palette.text}`}>{depts.length}</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Departments</Text>
            </View>
            <View className={`flex-1 rounded-xl border p-3 ${palette.surface} ${palette.border}`}>
              <Text className={`text-xl font-bold ${palette.text}`}>{depts.reduce((s, d) => s + (d.jobsCount || d.jobs || 0), 0)}</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Active Jobs</Text>
            </View>
            <View className={`flex-1 rounded-xl border p-3 ${palette.surface} ${palette.border}`}>
              <Text className={`text-xl font-bold ${palette.text}`}>{depts.reduce((s, d) => s + (d.candidatesCount || d.candidates || 0), 0)}</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Candidates</Text>
            </View>
          </View>

          {/* Department cards */}
          {error && !depts.length ? (
            <View className="items-center py-12 px-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 mb-3">
                <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 text-center mb-1">Failed to Load Departments</Text>
              <Text className="text-[11px] text-slate-500 text-center mb-3">{error}</Text>
              <Pressable onPress={() => { setLoading(true); fetchDepartments(); }} className="rounded-xl bg-indigo-600 px-4 py-2">
                <Text className="text-[11px] font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View className="items-center py-16"><Text className={`text-[14px] ${palette.textSoft}`}>Loading departments...</Text></View>
          ) : depts.map(d => (
            <View key={d.id} className={`mb-3 rounded-xl border p-4 ${palette.surface} ${palette.border}`}>
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Ionicons name={iconMap[d.name] || 'business-outline'} size={18} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[14px] font-bold ${palette.text}`}>{d.name}</Text>
                    <Text className={`text-[10px] ${palette.textMuted} mt-0.5`}>{d.desc || d.description || 'No description provided'}</Text>
                  </View>
                </View>
                <Pressable onPress={() => deleteDept(d.id)} className="h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <Ionicons name="trash-outline" size={14} color="#f43f5e" />
                </Pressable>
              </View>
              <View className="flex-row gap-3 mt-3 pt-3 border-t border-slate-100">
                <View className="flex-1 items-center">
                  <Text className={`text-[16px] font-bold ${palette.text}`}>{d._count?.jobs ?? d.jobsCount ?? d.jobs ?? 0}</Text>
                  <Text className={`text-[9px] ${palette.textMuted}`}>Open Jobs</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className={`text-[16px] font-bold ${palette.text}`}>{d._count?.candidates ?? d.candidatesCount ?? d.candidates ?? 0}</Text>
                  <Text className={`text-[9px] ${palette.textMuted}`}>Candidates</Text>
                </View>
                <View className="flex-1 items-center">
                  <Pressable onPress={() => router.push('/(modules)/hireflow/jobs')} className="rounded-lg bg-indigo-600 px-3 py-1.5">
                    <Text className="text-[9px] font-bold text-white">View Jobs</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          {depts.length === 0 && !loading && !error && (
            <View className="items-center py-16">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <Ionicons name="business-outline" size={24} color="#94a3b8" />
              </View>
              <Text className="text-[15px] font-bold text-slate-400">No departments found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Department Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-slate-100">
            <Pressable onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </Pressable>
            <Text className="text-[16px] font-bold text-slate-900">New Department</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView className="flex-1 px-5 pt-5">
            <Text className="text-[13px] font-bold text-slate-900 mb-1">Department Name *</Text>
            <TextInput value={newDept.name} onChangeText={v => setNewDept(p => ({ ...p, name: v }))} placeholder="e.g. Engineering" placeholderTextColor="#94a3b8" className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4" />
            <Text className="text-[13px] font-bold text-slate-900 mb-1">Description</Text>
            <TextInput value={newDept.desc} onChangeText={v => setNewDept(p => ({ ...p, desc: v }))} placeholder="Brief description of this department's role" placeholderTextColor="#94a3b8" multiline numberOfLines={3} className="border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 mb-4 min-h-[70px]" textAlignVertical="top" />
          </ScrollView>
          <View className="px-5 pb-8 pt-3 border-t border-slate-100">
            <Pressable onPress={addDept} disabled={!newDept.name.trim()} className={`w-full rounded-xl py-3.5 items-center ${newDept.name.trim() ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <Text className={`text-[14px] font-bold ${newDept.name.trim() ? 'text-white' : 'text-slate-400'}`}>Create Department</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
