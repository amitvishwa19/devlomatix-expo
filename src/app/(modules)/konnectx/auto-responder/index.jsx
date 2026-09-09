import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useAppTheme } from '~/theme/AppTheme';
import IosConfirmModal from '~/components/IosConfirmModal';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as settingsService from '~/services/konnectx/settings';

const MATCH_TYPES = [
  { value: 'exact', label: 'Exact match' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts with' },
];

const MATCH_STYLES = {
  exact: { color: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
  contains: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  startsWith: { color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
};

export default function AutoResponderScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useKonnectx();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [form, setForm] = useState({ trigger: '', response: '', matchType: 'exact', isActive: true });

  const fetchRules = useCallback(async () => {
    try {
      const data = await settingsService.getAutoResponder();
      setRules(Array.isArray(data?.rules) ? data.rules : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRules();
    setRefreshing(false);
  }, [fetchRules]);

  const handleCreate = async () => {
    if (!form.trigger.trim() || !form.response.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Trigger and response are required' });
      return;
    }
    setSaving(true);
    try {
      await settingsService.saveAutoResponder(userId, {
        trigger: form.trigger.trim(),
        response: form.response.trim(),
        matchType: form.matchType,
        isActive: form.isActive,
      });
      Toast.show({ type: 'success', text1: 'Rule created' });
      setShowCreate(false);
      setForm({ trigger: '', response: '', matchType: 'exact', isActive: true });
      fetchRules();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule) => {
    setTogglingId(rule.id);
    try {
      await settingsService.updateAutoResponder(rule.id, { isActive: !rule.isActive });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)));
      Toast.show({ type: 'success', text1: rule.isActive ? 'Rule paused' : 'Rule activated' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    try {
      await settingsService.deleteAutoResponder(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      Toast.show({ type: 'success', text1: 'Rule deleted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-3 flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surface }}>
            <Ionicons name="arrow-back" size={20} color={palette.textColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <View className="mb-0.5 self-start rounded-full bg-sky-600 px-2.5 py-0.5">
              <Text className="text-[9px] font-bold uppercase tracking-[1px] text-white">AUTOMATION</Text>
            </View>
            <Text className={`text-[22px] font-bold ${palette.text}`}>Auto-responder</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreate(true)}
            className="flex-row items-center gap-1 rounded-full bg-sky-600 px-3.5 py-2.5 shadow-lg">
            <Ionicons name="add" size={17} color="#fff" />
            <Text className="text-[12px] font-bold text-white">New Rule</Text>
          </TouchableOpacity>
        </View>

        <Text className={`mb-3 text-[12px] leading-5 ${palette.textSoft}`}>
          Instantly reply to incoming messages based on keyword rules. Rules are checked in the order they appear here.
        </Text>

        <FlatList
          data={rules}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <KonnectxEmptyState icon="flash-outline" title="No rules yet"
                description="Create a rule that replies to specific keywords automatically."
                ctaLabel="Create Rule" onCtaPress={() => setShowCreate(true)} />
            )
          }
          renderItem={({ item }) => {
            const style = MATCH_STYLES[item.matchType] || MATCH_STYLES.exact;
            return (
              <View className="mb-3 rounded-[16px] border p-4"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-2">
                    <View className={`rounded-full px-2 py-0.5`} style={{ backgroundColor: style.bg }}>
                      <Text className="text-[9px] font-bold uppercase tracking-wide" style={{ color: style.color }}>
                        {item.matchType || 'exact'}
                      </Text>
                    </View>
                    <Text className={`flex-1 text-[13px] font-mono font-bold ${palette.text}`} numberOfLines={1}>
                      “{item.trigger}”
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    {togglingId === item.id ? (
                      <Text className={`text-[10px] ${palette.textMuted}`}>...</Text>
                    ) : (
                      <Switch
                        value={!!item.isActive}
                        onValueChange={() => handleToggle(item)}
                        trackColor={{ false: '#d1d5db', true: '#0284c7' }}
                        thumbColor="#fff"
                        disabled={togglingId === item.id}
                      />
                    )}
                    <TouchableOpacity onPress={() => setDeleteTargetId(item.id)} className="p-1">
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {item.response ? (
                  <View className="rounded-[12px] p-3" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                    <Text className={`text-[13px] leading-5 ${palette.textSoft}`}>{item.response}</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      </View>

      <IosConfirmModal
        visible={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Rule?"
        message="Incoming messages will stop matching this keyword. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
      />

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
            <View>
              <Text className={`text-[20px] font-bold ${palette.text}`}>New Auto-Reply Rule</Text>
              <Text className={`text-[11px] ${palette.textSoft}`}>Reply automatically when a keyword is matched</Text>
            </View>
            <TouchableOpacity onPress={() => setShowCreate(false)} className="p-2">
              <Ionicons name="close" size={24} color={palette.textColor} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-5 pt-6">
            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Trigger Keyword *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="e.g. pricing, help, cancel" placeholderTextColor={palette.textMutedColor}
              value={form.trigger} onChangeText={(v) => setForm({ ...form, trigger: v })} />

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Match Type</Text>
            <View className="mb-4 flex-row gap-2">
              {MATCH_TYPES.map((t) => (
                <TouchableOpacity key={t.value} onPress={() => setForm({ ...form, matchType: t.value })}
                  className={`flex-1 items-center rounded-xl border px-2 py-2.5 ${form.matchType === t.value ? 'bg-sky-600 border-sky-600' : ''}`}
                  style={form.matchType !== t.value ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                  <Text className={`text-[11px] font-bold ${form.matchType === t.value ? 'text-white' : palette.text}`}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className={`mb-1 text-[13px] font-semibold ${palette.text}`}>Auto Response *</Text>
            <TextInput className="mb-4 rounded-xl border px-4 py-3 text-[15px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Thanks for reaching out! Our team will get back to you shortly." placeholderTextColor={palette.textMutedColor}
              value={form.response} onChangeText={(v) => setForm({ ...form, response: v })}
              multiline numberOfLines={4} textAlignVertical="top" />

            <TouchableOpacity onPress={() => setForm({ ...form, isActive: !form.isActive })}
              className="mb-6 flex-row items-center justify-between rounded-xl border p-4"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name={form.isActive ? 'flash' : 'flash-off'} size={16} color={form.isActive ? '#0284c7' : palette.textMutedColor} />
                <Text className={`text-[14px] font-semibold ${palette.text}`}>Activate rule</Text>
              </View>
              <Switch
                value={form.isActive}
                onValueChange={() => setForm({ ...form, isActive: !form.isActive })}
                trackColor={{ false: '#d1d5db', true: '#0284c7' }}
                thumbColor="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCreate} disabled={saving}
              className="items-center rounded-xl bg-sky-600 py-4 shadow-lg">
              <Text className="text-[16px] font-bold text-white">{saving ? 'Creating...' : 'Create Rule'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}