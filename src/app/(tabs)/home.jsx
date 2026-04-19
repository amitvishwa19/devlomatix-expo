import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const stats = [
{ label: 'Active products', value: '08' },
{ label: 'Tasks in sprint', value: '24' },
{ label: 'Team uptime', value: '99%' }];


const timeline = [
{ title: 'Client portal redesign', meta: 'In review', dotClassName: 'bg-teal-700' },
{ title: 'Landing page motion pass', meta: 'Ready for QA', dotClassName: 'bg-sky-600' },
{ title: 'Internal CRM module', meta: 'Planning', dotClassName: 'bg-orange-500' }];


export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        <View className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-teal-700/10" />
        <View className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-sky-500/10" />

        <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
          <View className="px-5 pb-8 pt-5">
            <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
              <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
                DASHBOARD
              </Text>
              <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
                Your team command center
              </Text>
              <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
                UI preview for the home screen after login. Use this as the base dashboard shell.
              </Text>
            </View>

            <View className="mb-4 flex-row gap-2.5">
              {stats.map((item) =>
              <View key={item.label} className={`flex-1 rounded-[22px] p-4 ${palette.skySoft}`}>
                  <Text className={`text-[26px] font-bold ${palette.text}`}>{item.value}</Text>
                  <Text className={`mt-1.5 text-[13px] leading-[18px] ${palette.textSoft}`}>
                    {item.label}
                  </Text>
                </View>
              )}
            </View>

            <View className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}>
              <Text className={`mb-3.5 text-[19px] font-bold ${palette.text}`}>Current pipeline</Text>
              {timeline.map((item) =>
              <View key={item.title} className="flex-row items-center py-3">
                  <View className={`mr-3.5 h-3 w-3 rounded-full ${item.dotClassName}`} />
                  <View className="flex-1">
                    <Text className={`text-[15px] font-semibold ${palette.text}`}>{item.title}</Text>
                    <Text className={`mt-1 text-[13px] ${palette.textMuted}`}>{item.meta}</Text>
                  </View>
                </View>
              )}
            </View>

            <View className={`rounded-[24px] p-5 ${palette.surface}`}>
              <Text className={`mb-3.5 text-[19px] font-bold ${palette.text}`}>Next actions</Text>
              <View className={`rounded-[20px] p-4 ${palette.surfaceInset}`}>
                <Text className={`text-base font-bold ${palette.text}`}>Profile and settings</Text>
                <Text className={`mt-2 text-sm leading-5 ${palette.textSoft}`}>
                  Review account preferences, notifications, team access, and workspace identity.
                </Text>
                <Pressable
                  className="mt-4 h-[52px] items-center justify-center rounded-2xl bg-teal-700"
                  onPress={() => router.push('/(tabs)/account')}>
                  <Text className="text-[15px] font-bold text-slate-50">Open profile</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>);

}