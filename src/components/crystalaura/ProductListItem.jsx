import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function ProductListItem({ product, onPress, onDelete }) {
  const { palette } = useAppTheme();

  return (
    <Pressable onPress={() => onPress?.(product)}
      className="mb-3 rounded-[20px] border p-4"
      style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
      <View className="flex-row gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-xl bg-purple-500/10">
          <Image source={{ uri: product.imageUrl }} className="h-full w-full rounded-xl" resizeMode="cover" />
        </View>
        <View className="flex-1 justify-between">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className={`text-[15px] font-bold ${palette.text}`} numberOfLines={1}>{product.title}</Text>
              <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`}>{product.sku || product.id}</Text>
            </View>
            <View className={`rounded-full px-2 py-0.5 ${product.status === 'ACTIVE' ? 'bg-green-500/15' : 'bg-amber-500/15'}`}>
              <Text className={`text-[9px] font-bold ${product.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}`}>
                {product.status || 'DRAFT'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between mt-1.5">
            <View className="flex-row items-center gap-3">
              <Text className="text-[17px] font-bold text-purple-600">${product.price.toFixed(2)}</Text>
              {product.compareAt ? (
                <Text className="text-[12px] text-gray-400 line-through">${product.compareAt.toFixed(2)}</Text>
              ) : null}
            </View>
            <View className="flex-row items-center gap-2">
              <Text className={`text-[11px] ${product.inventoryCount > 10 ? 'text-green-600' : 'text-red-500'}`}>
                {product.inventoryCount} in stock
              </Text>
              <Pressable onPress={() => onDelete?.(product)} className="p-1">
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
