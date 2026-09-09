import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

export default function KonnectxEmptyState({ icon = 'cube-outline', title, description, ctaLabel, onCtaPress }) {
  const { palette } = useAppTheme();

  return (
    <View className="items-center px-8 py-16">
      <Ionicons name={icon} size={64} color={palette.textMutedColor} />
      <Text className={`mt-4 text-[18px] font-bold text-center ${palette.text}`}>{title}</Text>
      {description ? (
        <Text className={`mt-2 text-[14px] text-center leading-5 ${palette.textSoft}`}>{description}</Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Pressable
          onPress={onCtaPress}
          className="mt-6 rounded-full bg-sky-600 px-6 py-3">
          <Text className="text-[15px] font-bold text-white">{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
