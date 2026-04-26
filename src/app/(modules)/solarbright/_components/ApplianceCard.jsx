
import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

import { applianceShare } from '../_lib/calculations';
import UsageBar from './UsageBar';






export default function ApplianceCard({ appliance, totalUnits }) {
  const share = applianceShare(appliance, totalUnits);
  const { palette } = useAppTheme();

  return (
    <View className={`mt-4 rounded-2xl p-4 ${palette.surfaceInset}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className={`text-base font-bold ${palette.text}`}>{appliance.name}</Text>
          <Text className={`mt-1 text-xs uppercase tracking-[1px] ${palette.textMuted}`}>
            {appliance.category}
          </Text>
        </View>
        <View className="rounded-full bg-amber-500 px-3 py-1.5">
          <Text className="text-xs font-bold uppercase tracking-[1px] text-white">
            {appliance.monthlyUnits} kWh
          </Text>
        </View>
      </View>
      <Text className={`mt-3 text-sm leading-5 ${palette.textSoft}`}>
        {appliance.quantity} unit(s), {appliance.wattage}W, about {appliance.hoursPerDay} hrs/day.
        {` `}{appliance.usagePattern}
      </Text>
      <UsageBar label="Share of monthly usage" value={`${share}%`} percent={share} />
    </View>);

}