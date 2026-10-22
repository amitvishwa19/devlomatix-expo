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
import { hasCompletedOnboarding } from '~/utils/onboardingStorage';

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
  } catch { }

  const [screenDim, setScreenDim] = useState(() => Dimensions.get('screen'));

  useEffect(() => {
    let isMounted = true;

    // Immediately dismiss native OS splash layer so the full-screen splash covers the screen edge-to-edge
    SplashScreen.hideAsync().catch(() => { });

    async function initializeAndRoute() {
      const startTime = Date.now();
      try {
        const [onboarded, session] = await Promise.all([
          hasCompletedOnboarding().catch(() => false),
          getSession().catch(() => null),
        ]);

        // Maintain smooth full-screen splash display
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1200 - elapsed);
        if (remaining > 0) {
          await new Promise((res) => setTimeout(res, remaining));
        }

        if (!isMounted) return;

        let nextRoute = '/(auth)/login';
        if (!onboarded) {
          nextRoute = '/(misc)/onboarding';
        } else if (session?.isLoggedIn) {
          // RBAC gate: check if user has any roles or permissions from the stored session
          const user = session?.user;
          const rawRoles = user?.roles ?? [];
          const rawPerms = user?.permissions ?? [];

          // Support both flat strings and objects: [{value:'...'}, ...] or ['...', ...]
          const permValues = rawPerms.map((p) =>
            typeof p === 'string' ? p : (p?.value ?? '')
          );

          const isSuperAdmin =
            permValues.includes('*') ||
            rawRoles.some((r) => {
              const n = (typeof r === 'string' ? r : r?.title ?? r?.name ?? '').toLowerCase();
              return n === 'super admin' || n === 'superadmin';
            });

          const isAdmin =
            isSuperAdmin ||
            rawRoles.some((r) => {
              const n = (typeof r === 'string' ? r : r?.title ?? r?.name ?? '').toLowerCase();
              return n === 'admin';
            });

          const hasAccess = isSuperAdmin || isAdmin || rawRoles.length > 0 || rawPerms.length > 0;
          nextRoute = hasAccess ? '/(modules)/crm/(tabs)' : '/(misc)/no-access';
        }

        router.replace(nextRoute);
      } catch (err) {
        if (isMounted) {
          router.replace('/(auth)/login');
        }
      }
    }

    initializeAndRoute();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const splashSource = isDarkTheme ? darkSplash : lightSplash;
  const bgColor = isDarkTheme ? '#020714' : '#f5fbfe';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar hidden translucent backgroundColor="transparent" />
      <Image
        source={splashSource}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

