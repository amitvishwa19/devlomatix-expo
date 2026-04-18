import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const apps = [
  { name: 'CRM', description: 'Internal ops, clients, and pipeline coordination.' },
  { name: 'Analytics', description: 'Traffic, conversion, and campaign performance view.' },
  { name: 'Assets', description: 'Shared brand files, exports, and design handoff library.' },
];

export default function AppsScreen() {
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8 pt-5">
          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              APPS
            </Text>
            <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
              Workspace tools
            </Text>
            <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
              Quick access to the internal tools and systems your team uses daily.
            </Text>
          </View>

          {apps.map((item) => (
            <View key={item.name} className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}>
              <Text className={`text-[18px] font-bold ${palette.text}`}>{item.name}</Text>
              <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{item.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
