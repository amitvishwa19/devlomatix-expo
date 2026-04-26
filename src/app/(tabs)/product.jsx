import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const productCards = [
{
  title: 'Studio website',
  stage: 'In build',
  accentClassName: 'bg-teal-600'
},
{
  title: 'Founder portal',
  stage: 'Research',
  accentClassName: 'bg-orange-500'
},
{
  title: 'Client onboarding',
  stage: 'Ready for QA',
  accentClassName: 'bg-sky-600'
}];


export default function ProductScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-28 pt-5">
          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              PRODUCT
            </Text>
            <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
              Product roadmap
            </Text>
            <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
              Track active product work, release state, and current delivery momentum.
            </Text>
          </View>

          {productCards.map((item) =>
          <View key={item.title} className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-[18px] font-bold ${palette.text}`}>{item.title}</Text>
                <View className={`rounded-full px-3 py-1.5 ${item.accentClassName}`}>
                  <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">
                    {item.stage}
                  </Text>
                </View>
              </View>
              <Text className={`mt-3 text-[14px] leading-6 ${palette.textSoft}`}>
                Clear scope, visible milestones, and tighter handoff across design, build, and QA.
              </Text>
            </View>
          )}

          <Pressable
            className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}
            onPress={() => router.push('../solarbright')}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-[18px] font-bold ${palette.text}`}>SolarBright</Text>
              <View className="rounded-full bg-amber-500 px-3 py-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">
                  Explore SolarBright
                </Text>
              </View>
            </View>
            <Text className={`mt-3 text-[14px] leading-6 ${palette.textSoft}`}>
              Explore the SolarBright concept screen for a clean-energy product workflow.
            </Text>
          </Pressable>

          <Pressable
            className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}
            onPress={() => router.push('/(modules)/curexa')}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-[18px] font-bold ${palette.text}`}>Curexa</Text>
              <View className="rounded-full border border-emerald-700/20 bg-emerald-600 px-3 py-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">
                  Hospital Platform
                </Text>
              </View>
            </View>
            <Text className={`mt-3 text-[14px] leading-6 ${palette.textSoft}`}>
              Complete Hospital Management System with AI powered CRM.
            </Text>
          </Pressable>

          <Pressable
            className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}
            onPress={() => router.push('/(modules)/konnectx')}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-[18px] font-bold ${palette.text}`}>KonnectX</Text>
              <View className="rounded-full border border-sky-700/20 bg-sky-600 px-3 py-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">
                  WhatsApp Platform
                </Text>
              </View>
            </View>
            <Text className={`mt-3 text-[14px] leading-6 ${palette.textSoft}`}>
              WhatsApp Cloud API management app.
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>);

}
