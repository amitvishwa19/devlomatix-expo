import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import * as crmService from '~/services/crm';
import { useCrmTheme } from '~/utils/crm/colors';
import CrmHeader from '../_components/CrmHeader';

const TRIGGER_LABELS = {
  DEAL_STAGE_CHANGED: 'Deal Stage Changed',
  DEAL_WON: 'Deal Won',
  LEAD_CREATED: 'Lead Created',
  CANDIDATE_PLACED: 'Candidate Placed',
  DEAL_RISK_FLAGGED: 'Deal Risk Flagged',
};

const TABS = [
  { key: 'rules', label: 'Automation Flows' },
  { key: 'logs', label: 'Execution Logs' },
];

export default function AutomationsScreen() {
  const { colors } = useCrmTheme();
  const { workspaceId } = useCrm();

  const [tab, setTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetchAll = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    try {
      const [rulesRes, logsRes] = await Promise.allSettled([
        crmService.getAutomations({ workspaceId }),
        crmService.getAutomationLogs({ workspaceId }),
      ]);
      if (rulesRes.status === 'fulfilled' && rulesRes.value?.success) {
        setRules(rulesRes.value.data || []);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value?.success) {
        setLogs(logsRes.value.data || []);
      }
    } catch (error) {
      console.warn('Failed to load automations:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const stats = useMemo(() => {
    const active = rules.filter((r) => r.isActive).length;
    const totalRuns = rules.reduce((sum, r) => sum + (r.stats?.totalRuns || 0), 0);
    const paused = rules.length - active;
    return { total: rules.length, active, paused, totalRuns };
  }, [rules]);

  const handleToggle = async (rule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)));
    try {
      const res = await crmService.toggleAutomation(rule.id, { workspaceId });
      if (!res?.success) throw new Error(res?.error || 'Failed to update automation');
      Toast.show({ type: 'success', text1: rule.isActive ? 'Automation paused' : 'Automation activated' });
    } catch (error) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: rule.isActive } : r)));
      Toast.show({ type: 'error', text1: 'Update failed', text2: error.message });
    }
  };

  const handleTest = async (rule) => {
    if (testingId) return;
    setTestingId(rule.id);
    try {
      const res = await crmService.testAutomation(rule.id, { workspaceId });
      if (!res?.success) throw new Error(res?.error || 'Test run failed');
      Toast.show({ type: 'success', text1: 'Test run completed', text2: `${rule.actions?.length || 0} actions executed` });
      fetchAll();
      setTab('logs');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Test failed', text2: error.message });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = (rule) => {
    Alert.alert('Delete Automation', `Delete "${rule.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await crmService.deleteAutomation(rule.id, { workspaceId });
            if (!res?.success) throw new Error(res?.error || 'Failed to delete');
            setRules((prev) => prev.filter((r) => r.id !== rule.id));
            Toast.show({ type: 'success', text1: 'Automation deleted' });
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Delete failed', text2: error.message });
          }
        },
      },
    ]);
  };

  const toggleExpanded = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title="Automations"
        subtitle={`${stats.active} active • ${stats.totalRuns.toLocaleString('en-IN')} total runs`}
        showBack={true}
      />

      <View className="px-3 pt-2.5 pb-2 border-b" style={{ backgroundColor: colors.header, borderColor: colors.border }}>
        <View className="flex-row gap-x-2">
          {[
            { label: 'Flows', value: stats.total, accent: colors.primary },
            { label: 'Active', value: stats.active, accent: colors.success },
            { label: 'Paused', value: stats.paused, accent: colors.warning },
          ].map((metric) => (
            <View
              key={metric.label}
              className="flex-1 rounded-xl border p-2.5"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                {metric.label}
              </Text>
              <Text className="text-base font-bold mt-0.5" style={{ color: metric.accent }}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>

        <View
          className="mt-2.5 flex-row rounded-xl p-0.5 border"
          style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
        >
          {TABS.map((item) => {
            const selected = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                className="flex-1 rounded-lg py-2 items-center justify-center"
                style={{ backgroundColor: selected ? colors.card : 'transparent' }}
              >
                <Text className="text-[11px] font-bold" style={{ color: selected ? colors.primary : colors.textMuted }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
              Loading automations...
            </Text>
          </View>
        ) : tab === 'rules' ? (
          rules.length > 0 ? (
            rules.map((rule) => {
              const isOpen = !!expanded[rule.id];
              const actions = rule.actions || [];
              return (
                <View
                  key={rule.id}
                  className="mb-2.5 rounded-2xl border p-3"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                >
                  <View className="flex-row items-start gap-x-2.5">
                    <View
                      className="h-9 w-9 items-center justify-center rounded-xl border"
                      style={{
                        backgroundColor: rule.isActive ? colors.primarySoft : colors.cardAlt,
                        borderColor: rule.isActive ? colors.primaryBorder : colors.border,
                      }}
                    >
                      <Ionicons
                        name="flash"
                        size={17}
                        color={rule.isActive ? colors.primary : colors.textSoft}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-xs font-bold" style={{ color: colors.text }} numberOfLines={2}>
                        {rule.name}
                      </Text>
                      <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.primary }}>
                        {rule.category}
                      </Text>
                    </View>

                    <Switch
                      value={!!rule.isActive}
                      onValueChange={() => handleToggle(rule)}
                      trackColor={{ false: colors.border, true: colors.primaryBorder }}
                      thumbColor={rule.isActive ? colors.primary : colors.textSoft}
                    />
                  </View>

                  <Text className="text-[11px] mt-2 leading-4" style={{ color: colors.textMuted }} numberOfLines={isOpen ? undefined : 2}>
                    {rule.description}
                  </Text>

                  <View className="flex-row items-center flex-wrap gap-1.5 mt-2">
                    <View
                      className="flex-row items-center gap-x-1 rounded-full border px-2 py-0.5"
                      style={{ backgroundColor: colors.infoSoft, borderColor: colors.infoBorder }}
                    >
                      <Ionicons name="flash-outline" size={10} color={colors.info} />
                      <Text className="text-[9px] font-bold" style={{ color: colors.info }}>
                        {TRIGGER_LABELS[rule.triggerEvent] || rule.triggerEvent}
                      </Text>
                    </View>
                    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.cardAlt }}>
                      <Text className="text-[9px] font-bold" style={{ color: colors.textMuted }}>
                        {actions.length} actions
                      </Text>
                    </View>
                    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.cardAlt }}>
                      <Text className="text-[9px] font-bold" style={{ color: colors.textMuted }}>
                        {rule.stats?.totalRuns || 0} runs
                      </Text>
                    </View>
                    {rule.stats?.successRate ? (
                      <View
                        className="rounded-full border px-2 py-0.5"
                        style={{ backgroundColor: colors.successSoft, borderColor: colors.successBorder }}
                      >
                        <Text className="text-[9px] font-bold" style={{ color: colors.success }}>
                          {rule.stats.successRate}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {isOpen && actions.length > 0 && (
                    <View className="mt-2.5 rounded-xl border p-2.5" style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}>
                      {actions.map((action, index) => (
                        <View key={action.id || index} className="flex-row items-center gap-x-2 py-1">
                          <View className="h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: colors.card }}>
                            <Text className="text-[9px] font-bold" style={{ color: colors.primary }}>
                              {index + 1}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-[10px] font-bold" style={{ color: colors.text }} numberOfLines={1}>
                              {action.name}
                            </Text>
                            <Text className="text-[9px]" style={{ color: colors.textSoft }}>
                              {action.module}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t" style={{ borderTopColor: colors.border }}>
                    <Pressable onPress={() => toggleExpanded(rule.id)} className="flex-row items-center gap-x-1 py-1">
                      <Text className="text-[10px] font-bold" style={{ color: colors.textMuted }}>
                        {isOpen ? 'Hide workflow' : 'View workflow'}
                      </Text>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={12} color={colors.textMuted} />
                    </Pressable>

                    <View className="flex-row items-center gap-x-1.5">
                      <Pressable
                        onPress={() => handleDelete(rule)}
                        className="h-7 w-7 items-center justify-center rounded-lg border"
                        style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder }}
                      >
                        <Ionicons name="trash-outline" size={13} color={colors.danger} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleTest(rule)}
                        disabled={!!testingId}
                        className="flex-row items-center gap-x-1 rounded-lg border px-2.5 py-1.5"
                        style={{ backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder, opacity: testingId ? 0.6 : 1 }}
                      >
                        {testingId === rule.id ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Ionicons name="play" size={11} color={colors.primary} />
                            <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                              Test
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View
              className="rounded-2xl border border-dashed p-6 items-center justify-center"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Ionicons name="flash-outline" size={32} color={colors.textSoft} />
              <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
                No Automations Yet
              </Text>
              <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
                Cross-module workflow automations will appear here.
              </Text>
            </View>
          )
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <View
              key={log.id}
              className="mb-2 rounded-2xl border p-3"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-bold" style={{ color: colors.text }} numberOfLines={1}>
                    {log.ruleName}
                  </Text>
                  <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }} numberOfLines={1}>
                    {log.targetEntity}
                  </Text>
                </View>
                <View
                  className="rounded-full border px-2 py-0.5"
                  style={{
                    backgroundColor: log.status === 'SUCCESS' ? colors.successSoft : colors.dangerSoft,
                    borderColor: log.status === 'SUCCESS' ? colors.successBorder : colors.dangerBorder,
                  }}
                >
                  <Text
                    className="text-[9px] font-bold"
                    style={{ color: log.status === 'SUCCESS' ? colors.success : colors.danger }}
                  >
                    {log.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center flex-wrap gap-x-2 gap-y-1 mt-2">
                <Text className="text-[10px] font-semibold" style={{ color: colors.primary }}>
                  {TRIGGER_LABELS[log.triggerEvent] || log.triggerEvent}
                </Text>
                <Text className="text-[9px]" style={{ color: colors.textSoft }}>
                  {log.durationMs}ms
                </Text>
                <Text className="text-[9px]" style={{ color: colors.textSoft }}>
                  {new Date(log.timestamp).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {log.executedNodes?.length > 0 && (
                <View className="mt-1.5 flex-row flex-wrap gap-1">
                  {log.executedNodes.map((node, index) => (
                    <View
                      key={`${log.id}-${index}`}
                      className="rounded px-1.5 py-0.5"
                      style={{ backgroundColor: colors.cardAlt }}
                    >
                      <Text className="text-[9px] font-medium" style={{ color: colors.textMuted }} numberOfLines={1}>
                        {node}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <View
            className="rounded-2xl border border-dashed p-6 items-center justify-center"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Ionicons name="time-outline" size={32} color={colors.textSoft} />
            <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
              No Execution Logs
            </Text>
            <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
              Run a test on any automation to generate a log entry.
            </Text>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
