import { Text, View } from 'react-native';

import KonnectXModuleShell from '~/components/konnectx/KonnectXModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const controls = [
  { title: 'API credentials', description: 'Manage tokens, phone number bindings, and webhook signing settings.' },
  { title: 'Team routing rules', description: 'Assign chat ownership, escalation paths, and queue behavior.' },
  { title: 'Compliance controls', description: 'Set template access, retention policy, and messaging guardrails.' }
];

export default function KonnectXSettingsScreen() {
  const { palette } = useAppTheme();

  return (
    <KonnectXModuleShell
      badge="SETTINGS"
      title="Module controls"
      description="Configure Cloud API access, operator workflow, and messaging governance for KonnectX.">
      {controls.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.description}</Text>
        </View>
      )}
    </KonnectXModuleShell>);
}
