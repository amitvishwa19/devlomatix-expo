import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_OPTIONS = ['active', 'inactive', 'pending'];

export default function UsersTab({ palette, search, setSearch, users, statusBadge, allRoles = [], onSave, onDelete, offline }) {
    const insets = useSafeAreaInsets();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', roles: [], status: 'active' });
    const [saving, setSaving] = useState(false);

    const openCreate = useCallback(() => {
        setEditingUser(null);
        setForm({ name: '', email: '', roles: [], status: 'active' });
        setModalVisible(true);
    }, []);

    const openEdit = useCallback((user) => {
        setEditingUser(user);
        setForm({
            name: user.name || '',
            email: user.email || '',
            roles: user.roles || [],
            status: user.status || 'active',
        });
        setModalVisible(true);
    }, []);

    const toggleRole = useCallback((roleTitle) => {
        setForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(roleTitle)
                ? prev.roles.filter((r) => r !== roleTitle)
                : [...prev.roles, roleTitle],
        }));
    }, []);

    const handleSave = async () => {
        if (!form.name.trim() || !form.email.trim()) {
            Alert.alert('Validation', 'Name and email are required.');
            return;
        }
        setSaving(true);
        try {
            await onSave({
                id: editingUser?.id,
                name: form.name.trim(),
                email: form.email.trim(),
                roles: form.roles,
                status: form.status,
            });
            setModalVisible(false);
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (user) => {
        Alert.alert(
            'Delete User',
            `Remove ${user.name} from the workspace?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await onDelete(user.id);
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
                    placeholder="Search users..."
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

            {users.length === 0 ? (
                <View className={`rounded-[24px] p-8 items-center ${palette.surface}`}>
                    <Ionicons name="people-outline" size={32} color={palette.textMutedColor} />
                    <Text className={`mt-3 text-[15px] font-bold ${palette.text}`}>No users found</Text>
                    <Pressable className="mt-3 rounded-xl bg-teal-700 px-5 py-2.5" onPress={openCreate}>
                        <Text className="text-[13px] font-bold text-white">Add your first user</Text>
                    </Pressable>
                </View>
            ) : (
                users.map((user) => (
                    <View
                        key={user.id}
                        className={`mb-3 rounded-[20px] p-4 ${palette.surface} ${palette.shadow}`}
                    >
                        <View className="flex-row items-center gap-3.5">
                            <View
                                className="h-12 w-12 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${user.color || '#6b7280'}20` }}
                            >
                                <Text className="text-[16px] font-bold" style={{ color: user.color || '#6b7280' }}>
                                    {(user.name || '').split(' ').map((n) => n[0]).join('')}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className={`text-[15px] font-bold ${palette.text}`}>{user.name}</Text>
                                <Text className={`mt-0.5 text-[12px] ${palette.textMuted}`}>{user.email}</Text>
                                {user.roles && user.roles.length > 0 && (
                                    <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                                        {user.roles.map((roleTitle) => {
                                            const role = allRoles.find((r) => r.title === roleTitle || r.id === roleTitle);
                                            const roleColor = role?.color || '#0d9488';
                                            return (
                                                <View key={roleTitle} className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${roleColor}20` }}>
                                                    <Text className="text-[10px] font-bold" style={{ color: roleColor }}>{roleTitle}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                            <View className="items-end gap-2">
                                {statusBadge ? statusBadge(user.status) : null}
                                <View className="flex-row gap-2">
                                    <Pressable onPress={() => openEdit(user)}>
                                        <Ionicons name="create-outline" size={16} color={palette.textMutedColor} />
                                    </Pressable>
                                    <Pressable onPress={() => handleDelete(user)}>
                                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </View>
                ))
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/50">
                    <View className={`rounded-t-2xl ${palette.surface}`} style={{ maxHeight: Dimensions.get('window').height * 0.6, paddingBottom: insets.bottom + 34 }}>
                        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                            <View className="mb-5 flex-row items-center justify-between">
                                <Text className={`text-[20px] font-bold ${palette.text}`}>
                                    {editingUser ? 'Edit User' : 'Add User'}
                                </Text>
                                <Pressable onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={palette.textMutedColor} />
                                </Pressable>
                            </View>

                            <Text className={`mb-1 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Name</Text>
                            <TextInput
                                className={`mb-4 rounded-[16px] border px-4 py-3 text-[15px] ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                                placeholder="Enter name"
                                placeholderTextColor={palette.textMutedColor}
                                value={form.name}
                                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                            />

                            <Text className={`mb-1 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Email</Text>
                            <TextInput
                                className={`mb-4 rounded-[16px] border px-4 py-3 text-[15px] ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                                placeholder="Enter email"
                                placeholderTextColor={palette.textMutedColor}
                                value={form.email}
                                onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text className={`mb-2 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Status</Text>
                            <View className="mb-4 flex-row gap-2">
                                {STATUS_OPTIONS.map((s) => {
                                    const selected = form.status === s;
                                    return (
                                        <Pressable
                                            key={s}
                                            className={`rounded-xl px-4 py-2 ${selected ? 'bg-teal-700' : `${palette.surfaceInset}`}`}
                                            onPress={() => setForm((p) => ({ ...p, status: s }))}
                                        >
                                            <Text className={`text-[13px] font-bold ${selected ? 'text-white' : palette.text}`}>{s}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            <Text className={`mb-2 text-[12px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>Roles</Text>
                            <View className="mb-6 flex-row flex-wrap gap-2">
                                {(allRoles.length > 0 ? allRoles : []).map((role) => {
                                    const selected = form.roles.includes(typeof role === 'string' ? role : role.title);
                                    return (
                                        <Pressable
                                            key={role.id || role}
                                            className={`rounded-xl px-4 py-2 ${selected ? 'bg-teal-700' : `${palette.surfaceInset}`}`}
                                            onPress={() => toggleRole(typeof role === 'string' ? role : role.title)}
                                        >
                                            <Text className={`text-[13px] font-bold ${selected ? 'text-white' : palette.text}`}>
                                                {typeof role === 'string' ? role : role.title}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                                {allRoles.length === 0 && (
                                    <Text className={`text-[12px] ${palette.textMuted}`}>Create roles first</Text>
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
