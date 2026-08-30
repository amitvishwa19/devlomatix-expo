import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useKonnectx } from '~/providers/KonnectxProvider';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard, SkeletonStatRow } from '~/components/konnectx/KonnectxLoadingSkeleton';
import KonnectxStatCard from '~/components/konnectx/KonnectxStatCard';
import * as analyticsService from '~/services/konnectx/analytics';
import { useAppTheme } from '~/theme/AppTheme';

const PERIOD_OPTIONS = [
  { label: '7d', value: 7, caption: 'week' },
  { label: '30d', value: 30, caption: 'month' },
  { label: '90d', value: 90, caption: 'quarter' },
];

const pct = (part, whole) => {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
};

const num = (v) => Number(v || 0);

function FunnelRow({ label, count, denominator, color, icon }) {
  const { palette } = useAppTheme();
  const rate = pct(count, denominator);
  return (
    <View className="mb-2.5 flex-row items-center gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1a` }}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View className="flex-1">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className={`text-[12px] font-semibold ${palette.text}`}>{label}</Text>
          <Text className="text-[12px] font-mono" style={{ color: color }}>
            {num(count).toLocaleString()} · {rate}%
          </Text>
        </View>
        <View className="h-2 rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }}>
          <View className="h-full rounded-full" style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }} />
        </View>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId, selectedCredential } = useKonnectx();

  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(30);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const credParams = {
        credentialId: selectedCredential?.id || selectedCredential?._id,
        wabaId: selectedCredential?.wabaId,
        phoneNumberId: selectedCredential?.phoneNumberId,
      };
      const [a, s] = await Promise.all([
        analyticsService.getAnalytics(userId, days, credParams).catch(() => null),
        analyticsService.getStats(userId, credParams).catch(() => null),
      ]);
      setAnalytics(a);
      setStats(s?.stats ?? s);
      setLoadedOnce(true);
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
  const s = stats || {};
  const msgs = s.messages || {};
  const camps = s.campaigns || {};
  const tmpls = s.templates || {};
  const contacts = s.contacts || {};

  const period = PERIOD_OPTIONS.find((p) => p.value === days) || PERIOD_OPTIONS[1];
  const sent = num(summary.sentMessages ?? msgs.sent ?? summary.totalMessages);
  const delivered = num(msgs.delivered);
  const read = num(msgs.read);
  const readPct = num(msgs.readRate ?? pct(read, sent));
  const failed = num(summary.failedMessages ?? msgs.failed);
  const successRate = num(msgs.successRate ?? pct(delivered, sent));

  const hasData = loadedOnce && (sent > 0 || delivered > 0 || failed > 0 || messagesByDay.length > 0);

  const periodLabel = `Last ${days} days`;

  const insight = sent > 0
    ? `Across the last ${days} days you sent ${sent.toLocaleString()} message${sent === 1 ? '' : 's'}: ${pct(delivered, sent)}% delivered, ${readPct}% read, ${failed.toLocaleString()} failed. Deliverability sits at ${successRate}% success.`
    : 'Send your first campaign to start seeing delivery and engagement trends here.';

  const peak = messagesByDay.length ? Math.max(...messagesByDay.map((d) => num(d.count))) : 0;
  const avg = messagesByDay.length
    ? Math.round(messagesByDay.reduce((acc, d) => acc + num(d.count), 0) / messagesByDay.length)
    : 0;

  const fmtDay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = dateStr.length <= 10 ? new Date(`${dateStr}T00:00:00`) : new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>
        <View className="px-4 pb-32 pt-5">

          {/* Header */}
          <View className="mb-5 flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full border"
              style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surface }}>
              <Ionicons name="arrow-back" size={20} color={palette.textColor} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-[22px] font-bold" style={{ color: palette.textColor }}>Analytics</Text>
              <Text className={`text-[12px] ${palette.textMuted}`}>
                Delivery & engagement across your WhatsApp account
              </Text>
            </View>
            <View className="rounded-full bg-sky-600 px-3 py-1.5">
              <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">{periodLabel}</Text>
            </View>
          </View>

          {/* Period selector */}
          <View className="mb-2 flex-row items-center gap-2">
            {PERIOD_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setDays(p.value)}
                className={`flex-1 items-center rounded-2xl border px-4 py-2.5 ${days === p.value ? 'bg-sky-600' : ''}`}
                style={days !== p.value ? { borderColor: palette.colors.border, backgroundColor: palette.colors.surface } : {}}>
                <Text className={`text-[14px] font-bold ${days === p.value ? 'text-white' : palette.text}`}>{p.label}</Text>
                <Text className={`text-[10px] ${days === p.value ? 'text-white/80' : palette.textMuted}`} style={{ fontStyle: 'italic' }}>
                  last {p.caption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className={`mb-5 ml-1 text-[11px] ${palette.textMuted}`}>{periodLabel} · {selectedCredential?.name || 'default account'}</Text>

          {loading && !loadedOnce ? (
            <>
              <SkeletonStatRow />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : !hasData ? (
            <View className="rounded-[24px] border" style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surface }}>
              <KonnectxEmptyState
                icon="stats-chart-outline"
                title="No analytics yet"
                description="Message traffic for this period will appear here as you send campaigns to your contacts." />
            </View>
          ) : (
            <>
              {/* Insight callout */}
              <View className="mb-4 flex-row items-center gap-3 rounded-[20px] border p-4"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-sky-500/15">
                  <Ionicons name="sparkles" size={18} color="#0284c7" />
                </View>
                <Text className={`flex-1 text-[13px] leading-5 ${palette.textSoft}`}>{insight}</Text>
              </View>

              {/* Summary stats */}
              <View className="mb-5 flex-row flex-wrap gap-2.5">
                <View className="w-[48%]">
                  <KonnectxStatCard label="Messages sent" value={sent.toLocaleString()} tone="bg-sky-500/15"
                    icon="paper-plane" iconColor="#0284c7" hint={periodLabel} />
                </View>
                <View className="w-[48%]">
                  <KonnectxStatCard label="Delivered" value={delivered.toLocaleString()} tone="bg-violet-500/15"
                    icon="checkmark-circle" iconColor="#8b5cf6" hint={`${pct(delivered, sent)}% of sent`} />
                </View>
                <View className="w-[48%]">
                  <KonnectxStatCard label="Read" value={(num(msgs.read ?? Math.round((readPct / 100) * delivered))).toLocaleString()} tone="bg-emerald-500/15"
                    icon="eye" iconColor="#059669" hint={`${readPct}% read rate`} />
                </View>
                <View className="w-[48%]">
                  <KonnectxStatCard label="Failed" value={failed.toLocaleString()} tone="bg-red-500/15"
                    icon="alert-circle" iconColor="#dc2626" hint="check provider logs" />
                </View>
              </View>

              {/* Delivery funnel */}
              {sent > 0 ? (
                <View className="mb-5 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`text-[17px] font-bold ${palette.text}`}>Delivery funnel</Text>
                      <Text className={`mt-0.5 text-[12px] ${palette.textMuted}`}>How messages moved through the pipeline</Text>
                    </View>
                    <View className="rounded-full bg-green-500/10 px-3 py-1">
                      <Text className="text-[12px] font-bold text-green-600">{successRate}% success</Text>
                    </View>
                  </View>
                  <FunnelRow label="Sent" count={sent} denominator={sent} color="#0284c7" icon="paper-plane" />
                  <FunnelRow label="Delivered" count={delivered} denominator={sent} color="#8b5cf6" icon="checkmark-circle" />
                  <FunnelRow label="Read" count={read || Math.round((readPct / 100) * delivered)} denominator={sent} color="#059669" icon="eye" />
                  <FunnelRow label="Failed" count={failed} denominator={sent} color="#dc2626" icon="close-circle" />
                </View>
              ) : null}

              {/* Messages over time */}
              {messagesByDay.length > 0 ? (
                <View className="mb-5 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`text-[17px] font-bold ${palette.text}`}>Messages over time</Text>
                      <Text className={`mt-0.5 text-[12px] ${palette.textMuted}`}>Daily send volume for the selected period</Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-[12px] font-bold ${palette.text}`}>{avg.toLocaleString()} / day</Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>peak {peak.toLocaleString()}</Text>
                    </View>
                  </View>
                  {messagesByDay.slice(-14).map((day, i) => {
                    const height = (num(day.count) / Math.max(peak, 1)) * 100;
                    return (
                      <View key={i} className="mb-1.5 flex-row items-center gap-3">
                        <Text className={`w-16 text-[11px] font-medium ${palette.textMuted}`}>{fmtDay(day.date)}</Text>
                        <View className="h-[18px] flex-1 rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                          <View className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(height, 2)}%` }} />
                        </View>
                        <Text className={`w-12 text-right text-[12px] font-semibold ${palette.text}`}>{num(day.count).toLocaleString()}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* Campaigns */}
              {camps.total > 0 ? (
                <View className="mb-5 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                  <Text className={`text-[17px] font-bold ${palette.text}`}>Campaigns</Text>
                  <Text className={`mt-0.5 mb-4 text-[12px] ${palette.textMuted}`}>Blast performance for this account</Text>
                  <View className="flex-row gap-2.5">
                    <View className="flex-1 rounded-[18px] p-4 bg-sky-500/10">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-sky-600">Total</Text>
                      <Text className={`mt-1 text-[26px] font-bold ${palette.text}`}>{num(camps.total).toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 rounded-[18px] p-4 bg-emerald-500/10">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Active</Text>
                      <Text className={`mt-1 text-[26px] font-bold ${palette.text}`}>{num(camps.active).toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 rounded-[18px] p-4 bg-violet-500/10">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">Completed</Text>
                      <Text className={`mt-1 text-[26px] font-bold ${palette.text}`}>{num(analytics?.campaignsCompleted ?? camps.completed ?? 0).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Templates */}
              {(num(tmpls.approved) > 0 || num(tmpls.pending) > 0) ? (
                <View className="mb-5 rounded-[24px] border p-5" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                  <Text className={`text-[17px] font-bold ${palette.text}`}>Templates</Text>
                  <Text className={`mt-0.5 mb-4 text-[12px] ${palette.textMuted}`}>Approved message templates for sending</Text>
                  <View className="flex-row gap-2.5">
                    <View className="flex-1 rounded-[18px] p-4 bg-emerald-500/10">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Approved</Text>
                      <Text className={`mt-1 text-[26px] font-bold ${palette.text}`}>{num(tmpls.approved).toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 rounded-[18px] p-4 bg-amber-500/10">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Pending</Text>
                      <Text className={`mt-1 text-[26px] font-bold ${palette.text}`}>{num(tmpls.pending).toLocaleString()}</Text>
                    </View>
                    <View className="flex-1 rounded-[18px] p-4 bg-sky-500/10">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-sky-600">Approval rate</Text>
                      <Text className={`mt-1 text-[26px] font-bold ${palette.text}`}>
                        {num(tmpls.approved) + num(tmpls.pending) > 0
                          ? `${Math.round((num(tmpls.approved) / (num(tmpls.approved) + num(tmpls.pending))) * 100)}%`
                          : '--'}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}