import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import DealCard from '../_components/DealCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateDealModal from '../_components/CreateDealModal';
import CreateContactModal from '../_components/CreateContactModal';
import CreateTaskModal from '../_components/CreateTaskModal';
import * as crmService from '~/services/crm';

export default function CrmDashboard() {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <CrmHeader title="DevX CRM" subtitle="Revenue Engine & Copilot" />

      {/* Global Modals */}
      <QuickWhatsAppModal />
      <CreateDealModal />
      <CreateContactModal />
      <CreateTaskModal />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        className="px-4 pt-3.5"
      >
        {/* Sync WhatsApp Banner */}
        {syncBanner && (
          <View
            className={`mb-3.5 rounded-2xl p-3.5 border ${
              syncBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}
          >
            <Text
              className={`text-xs font-bold text-center ${
                syncBanner.type === 'success' ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {syncBanner.text}
            </Text>
          </View>
        )}

        {/* Executive KPI Grid */}
        <View className="flex-row flex-wrap justify-between gap-y-2.5">
          {/* Total Pipeline */}
          <View className="w-[48.5%] rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100">
                <Ionicons name="pie-chart" size={16} color="#4f46e5" />
              </View>
              <View className="rounded-full bg-indigo-50 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-indigo-700">Live</Text>
              </View>
            </View>
            <Text className="mt-2.5 text-lg font-black text-slate-900" numberOfLines={1}>
              ₹ {totalPipelineVal}
            </Text>
            <Text className="text-[10px] font-semibold text-slate-500 mt-0.5">Total Pipeline</Text>
          </View>

          {/* Weighted Revenue */}
          <View className="w-[48.5%] rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
                <Ionicons name="trending-up" size={16} color="#059669" />
              </View>
              <View className="rounded-full bg-emerald-50 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-emerald-700">Forecast</Text>
              </View>
            </View>
            <Text className="mt-2.5 text-lg font-black text-slate-900" numberOfLines={1}>
              ₹ {weightedRev}
            </Text>
            <Text className="text-[10px] font-semibold text-slate-500 mt-0.5">Weighted Expected</Text>
          </View>

          {/* Win Rate */}
          <View className="w-[48.5%] rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
                <Ionicons name="trophy" size={16} color="#d97706" />
              </View>
              <Text className="text-xs font-bold text-amber-700">{winRate}%</Text>
            </View>
            <Text className="mt-2.5 text-lg font-black text-slate-900">{winRate}%</Text>
            <Text className="text-[10px] font-semibold text-slate-500 mt-0.5">Stage Win Rate</Text>
          </View>

          {/* Pending Tasks */}
          <View className="w-[48.5%] rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-purple-50 border border-purple-100">
                <Ionicons name="checkbox" size={16} color="#7c3aed" />
              </View>
              <Text className="text-xs font-bold text-purple-700">{pendingTasksCount} open</Text>
            </View>
            <Text className="mt-2.5 text-lg font-black text-slate-900">{pendingTasksCount}</Text>
            <Text className="text-[10px] font-semibold text-slate-500 mt-0.5">Follow-ups Due</Text>
          </View>
        </View>

        {/* Quick Action Grid */}
        <Text className="mt-5 text-xs font-black uppercase tracking-wider text-slate-400">
          Quick Sales Operations
        </Text>
        <View className="mt-2 flex-row flex-wrap justify-between gap-y-2">
          <Pressable
            onPress={() => openCreateDeal()}
            className="w-[31.5%] items-center justify-center rounded-2xl border border-indigo-200/90 bg-indigo-50/60 p-3 active:bg-indigo-100/70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Ionicons name="add" size={18} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold text-indigo-950">New Deal</Text>
          </Pressable>

          <Pressable
            onPress={openCreateContact}
            className="w-[31.5%] items-center justify-center rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-3 active:bg-emerald-100/70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
              <Ionicons name="person-add" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold text-emerald-950">Add Contact</Text>
          </Pressable>

          <Pressable
            onPress={() => openCreateTask()}
            className="w-[31.5%] items-center justify-center rounded-2xl border border-purple-200/90 bg-purple-50/60 p-3 active:bg-purple-100/70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-purple-600">
              <Ionicons name="calendar" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold text-purple-950">Add Task</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(modules)/crm/(tabs)/copilot')}
            className="w-[31.5%] items-center justify-center rounded-2xl border border-amber-200/90 bg-amber-50/60 p-3 active:bg-amber-100/70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-600">
              <Ionicons name="sparkles" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold text-amber-950">AI Copilot</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(modules)/crm/analytics')}
            className="w-[31.5%] items-center justify-center rounded-2xl border border-sky-200/90 bg-sky-50/60 p-3 active:bg-sky-100/70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-sky-600">
              <Ionicons name="bar-chart" size={16} color="#ffffff" />
            </View>
            <Text className="mt-1.5 text-[11px] font-bold text-sky-950">Leaderboard</Text>
          </Pressable>

          <Pressable
            onPress={handleSyncWhatsApp}
            disabled={syncingWa}
            className="w-[31.5%] items-center justify-center rounded-2xl border border-teal-200/90 bg-teal-50/60 p-3 active:bg-teal-100/70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-teal-600">
              {syncingWa ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="sync" size={16} color="#ffffff" />
              )}
            </View>
            <Text className="mt-1.5 text-[11px] font-bold text-teal-950">Sync WA</Text>
          </Pressable>
        </View>

        {/* Top Priority Opportunities */}
        <View className="mt-6 flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-slate-400">
            Top Opportunities ({deals.length})
          </Text>
          <Pressable onPress={() => router.push('/(modules)/crm/(tabs)/pipeline')}>
            <Text className="text-xs font-bold text-indigo-600">View Pipeline →</Text>
          </Pressable>
        </View>

        {loading && deals.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-xs text-slate-400 font-semibold mt-2">Loading CRM intelligence...</Text>
          </View>
        ) : topDeals.length > 0 ? (
          topDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <View className="rounded-2xl border border-dashed border-slate-300 p-8 items-center justify-center bg-white">
            <Ionicons name="briefcase-outline" size={32} color="#94a3b8" />
            <Text className="text-sm font-bold text-slate-700 mt-2">No Deals in Pipeline</Text>
            <Text className="text-xs text-slate-400 text-center mt-1">
              Create your first sales deal or import leads from WhatsApp.
            </Text>
            <Pressable
              onPress={() => openCreateDeal()}
              className="mt-3.5 rounded-xl bg-indigo-600 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">+ Create Deal</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
