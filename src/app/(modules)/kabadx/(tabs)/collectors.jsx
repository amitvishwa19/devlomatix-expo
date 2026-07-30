import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useKabadx } from '~/providers/KabadxProvider';
import { useAppTheme } from '~/theme/AppTheme';

export default function KabadxClientTrackScreen() {
  const { palette } = useAppTheme();
  const { pickups, collectors } = useKabadx();

  const [showUpiQr, setShowUpiQr] = useState(false);

  // Animated GPS marker move
  const markerMove = useRef(new Animated.Value(0)).current;
  const pulseDot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Loop moving GPS marker back and forth along Harni Road route
    const gpsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(markerMove, { toValue: 120, duration: 4000, useNativeDriver: true }),
        Animated.timing(markerMove, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseDot, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseDot, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    gpsLoop.start();
    dotLoop.start();
    return () => {
      gpsLoop.stop();
      dotLoop.stop();
    };
  }, [markerMove, pulseDot]);

  const activePickup = pickups.find((p) => p.status === 'ASSIGNED' || p.status === 'IN_PROGRESS' || p.status === 'PENDING');
  const activeCollector = collectors.find((c) => c.id === activePickup?.collectorId) || collectors[1];

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        {/* Header */}
        <View className={`px-4 py-3 border-b ${palette.surface} ${palette.border}`}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>Live GPS Track & Collector</Text>
          <Text className={`text-[11px] ${palette.textMuted}`}>Real-time tracking along Harni Road, Vadodara</Text>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          <View className="gap-3 pt-3">
            {/* FEATURE #4: Live Animated GPS Route Map Simulation */}
            <View className="overflow-hidden rounded-[24px] bg-teal-800 shadow-xl border border-teal-600/30">
              {/* Map Canvas Box */}
              <View className="h-44 w-full relative bg-slate-900 justify-center">
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80' }}
                  className="h-full w-full opacity-50"
                  resizeMode="cover"
                />

                {/* Animated Moving E-Rickshaw Marker */}
                <Animated.View
                  style={{ transform: [{ translateX: markerMove }] }}
                  className="absolute left-6 top-14 flex-row items-center gap-1 bg-teal-600 px-2.5 py-1 rounded-full shadow-lg border border-white">
                  <Ionicons name="car" size={14} color="#fff" />
                  <Text className="text-[10px] font-extrabold text-white">Sunil (E-Rickshaw)</Text>
                </Animated.View>

                {/* Destination Marker */}
                <View className="absolute right-6 bottom-4 flex-row items-center gap-1 bg-red-600 px-2.5 py-1 rounded-full shadow-lg">
                  <Ionicons name="location" size={14} color="#fff" />
                  <Text className="text-[10px] font-extrabold text-white">202-10, Rajeshwer Planet</Text>
                </View>

                {/* Status Badges */}
                <View className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 flex-row items-center gap-1.5">
                  <Animated.View style={{ opacity: pulseDot }} className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <Text className="text-[10px] font-black uppercase text-white">LIVE ROUTE SIMULATION</Text>
                </View>
                <View className="absolute right-4 top-4 rounded-full bg-teal-600 px-3 py-1">
                  <Text className="text-[11px] font-bold text-white">ETA: 12 MINS</Text>
                </View>
              </View>

              <View className="p-5">
                <Text className="text-[20px] font-black text-white">
                  {activeCollector ? `${activeCollector.name} is on the way!` : 'Searching nearest Kabadi Wala...'}
                </Text>
                <Text className="mt-1 text-[12px] text-teal-100">
                  {activeCollector?.vehicleType} • Reg No: {activeCollector?.vehicleNo}
                </Text>

                {/* Collector Profile Box with Photo Avatar */}
                {activeCollector ? (
                  <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/15 p-3">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' }}
                        className="h-11 w-11 rounded-full border-2 border-white"
                      />
                      <View>
                        <Text className="text-[14px] font-bold text-white">{activeCollector.name}</Text>
                        <Text className="text-[11px] text-teal-100">★ {activeCollector.rating} Rating • Verified Kabadi Wala</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => Toast.show({ type: 'info', text1: 'Calling Collector...', text2: activeCollector.phone })}
                      className="flex-row items-center gap-1 rounded-xl bg-white px-3.5 py-2 shadow-md">
                      <Ionicons name="call" size={14} color="#0d9488" />
                      <Text className="text-[12px] font-bold text-teal-800">Call</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>

            {/* FEATURE #6: Customer Instant UPI QR Code Button */}
            <TouchableOpacity
              onPress={() => setShowUpiQr(true)}
              className={`rounded-[20px] border p-4 flex-row items-center justify-between ${palette.surface} ${palette.border}`}>
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-600/15">
                  <Ionicons name="qr-code" size={22} color="#0d9488" />
                </View>
                <View>
                  <Text className={`text-[13px] font-bold ${palette.text}`}>Show My UPI Payout QR Code 📲</Text>
                  <Text className={`text-[10px] ${palette.textMuted}`}>Allow visiting collector to scan & pay on spot</Text>
                </View>
              </View>
              <View className="rounded-xl bg-teal-600 px-3 py-1.5">
                <Text className="text-[11px] font-bold text-white">Show QR</Text>
              </View>
            </TouchableOpacity>

            {/* Safety & Trust Verification Box */}
            <View className={`rounded-[20px] border p-4 ${palette.surface} ${palette.border}`}>
              <View className="mb-3 flex-row items-center gap-2">
                <Ionicons name="shield-checkmark" size={20} color="#0d9488" />
                <Text className={`text-[15px] font-bold ${palette.text}`}>KabadX Household Safety Shield</Text>
              </View>

              <View className="gap-2.5">
                <View className="flex-row items-center gap-2.5">
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <View className="flex-1">
                    <Text className={`text-[12px] font-bold ${palette.text}`}>Aadhaar & Police Verified</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>All collectors pass strict background checks before doorstep visits.</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2.5">
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <View className="flex-1">
                    <Text className={`text-[12px] font-bold ${palette.text}`}>Sealed Digital Weighing Machine</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>Guaranteed zero weight manipulation or cheating.</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2.5">
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <View className="flex-1">
                    <Text className={`text-[12px] font-bold ${palette.text}`}>No Cash Handling Issues</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>Instant UPI transfer available directly to your GPay / PhonePe.</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Customer Instant UPI QR Code Modal (FEATURE #6) */}
        <Modal visible={showUpiQr} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/60">
            <View className={`rounded-t-[32px] p-6 items-center ${palette.surface}`}>
              <View className="w-full mb-3 flex-row items-center justify-between">
                <Text className={`text-[18px] font-bold ${palette.text}`}>My Payout QR Code</Text>
                <Pressable onPress={() => setShowUpiQr(false)}>
                  <Ionicons name="close-circle" size={24} color={palette.textMutedColor} />
                </Pressable>
              </View>

              <Text className={`mb-4 text-center text-[12px] ${palette.textMuted}`}>
                Show this QR Code to Sunil Sharma when he weighs your scrap for instant GPay / PhonePe payout.
              </Text>

              {/* Simulated QR Code Canvas */}
              <View className="p-4 rounded-3xl bg-white shadow-xl items-center mb-4 border border-gray-200">
                <Image
                  source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=9871234567@okaxis&pn=Amit%20Sharma' }}
                  style={{ width: 180, height: 180 }}
                />
                <Text className="mt-2 text-[12px] font-bold text-gray-800">9871234567@okaxis</Text>
                <Text className="text-[10px] text-gray-500">Amit Sharma • Axis Bank GPay</Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowUpiQr(false)}
                className="w-full rounded-2xl bg-teal-600 py-3.5 items-center">
                <Text className="text-[14px] font-bold text-white">Done / Close QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
