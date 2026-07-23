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
import * as chatbotsService from '~/services/konnectx/chatbots';

export default function ChatbotScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useKonnectx();

  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', active: false });

  const fetchBots = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await chatbotsService.getBots(userId);
      setBots(Array.isArray(data) ? data : data?.bots ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchBots(); }, [fetchBots]);

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
    setSaving(true);
    try {
      await chatbotsService.saveBot(userId, { name: form.name.trim(), description: form.description.trim() || undefined, active: form.active, nodes: [], edges: [] });
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

  const handleDelete = async (id) => {
    try {
      await chatbotsService.deleteBot(userId, id);
      setBots((prev) => prev.filter((b) => b.id !== id));
      Toast.show({ type: 'success', text1: 'Bot deleted' });
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
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Chatbots</Text>
            <Text className={`text-[13px] ${palette.textSoft}`}>{bots.length} bot{bots.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreate(true)}
            className="rounded-full bg-sky-600 px-4 py-3">
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={bots}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? <><SkeletonCard /><SkeletonCard /></> : (
              <KonnectxEmptyState icon="robot-outline" title="No chatbots"
                description="Create automated conversation flows for your business."
                ctaLabel="Create Bot" onCtaPress={() => setShowCreate(true)} />
            )
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-[20px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.active ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)' }}>
                    <Ionicons name="hardware-chip-outline" size={22} color={item.active ? '#16a34a' : '#6b7280'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[16px] font-bold ${palette.text}`}>{item.name}</Text>
                    {item.description ? <Text className={`text-[12px] ${palette.textSoft}`}>{item.description}</Text> : null}
                    <View className="mt-1 flex-row items-center gap-2">
                      <View className={`rounded-full px-2 py-0.5 ${item.active ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                        <Text className={`text-[9px] font-bold ${item.active ? 'text-green-600' : 'text-gray-500'}`}>
                          {item.active ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View className="mt-3 flex-row gap-2">
                <TouchableOpacity onPress={() => handleToggle(item)}
                  className={`flex-1 items-center rounded-xl py-2.5 ${item.active ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                  <Text className={`text-[12px] font-bold ${item.active ? 'text-amber-600' : 'text-green-600'}`}>
                    {item.active ? 'Pause' : 'Activate'}
                  </Text>
                </TouchableOpacity>
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
