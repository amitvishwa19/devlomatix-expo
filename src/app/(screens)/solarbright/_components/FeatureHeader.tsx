import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type FeatureHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function FeatureHeader({ eyebrow, title, description }: FeatureHeaderProps) {
  const { palette } = useAppTheme();

  return (
    <View className={`mb-4 rounded-3xl p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
      <Text className="text-xs font-bold uppercase tracking-[1.8px] text-amber-600">
        {eyebrow}
      </Text>
      <Text className={`mt-2.5 text-3xl font-bold leading-[38px] ${palette.text}`}>{title}</Text>
      <Text className={`mt-2.5 text-base leading-6 ${palette.textSoft}`}>{description}</Text>
    </View>
  );
}
