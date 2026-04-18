import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function SectionCard({ title, description, children }: SectionCardProps) {
  const { palette } = useAppTheme();

  return (
    <View className={`mb-4 rounded-3xl p-5 ${palette.surface}`}>
      <Text className={`text-xl font-bold ${palette.text}`}>{title}</Text>
      {description ? (
        <Text className={`mt-2 text-sm leading-6 ${palette.textSoft}`}>{description}</Text>
      ) : null}
      {children}
    </View>
  );
}
