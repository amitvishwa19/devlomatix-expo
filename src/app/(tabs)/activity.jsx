import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const activities = [
  { icon: 'chatbubble', text: 'KonnectX campaign sent to 1,240 contacts', time: '10 min ago', color: '#0284c7' },
  { icon: 'medkit', text: 'Curexa appointment confirmed for John D.', time: '25 min ago', color: '#059669' },
  { icon: 'flash', text: 'SolarBright usage report generated', time: '1 hr ago', color: '#d97706' },
  { icon: 'people', text: 'New team member joined workspace', time: '2 hrs ago', color: '#8b5cf6' },
  { icon: 'chatbubble', text: 'WhatsApp template approved by Meta', time: '4 hrs ago', color: '#0284c7' },
  { icon: 'medkit', text: 'Prescription refill requested', time: '6 hrs ago', color: '#059669' },
  { icon: 'documents', text: 'Campaign analytics exported', time: '1 day ago', color: '#6b7280' },
];

export default function ActivityScreen() {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-28 pt-5">
          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              RECENT
            </Text>
            <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
              Activity
            </Text>
            <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
              Cross-module audit trail of key events and actions.
            </Text>
          </View>

          {activities.map((item, idx) => (
            <View key={idx} className={`mb-3 rounded-[24px] p-4 flex-row items-center gap-4 ${palette.surface}`}>
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${item.color}15` }}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className={`text-[14px] leading-5 ${palette.text}`}>{item.text}</Text>
                <Text className={`mt-1 text-[11px] ${palette.textSoft}`}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
