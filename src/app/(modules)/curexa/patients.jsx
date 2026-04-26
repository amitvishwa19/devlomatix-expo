import { Text, View } from 'react-native';

import CurexaModuleShell from '~/components/curexa/CurexaModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const queues = [
  { title: 'Emergency intake', meta: '18 arrivals awaiting triage' },
  { title: 'OPD follow-up', meta: '42 patients scheduled for review' },
  { title: 'Inpatient discharge', meta: '9 files pending consultant sign-off' }
];

export default function CurexaPatientsScreen() {
  const { palette } = useAppTheme();

  return (
    <CurexaModuleShell
      badge="PATIENTS"
      title="Patient flow and records"
      description="Track movement from registration to discharge with a cleaner operational queue.">
      {queues.map((item) =>
        <View key={item.title} className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: palette.colors.surface }}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
          <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.meta}</Text>
        </View>
      )}
    </CurexaModuleShell>);
}
