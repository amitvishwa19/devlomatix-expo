import { Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';
import { STATUS_BADGES } from '~/services/crystalaura/orders';

export default function OrderCard({ order, onPress }) {
  const { palette } = useAppTheme();
  const badge = STATUS_BADGES[order.status] || STATUS_BADGES.PENDING;

  return (
    <TouchableOpacity onPress={() => onPress(order)}
      className="mb-3 rounded-[20px] border p-4"
      style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-[14px] font-bold ${palette.text}`}>{order.orderNumber}</Text>
        <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: badge.bg }}>
          <Text style={{ color: badge.color, fontSize: 10, fontWeight: '800' }}>{badge.label}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className={`text-[13px] ${palette.text}`}>{order.customer?.name || 'Unknown'}</Text>
        <Text className="text-[17px] font-bold text-purple-600">${order.totalAmount.toFixed(2)}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className={`text-[11px] ${palette.textSoft}`}>
          {order.items} item{order.items !== 1 ? 's' : ''}
        </Text>
        <Text className={`text-[11px] ${palette.textMuted}`}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
