import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  useColorScheme,
  View
} from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';

import darkSplash from '~/assets/images/splashscreen-dark.png';
import lightSplash from '~/assets/images/splashscreen-light.png';

const SPLASH_DURATION_MS = 2000;

export default function AppSplashScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  let isDarkTheme = systemColorScheme === 'dark';

  try {
    const themeContext = useAppTheme();
    if (themeContext?.isDark !== undefined) {
      isDarkTheme = themeContext.isDark;
    }
  } catch {}

  const [screenDim, setScreenDim] = useState(() => Dimensions.get('screen'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      if (screen) {
        setScreenDim(screen);
      }
    });

    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(async () => {
      try {
        const session = await getSession();
        const nextRoute = session?.isLoggedIn ? '/(tabs)/home' : '/(auth)/login';
        router.replace(nextRoute);
      } catch {
        router.replace('/(auth)/login');
      }
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timer);
      subscription?.remove?.();
    };
  }, [router]);

  const splashSource = isDarkTheme ? darkSplash : lightSplash;
  const bgColor = isDarkTheme ? '#020714' : '#ffffff';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar hidden translucent backgroundColor="transparent" />
      <Image
        source={splashSource}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: screenDim.width,
          height: screenDim.height,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

