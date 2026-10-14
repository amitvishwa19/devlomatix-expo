import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateDealModal from '../_components/CreateDealModal';
import CreateContactModal from '../_components/CreateContactModal';
import CreateTaskModal from '../_components/CreateTaskModal';
import * as crmService from '~/services/crm';

export default function CrmDashboard() {
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
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

  const [syncingWa, setSyncingWa] = useState(false);
  const [syncBanner, setSyncBanner] = useState(null);

  const summary = forecast?.summary || {};
  const totalPipelineVal = (summary.totalPipelineValue || deals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)).toLocaleString('en-IN');
  const weightedRev = (summary.weightedExpectedRevenue || 0).toLocaleString('en-IN');
  const winRate = summary.winRate || 68;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'COMPLETED').length;

  const handleSyncWhatsApp = async () => {
    try {
      setSyncingWa(true);
      setSyncBanner(null);
      const res = await crmService.syncWhatsAppChats();
      if (res.success) {
        setSyncBanner({
          type: 'success',
          text: `WhatsApp synced: ${res.data?.newContactsCreated || 0} new contacts, ${res.data?.messagesLinked || 0} timeline chats linked.`,
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

  const topDeals = [...deals]
    .sort((a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0))
    .slice(0, 5);

  return (
    <AppScreen>
      <CrmHeader title="DevX CRM" subtitle="Revenue Engine & Copilot" />

      {/* Global Modals */}
      <QuickWhatsAppModal />
      <CreateDealModal />
      <CreateContactModal />
      <CreateTaskModal />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
        className="px-3 pt-3"
      >
        {/* Sync WhatsApp Banner */}
        {syncBanner && (
          <View
            className="mb-3 rounded-[16px] p-3 border"
            style={{
              backgroundColor: syncBanner.type === 'success' ? colors.successSoft : colors.dangerSoft,
              borderColor: syncBanner.type === 'success' ? colors.successBorder : colors.dangerBorder,
            }}
          >
            <Text
              className="text-xs font-bold text-center"
              style={{ color: syncBanner.type === 'success' ? colors.success : colors.danger }}
            >
              {syncBanner.text}
            </Text>
          </View>
        )}

        {/* Executive KPI Grid */}
        <View className="flex-row flex-wrap justify-between gap-y-2">
          {/* Total Pipeline */}
          <View
            className="w-[48%] rounded-[16px] border p-3 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: colors.kpi.blue.bg,
                  borderColor: colors.kpi.blue.border,
                }}
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
                  Live
                </Text>
              </View>
            </View>
            <Text
              className="mt-2 text-[17px] font-black tracking-tight"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              ₹ {totalPipelineVal}
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Total Pipeline
            </Text>
          </View>

          {/* Weighted Revenue */}
          <View
            className="w-[48%] rounded-[16px] border p-3 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: colors.kpi.green.bg,
                  borderColor: colors.kpi.green.border,
                }}
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
            <Text
              className="mt-2 text-[17px] font-black tracking-tight"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              ₹ {weightedRev}
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Weighted Expected
            </Text>
          </View>

          {/* Win Rate */}
          <View
            className="w-[48%] rounded-[16px] border p-3 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: colors.kpi.amber.bg,
                  borderColor: colors.kpi.amber.border,
                }}
              >
                <Ionicons name="trophy" size={16} color={colors.kpi.amber.text} />
              </View>
              <Text className="text-xs font-bold" style={{ color: colors.kpi.amber.text }}>
                {winRate}%
              </Text>
            </View>
            <Text className="mt-2 text-[17px] font-black" style={{ color: colors.text }}>
              {winRate}%
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Stage Win Rate
            </Text>
          </View>

          {/* Pending Tasks */}
          <View
            className="w-[48%] rounded-[16px] border p-3 shadow-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: colors.kpi.purple.bg,
                  borderColor: colors.kpi.purple.border,
                }}
              >
                <Ionicons name="checkbox" size={16} color={colors.kpi.purple.text} />
              </View>
              <Text className="text-xs font-bold" style={{ color: colors.kpi.purple.text }}>
                {pendingTasksCount} open
              </Text>
            </View>
            <Text className="mt-2 text-[17px] font-black" style={{ color: colors.text }}>
              {pendingTasksCount}
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Follow-ups Due
            </Text>
          </View>
        </View>

        {/* Quick Action Grid */}
        <Text
          className="mt-4 text-[11px] font-black uppercase tracking-wider mb-2"
          style={{ color: colors.textMuted }}
        >
          Quick Sales Operations
        </Text>
        <View className="flex-row flex-wrap justify-between gap-y-2">
          <Pressable
            onPress={() => openCreateDeal()}
            className="w-[31%] items-center justify-center rounded-[16px] border p-2.5 active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold" style={{ color: colors.text }}>
              New Deal
            </Text>
          </Pressable>

          <Pressable
            onPress={openCreateContact}
            className="w-[31%] items-center justify-center rounded-[16px] border p-2.5 active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.success }}
            >
              <Ionicons name="person-add" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold" style={{ color: colors.text }}>
              Add Contact
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openCreateTask()}
            className="w-[31%] items-center justify-center rounded-[16px] border p-2.5 active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.copilot }}
            >
              <Ionicons name="calendar" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold" style={{ color: colors.text }}>
              Add Task
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(modules)/crm/(tabs)/copilot')}
            className="w-[31%] items-center justify-center rounded-[16px] border p-2.5 active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.warning }}
            >
              <Ionicons name="sparkles" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold" style={{ color: colors.text }}>
              AI Copilot
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(modules)/crm/dcr')}
            className="w-[31%] items-center justify-center rounded-[16px] border p-2.5 active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.info }}
            >
              <Ionicons name="call" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold" style={{ color: colors.text }}>
              Activity Center
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSyncWhatsApp}
            disabled={syncingWa}
            className="w-[31%] items-center justify-center rounded-[16px] border p-2.5 active:opacity-75"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.whatsapp }}
            >
              {syncingWa ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="sync" size={16} color="#ffffff" />
              )}
            </View>
            <Text className="mt-1.5 text-[11px] font-bold" style={{ color: colors.text }}>
              Sync WA
            </Text>
          </Pressable>
        </View>

        {/* Top Priority Opportunities */}
        <View className="mt-5 flex-row items-center justify-between mb-2">
          <Text
            className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: colors.textMuted }}
          >
            Top Opportunities ({deals.length})
          </Text>
          <Pressable onPress={() => router.push('/(modules)/crm/(tabs)/pipeline')}>
            <Text className="text-xs font-bold" style={{ color: colors.primaryLight }}>
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
      </ScrollView>
    </AppScreen>
  );
}

