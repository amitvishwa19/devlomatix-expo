import { Text, View } from 'react-native';

import CurexaModuleShell from '~/components/curexa/CurexaModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const campaigns = [
  {
    title: 'Lead scoring',
    description: 'Prioritize hospital inquiries from campaigns, partnerships, and referral desks.'
  },
  {
    title: 'AI follow-up drafts',
    description: 'Draft reminder sequences for appointments, diagnostics, and retention messaging.'
  },
  {
    title: 'Revenue recovery',
    description: 'Re-engage dropped consultations and pending package conversions with CRM automations.'
  }
];

export default function CurexaCrmScreen() {
  const { palette } = useAppTheme();

  return (
    <CurexaModuleShell
      badge="AI CRM"
      title="Engagement and conversion engine"
      description="CRM workflows prepared for lead nurture, appointment recovery, and automated patient communication.">
      {campaigns.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.description}</Text>
        </View>
      )}
    </CurexaModuleShell>);
}
