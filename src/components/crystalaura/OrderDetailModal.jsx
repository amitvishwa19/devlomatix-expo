import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import { STATUS_BADGES, STATUS_FLOW } from '~/services/crystalaura/orders';

export default function OrderDetailModal({ visible, onClose, order, onUpdateStatus, onUpdateNotes }) {
  const { palette } = useAppTheme();

  if (!order) return null;

  const badge = STATUS_BADGES[order.status] || STATUS_BADGES.PENDING;
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  const handleAdvance = async () => {
    if (!nextStatus) return;
    await onUpdateStatus(order.id, nextStatus);
    Toast.show({ type: 'success', text1: 'Status updated', text2: `${order.orderNumber} → ${nextStatus}` });
  };

  const handleCancel = async () => {
    await onUpdateStatus(order.id, 'CANCELLED');
    Toast.show({ type: 'info', text1: 'Order cancelled', text2: order.orderNumber });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: palette.colors.page }}>
        <View className="flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: palette.colors.surface }}>
          <View>
            <Text className={`text-[20px] font-bold ${palette.text}`}>{order.orderNumber}</Text>
            <Text className={`text-[12px] ${palette.textSoft}`}>
              {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-[16px] font-bold text-purple-600">Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className={`mb-6 rounded-[20px] border p-5 ${palette.surface} ${palette.border}`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-[16px] font-bold ${palette.text}`}>Status</Text>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: badge.bg }}>
                <Text style={{ color: badge.color, fontSize: 12, fontWeight: '800' }}>{badge.label}</Text>
              </View>
            </View>
            <View className="mb-4 flex-row items-center justify-between">
              {STATUS_FLOW.map((s, i) => {
                const isActive = i <= currentIdx;
                const isCurrent = s === order.status;
                return (
                  <View key={s} className="flex-1 items-center">
                    <View className={`h-3 w-3 rounded-full ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`} />
                    <Text className={`mt-1 text-[8px] ${isCurrent ? 'text-purple-600 font-bold' : isActive ? palette.text : palette.textMuted}`}>
                      {s}
                    </Text>
                  </View>
                );
              })}
            </View>
            {nextStatus ? (
              <TouchableOpacity onPress={handleAdvance}
                className="mb-2 flex-row items-center justify-center gap-2 rounded-xl bg-purple-600 py-3">
                <Ionicons name="arrow-forward" size={16} color="#fff" />
                <Text className="text-[14px] font-bold text-white">Advance to {badge.label}</Text>
              </TouchableOpacity>
            ) : null}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' ? (
              <TouchableOpacity onPress={handleCancel}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3"
                style={{ backgroundColor: 'rgba(220,38,38,0.05)' }}>
                <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
                <Text className="text-[14px] font-bold text-red-500">Cancel Order</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View className={`mb-6 rounded-[20px] border p-5 ${palette.surface} ${palette.border}`}>
            <Text className={`mb-3 text-[16px] font-bold ${palette.text}`}>Customer</Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="person-outline" size={16} color={palette.textMutedColor} />
                <Text className={`text-[14px] ${palette.text}`}>{order.customer?.name}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="mail-outline" size={16} color={palette.textMutedColor} />
                <Text className={`text-[14px] ${palette.text}`}>{order.customer?.email}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="call-outline" size={16} color={palette.textMutedColor} />
                <Text className={`text-[14px] ${palette.text}`}>{order.customer?.phone}</Text>
              </View>
            </View>
          </View>

          <View className={`mb-6 rounded-[20px] border p-5 ${palette.surface} ${palette.border}`}>
            <Text className={`mb-3 text-[16px] font-bold ${palette.text}`}>Shipping Address</Text>
            <Text className={`text-[14px] ${palette.text}`}>
              {order.shippingAddress?.line1}{'\n'}
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
            </Text>
          </View>

          <View className={`mb-6 rounded-[20px] border p-5 ${palette.surface} ${palette.border}`}>
            <Text className={`mb-3 text-[16px] font-bold ${palette.text}`}>Items ({order.items})</Text>
            {order.products?.map((p, i) => (
              <View key={i} className="mb-2 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-[14px] font-semibold ${palette.text}`}>{p.title}</Text>
                  <Text className={`text-[12px] ${palette.textSoft}`}>{p.sku} × {p.quantity}</Text>
                </View>
                <Text className={`text-[15px] font-bold ${palette.text}`}>${(p.price * p.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View className={`my-3 border-t ${palette.border}`} />
            <View className="flex-row items-center justify-between">
              <Text className={`text-[16px] font-bold ${palette.text}`}>Total</Text>
              <Text className="text-[22px] font-bold text-purple-600">${order.totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <View className={`mb-8 rounded-[20px] border p-5 ${palette.surface} ${palette.border}`}>
            <Text className={`mb-3 text-[16px] font-bold ${palette.text}`}>Notes</Text>
            <TextInput
              className="mb-3 rounded-xl border px-4 py-3 text-[14px]"
              style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
              placeholder="Order notes..." placeholderTextColor={palette.textMutedColor}
              defaultValue={order.notes || ''}
              onBlur={(e) => { if (e.nativeEvent.text !== order.notes) onUpdateNotes(order.id, e.nativeEvent.text); }}
              multiline numberOfLines={3} textAlignVertical="top" />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
