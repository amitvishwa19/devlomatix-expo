import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function TabLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const session = await getSession();

      if (!isMounted) {
        return;
      }

      if (!session?.isLoggedIn) {
        router.replace('/(auth)/login');
        return;
      }

      setIsReady(true);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isReady) {
    return null;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="product" options={{ title: 'Product' }} />
      <Tabs.Screen name="apps" options={{ title: 'Apps' }} />
      <Tabs.Screen name="account" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>);

}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  const icon = (routeName, iconColor) => {
    const size = 20;

    switch (routeName) {
      case 'home':
        return <FontAwesome size={size} name="home" color={iconColor} />;
      case 'product':
        return <FontAwesome size={size} name="cube" color={iconColor} />;
      case 'apps':
        return <Ionicons size={size} name="grid-outline" color={iconColor} />;
      case 'account':
        return <FontAwesome size={size} name="user" color={iconColor} />;
      case 'settings':
        return <Ionicons size={size} name="settings-outline" color={iconColor} />;
      default:
        return <FontAwesome size={size} name="circle" color={iconColor} />;
    }
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-2 left-0 right-0 items-center"
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        zIndex: 100,
        elevation: 20
      }}>
      <Animated.View
        className="w-[95%] flex-row items-center justify-around rounded-2xl px-2 py-4"
        style={{
          backgroundColor: palette.colors.tabBar,
          zIndex: 100,
          elevation: 20
        }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
          typeof options.tabBarLabel === 'string' ?
          options.tabBarLabel :
          options.title !== undefined ?
          options.title :
          route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key
            });
          };

          return (
            <AnimatedTouchableOpacity
              key={route.key}
              layout={LinearTransition.springify().mass(0.5)}
              onPress={onPress}
              onLongPress={onLongPress}
              testID={options.tabBarButtonTestID}
              className="flex-row items-center gap-x-2 rounded-2xl p-2"
              style={{ backgroundColor: isFocused ? palette.colors.tabActive : 'transparent' }}>
              {icon(route.name, isFocused ? palette.tabActiveIcon : palette.tabInactiveIcon)}
              {isFocused ?
              <Animated.Text
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                className="text-sm font-bold"
                style={{ color: palette.tabActiveTextColor }}>
                  {label}
                </Animated.Text> :
              null}
            </AnimatedTouchableOpacity>);

        })}
      </Animated.View>
    </View>);

}
