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
import * as chatbotsService from '~/services/konnectx/chatbots';

export default function ChatbotScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId, selectedCredential } = useKonnectx();

  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', active: false });
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchBots = useCallback(async () => {
    if (!userId) return;
    try {
      const credParams = {
        credentialId: selectedCredential?.id || selectedCredential?._id,
        wabaId: selectedCredential?.wabaId,
        phoneNumberId: selectedCredential?.phoneNumberId
      };
      const data = await chatbotsService.getBots(userId, credParams);
      setBots(Array.isArray(data) ? data : data?.bots ?? []);
    } catch { } finally {
      setLoading(false);
    }
  }, [userId, selectedCredential]);

  useEffect(() => { fetchBots(); }, [fetchBots, selectedCredential]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBots();
    setRefreshing(false);
  }, [fetchBots]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Bot name is required' });
      return;
    }
    try {
      setSaving(true);
      await chatbotsService.createBot(userId, form);
      Toast.show({ type: 'success', text1: 'Bot created' });
      setShowCreate(false);
      setForm({ name: '', description: '', active: false });
      fetchBots();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (bot) => {
    try {
      await chatbotsService.toggleBot(userId, bot.id, !bot.active);
      setBots((prev) => prev.map((b) => (b.id === bot.id ? { ...b, active: !b.active } : b)));
      Toast.show({ type: 'success', text1: bot.active ? 'Bot paused' : 'Bot activated' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    try {
      await chatbotsService.deleteBot(userId, id);
      setBots((prev) => prev.filter((b) => b.id !== id));
      Toast.show({ type: 'success', text1: 'Bot deleted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <View className="mb-1 self-start rounded-full bg-sky-600 px-2.5 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">AUTOMATION</Text>
            </View>
            <Text className={`text-[24px] font-bold ${palette.text}`}>Chatbots</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreate(true)}
            className="flex-row items-center gap-1 rounded-full bg-sky-600 px-4 py-2.5 shadow-lg">
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-[13px] font-bold text-white">New Bot</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={bots}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <KonnectxEmptyState icon="hardware-chip-outline" title="No chatbots configured"
                description="Create an AI or keyword-based chatbot to automate user replies."
                ctaLabel="Create Chatbot" onCtaPress={() => setShowCreate(true)} />
            )
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-[16px] border p-4 shadow-sm"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-2">
                    <Text className={`text-[16px] font-bold ${palette.text}`}>{item.name}</Text>
                    <View className={`rounded-full px-2 py-0.5 ${item.active ? 'bg-green-500/10' : 'bg-slate-500/10'}`}>
                      <Text className={`text-[9px] font-bold ${item.active ? 'text-green-600' : 'text-slate-500'}`}>
                        {item.active ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>
                  {item.description ? (
                    <Text className={`mt-1 text-[12px] ${palette.textSoft}`}>{item.description}</Text>
                  ) : null}
                </View>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => handleToggle(item)}
                    className={`rounded-xl border px-3 py-1.5 ${item.active ? 'border-amber-500/30' : 'border-green-500/30'}`}>
                    <Text className={`text-[11px] font-bold ${item.active ? 'text-amber-600' : 'text-green-600'}`}>
                      {item.active ? 'Pause' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

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
        title="Delete Chatbot?"
        message="Are you sure you want to delete this chatbot? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <Text className={`text-[20px] font-bold ${palette.text}`}>New Chatbot</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)} className="p-2">
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>
          <View className="flex-1 px-5 pt-6">
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Bot Name *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Sales Assistant" placeholderTextColor={palette.textMutedColor}
              value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Description</Text>
            <TextInput className="mb-6 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Handles incoming sales inquiries" placeholderTextColor={palette.textMutedColor}
              value={form.description} onChangeText={(v) => setForm({ ...form, description: v })}
              multiline numberOfLines={3} textAlignVertical="top" />

            <TouchableOpacity onPress={handleCreate} disabled={saving}
              className="items-center rounded-xl bg-sky-600 py-4 shadow-lg">
              <Text className="text-[16px] font-bold text-white">{saving ? 'Creating...' : 'Create Bot'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
