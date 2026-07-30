import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 'slide-1',
    title: 'Turn Household Scrap into Instant Cash!',
    subtitle: 'Sell newspaper, metals, plastics & e-waste from home at guaranteed daily market rates.',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    icon: 'wallet-outline',
    badge: 'INSTANT PAYOUTS',
  },
  {
    id: 'slide-2',
    title: 'Verified & Safe Doorstep Collectors',
    subtitle: 'All Kabadi Walas are background checked, Aadhaar verified, and equipped with digital scales.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    icon: 'shield-checkmark-outline',
    badge: '100% DIGITAL SCALES',
  },
  {
    id: 'slide-3',
    title: 'Earn & Save the Planet Together',
    subtitle: 'Get paid instantly on GPay/PhonePe and track trees saved & CO₂ offset in your personal eco wallet.',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    icon: 'leaf-outline',
    badge: 'GREEN CITIZEN',
  },
];

export default function KabadxOnboardingScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('devlomatix.kabadx_onboarded', 'true');
    } catch (e) {
      // ignore
    }
    router.replace('/(modules)/kabadx');
  };

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className="flex-1 justify-between py-2">
        {/* Skip Header Button */}
        <View className="px-5 flex-row justify-end">
          <Pressable onPress={finishOnboarding} className="rounded-full bg-teal-600/10 px-3.5 py-1.5">
            <Text className="text-[12px] font-bold text-teal-600">Skip</Text>
          </Pressable>
        </View>

        {/* Carousel ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: (event) => {
              const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentIndex(slideIndex);
            },
          })}
          scrollEventThrottle={16}>
          {ONBOARDING_SLIDES.map((slide) => (
            <View key={slide.id} style={{ width: SCREEN_WIDTH }} className="px-6 items-center justify-center">
              <View className="h-64 w-full overflow-hidden rounded-[28px] shadow-xl bg-teal-800 relative mb-6">
                <Image source={{ uri: slide.image }} className="h-full w-full opacity-60" resizeMode="cover" />
                <View className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 flex-row items-center gap-1.5">
                  <Ionicons name={slide.icon} size={14} color="#2dd4bf" />
                  <Text className="text-[10px] font-black uppercase text-white">{slide.badge}</Text>
                </View>
              </View>

              <Text className={`text-center text-[24px] font-black leading-8 ${palette.text}`}>
                {slide.title}
              </Text>
              <Text className={`mt-2.5 text-center text-[13px] leading-5 ${palette.textSoft}`}>
                {slide.subtitle}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Pagination & Next Button Container */}
        <View className="px-6 pb-6">
          {/* Pagination Indicators */}
          <View className="mb-6 flex-row justify-center gap-2">
            {ONBOARDING_SLIDES.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === i ? 'w-7 bg-teal-600' : 'w-2 bg-teal-600/30'
                }`}
              />
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="rounded-2xl bg-teal-600 py-4 items-center shadow-lg flex-row justify-center gap-2">
            <Text className="text-[15px] font-extrabold text-white">
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started Now ♻️' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
