import { Text, View } from 'react-native';

import KonnectXModuleShell from '~/components/konnectx/KonnectXModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const stats = [
  { label: 'Connected numbers', value: '12', tone: 'bg-sky-500/15' },
  { label: 'Live conversations', value: '184', tone: 'bg-emerald-500/15' },
  { label: 'Automation flows', value: '27', tone: 'bg-amber-500/15' }
];

const highlights = [
  {
    title: 'WhatsApp Cloud API control',
    description: 'Manage templates, routing rules, webhook events, and messaging throughput from one workspace.'
  },
  {
    title: 'Operator + automation layer',
    description: 'Blend live agent response with trigger-based flows for sales, support, and retention.'
  }
];

export default function KonnectXOverviewScreen() {
  const { palette } = useAppTheme();

  return (
    <KonnectXModuleShell
      badge="KONNECTX OVERVIEW"
      title="WhatsApp Cloud API Management"
      description="Messaging operations, campaign delivery, and contact workflows organized in one dedicated module.">
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
    </KonnectXModuleShell>);
}
