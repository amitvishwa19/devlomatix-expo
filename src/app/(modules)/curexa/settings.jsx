import { Text, View } from 'react-native';

import CurexaModuleShell from '~/components/curexa/CurexaModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const controls = [
  { title: 'Role-based access', description: 'Control permissions for front desk, clinicians, billing, and admin teams.' },
  { title: 'Notification rules', description: 'Define alerts for admissions, missed follow-ups, and CRM escalations.' },
  { title: 'AI policy guardrails', description: 'Set approval boundaries for automated replies and lead recommendations.' }
];

export default function CurexaSettingsScreen() {
  const { palette } = useAppTheme();

  return (
    <CurexaModuleShell
      badge="SETTINGS"
      title="Module controls"
      description="Configure how Curexa operates across hospital teams, communication, and automation.">
      {controls.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.description}</Text>
        </View>
      )}
    </CurexaModuleShell>);
}
