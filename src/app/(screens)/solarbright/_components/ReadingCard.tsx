import type { MeterReading } from '../../../../types/solarbright-energy';
import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

type ReadingCardProps = {
  reading: MeterReading;
};

export default function ReadingCard({ reading }: ReadingCardProps) {
  const { palette } = useAppTheme();

  return (
    <View className={`mt-4 rounded-2xl p-4 ${palette.surfaceInset}`}>
      <View className="flex-row items-center justify-between">
        <Text className={`text-lg font-bold ${palette.text}`}>{reading.reading}</Text>
        <View className={`rounded-full px-3 py-1.5 ${palette.surface}`}>
          <Text className="text-xs font-bold uppercase tracking-[1px] text-amber-600">
            {reading.confidence}% confidence
          </Text>
        </View>
      </View>
      <Text className={`mt-2 text-sm leading-5 ${palette.textSoft}`}>{reading.recordedAt}</Text>
      <Text className={`mt-1 text-xs uppercase tracking-[1px] ${palette.textMuted}`}>
        {reading.source} capture
      </Text>
      {reading.note ? (
        <Text className={`mt-3 text-sm leading-5 ${palette.textSoft}`}>{reading.note}</Text>
      ) : null}
    </View>
  );
}
