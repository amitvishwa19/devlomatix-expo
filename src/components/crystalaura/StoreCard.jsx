import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function StoreCard({ store, onSync, onDisconnect }) {
  const { palette } = useAppTheme();
  const isConnected = store.status === 'connected';
  const platformColor = store.platform === 'shopify' ? '#96bf48' : '#a46497';

  return (
    <View className="mb-3 rounded-[20px] border p-4"
      style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${platformColor}20` }}>
            <Ionicons name={store.platform === 'shopify' ? 'bag-handle' : 'cart'} size={20} color={platformColor} />
          </View>
          <View>
            <Text className={`text-[16px] font-bold ${palette.text}`}>{store.name}</Text>
            <Text className={`text-[11px] ${palette.textSoft}`}>{store.storeUrl}</Text>
          </View>
        </View>
        <View className={`rounded-full px-2.5 py-0.5 ${isConnected ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
          <Text className={`text-[10px] font-bold ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {isConnected ? (
        <>
          <View className="mb-3 flex-row gap-4">
            <View className="flex-1 items-center rounded-xl bg-purple-500/10 py-2.5">
              <Text className="text-[16px] font-bold text-purple-600">{store.totalProducts}</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Products</Text>
            </View>
            <View className="flex-1 items-center rounded-xl bg-purple-500/10 py-2.5">
              <Text className="text-[16px] font-bold text-purple-600">{store.totalOrders}</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Orders</Text>
            </View>
            <View className="flex-1 items-center rounded-xl bg-purple-500/10 py-2.5">
              <Text className="text-[16px] font-bold text-purple-600">${store.totalRevenue?.toFixed(0)}</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Revenue</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <Pressable onPress={() => onSync?.(store)}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5"
              style={{ borderColor: palette.colors.border }}>
              <Ionicons name="sync-outline" size={15} color={palette.textColor} />
              <Text className={`text-[12px] font-bold ${palette.text}`}>Sync</Text>
            </Pressable>
            <Pressable onPress={() => onDisconnect?.(store)}
              className="flex-row items-center justify-center gap-1.5 rounded-xl border border-red-500/20 px-4 py-2.5"
              style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
              <Ionicons name="link-outline" size={15} color="#dc2626" />
              <Text className="text-[12px] font-bold text-red-500">Disconnect</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View className="items-center py-3">
          <Text className={`text-[13px] ${palette.textSoft}`}>Store disconnected. Reconnect to sync data.</Text>
        </View>
      )}

      {store.lastSync ? (
        <Text className={`mt-2 text-[10px] ${palette.textMuted}`}>
          Last synced: {new Date(store.lastSync).toLocaleString()}
        </Text>
      ) : null}
    </View>
  );
}
