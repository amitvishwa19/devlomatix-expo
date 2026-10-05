import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const tabConfig = {
  index: { icon: 'rocket-outline', activeIcon: 'rocket', label: 'Dashboard' },
  pipeline: { icon: 'funnel-outline', activeIcon: 'funnel', label: 'Pipeline' },
  contacts: { icon: 'people-outline', activeIcon: 'people', label: 'Contacts' },
  tasks: { icon: 'checkbox-outline', activeIcon: 'checkbox', label: 'Tasks' },
  copilot: { icon: 'sparkles-outline', activeIcon: 'sparkles', label: 'Copilot' },
};

export default function CrmTabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CrmCustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="pipeline" options={{ title: 'Pipeline' }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="copilot" options={{ title: 'AI Copilot' }} />
    </Tabs>
  );
}

function CrmCustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-2 left-0 right-0 items-center"
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        zIndex: 100,
        elevation: 20,
      }}
    >
      <Animated.View
        className="w-[95%] flex-row items-center justify-around rounded-2xl px-2 py-3 shadow-lg border"
        style={{
          backgroundColor: palette.colors.surface || '#ffffff',
          borderColor: palette.colors.border || '#e2e8f0',
          shadowColor: palette.colors.shadow || '#000000',
          zIndex: 100,
          elevation: 20,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;
          const cfg = tabConfig[route.name] || { icon: 'ellipse-outline', activeIcon: 'ellipse', label };
          const activeColor = '#4f46e5'; // Indigo brand color for DevX CRM

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
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
              className="flex-row items-center gap-x-2 rounded-xl px-3 py-2"
              style={{
                backgroundColor: isFocused ? '#4f46e5' : 'transparent',
              }}
            >
              <Ionicons
                size={18}
                name={isFocused ? cfg.activeIcon : cfg.icon}
                color={isFocused ? '#ffffff' : palette.textMutedColor || '#64748b'}
              />
              {isFocused ? (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="text-[11px] font-bold text-white tracking-tight"
                >
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
