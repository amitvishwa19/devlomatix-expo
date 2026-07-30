import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import IosConfirmModal from '~/components/IosConfirmModal';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as campaignsService from '~/services/konnectx/campaigns';
import * as templatesService from '~/services/konnectx/templates';

const STATUS_BADGES = {
    DRAFT: { label: 'Draft', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    RUNNING: { label: 'Running', color: '#16a34a', bg: 'rgba(22,163,74,0.15)' },
    PAUSED: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    COMPLETED: { label: 'Completed', color: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
    SCHEDULED: { label: 'Scheduled', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ERROR: { label: 'Error', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' }
};

export default function KonnectXCampaignsScreen() {
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const [form, setForm] = useState({
        name: '', templateId: null, messageTemplate: '',
        messageType: 'text', scheduledAt: null, recipients: [], groupIds: []
    });

    const fetchData = useCallback(async () => {
        try {
            const [camps, tmpls] = await Promise.all([
                campaignsService.getCampaigns(userId).catch(() => []),
                templatesService.getTemplates(userId).catch(() => [])
            ]);
            const rawList = Array.isArray(camps) ? camps : camps?.campaigns ?? [];
            const list = rawList.filter((c) => c && c.status !== 'DELETED' && !c.isDeleted && !c.deletedAt);
            setCampaigns(list);
            setTemplates(Array.isArray(tmpls) ? tmpls : tmpls?.templates ?? []);
        } catch { } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const handleCreate = async () => {
        if (!form.name.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Campaign name is required' });
            return;
        }
        setSaving(true);
        try {
            const body = {
                name: form.name.trim(),
                status: 'DRAFT',
                messageType: form.messageType,
                templateId: form.templateId || undefined,
                messageTemplate: form.messageTemplate || undefined,
                scheduledAt: form.scheduledAt || undefined
            };
            await campaignsService.saveCampaign(userId, body);
            Toast.show({ type: 'success', text1: 'Campaign created' });
            setShowCreate(false);
            setForm({ name: '', templateId: null, messageTemplate: '', messageType: 'text', scheduledAt: null, recipients: [], groupIds: [] });
            fetchData();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
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
        if (!deleteTargetId) return;
        const id = deleteTargetId;
        try {
            await campaignsService.deleteCampaign(userId, id);
            setCampaigns((prev) => prev.filter((c) => String(c.id || c._id) !== String(id)));
            Toast.show({ type: 'success', text1: 'Campaign deleted' });
            if (showDetail && String(showDetail.id || showDetail._id) === String(id)) setShowDetail(null);
            fetchData();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
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

    const renderCampaign = ({ item }) => {
        const badge = STATUS_BADGES[item.status] || STATUS_BADGES.DRAFT;
        const total = item.total || item._count?.recipients || 0;
        const sent = item.sent || 0;
        const progress = total > 0 ? (sent / total) * 100 : 0;

        return (
            <TouchableOpacity
                onPress={() => setShowDetail(item)}
                className="mb-1.5 rounded-[14px] border p-2.5"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                <View className="flex-row items-center">
                    <View className="flex-1 mr-2">
                        <Text className={`text-[14px] font-bold ${palette.text}`} numberOfLines={1}>{item.name}</Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <View className="rounded-full px-1.5 py-0.5" style={{ backgroundColor: badge.bg }}>
                                <Text style={{ color: badge.color, fontSize: 8, fontWeight: '800' }}>{badge.label}</Text>
                            </View>
                            {item.status === 'DRAFT' || item.status === 'PAUSED' ? (
                                <TouchableOpacity onPress={() => handleToggle(item)}>
                                    <Text className="text-[10px] font-bold text-green-600">Start</Text>
                                </TouchableOpacity>
                            ) : null}
                            {item.status === 'RUNNING' ? (
                                <TouchableOpacity onPress={() => handleToggle(item)}>
                                    <Text className="text-[10px] font-bold text-amber-600">Pause</Text>
                                </TouchableOpacity>
                            ) : null}
                            <Text className={`text-[9px] ${palette.textSoft}`}>{item.messageType || 'text'}</Text>
                        </View>
                        {total > 0 ? (
                            <View className="mt-1">
                                <View className="h-1 rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                                    <View className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                                </View>
                                <Text className={`text-[9px] ${palette.textSoft} mt-0.5`}>{sent}/{total} sent</Text>
                            </View>
                        ) : null}
                    </View>
                    <View className="items-center gap-2">
                        <TouchableOpacity onPress={() => handleClone(item)} className="p-1">
                            <Ionicons name="copy-outline" size={14} color={palette.textMutedColor} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDeleteTargetId(item.id)} className="p-1">
                            <Ionicons name="trash-outline" size={14} color="#dc2626" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
            <View className="flex-1 px-3 pt-3">
                <View className="mb-3 flex-row items-center justify-between">
                    <View>
                        <View className="mb-1.5 self-start rounded-full bg-sky-600 px-2.5 py-1">
                            <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">CAMPAIGNS</Text>
                        </View>
                        <Text className="text-[22px] font-bold" style={{ color: palette.textColor }}>Broadcasts</Text>
                        <Text className={`mt-0.5 text-[12px] ${palette.textSoft}`}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowCreate(true)}
                        className="flex-row items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5">
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text className="text-[12px] font-bold text-white">New</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={campaigns}
                    keyExtractor={(item) => item.id?.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
                    ListEmptyComponent={
                        loading ? (
                            <><SkeletonCard /><SkeletonCard /></>
                        ) : (
                            <KonnectxEmptyState icon="megaphone-outline" title="No campaigns yet"
                                description="Create your first broadcast campaign to start reaching your audience."
                                ctaLabel="Create Campaign" onCtaPress={() => setShowCreate(true)} />
                        )
                    }
                    renderItem={renderCampaign}
                />
            </View>

            {/* Create Campaign Modal */}
            <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
                <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center justify-between px-4 py-3" style={{ backgroundColor: palette.colors.surface }}>
                        <Text className={`text-[16px] font-bold ${palette.text}`}>New Campaign</Text>
                        <TouchableOpacity onPress={() => setShowCreate(false)} className="p-1">
                            <Ionicons name="close" size={22} color={palette.textColor} />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 px-4 pt-4">
                        <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Campaign Name *</Text>
                        <TextInput className="mb-3 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="Summer Promotion" placeholderTextColor={palette.textMutedColor}
                            value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

                        <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Message Type</Text>
                        <View className="mb-3 flex-row gap-2">
                            {['text', 'template'].map((t) => (
                                <TouchableOpacity key={t} onPress={() => setForm({ ...form, messageType: t })}
                                    className={`flex-1 items-center rounded-xl py-2.5 ${form.messageType === t ? 'bg-sky-600' : 'border'}`}
                                    style={form.messageType !== t ? { borderColor: palette.colors.border } : {}}>
                                    <Text className={`text-[12px] font-bold ${form.messageType === t ? 'text-white' : palette.text}`}>
                                        {t === 'text' ? 'Text' : 'Template'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {form.messageType === 'template' && templates.length > 0 ? (
                            <>
                                <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Template</Text>
                                <View className="mb-3 flex-row flex-wrap gap-1.5">
                                    {templates.map((t) => (
                                        <TouchableOpacity key={t.id} onPress={() => setForm({ ...form, templateId: t.id })}
                                            className={`rounded-xl px-3 py-1.5 ${form.templateId === t.id ? 'bg-sky-600' : 'border'}`}
                                            style={form.templateId !== t.id ? { borderColor: palette.colors.border } : {}}>
                                            <Text className={`text-[11px] font-semibold ${form.templateId === t.id ? 'text-white' : palette.text}`}>
                                                {t.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        ) : null}

                        <Text className={`mb-1 text-[12px] font-semibold ${palette.text}`}>Message Text</Text>
                        <TextInput className="mb-4 rounded-xl border px-3 py-2.5 text-[14px]"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
                            placeholder="Enter your message..." placeholderTextColor={palette.textMutedColor}
                            value={form.messageTemplate} onChangeText={(v) => setForm({ ...form, messageTemplate: v })}
                            multiline numberOfLines={3} textAlignVertical="top" />

                        <TouchableOpacity onPress={handleCreate} disabled={saving}
                            className="items-center rounded-xl bg-sky-600 py-3.5">
                            <Text className="text-[15px] font-bold text-white">
                                {saving ? 'Creating...' : 'Create Campaign'}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
                onClose={() => setDeleteTargetId(null)}
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
