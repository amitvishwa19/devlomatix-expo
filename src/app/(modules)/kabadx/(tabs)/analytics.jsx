import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';

export default function KabadxClientWalletScreen() {
  const { palette } = useAppTheme();

  const transactions = [
    { id: 'txn-0', date: '29 Jul 2026', items: 'Referral Bonus (Neighbor Signup)', amount: 50, status: 'COMPLETED', method: 'KabadX Wallet' },
    { id: 'txn-1', date: '28 Jul 2026', items: 'Paper (25kg), Iron (10kg)', amount: 680, status: 'COMPLETED', method: 'UPI (GPay)' },
    { id: 'txn-2', date: '21 Jul 2026', items: 'Copper Wire (4kg), Brass (2kg)', amount: 2290, status: 'COMPLETED', method: 'Cash' },
    { id: 'txn-3', date: '12 Jul 2026', items: 'E-Waste & Batteries (3kg)', amount: 540, status: 'COMPLETED', method: 'UPI (PhonePe)' },
  ];

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        {/* Header */}
        <View className={`px-4 py-3 border-b ${palette.surface} ${palette.border}`}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>My Wallet & Green Impact</Text>
          <Text className={`text-[11px] ${palette.textMuted}`}>Scrap sale earnings & your personal eco contribution</Text>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          <View className="gap-3 pt-3">
            {/* Wallet Cash Balance Card */}
            <View className="rounded-[24px] p-5 bg-teal-700 shadow-xl">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-teal-100">TOTAL SCRAP EARNINGS</Text>
                <View className="rounded-full bg-white/20 px-2.5 py-0.5">
                  <Text className="text-[10px] font-bold text-white">INSTANT PAYOUTS</Text>
                </View>
              </View>

              <Text className="text-[34px] font-black text-white">₹3,510</Text>
              <Text className="text-[12px] text-teal-100">Earned from 3 doorstep scrap pickups</Text>

              <View className="mt-4 flex-row gap-2 border-t border-white/20 pt-3">
                <TouchableOpacity
                  onPress={() => Toast.show({ type: 'success', text1: 'UPI Linked', text2: 'Payouts sent directly to GPay' })}
                  className="flex-1 rounded-xl bg-white py-2.5 items-center">
                  <Text className="text-[12px] font-bold text-teal-700">Link UPI ID</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Toast.show({ type: 'info', text1: 'Sales History', text2: '3 Completed Scrap Drives' })}
                  className="flex-1 rounded-xl bg-white/20 py-2.5 items-center">
                  <Text className="text-[12px] font-bold text-white">Sale Statements</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Personal Green Citizen Badge Card */}
            <View className={`rounded-[20px] border p-4 ${palette.surface} ${palette.border}`}>
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="leaf" size={20} color="#16a34a" />
                  <Text className={`text-[15px] font-bold ${palette.text}`}>Your Eco Footprint Saved</Text>
                </View>
                <View className="rounded-full bg-green-500/10 px-2.5 py-0.5">
                  <Text className="text-[10px] font-extrabold text-green-600">GREEN CITIZEN</Text>
                </View>
              </View>

              <View className="flex-row justify-between rounded-xl p-3 bg-teal-500/10">
                <View className="items-center">
                  <Ionicons name="planet" size={18} color="#0d9488" />
                  <Text className={`mt-1 text-[15px] font-bold ${palette.text}`}>120 kg</Text>
                  <Text className={`text-[9px] ${palette.textMuted}`}>CO₂ Offset</Text>
                </View>
                <View className="items-center">
                  <Ionicons name="tree" size={18} color="#16a34a" />
                  <Text className={`mt-1 text-[15px] font-bold ${palette.text}`}>4 Trees</Text>
                  <Text className={`text-[9px] ${palette.textMuted}`}>Saved from Cutting</Text>
                </View>
                <View className="items-center">
                  <Ionicons name="water" size={18} color="#0284c7" />
                  <Text className={`mt-1 text-[15px] font-bold ${palette.text}`}>850 L</Text>
                  <Text className={`text-[9px] ${palette.textMuted}`}>Water Conserved</Text>
                </View>
              </View>
            </View>

            {/* Transaction Receipts */}
            <Text className={`mt-1 text-[15px] font-bold ${palette.text}`}>Scrap Sale Receipts</Text>
            <View className="gap-2">
              {transactions.map((t) => (
                <View key={t.id} className={`rounded-[16px] border p-3 flex-row items-center justify-between ${palette.surface} ${palette.border}`}>
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10">
                      <Ionicons name="receipt-outline" size={18} color="#0d9488" />
                    </View>
                    <View>
                      <Text className={`text-[13px] font-bold ${palette.text}`}>{t.items}</Text>
                      <Text className={`text-[10px] ${palette.textMuted}`}>{t.date} • {t.method}</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-[14px] font-extrabold text-green-600">+ ₹{t.amount}</Text>
                    <Text className={`text-[9px] font-bold text-teal-600`}>Paid</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
