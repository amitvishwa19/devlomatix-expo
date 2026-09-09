import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Animated, Image, Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useKabadx } from '~/providers/KabadxProvider';
import { useAppTheme } from '~/theme/AppTheme';

export default function KabadxConsumerHomeScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { pickups, refreshData, addPickup } = useKabadx();
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [showAiScanner, setShowAiScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [showSocietyModal, setShowSocietyModal] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseDot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseDot, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseDot, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    dotLoop.start();

    return () => {
      pulseLoop.stop();
      dotLoop.stop();
    };
  }, [pulseAnim, pulseDot]);

  const activePickup = pickups.find((p) => p.status === 'PENDING' || p.status === 'ASSIGNED' || p.status === 'IN_PROGRESS');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleSimulateAiScan = () => {
    setIsScanning(true);
    setScannedResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScannedResult({
        category: 'Paper & Copper Wire',
        confidence: '98%',
        estWeight: '18 kg',
        estPayout: '₹540',
        items: ['Old Newspapers (12kg)', 'Scrap Copper Cable (6kg)'],
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      });
    }, 1800);
  };

  const handleAddAiBooking = () => {
    addPickup({
      customerName: 'Amit Sharma',
      phone: '+91 98712 34567',
      address: '202-10, Rajeshwer Planet, Harni Road, Vadodara',
      scrapItems: [
        { category: 'Paper', name: 'AI Detected Paper', estWeight: 12, rate: 16 },
        { category: 'Metal', name: 'AI Detected Copper', estWeight: 6, rate: 70 },
      ],
      totalEstWeight: 18,
      estPayout: 540,
      scheduledDate: new Date().toISOString().split('T')[0],
      timeSlot: 'Today (02:00 PM - 05:00 PM)',
    });
    Toast.show({ type: 'success', text1: 'AI Scrap Order Created!', text2: 'Doorstep pickup requested for ₹540' });
    setShowAiScanner(false);
    setScannedResult(null);
    router.push('/(modules)/kabadx/pickups');
  };

  const scrapCategories = [
    {
      title: 'Paper & Cartons',
      rate: '₹16/kg',
      image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
      icon: 'newspaper-outline',
      color: '#0284c7',
      bg: '#e0f2fe',
    },
    {
      title: 'Copper & Metals',
      rate: '₹420/kg',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
      icon: 'flash-outline',
      color: '#d97706',
      bg: '#fef3c7',
    },
    {
      title: 'Plastics & Bottles',
      rate: '₹22/kg',
      image: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=600&q=80',
      icon: 'wine-outline',
      color: '#059669',
      bg: '#d1fae5',
    },
    {
      title: 'E-Waste & Laptops',
      rate: '₹180/pc',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
      icon: 'laptop-outline',
      color: '#7c3aed',
      bg: '#ede9fe',
    },
    {
      title: 'AC & Appliances',
      rate: '₹2200/unit',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      icon: 'snow-outline',
      color: '#dc2626',
      bg: '#fee2e2',
    },
    {
      title: 'Glass Bottles',
      rate: '₹4/pc',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      icon: 'beer-outline',
      color: '#4b5563',
      bg: '#f3f4f6',
    },
  ];

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        {/* Consumer Header Bar */}
        <View className={`px-4 py-3 border-b flex-row items-center justify-between ${palette.surface} ${palette.border}`}>
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-teal-600/15">
              <Ionicons name="location" size={18} color="#0d9488" />
            </View>
            <View>
              <Text className={`text-[10px] font-bold uppercase tracking-[1px] ${palette.textMuted}`}>PICKUP LOCATION</Text>
              <Text className={`text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                202-10, Rajeshwer Planet, Harni Road, Vadodara ▾
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(modules)/kabadx/analytics')}
            className="flex-row items-center gap-1 rounded-full bg-teal-600/10 px-3 py-1.5 border border-teal-500/30">
            <Ionicons name="wallet-outline" size={14} color="#0d9488" />
            <Text className="text-[11px] font-bold text-teal-600">₹2,450</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textColor} />}>
          <View className="px-4 pt-3">
            {/* Active Pickup Tracker Banner */}
            {activePickup ? (
              <TouchableOpacity
                onPress={() => router.push('/(modules)/kabadx/collectors')}
                className="mb-4 rounded-[20px] p-4 bg-teal-600 shadow-lg">
                <View className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Animated.View style={{ opacity: pulseDot }} className="h-2.5 w-2.5 rounded-full bg-white" />
                    <Text className="text-[10px] font-bold uppercase tracking-[1px] text-white">PICKUP IN PROGRESS</Text>
                  </View>
                  <Text className="text-[11px] font-semibold text-teal-100">Track Collector →</Text>
                </View>

                <Text className="text-[16px] font-bold text-white">
                  {activePickup.collectorName ? `${activePickup.collectorName} is assigned` : 'Searching nearest Kabadi Wala'}
                </Text>
                <Text className="mt-0.5 text-[12px] text-teal-100">
                  Est. Payout: ₹{activePickup.estPayout} • {activePickup.timeSlot}
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* AI Scrap Scanner Banner (FEATURE #1) */}
            <TouchableOpacity
              onPress={() => setShowAiScanner(true)}
              style={{ backgroundColor: '#4c1d95' }}
              className="mb-4 rounded-[22px] border p-4 shadow-lg border-purple-400/40 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="mb-1.5 self-start rounded-full px-2.5 py-0.5 flex-row items-center gap-1">
                  <Ionicons name="sparkles" size={12} color="#f0abfc" />
                  <Text className="text-[10px] font-black uppercase text-white">AI SCRAP SCANNER</Text>
                </View>
                <Text className="text-[16px] font-black text-white">Snap Photo → Instant Cash Quote!</Text>
                <Text className="mt-0.5 text-[11px] font-medium text-purple-100">Point camera at scrap to predict weight & ₹ payout</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="h-12 w-12 items-center justify-center rounded-2xl border border-white/30">
                <Ionicons name="camera" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>

            {/* Consumer Hero Banner */}
            <View style={{ backgroundColor: '#0f766e' }} className="mb-4 overflow-hidden rounded-[26px] p-5 shadow-xl border border-teal-500/40">
              <View className="mb-2.5 flex-row items-center justify-between">
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="rounded-full px-3 py-1 border border-white/30">
                  <Text className="text-[10px] font-black uppercase tracking-[1px] text-white">RECYCLING MADE EASY ♻️</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(52,211,153,0.3)' }} className="rounded-full px-2.5 py-0.5 border border-emerald-300/40">
                  <Text className="text-[10px] font-black text-emerald-100">VADODARA</Text>
                </View>
              </View>

              <Text className="text-[22px] font-black leading-[28px] text-white">
                Turn Household Scrap into Instant Cash!
              </Text>
              <Text className="mt-1.5 text-[12px] font-medium leading-5 text-teal-100">
                Sell paper, metals, plastics & e-waste at guaranteed best market rates right from home.
              </Text>

              <View className="mt-3 flex-row items-center gap-3 border-t border-white/20 pt-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={14} color="#34d399" />
                  <Text className="text-[10px] font-bold text-white">₹0 Pickup Fee</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={14} color="#34d399" />
                  <Text className="text-[10px] font-bold text-white">Digital Scale</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={14} color="#34d399" />
                  <Text className="text-[10px] font-bold text-white">Instant UPI</Text>
                </View>
              </View>

              {/* Animated Pulsing CTA Button */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="mt-4 self-start">
                <TouchableOpacity
                  onPress={() => router.push('/(modules)/kabadx/pickups')}
                  className="rounded-xl bg-white px-5 py-3 shadow-lg flex-row items-center gap-2">
                  <Ionicons name="add-circle" size={18} color="#0d9488" />
                  <Text className="text-[13px] font-black text-teal-900">Book Free Doorstep Pickup</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* RWA Society Drive & Corporate Banner (FEATURE #2 & #3) */}
            <View className="mb-4 flex-row gap-2.5">
              <TouchableOpacity
                onPress={() => setShowSocietyModal(true)}
                className={`flex-1 rounded-[20px] border p-3.5 ${palette.surface} ${palette.border}`}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 mb-2">
                  <Ionicons name="business" size={20} color="#d97706" />
                </View>
                <Text className={`text-[13px] font-bold ${palette.text}`}>Society RWA Drive</Text>
                <Text className={`mt-0.5 text-[10px] ${palette.textMuted}`}>+10% bonus for Vadodara societies</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(modules)/kabadx/pickups', params: { mode: 'CORPORATE' } })}
                className={`flex-1 rounded-[20px] border p-3.5 ${palette.surface} ${palette.border}`}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 mb-2">
                  <Ionicons name="briefcase" size={20} color="#6366f1" />
                </View>
                <Text className={`text-[13px] font-bold ${palette.text}`}>Corporate E-Waste</Text>
                <Text className={`mt-0.5 text-[10px] ${palette.textMuted}`}>GST invoice & Form 13 certified</Text>
              </TouchableOpacity>
            </View>

            {/* Refer & Earn Banner (FEATURE #5) */}
            <TouchableOpacity
              onPress={() => router.push('/(modules)/kabadx/account')}
              style={{ backgroundColor: '#047857' }}
              className="mb-4 rounded-[20px] border p-3.5 shadow-md border-emerald-400/40 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="h-10 w-10 items-center justify-center rounded-2xl">
                  <Ionicons name="gift" size={20} color="#ffffff" />
                </View>
                <View>
                  <Text className="text-[13px] font-black text-white">Refer & Earn ₹50 Bonus 🎁</Text>
                  <Text className="text-[10px] font-medium text-emerald-100">Share code KABADX-VAD-402 with neighbors</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </TouchableOpacity>

            {/* Scrap Category Selection Header */}
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className={`text-[17px] font-bold ${palette.text}`}>What do you want to sell?</Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>Tap category to check rates & schedule</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(modules)/kabadx/rates')}>
                <Text className="text-[12px] font-bold text-teal-600">Rate Card →</Text>
              </TouchableOpacity>
            </View>

            {/* Category Cards Grid */}
            <View className="mb-4 flex-row flex-wrap gap-2.5">
              {scrapCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.title}
                  onPress={() => router.push({ pathname: '/(modules)/kabadx/pickups', params: { category: cat.title } })}
                  className={`w-[48%] flex-grow overflow-hidden rounded-[20px] border ${palette.surface} ${palette.border}`}>
                  <View style={{ height: 100, width: '100%', backgroundColor: cat.bg, position: 'relative' }}>
                    <View className="absolute inset-0 items-center justify-center">
                      <Ionicons name={cat.icon} size={36} color={cat.color} />
                    </View>
                    <Image
                      source={{ uri: cat.image }}
                      style={{ width: '100%', height: 100, position: 'absolute' }}
                      resizeMode="cover"
                    />
                    <View className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5">
                      <Text className="text-[10px] font-black text-white">{cat.rate}</Text>
                    </View>
                  </View>

                  <View className="p-3">
                    <Text className={`text-[13px] font-bold ${palette.text}`}>{cat.title}</Text>
                    <Text className={`mt-0.5 text-[10px] ${palette.textMuted}`}>Free doorstep pickup</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* AI Scanner Modal (FEATURE #1) */}
        <Modal visible={showAiScanner} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/60">
            <View className={`rounded-t-[32px] p-5 max-h-[85%] ${palette.surface}`}>
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="sparkles" size={20} color="#a855f7" />
                  <Text className={`text-[18px] font-bold ${palette.text}`}>AI Scrap Photo Scanner</Text>
                </View>
                <Pressable onPress={() => setShowAiScanner(false)}>
                  <Ionicons name="close-circle" size={24} color={palette.textMutedColor} />
                </Pressable>
              </View>

              {!scannedResult ? (
                <View className="items-center py-6">
                  <View className="h-44 w-full rounded-2xl border-2 border-dashed border-purple-500/40 items-center justify-center bg-purple-500/5">
                    {isScanning ? (
                      <View className="items-center">
                        <Ionicons name="scan-circle" size={48} color="#a855f7" />
                        <Text className="mt-2 text-[13px] font-bold text-purple-600">Analyzing scrap material...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={handleSimulateAiScan} className="items-center">
                        <Ionicons name="camera-outline" size={48} color="#a855f7" />
                        <Text className={`mt-2 text-[14px] font-bold ${palette.text}`}>Take or Choose Scrap Photo</Text>
                        <Text className={`text-[11px] ${palette.textMuted}`}>Simulate AI identification scan</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleSimulateAiScan}
                    disabled={isScanning}
                    className="mt-4 rounded-xl bg-purple-600 px-6 py-3 shadow-md">
                    <Text className="text-[13px] font-bold text-white">
                      {isScanning ? 'Scanning...' : 'Simulate Camera Scan'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="gap-3 py-2">
                  <Image source={{ uri: scannedResult.image }} className="h-32 w-full rounded-2xl" resizeMode="cover" />
                  <View className="rounded-2xl p-3 bg-purple-500/10 border border-purple-500/20">
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-[15px] font-bold ${palette.text}`}>{scannedResult.category}</Text>
                      <View className="rounded-full bg-purple-600 px-2.5 py-0.5">
                        <Text className="text-[10px] font-extrabold text-white">{scannedResult.confidence} Match</Text>
                      </View>
                    </View>
                    <Text className={`mt-1 text-[11px] ${palette.textMuted}`}>Est. Weight: {scannedResult.estWeight}</Text>
                    <Text className="mt-2 text-[20px] font-black text-teal-600">Est. Payout: {scannedResult.estPayout}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleAddAiBooking}
                    className="rounded-2xl bg-teal-600 py-3.5 items-center shadow-lg">
                    <Text className="text-[14px] font-bold text-white">Book Pickup for {scannedResult.estPayout}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* RWA Society Drive Modal (FEATURE #2) */}
        <Modal visible={showSocietyModal} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/60">
            <View className={`rounded-t-[32px] p-5 ${palette.surface}`}>
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="business" size={20} color="#d97706" />
                  <Text className={`text-[18px] font-bold ${palette.text}`}>Host Society RWA Scrap Drive</Text>
                </View>
                <Pressable onPress={() => setShowSocietyModal(false)}>
                  <Ionicons name="close-circle" size={24} color={palette.textMutedColor} />
                </Pressable>
              </View>

              <Text className={`text-[12px] leading-5 ${palette.textSoft}`}>
                Organize a Sunday scrap drive for Rajeshwer Planet or your society in Vadodara. All residents get **+10% extra cash bonus** on their scrap!
              </Text>

              <View className="my-4 rounded-2xl p-3 bg-amber-500/15">
                <Text className={`text-[12px] font-bold ${palette.text}`}>Society Benefits:</Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>• Free e-loader rickshaw dedicated for society premises</Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>• Group bonus +10% paid directly to residents</Text>
                <Text className={`text-[11px] ${palette.textMuted}`}>• RWA Green Society Certificate</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Toast.show({ type: 'success', text1: 'RWA Drive Request Sent!', text2: 'KabadX Vadodara manager will contact society RWA.' });
                  setShowSocietyModal(false);
                }}
                className="rounded-2xl bg-amber-600 py-3.5 items-center shadow-lg">
                <Text className="text-[14px] font-bold text-white">Request Sunday Society Drive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
