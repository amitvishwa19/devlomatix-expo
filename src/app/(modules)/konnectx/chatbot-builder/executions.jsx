import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import KonnectxBadge, { statusTone } from '~/components/konnectx/KonnectxBadge';
import { KonnectxChips } from '~/components/konnectx/KonnectxField';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as chatbotsService from '~/services/konnectx/chatbots';
import { useAppTheme } from '~/theme/AppTheme';

const STATUS_OPTIONS = [
    { label: 'All', value: 'ALL' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Processing', value: 'PROCESSING' }
];

const PAGE_SIZE = 25;

/** Execution history for one bot, with status filter and message drill-down. */
export default function ChatbotExecutionsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [executions, setExecutions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detail, setDetail] = useState(null);

    const load = useCallback(
        async (targetPage = 1) => {
            if (!userId || !id) return;
            try {
                if (targetPage === 1) setLoading(true);
                const response = await chatbotsService.getBotExecutions(userId, id, {
                    status,
                    page: targetPage,
                    limit: PAGE_SIZE
                });
                const rows = response?.data || [];
                setTotal(response?.total ?? rows.length);
                setExecutions(targetPage === 1 ? rows : [...executions, ...rows]);
                setPage(targetPage);
            } catch (err) {
                Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.error || err.message });
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [executions, id, status, userId]
    );

    useEffect(() => { load(1); }, [status, userId, id]); // eslint-disable-line react-hooks/exhaustive-deps

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load(1);
    }, [load]);

    return (
        <KonnectxScreen
            title="Execution Logs"
            subtitle={`${total} run${total === 1 ? '' : 's'}`}
            backTo="/(modules)/konnectx/(tabs)"
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/(modules)/konnectx/(tabs)'))}
            scroll={false}>
            <View className="mb-2">
                <KonnectxChips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </View>

            {loading ? (
                <View className="gap-2">
                    <SkeletonCard />
                    <SkeletonCard />
                </View>
            ) : executions.length === 0 ? (
                <KonnectxEmptyState
                    icon="pulse-outline"
                    title="No runs yet"
                    description="Once the bot starts processing chats, runs will appear here."
                />
            ) : (
                <FlatList
                    className="flex-1"
                    data={executions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 32 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textMutedColor} />}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => {
                        if (executions.length < total) load(page + 1);
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setDetail(item)}
                            className="mb-2 rounded-[16px] border p-3"
                            style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                            <View className="flex-row items-center justify-between gap-2">
                                <Text className={`flex-1 text-[12px] font-bold ${palette.text}`} numberOfLines={1}>
                                    {item.phone || 'Unknown number'}
                                </Text>
                                <KonnectxBadge label={item.status} tone={statusTone(item.status)} />
                            </View>

                            {item.message ? (
                                <Text className={`mt-1 text-[11px] ${palette.textSoft}`} numberOfLines={2}>
                                    {item.message}
                                </Text>
                            ) : null}

                            <View className="mt-1.5 flex-row items-center gap-2">
                                <Ionicons name="time-outline" size={11} color={palette.textMutedColor} />
                                <Text className={`text-[10px] ${palette.textMuted}`}>
                                    {item.triggeredAt ? new Date(item.triggeredAt).toLocaleString() : '—'}
                                </Text>
                                {item.currentStep !== undefined && item.currentStep !== null ? (
                                    <Text className={`text-[10px] ${palette.textMuted}`}>· step {item.currentStep}</Text>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
                <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
                    <View className="flex-row items-center gap-2 border-b px-3 py-2" style={{ borderColor: palette.colors.border }}>
                        <TouchableOpacity onPress={() => setDetail(null)} hitSlop={10}>
                            <Ionicons name="close" size={20} color={palette.textMutedColor} />
                        </TouchableOpacity>
                        <Text className={`flex-1 text-[15px] font-bold ${palette.text}`}>Run detail</Text>
                        {detail ? <KonnectxBadge label={detail.status} tone={statusTone(detail.status)} /> : null}
                    </View>

                    <FlatList
                        data={detail ? Object.entries(detail).filter(([, value]) => value !== null && value !== undefined) : []}
                        keyExtractor={([key]) => key}
                        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                        ListHeaderComponent={
                            detail?.phone ? (
                                <Text className={`mb-3 text-[13px] font-bold ${palette.text}`}>{detail.phone}</Text>
                            ) : null
                        }
                        renderItem={({ item: [key, value] }) => (
                            <View key={key} className="mb-2 rounded-[14px] border p-2.5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                                <Text className={`mb-1 text-[10px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </Text>
                                <Text className={`text-[12px] ${palette.text}`} selectable>
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </Modal>
        </KonnectxScreen>
    );
}