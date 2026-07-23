import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

import { useCrystalAura } from '~/providers/CrystalAuraProvider';
import CrystalAuraStatCard from '~/components/crystalaura/CrystalAuraStatCard';
import { SkeletonStatRow } from '~/components/crystalaura/CrystalAuraLoadingSkeleton';
import * as storesService from '~/services/crystalaura/stores';

export default function CrystalAuraDashboardScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { userId } = useCrystalAura();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await storesService.getStats(userId);
      setStats(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const quickActions = [
    { icon: 'diamond-outline', label: 'Products', route: '/(modules)/crystalaura/(tabs)/products', color: '#9333ea' },
    { icon: 'receipt-outline', label: 'Orders', route: '/(modules)/crystalaura/(tabs)/orders', color: '#0891b2' },
    { icon: 'storefront-outline', label: 'Stores', route: '/(modules)/crystalaura/(tabs)/settings', color: '#16a34a' },
    { icon: 'analytics-outline', label: 'Analytics', route: '/(modules)/crystalaura/(tabs)/settings', color: '#f59e0b' },
  ];

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        <View className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-purple-500/5" />
        <View className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-pink-600/5" />

        <ScrollView
          className={`flex-1 ${palette.page}`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>
          <View className="px-5 pb-32 pt-5">
            <View className={`mb-6 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
              <View className="mb-3 self-start rounded-full bg-purple-600 px-3 py-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">CRYSTAL AURA</Text>
              </View>
              <Text className={`text-[28px] font-bold leading-[34px] ${palette.text}`}>Admin Dashboard</Text>
              <Text className={`mt-2 text-[14px] leading-5 ${palette.textSoft}`}>
                Manage your e-commerce stores, products, orders, and view business analytics.
              </Text>
            </View>

            {loading ? (
              <SkeletonStatRow />
            ) : stats ? (
              <View className="mb-6 flex-row flex-wrap gap-2.5">
                <View className="w-[48%]">
                  <CrystalAuraStatCard label="Total Revenue" value={`$${(stats.revenue?.total || 0).toFixed(0)}`} tone="bg-purple-500/15" />
                </View>
                <View className="w-[48%]">
                  <CrystalAuraStatCard label="Orders" value={String(stats.orders?.total || 0)} tone="bg-pink-500/15" />
                </View>
                <View className="w-[48%]">
                  <CrystalAuraStatCard label="Products" value={String(stats.products?.active || 0)} tone="bg-indigo-500/15" />
                </View>
                <View className="w-[48%]">
                  <CrystalAuraStatCard label="Stores" value={String(stats.stores?.connected || 0)} tone="bg-amber-500/15" />
                </View>
              </View>
            ) : null}

            <View className="mb-6 flex-row flex-wrap gap-3">
              {quickActions.map((item) => (
                <TouchableOpacity key={item.label} onPress={() => router.push(item.route)}
                  className={`w-[47%] flex-row items-center gap-3 rounded-[16px] border px-4 py-4 ${palette.surface} ${palette.border}`}>
                  <View className="rounded-xl p-2.5" style={{ backgroundColor: `${item.color}15` }}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text className={`text-[14px] font-bold ${palette.text}`}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className={`rounded-[24px] border p-5 ${palette.surface} ${palette.border}`}>
              <Text className={`mb-3 text-[16px] font-bold ${palette.text}`}>Pending Orders</Text>
              {stats?.orders?.pending > 0 ? (
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                    <Text className="text-[20px] font-bold text-amber-600">{stats.orders.pending}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[14px] ${palette.text}`}>Orders need processing</Text>
                    <TouchableOpacity onPress={() => router.push('/(modules)/crystalaura/(tabs)/orders')}>
                      <Text className="text-[13px] font-bold text-purple-600 mt-1">View Orders →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text className={`text-[14px] ${palette.textSoft}`}>All caught up! No pending orders.</Text>
              )}
            </View>

            {stats?.products?.lowStock > 0 ? (
              <View className={`mt-4 rounded-[24px] border p-5 ${palette.surface} ${palette.border}`}>
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                    <Ionicons name="warning-outline" size={22} color="#dc2626" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[14px] font-bold ${palette.text}`}>{stats.products.lowStock} products low in stock</Text>
                    <TouchableOpacity onPress={() => router.push('/(modules)/crystalaura/(tabs)/products')}>
                      <Text className="text-[13px] font-bold text-purple-600 mt-1">Manage Inventory →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
