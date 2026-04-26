import { Text, View } from 'react-native';

import KonnectXModuleShell from '~/components/konnectx/KonnectXModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const groups = [
  { title: 'Lead segments', meta: 'Organize contacts by source, intent, and readiness to respond.' },
  { title: 'Opt-in records', meta: 'Track consent status for compliant WhatsApp messaging.' },
  { title: 'Shared contact books', meta: 'Expose sales and support teams to the same customer identity.' }
];

export default function KonnectXContactsScreen() {
  const { palette } = useAppTheme();

  return (
    <KonnectXModuleShell
      badge="CONTACTS"
      title="Audience and segmentation"
      description="Keep contact records, tags, and messaging eligibility clean across every WhatsApp number.">
      {groups.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.meta}</Text>
        </View>
      )}
    </KonnectXModuleShell>);
}
