import Ionicons from '@expo/vector-icons/Ionicons';

import { Text, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

export default function KonnectxStatCard({ label, value, tone = 'bg-sky-500/15', icon, iconColor = '#0284c7', hint }) {
  const { palette } = useAppTheme();
  return (
    <View className="flex-1 rounded-[22px] p-4">
      <View className={`absolute inset-0 rounded-[22px] ${tone}`} />
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[24px] font-bold" style={{ color: palette.textColor }}>{value}</Text>
          <Text className={`mt-1 text-[13px] leading-[18px] ${palette.textSoft}`}>{label}</Text>
          {hint ? <Text className={`mt-1 text-[11px] ${palette.textMuted}`}>{hint}</Text> : null}
        </View>
        {icon ? (
          <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${iconColor}1a` }}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
        ) : null}
      </View>
    </View>
  );
}