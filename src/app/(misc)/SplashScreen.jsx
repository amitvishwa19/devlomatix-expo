import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import BrandLogo from '~/components/BrandLogo';

const SPLASH_DURATION_MS = 2200;

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }),
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 7,
      tension: 72,
      useNativeDriver: true
    })]
    ).start();

    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, router]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <StatusBar style="dark" />
      <View className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-teal-700/10" />
      <View className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-sky-500/10" />

      <Animated.View
        className="items-center"
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }]
        }}>
        <BrandLogo size={250} />
      </Animated.View>
    </View>);

}