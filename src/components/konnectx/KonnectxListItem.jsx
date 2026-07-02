import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

export default function KonnectxListItem({ icon, title, subtitle, onPress, rightElement }) {
  const { palette } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-[20px] p-4"
      style={{ backgroundColor: palette.colors.surface }}>
      {icon ? (
        <View className="mr-4">
          <Ionicons name={icon} size={24} color={palette.iconColor} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className={`text-[16px] font-semibold ${palette.text}`}>{title}</Text>
        {subtitle ? (
          <Text className={`mt-1 text-[13px] ${palette.textSoft}`}>{subtitle}</Text>
        ) : null}
      </View>
      {rightElement ?? (
        <Ionicons name="chevron-forward" size={20} color={palette.textMutedColor} />
      )}
    </Pressable>
  );
}
