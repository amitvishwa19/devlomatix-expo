import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type SolarBrightSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SolarBrightSection({ title, children }: SolarBrightSectionProps) {
  const { palette } = useAppTheme();

  return (
    <View className={`mb-4 rounded-3xl p-5 ${palette.surface}`}>
      <Text className={`text-xl font-bold ${palette.text}`}>{title}</Text>
      {children}
    </View>
  );
}
