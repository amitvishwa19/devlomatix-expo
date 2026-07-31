import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import * as contactsService from '~/services/konnectx/contacts';
import { useKonnectx } from '~/providers/KonnectxProvider';
import SwipeableRow from '~/components/konnectx/SwipeableRow';
import UserStatusBar from '~/components/UserStatusBar';
import * as Contacts from 'expo-contacts';

export default function KonnectXContactsScreen() {
    const { palette } = useAppTheme();
    const { userId, selectedCredential } = useKonnectx();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('groups');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);
    const [editContact, setEditContact] = useState(null);

    const [form, setForm] = useState({ name: '', phone: '', email: '', type: 'CONTACT', tags: '', category: '' });
    const [saving, setSaving] = useState(false);
    const [openRowId, setOpenRowId] = useState(null);

    const [newGroupName, setNewGroupName] = useState('');
    const [addingGroup, setAddingGroup] = useState(false);
    const [expandedGroupId, setExpandedGroupId] = useState(null);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedTag, setExpandedTag] = useState(null);

    const fetchContacts = useCallback(async () => {
        if (!userId) return;
        try {
            const credId = selectedCredential?.id || selectedCredential?._id;
            const data = await contactsService.getContacts(userId, {
                search,
                page: 1,
                limit: 100,
                credentialId: credId,
                wabaId: selectedCredential?.wabaId,
                phoneNumberId: selectedCredential?.phoneNumberId
            });
            setContacts(data?.data ?? data?.contacts ?? []);
        } catch { } finally {
            setLoading(false);
        }
    }, [userId, search, selectedCredential]);

    const fetchGroups = useCallback(async () => {
        try {
            const data = await contactsService.getGroups();
            setGroups(Array.isArray(data) ? data : []);
        } catch { }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchContacts();
        }
        fetchGroups();
    }, [userId, fetchContacts, fetchGroups, selectedCredential]);

    const onRefresh = useCallback(async () => {
        if (!userId) return;
        setRefreshing(true);
        await fetchContacts();
        await fetchGroups();
        setRefreshing(false);
    }, [userId, fetchContacts, fetchGroups]);

    const pickFromPhoneContacts = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== 'granted') {
                Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Contacts access is required.' });
                return;
            }
            const result = await Contacts.presentContactPickerAsync();
            if (!result) return;
            const picked = result;
            const name = picked.name || '';
            const phone = picked.phoneNumbers?.[0]?.number || '';
            const email = picked.emails?.[0]?.email || '';
            setEditContact(null);
            setForm({ name, phone, email, type: 'CONTACT', tags: '', category: '' });
            setShowAddModal(true);
        } catch (err) {
            if (err?.code === 'ERR_CANCELED') return;
            Toast.show({ type: 'error', text1: 'Error', text2: err?.message || 'Could not open contacts' });
        }
    };

    const openAdd = () => {
        setEditContact(null);
        setForm({ name: '', phone: '', email: '', type: 'CONTACT', tags: '', category: '' });
        setShowAddModal(true);
    };

    const openEdit = (contact) => {
        setEditContact(contact);
        setForm({
            name: contact.name || '',
            phone: contact.phone || '',
            email: contact.email || '',
            type: contact.type || 'CONTACT',
            tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tags || '',
            category: contact.category || ''
        });
        setShowAddModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Name and phone are required' });
            return;
        }
        setSaving(true);
        try {
            const body = {
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                type: form.type,
                tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
                category: form.category.trim() || null
            };
            if (editContact) {
                await contactsService.updateContact(userId, editContact.id, body);
                Toast.show({ type: 'success', text1: 'Updated' });
            } else {
                await contactsService.saveContact(userId, body);
                Toast.show({ type: 'success', text1: 'Contact added' });
            }
            setShowAddModal(false);
            fetchContacts();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (contact) => {
        setContactToDelete(contact);
        setShowDeleteAlert(true);
    };

    const handleDelete = async () => {
        if (!contactToDelete) return;
        try {
            await contactsService.deleteContact(userId, contactToDelete.id);
            setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
            Toast.show({ type: 'success', text1: 'Deleted' });
            setShowDeleteAlert(false);
            setContactToDelete(null);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        }
    };

    const handleAddGroup = async () => {
        if (!newGroupName.trim()) return;
        setAddingGroup(true);
        try {
            await contactsService.saveGroup(userId, { name: newGroupName.trim() });
            Toast.show({ type: 'success', text1: 'Group created' });
            setNewGroupName('');
            fetchGroups();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setAddingGroup(false);
        }
    };

    const handleDeleteGroup = (groupId, groupName) => {
        const doDelete = async () => {
            try {
                await contactsService.deleteGroup(groupId);
                Toast.show({ type: 'success', text1: `"${groupName}" deleted` });
                fetchGroups();
            } catch (err) {
                Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
            }
        };
        doDelete();
    };

    const getGroupName = (groupId) => {
        const group = groups.find((g) => g.id === groupId);
        return group?.name || 'Unknown';
    };

    const getUniqueCategories = () => {
        const cats = {};
        contacts.forEach((c) => {
            if (c.category) {
                cats[c.category] = (cats[c.category] || 0) + 1;
            }
        });
        return Object.entries(cats).sort((a, b) => b[1] - a[1]);
    };

    const getUniqueTags = () => {
        const tagMap = {};
        contacts.forEach((c) => {
            const tags = Array.isArray(c.tags) ? c.tags : (typeof c.tags === 'string' ? c.tags.split(',').map((t) => t.trim()).filter(Boolean) : []);
            tags.forEach((tag) => {
                tagMap[tag] = (tagMap[tag] || 0) + 1;
            });
        });
        return Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
    };

    const renderContact = ({ item }) => {
        const hasGroups = item.groups?.length > 0 || item.groupIds?.length > 0;
        const groupList = item.groups || item.groupIds || [];

        return (
            <SwipeableRow
                isOpen={openRowId === item.id}
                onSwipeOpen={() => setOpenRowId(item.id)}
                onSwipeClose={() => {
                    if (openRowId === item.id) {
                        setOpenRowId(null);
                    }
                }}
                onDelete={() => confirmDelete(item)}
                onPress={() => openEdit(item)}
                onLongPress={() => confirmDelete(item)}
            >
                <View
                    className="flex-row items-center gap-2.5 rounded-[16px] border p-3"
                    style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                        <Text className="text-[13px] font-bold text-sky-600">
                            {(item.name || item.phone)?.[0]?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View className="flex-1 flex-row justify-between">
                        <View className="flex-shrink">
                            <Text className={`text-[14px] font-bold ${palette.text}`}>{item.name || 'Unknown'}</Text>
                            <Text className={`text-[12px] ${palette.textSoft}`}>{item.phone}</Text>
                            {item.email ? <Text className={`text-[10px] ${palette.textMuted}`}>{item.email}</Text> : null}
                            {hasGroups ? (
                                <View className="mt-0.5 flex-row flex-wrap gap-1">
                                    {groupList.map((g) => (
                                        <View key={typeof g === 'string' ? g : g.id} className="rounded-full bg-sky-500/10 px-1.5 py-0.5">
                                            <Text className="text-[8px] font-semibold text-sky-600">
                                                {typeof g === 'string' ? getGroupName(g) : g.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                        <View className="items-end gap-1">
                            {item.type && item.type !== 'CONTACT' ? (
                                <View className="rounded-full bg-amber-500/10 px-1.5 py-0.5">
                                    <Text className="text-[8px] font-bold text-amber-600">{item.type}</Text>
                                </View>
                            ) : null}
                            {item.category ? (
                                <View className="rounded-full bg-purple-500/10 px-1.5 py-0.5">
                                    <Text className="text-[8px] font-bold text-purple-600">{item.category}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={palette.textMutedColor} />
                </View>
            </SwipeableRow>
        );
    };

    const getGroupContacts = (groupId) => contacts.filter((c) => {
        const ids = c.groups || c.groupIds || [];
        return ids.some((g) => (typeof g === 'string' ? g : g.id) === groupId);
    });
    const getCategoryContacts = (cat) => contacts.filter((c) => c.category === cat);
    const getTagContacts = (tagName) => contacts.filter((c) => {
        const tagsArr = Array.isArray(c.tags) ? c.tags : (typeof c.tags === 'string' ? c.tags.split(',').map((t) => t.trim()).filter(Boolean) : []);
        return tagsArr.includes(tagName);
    });

    const renderCompactContact = (item) => (
        <TouchableOpacity key={item.id} onPress={() => openEdit(item)}
            className="mb-1 ml-4 flex-row items-center gap-2 rounded-[12px] border px-3 py-2"
            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
            <View className="h-7 w-7 items-center justify-center rounded-full bg-sky-500/20">
                <Text className="text-[10px] font-bold text-sky-600">
                    {(item.name || item.phone)?.[0]?.toUpperCase() || '?'}
                </Text>
            </View>
            <View className="flex-1">
                <Text className={`text-[12px] font-semibold ${palette.text}`}>{item.name || 'Unknown'}</Text>
                <Text className={`text-[10px] ${palette.textSoft}`}>{item.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={palette.textMutedColor} />
        </TouchableOpacity>
    );

    const renderExpandedContacts = (contactList) =>
        contactList.length === 0 ? (
            <Text className={`ml-4 mb-1.5 text-[11px] italic ${palette.textMuted}`}>No contacts</Text>
        ) : (
            contactList.map(renderCompactContact)
        );

    const categories = getUniqueCategories();
    const tags = getUniqueTags();

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
            <UserStatusBar scrollY={scrollY} />
            <View className="flex-1 px-3 pt-3">
                {/* Header */}
                <View className="mb-2.5 flex-row items-center justify-between">
                    <View>
                        <View className="mb-1 self-start rounded-full bg-sky-600 px-2.5 py-1">
                            <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">CONTACTS</Text>
                        </View>
                        <Text className="text-[22px] font-bold" style={{ color: palette.textColor }}>Audience</Text>
                    </View>
                    {activeTab === 'contacts' && (
                        <TouchableOpacity onPress={openAdd} className="rounded-full bg-sky-600 px-3 py-2">
                            <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Segmented Tab */}
                <View className="mb-3 flex-row rounded-[12px] p-0.5" style={{ backgroundColor: palette.colors.border }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('groups')}
                        className={`flex-1 items-center rounded-[10px] py-2 ${activeTab === 'groups' ? 'bg-sky-600' : ''}`}
                    >
                        <Text className={`text-[12px] font-bold ${activeTab === 'groups' ? 'text-white' : palette.textMuted}`}>
                            Groups / Tags
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('contacts')}
                        className={`flex-1 items-center rounded-[10px] py-2 ${activeTab === 'contacts' ? 'bg-sky-600' : ''}`}
                    >
                        <Text className={`text-[12px] font-bold ${activeTab === 'contacts' ? 'text-white' : palette.textMuted}`}>
                            All Contacts
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'groups' ? (
                    <Animated.FlatList
                        data={[{ key: 'groups_section' }]}
                        keyExtractor={(item) => item.key}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 80 }}
                        scrollEventThrottle={16}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
                        renderItem={() => (
                            <View>
                                {/* Groups Section */}
                                <View className="mb-2 flex-row items-center justify-between">
                                    <Text className={`text-[15px] font-bold ${palette.text}`}>Groups</Text>
                                    <Text className={`text-[11px] ${palette.textMuted}`}>{groups.length} total</Text>
                                </View>
                                {groups.length === 0 ? (
                                    <View className="mb-4 items-center rounded-[16px] border py-6" style={{ borderColor: palette.colors.border, borderStyle: 'dashed' }}>
                                        <Ionicons name="folder-open-outline" size={24} color={palette.textMutedColor} />
                                        <Text className={`mt-1.5 text-[13px] ${palette.textSoft}`}>No groups yet</Text>
                                    </View>
                                ) : (
                                    groups.map((group) => {
                                        const isExpanded = expandedGroupId === group.id;
                                        const groupContacts = getGroupContacts(group.id);
                                        return (
                                            <View key={group.id}>
                                                <TouchableOpacity
                                                    onPress={() => setExpandedGroupId(isExpanded ? null : group.id)}
                                                    className="mb-1.5 flex-row items-center justify-between rounded-[12px] border px-3 py-2.5"
                                                    style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                                    <View className="flex-row items-center gap-2 flex-1">
                                                        <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={14} color={palette.textMutedColor} />
                                                        <Ionicons name="folder" size={16} color="#0284c7" />
                                                        <Text className={`text-[13px] font-semibold flex-1 ${palette.text}`}>{group.name}</Text>
                                                    </View>
                                                    <View className="flex-row items-center gap-2">
                                                        <Text className={`text-[11px] ${palette.textMuted}`}>{groupContacts.length}</Text>
                                                        <TouchableOpacity onPress={() => handleDeleteGroup(group.id, group.name)} className="p-1">
                                                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </TouchableOpacity>
                                                {isExpanded && renderExpandedContacts(groupContacts)}
                                            </View>
                                        );
                                    })
                                )}

                                {/* Add Group */}
                                <View className="mb-5 flex-row items-center gap-2">
                                    <TextInput
                                        className="flex-1 rounded-[12px] border px-3 py-2 text-[13px]"
                                        style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                                        placeholder="New group name..."
                                        placeholderTextColor={palette.textMutedColor}
                                        value={newGroupName}
                                        onChangeText={setNewGroupName}
                                    />
                                    <TouchableOpacity onPress={handleAddGroup} disabled={addingGroup || !newGroupName.trim()}
                                        className="rounded-full bg-sky-600 px-3 py-2">
                                        <Ionicons name="add" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                {/* Divider */}
                                <View className="mb-4 h-px" style={{ backgroundColor: palette.colors.border }} />

                                {/* Categories Section */}
                                <Text className={`mb-2 text-[15px] font-bold ${palette.text}`}>Categories</Text>
                                {categories.length === 0 ? (
                                    <View className="mb-4 items-center rounded-[16px] border py-6" style={{ borderColor: palette.colors.border, borderStyle: 'dashed' }}>
                                        <Ionicons name="pricetag-outline" size={24} color={palette.textMutedColor} />
                                        <Text className={`mt-1.5 text-[13px] ${palette.textSoft}`}>No categories yet</Text>
                                    </View>
                                ) : (
                                    categories.map(([cat, count]) => {
                                        const isExpanded = expandedCategory === cat;
                                        const catContacts = getCategoryContacts(cat);
                                        return (
                                            <View key={cat}>
                                                <TouchableOpacity
                                                    onPress={() => setExpandedCategory(isExpanded ? null : cat)}
                                                    className="mb-1.5 flex-row items-center justify-between rounded-[12px] border px-3 py-2.5"
                                                    style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                                    <View className="flex-row items-center gap-2 flex-1">
                                                        <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={14} color={palette.textMutedColor} />
                                                        <View className="h-6 w-6 items-center justify-center rounded-full bg-purple-500/20">
                                                            <Text className="text-[10px] font-bold text-purple-600">#</Text>
                                                        </View>
                                                        <Text className={`text-[13px] font-semibold ${palette.text}`}>{cat}</Text>
                                                    </View>
                                                    <Text className={`text-[11px] ${palette.textMuted}`}>{count} contact{count !== 1 ? 's' : ''}</Text>
                                                </TouchableOpacity>
                                                {isExpanded && renderExpandedContacts(catContacts)}
                                            </View>
                                        );
                                    })
                                )}

                                {/* Divider */}
                                <View className="mb-4 mt-2 h-px" style={{ backgroundColor: palette.colors.border }} />

                                {/* Tags Section */}
                                <Text className={`mb-2 text-[15px] font-bold ${palette.text}`}>Tags</Text>
                                {tags.length === 0 ? (
                                    <View className="mb-4 items-center rounded-[16px] border py-6" style={{ borderColor: palette.colors.border, borderStyle: 'dashed' }}>
                                        <Ionicons name="pricetags-outline" size={24} color={palette.textMutedColor} />
                                        <Text className={`mt-1.5 text-[13px] ${palette.textSoft}`}>No tags yet</Text>
                                    </View>
                                ) : (
                                    tags.map(([tag, count]) => {
                                        const isExpanded = expandedTag === tag;
                                        const tagContacts = getTagContacts(tag);
                                        return (
                                            <View key={tag}>
                                                <TouchableOpacity
                                                    onPress={() => setExpandedTag(isExpanded ? null : tag)}
                                                    className="mb-1.5 flex-row items-center justify-between rounded-[12px] border px-3 py-2.5"
                                                    style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                                    <View className="flex-row items-center gap-2 flex-1">
                                                        <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={14} color={palette.textMutedColor} />
                                                        <View className="h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
                                                            <Text className="text-[10px] font-bold text-amber-600">#</Text>
                                                        </View>
                                                        <Text className={`text-[13px] font-semibold ${palette.text}`}>{tag}</Text>
                                                    </View>
                                                    <Text className={`text-[11px] ${palette.textMuted}`}>{count} contact{count !== 1 ? 's' : ''}</Text>
                                                </TouchableOpacity>
                                                {isExpanded && renderExpandedContacts(tagContacts)}
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        )}
                    />
                ) : (
                    <>
                        {/* Search */}
                        <View className="mb-2.5 flex-row items-center gap-2">
                            <View className="flex-1 flex-row items-center rounded-[16px] border px-3 py-2.5"
                                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                <Ionicons name="search" size={16} color={palette.textMutedColor} />
                                <TextInput
                                    className="ml-2 flex-1 text-[13px]"
                                    style={{ color: palette.textColor }}
                                    placeholder="Search contacts..."
                                    placeholderTextColor={palette.textMutedColor}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                            </View>
                        </View>

                        {/* Stat badge */}
                        <Text className={`mb-2 text-[11px] font-semibold ${palette.textSoft}`}>
                            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                            {groups.length > 0 ? ` · ${groups.length} group${groups.length !== 1 ? 's' : ''}` : ''}
                        </Text>

                        <Animated.FlatList
                            data={contacts}
                            keyExtractor={(item) => item.id?.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 80 }}
                            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                            scrollEventThrottle={16}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
                            ListEmptyComponent={
                                loading ? null : (
                                    <KonnectxEmptyState icon="people-outline" title="No contacts yet"
                                        description="Add your first contact to start building your audience."
                                        ctaLabel="Add Contact" onCtaPress={openAdd} />
                                )
                            }
                            renderItem={renderContact}
                        />
                    </>
                )}
            </View>

            {/* Add/Edit Modal */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
                <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center justify-between px-4 py-3" style={{ backgroundColor: palette.colors.surface }}>
                        <Text className={`text-[18px] font-bold ${palette.text}`}>{editContact ? 'Edit Contact' : 'Add Contact'}</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)} className="p-1.5">
                            <Ionicons name="close" size={22} color={palette.textColor} />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 px-4 pt-4">
                        {!editContact ? (
                            <TouchableOpacity onPress={pickFromPhoneContacts}
                                className="mb-3 flex-row items-center justify-center gap-2 rounded-xl border py-3"
                                style={{ borderColor: palette.colors.border, borderStyle: 'dashed' }}>
                                <Ionicons name="people" size={18} color={palette.textMutedColor} />
                                <Text className={`text-[13px] font-semibold ${palette.textSoft}`}>Pick from Contacts</Text>
                            </TouchableOpacity>
                        ) : null}

                        <Text className={`mb-0.5 text-[12px] font-semibold ${palette.text}`}>Name *</Text>
                        <TextInput className="mb-2.5 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="John Doe" placeholderTextColor={palette.textMutedColor}
                            value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

                        <Text className={`mb-0.5 text-[12px] font-semibold ${palette.text}`}>Phone *</Text>
                        <TextInput className="mb-2.5 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="+919876543210" placeholderTextColor={palette.textMutedColor}
                            value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />

                        <Text className={`mb-0.5 text-[12px] font-semibold ${palette.text}`}>Email</Text>
                        <TextInput className="mb-2.5 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="john@example.com" placeholderTextColor={palette.textMutedColor}
                            value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />

                        <Text className={`mb-0.5 text-[12px] font-semibold ${palette.text}`}>Category</Text>
                        <TextInput className="mb-2.5 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="e.g. Lead, Customer, VIP" placeholderTextColor={palette.textMutedColor}
                            value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />

                        <Text className={`mb-0.5 text-[12px] font-semibold ${palette.text}`}>Tags (comma separated)</Text>
                        <TextInput className="mb-4 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="lead, vip, support" placeholderTextColor={palette.textMutedColor}
                            value={form.tags} onChangeText={(v) => setForm({ ...form, tags: v })} />

                        <TouchableOpacity onPress={handleSave} disabled={saving}
                            className={`items-center rounded-xl bg-sky-600 py-3.5 shadow-lg ${editContact ? 'mb-2' : ''}`}>
                            <Text className="text-[15px] font-bold text-white">
                                {saving ? 'Saving...' : editContact ? 'Save Changes' : 'Add Contact'}
                            </Text>
                        </TouchableOpacity>

                        {editContact ? (
                            <TouchableOpacity onPress={() => {
                                setShowAddModal(false);
                                confirmDelete(editContact);
                            }}
                                className="items-center rounded-xl border border-red-500 py-3.5">
                                <Text className="text-[15px] font-bold text-red-500">Delete Contact</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Delete Alert */}
            <Modal visible={showDeleteAlert} transparent animationType="fade" onRequestClose={() => setShowDeleteAlert(false)}>
                <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={() => setShowDeleteAlert(false)}>
                    <Pressable className="rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
                        <View className="mb-3 items-center">
                            <View className="mb-2.5 h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                                <Ionicons name="trash" size={24} color="#dc2626" />
                            </View>
                            <Text className={`text-[18px] font-bold ${palette.text}`}>Delete Contact</Text>
                            <Text className={`mt-1.5 text-center text-[13px] ${palette.textSoft}`}>
                                Remove {contactToDelete?.name || 'this contact'} and all their data?
                            </Text>
                        </View>
                        <View className="flex-row gap-2.5">
                            <TouchableOpacity onPress={() => setShowDeleteAlert(false)}
                                className="flex-1 items-center rounded-xl border py-3" style={{ borderColor: palette.colors.border }}>
                                <Text className={`text-[14px] font-bold ${palette.text}`}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete}
                                className="flex-1 items-center rounded-xl bg-red-600 py-3">
                                <Text className="text-[14px] font-bold text-white">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
