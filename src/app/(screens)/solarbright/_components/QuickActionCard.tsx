import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type QuickActionCardProps = {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
};

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: QuickActionCardProps) {
  const { palette } = useAppTheme();

  return (
    <Pressable className={`mb-2 rounded-2xl p-4 ${palette.surfaceInset}`} onPress={onPress}>
      <View className="flex-row items-start">
        <View className={`mr-3 h-11 w-11 items-center justify-center rounded-2xl ${palette.iconCard}`}>
          <FontAwesome name={icon as never} size={18} color={palette.iconColor} />
        </View>
        <View className="flex-1">
          <Text className={`text-base font-bold ${palette.text}`}>{title}</Text>
          <Text className={`mt-1.5 text-sm leading-5 ${palette.textSoft}`}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}
