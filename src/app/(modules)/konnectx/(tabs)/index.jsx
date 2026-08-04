import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import IosConfirmModal from '~/components/IosConfirmModal';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';

import KonnectxCard from '~/components/konnectx/KonnectxCard';
import { SkeletonCard, SkeletonStatRow } from '~/components/konnectx/KonnectxLoadingSkeleton';
import KonnectxStatCard from '~/components/konnectx/KonnectxStatCard';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as analyticsService from '~/services/konnectx/analytics';
import * as campaignsService from '~/services/konnectx/campaigns';

import { useUniversalLoader } from '~/providers/UniversalLoaderProvider';

const STATUS_BADGES = {
    DRAFT: { label: 'Draft', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    RUNNING: { label: 'Running', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
    PAUSED: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    COMPLETED: { label: 'Completed', color: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
    SCHEDULED: { label: 'Scheduled', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    ERROR: { label: 'Error', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' }
};

export default function KonnectXDashboardScreen() {
    const { palette } = useAppTheme();
    const router = useRouter();
    const { userId, selectedCredential, credentials, setSelectedCredential, refreshCredentials } = useKonnectx();
    const { showLoader, hideLoader } = useUniversalLoader();

    const [stats, setStats] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAcctSwitcher, setShowAcctSwitcher] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // KonnectX Dashboard Data Fetch
    const fetchData = useCallback(async (targetCred = null) => {
        let resolvedId = userId;
        if (!resolvedId) {
            const session = await getSession();
            const u = session?.user;
            resolvedId = u?.userId || u?.id || u?._id || u?.sub;
        }
        try {
            const activeCred = targetCred || selectedCredential;
            const credParams = {
                credentialId: activeCred?.id || activeCred?._id,
                wabaId: activeCred?.wabaId,
                phoneNumberId: activeCred?.phoneNumberId
            };
            const [statsData, campaignsData, activitiesData] = await Promise.all([
                analyticsService.getStats(resolvedId, credParams).catch(() => null),
                campaignsService.getCampaigns(resolvedId, credParams).catch(() => []),
                analyticsService.getActivities(resolvedId, 1, 10, credParams).catch(() => ({ activities: [] }))
            ]);
            setStats(statsData?.stats ?? statsData);

            const rawList = Array.isArray(campaignsData)
                ? campaignsData
                : Array.isArray(campaignsData?.campaigns)
                    ? campaignsData.campaigns
                    : Array.isArray(campaignsData?.data)
                        ? campaignsData.data
                        : [];
            const list = rawList.filter((c) => c && c.status !== 'DELETED' && !c.isDeleted && !c.deletedAt);
            setCampaigns(list);

            setActivities(Array.isArray(activitiesData) ? activitiesData : activitiesData?.activities ?? []);
        } catch (err) {
            console.error('[Index Tab Fetch Error]', err);
        } finally {
            setLoading(false);
            hideLoader();
        }
    }, [userId, selectedCredential, hideLoader]);

    useEffect(() => {
        fetchData();
    }, [fetchData, selectedCredential]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshCredentials();
        await fetchData();
        setRefreshing(false);
    }, [refreshCredentials, fetchData]);

    const handleConfirmDelete = async () => {
        if (!deleteTargetId || deleting) return;
        const id = deleteTargetId;
        setDeleting(true);
        try {
            await campaignsService.deleteCampaign(userId, id);
            setCampaigns((prev) => prev.filter((c) => String(c.id || c._id) !== String(id)));
            Toast.show({ type: 'success', text1: 'Campaign deleted' });
            fetchData();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        } finally {
            setDeleting(false);
            setDeleteTargetId(null);
        }
    };

    const handleStartCampaign = async (camp) => {
        const action = camp.status === 'RUNNING' ? 'stop' : 'start';
        try {
            await campaignsService.triggerCampaign(userId, camp.id || camp._id, action);
            Toast.show({ type: 'success', text1: action === 'start' ? 'Campaign started' : 'Campaign paused' });
            fetchData();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
        }
    };

    const handleCreateCampaign = async () => {
        if (!newCampaignName.trim()) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Campaign name is required' });
            return;
        }
        try {
            await campaignsService.saveCampaign(userId, { name: newCampaignName.trim(), status: 'DRAFT' });
            Toast.show({ type: 'success', text1: 'Campaign created' });
            setNewCampaignName('');
            setShowCreateDialog(false);
            fetchData();
        } catch (err) {
            console.error('[CreateCampaign Error]', err?.response?.status, err?.response?.data || err.message, err);
            const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to create campaign';
            Toast.show({ type: 'error', text1: 'Error', text2: errorMsg });
        }
    };

    const statCards = [
        { label: 'Total Campaigns', value: String(campaigns?.length ?? 0), tone: palette.skySoft },
        { label: 'Messages Sent', value: stats?.messages?.sent?.toString() ?? '0', tone: palette.successSoft },
        { label: 'Active Contacts', value: stats?.contacts?.total?.toString() ?? '0', tone: palette.amberSoft },
        { label: 'Approved Templates', value: stats?.templates?.approved?.toString() ?? '0', tone: palette.accentSoft }
    ];

    const quickNavItems = [
        { icon: 'stats-chart', label: 'Analytics', route: '/(modules)/konnectx/analytics' },
        { icon: 'document-text', label: 'Templates', route: '/(modules)/konnectx/template' },
        { icon: 'chatbubble-ellipses', label: 'Quick Message', route: '/(modules)/konnectx/quick-message' },
        { icon: 'hardware-chip', label: 'Chatbots', route: '/(modules)/konnectx/chatbot' },
        { icon: 'layers', label: 'Flows', route: '/(modules)/konnectx/flows' },
    ];

    return (
        <SafeAreaView className={`flex-1 ${palette.page}`}>
            <StatusBar style={palette.statusBar} />
            <View className={`flex-1 ${palette.page}`}>
                <View className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-sky-500/5" />
                <View className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-teal-600/5" />

                <ScrollView
                    className={`flex-1 ${palette.page}`}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>
                    <View className="px-3 pb-24 pt-3">
                        <View className={`mb-3 rounded-[20px] p-4 shadow-xl ${palette.surface} ${palette.shadow}`}>
                            <View className="mb-2 self-start rounded-full bg-sky-600 px-2.5 py-1">
                                <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">KONNECTX</Text>
                            </View>
                            <Text className={`text-[22px] font-bold leading-[28px] ${palette.text}`}>WhatsApp Cloud API</Text>
                            <Text className={`mt-1.5 text-[13px] leading-5 ${palette.textSoft}`}>
                                Manage your messaging operations, campaigns, and contacts.
                            </Text>
                            {credentials.length > 1 ? (
                                <TouchableOpacity
                                    onPress={() => setShowAcctSwitcher(true)}
                                    className={`mt-3 flex-row items-center gap-2 self-start rounded-full border px-3 py-1.5 ${palette.border}`}>
                                    <Ionicons name="swap-horizontal" size={14} color={palette.textColor} />
                                    <Text className={`text-[12px] font-semibold ${palette.text}`}>
                                        {selectedCredential?.profile || 'Select Account'}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {loading ? (
                            <SkeletonStatRow />
                        ) : (
                            <View className="mb-3 flex-row flex-wrap gap-2">
                                {statCards.map((s) => (
                                    <View key={s.label} className="w-[48%]">
                                        <KonnectxStatCard label={s.label} value={s.value} tone={s.tone} />
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity onPress={() => router.push('/(modules)/konnectx/(tabs)/campaigns')}
                            className="mb-3 flex-row items-center justify-center gap-2 rounded-[16px] bg-sky-600 py-3 shadow-lg">
                            <Ionicons name="add-circle" size={18} color="#fff" />
                            <Text className="text-[13px] font-bold text-white">New Campaign</Text>
                        </TouchableOpacity>

                        <View className="mb-3 flex-row flex-wrap gap-2">
                            {quickNavItems.map((item) => (
                                <TouchableOpacity key={item.label} onPress={() => router.push(item.route)}
                                    className={`w-[30%] flex-grow flex-col items-center gap-1.5 rounded-[14px] border px-2 py-3 ${palette.surface} ${palette.border}`}>
                                    <View className="rounded-lg bg-sky-600/10 p-2">
                                        <Ionicons name={item.icon} size={18} color="#0284c7" />
                                    </View>
                                    <Text className={`text-[11px] font-bold leading-[13px] text-center ${palette.text}`}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="mb-2 flex-row items-center justify-between">
                            <Text className={`text-[16px] font-bold ${palette.text}`}>Campaigns</Text>
                            {campaigns.length > 0 ? (
                                <Text className={`text-[11px] ${palette.textSoft}`}>{campaigns.length} total</Text>
                            ) : null}
                        </View>

                        {loading ? (
                            <View className="gap-2">
                                <SkeletonCard /><SkeletonCard />
                            </View>
                        ) : campaigns.length > 0 ? (
                            <View className="gap-2">
                                {campaigns.map((camp, idx) => {
                                    const campId = camp.id || camp._id || idx;
                                    const badge = STATUS_BADGES[camp.status] || STATUS_BADGES.DRAFT;
                                    const total = camp.total || camp._count?.recipients || 0;
                                    const sent = camp.sent || 0;
                                    const progress = total > 0 ? (sent / total) * 100 : 0;

                                    return (
                                        <View key={campId} className={`rounded-[16px] border p-3 flex-row items-center ${palette.surface} ${palette.border}`}>
                                            <View className="flex-1">
                                                <Text className={`text-[14px] font-bold ${palette.text}`}>{camp.name}</Text>
                                                <View className="mt-1.5 flex-row items-center gap-2">
                                                    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
                                                        <Text style={{ color: badge.color, fontSize: 9, fontWeight: '800' }}>{badge.label}</Text>
                                                    </View>
                                                    {(camp.status === 'DRAFT' || camp.status === 'PAUSED') ? (
                                                        <TouchableOpacity
                                                            onPress={() => handleStartCampaign(camp)}
                                                            className="rounded-xl border px-3 py-1.5"
                                                            style={{ borderColor: palette.colors.border }}>
                                                            <Text className="text-[10px] font-bold text-green-600">Start</Text>
                                                        </TouchableOpacity>
                                                    ) : null}
                                                </View>
                                                {total > 0 ? (
                                                    <View className="mt-2">
                                                        <View className={`mb-0.5 h-1.5 rounded-full ${palette.surfaceAlt}`}>
                                                            <View className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                                                        </View>
                                                        <Text className={`text-[10px] ${palette.textSoft}`}>{sent} / {total} sent</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => setDeleteTargetId(campId)}
                                                className="ml-2 items-center rounded-xl border border-red-500/20 px-3 py-2"
                                                style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
                                                <Ionicons name="trash-outline" size={16} color="#dc2626" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <KonnectxCard title="No campaigns yet" description="Create your first campaign to start broadcasting messages." />
                        )}

                        <Text className={`mb-2 mt-5 text-[16px] font-bold ${palette.text}`}>Recent Activity</Text>
                        {activities.length > 0 ? (
                            <View className="gap-1.5">
                                {activities.slice(0, 5).map((act, i) => {
                                    const icon = act.type === 'success' ? 'checkmark-circle' : act.type === 'alert' ? 'alert-circle' : 'chatbubble-ellipses';
                                    const iconColor = act.type === 'success' ? '#16a34a' : act.type === 'alert' ? '#dc2626' : palette.textMutedColor;
                                    return (
                                        <View key={act.id || i} className={`flex-row items-center gap-2.5 rounded-[14px] border p-2.5 ${palette.surface} ${palette.border}`}>
                                            <Ionicons name={icon} size={18} color={iconColor} />
                                            <View className="flex-1">
                                                <Text className={`text-[12px] font-semibold ${palette.text}`}>{act.title || act.description}</Text>
                                                {act.time ? <Text className={`mt-0.5 text-[10px] ${palette.textMuted}`}>{new Date(act.time).toLocaleString()}</Text> : null}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : loading ? null : (
                            <Text className={`text-[12px] ${palette.textSoft}`}>No recent activity</Text>
                        )}
                    </View>
                </ScrollView>
            </View>

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

            <Modal visible={showAcctSwitcher} transparent animationType="fade" onRequestClose={() => setShowAcctSwitcher(false)}>
                <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setShowAcctSwitcher(false)}>
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className={`w-full rounded-t-[28px] px-5 pt-5 pb-16 shadow-2xl ${palette.surface}`}
                        style={{ backgroundColor: palette.colors.surface }}
                    >
                        <View className="mb-4 items-center">
                            <View className={`mb-3 h-1.5 w-12 rounded-full ${palette.surfaceAlt}`} />
                            <Text className={`text-[18px] font-bold ${palette.text}`}>Switch Account</Text>
                            <Text className={`mt-0.5 text-[12px] ${palette.textSoft}`}>Select an active WhatsApp Cloud account</Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: 340 }}>
                            <View className="gap-2.5 pb-8">
                                {credentials.length > 0 ? credentials.map((cred) => {
                                    const isSelected = String(selectedCredential?.id || selectedCredential?._id || '') === String(cred.id || cred._id || '');
                                    return (
                                        <TouchableOpacity
                                            key={cred.id || cred._id || cred.phoneNumberId}
                                            activeOpacity={0.7}
                                            onPress={async () => {
                                                showLoader(`Switching to ${cred.profile || 'WhatsApp Account'}...`);
                                                setSelectedCredential(cred);
                                                setShowAcctSwitcher(false);
                                                setLoading(true);
                                                await fetchData(cred);
                                            }}
                                            className="flex-row items-center gap-3 rounded-[16px] border p-4"
                                            style={{
                                                backgroundColor: isSelected ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                                                borderColor: isSelected ? '#0284c7' : palette.colors.border
                                            }}>
                                            <Ionicons
                                                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                                size={20}
                                                color={isSelected ? '#0284c7' : palette.textMutedColor}
                                            />
                                            <View className="flex-1">
                                                <Text className={`text-[15px] font-semibold ${palette.text}`}>
                                                    {cred.profile || 'WhatsApp Account'}
                                                </Text>
                                                {cred.phoneNumberId ? (
                                                    <Text className={`mt-0.5 text-[11px] font-mono ${palette.textMuted}`}>
                                                        Phone ID: {cred.phoneNumberId}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            {isSelected ? (
                                                <View className="rounded-full bg-sky-600 px-2.5 py-0.5">
                                                    <Text className="text-[10px] font-bold uppercase text-white">Active</Text>
                                                </View>
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                }) : (
                                    <Text className={`py-6 text-center text-[13px] ${palette.textSoft}`}>No accounts available</Text>
                                )}
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={showCreateDialog} transparent animationType="fade" onRequestClose={() => setShowCreateDialog(false)}>
                <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={() => setShowCreateDialog(false)}>
                    <Pressable className={`rounded-[24px] p-5 ${palette.surface}`}>
                        <Text className={`mb-1 text-[18px] font-bold ${palette.text}`}>New Campaign</Text>
                        <Text className={`mb-3 text-[12px] ${palette.textSoft}`}>Give your campaign a name to get started.</Text>
                        <TextInput
                            className={`mb-3 rounded-xl border px-3 py-2.5 text-[14px] ${palette.page} ${palette.border}`}
                            style={{ color: palette.textColor }}
                            placeholder="Campaign name" placeholderTextColor={palette.textMutedColor}
                            value={newCampaignName} onChangeText={setNewCampaignName} autoFocus />
                        <View className="flex-row gap-2.5">
                            <TouchableOpacity onPress={() => setShowCreateDialog(false)}
                                className={`flex-1 items-center rounded-xl border py-3 ${palette.border}`}>
                                <Text className={`text-[14px] font-bold ${palette.text}`}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateCampaign}
                                className="flex-1 items-center rounded-xl bg-sky-600 py-3">
                                <Text className="text-[14px] font-bold text-white">Create</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
