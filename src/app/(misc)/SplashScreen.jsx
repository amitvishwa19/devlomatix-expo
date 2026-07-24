import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, View } from 'react-native';
import { getSession } from '~/utils/authStorage';

const SPLASH_DURATION_MS = 1500;

export default function AppSplashScreen() {
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();
    const timer = setTimeout(async () => {
      const session = await getSession();
      const nextRoute = session?.isLoggedIn ? '/(tabs)/home' : '/(auth)/login';
      router.replace(nextRoute);
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1">
      <StatusBar hidden />
      <Image
        source={require('~/assets/images/splashscreen-light.png')}
        className="absolute h-full w-full"
        resizeMode="cover"
      />
      <View className="flex-1 items-center justify-center">
        {/* <BrandLogo size={250} /> */}
      </View>
    </View>
  );
}
