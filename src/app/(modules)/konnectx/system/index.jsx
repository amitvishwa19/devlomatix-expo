import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';
import KonnectxEmptyState from '~/components/konnectx/KonnectxEmptyState';
import { SkeletonCard } from '~/components/konnectx/KonnectxLoadingSkeleton';
import { useKonnectx } from '~/providers/KonnectxProvider';
import * as analyticsService from '~/services/konnectx/analytics';
import * as credentialsService from '~/services/konnectx/credentials';
import * as settingsService from '~/services/konnectx/settings';

const ACT_TYPE_STYLES = {
  message: { icon: 'chatbubble-ellipses', color: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
  alert: { icon: 'alert-circle', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  success: { icon: 'checkmark-circle', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  webhook: { icon: 'sync-circle', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
};

const JOB_STYLES = {
  COMPLETED: { label: 'Completed', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  RUNNING: { label: 'Running', color: '#0284c7', bg: 'rgba(2,132,199,0.12)' },
  FAILED: { label: 'Failed', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  SCHEDULED: { label: 'Scheduled', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  PAUSED: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  DRAFT: { label: 'Draft', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'alert', label: 'Alerts' },
  { key: 'message', label: 'Messages' },
  { key: 'success', label: 'Templates' },
];

function relativeTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const diff = Math.round((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function SystemScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useKonnectx();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const [stats, setStats] = useState(null);
  const [credential, setCredential] = useState(null);
  const [linkInfo, setLinkInfo] = useState(null);
  const [activities, setActivities] = useState([]);
  const [rules, setRules] = useState([]);

  const fetchAll = useCallback(async () => {
    const [statsRes, credRes, linkRes, actRes, rulesRes] = await Promise.allSettled([
      analyticsService.getStats(userId),
      credentialsService.getDefaultCredential(userId),
      settingsService.getClickToChatInfo(userId),
      analyticsService.getActivities(userId, 1, 25),
      settingsService.getAutoResponder(),
    ]);
    if (statsRes.status === 'fulfilled') setStats(statsRes.value?.stats || statsRes.value);
    if (credRes.status === 'fulfilled') setCredential(credRes.value);
    if (linkRes.status === 'fulfilled') setLinkInfo(linkRes.value);
    if (actRes.status === 'fulfilled') setActivities(Array.isArray(actRes.value?.activities) ? actRes.value.activities : []);
    if (rulesRes.status === 'fulfilled') setRules(Array.isArray(rulesRes.value?.rules) ? rulesRes.value.rules : []);
  }, [userId]);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  const messages = stats?.messages || {};
  const deliveries = Array.isArray(stats?.campaignDeliveries) ? stats.campaignDeliveries : [];
  const totalBroadcast = deliveries.reduce((s, c) => s + c.total, 0);
  const totalOk = deliveries.reduce((s, c) => s + c.delivered + c.read, 0);
  const deliveryPct = totalBroadcast > 0 ? Math.round((totalOk / totalBroadcast) * 100) : 0;
  const successRate = parseFloat(messages.successRate ?? '0');
  const activeRules = rules.filter((r) => r.isActive).length;

  const connected = !!linkInfo?.displayNumber;
  const lastJob = stats?.latestJob;
  const jobStyle = JOB_STYLES[(lastJob?.status || '').toUpperCase()] || JOB_STYLES.DRAFT;
  const sysCount = [
    { icon: 'document-text-outline', label: 'Templates', value: `${stats?.templates?.approved ?? 0}/${stats?.templates?.pending ?? 0}` },
    { icon: 'flash-outline', label: 'Auto-Replies', value: `${activeRules}/${rules.length}` },
    { icon: 'layers-outline', label: 'Campaigns', value: String(deliveries.length) },
    { icon: 'people-outline', label: 'Contacts', value: String(stats?.contacts?.total ?? 0) },
  ];

  const Section = ({ title, subtitle, children }) => (
    <View className="mb-5">
      <Text className={`mb-1 text-[13px] font-bold ${palette.text}`}>{title}</Text>
      {subtitle ? <Text className={`mb-2 text-[11px] ${palette.textSoft}`}>{subtitle}</Text> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <View className="flex-1 px-4 pt-5">
        <View className="mb-3 flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surface }}>
            <Ionicons name="arrow-back" size={20} color={palette.textColor} />
          </TouchableOpacity>
          <View className="flex-1">
            <View className="mb-0.5 self-start rounded-full bg-violet-600 px-2.5 py-0.5">
              <Text className="text-[9px] font-bold uppercase tracking-[1px] text-white">OPS & DIAGNOSTICS</Text>
            </View>
            <Text className={`text-[22px] font-bold ${palette.text}`}>System</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} className="h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: palette.colors.border, backgroundColor: palette.colors.surface }}>
            <Ionicons name="refresh" size={18} color={palette.textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>

          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              {/* Connection Health */}
              <Section title="Connection Health" subtitle="Live status of your default WhatsApp Cloud API account">
                <View className="rounded-[16px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                  <View className="mb-3 flex-row items-center gap-2.5">
                    <View className={`h-10 w-10 items-center justify-center rounded-full ${connected ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Ionicons name={connected ? 'cloud-done-outline' : 'cloud-offline-outline'} size={20}
                        color={connected ? '#16a34a' : '#dc2626'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-[14px] font-bold ${palette.text}`}>{connected ? 'WhatsApp Online' : 'Connection Issue'}</Text>
                      <Text className={`text-[11px] ${palette.textSoft}`}>
                        {connected ? `Verified as ${linkInfo?.verifiedName || 'WhatsApp Account'}` : 'Could not reach the WhatsApp Cloud API'}
                      </Text>
                    </View>
                    <View className={`rounded-full px-2 py-1 ${connected ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Text className={`text-[9px] font-bold uppercase tracking-wide ${connected ? 'text-emerald-600' : 'text-red-500'}`}>
                        {connected ? 'Connected' : 'Offline'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap">
                    {[
                      { label: 'Account', value: linkInfo?.verifiedName || credential?.profile || '—' },
                      { label: 'Number', value: linkInfo?.displayNumber ? `+${linkInfo.displayNumber}` : '—' },
                      { label: 'Phone ID', value: credential?.phoneNumberId ? `#${credential.phoneNumberId.slice(-6)}` : '—' },
                      { label: 'Default', value: credential?.isDefault ? 'Yes' : 'No' },
                    ].map((row) => (
                      <View key={row.label} className="mb-2 w-[50%]">
                        <Text className={`text-[9px] font-bold uppercase tracking-wide ${palette.textMuted}`}>{row.label}</Text>
                        <Text className={`text-[12px] font-semibold ${palette.text}`} numberOfLines={1}>{row.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Section>

              {/* Sync & Features summary */}
              <Section title="Sync & Features" subtitle="Templates, automation rules and workspace state">
                <View className="mb-2 flex-row flex-wrap gap-2">
                  {sysCount.map((s) => (
                    <View key={s.label} className="w-[48.5%] rounded-[14px] border p-3"
                      style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                      <View className="mb-1 flex-row items-center gap-1.5">
                        <Ionicons name={s.icon} size={14} color="#7c3aed" />
                        <Text className={`text-[13px] font-bold ${palette.text}`}>{s.value}</Text>
                      </View>
                      <Text className={`text-[10px] font-semibold uppercase tracking-wide ${palette.textMuted}`}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {lastJob ? (
                  <View className="flex-row items-center gap-2 rounded-[14px] border p-3"
                    style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                    <Ionicons name="server-outline" size={16} color={jobStyle.color} />
                    <View className="flex-1">
                      <Text className={`text-[12px] font-bold ${palette.text}`}>Latest bulk job</Text>
                      <Text className={`text-[10px] ${palette.textSoft}`}>
                        {lastJob.total} records{lastJob.completedAt ? ` · finished ${relativeTime(lastJob.completedAt)}` : ''}
                      </Text>
                    </View>
                    <View className="rounded-full px-2 py-1" style={{ backgroundColor: jobStyle.bg }}>
                      <Text className="text-[9px] font-bold uppercase tracking-wide" style={{ color: jobStyle.color }}>{jobStyle.label}</Text>
                    </View>
                  </View>
                ) : null}
              </Section>

              {/* Delivery Diagnostics */}
              <Section title="Delivery Diagnostics" subtitle={`${totalBroadcast.toLocaleString()} recipient(s) across ${deliveries.length} campaigns`}>
                {deliveries.length === 0 ? (
                  <View className="rounded-[16px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                    <Text className={`text-center text-[12px] ${palette.textSoft}`}>No broadcast campaigns yet. Delivered / read / failed stats appear here.</Text>
                  </View>
                ) : (
                  <>
                    <View className="mb-2.5 rounded-[16px] border p-4" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                      <View className="mb-1.5 flex-row items-center justify-between">
                        <Text className={`text-[11px] font-bold uppercase tracking-wide ${palette.textMuted}`}>Overall success</Text>
                        <Text className={`text-[13px] font-bold ${deliveryPct >= 70 ? 'text-emerald-600' : deliveryPct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                          {deliveryPct}%
                        </Text>
                      </View>
                      <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                        <View className="h-2 rounded-full" style={{ width: `${deliveryPct}%`, backgroundColor: deliveryPct >= 70 ? '#16a34a' : deliveryPct >= 40 ? '#f59e0b' : '#dc2626' }} />
                      </View>
                      <View className="mt-2 flex-row justify-between">
                        <Text className={`text-[10px] ${palette.textMuted}`}>Delivered {stats.messages?.delivered ?? 0}</Text>
                        <Text className={`text-[10px] text-sky-600`}>Read {stats.messages?.read ?? 0}</Text>
                        <Text className={`text-[10px] text-red-500`}>Failed {stats.messages?.failed ?? 0}</Text>
                      </View>
                    </View>

                    {deliveries.map((c) => {
                      const total = c.total || 0;
                      const ok = (c.delivered || 0) + (c.read || 0);
                      const pct = total > 0 ? Math.round((ok / total) * 100) : 0;
                      const badge = JOB_STYLES[(c.status || '').toUpperCase()] || JOB_STYLES.DRAFT;
                      return (
                        <View key={c.id} className="mb-2 rounded-[14px] border p-3"
                          style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                          <View className="mb-1.5 flex-row items-center justify-between">
                            <Text className={`flex-1 pr-2 text-[12px] font-bold ${palette.text}`} numberOfLines={1}>{c.name}</Text>
                            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
                              <Text className="text-[9px] font-bold uppercase tracking-wide" style={{ color: badge.color }}>{badge.label}</Text>
                            </View>
                          </View>
                          <View className="h-1.5 mb-1.5 overflow-hidden rounded-full" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                            <View className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#16a34a' : pct >= 40 ? '#f59e0b' : '#dc2626' }} />
                          </View>
                          <View className="flex-row justify-between">
                            <Text className={`text-[10px] ${palette.textMuted}`}>{total} total</Text>
                            <Text className={`text-[10px] text-emerald-600`}>{c.delivered || 0} delivered</Text>
                            <Text className={`text-[10px] text-sky-600`}>{c.read || 0} read</Text>
                            <Text className={`text-[10px] text-red-500`}>{c.failed || 0} failed</Text>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </Section>

              {/* Webhook & Event Log */}
              <Section title="Webhook & Event Log" subtitle="Recent inbound activity reaching your workspace">
                <View className="mb-2.5 flex-row items-center gap-1.5">
                  {FILTERS.map((f) => (
                    <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
                      className={`rounded-full px-3 py-1.5 ${filter === f.key ? 'bg-violet-600' : 'border'}`}
                      style={filter !== f.key ? { backgroundColor: palette.colors.surface, borderColor: palette.colors.border } : {}}>
                      <Text className={`text-[11px] font-bold ${filter === f.key ? 'text-white' : palette.text}`}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {filteredActivities.length === 0 ? (
                  <KonnectxEmptyState icon="pulse-outline" title="No events"
                    description={filter === 'all' ? 'Incoming replies, delivery alerts and template syncs will show up here.' : `No ${filter} events recorded.`} />
                ) : (
                  filteredActivities.map((a) => {
                    const style = ACT_TYPE_STYLES[a.type] || ACT_TYPE_STYLES.webhook;
                    return (
                      <View key={a.id} className="mb-1.5 flex-row items-start gap-2.5 rounded-[14px] border p-3"
                        style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                        <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: style.bg }}>
                          <Ionicons name={style.icon} size={14} color={style.color} />
                        </View>
                        <View className="flex-1">
                          <Text className={`text-[12px] font-bold ${palette.text}`} numberOfLines={1}>{a.title}</Text>
                          <Text className={`text-[11px] ${palette.textSoft}`} numberOfLines={2}>{a.description}</Text>
                        </View>
                        <Text className={`text-[10px] ${palette.textMuted}`}>{relativeTime(a.time)}</Text>
                      </View>
                    );
                  })
                )}
              </Section>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}