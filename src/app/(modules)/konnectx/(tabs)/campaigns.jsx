import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import IosConfirmModal from '~/components/IosConfirmModal';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as campaignsService from '~/services/konnectx/campaigns';
import * as contactsService from '~/services/konnectx/contacts';
import * as templatesService from '~/services/konnectx/templates';

import { useUniversalLoader } from '~/providers/UniversalLoaderProvider';

const STATUS_BADGES = {
    DRAFT: { label: 'Draft', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    RUNNING: { label: 'Running', color: '#16a34a', bg: 'rgba(22,163,74,0.15)' },
    PAUSED: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    COMPLETED: { label: 'Completed', color: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
    SCHEDULED: { label: 'Scheduled', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ERROR: { label: 'Error', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' }
};

const SCHEDULE_PRESETS = [
    { label: '+1 Hour', getValue: () => new Date(Date.now() + 3600000).toISOString() },
    { label: '+3 Hours', getValue: () => new Date(Date.now() + 3 * 3600000).toISOString() },
    {
        label: 'Tomorrow 9 AM', getValue: () => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(9, 0, 0, 0);
            return d.toISOString();
        }
    },
    {
        label: 'Tomorrow 6 PM', getValue: () => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(18, 0, 0, 0);
            return d.toISOString();
        }
    }
];

export default function KonnectXCampaignsScreen() {
    const { palette } = useAppTheme();
    const { userId, selectedCredential } = useKonnectx();
    const { hideLoader } = useUniversalLoader();

    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [allContacts, setAllContacts] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [audienceTab, setAudienceTab] = useState('groups');
    const [contactSearch, setContactSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [editingCampaignId, setEditingCampaignId] = useState(null);

    const [form, setForm] = useState({
        name: '', templateId: null, messageTemplate: '',
        messageType: 'text', scheduledAt: null, recipients: [], groupIds: []
    });

    const fetchData = useCallback(async () => {
        try {
            const credId = selectedCredential?.id || selectedCredential?._id;
            const wabaId = selectedCredential?.wabaId;
            const credParams = {
                credentialId: credId,
                wabaId,
                phoneNumberId: selectedCredential?.phoneNumberId
            };
            const [camps, tmpls, cntctsData, grpsData] = await Promise.all([
                campaignsService.getCampaigns(userId, credParams).catch(() => []),
                templatesService.getTemplates(userId, credParams).catch(() => []),
                contactsService.getContacts(userId).catch(() => []),
                contactsService.getGroups().catch(() => [])
            ]);
            const rawList = Array.isArray(camps) ? camps : camps?.campaigns ?? [];
            const list = rawList.filter((c) => c && c.status !== 'DELETED' && !c.isDeleted && !c.deletedAt);
            setCampaigns(list);
            setTemplates(Array.isArray(tmpls) ? tmpls : tmpls?.templates ?? []);

            const fetchedContacts = Array.isArray(cntctsData) ? cntctsData : (cntctsData?.data ?? cntctsData?.contacts ?? []);
            const fetchedGroups = Array.isArray(grpsData) ? grpsData : (grpsData?.data ?? grpsData?.groups ?? []);
            setAllContacts(fetchedContacts);
            setAllGroups(fetchedGroups);
        } catch { } finally {
            setLoading(false);
            hideLoader();
        }
    }, [userId, selectedCredential, hideLoader]);

    useEffect(() => { fetchData(); }, [fetchData, selectedCredential]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const toggleGroupSelection = (groupId) => {
        const current = form.groupIds || [];
        const exists = current.includes(groupId);
        const updated = exists ? current.filter((id) => id !== groupId) : [...current, groupId];
        setForm((prev) => ({ ...prev, groupIds: updated }));
    };

    const toggleContactSelection = (contact) => {
        const current = form.recipients || [];
        const phone = contact.phone;
        if (!phone) return;
        const exists = current.some((r) => (typeof r === 'string' ? r === phone : r.phone === phone));
        const updated = exists
            ? current.filter((r) => (typeof r === 'string' ? r !== phone : r.phone !== phone))
            : [...current, { phone, name: contact.name || '' }];
        setForm((prev) => ({ ...prev, recipients: updated }));
    };

    const toggleTagSelection = (tag) => {
        const matchingContacts = allContacts.filter((c) => {
            if (!c.tags) return false;
            if (Array.isArray(c.tags)) return c.tags.includes(tag);
            return String(c.tags).toLowerCase().includes(String(tag).toLowerCase());
        });

        const current = form.recipients || [];
        const matchingPhones = matchingContacts.map((c) => c.phone).filter(Boolean);
        const allSelected = matchingPhones.length > 0 && matchingPhones.every((phone) => current.some((r) => (typeof r === 'string' ? r === phone : r.phone === phone)));

        let updated = [...current];
        if (allSelected) {
            updated = updated.filter((r) => {
                const phone = typeof r === 'string' ? r : r.phone;
                return !matchingPhones.includes(phone);
            });
        } else {
            matchingContacts.forEach((c) => {
                if (c.phone && !updated.some((r) => (typeof r === 'string' ? r === c.phone : r.phone === c.phone))) {
                    updated.push({ phone: c.phone, name: c.name || '' });
                }
            });
        }
        setForm((prev) => ({ ...prev, recipients: updated }));
    };

    const selectAllContacts = () => {
        const all = allContacts.map((c) => ({ phone: c.phone, name: c.name || '' })).filter((c) => c.phone);
        setForm((prev) => ({ ...prev, recipients: all }));
    };

    const clearAllRecipients = () => {
        setForm((prev) => ({ ...prev, recipients: [], groupIds: [] }));
    };

    const handleOpenEdit = (camp) => {
        const id = camp.id || camp._id;
        setEditingCampaignId(id);
        const msg = typeof camp.messageTemplate === 'string'
            ? camp.messageTemplate
            : (camp.messageTemplate?.body || camp.messageTemplate?.text || (camp.messageTemplate ? JSON.stringify(camp.messageTemplate) : ''));
        setForm({
            name: camp.name || '',
            messageType: camp.messageType || 'text',
            templateId: camp.templateId || null,
            messageTemplate: msg || '',
            scheduledAt: camp.scheduledAt ? new Date(camp.scheduledAt).toISOString() : null,
            recipients: camp.recipients || [],
            groupIds: camp.groupIds || []
        });
        if (showDetail) setShowDetail(null);
        setShowCreate(true);
    };

    const handleCreate = async () => {
        if (!form.name.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Campaign name is required' });
            return;
        }
        setSaving(true);
        try {
            const body = {
                name: form.name.trim(),
                messageType: form.messageType,
                templateId: form.templateId || undefined,
                messageTemplate: form.messageTemplate || undefined,
                scheduledAt: form.scheduledAt || undefined,
                recipients: form.recipients?.length ? form.recipients : undefined,
                groupIds: form.groupIds?.length ? form.groupIds : undefined
            };

            if (editingCampaignId) {
                await campaignsService.updateCampaign(userId, editingCampaignId, body);
                Toast.show({ type: 'success', text1: 'Campaign updated' });
            } else {
                body.status = 'DRAFT';
                await campaignsService.saveCampaign(userId, body);
                Toast.show({ type: 'success', text1: 'Campaign created' });
            }

            setShowCreate(false);
            setEditingCampaignId(null);
            setForm({ name: '', templateId: null, messageTemplate: '', messageType: 'text', scheduledAt: null, recipients: [], groupIds: [] });
            fetchData();
        } catch (err) {
            console.error('[CreateCampaign Error in Tab]', err?.response?.status, err?.response?.data || err.message, err);
            const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to save campaign';
            Toast.show({ type: 'error', text1: 'Error', text2: errorMsg });
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (camp) => {
        const action = camp.status === 'RUNNING' ? 'stop' : 'start';
        try {
            await campaignsService.triggerCampaign(userId, camp.id, action);
            Toast.show({ type: 'success', text1: action === 'start' ? 'Campaign started' : 'Campaign paused' });
            fetchData();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId || deleting) return;
        const id = deleteTargetId;
        setDeleting(true);
        try {
            await campaignsService.deleteCampaign(userId, id);
            setCampaigns((prev) => prev.filter((c) => String(c.id || c._id) !== String(id)));
            Toast.show({ type: 'success', text1: 'Campaign deleted' });
            if (showDetail && String(showDetail.id || showDetail._id) === String(id)) setShowDetail(null);
            fetchData();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setDeleting(false);
            setDeleteTargetId(null);
        }
    };

    const handleClone = async (camp) => {
        try {
            await campaignsService.saveCampaign(userId, {
                name: `${camp.name} (Copy)`,
                status: 'DRAFT',
                messageType: camp.messageType || 'text',
                templateId: camp.templateId || undefined,
                messageTemplate: camp.messageTemplate || undefined
            });
            Toast.show({ type: 'success', text1: 'Campaign cloned' });
            fetchData();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        }
    };

    // Metrics for header stats bar
    const stats = {
        total: campaigns.length,
        running: campaigns.filter((c) => c.status === 'RUNNING').length,
        scheduled: campaigns.filter((c) => c.status === 'SCHEDULED').length,
        draft: campaigns.filter((c) => c.status === 'DRAFT').length,
        completed: campaigns.filter((c) => c.status === 'COMPLETED').length
    };

    const filteredCampaigns = campaigns.filter((c) => {
        const matchesQuery = !searchQuery.trim() || (c.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    const renderCampaign = ({ item }) => {
        const badge = STATUS_BADGES[item.status] || STATUS_BADGES.DRAFT;
        const total = item.total || item.recipients?.length || item._count?.recipients || 0;
        const sent = item.sent || 0;
        const progress = total > 0 ? Math.min(Math.round((sent / total) * 100), 100) : 0;
        const itemId = item.id || item._id;
        const isDeletingThis = deleting && String(deleteTargetId) === String(itemId);

        return (
            <TouchableOpacity
                onPress={() => setShowDetail(item)}
                activeOpacity={0.7}
                className={`mb-2 rounded-[14px] border p-3 ${isDeletingThis ? 'opacity-40' : ''}`}
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                <View className="flex-row items-center">
                    {/* Left Main Section */}
                    <View className="flex-1 mr-2">
                        {/* Row 1: Title + Message Type Badge */}
                        <View className="flex-row items-center justify-between gap-2">
                            <Text className={`text-[14px] font-bold flex-1 ${palette.text}`} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <View className="flex-row items-center gap-1 rounded-md px-1.5 py-0.5" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                                <Ionicons
                                    name={item.messageType === 'template' ? 'document-text-outline' : 'chatbox-ellipses-outline'}
                                    size={10}
                                    color={palette.textMutedColor}
                                />
                                <Text className={`text-[9px] font-semibold uppercase ${palette.textSoft}`}>
                                    {item.messageType || 'text'}
                                </Text>
                            </View>
                        </View>

                        {/* Row 2: Status Badge + Action Trigger + Details */}
                        <View className="flex-row flex-wrap items-center gap-1.5 mt-1.5">
                            {/* Status Pill */}
                            <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
                                <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color }} />
                                <Text style={{ color: badge.color, fontSize: 9, fontWeight: '800' }}>{badge.label}</Text>
                            </View>

                            {/* Direct Trigger Action */}
                            {item.status === 'DRAFT' || item.status === 'PAUSED' ? (
                                <TouchableOpacity
                                    onPress={() => handleToggle(item)}
                                    className="flex-row items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/30">
                                    <Ionicons name="play-sharp" size={9} color="#16a34a" />
                                    <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Start</Text>
                                </TouchableOpacity>
                            ) : null}

                            {item.status === 'RUNNING' ? (
                                <TouchableOpacity
                                    onPress={() => handleToggle(item)}
                                    className="flex-row items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 border border-amber-500/30">
                                    <Ionicons name="pause-sharp" size={9} color="#d97706" />
                                    <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Pause</Text>
                                </TouchableOpacity>
                            ) : null}

                            {/* Schedule info if set */}
                            {item.scheduledAt ? (
                                <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                                    <Ionicons name="calendar-outline" size={10} color={palette.textMutedColor} />
                                    <Text className={`text-[9px] ${palette.textSoft}`}>
                                        {new Date(item.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            ) : null}

                            {/* Recipient Count Pill */}
                            <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                                <Ionicons name="people-outline" size={10} color={palette.textMutedColor} />
                                <Text className={`text-[9px] ${palette.textSoft}`}>
                                    {total} rec.
                                </Text>
                            </View>
                        </View>

                        {/* Row 3: Progress Bar */}
                        {(total > 0 || sent > 0) ? (
                            <View className="mt-2">
                                <View className="flex-row items-center justify-between mb-0.5">
                                    <Text className={`text-[9px] font-medium ${palette.textSoft}`}>
                                        Progress: {sent}/{total} sent
                                    </Text>
                                    <Text className="text-[9px] font-bold text-sky-600 dark:text-sky-400">
                                        {progress}%
                                    </Text>
                                </View>
                                <View className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                                    <View className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
                                </View>
                            </View>
                        ) : null}
                    </View>

                    {/* Right Standalone Actions */}
                    <View className="flex-row items-center gap-1 border-l pl-2" style={{ borderColor: palette.colors.border }}>
                        <TouchableOpacity
                            onPress={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: palette.colors.surfaceAlt }}
                            disabled={deleting}>
                            <Ionicons name="create-outline" size={14} color={palette.textColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleClone(item)}
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: palette.colors.surfaceAlt }}
                            disabled={deleting}>
                            <Ionicons name="copy-outline" size={14} color={palette.textMutedColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setDeleteTargetId(itemId)}
                            className="p-1.5 rounded-lg bg-red-500/10"
                            disabled={deleting}>
                            {isDeletingThis ? (
                                <ActivityIndicator size="small" color="#dc2626" />
                            ) : (
                                <Ionicons name="trash-outline" size={14} color="#dc2626" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
            <View className="flex-1 px-3 pt-2">
                {/* Header Section */}
                <View className="mb-2 flex-row items-center justify-between">
                    <View>
                        <View className="mb-1 self-start rounded-full bg-sky-600/15 px-2 py-0.5">
                            <Text className="text-[9px] font-extrabold uppercase tracking-[1px] text-sky-600 dark:text-sky-400">KONNECTX BROADCASTS</Text>
                        </View>
                        <Text className="text-[20px] font-bold" style={{ color: palette.textColor }}>Campaigns</Text>
                        <Text className={`text-[11px] ${palette.textSoft}`}>Manage WhatsApp broadcasts & scheduled messages</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowCreate(true)}
                        className="flex-row items-center gap-1.5 rounded-full bg-sky-600 px-3.5 py-2 shadow-xs active:opacity-80">
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text className="text-[12px] font-bold text-white">New</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats Summary Bar */}
                <View className="mb-2 flex-row gap-1.5">
                    {[
                        { key: 'ALL', label: 'Total', count: stats.total, color: '#0284c7', icon: 'megaphone-outline' },
                        { key: 'RUNNING', label: 'Active', count: stats.running, color: '#16a34a', icon: 'play-circle-outline' },
                        { key: 'SCHEDULED', label: 'Scheduled', count: stats.scheduled, color: '#7c3aed', icon: 'time-outline' },
                        { key: 'DRAFT', label: 'Drafts', count: stats.draft, color: '#64748b', icon: 'document-outline' }
                    ].map((st) => (
                        <TouchableOpacity
                            key={st.key}
                            onPress={() => setStatusFilter(statusFilter === st.key ? 'ALL' : st.key)}
                            className={`flex-1 rounded-[12px] border p-2 ${statusFilter === st.key ? 'border-sky-600 bg-sky-600/10' : ''}`}
                            style={statusFilter !== st.key ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                            <View className="flex-row items-center justify-between mb-0.5">
                                <Text className={`text-[10px] font-semibold ${palette.textSoft}`}>{st.label}</Text>
                                <Ionicons name={st.icon} size={12} color={st.color} />
                            </View>
                            <Text className={`text-[16px] font-bold ${palette.text}`}>{st.count}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Search & Status Filter Controls */}
                <View className="mb-2.5 gap-2">
                    {/* Search Input */}
                    <View className="flex-row items-center rounded-xl border px-3 py-1.5"
                        style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                        <Ionicons name="search-outline" size={14} color={palette.textMutedColor} className="mr-2" />
                        <TextInput
                            className="flex-1 text-[12px]"
                            style={{ color: palette.textColor }}
                            placeholder="Search campaign by name..."
                            placeholderTextColor={palette.textMutedColor}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-0.5">
                                <Ionicons name="close-circle" size={14} color={palette.textMutedColor} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Filter Pills */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {[
                            { key: 'ALL', label: 'All' },
                            { key: 'RUNNING', label: 'Running' },
                            { key: 'SCHEDULED', label: 'Scheduled' },
                            { key: 'DRAFT', label: 'Drafts' },
                            { key: 'PAUSED', label: 'Paused' },
                            { key: 'COMPLETED', label: 'Completed' }
                        ].map((flt) => {
                            const isSelected = statusFilter === flt.key;
                            return (
                                <TouchableOpacity
                                    key={flt.key}
                                    onPress={() => setStatusFilter(flt.key)}
                                    className={`mr-1.5 rounded-full border px-3 py-1 ${isSelected ? 'bg-sky-600 border-sky-600' : ''}`}
                                    style={!isSelected ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                                    <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : palette.textSoft}`}>
                                        {flt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Campaign List */}
                <FlatList
                    data={filteredCampaigns}
                    keyExtractor={(item) => (item.id || item._id)?.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
                    ListEmptyComponent={
                        loading ? (
                            <><SkeletonCard /><SkeletonCard /></>
                        ) : (
                            <KonnectxEmptyState
                                icon="megaphone-outline"
                                title={searchQuery || statusFilter !== 'ALL' ? 'No matching campaigns' : 'No campaigns yet'}
                                description={searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your search terms or filter selection.' : 'Create your first broadcast campaign to start reaching your audience.'}
                                ctaLabel="Create Campaign"
                                onCtaPress={() => setShowCreate(true)}
                            />
                        )
                    }
                    renderItem={renderCampaign}
                />
            </View>

            {/* Create / Edit Campaign Modal */}
            <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setShowCreate(false); setEditingCampaignId(null); }}>
                <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                        <View>
                            <Text className={`text-[16px] font-bold ${palette.text}`}>
                                {editingCampaignId ? 'Edit Campaign' : 'Create Campaign'}
                            </Text>
                            <Text className={`text-[11px] ${palette.textSoft}`}>Configure message, template & schedule</Text>
                        </View>
                        <TouchableOpacity onPress={() => { setShowCreate(false); setEditingCampaignId(null); }} className="p-1">
                            <Ionicons name="close" size={22} color={palette.textColor} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Campaign Name */}
                        <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Campaign Name *</Text>
                        <TextInput className="mb-3.5 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="e.g. Summer Special Broadcast" placeholderTextColor={palette.textMutedColor}
                            value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

                        {/* Message Type Selector */}
                        <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Message Type</Text>
                        <View className="mb-3.5 flex-row gap-2">
                            {[
                                { type: 'text', label: 'Text Message', icon: 'text-outline' },
                                { type: 'template', label: 'WhatsApp Template', icon: 'document-text-outline' }
                            ].map((t) => (
                                <TouchableOpacity key={t.type} onPress={() => setForm({ ...form, messageType: t.type })}
                                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 border ${form.messageType === t.type ? 'bg-sky-600 border-sky-600' : ''}`}
                                    style={form.messageType !== t.type ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                                    <Ionicons name={t.icon} size={15} color={form.messageType === t.type ? '#fff' : palette.textColor} />
                                    <Text className={`text-[12px] font-bold ${form.messageType === t.type ? 'text-white' : palette.text}`}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Template Selection */}
                        {form.messageType === 'template' ? (
                            <View className="mb-3.5">
                                <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Select WhatsApp Template</Text>
                                {templates.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
                                        {templates.map((t) => {
                                            const isSelected = String(form.templateId) === String(t.id || t._id);
                                            return (
                                                <TouchableOpacity key={t.id || t._id || t.name} onPress={() => {
                                                    const bodyContent = typeof t.components === 'string' ? t.components : (t.body || t.content || '');
                                                    setForm({ ...form, templateId: t.id || t._id, messageTemplate: bodyContent || form.messageTemplate });
                                                }}
                                                    className={`mr-2 rounded-xl border p-3 min-w-[150px] max-w-[210px] ${isSelected ? 'border-sky-600 bg-sky-600/10' : ''}`}
                                                    style={!isSelected ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                                                    <View className="flex-row items-center justify-between mb-1">
                                                        <Text className={`text-[13px] font-bold flex-1 mr-1 ${palette.text}`} numberOfLines={1}>{t.name}</Text>
                                                        {isSelected ? <Ionicons name="checkmark-circle" size={16} color="#0284c7" /> : null}
                                                    </View>
                                                    <View className="flex-row items-center gap-1 mt-0.5">
                                                        {t.category ? (
                                                            <View className="rounded px-1.5 py-0.5 bg-sky-600/15">
                                                                <Text className="text-[9px] font-bold uppercase text-sky-600">{t.category}</Text>
                                                            </View>
                                                        ) : null}
                                                        {t.language ? (
                                                            <Text className={`text-[10px] ${palette.textSoft}`}>{t.language}</Text>
                                                        ) : null}
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                ) : (
                                    <View className="rounded-xl border p-3 items-center" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                        <Ionicons name="alert-circle-outline" size={18} color={palette.textMutedColor} />
                                        <Text className={`mt-1 text-[11px] text-center ${palette.textSoft}`}>
                                            No templates found for this account.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {/* Message Content */}
                        <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Message Content</Text>
                        <TextInput className="mb-3.5 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="Enter message text or template content..." placeholderTextColor={palette.textMutedColor}
                            value={form.messageTemplate} onChangeText={(v) => setForm({ ...form, messageTemplate: v })}
                            multiline numberOfLines={3} textAlignVertical="top" />

                        {/* Schedule Section */}
                        <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Delivery Schedule</Text>
                        <View className="mb-3 flex-row gap-2">
                            <TouchableOpacity onPress={() => setForm({ ...form, scheduledAt: null })}
                                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 border ${!form.scheduledAt ? 'bg-sky-600 border-sky-600' : ''}`}
                                style={form.scheduledAt ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                                <Ionicons name="flash-outline" size={15} color={!form.scheduledAt ? '#fff' : palette.textColor} />
                                <Text className={`text-[12px] font-bold ${!form.scheduledAt ? 'text-white' : palette.text}`}>Send Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setForm({ ...form, scheduledAt: new Date(Date.now() + 3600000).toISOString() })}
                                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 border ${form.scheduledAt ? 'bg-sky-600 border-sky-600' : ''}`}
                                style={!form.scheduledAt ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                                <Ionicons name="calendar-outline" size={15} color={form.scheduledAt ? '#fff' : palette.textColor} />
                                <Text className={`text-[12px] font-bold ${form.scheduledAt ? 'text-white' : palette.text}`}>Schedule</Text>
                            </TouchableOpacity>
                        </View>

                        {form.scheduledAt ? (
                            <View className="mb-4 rounded-xl border p-3" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                <Text className={`mb-1.5 text-[11px] font-semibold ${palette.textMuted}`}>Quick Presets</Text>
                                <View className="flex-row flex-wrap gap-1.5 mb-2.5">
                                    {SCHEDULE_PRESETS.map((preset) => (
                                        <TouchableOpacity key={preset.label} onPress={() => setForm({ ...form, scheduledAt: preset.getValue() })}
                                            className="rounded-lg border px-2.5 py-1.5"
                                            style={{ backgroundColor: palette.colors.surfaceAlt, borderColor: palette.colors.border }}>
                                            <Text className={`text-[11px] font-semibold ${palette.text}`}>{preset.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Scheduled ISO Timestamp</Text>
                                <TextInput className="rounded-lg border px-2.5 py-1.5 text-[12px] font-mono"
                                    style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
                                    value={form.scheduledAt} onChangeText={(v) => setForm({ ...form, scheduledAt: v })} />
                                <Text className="mt-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                                    📅 {new Date(form.scheduledAt).toLocaleString()}
                                </Text>
                            </View>
                        ) : null}

                        {/* Target Audience / Recipients Section */}
                        <View className="mb-4 rounded-2xl border p-3.5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-row items-center gap-1.5">
                                    <Ionicons name="people-outline" size={16} color="#0284c7" />
                                    <Text className={`text-[13px] font-bold ${palette.text}`}>Target Audience</Text>
                                </View>
                                {(form.recipients?.length > 0 || form.groupIds?.length > 0) ? (
                                    <TouchableOpacity onPress={clearAllRecipients}>
                                        <Text className="text-[10px] font-bold text-red-600">Clear All</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {/* Selected Count Summary Pill */}
                            <View className="mb-3 flex-row items-center gap-2 rounded-xl bg-sky-600/10 px-3 py-2 border border-sky-600/20">
                                <Ionicons name="checkmark-done-circle" size={16} color="#0284c7" />
                                <Text className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                                    {form.recipients?.length || 0} contact(s) & {form.groupIds?.length || 0} group(s) selected
                                </Text>
                            </View>

                            {/* Selection Sub-tabs */}
                            <View className="mb-3 flex-row rounded-xl p-1 bg-slate-100 dark:bg-slate-800">
                                {[
                                    { id: 'groups', label: `Groups (${allGroups.length})`, icon: 'folder-open-outline' },
                                    { id: 'contacts', label: `Contacts (${allContacts.length})`, icon: 'person-outline' },
                                    { id: 'tags', label: 'By Tags', icon: 'pricetag-outline' }
                                ].map((tab) => (
                                    <TouchableOpacity key={tab.id} onPress={() => setAudienceTab(tab.id)}
                                        className={`flex-1 flex-row items-center justify-center gap-1 rounded-lg py-1.5 ${audienceTab === tab.id ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}>
                                        <Ionicons name={tab.icon} size={13} color={audienceTab === tab.id ? '#0284c7' : palette.textMutedColor} />
                                        <Text className={`text-[10px] font-bold ${audienceTab === tab.id ? 'text-sky-600 dark:text-sky-400' : palette.textSoft}`}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* TAB 1: GROUPS */}
                            {audienceTab === 'groups' ? (
                                <View className="gap-1.5">
                                    {allGroups.length > 0 ? (
                                        allGroups.map((grp) => {
                                            const isSelected = form.groupIds?.includes(grp.id || grp._id);
                                            return (
                                                <TouchableOpacity key={grp.id || grp._id || grp.name} onPress={() => toggleGroupSelection(grp.id || grp._id)}
                                                    className={`flex-row items-center justify-between rounded-xl border px-3 py-2 ${isSelected ? 'bg-sky-600/10 border-sky-600' : ''}`}
                                                    style={!isSelected ? { backgroundColor: palette.colors.page, borderColor: palette.colors.border } : {}}>
                                                    <View className="flex-row items-center gap-2 flex-1">
                                                        <View className="h-7 w-7 rounded-full items-center justify-center bg-sky-600/20">
                                                            <Ionicons name="people" size={14} color="#0284c7" />
                                                        </View>
                                                        <View className="flex-1">
                                                            <Text className={`text-[12px] font-bold ${palette.text}`}>{grp.name}</Text>
                                                            <Text className={`text-[9px] ${palette.textSoft}`}>{grp._count?.contacts || grp.memberCount || 0} members</Text>
                                                        </View>
                                                    </View>
                                                    <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={18} color={isSelected ? '#0284c7' : palette.textMutedColor} />
                                                </TouchableOpacity>
                                            );
                                        })
                                    ) : (
                                        <Text className={`py-2 text-center text-[11px] ${palette.textSoft}`}>No contact groups found</Text>
                                    )}
                                </View>
                            ) : null}

                            {/* TAB 2: INDIVIDUAL CONTACTS */}
                            {audienceTab === 'contacts' ? (
                                <View className="gap-2">
                                    <View className="flex-row items-center justify-between">
                                        <TextInput className="flex-1 rounded-xl border px-2.5 py-1.5 text-[12px] mr-2"
                                            style={{ backgroundColor: palette.colors.page, borderColor: palette.colors.border, color: palette.textColor }}
                                            placeholder="Search contact..." placeholderTextColor={palette.textMutedColor}
                                            value={contactSearch} onChangeText={setContactSearch} />
                                        <TouchableOpacity onPress={selectAllContacts} className="rounded-lg bg-sky-600/10 px-2.5 py-1.5">
                                            <Text className="text-[10px] font-bold text-sky-600">Select All</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                        <View className="gap-1.5 py-1">
                                            {allContacts.filter((c) => (c.name || c.phone || '').toLowerCase().includes(contactSearch.toLowerCase())).map((cnt) => {
                                                const phone = cnt.phone;
                                                const isSelected = form.recipients?.some((r) => (typeof r === 'string' ? r === phone : r.phone === phone));
                                                return (
                                                    <TouchableOpacity key={cnt.id || cnt._id || cnt.phone} onPress={() => toggleContactSelection(cnt)}
                                                        className={`flex-row items-center justify-between rounded-xl border px-2.5 py-1.5 ${isSelected ? 'bg-sky-600/10 border-sky-600' : ''}`}
                                                        style={!isSelected ? { backgroundColor: palette.colors.page, borderColor: palette.colors.border } : {}}>
                                                        <View className="flex-row items-center gap-2 flex-1">
                                                            <View className="h-6 w-6 rounded-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                                                                <Text className={`text-[10px] font-bold ${palette.text}`}>{cnt.name?.charAt(0) || 'C'}</Text>
                                                            </View>
                                                            <View className="flex-1">
                                                                <Text className={`text-[11px] font-bold ${palette.text}`} numberOfLines={1}>{cnt.name || 'Unnamed'}</Text>
                                                                <Text className={`text-[9px] ${palette.textSoft}`}>{cnt.phone}</Text>
                                                            </View>
                                                        </View>
                                                        <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={16} color={isSelected ? '#0284c7' : palette.textMutedColor} />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </ScrollView>
                                </View>
                            ) : null}

                            {/* TAB 3: TAGS */}
                            {audienceTab === 'tags' ? (
                                <View className="flex-row flex-wrap gap-1.5 py-1">
                                    {Array.from(new Set(allContacts.flatMap((c) => (Array.isArray(c.tags) ? c.tags : String(c.tags || '').split(',').map((t) => t.trim()).filter(Boolean))))).map((tag) => {
                                        if (!tag) return null;
                                        const matching = allContacts.filter((c) => (Array.isArray(c.tags) ? c.tags.includes(tag) : String(c.tags || '').includes(tag)));
                                        const matchingPhones = matching.map((c) => c.phone).filter(Boolean);
                                        const isSelected = matchingPhones.length > 0 && matchingPhones.every((phone) => form.recipients?.some((r) => (typeof r === 'string' ? r === phone : r.phone === phone)));

                                        return (
                                            <TouchableOpacity key={tag} onPress={() => toggleTagSelection(tag)}
                                                className={`flex-row items-center gap-1 rounded-full border px-3 py-1.5 ${isSelected ? 'bg-sky-600 border-sky-600' : ''}`}
                                                style={!isSelected ? { backgroundColor: palette.colors.page, borderColor: palette.colors.border } : {}}>
                                                <Ionicons name="pricetag" size={11} color={isSelected ? '#fff' : '#0284c7'} />
                                                <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : palette.text}`}>
                                                    #{tag} ({matching.length})
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : null}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity onPress={handleCreate} disabled={saving}
                            className="mt-1 items-center justify-center rounded-xl bg-sky-600 py-3.5 shadow-sm">
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-[15px] font-bold text-white">
                                    {editingCampaignId ? 'Update Campaign' : 'Create Campaign'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Campaign Detail Modal */}
            <Modal visible={!!showDetail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDetail(null)}>
                <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center justify-between px-4 py-3" style={{ backgroundColor: palette.colors.surface }}>
                        <Text className={`text-[16px] font-bold flex-1 ${palette.text}`}>{showDetail?.name}</Text>
                        <TouchableOpacity onPress={() => setShowDetail(null)} className="p-1">
                            <Ionicons name="close" size={22} color={palette.textColor} />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 px-4 pt-4">
                        {showDetail ? (
                            <>
                                <View className="mb-4 rounded-[16px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                    <View className="flex-row items-center gap-2 mb-2.5">
                                        <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: (STATUS_BADGES[showDetail.status] || STATUS_BADGES.DRAFT).bg }}>
                                            <Text style={{ color: (STATUS_BADGES[showDetail.status] || STATUS_BADGES.DRAFT).color, fontSize: 10, fontWeight: '800' }}>
                                                {(STATUS_BADGES[showDetail.status] || STATUS_BADGES.DRAFT).label}
                                            </Text>
                                        </View>
                                        <Text className={`text-[11px] ${palette.textSoft}`}>{showDetail.messageType || 'text'}</Text>
                                    </View>

                                    <View className="flex-row flex-wrap gap-3">
                                        <View>
                                            <Text className={`text-[10px] font-semibold ${palette.textMuted}`}>Total Recipients</Text>
                                            <Text className={`text-[18px] font-bold ${palette.text}`}>{showDetail.total || showDetail._count?.recipients || 0}</Text>
                                        </View>
                                        <View>
                                            <Text className={`text-[10px] font-semibold ${palette.textMuted}`}>Sent</Text>
                                            <Text className={`text-[18px] font-bold ${palette.text}`}>{showDetail.sent || 0}</Text>
                                        </View>
                                        {showDetail.scheduledAt ? (
                                            <View>
                                                <Text className={`text-[10px] font-semibold ${palette.textMuted}`}>Scheduled</Text>
                                                <Text className={`text-[13px] font-bold ${palette.text}`}>{new Date(showDetail.scheduledAt).toLocaleDateString()}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>

                                <View className="flex-row gap-2">
                                    {(showDetail.status === 'DRAFT' || showDetail.status === 'PAUSED') ? (
                                        <TouchableOpacity onPress={() => { handleToggle(showDetail); setShowDetail(null); }}
                                            className="flex-1 items-center rounded-xl bg-green-600 py-3">
                                            <Text className="text-[13px] font-bold text-white">Start Campaign</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                    {showDetail.status === 'RUNNING' ? (
                                        <TouchableOpacity onPress={() => { handleToggle(showDetail); setShowDetail(null); }}
                                            className="flex-1 items-center rounded-xl bg-amber-600 py-3">
                                            <Text className="text-[13px] font-bold text-white">Pause Campaign</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                    <TouchableOpacity onPress={() => handleOpenEdit(showDetail)}
                                        className="flex-1 items-center rounded-xl border py-3" style={{ borderColor: palette.colors.border }}>
                                        <Text className={`text-[13px] font-bold ${palette.text}`}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { handleClone(showDetail); setShowDetail(null); }}
                                        className="flex-1 items-center rounded-xl border py-3" style={{ borderColor: palette.colors.border }}>
                                        <Text className={`text-[13px] font-bold ${palette.text}`}>Clone</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setDeleteTargetId(showDetail.id)}
                                        className="items-center rounded-xl bg-red-600 px-5 py-3">
                                        <Ionicons name="trash" size={18} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : null}
                    </View>
                </SafeAreaView>
            </Modal>

            <IosConfirmModal
                visible={!!deleteTargetId}
                loading={deleting}
                loadingText="Deleting..."
                onClose={() => !deleting && setDeleteTargetId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Campaign?"
                message="Are you sure you want to delete this campaign? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
            />
        </SafeAreaView>
    );
}
