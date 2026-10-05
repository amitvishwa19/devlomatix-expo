import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurexa } from '~/providers/CurexaProvider';

const ONBOARDING_SLIDES = [
  {
    id: 'slide-1',
    image: require('../../../assets/images/curexa/onboarding/onboarding-1.png'),
    step: '1 / 3',
  },
  {
    id: 'slide-2',
    image: require('../../../assets/images/curexa/onboarding/onboarding-2.png'),
    step: '2 / 3',
  },
  {
    id: 'slide-3',
    image: require('../../../assets/images/curexa/onboarding/onboarding-3.png'),
    step: '3 / 3',
  },
];

export default function CurexaOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { setPortalMode } = useCurexa();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Handle Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (showRoleModal) {
        setShowRoleModal(false);
        return true;
      }
      if (currentIndex > 0) {
        handlePrev();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentIndex, showRoleModal, width]);

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      setShowRoleModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({ x: prevIndex * width, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const handleSelectRoleAndFinish = async (selectedRole) => {
    try {
      await setPortalMode(selectedRole);
      await AsyncStorage.setItem('devlomatix.curexa_onboarded', 'true');
    } catch (e) {
      // ignore
    }
    setShowRoleModal(false);
    router.replace('/(modules)/curexa/(tabs)');
  };

  const finishOnboardingDefault = async () => {
    setShowRoleModal(true);
  };

  return (
    <View style={{ flex: 1, width, height, backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Animated Micro Progress Line */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: '#e2e8f0',
          zIndex: 40,
        }}
      >
        <Animated.View
          style={{
            height: 3,
            backgroundColor: '#02847a',
            width: scrollX.interpolate({
              inputRange: [0, Math.max(1, width * (ONBOARDING_SLIDES.length - 1))],
              outputRange: [`${(1 / ONBOARDING_SLIDES.length) * 100}%`, '100%'],
              extrapolate: 'clamp',
            }),
          }}
        />
      </View>

      {/* Top Floating Glass Header */}
      <View
        style={{
          position: 'absolute',
          top: Math.max(insets.top, 12) + 6,
          left: 16,
          right: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30,
        }}
      >
        {/* Brand Pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            paddingHorizontal: 11,
            paddingVertical: 5.5,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.8)',
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="medical" size={13} color="#02847a" />
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#0f172a', letterSpacing: 0.8 }}>
            CUREXA HMS
          </Text>
        </View>

        {/* Skip Tour Button */}
        <Pressable
          onPress={finishOnboardingDefault}
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(2, 132, 122, 0.15)' : 'rgba(255, 255, 255, 0.92)',
            paddingHorizontal: 12,
            paddingVertical: 5.5,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.8)',
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          })}
        >
          <Text style={{ color: '#02847a', fontSize: 11.5, fontWeight: '700' }}>Skip Tour</Text>
        </Pressable>
      </View>

      {/* Full-Screen Horizontal Paging Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
          listener: (event) => {
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            if (slideIndex >= 0 && slideIndex < ONBOARDING_SLIDES.length) {
              setCurrentIndex(slideIndex);
            }
          },
        })}
        style={{ flex: 1, width, height }}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View
            key={slide.id}
            style={{
              width,
              height,
              backgroundColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Full-Screen Fit Graphic */}
            <Image
              source={slide.image}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="contain"
            />
          </View>
        ))}
      </ScrollView>

      {/* Floating Bottom Control Dock */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 12) + 4,
          left: 16,
          right: 16,
          zIndex: 30,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 28,
            paddingVertical: 8,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 6,
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.85)',
          }}
        >
          {/* Left Action: Back Button or Step Indicator */}
          {currentIndex > 0 ? (
            <TouchableOpacity
              onPress={handlePrev}
              activeOpacity={0.7}
              style={{
                height: 38,
                width: 38,
                borderRadius: 19,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={17} color="#0f172a" />
            </TouchableOpacity>
          ) : (
            <View style={{ paddingLeft: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#02847a' }} />
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 }}>
                1 of 3
              </Text>
            </View>
          )}

          {/* Center: Animated Interpolated Pagination Indicators */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {ONBOARDING_SLIDES.map((_, i) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [6, 20, 6],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.35, 1, 0.35],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  style={{
                    height: 5,
                    width: dotWidth,
                    opacity: dotOpacity,
                    borderRadius: 2.5,
                    backgroundColor: '#02847a',
                  }}
                />
              );
            })}
          </View>

          {/* Right: Primary Call to Action Button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#02847a',
              paddingVertical: 9,
              paddingHorizontal: currentIndex === ONBOARDING_SLIDES.length - 1 ? 16 : 15,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              shadowColor: '#02847a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={
                currentIndex === ONBOARDING_SLIDES.length - 1
                  ? 'checkmark-circle'
                  : 'arrow-forward'
              }
              size={15}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Selection Modal */}
      <Modal visible={showRoleModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <Pressable className="absolute inset-0" onPress={() => setShowRoleModal(false)} />
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 14 }}
            className="rounded-t-[32px] bg-white dark:bg-slate-900 p-5 shadow-2xl"
          >
            <View className="items-center mb-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 mb-2">
                <Ionicons name="medical" size={24} color="#059669" />
              </View>
              <Text className="text-[18px] font-black text-slate-900 dark:text-white">
                Choose Your Experience
              </Text>
              <Text className="text-[12px] text-slate-500 text-center mt-1 px-4">
                Select your role to tailor the Curexa dashboard & navigation
              </Text>
            </View>

            {/* Role 1: Clinic / Hospital */}
            <TouchableOpacity
              onPress={() => handleSelectRoleAndFinish('HOSPITAL')}
              activeOpacity={0.85}
              className="mb-3 rounded-[20px] bg-slate-50 dark:bg-slate-800 p-4 border border-emerald-500/30 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-11 w-11 rounded-[16px] bg-emerald-600 items-center justify-center shadow-sm">
                  <Ionicons name="business" size={22} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-slate-900 dark:text-white">
                    Clinic & Hospital Operations
                  </Text>
                  <Text className="text-[11px] text-slate-500 leading-4 mt-0.5">
                    For doctors, staff & admins. Manage beds, OPD tokens, e-Rx, labs, billing & telemetry.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#059669" />
            </TouchableOpacity>

            {/* Role 2: Patient Portal */}
            <TouchableOpacity
              onPress={() => handleSelectRoleAndFinish('PATIENT')}
              activeOpacity={0.85}
              className="mb-4 rounded-[20px] bg-slate-50 dark:bg-slate-800 p-4 border border-sky-500/30 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-11 w-11 rounded-[16px] bg-sky-600 items-center justify-center shadow-sm">
                  <Ionicons name="person" size={22} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-slate-900 dark:text-white">
                    Patient & Family Care Portal
                  </Text>
                  <Text className="text-[11px] text-slate-500 leading-4 mt-0.5">
                    For patients. Book appointments, view live token wait time, download lab reports & e-Rx.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0284c7" />
            </TouchableOpacity>

            <Text className="text-center text-[10.5px] text-slate-400">
              💡 You can switch between roles anytime inside App Settings.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
