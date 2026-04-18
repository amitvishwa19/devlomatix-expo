import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

import BackButton from './_components/BackButton';
import FeatureHeader from './_components/FeatureHeader';
import QuickActionCard from './_components/QuickActionCard';
import ReadingCard from './_components/ReadingCard';
import SectionCard from './_components/SectionCard';
import StatCard from './_components/StatCard';
import { formatCurrency, formatUnits } from './_lib/calculations';
import { insights, meterReadings, usageSummary } from './_lib/mock-data';
import type { QuickAction } from '../../../types/solarbright-energy';

const quickActions: QuickAction[] = [
  {
    id: 'capture',
    title: 'Add Meter Reading',
    subtitle: 'Scan, click, or upload the latest meter image',
    icon: 'camera',
    route: './energy-explorer/meter-capture',
  },
  {
    id: 'appliances',
    title: 'Appliances & Insights',
    subtitle: 'Manage appliances and review usage recommendations',
    icon: 'sliders',
    route: './energy-explorer/appliances',
  },
];

export default function EnergyExplorerScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8 pt-5">
          <BackButton />

          <FeatureHeader
            eyebrow="ENERGY EXPLORER"
            title="Track home energy usage end to end"
            description="Design-first utility flow for meter capture, appliance configuration, consumption tracking, and savings insights."
          />

          <View className="mb-4 flex-row gap-2.5">
            <StatCard label="This month" value={formatUnits(usageSummary.currentMonthUnits)} />
            <StatCard label="Projected bill" value={formatCurrency(usageSummary.projectedBill)} />
          </View>

          <View className="mb-4 flex-row gap-2.5">
            <StatCard label="Daily average" value={`${usageSummary.dailyAverage} kWh`} tone="slate" />
            <StatCard label="Peak window" value={usageSummary.peakUsageWindow} tone="slate" />
          </View>

          <SectionCard
            title="Quick actions"
            description="Start with the latest meter reading, then build appliance usage and review insights.">
            <View className="mt-4 flex flex-col gap-2">
              {quickActions.map((action) => (
                <QuickActionCard
                  key={action.id}
                  title={action.title}
                  subtitle={action.subtitle}
                  icon={action.icon}
                  onPress={() => router.push(action.route)}
                />
              ))}
            </View>
          </SectionCard>

          <SectionCard
            title="Latest reading"
            description="Most recent reading captured from the meter with OCR confidence and source.">
            <ReadingCard reading={meterReadings[0]} />
            <Pressable
              className="mt-4 rounded-2xl bg-amber-500 px-4 py-4"
              onPress={() => router.push('./energy-explorer/meter-capture')}>
              <Text className="text-center text-sm font-bold text-white">
                Capture or review reading
              </Text>
            </Pressable>
          </SectionCard>

          <SectionCard
            title="What the app will do"
            description="This UI is prepared for backend work later, but the product flow is already defined.">
            {insights.map((insight) => (
              <View
                key={insight.id}
                className={`mt-4 rounded-2xl p-4 ${
                  insight.tone === 'warning'
                    ? palette.amberSoft
                    : insight.tone === 'positive'
                      ? palette.successSoft
                      : palette.neutralSoft
                }`}>
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
