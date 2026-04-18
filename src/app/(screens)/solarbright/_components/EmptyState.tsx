import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
};

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  const { palette } = useAppTheme();

  return (
    <View className={`mt-4 items-center rounded-2xl px-5 py-8 ${palette.surfaceInset}`}>
      <View className={`h-14 w-14 items-center justify-center rounded-full ${palette.iconCard}`}>
        <FontAwesome name={icon as never} size={20} color={palette.iconColor} />
      </View>
      <Text className={`mt-4 text-lg font-bold ${palette.text}`}>{title}</Text>
      <Text className={`mt-2 text-center text-sm leading-6 ${palette.textSoft}`}>{description}</Text>
    </View>
  );
}
