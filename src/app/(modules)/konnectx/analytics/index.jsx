import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

import { useKonnectx } from '~/providers/KonnectxProvider';
import { SkeletonCard, SkeletonStatRow } from '~/components/konnectx/KonnectxLoadingSkeleton';
import KonnectxStatCard from '~/components/konnectx/KonnectxStatCard';
import * as analyticsService from '~/services/konnectx/analytics';

export default function AnalyticsScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId, selectedCredential } = useKonnectx();

  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const credParams = {
        credentialId: selectedCredential?.id || selectedCredential?._id,
        wabaId: selectedCredential?.wabaId,
        phoneNumberId: selectedCredential?.phoneNumberId
      };
      const [a, s] = await Promise.all([
        analyticsService.getAnalytics(userId, days, credParams).catch(() => null),
        analyticsService.getStats(userId, credParams).catch(() => null)
      ]);
      setAnalytics(a);
      setStats(s?.stats ?? s);
    } catch {} finally {
      setLoading(false);
    }
  }, [userId, days, selectedCredential]);

  useEffect(() => { fetchData(); }, [fetchData, selectedCredential]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const summary = analytics?.summary || {};
  const messagesByDay = analytics?.messagesByDay || [];
  const statsData = stats;

  const periodOptions = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 }
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>
        <View className="px-5 pb-32 pt-5">
          <View className="mb-4 flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={palette.textColor} />
            </TouchableOpacity>
            <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Analytics</Text>
          </View>

          {/* Period selector */}
          <View className="mb-6 flex-row gap-2">
            {periodOptions.map((p) => (
              <TouchableOpacity key={p.value} onPress={() => setDays(p.value)}
                className={`rounded-full px-5 py-2.5 ${days === p.value ? 'bg-sky-600' : 'border'}`}
                style={days !== p.value ? { borderColor: palette.colors.border } : {}}>
                <Text className={`text-[13px] font-bold ${days === p.value ? 'text-white' : palette.text}`}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <SkeletonStatRow />
          ) : (
            <View className="mb-4 flex-row flex-wrap gap-2.5">
              <View className="w-[48%]">
                <KonnectxStatCard label="Total Messages" value={(summary.totalMessages ?? statsData?.messages?.sent ?? 0).toString()} tone="bg-sky-500/15" />
              </View>
              <View className="w-[48%]">
                <KonnectxStatCard label="Sent" value={(summary.sentMessages ?? statsData?.messages?.sent ?? 0).toString()} tone="bg-emerald-500/15" />
              </View>
              <View className="w-[48%]">
                <KonnectxStatCard label="Delivered" value={(statsData?.messages?.delivered ?? 0).toString()} tone="bg-violet-500/15" />
              </View>
              <View className="w-[48%]">
                <KonnectxStatCard label="Failed" value={(summary.failedMessages ?? statsData?.messages?.failed ?? 0).toString()} tone="bg-red-500/15" />
              </View>
            </View>
          )}

          {/* Success Rate */}
          {statsData?.messages?.successRate ? (
            <View className="mb-6 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <Text className={`text-[18px] font-bold ${palette.text}`}>Delivery Success</Text>
              <View className="mt-3 flex-row items-center gap-4">
                <Text className="text-[48px] font-bold text-green-500">{statsData.messages.successRate}%</Text>
                <View className="flex-1">
                  <Text className={`text-[13px] ${palette.textSoft}`}>Read Rate: {statsData.messages.readRate || '0'}%</Text>
                  <View className="mt-2 h-3 rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                    <View className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(Number(statsData.messages.successRate), 100)}%` }} />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Messages by Day Chart (simplified bar chart) */}
          {messagesByDay.length > 0 ? (
            <View className="mb-6 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <Text className={`mb-3 text-[18px] font-bold ${palette.text}`}>Messages Over Time</Text>
              {messagesByDay.slice(-14).map((day, i) => {
                const max = Math.max(...messagesByDay.map((d) => d.count), 1);
                const height = (day.count / max) * 100;
                return (
                  <View key={i} className="mb-1 flex-row items-center gap-3">
                    <Text className={`w-24 text-[10px] font-mono ${palette.textMuted}`}>{day.date?.slice(5) || day.date}</Text>
                    <View className="flex-1 h-5 rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                      <View className="h-full rounded-full bg-sky-500" style={{ width: `${height}%` }} />
                    </View>
                    <Text className={`w-10 text-right text-[11px] font-semibold ${palette.text}`}>{day.count}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* Campaign stats */}
          {statsData?.campaigns ? (
            <View className="mb-6 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <Text className={`text-[18px] font-bold ${palette.text}`}>Campaigns</Text>
              <View className="mt-3 flex-row gap-6">
                <View>
                  <Text className={`text-[11px] font-semibold ${palette.textMuted}`}>Total</Text>
                  <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>{statsData.campaigns.total || 0}</Text>
                </View>
                <View>
                  <Text className={`text-[11px] font-semibold ${palette.textMuted}`}>Active</Text>
                  <Text className="text-[28px] font-bold text-green-500">{statsData.campaigns.active || 0}</Text>
                </View>
                <View>
                  <Text className={`text-[11px] font-semibold ${palette.textMuted}`}>Completed</Text>
                  <Text className="text-[28px] font-bold text-sky-500">{analytics?.campaignsCompleted || 0}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Template stats */}
          {statsData?.templates ? (
            <View className="mb-6 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
              <Text className={`text-[18px] font-bold ${palette.text}`}>Templates</Text>
              <View className="mt-3 flex-row gap-6">
                <View>
                  <Text className={`text-[11px] font-semibold ${palette.textMuted}`}>Approved</Text>
                  <Text className="text-[28px] font-bold text-green-500">{statsData.templates.approved || 0}</Text>
                </View>
                <View>
                  <Text className={`text-[11px] font-semibold ${palette.textMuted}`}>Pending</Text>
                  <Text className="text-[28px] font-bold text-amber-500">{statsData.templates.pending || 0}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
