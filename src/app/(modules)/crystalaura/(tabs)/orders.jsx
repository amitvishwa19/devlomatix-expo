import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

import { useCrystalAura } from '~/providers/CrystalAuraProvider';
import CrystalAuraEmptyState from '~/components/crystalaura/CrystalAuraEmptyState';
import OrderCard from '~/components/crystalaura/OrderCard';
import OrderDetailModal from '~/components/crystalaura/OrderDetailModal';
import { SkeletonCard } from '~/components/crystalaura/CrystalAuraLoadingSkeleton';
import * as ordersService from '~/services/crystalaura/orders';
import { STATUS_BADGES } from '~/services/crystalaura/orders';

const FILTERS = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function CrystalAuraOrdersScreen() {
  const { palette } = useAppTheme();
  const { userId } = useCrystalAura();

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await ordersService.getOrders(userId, { status: filter });
      setOrders(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await ordersService.updateOrderStatus(userId, orderId, newStatus);
      setSelectedOrder((prev) => prev?.id === orderId ? { ...prev, status: newStatus } : prev);
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const handleUpdateNotes = async (orderId, notes) => {
    try {
      await ordersService.updateOrderNotes(userId, orderId, notes);
      Toast.show({ type: 'success', text1: 'Notes updated' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className="flex-1 px-4 pt-5">
        <View className="mb-4">
          <View className="mb-2 self-start rounded-full bg-purple-600 px-3 py-1.5">
            <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">ORDERS</Text>
          </View>
          <Text className="text-[28px] font-bold" style={{ color: palette.textColor }}>Order Management</Text>
          <Text className={`mt-1 text-[13px] ${palette.textSoft}`}>
            {orders.length} orders{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
          </Text>
        </View>

        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          className="mb-4"
          renderItem={({ item }) => {
            const badge = item === 'ALL' ? null : STATUS_BADGES[item];
            return (
              <TouchableOpacity onPress={() => setFilter(item)}
                className={`mr-2 rounded-xl px-4 py-2 ${filter === item ? 'bg-purple-600' : 'border'}`}
                style={filter !== item ? { borderColor: palette.colors.border } : {}}>
                <Text className={`text-[13px] font-semibold ${filter === item ? 'text-white' : palette.text}`}>
                  {item === 'ALL' ? 'All' : badge?.label || item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}
          ListEmptyComponent={
            loading ? (
              <><SkeletonCard /><SkeletonCard /></>
            ) : (
              <CrystalAuraEmptyState icon="receipt-outline" title="No orders"
                description={filter !== 'ALL' ? 'No orders with this status.' : 'No orders yet.'} />
            )
          }
          renderItem={({ item }) => <OrderCard order={item} onPress={setSelectedOrder} />}
        />
      </View>

      <OrderDetailModal
        visible={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes} />
    </SafeAreaView>
  );
}
