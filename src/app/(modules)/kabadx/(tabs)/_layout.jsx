import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function KabadxTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <KabadxTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="pickups" options={{ title: 'Sell' }} />
      <Tabs.Screen name="rates" options={{ title: 'Rates' }} />
      <Tabs.Screen name="collectors" options={{ title: 'Track' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}

function KabadxTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  const icon = (routeName, iconColor) => {
    const size = 18;
    switch (routeName) {
      case 'index':
        return <Ionicons size={size} name="home-outline" color={iconColor} />;
      case 'pickups':
        return <Ionicons size={size} name="add-circle-outline" color={iconColor} />;
      case 'rates':
        return <Ionicons size={size} name="pricetag-outline" color={iconColor} />;
      case 'collectors':
        return <Ionicons size={size} name="location-outline" color={iconColor} />;
      case 'analytics':
        return <Ionicons size={size} name="wallet-outline" color={iconColor} />;
      case 'account':
        return <Ionicons size={size} name="person-outline" color={iconColor} />;
      default:
        return <FontAwesome size={size} name="circle" color={iconColor} />;
    }
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-2 left-0 right-0 items-center"
      style={{ paddingBottom: Math.max(insets.bottom, 10), zIndex: 100, elevation: 20 }}>
      <Animated.View
        className="w-[98%] flex-row items-center justify-around rounded-xl border px-1 py-3"
        style={{
          backgroundColor: palette.colors.surface,
          borderColor: palette.colors.border,
          shadowColor: palette.colors.shadow,
          zIndex: 100,
          elevation: 20
        }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;
          const isFocused = state.index === index;
          const activeBackground = '#0d9488';

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

          return (
            <AnimatedTouchableOpacity
              key={route.key}
              layout={LinearTransition.springify().mass(0.5)}
              onPress={onPress}
              className="flex-row items-center gap-x-1.5 rounded-2xl px-2.5 py-2"
              style={{ backgroundColor: isFocused ? activeBackground : 'transparent' }}>
              {icon(route.name, isFocused ? '#ffffff' : palette.textMutedColor)}
              {isFocused ? (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="text-[11px] font-bold text-white">
                  {label}
                </Animated.Text>
              ) : null}
            </AnimatedTouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}
