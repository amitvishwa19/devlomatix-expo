import Ionicons from '@expo/vector-icons/Ionicons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import { useWidgets } from '~/contexts/WidgetContext';
import * as crmService from '~/services/crm';
import { getSession } from '~/utils/authStorage';
import AiStalledDealRevivalModal from '../_components/AiStalledDealRevivalModal';
import CreateContactModal from '../_components/CreateContactModal';
import CreateDealModal from '../_components/CreateDealModal';
import CreateTaskModal from '../_components/CreateTaskModal';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import { useCrmTheme } from '~/utils/crm/colors';
import { useCrmDrawer } from '../_components/CrmDrawer';

export default function CrmDashboard() {
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { openDrawer } = useCrmDrawer();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const {
    deals,
    contacts,
    tasks,
    forecast,
    loading,
    refreshing,
    refreshAll,
    openCreateDeal,
    openCreateContact,
    openCreateTask,
  } = useCrm();

  const crmSocket = useCrmSocket();
  const isSocketConnected = Boolean(crmSocket?.isConnected);
  const { widgets } = useWidgets();
  const showWidget = (key) => widgets[key] !== false;

  const [currentUser, setCurrentUser] = useState(null);
  const [syncingWa, setSyncingWa] = useState(false);
  const [syncBanner, setSyncBanner] = useState(null);
  const [revivalDeal, setRevivalDeal] = useState(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      }
    });
  }, []);

  const summary = forecast?.summary || {};
  const totalPipelineNum = summary.totalPipelineValue || deals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
  const totalPipelineVal = totalPipelineNum.toLocaleString('en-IN');
  const weightedRevNum = summary.weightedExpectedRevenue || Math.round(totalPipelineNum * 0.65);
  const weightedRev = weightedRevNum.toLocaleString('en-IN');
  const winRate = summary.winRate || 68;
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const urgentTasksCount = pendingTasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  // Stalled Deals: Deals in pipeline without update for > 7 days or with low health
  const stalledDeals = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return deals.filter((d) => {
      if (d.status === 'WON' || d.status === 'LOST') return false;
      const updated = new Date(d.updatedAt || d.createdAt || 0).getTime();
      return updated < sevenDaysAgo || (d.stage?.probability !== undefined && d.stage.probability < 35);
    });
  }, [deals]);

  // Stage Distribution for Visual Sales Funnel Bar
  const funnelStages = useMemo(() => {
    if (!deals.length) return [];
    const stageCounts = {};
    deals.forEach((d) => {
      const stageName = d.stage?.name || 'Inbound';
      stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
    });

    const paletteMap = colors.funnel || [
      { name: 'Lead', color: '#3b82f6' },
      { name: 'Meeting', color: '#8b5cf6' },
      { name: 'Proposal', color: '#f59e0b' },
      { name: 'Negotiation', color: '#0284c7' },
      { name: 'Won', color: '#10b981' },
    ];

    const entries = Object.entries(stageCounts);
    return entries.map(([name, count], idx) => {
      const colorEntry = paletteMap[idx % paletteMap.length];
      const pct = Math.max(12, Math.round((count / deals.length) * 100));
      return {
        name,
        count,
        pct,
        color: colorEntry.color,
      };
    });
  }, [deals, colors]);

  const handleSyncWhatsApp = async () => {
    try {
      setSyncingWa(true);
      setSyncBanner(null);
      const res = await crmService.syncWhatsAppChats();
      if (res.success) {
        setSyncBanner({
          type: 'success',
          text: `WhatsApp synced: ${res.data?.newContactsCreated || 0} new leads, ${res.data?.messagesLinked || 0} chats linked.`,
        });
        refreshAll();
      } else {
        setSyncBanner({ type: 'error', text: res.error || 'Failed to sync WhatsApp chats' });
      }
    } catch (e) {
      setSyncBanner({ type: 'error', text: e.message || 'Error syncing chats' });
    } finally {
      setSyncingWa(false);
      setTimeout(() => setSyncBanner(null), 5000);
    }
  };

  const topDeals = useMemo(() => {
    return [...deals]
      .sort((a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0))
      .slice(0, 5);
  }, [deals]);

  const userName = currentUser?.displayName || currentUser?.name || 'Sales Rep';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <AppScreen>
      <UserStatusBar />

      {/* Global Modals */}
      <QuickWhatsAppModal />
      <CreateDealModal />
      <CreateContactModal />
      <CreateTaskModal />
      <AiStalledDealRevivalModal
        deal={revivalDeal}
        visible={Boolean(revivalDeal)}
        onClose={() => setRevivalDeal(null)}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
        className="px-3 pt-2"
      >
        {/* Executive Greeting Header Bar */}
        <View
          className="mb-3 rounded-[16px] border p-3 flex-row items-center justify-between"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center gap-x-2.5 flex-1">
            <Pressable
              onPress={openDrawer}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-xl border active:opacity-75"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Ionicons name="menu" size={20} color={colors.primary} />
            </Pressable>
            <View className="flex-1">
              <View className="flex-row items-center gap-x-2">
                <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
                  {userName}
                </Text>
                <View
                  className="flex-row items-center gap-x-1 rounded-full px-2 py-0.5 border"
                  style={{
                    backgroundColor: isSocketConnected ? colors.successSoft : colors.amberSoft,
                    borderColor: isSocketConnected ? colors.successBorder : colors.warningBorder,
                  }}
                >
                  <View
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isSocketConnected ? colors.success : colors.warning }}
                  />
                  <Text
                    className="text-[9px] font-semibold"
                    style={{ color: isSocketConnected ? colors.success : colors.warning }}
                  >
                    {isSocketConnected ? 'Live' : 'Connecting'}
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
                {formattedDate} • Pipeline Intelligence
              </Text>
            </View>
          </View>

          {/* Quick Header Action Buttons: Mailbox & WhatsApp Sync */}
          <View className="flex-row items-center gap-x-1.5">
            <Pressable
              onPress={() => router.push('/mailbox')}
              className="h-8 px-2.5 flex-row items-center gap-x-1.5 rounded-xl border active:opacity-75"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Ionicons name="mail" size={14} color={colors.primary} />
              <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
                Mailbox
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSyncWhatsApp}
              disabled={syncingWa}
              className="h-8 px-2 flex-row items-center gap-x-1 rounded-xl border active:opacity-75"
              style={{
                backgroundColor: colors.cardAlt,
                borderColor: colors.border,
              }}
            >
              {syncingWa ? (
                <ActivityIndicator size="small" color={colors.whatsapp} />
              ) : (
                <Ionicons name="logo-whatsapp" size={13} color={colors.whatsapp} />
              )}
              <Text className="text-[10px] font-semibold" style={{ color: colors.textSecondary }}>
                Sync
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sync WhatsApp Banner */}
        {syncBanner && (
          <View
            className="mb-3 rounded-[14px] p-2.5 border"
            style={{
              backgroundColor: syncBanner.type === 'success' ? colors.successSoft : colors.dangerSoft,
              borderColor: syncBanner.type === 'success' ? colors.successBorder : colors.dangerBorder,
            }}
          >
            <Text
              className="text-xs font-semibold text-center"
              style={{ color: syncBanner.type === 'success' ? colors.success : colors.danger }}
            >
              {syncBanner.text}
            </Text>
          </View>
        )}

        {/* Executive Bento KPI Grid */}
        {showWidget('dashKpis') && (
        <View className="flex-row flex-wrap justify-between gap-y-2 mb-3">
          {/* Total Pipeline Card */}
          <View
            className="w-[48%] rounded-[16px] border p-3"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.kpi.blue.bg }}
              >
                <Ionicons name="pie-chart" size={16} color={colors.kpi.blue.text} />
              </View>
              <View
                className="rounded-full px-2 py-0.5 border"
                style={{
                  backgroundColor: colors.kpi.blue.bg,
                  borderColor: colors.kpi.blue.border,
                }}
              >
                <Text className="text-[9px] font-bold" style={{ color: colors.kpi.blue.text }}>
                  {deals.length} deals
                </Text>
              </View>
            </View>
            <Text className="mt-2.5 text-base font-bold" style={{ color: colors.text }} numberOfLines={1}>
              ₹ {totalPipelineVal}
            </Text>
            <Text className="text-[10px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
              Total Active Pipeline
            </Text>
            {/* Visual stage micro-bar */}
            <View className="mt-2 h-1 w-full flex-row overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <View className="h-full bg-blue-500" style={{ width: '40%' }} />
              <View className="h-full bg-amber-500" style={{ width: '35%' }} />
              <View className="h-full bg-emerald-500" style={{ width: '25%' }} />
            </View>
          </View>

          {/* Weighted Forecast Card */}
          <View
            className="w-[48%] rounded-[16px] border p-3"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.kpi.green.bg }}
              >
                <Ionicons name="trending-up" size={16} color={colors.kpi.green.text} />
              </View>
              <View
                className="rounded-full px-2 py-0.5 border"
                style={{
                  backgroundColor: colors.kpi.green.bg,
                  borderColor: colors.kpi.green.border,
                }}
              >
                <Text className="text-[9px] font-bold" style={{ color: colors.kpi.green.text }}>
                  Forecast
                </Text>
              </View>
            </View>
            <Text className="mt-2.5 text-base font-bold" style={{ color: colors.text }} numberOfLines={1}>
              ₹ {weightedRev}
            </Text>
            <Text className="text-[10px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
              Weighted Realization
            </Text>
            <View className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <View className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
            </View>
          </View>

          {/* Win Rate Card */}
          <View
            className="w-[48%] rounded-[16px] border p-3"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.kpi.amber.bg }}
              >
                <Ionicons name="trophy" size={16} color={colors.kpi.amber.text} />
              </View>
              <Text className="text-xs font-bold" style={{ color: colors.kpi.amber.text }}>
                Top 15%
              </Text>
            </View>
            <Text className="mt-2.5 text-base font-bold" style={{ color: colors.text }}>
              {winRate}%
            </Text>
            <Text className="text-[10px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
              Stage Conversion Rate
            </Text>
            <View className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <View className="h-full bg-amber-500 rounded-full" style={{ width: `${winRate}%` }} />
            </View>
          </View>

          {/* Follow-ups Due Card */}
          <Pressable
            onPress={() => router.push('/tasks')}
            className="w-[48%] rounded-[16px] border p-3 active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.kpi.purple.bg }}
              >
                <Ionicons name="checkbox" size={16} color={colors.kpi.purple.text} />
              </View>
              {urgentTasksCount > 0 && (
                <View
                  className="rounded-full px-2 py-0.5 border"
                  style={{
                    backgroundColor: colors.dangerSoft,
                    borderColor: colors.dangerBorder,
                  }}
                >
                  <Text className="text-[9px] font-bold" style={{ color: colors.danger }}>
                    {urgentTasksCount} urgent
                  </Text>
                </View>
              )}
            </View>
            <Text className="mt-2.5 text-base font-bold" style={{ color: colors.text }}>
              {pendingTasks.length} open
            </Text>
            <Text className="text-[10px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
              Action Follow-ups Due
            </Text>
            <View className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, pendingTasks.length * 20)}%`,
                  backgroundColor: colors.kpi.purple.text,
                }}
              />
            </View>
          </Pressable>
        </View>
        )}

        {/* Visual Sales Funnel Distribution Bar */}
        {showWidget('dashFunnel') && funnelStages.length > 0 && (
          <View
            className="mb-3 rounded-[16px] border p-3"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                Sales Funnel Distribution
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/pipeline')}
                className="flex-row items-center gap-x-1"
              >
                <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
                  Explore Pipeline
                </Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </Pressable>
            </View>

            {/* Segmented Horizontal Funnel Bar */}
            <View className="h-2 w-full flex-row overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              {funnelStages.map((st, i) => (
                <View
                  key={st.name + i}
                  style={{
                    width: `${st.pct}%`,
                    backgroundColor: st.color,
                  }}
                />
              ))}
            </View>

            {/* Funnel Stage Labels */}
            <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
              {funnelStages.map((st, i) => (
                <View key={st.name + i} className="flex-row items-center gap-x-1">
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: st.color }} />
                  <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                    {st.name} ({st.count})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Stalled Deals Revival Alert Widget */}
        {showWidget('dashStalled') && stalledDeals.length > 0 && (
          <View
            className="mb-3 rounded-[16px] border p-3 flex-row items-center justify-between"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.warningBorder || colors.border,
            }}
          >
            <View className="flex-row items-center gap-x-2.5 flex-1 pr-2">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.warningSoft }}
              >
                <Ionicons name="sparkles" size={18} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  AI Copilot: {stalledDeals.length} Stalled Deals
                </Text>
                <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.textMuted }} numberOfLines={1}>
                  High-risk deals need immediate re-engagement
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setRevivalDeal(stalledDeals[0])}
              className="rounded-xl px-3 py-1.5 active:opacity-80"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-bold text-white">AI Revive</Text>
            </Pressable>
          </View>
        )}

        {/* Primary Action Bar: Fast Executive Ops */}
        {showWidget('dashActions') && (
        <View className="flex-row items-center justify-between gap-x-2 mb-3">
          <Pressable
            onPress={() => openCreateDeal()}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2.5 px-3 active:opacity-85 shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white">New Deal</Text>
          </Pressable>

          <Pressable
            onPress={openCreateContact}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2.5 px-3 border active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="person-add" size={14} color={colors.success} />
            <Text className="text-xs font-bold" style={{ color: colors.text }}>
              + Contact
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openCreateTask()}
            className="flex-1 flex-row items-center justify-center gap-x-1.5 rounded-xl py-2.5 px-3 border active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="calendar" size={14} color={colors.copilot} />
            <Text className="text-xs font-bold" style={{ color: colors.text }}>
              + Task
            </Text>
          </Pressable>
        </View>
        )}

        {/* Operations Hub: Executive Categorized Grid */}
        {showWidget('dashShortcuts') && (
        <>
        <Text className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
          Sales Intelligence & Operations
        </Text>

        <View className="flex-row flex-wrap justify-between gap-y-2 mb-4">
          {/* AI Copilot */}
          <Pressable
            onPress={() => router.push('/(tabs)/copilot')}
            className="w-[48%] rounded-[14px] border p-2.5 flex-row items-center gap-x-2.5 active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.copilotSoft }}
            >
              <Ionicons name="sparkles" size={16} color={colors.copilot} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                AI Copilot
              </Text>
              <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                Deal Health & Scripts
              </Text>
            </View>
          </Pressable>

          {/* DCR Meeting Dictation */}
          <Pressable
            onPress={() => router.push('/dcr')}
            className="w-[48%] rounded-[14px] border p-2.5 flex-row items-center gap-x-2.5 active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.infoSoft }}
            >
              <Ionicons name="mic" size={16} color={colors.info} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                Voice DCR
              </Text>
              <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                Audio Note Dictation
              </Text>
            </View>
          </Pressable>

          {/* Quotations & Proposals */}
          <Pressable
            onPress={() => router.push('/quotations')}
            className="w-[48%] rounded-[14px] border p-2.5 flex-row items-center gap-x-2.5 active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                Quotations
              </Text>
              <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                Telemetry & Signs
              </Text>
            </View>
          </Pressable>

          {/* CRM Mailbox */}
          <Pressable
            onPress={() => router.push('/mailbox')}
            className="w-[48%] rounded-[14px] border p-2.5 flex-row items-center gap-x-2.5 active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.primarySoft }}
            >
              <Ionicons name="mail" size={16} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                CRM Mailbox
              </Text>
              <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                Multi-Inboxes & Resend
              </Text>
            </View>
          </Pressable>

          {/* Analytics & Velocity */}
          <Pressable
            onPress={() => router.push('/analytics')}
            className="w-[48%] rounded-[14px] border p-2.5 flex-row items-center gap-x-2.5 active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.warningSoft }}
            >
              <Ionicons name="bar-chart-outline" size={16} color={colors.warning} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                Analytics
              </Text>
              <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                Velocity & Quotas
              </Text>
            </View>
          </Pressable>

          {/* Chat & VoIP Calls */}
          <Pressable
            onPress={() => router.push('/chat')}
            className="w-[48%] rounded-[14px] border p-2.5 flex-row items-center gap-x-2.5 active:opacity-80"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.whatsappSoft || colors.successSoft }}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={colors.whatsapp || colors.success} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                Chat & Calls
              </Text>
              <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                WhatsApp & VoIP
              </Text>
            </View>
          </Pressable>
        </View>
        </>
        )}

        {/* Top Priority Opportunities Header */}
        {showWidget('dashPipeline') && (
        <>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
            High-Value Opportunities ({deals.length})
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/pipeline')}>
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              View Pipeline →
            </Text>
          </Pressable>
        </View>

        {loading && deals.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
              Loading CRM intelligence...
            </Text>
          </View>
        ) : topDeals.length > 0 ? (
          topDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View
            className="rounded-[16px] border border-dashed p-6 items-center justify-center"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="briefcase-outline" size={32} color={colors.textSoft} />
            <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
              No Deals in Pipeline
            </Text>
            <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
              Create your first sales deal or import leads from WhatsApp.
            </Text>
            <Pressable
              onPress={() => openCreateDeal()}
              className="mt-3 rounded-xl px-4 py-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs font-bold text-white">+ Create Deal</Text>
            </Pressable>
          </View>
        )}
        </>
        )}
      </ScrollView>
    </AppScreen>
  );
}
