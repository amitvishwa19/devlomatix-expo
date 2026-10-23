import React, { useState, useEffect, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '~/utils/crm/colors';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';

export default function CrmAnalyticsScreen() {
  const router = useRouter();
  const { colors, isDark } = useCrmTheme();
  const { workspaceId, forecast, loadForecast, refreshAll } = useCrm();

  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const generatedAt = new Date().toLocaleString('en-IN');
      const funnelRows = funnelStages
        .map(
          (stage) =>
            `<tr><td>${stage.name || ''}</td><td>${stage.count || 0}</td><td>₹ ${(
              parseFloat(stage.totalValue) || 0
            ).toLocaleString('en-IN')}</td><td>${stage.probability || 0}%</td></tr>`
        )
        .join('');
      const repRows = reps
        .map(
          (rep, idx) =>
            `<tr><td>#${idx + 1}</td><td>${rep.name || ''}</td><td>₹ ${(
              parseFloat(rep.wonValue) || 0
            ).toLocaleString('en-IN')}</td><td>${
              rep.quota ? Math.round(((rep.wonValue || 0) / rep.quota) * 100) : 0
            }%</td></tr>`
        )
        .join('');

      const html = `<!doctype html><html><head><meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Roboto, sans-serif; padding: 28px; color: #0f172a; }
          h1 { font-size: 22px; margin-bottom: 2px; }
          .muted { color: #64748b; font-size: 12px; margin-bottom: 20px; }
          .grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
          .card { width: 46%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
          .label { color: #64748b; font-size: 11px; }
          .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
          h2 { font-size: 14px; margin: 20px 0 8px; text-transform: uppercase; color: #475569; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { text-align: left; padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
          th { color: #64748b; font-size: 10px; text-transform: uppercase; }
        </style></head><body>
          <h1>Revenue Forecast & Leaderboard</h1>
          <div class="muted">Generated ${generatedAt}</div>
          <div class="grid">
            <div class="card"><div class="label">Weighted Expected</div><div class="value">₹ ${weightedVal}</div></div>
            <div class="card"><div class="label">Committed Floor</div><div class="value">₹ ${committedVal}</div></div>
            <div class="card"><div class="label">Best-Case Ceiling</div><div class="value">₹ ${bestCaseVal}</div></div>
            <div class="card"><div class="label">Closed-Won</div><div class="value">₹ ${wonVal}</div></div>
          </div>
          <h2>Stage Conversion Funnel</h2>
          <table><thead><tr><th>Stage</th><th>Deals</th><th>Value</th><th>Probability</th></tr></thead>
          <tbody>${funnelRows || '<tr><td colspan="4">No funnel data</td></tr>'}</tbody></table>
          <h2>Sales Rep Leaderboard</h2>
          <table><thead><tr><th>Rank</th><th>Rep</th><th>Won</th><th>Quota</th></tr></thead>
          <tbody>${repRows || '<tr><td colspan="4">No leaderboard data</td></tr>'}</tbody></table>
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share analytics report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Toast.show({ type: 'success', text1: 'Report generated', text2: uri });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Export failed', text2: e.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title="Revenue Forecast & Leaderboard"
        subtitle="Probabilistic Analytics & Rep Quotas"
        showBack={true}
        showAnalytics={false}
        rightActions={
          <Pressable
            onPress={handleExport}
            disabled={exporting || loading}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1.5 rounded-xl active:opacity-85"
            style={{ backgroundColor: colors.primary, opacity: exporting ? 0.6 : 1 }}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="share-outline" size={15} color="#ffffff" />
            )}
            <Text className="text-xs font-bold text-white">Export PDF</Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        className="px-3 pt-2.5"
      >
        {/* 4-Tier Scenario Forecast */}
        <Text
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: colors.textMuted }}
        >
          4-Tier Probabilistic Scenario Forecast
        </Text>

        <View className="flex-row flex-wrap justify-between gap-y-2 mb-3">
          {/* Weighted Expected */}
          <View
            className="w-[48%] rounded-2xl border p-3 shadow-sm"
            style={{
              backgroundColor: colors.kpi.purple.bg,
              borderColor: colors.kpi.purple.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Ionicons name="sparkles" size={15} color={colors.kpi.purple.text} />
              <Text className="text-[9px] font-bold" style={{ color: colors.kpi.purple.text }}>
                Most Likely
              </Text>
            </View>
            <Text
              className="mt-1.5 text-base font-bold"
              style={{ color: colors.kpi.purple.text }}
              numberOfLines={1}
            >
              ₹ {weightedVal}
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Weighted Expected
            </Text>
          </View>

          {/* Committed Floor */}
          <View
            className="w-[48%] rounded-2xl border p-3 shadow-sm"
            style={{
              backgroundColor: colors.kpi.green.bg,
              borderColor: colors.kpi.green.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Ionicons name="lock-closed" size={15} color={colors.kpi.green.text} />
              <Text className="text-[9px] font-bold" style={{ color: colors.kpi.green.text }}>
                Commit Floor
              </Text>
            </View>
            <Text
              className="mt-1.5 text-base font-bold"
              style={{ color: colors.kpi.green.text }}
              numberOfLines={1}
            >
              ₹ {committedVal}
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Committed Floor
            </Text>
          </View>

          {/* Best-Case Ceiling */}
          <View
            className="w-[48%] rounded-2xl border p-3 shadow-sm"
            style={{
              backgroundColor: colors.kpi.blue.bg,
              borderColor: colors.kpi.blue.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Ionicons name="rocket" size={15} color={colors.kpi.blue.text} />
              <Text className="text-[9px] font-bold" style={{ color: colors.kpi.blue.text }}>
                Upside
              </Text>
            </View>
            <Text
              className="mt-1.5 text-base font-bold"
              style={{ color: colors.kpi.blue.text }}
              numberOfLines={1}
            >
              ₹ {bestCaseVal}
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Best-Case Ceiling
            </Text>
          </View>

          {/* Won Revenue */}
          <View
            className="w-[48%] rounded-2xl border p-3 shadow-sm"
            style={{
              backgroundColor: colors.kpi.amber.bg,
              borderColor: colors.kpi.amber.border,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Ionicons name="trophy" size={15} color={colors.kpi.amber.text} />
              <Text className="text-[9px] font-bold" style={{ color: colors.kpi.amber.text }}>
                Closed
              </Text>
            </View>
            <Text
              className="mt-1.5 text-base font-bold"
              style={{ color: colors.kpi.amber.text }}
              numberOfLines={1}
            >
              ₹ {wonVal}
            </Text>
            <Text className="text-[10px] font-semibold mt-0.5" style={{ color: colors.textMuted }}>
              Closed-Won Actuals
            </Text>
          </View>
        </View>

        {/* Funnel Stage Conversion Velocity */}
        {funnelStages.length > 0 && (
          <View
            className="rounded-2xl border p-3 shadow-sm mb-3"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text
              className="text-xs font-bold uppercase tracking-wider mb-2.5"
              style={{ color: colors.textMuted }}
            >
              Stage Conversion Funnel
            </Text>

            {funnelStages.map((stage) => {
              const valFormatted = (parseFloat(stage.totalValue) || 0).toLocaleString('en-IN');
              return (
                <Pressable
                  key={stage.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/pipeline',
                      params: { stageId: stage.id },
                    })
                  }
                  className="mb-2 active:opacity-70"
                >
                  <View className="flex-row justify-between mb-1">
                    <View className="flex-row items-center gap-x-1.5">
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: stage.color || colors.primary }}
                      />
                      <Text className="text-xs font-bold" style={{ color: colors.text }}>
                        {stage.name}
                      </Text>
                      <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                        ({stage.count} deals)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold" style={{ color: colors.text }}>
                      ₹ {valFormatted}
                    </Text>
                  </View>

                  <View
                    className="h-1.5 w-full rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.cardAlt }}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(10, stage.probability || 20))}%`,
                        backgroundColor: stage.color || colors.primary,
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Team Sales Leaderboard Table */}
        <View
          className="rounded-2xl border p-3 shadow-sm mb-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              Sales Rep Leaderboard
            </Text>
            <View
              className="rounded-full px-2 py-0.5 border"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.primary }}>
                Current Quarter
              </Text>
            </View>
          </View>

          {reps.length > 0 ? (
            reps.map((rep, idx) => {
              const wonTotal = (parseFloat(rep.wonValue) || 0).toLocaleString('en-IN');
              const quotaAttainment = rep.quota ? Math.round(((rep.wonValue || 0) / rep.quota) * 100) : 75;

              return (
                <View
                  key={rep.repId || idx}
                  className="flex-row items-center justify-between py-2.5"
                  style={{
                    borderTopWidth: idx !== 0 ? 1 : 0,
                    borderTopColor: colors.borderLight,
                  }}
                >
                  <View className="flex-row items-center gap-x-2.5 flex-1">
                    <View
                      className="h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: idx === 0 ? colors.warningSoft : colors.cardAlt,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        className="text-[11px] font-bold"
                        style={{
                          color: idx === 0 ? colors.warning : colors.textMuted,
                        }}
                      >
                        #{idx + 1}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-xs font-bold"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {rep.name}
                      </Text>
                      <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                        {rep.role || 'Account Executive'}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end ml-2">
                    <Text className="text-xs font-bold" style={{ color: colors.whatsapp }}>
                      ₹ {wonTotal}
                    </Text>
                    <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                      {quotaAttainment}% quota
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-xs italic py-2" style={{ color: colors.textMuted }}>
              Loading sales representative statistics...
            </Text>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
