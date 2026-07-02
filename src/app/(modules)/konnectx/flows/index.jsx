import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import { useKonnectx } from '~/providers/KonnectxProvider';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import * as flowsService from '~/services/konnectx/flows';

export default function FlowsScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useKonnectx();

  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', categories: '' });

  const fetchFlows = useCallback(async () => {
    try {
      const data = await flowsService.getFlows();
      setFlows(Array.isArray(data) ? data : data?.flows ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFlows();
    setRefreshing(false);
  }, [fetchFlows]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Flow name is required' });
      return;
    }
    setSaving(true);
    try {
      await flowsService.saveFlow(userId, {
        name: form.name.trim(),
        categories: form.categories ? form.categories.split(',').map((c) => c.trim()).filter(Boolean) : [],
        screens: [],
        definition: {}
      });
      Toast.show({ type: 'success', text1: 'Flow created' });
      setShowCreate(false);
      setForm({ name: '', categories: '' });
      fetchFlows();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await flowsService.deleteFlow(id);
      setFlows((prev) => prev.filter((f) => f.id !== id));
      Toast.show({ type: 'success', text1: 'Flow deleted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const handleSyncMeta = async () => {
    try {
      await flowsService.syncMetaFlows(userId);
      Toast.show({ type: 'success', text1: 'Synced', text2: 'Flows synced from Meta' });
      fetchFlows();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const handlePublish = async (id) => {
    try {
      await flowsService.pushFlowToMeta(userId, id);
      await flowsService.publishFlowMeta(userId, id);
      Toast.show({ type: 'success', text1: 'Published', text2: 'Flow published to Meta' });
      fetchFlows();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={palette.textColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Flows</Text>
            <Text className={`text-[13px] ${palette.textSoft}`}>{flows.length} flow{flows.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={handleSyncMeta} className="mr-2 rounded-full border px-4 py-3" style={{ borderColor: palette.colors.border }}>
            <Ionicons name="sync" size={18} color={palette.textColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCreate(true)} className="rounded-full bg-sky-600 px-4 py-3">
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={flows}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? <><SkeletonCard /><SkeletonCard /></> : (
              <KonnectxEmptyState icon="layers-outline" title="No flows yet"
                description="Create WhatsApp Flows for interactive form experiences." ctaLabel="Create Flow" onCtaPress={() => setShowCreate(true)} />
            )
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-[20px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-[16px] font-bold ${palette.text}`}>{item.name}</Text>
                  {item.status ? (
                    <View className="mt-1 flex-row items-center gap-2">
                      <View className={`rounded-full px-2.5 py-0.5 ${item.status === 'PUBLISHED' ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                        <Text className={`text-[9px] font-bold ${item.status === 'PUBLISHED' ? 'text-green-600' : 'text-amber-600'}`}>
                          {item.status}
                        </Text>
                      </View>
                      {item.categories?.length > 0 ? (
                        <Text className={`text-[10px] ${palette.textMuted}`}>{item.categories.join(', ')}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
              <View className="mt-3 flex-row gap-2">
                {item.status !== 'PUBLISHED' ? (
                  <TouchableOpacity onPress={() => handlePublish(item.id)}
                    className="flex-1 items-center rounded-xl border py-2.5" style={{ borderColor: palette.colors.border }}>
                    <Text className="text-[12px] font-bold text-sky-600">Publish</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => handleDelete(item.id)}
                  className="items-center rounded-xl border border-red-500/20 px-4 py-2.5"
                  style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <Text className={`text-[20px] font-bold ${palette.text}`}>New Flow</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)} className="p-2">
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>
          <View className="flex-1 px-5 pt-6">
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Flow Name *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Survey Flow" placeholderTextColor={palette.textMutedColor}
              value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Categories (comma separated)</Text>
            <TextInput className="mb-6 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="feedback, survey" placeholderTextColor={palette.textMutedColor}
              value={form.categories} onChangeText={(v) => setForm({ ...form, categories: v })} />
            <TouchableOpacity onPress={handleCreate} disabled={saving}
              className="items-center rounded-xl bg-sky-600 py-4 shadow-lg">
              <Text className="text-[16px] font-bold text-white">{saving ? 'Creating...' : 'Create Flow'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
