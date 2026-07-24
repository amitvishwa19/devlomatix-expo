import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRESET_COLORS = ['#0d9488', '#0284c7', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#6b7280'];

export default function RolesTab({ palette, search, setSearch, roles, allPermissions = [], onSave, onDelete, offline }) {
  const insets = useSafeAreaInsets();

  const permLookup = useMemo(() => {
    const map = new Map();
    allPermissions.forEach((p) => {
      const mod = p.module || p.title || p.name;
      if (mod) {
        const entry = { module: mod, color: p.color || '#6b7280', category: p.category, id: p.id };
        if (p.category) map.set(p.category, entry);
        if (p.id) map.set(p.id, entry);
        map.set(mod, entry);
      }
    });
    return map;
  }, [allPermissions]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', color: '#0d9488' });
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => {
    setEditingRole(null);
    setForm({ title: '', description: '', color: '#0d9488' });
    setSelectedPerms([]);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((role) => {
    setEditingRole(role);
    setForm({
      title: role.title || '',
      description: role.description || '',
      color: role.color || '#0d9488',
    });
    setSelectedPerms([]);
    setModalVisible(true);
  }, []);

  const togglePerm = useCallback((category) => {
    setSelectedPerms((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Role title is required.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: editingRole?.id,
        title: form.title.trim(),
        description: form.description.trim(),
        color: form.color,
        selectedPerms,
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (role) => {
    Alert.alert(
      'Delete Role',
      `Remove "${role.title}" and its associated permissions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(role.id);
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View>
      <View className={`mb-4 flex-row items-center gap-2 rounded-[20px] border px-4 py-2.5 ${palette.surface} ${palette.border}`}>
        <Ionicons name="search-outline" size={18} color={palette.textMutedColor} />
        <TextInput
          className={`flex-1 text-[15px] ${palette.text}`}
          placeholder="Search roles..."
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

      {roles.length === 0 ? (
        <View className={`rounded-[24px] p-8 items-center ${palette.surface}`}>
          <Ionicons name="shield-checkmark-outline" size={32} color={palette.textMutedColor} />
          <Text className={`mt-3 text-[15px] font-bold ${palette.text}`}>No roles found</Text>
          <Pressable className="mt-3 rounded-xl bg-teal-700 px-5 py-2.5" onPress={openCreate}>
            <Text className="text-[13px] font-bold text-white">Create your first role</Text>
          </Pressable>
        </View>
      ) : (
        roles.map((role) => (
          <View
            key={role.id}
            className={`mb-3 rounded-[20px] border-l-4 p-4 ${palette.surface}`}
            style={{ borderLeftColor: role.color || '#6b7280' }}
          >
            <View className="flex-row items-center justify-between">
              <Text className={`text-[17px] font-bold ${palette.text}`}>{role.title}</Text>
              <View className="flex-row items-center gap-2">
                {role.userCount !== undefined && (
                  <View className="rounded-full bg-purple-500/10 px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold text-purple-600">{role.userCount} users</Text>
                  </View>
                )}
              </View>
            </View>
            <Text className={`mt-1.5 text-[13px] leading-[18px] ${palette.textSoft}`}>
              {role.description}
            </Text>
            {role.permissions && role.permissions.length > 0 && (() => {
              const seen = new Set();
              const badges = [];
              role.permissions.forEach((p) => {
                const name = typeof p === 'object' && p ? (p.module || p.title || p.name) : p;
                const color = typeof p === 'object' && p ? (p.color || '#6b7280') : (permLookup.get(p)?.color || '#6b7280');
                if (name && !seen.has(name)) {
                  seen.add(name);
                  badges.push({ name, color });
                }
              });
              return badges.length > 0 ? (
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {badges.map((b) => (
                    <View key={b.name} className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${b.color}20` }}>
                      <Text className="text-[10px] font-bold" style={{ color: b.color }}>{b.name}</Text>
                    </View>
                  ))}
                </View>
              ) : null;
            })()}
            <View className={`mt-3 h-px ${palette.border}`} />
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color || '#6b7280' }} />
                <Text className={`text-[11px] ${palette.textMuted}`}>Inherits: None</Text>
              </View>
              <View className="flex-row gap-3">
                <Pressable onPress={() => openEdit(role)}>
                  <Ionicons name="create-outline" size={16} color={palette.textMutedColor} />
                </Pressable>
                <Pressable onPress={() => handleDelete(role)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-2xl ${palette.surface}`} style={{ maxHeight: Dimensions.get('window').height * 0.75, paddingBottom: Platform.OS === 'ios' ? 50 : 24 }}>
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="mb-5 flex-row items-center justify-between">
                <Text className={`text-[20px] font-bold ${palette.text}`}>
                  {editingRole ? 'Edit Role' : 'Create Role'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={palette.textMutedColor} />
                </Pressable>
              </View>

              <Text className={`mb-1 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Title</Text>
              <TextInput
                className={`mb-4 rounded-[16px] border px-4 py-3 text-[15px] ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                placeholder="e.g. Editor"
                placeholderTextColor={palette.textMutedColor}
                value={form.title}
                onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              />

              <Text className={`mb-1 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Description</Text>
              <TextInput
                className={`mb-4 rounded-[16px] border px-4 py-3 text-[15px] ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                placeholder="Describe this role"
                placeholderTextColor={palette.textMutedColor}
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                multiline
              />

              <Text className={`mb-2 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Color</Text>
              <View className="mb-5 flex-row flex-wrap gap-2">
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

              <View className={`h-px mb-4 ${palette.border}`} />

              <Text className={`mb-2 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                Permissions <Text className={`text-[11px] font-normal ${palette.textMuted}`}>({selectedPerms.length} selected)</Text>
              </Text>
              <View className="mb-6 flex-row flex-wrap gap-2">
                {allPermissions.length === 0 ? (
                  <Text className={`text-[12px] ${palette.textMuted}`}>Create permissions first</Text>
                ) : (
                  allPermissions.map((perm) => {
                    const checked = selectedPerms.includes(perm.category);
                    return (
                      <Pressable
                        key={perm.category}
                        className={`flex-row items-center gap-1.5 rounded-xl px-4 py-2 ${checked ? 'bg-teal-700' : palette.surfaceInset}`}
                        onPress={() => togglePerm(perm.category)}
                      >
                        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: perm.color || '#6b7280' }} />
                        <Text className={`text-[13px] font-bold ${checked ? 'text-white' : palette.text}`}>
                          {perm.module}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
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
