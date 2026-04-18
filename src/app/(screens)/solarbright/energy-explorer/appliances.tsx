import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

import ApplianceCard from '../_components/ApplianceCard';
import BackButton from '../_components/BackButton';
import FeatureHeader from '../_components/FeatureHeader';
import SectionCard from '../_components/SectionCard';
import StatCard from '../_components/StatCard';
import { formatCurrency, formatUnits, totalApplianceUnits } from '../_lib/calculations';
import { appliances, insights, usageSummary } from '../_lib/mock-data';
import type { ApplianceCategory } from '../../../../types/solarbright-energy';

const applianceCategories: ApplianceCategory[] = [
  'Cooling',
  'Kitchen',
  'Laundry',
  'Lighting',
  'Entertainment',
  'Water',
  'Work',
];

export default function AppliancesScreen() {
  const totalUnits = totalApplianceUnits(appliances);
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8 pt-5">
          <BackButton />
          <FeatureHeader
            eyebrow="APPLIANCES & INSIGHTS"
            title="Manage devices and review savings in one place"
            description="Appliance setup, estimated cost, and usage recommendations now live on a single screen."
          />

          <View className="mb-4 flex-row gap-2.5">
            <StatCard label="Monthly usage" value={formatUnits(usageSummary.currentMonthUnits)} />
            <StatCard label="Estimated bill" value={formatCurrency(usageSummary.projectedBill)} />
          </View>

          <SectionCard
            title="Configured devices"
            description="Appliance inventory and usage contribution stay visible while you edit the setup.">
            {appliances.map((appliance) => (
              <ApplianceCard key={appliance.id} appliance={appliance} totalUnits={totalUnits} />
            ))}
          </SectionCard>

          <SectionCard
            title="Add appliance"
            description="The quick form is now embedded here instead of opening a separate screen.">
            {['Appliance name', 'Wattage', 'Quantity', 'Hours per day'].map((label) => (
              <View key={label} className="mt-4">
                <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-500">
                  {label}
                </Text>
                <TextInput className={`mt-2 rounded-2xl border px-4 py-4 text-base ${palette.border} ${palette.surfaceInset} ${palette.text}`} />
              </View>
            ))}

            <Text className={`mt-4 text-xs font-bold uppercase tracking-[1px] ${palette.textMuted}`}>
              Category
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {applianceCategories.map((category) => (
                <View key={category} className={`rounded-full px-3 py-2 ${palette.amberSoft}`}>
                  <Text className="text-xs font-bold text-amber-700">{category}</Text>
                </View>
              ))}
            </View>

            <Text className={`mt-4 text-xs font-bold uppercase tracking-[1px] ${palette.textMuted}`}>
              Usage pattern
            </Text>
            <TextInput
              multiline
              className={`mt-2 rounded-2xl border px-4 py-4 text-base ${palette.border} ${palette.surfaceInset} ${palette.text}`}
            />
          </SectionCard>

          <SectionCard
            title="Recommendations"
            description="Cost outlook and recommendations are grouped here instead of a separate insights screen.">
            {insights.map((insight) => (
              <View key={insight.id} className={`mt-4 rounded-2xl p-4 ${palette.surfaceInset}`}>
                <Text className={`text-base font-bold ${palette.text}`}>{insight.title}</Text>
                <Text className={`mt-2 text-sm leading-6 ${palette.textSoft}`}>{insight.detail}</Text>
              </View>
            ))}
          </SectionCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
