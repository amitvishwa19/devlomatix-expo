import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import BrandLogo from '~/components/BrandLogo';
import { getSession } from '~/utils/authStorage';

const SPLASH_DURATION_MS = 1500;

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const session = await getSession();
      const nextRoute = session?.isLoggedIn ? '/(tabs)/home' : '/(auth)/login';
      router.replace(nextRoute);
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <StatusBar hidden />
      <BrandLogo size={250} />
    </View>
  );
}
