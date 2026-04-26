import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';







export default function SolarBrightTagCard({
  title,
  tag,
  description
}) {
  const { palette } = useAppTheme();

  return (
    <View className={`mt-4 rounded-2xl border p-4 ${palette.border} ${palette.surfaceInset}`}>
      <View className="flex-row items-center justify-between">
        <Text className={`text-base font-bold ${palette.text}`}>{title}</Text>
        <View className="rounded-full bg-amber-500 px-3 py-1.5">
          <Text className="text-xs font-bold uppercase tracking-[1px] text-white">{tag}</Text>
        </View>
      </View>
      <Text className={`mt-3 text-sm leading-6 ${palette.textSoft}`}>{description}</Text>
    </View>);

}