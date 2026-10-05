import { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import KonnectxBadge, { statusTone } from '~/components/konnectx/KonnectxBadge';
import { KonnectxField } from '~/components/konnectx/KonnectxField';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import KonnectxScreen from '~/components/konnectx/KonnectxScreen';
import { useAppTheme } from '~/theme/AppTheme';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as reportsService from '~/services/konnectx/reports';

const TABS = [
    { key: 'messages', label: 'Messages' },
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'templates', label: 'Templates' },
    { key: 'contacts', label: 'Contacts' }
];

const RANGES = [
    { label: '7d', value: '7' },
    { label: '30d', value: '30' },
    { label: '90d', value: '90' },
    { label: 'All', value: 'ALL' }
];

const MESSAGE_STATUSES = [
    { label: 'All', value: 'ALL' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Inbound', value: 'INBOUND' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Read', value: 'READ' },
    { label: 'Failed', value: 'FAILED' }
];

const PAGE_SIZE = 25;

export default function ReportsScreen() {
    const { palette } = useAppTheme();
    const { userId } = useKonnectx();

    const [reportType, setReportType] = useState('messages');
    const [range, setRange] = useState('30');
    const [status, setStatus] = useState('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await reportsService.getReports(userId, {
                reportType,
                range,
                status: reportType === 'messages' ? status : 'ALL',
                search: search.trim() || undefined,
                page,
                pageSize: PAGE_SIZE
            });
            setResult(data);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Could not load report',
                text2: error?.response?.data?.error || error.message
            });
        } finally {
            setLoading(false);
        }
    }, [userId, reportType, range, status, search, page]);

    useEffect(() => {
        load();
    }, [load]);

    // Filter changes always restart from the first page.
    useEffect(() => {
        setPage(1);
    }, [reportType, range, status, search]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const rows = result?.rows ?? [];
    const pagination = result?.pagination;

    const renderRow = (row, index) => {
        if (reportType === 'messages') {
            return (
                <View key={row.id || index} className={`rounded-[14px] border p-2.5 ${palette.surface} ${palette.border}`}>
                    <View className="flex-row items-center justify-between">
                        <Text className={`flex-1 text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                            {row.contactName || row.recipientPhone || 'Unknown'}
                        </Text>
                        <KonnectxBadge label={row.direction} tone={row.direction === 'OUTBOUND' ? 'info' : 'violet'} />
                    </View>
                    <Text className={`mt-1 text-[11px] ${palette.textSoft}`} numberOfLines={2}>
                        {row.templateName ? `[${row.templateName}] ` : ''}
                        {row.text || '—'}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-2">
                        <KonnectxBadge label={row.status} tone={statusTone(row.status)} />
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                            {new Date(row.createdAt).toLocaleString()}
                        </Text>
                    </View>
                </View>
            );
        }

        if (reportType === 'campaigns') {
            return (
                <View key={row.id} className={`rounded-[14px] border p-2.5 ${palette.surface} ${palette.border}`}>
                    <View className="flex-row items-center justify-between">
                        <Text className={`flex-1 text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                            {row.name}
                        </Text>
                        <KonnectxBadge label={row.status} tone={statusTone(row.status)} />
                    </View>
                    <Text className={`mt-1 text-[11px] ${palette.textSoft}`}>{row.templateName}</Text>
                    <View className="mt-1.5 flex-row gap-1.5">
                        <KonnectxBadge label={`${row.sentCount}/${row.totalRecipients} sent`} tone="info" />
                        {row.failedCount > 0 ? (
                            <KonnectxBadge label={`${row.failedCount} failed`} tone="danger" />
                        ) : null}
                        <KonnectxBadge label={row.successRate} tone="success" />
                    </View>
                </View>
            );
        }

        if (reportType === 'templates') {
            return (
                <View key={row.id} className={`rounded-[14px] border p-2.5 ${palette.surface} ${palette.border}`}>
                    <View className="flex-row items-center justify-between">
                        <Text className={`flex-1 text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                            {row.name}
                        </Text>
                        <KonnectxBadge label={row.status} tone={statusTone(row.status)} />
                    </View>
                    <Text className={`mt-1 text-[11px] ${palette.textSoft}`}>
                        {row.category} · {row.language}
                    </Text>
                    <View className="mt-1.5 flex-row gap-1.5">
                        <KonnectxBadge label={`${row.sentCount} sent`} tone="info" />
                        <KonnectxBadge label={`${row.readCount} read`} tone="success" />
                        <KonnectxBadge label={row.deliveryRate} tone={row.failedCount ? 'warning' : 'neutral'} />
                    </View>
                </View>
            );
        }

        return (
            <View key={row.id} className={`rounded-[14px] border p-2.5 ${palette.surface} ${palette.border}`}>
                <View className="flex-row items-center justify-between">
                    <Text className={`flex-1 text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                        {row.name}
                    </Text>
                    <Text className={`text-[11px] ${palette.textSoft}`}>{row.phone}</Text>
                </View>
                <View className="mt-1.5 flex-row gap-1.5">
                    <KonnectxBadge label={`${row.totalInteractions} messages`} tone="info" />
                    <KonnectxBadge label={`${row.inboundReplies} replies`} tone="violet" />
                </View>
                {row.lastInteraction ? (
                    <Text className={`mt-1 text-[10px] ${palette.textMuted}`}>
                        Last active {new Date(row.lastInteraction).toLocaleString()}
                    </Text>
                ) : null}
            </View>
        );
    };

    return (
        <KonnectxScreen
            title="Reports"
            subtitle={pagination ? `${pagination.totalCount} records` : 'Delivery and engagement'}
            onRefresh={onRefresh}
            refreshing={refreshing}>
            <View className="mt-3 flex-row gap-1.5">
                {TABS.map((tab) => {
                    const active = tab.key === reportType;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setReportType(tab.key)}
                            className={`flex-1 items-center rounded-[12px] border py-1.5`}
                            style={{
                                backgroundColor: active ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                                borderColor: active ? '#0284c7' : palette.colors.border
                            }}>
                            <Text
                                className="text-[10px] font-bold"
                                style={{ color: active ? '#0284c7' : palette.textColor }}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View className="mt-2 flex-row gap-1.5">
                {RANGES.map((option) => {
                    const active = option.value === range;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setRange(option.value)}
                            className="flex-1 items-center rounded-full border py-1"
                            style={{
                                backgroundColor: active ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                                borderColor: active ? '#0284c7' : palette.colors.border
                            }}>
                            <Text
                                className="text-[10px] font-bold"
                                style={{ color: active ? '#0284c7' : palette.textColor }}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <KonnectxField
                className="mt-2"
                icon="search"
                placeholder="Search"
                value={search}
                onChangeText={setSearch}
            />

            {reportType === 'messages' ? (
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                    {MESSAGE_STATUSES.map((option) => {
                        const active = option.value === status;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setStatus(option.value)}
                                className="rounded-full border px-2.5 py-1"
                                style={{
                                    backgroundColor: active ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                                    borderColor: active ? '#0284c7' : palette.colors.border
                                }}>
                                <Text
                                    className="text-[10px] font-bold"
                                    style={{ color: active ? '#0284c7' : palette.textColor }}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : null}

            <View className="mt-3 gap-1.5">
                {loading ? (
                    <Text className={`py-6 text-center text-[12px] ${palette.textSoft}`}>Loading…</Text>
                ) : rows.length === 0 ? (
                    <KonnectxEmptyState
                        icon="bar-chart-outline"
                        title="Nothing to report"
                        description="No records match these filters."
                    />
                ) : (
                    rows.map(renderRow)
                )}
            </View>

            {pagination && pagination.totalPages > 1 ? (
                <View className="mt-3 flex-row items-center justify-between">
                    <TouchableOpacity
                        disabled={page <= 1}
                        onPress={() => setPage((p) => Math.max(1, p - 1))}
                        className="rounded-[12px] border px-3 py-1.5"
                        style={{ opacity: page <= 1 ? 0.4 : 1, borderColor: palette.colors.border }}>
                        <Text className={`text-[11px] font-bold ${palette.text}`}>Previous</Text>
                    </TouchableOpacity>
                    <Text className={`text-[11px] ${palette.textSoft}`}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </Text>
                    <TouchableOpacity
                        disabled={page >= pagination.totalPages}
                        onPress={() => setPage((p) => p + 1)}
                        className="rounded-[12px] border px-3 py-1.5"
                        style={{
                            opacity: page >= pagination.totalPages ? 0.4 : 1,
                            borderColor: palette.colors.border
                        }}>
                        <Text className={`text-[11px] font-bold ${palette.text}`}>Next</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </KonnectxScreen>
    );
}