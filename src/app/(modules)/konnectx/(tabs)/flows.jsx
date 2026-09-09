import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import IosConfirmModal from '~/components/IosConfirmModal';

import { useKonnectx } from '~/providers/KonnectxProvider';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import * as flowsService from '~/services/konnectx/flows';

export default function FlowsScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId, selectedCredential } = useKonnectx();

  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', categories: [] });
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchFlows = useCallback(async () => {
    if (!userId) return;
    try {
      const credParams = {
        credentialId: selectedCredential?.id || selectedCredential?._id,
        wabaId: selectedCredential?.wabaId,
        phoneNumberId: selectedCredential?.phoneNumberId
      };
      const data = await flowsService.getFlows(userId, credParams);
      setFlows(Array.isArray(data) ? data : data?.flows ?? []);
    } catch { } finally {
      setLoading(false);
    }
  }, [userId, selectedCredential]);

  useEffect(() => { fetchFlows(); }, [fetchFlows, selectedCredential]);

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
    try {
      setSaving(true);
      await flowsService.createFlow(userId, form);
      Toast.show({ type: 'success', text1: 'Flow created' });
      setShowCreate(false);
      setForm({ name: '', categories: [] });
      fetchFlows();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    try {
      await flowsService.deleteFlow(id);
      setFlows((prev) => prev.filter((f) => f.id !== id));
      Toast.show({ type: 'success', text1: 'Flow deleted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setDeleteTargetId(null);
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

  const handlePublish = async (flow) => {
    try {
      await flowsService.publishFlow(userId, flow.id);
      Toast.show({ type: 'success', text1: 'Published', text2: 'Flow published to Meta' });
      fetchFlows();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <View className="mb-1 self-start rounded-full bg-sky-600 px-2.5 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">INTERACTIVE</Text>
            </View>
            <Text className={`text-[24px] font-bold ${palette.text}`}>WhatsApp Flows</Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity onPress={handleSyncMeta}
              className="flex-row items-center gap-1 rounded-full border px-3 py-2"
              style={{ borderColor: palette.colors.border }}>
              <Ionicons name="sync" size={16} color={palette.textColor} />
              <Text className={`text-[12px] font-semibold ${palette.text}`}>Sync</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowCreate(true)}
              className="flex-row items-center gap-1 rounded-full bg-sky-600 px-3.5 py-2 shadow-lg">
              <Ionicons name="add" size={18} color="#fff" />
              <Text className="text-[12px] font-bold text-white">New Flow</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={flows}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <KonnectxEmptyState icon="layers-outline" title="No Meta flows found"
                description="Sync with Meta or create structured interactive forms for WhatsApp users."
                ctaLabel="Create Flow" onCtaPress={() => setShowCreate(true)} />
            )
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-[16px] border p-4 shadow-sm"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className={`text-[16px] font-bold ${palette.text}`}>{item.name}</Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <View className="rounded-full bg-sky-500/10 px-2 py-0.5">
                      <Text className="text-[9px] font-bold text-sky-600">{item.status || 'DRAFT'}</Text>
                    </View>
                    {item.metaFlowId ? (
                      <Text className={`text-[10px] font-mono ${palette.textMuted}`}>Meta ID: {item.metaFlowId}</Text>
                    ) : null}
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  {item.status !== 'PUBLISHED' ? (
                    <TouchableOpacity onPress={() => handlePublish(item)}
                      className="rounded-xl bg-sky-600 px-3 py-1.5">
                      <Text className="text-[11px] font-bold text-white">Publish</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity onPress={() => setDeleteTargetId(item.id)} className="p-1">
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      </View>

      <IosConfirmModal
        visible={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Flow?"
        message="Are you sure you want to delete this flow? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />

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
            <TextInput className="mb-6 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Customer Feedback Form" placeholderTextColor={palette.textMutedColor}
              value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

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
