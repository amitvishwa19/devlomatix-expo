import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CurexaLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CurexaTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="patients" options={{ title: 'Patients' }} />
      <Tabs.Screen name="crm" options={{ title: 'CRM' }} />
      <Tabs.Screen name="appointments" options={{ title: 'Visits' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>);
}

function CurexaTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  const icon = (routeName, iconColor) => {
    const size = 19;

    switch (routeName) {
      case 'index':
        return <Ionicons size={size} name="pulse-outline" color={iconColor} />;
      case 'patients':
        return <Ionicons size={size} name="people-outline" color={iconColor} />;
      case 'crm':
        return <Ionicons size={size} name="sparkles-outline" color={iconColor} />;
      case 'appointments':
        return <Ionicons size={size} name="calendar-outline" color={iconColor} />;
      case 'settings':
        return <FontAwesome size={size} name="sliders" color={iconColor} />;
      default:
        return <FontAwesome size={size} name="circle" color={iconColor} />;
    }
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        zIndex: 100,
        elevation: 20
      }}>
      <Animated.View
        className="w-[96%] flex-row items-center justify-around rounded-[28px] border px-2 py-4"
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
            typeof options.tabBarLabel === 'string' ?
            options.tabBarLabel :
            options.title !== undefined ?
            options.title :
            route.name;
          const isFocused = state.index === index;
          const activeBackground = '#059669';

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
              className="flex-row items-center gap-x-2 rounded-2xl px-3 py-2"
              style={{ backgroundColor: isFocused ? activeBackground : 'transparent' }}>
              {icon(route.name, isFocused ? '#ffffff' : palette.textMutedColor)}
              {isFocused ?
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="text-sm font-bold text-white">
                  {label}
                </Animated.Text> :
                null}
            </AnimatedTouchableOpacity>);
        })}
      </Animated.View>
    </View>);
}
