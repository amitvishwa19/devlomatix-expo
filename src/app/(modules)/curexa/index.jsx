import { Text, View } from 'react-native';

import CurexaModuleShell from '~/components/curexa/CurexaModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const stats = [
  { label: 'Active beds', value: '218', tone: 'bg-emerald-500/15' },
  { label: "Today's appointments", value: '146', tone: 'bg-sky-500/15' },
  { label: 'CRM automations', value: '32', tone: 'bg-amber-500/15' }
];

const highlights = [
  {
    title: 'Unified patient operations',
    description: 'Admissions, EMR access, billing, and care coordination remain in one workflow.'
  },
  {
    title: 'AI-assisted CRM',
    description: 'Lead routing, follow-ups, and retention cues are prepared for an AI sales and support layer.'
  }
];

export default function CurexaOverviewScreen() {
  const { palette } = useAppTheme();

  return (
    <CurexaModuleShell
      badge="CUREXA OVERVIEW"
      title="Complete Hospital Management System"
      description="Hospital operations, patient lifecycle, and AI powered CRM workflows in one dedicated module.">
      <View className="mb-4 flex-row gap-2.5">
        {stats.map((item) =>
          <View key={item.label} className={`flex-1 rounded-[22px] p-4 ${item.tone}`}>
            <Text className={`text-[26px] font-bold ${palette.text}`}>{item.value}</Text>
            <Text className={`mt-1.5 text-[13px] leading-[18px] ${palette.textSoft}`}>
              {item.label}
            </Text>
          </View>
        )}
      </View>

      {highlights.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.description}</Text>
        </View>
      )}
    </CurexaModuleShell>);
}
