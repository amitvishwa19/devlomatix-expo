import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';
import { useCrmTheme } from '~/utils/crm/colors';
import CrmHeader from '../_components/CrmHeader';
import LogActivityModal from '../_components/LogActivityModal';

const TYPE_META = {
  NOTE: { label: 'Note', icon: 'document-text-outline', color: 'primary' },
  CALL: { label: 'Call', icon: 'call-outline', color: 'call' },
  MEETING: { label: 'Meeting', icon: 'people-outline', color: 'copilot' },
  WHATSAPP_MSG: { label: 'WhatsApp', icon: 'logo-whatsapp', color: 'whatsapp' },
  EMAIL: { label: 'Email', icon: 'mail-outline', color: 'warning' },
  TASK: { label: 'Task', icon: 'checkbox-outline', color: 'success' },
  DEAL_STAGE_CHANGE: { label: 'Stage Change', icon: 'funnel-outline', color: 'accent' },
  ATS_INTERVIEW: { label: 'Interview', icon: 'briefcase-outline', color: 'copilot' },
  INVOICE_GENERATED: { label: 'Invoice', icon: 'receipt-outline', color: 'success' },
};

const FILTERS = ['ALL', 'NOTE', 'CALL', 'MEETING', 'WHATSAPP_MSG', 'EMAIL', 'TASK'];

function relativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function dateKey(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ActivitiesScreen() {
  const { colors } = useCrmTheme();
  const { workspaceId, refreshAll } = useCrm();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [logVisible, setLogVisible] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    try {
      const res = await crmService.getActivities({ workspaceId, limit: 100 });
      if (res?.success) setActivities(res.data || []);
    } catch (error) {
      console.warn('Failed to load activities:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
    refreshAll();
  };

  const filtered = useMemo(
    () => (filter === 'ALL' ? activities : activities.filter((a) => a.type === filter)),
    [activities, filter]
  );

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((activity) => {
      const key = dateKey(activity.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(activity);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const colorFor = (type) => {
    const meta = TYPE_META[type] || TYPE_META.NOTE;
    return colors[meta.color] || colors.primary;
  };

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title="Activities"
        subtitle={`${activities.length} timeline events`}
        showBack={true}
        rightActions={
          <Pressable
            onPress={() => setLogVisible(true)}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1.5 rounded-xl active:opacity-85 shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Log</Text>
          </Pressable>
        }
      />

      <LogActivityModal
        visible={logVisible}
        onClose={() => setLogVisible(false)}
        onCreated={() => {
          setLogVisible(false);
          fetchActivities();
        }}
      />

      <View className="px-3 py-2 border-b" style={{ backgroundColor: colors.header, borderColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((option) => {
            const selected = filter === option;
            return (
              <Pressable
                key={option}
                onPress={() => setFilter(option)}
                className="mr-1.5 rounded-xl px-3 py-1.5 border active:opacity-80"
                style={{
                  backgroundColor: selected ? colors.primary : colors.cardAlt,
                  borderColor: selected ? colors.primary : colors.border,
                }}
              >
                <Text className="text-[11px] font-bold" style={{ color: selected ? '#ffffff' : colors.text }}>
                  {option === 'ALL' ? 'All Activity' : TYPE_META[option]?.label || option}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
              Loading timeline...
            </Text>
          </View>
        ) : groups.length > 0 ? (
          groups.map(([day, items]) => (
            <View key={day} className="mb-2">
              <View className="flex-row items-center gap-x-2 mb-2">
                <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {day}
                </Text>
                <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                <Text className="text-[10px] font-semibold" style={{ color: colors.textSoft }}>
                  {items.length}
                </Text>
              </View>

              {items.map((activity) => {
                const meta = TYPE_META[activity.type] || TYPE_META.NOTE;
                const accent = colorFor(activity.type);
                const linked = activity.contact?.name || activity.deal?.title || activity.account?.name;

                return (
                  <View
                    key={activity.id}
                    className="mb-2 rounded-2xl border p-3"
                    style={{ backgroundColor: colors.card, borderColor: colors.border }}
                  >
                    <View className="flex-row items-start gap-x-2.5">
                      <View
                        className="h-8 w-8 items-center justify-center rounded-full border"
                        style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
                      >
                        <Ionicons name={meta.icon} size={15} color={accent} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-bold flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>
                            {activity.title}
                          </Text>
                          <Text className="text-[10px] font-medium" style={{ color: colors.textSoft }}>
                            {relativeTime(activity.createdAt)}
                          </Text>
                        </View>

                        {activity.description ? (
                          <Text className="text-[11px] mt-1 leading-4" style={{ color: colors.textMuted }} numberOfLines={3}>
                            {activity.description}
                          </Text>
                        ) : null}

                        <View className="flex-row items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
                          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.cardAlt }}>
                            <Text className="text-[9px] font-bold" style={{ color: accent }}>
                              {meta.label}
                            </Text>
                          </View>
                          {linked ? (
                            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }} numberOfLines={1}>
                              {linked}
                            </Text>
                          ) : null}
                          {activity.user?.displayName ? (
                            <Text className="text-[10px]" style={{ color: colors.textSoft }}>
                              by {activity.user.displayName}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        ) : (
          <View
            className="rounded-2xl border border-dashed p-6 items-center justify-center"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Ionicons name="pulse-outline" size={32} color={colors.textSoft} />
            <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
              No Activities Yet
            </Text>
            <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
              Log calls, meetings, notes and messages to build the customer timeline.
            </Text>
            <Pressable
              onPress={() => setLogVisible(true)}
              className="mt-3 rounded-xl px-4 py-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-bold text-white">+ Log Activity</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
