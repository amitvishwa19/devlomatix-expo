import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
    <View style={styles.container}>
      <StatusBar hidden translucent backgroundColor="transparent" />
      <Image
        source={require('~/assets/images/splashscreen-light.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        {/* <BrandLogo size={250} /> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

