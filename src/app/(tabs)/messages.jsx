import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const notifications = [
  { module: 'KonnectX', title: 'Template approved', time: '2 min ago', color: '#0284c7' },
  { module: 'Curexa', title: 'New patient appointment', time: '15 min ago', color: '#059669' },
  { module: 'KonnectX', title: 'Campaign completed', time: '1 hr ago', color: '#0284c7' },
  { module: 'SolarBright', title: 'Energy report ready', time: '3 hrs ago', color: '#d97706' },
  { module: 'Curexa', title: 'Prescription updated', time: '5 hrs ago', color: '#059669' },
];

export default function MessagesScreen() {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-28 pt-5">
          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              INBOX
            </Text>
            <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
              Messages
            </Text>
            <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
              Notifications and updates from across your workspace.
            </Text>
          </View>

          {notifications.map((item, idx) => (
            <View key={idx} className={`mb-3 rounded-[24px] p-4 flex-row items-center gap-4 ${palette.surface}`}>
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${item.color}20` }}>
                <Text className="text-[10px] font-bold uppercase" style={{ color: item.color }}>
                  {item.module.substring(0, 2)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`text-[15px] font-bold ${palette.text}`}>{item.title}</Text>
                <Text className={`mt-0.5 text-[12px] ${palette.textSoft}`}>{item.module} · {item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
