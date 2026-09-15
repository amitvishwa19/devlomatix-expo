import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONBOARDING_SLIDES = [
  {
    id: 'slide-1',
    image: require('../../../assets/images/curexa/onboarding/onboarding-1.png'),
    btnLabel: 'Next',
  },
  {
    id: 'slide-2',
    image: require('../../../assets/images/curexa/onboarding/onboarding-2.png'),
    btnLabel: 'Next',
  },
  {
    id: 'slide-3',
    image: require('../../../assets/images/curexa/onboarding/onboarding-3.png'),
    btnLabel: 'Get Started',
  },
];

export default function CurexaOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      await finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({ x: prevIndex * width, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('devlomatix.curexa_onboarded', 'true');
    } catch (e) {
      // ignore storage error
    }
    router.replace('/(modules)/curexa/(tabs)');
  };

  return (
    <View style={{ flex: 1, width, height, backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <StatusBar style="dark" />

      {/* Top Floating Skip Button */}
      <View
        style={{
          position: 'absolute',
          top: Math.max(insets.top, 12) + 4,
          right: 16,
          zIndex: 30,
        }}
      >
        <Pressable
          onPress={finishOnboarding}
          style={{
            backgroundColor: 'rgba(2, 132, 122, 0.12)',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: '#02847a', fontSize: 12, fontWeight: '700' }}>Skip</Text>
        </Pressable>
      </View>

      {/* Horizontal Carousel View */}
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
            {/* Full-Screen Fit Image */}
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

      {/* Bottom Floating Navigation Controls */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16) + 6,
          left: 20,
          right: 20,
          zIndex: 30,
        }}
      >
        {/* Pagination Dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                height: 6,
                width: currentIndex === i ? 22 : 6,
                borderRadius: 3,
                backgroundColor: currentIndex === i ? '#02847a' : '#cbd5e1',
              }}
            />
          ))}
        </View>

        {/* Action Button Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrev}
              activeOpacity={0.7}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#e2e8f0',
              }}
            >
              <Ionicons name="arrow-back" size={18} color="#0f172a" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#02847a',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#02847a',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>
              {slideCurrentLabel(currentIndex)}
            </Text>
            <Ionicons name="arrow-forward" size={17} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function slideCurrentLabel(index) {
  if (index === ONBOARDING_SLIDES.length - 1) {
    return 'Get Started';
  }
  return 'Next';
}
