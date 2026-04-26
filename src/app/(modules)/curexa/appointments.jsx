import { Text, View } from 'react-native';

import CurexaModuleShell from '~/components/curexa/CurexaModuleShell';
import { useAppTheme } from '~/theme/AppTheme';

const schedule = [
  { time: '09:00', title: 'Cardiology OPD', note: '12 patients checked in' },
  { time: '11:30', title: 'MRI slot block', note: '4 diagnostic cases queued' },
  { time: '16:00', title: 'Surgery pre-op review', note: '3 consults awaiting clearance' }
];

export default function CurexaAppointmentsScreen() {
  const { palette } = useAppTheme();

  return (
    <CurexaModuleShell
      badge="VISITS"
      title="Appointments and scheduling"
      description="Coordinate OPD, diagnostics, and procedural planning from one appointment timeline.">
      <View className="rounded-[24px] px-5 py-2" style={{ backgroundColor: palette.colors.surface }}>
        {schedule.map((item, index) =>
          <View
            key={`${item.time}-${item.title}`}
            className={`flex-row items-start py-4 ${index < schedule.length - 1 ? 'border-b' : ''}`}
            style={index < schedule.length - 1 ? { borderColor: palette.colors.border } : undefined}>
            <Text className="mr-4 text-sm font-bold text-emerald-600">{item.time}</Text>
            <View className="flex-1">
              <Text className={`text-[16px] font-bold ${palette.text}`}>{item.title}</Text>
              <Text className={`mt-1 text-[14px] leading-6 ${palette.textSoft}`}>{item.note}</Text>
            </View>
          </View>
        )}
      </View>
    </CurexaModuleShell>);
}
