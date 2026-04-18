import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const SPLASH_DURATION_MS = 2200;

export default function StartupSplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <StatusBar style="dark" />
      <View className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-teal-700/10" />
      <View className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-sky-500/10" />

      <View className="items-center">
        <View className="h-[172px] w-[172px] items-center justify-center rounded-[40px] border border-white bg-white shadow-2xl shadow-slate-900/10">
          <Image
            source={require('../assets/images/logos/devlomatix_logo.png')}
            className="h-[116px] w-[116px]"
            resizeMode="contain"
          />
        </View>

        <Text className="mt-7 text-[32px] font-bold tracking-wide text-slate-900">Devlomatix</Text>
        <Text className="mt-2.5 text-center text-[15px] text-slate-600">
          Build products with clarity and speed.
        </Text>
      </View>
    </View>
  );
}
