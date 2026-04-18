import { Pressable, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandLogo from '~/components/BrandLogo';

const stats = [
  { label: 'Active products', value: '08' },
  { label: 'Tasks in sprint', value: '24' },
  { label: 'Team uptime', value: '99%' },
];

const timeline = [
  { title: 'Client portal redesign', meta: 'In review', dotClassName: 'bg-teal-700' },
  { title: 'Landing page motion pass', meta: 'Ready for QA', dotClassName: 'bg-sky-600' },
  { title: 'Internal CRM module', meta: 'Planning', dotClassName: 'bg-orange-500' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-slate-950" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8 pt-5">
          <View className="mb-4 rounded-[28px] bg-slate-900 p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <BrandLogo variant="home" />
              <Pressable
                className="rounded-full border border-white/15 px-4 py-2.5"
                onPress={() => router.replace('/(auth)/login')}>
                <Text className="text-sm font-semibold text-slate-200">Sign out</Text>
              </Pressable>
            </View>

            <Text className="text-[12px] font-bold uppercase tracking-[1.8px] text-cyan-300">
              DASHBOARD
            </Text>
            <Text className="mt-2.5 text-[32px] font-bold leading-[38px] text-slate-50">
              Your team command center
            </Text>
            <Text className="mt-2.5 text-[15px] leading-6 text-slate-300">
              UI preview for the home screen after login. Use this as the base dashboard shell.
            </Text>
          </View>

          <View className="mb-4 flex-row gap-2.5">
            {stats.map((item) => (
              <View key={item.label} className="flex-1 rounded-[22px] bg-sky-50 p-4">
                <Text className="text-[26px] font-bold text-slate-900">{item.value}</Text>
                <Text className="mt-1.5 text-[13px] leading-[18px] text-slate-600">{item.label}</Text>
              </View>
            ))}
          </View>

          <View className="mb-4 rounded-[24px] bg-white p-5">
            <Text className="mb-3.5 text-[19px] font-bold text-slate-900">Current pipeline</Text>
            {timeline.map((item) => (
              <View key={item.title} className="flex-row items-center py-3">
                <View className={`mr-3.5 h-3 w-3 rounded-full ${item.dotClassName}`} />
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-slate-900">{item.title}</Text>
                  <Text className="mt-1 text-[13px] text-slate-500">{item.meta}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="rounded-[24px] bg-white p-5">
            <Text className="mb-3.5 text-[19px] font-bold text-slate-900">Next actions</Text>
            <View className="rounded-[20px] bg-slate-50 p-4">
              <Text className="text-base font-bold text-slate-900">Profile and settings</Text>
              <Text className="mt-2 text-sm leading-5 text-slate-600">
                Review account preferences, notifications, team access, and workspace identity.
              </Text>
              <Pressable
                className="mt-4 h-[52px] items-center justify-center rounded-2xl bg-teal-700"
                onPress={() => router.push('/profile')}>
                <Text className="text-[15px] font-bold text-slate-50">Open profile</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
