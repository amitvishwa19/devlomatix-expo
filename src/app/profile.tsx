import { Pressable, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandLogo from '~/components/BrandLogo';

const settingsGroups = [
  { title: 'Workspace email', value: 'hello@devlomatix.com' },
  { title: 'Notifications', value: 'Product updates, comments, mentions' },
  { title: 'Security', value: '2-step verification enabled' },
  { title: 'Subscription', value: 'Studio plan · 12 seats' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8 pt-5">
          <View className="mb-4 rounded-[28px] bg-white p-5 shadow-xl shadow-slate-900/10">
            <View className="flex-row items-center">
              <BrandLogo variant="profile" />
              <View className="ml-3.5 flex-1">
                <Text className="text-xl font-bold text-slate-900">Amit Verma</Text>
                <Text className="mt-1 text-sm text-slate-500">Founder · Product Engineering</Text>
              </View>
            </View>

            <Text className="mt-5 text-3xl font-bold leading-9 text-slate-900">
              Profile & settings
            </Text>
            <Text className="mt-2.5 text-[15px] leading-6 text-slate-600">
              UI preview for account, team, and workspace preferences. Replace the placeholder
              data later.
            </Text>
          </View>

          <View className="rounded-[24px] bg-white px-5">
            {settingsGroups.map((item, index) => (
              <View
                key={item.title}
                className={`py-[18px] ${index < settingsGroups.length - 1 ? 'border-b border-slate-200' : ''}`}>
                <Text className="text-[13px] font-bold uppercase tracking-[0.3px] text-slate-700">
                  {item.title}
                </Text>
                <Text className="mt-2 text-base leading-6 text-slate-900">{item.value}</Text>
              </View>
            ))}
          </View>

          <View className="mt-4">
            <Pressable
              className="h-14 items-center justify-center rounded-2xl bg-teal-700"
              onPress={() => router.replace('/home')}>
              <Text className="text-base font-bold text-slate-50">Back to dashboard</Text>
            </Pressable>

            <Pressable
              className="mt-3 h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white"
              onPress={() => router.replace('/(auth)/login')}>
              <Text className="text-base font-bold text-slate-900">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
