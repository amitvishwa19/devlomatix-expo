import { Text, View } from 'react-native';

import KonnectXModuleShell from '~/components/konnectx/KonnectXModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const campaigns = [
  {
    title: 'Broadcast scheduling',
    description: 'Plan message blasts, campaign timing, and template usage across verified numbers.'
  },
  {
    title: 'Template performance',
    description: 'Track approval status, delivery quality, and click intent for each campaign flow.'
  },
  {
    title: 'Re-engagement automations',
    description: 'Recover dropped leads with triggered sequences built on Cloud API events.'
  }
];

export default function KonnectXCampaignsScreen() {
  const { palette } = useAppTheme();

  return (
    <KonnectXModuleShell
      badge="CAMPAIGNS"
      title="Broadcasts and automation"
      description="Coordinate outreach, approved templates, and conversion messaging in one campaign layer.">
      {campaigns.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.description}</Text>
        </View>
      )}
    </KonnectXModuleShell>);
}
