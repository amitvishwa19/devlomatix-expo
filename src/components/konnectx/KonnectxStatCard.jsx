import { Text, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

export default function KonnectxStatCard({ label, value, tone = 'bg-sky-500/15' }) {
  const { palette } = useAppTheme();
  return (
    <View className={`flex-1 rounded-[22px] p-4 ${tone}`}>
      <Text className={`text-[26px] font-bold ${palette.text}`}>{value}</Text>
      <Text className={`mt-1.5 text-[13px] leading-[18px] ${palette.textSoft}`}>{label}</Text>
    </View>
  );
}
