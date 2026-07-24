import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { upsertPermissions } from '~/services/access-management';

const ACTION_LABELS = ['view', 'create', 'edit', 'delete', 'manage'];
const PRESET_COLORS = ['#0d9488', '#0284c7', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#6b7280'];

export default function PermissionsTab({ palette, search, setSearch, permissions: perms = [], offline, onRefresh }) {
  const [localPerms, setLocalPerms] = useState(perms);
  const [savingId, setSavingId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', color: '#0d9488', actions: {} });

  useEffect(() => { setLocalPerms(perms); }, [perms]);

  const resetForm = useCallback(() => {
    const base = {};
    ACTION_LABELS.forEach((a) => { base[a] = false; });
    setForm({ name: '', category: '', color: '#0d9488', actions: base });
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const toggleFormAction = useCallback((action) => {
    setForm((prev) => ({
      ...prev,
      actions: { ...prev.actions, [action]: !prev.actions[action] },
    }));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Module name is required.');
      return;
    }
    const category = form.category.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '_');
    const actions = { ...form.actions };
    ACTION_LABELS.forEach((a) => { if (actions[a] === undefined) actions[a] = false; });

    setSaving(true);
    try {
      const newPerm = { category, module: form.name.trim(), color: form.color, actions };
      if (offline) {
        setLocalPerms((prev) => [...prev, { ...newPerm, id: Date.now().toString() }]);
        setModalVisible(false);
        return;
      }
      await upsertPermissions([newPerm]);
      setModalVisible(false);
      onRefresh?.();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAction = useCallback(async (perm, action) => {
    const newVal = !perm.actions[action];
    const updatedPerm = {
      ...perm,
      actions: { ...perm.actions, [action]: newVal },
    };
    setLocalPerms((prev) =>
      prev.map((p) => (p.category === perm.category ? updatedPerm : p))
    );
    if (offline) return;
    setSavingId(`${perm.category}-${action}`);
    try {
      await upsertPermissions([{
        category: perm.category,
        module: perm.module,
        color: perm.color,
        actions: updatedPerm.actions,
      }]);
    } catch (e) {
      setLocalPerms((prev) =>
        prev.map((p) => (p.category === perm.category ? perm : p))
      );
      Alert.alert('Error', e.message);
    } finally {
      setSavingId(null);
    }
  }, [offline]);

  const totalModules = localPerms.length;
  const totalEnabled = localPerms.reduce(
    (sum, p) => sum + Object.values(p.actions || {}).filter(Boolean).length, 0
  );
  const totalPossible = totalModules * ACTION_LABELS.length;

  return (
    <View>
      <View className={`mb-4 flex-row items-center gap-2 rounded-[20px] border px-4 py-2.5 ${palette.surface} ${palette.border}`}>
        <Ionicons name="search-outline" size={18} color={palette.textMutedColor} />
        <TextInput
          className={`flex-1 text-[15px] ${palette.text}`}
          placeholder="Search modules..."
          placeholderTextColor={palette.textMutedColor}
          value={search}
          onChangeText={setSearch}
        />
        <Pressable
          className="rounded-xl bg-teal-700 px-4 py-2 flex-row items-center gap-1"
          onPress={openCreate}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-[12px] font-bold text-white">Add</Text>
        </Pressable>
      </View>

      <View className={`mb-3 rounded-[20px] p-4 ${palette.surface}`}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className={`text-[13px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Module</Text>
          <View className="flex-row gap-1.5">
            {ACTION_LABELS.map((a) => (
              <Text key={a} className={`w-[50px] text-center text-[10px] font-bold uppercase tracking-[0.3px] ${palette.textMuted}`}>
                {a}
              </Text>
            ))}
          </View>
        </View>
        <View className={`h-px mb-2 ${palette.border}`} />
        {localPerms.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons name="key-outline" size={28} color={palette.textMutedColor} />
            <Text className={`mt-2 text-[13px] ${palette.textMuted}`}>
              {search ? 'No modules found' : 'No permissions configured yet'}
            </Text>
            <Pressable className="mt-3 rounded-xl bg-teal-700 px-5 py-2.5" onPress={openCreate}>
              <Text className="text-[13px] font-bold text-white">Create your first module</Text>
            </Pressable>
          </View>
        ) : (
          localPerms.map((perm) => (
            <View key={perm.category}>
              <View className="flex-row items-center py-3">
                <View className="flex-1 flex-row items-center gap-2.5">
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: perm.color || '#6b7280' }} />
                  <Text className={`text-[14px] font-semibold ${palette.text}`}>{perm.module}</Text>
                </View>
                <View className="flex-row gap-1.5">
                  {ACTION_LABELS.map((action) => {
                    const savingKey = `${perm.category}-${action}`;
                    const enabled = perm.actions?.[action];
                    return (
                      <Pressable
                        key={action}
                        className={`h-7 w-[50px] items-center justify-center rounded-lg ${
                          enabled ? 'bg-emerald-500/20' : palette.surfaceInset
                        }`}
                        onPress={() => toggleAction(perm, action)}
                        disabled={savingId === savingKey}
                      >
                        {savingId === savingKey ? (
                          <Ionicons name="sync-outline" size={13} color={palette.textMutedColor} />
                        ) : (
                          <Ionicons
                            name={enabled ? 'checkmark' : 'close'}
                            size={14}
                            color={enabled ? '#16a34a' : palette.textMutedColor}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View className={`h-px ${palette.border}`} />
            </View>
          ))
        )}
      </View>

      <View className={`flex-row items-center justify-between rounded-[16px] p-4 ${palette.surface}`}>
        <Text className={`text-[13px] ${palette.textSoft}`}>
          <Text className="font-bold">
            {localPerms.filter((p) => Object.values(p.actions || {}).some(Boolean)).length}
          </Text>
          {' '}modules with active permissions
        </Text>
        <Text className={`text-[12px] ${palette.textMuted}`}>
          {totalEnabled} / {totalPossible} enabled
        </Text>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-[32px] ${palette.surface}`} style={{ maxHeight: Dimensions.get('window').height * 0.6, paddingBottom: Platform.OS === 'ios' ? 50 : 24 }}>
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="mb-5 flex-row items-center justify-between">
                <Text className={`text-[20px] font-bold ${palette.text}`}>Create Permission</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={palette.textMutedColor} />
                </Pressable>
              </View>

              <Text className={`mb-1 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Module Name</Text>
              <TextInput
                className={`mb-3 rounded-[16px] border px-4 py-3 text-[15px] ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                placeholder="e.g. Analytics"
                placeholderTextColor={palette.textMutedColor}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v, category: v.toLowerCase().replace(/\s+/g, '_') }))}
              />

              <Text className={`mb-1 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Category</Text>
              <TextInput
                className={`mb-3 rounded-[16px] border px-4 py-3 text-[15px] ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                placeholder="Auto-filled from name"
                placeholderTextColor={palette.textMutedColor}
                value={form.category}
                onChangeText={(v) => setForm((p) => ({ ...p, category: v }))}
              />

              <Text className={`mb-2 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Color</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {PRESET_COLORS.map((c) => {
                  const selected = form.color === c;
                  return (
                    <Pressable
                      key={c}
                      className={`h-9 w-9 rounded-full items-center justify-center ${selected ? 'ring-2 ring-offset-2' : ''}`}
                      style={{ backgroundColor: c, ringColor: c }}
                      onPress={() => setForm((p) => ({ ...p, color: c }))}
                    >
                      {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </Pressable>
                  );
                })}
              </View>

              <Text className={`mb-2 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Actions</Text>
              <View className="mb-6 flex-row flex-wrap gap-2">
                {ACTION_LABELS.map((action) => {
                  const enabled = form.actions[action];
                  return (
                    <Pressable
                      key={action}
                      className={`rounded-xl px-4 py-2 flex-row items-center gap-1.5 ${enabled ? 'bg-teal-700' : palette.surfaceInset}`}
                      onPress={() => toggleFormAction(action)}
                    >
                      <Text className={`text-[14px] font-bold ${enabled ? 'text-white' : palette.textMuted}`}>
                        {enabled ? '✓' : '○'}
                      </Text>
                      <Text className={`text-[13px] font-bold ${enabled ? 'text-white' : palette.text}`}>{action}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                className={`mb-4 items-center rounded-[20px] py-4 ${saving ? 'bg-teal-700/50' : 'bg-teal-700'}`}
                onPress={handleSave}
                disabled={saving}
              >
                <Text className="text-[16px] font-bold text-white">{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
