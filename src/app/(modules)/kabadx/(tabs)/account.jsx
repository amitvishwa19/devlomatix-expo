import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

export default function KabadxAccountScreen() {
  const { palette, isDark, toggleTheme } = useAppTheme();
  const router = useRouter();

  const accountOptions = [
    {
      title: 'Saved Pickup Addresses',
      subtitle: '202-10, Rajeshwer Planet, Harni Road, Vadodara (Home)',
      icon: 'location-outline',
      action: () => Toast.show({ type: 'info', text1: 'Saved Addresses', text2: '2 addresses saved for fast booking' }),
    },
    {
      title: 'Refer & Earn ₹50 Bonus 🎁',
      subtitle: 'Code: KABADX-VAD-402 (Share with neighbors)',
      icon: 'gift-outline',
      action: () => Toast.show({ type: 'success', text1: 'Referral Code Copied!', text2: 'Share KABADX-VAD-402 with friends for ₹50 cash' }),
    },
    {
      title: 'Show My Instant UPI QR Code',
      subtitle: 'GPay • 9871234567@okaxis (Collector Scan)',
      icon: 'qr-code-outline',
      action: () => router.push('/(modules)/kabadx/collectors'),
    },
    {
      title: 'Green Citizen Eco Certificate',
      subtitle: 'Downloaded 4 trees saved certificate',
      icon: 'ribbon-outline',
      action: () => Toast.show({ type: 'success', text1: 'Eco Certificate', text2: 'Downloaded to device storage' }),
    },
    {
      title: 'KabadX Safety & Trust Policy',
      subtitle: 'Certified scales & verified collectors',
      icon: 'shield-checkmark-outline',
      action: () => Toast.show({ type: 'info', text1: 'KabadX Safety', text2: 'All collectors are Aadhaar verified' }),
    },
    {
      title: 'Re-play KabadX App Tour',
      subtitle: 'Learn how to book, weigh & get paid',
      icon: 'sparkles-outline',
      action: () => router.push('/(modules)/kabadx/(misc)/onboarding'),
    },
    {
      title: 'Help Desk & Customer Support',
      subtitle: '24x7 helpline & instant chat',
      icon: 'headset-outline',
      action: () => Toast.show({ type: 'success', text1: 'Customer Support', text2: 'Call 1800-KABADX-HELP' }),
    },
  ];

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        {/* Header */}
        <View className={`px-4 py-3 border-b ${palette.surface} ${palette.border}`}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>My Account & Settings</Text>
          <Text className={`text-[11px] ${palette.textMuted}`}>Manage profile, payout methods & addresses</Text>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          <View className="gap-3 pt-3">
            {/* Consumer Profile Card */}
            <View className={`rounded-[24px] border p-4 flex-row items-center justify-between ${palette.surface} ${palette.border}`}>
              <View className="flex-row items-center gap-3">
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' }}
                  className="h-14 w-14 rounded-full border-2 border-teal-600"
                />
                <View>
                  <Text className={`text-[16px] font-bold ${palette.text}`}>Amit Sharma</Text>
                  <Text className={`text-[12px] ${palette.textMuted}`}>+91 98712 34567</Text>
                  <View className="mt-1 self-start rounded-full bg-teal-600/10 px-2.5 py-0.5 border border-teal-500/30">
                    <Text className="text-[9px] font-extrabold text-teal-600">GREEN CITIZEN 🌳</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => Toast.show({ type: 'info', text1: 'Edit Profile', text2: 'Profile details updated' })}
                className="rounded-xl border p-2 border-gray-500/20">
                <Ionicons name="create-outline" size={18} color={palette.textColor} />
              </TouchableOpacity>
            </View>

            {/* Account Options List */}
            <View className={`rounded-[20px] border p-2 ${palette.surface} ${palette.border}`}>
              {accountOptions.map((opt, i) => (
                <TouchableOpacity
                  key={opt.title}
                  onPress={opt.action}
                  className={`flex-row items-center justify-between p-3.5 ${
                    i < accountOptions.length - 1 ? 'border-b border-gray-500/10' : ''
                  }`}>
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10">
                      <Ionicons name={opt.icon} size={18} color="#0d9488" />
                    </View>
                    <View>
                      <Text className={`text-[13px] font-bold ${palette.text}`}>{opt.title}</Text>
                      <Text className={`text-[11px] ${palette.textMuted}`}>{opt.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={palette.textMutedColor} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Dark Mode Toggle */}
            <View className={`rounded-[20px] border p-4 flex-row items-center justify-between ${palette.surface} ${palette.border}`}>
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
                  <Ionicons name="moon-outline" size={18} color="#9333ea" />
                </View>
                <View>
                  <Text className={`text-[13px] font-bold ${palette.text}`}>Dark Mode</Text>
                  <Text className={`text-[11px] ${palette.textMuted}`}>Switch app appearance</Text>
                </View>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#d1d5db', true: '#0d9488' }} />
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={() => {
                Toast.show({ type: 'info', text1: 'Logged Out', text2: 'Signed out of KabadX account' });
                router.replace('/(tabs)/home');
              }}
              className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/20 py-3.5 bg-red-500/5">
              <Ionicons name="log-out-outline" size={18} color="#dc2626" />
              <Text className="text-[13px] font-bold text-red-600">Sign Out</Text>
            </TouchableOpacity>

            <Text className={`text-center text-[11px] ${palette.textMuted}`}>KabadX App v2.4.0 • Eco Recycling Platform</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
