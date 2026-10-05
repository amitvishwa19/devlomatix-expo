import React, { useState, useEffect, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';

export default function CrmAnalyticsScreen() {
  const router = useRouter();
  const { workspaceId, forecast, loadForecast, refreshAll } = useCrm();

  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [fRes, lRes] = await Promise.allSettled([
        loadForecast(),
        crmService.getLeaderboard({ workspaceId }),
      ]);
      if (lRes.status === 'fulfilled' && lRes.value?.success) {
        setLeaderboard(lRes.value.data);
      }
    } catch (e) {
      console.warn('Failed to load leaderboard:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, loadForecast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
    refreshAll();
  };

  const summary = forecast?.summary || {};
  const totalVal = (summary.totalPipelineValue || 0).toLocaleString('en-IN');
  const weightedVal = (summary.weightedExpectedRevenue || 0).toLocaleString('en-IN');
  const committedVal = (summary.committedRevenue || 0).toLocaleString('en-IN');
  const bestCaseVal = (summary.bestCaseRevenue || 0).toLocaleString('en-IN');
  const wonVal = (summary.wonRevenue || 0).toLocaleString('en-IN');

  const funnelStages = forecast?.funnelStages || [];
  const reps = leaderboard?.reps || leaderboard?.leaderboard || [];

  return (
    <AppScreen>
      <CrmHeader
        title="Revenue Forecast & Leaderboard"
        subtitle="Probabilistic Analytics & Rep Quotas"
        showBack={true}
        showAnalytics={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="px-4 pt-3.5"
      >
        {/* 4-Tier Scenario Forecast */}
        <Text className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
          4-Tier Probabilistic Scenario Forecast
        </Text>

        <View className="flex-row flex-wrap justify-between gap-y-2.5 mb-4">
          {/* Weighted Expected */}
          <View className="w-[48%] rounded-2xl border border-indigo-200 bg-indigo-50 p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Ionicons name="sparkles" size={16} color="#4f46e5" />
              <Text className="text-[9px] font-bold text-indigo-700">Most Likely</Text>
            </View>
            <Text className="mt-2 text-lg font-black text-indigo-950" numberOfLines={1}>
              ₹ {weightedVal}
            </Text>
            <Text className="text-[10px] font-semibold text-indigo-700 mt-0.5">Weighted Expected</Text>
          </View>

          {/* Committed Floor */}
          <View className="w-[48%] rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Ionicons name="lock-closed" size={16} color="#059669" />
              <Text className="text-[9px] font-bold text-emerald-700">Commit Floor</Text>
            </View>
            <Text className="mt-2 text-lg font-black text-emerald-950" numberOfLines={1}>
              ₹ {committedVal}
            </Text>
            <Text className="text-[10px] font-semibold text-emerald-700 mt-0.5">Committed Floor</Text>
          </View>

          {/* Best-Case Ceiling */}
          <View className="w-[48%] rounded-2xl border border-sky-200 bg-sky-50 p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Ionicons name="rocket" size={16} color="#0284c7" />
              <Text className="text-[9px] font-bold text-sky-700">Upside</Text>
            </View>
            <Text className="mt-2 text-lg font-black text-sky-950" numberOfLines={1}>
              ₹ {bestCaseVal}
            </Text>
            <Text className="text-[10px] font-semibold text-sky-700 mt-0.5">Best-Case Ceiling</Text>
          </View>

          {/* Won Revenue */}
          <View className="w-[48%] rounded-2xl border border-amber-200 bg-amber-50 p-3.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Ionicons name="trophy" size={16} color="#d97706" />
              <Text className="text-[9px] font-bold text-amber-700">Closed</Text>
            </View>
            <Text className="mt-2 text-lg font-black text-amber-950" numberOfLines={1}>
              ₹ {wonVal}
            </Text>
            <Text className="text-[10px] font-semibold text-amber-700 mt-0.5">Closed-Won Actuals</Text>
          </View>
        </View>

        {/* Funnel Stage Conversion Velocity */}
        {funnelStages.length > 0 && (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-4">
            <Text className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Stage Conversion Funnel
            </Text>

            {funnelStages.map((stage) => {
              const valFormatted = (parseFloat(stage.totalValue) || 0).toLocaleString('en-IN');
              return (
                <View key={stage.id} className="mb-2.5">
                  <View className="flex-row justify-between mb-1">
                    <View className="flex-row items-center gap-x-1.5">
                      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color || '#4f46e5' }} />
                      <Text className="text-xs font-bold text-slate-800">{stage.name}</Text>
                      <Text className="text-[10px] text-slate-400">({stage.count} deals)</Text>
                    </View>
                    <Text className="text-xs font-black text-slate-900">₹ {valFormatted}</Text>
                  </View>

                  <View className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(10, stage.probability || 20))}%`,
                        backgroundColor: stage.color || '#4f46e5',
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Team Sales Leaderboard Table */}
        <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-black uppercase tracking-wider text-slate-400">
              Sales Rep Leaderboard
            </Text>
            <View className="rounded-full bg-indigo-50 px-2 py-0.5 border border-indigo-100">
              <Text className="text-[9px] font-bold text-indigo-700">Current Quarter</Text>
            </View>
          </View>

          {reps.length > 0 ? (
            reps.map((rep, idx) => {
              const wonTotal = (parseFloat(rep.wonValue) || 0).toLocaleString('en-IN');
              const quotaAttainment = rep.quota ? Math.round(((rep.wonValue || 0) / rep.quota) * 100) : 75;

              return (
                <View
                  key={rep.repId || idx}
                  className={`flex-row items-center justify-between py-3 ${
                    idx !== 0 ? 'border-t border-slate-100' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-x-3 flex-1">
                    <View
                      className={`h-7 w-7 items-center justify-center rounded-full font-black ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Text className="text-xs font-black">#{idx + 1}</Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-xs font-black text-slate-900" numberOfLines={1}>
                        {rep.name}
                      </Text>
                      <Text className="text-[10px] text-slate-500">{rep.role || 'Account Executive'}</Text>
                    </View>
                  </View>

                  <View className="items-end ml-2">
                    <Text className="text-xs font-black text-emerald-700">₹ {wonTotal}</Text>
                    <Text className="text-[10px] font-bold text-indigo-600">
                      {quotaAttainment}% quota
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-xs text-slate-400 italic py-2">Loading sales representative statistics...</Text>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
