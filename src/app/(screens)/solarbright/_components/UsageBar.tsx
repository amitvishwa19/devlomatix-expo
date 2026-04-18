import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type UsageBarProps = {
  label: string;
  value: string;
  percent: number;
};

export default function UsageBar({ label, value, percent }: UsageBarProps) {
  const { palette } = useAppTheme();

  return (
    <View className="mt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className={`text-xs font-bold uppercase tracking-[1px] ${palette.textMuted}`}>{label}</Text>
        <Text className={`text-xs font-bold ${palette.textSoft}`}>{value}</Text>
      </View>
      <View className={`h-2 rounded-full ${palette.neutralSoft}`}>
        <View
          className="h-2 rounded-full bg-amber-500"
          style={{ width: `${Math.max(8, Math.min(percent, 100))}%` }}
        />
      </View>
    </View>
  );
}
