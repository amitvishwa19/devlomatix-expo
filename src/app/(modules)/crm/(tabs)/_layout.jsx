import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';

let HapticsModule = null;
try {
  HapticsModule = require('expo-haptics');
} catch (e) {
  // Graceful fallback if native module unavailable
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const tabConfig = {
  index: { icon: 'rocket-outline', activeIcon: 'rocket', label: 'Dashboard' },
  pipeline: { icon: 'funnel-outline', activeIcon: 'funnel', label: 'Pipeline' },
  contacts: { icon: 'people-outline', activeIcon: 'people', label: 'Contacts' },
  chat: { icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', label: 'Chat' },
  tasks: { icon: 'layers-outline', activeIcon: 'checkbox', label: 'Tasks' },
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
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="copilot" options={{ title: 'AI Copilot' }} />
    </Tabs>
  );
}

function CrmCustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();

  // Dynamic Badges
  const { unreadCount = 0 } = useNotificationStore() || {};
  const crmContext = useCrm?.();
  const tasks = crmContext?.tasks || [];

  const pendingTasksCount = Array.isArray(tasks)
    ? tasks.filter((t) => t && t.status !== 'DONE' && t.status !== 'COMPLETED').length
    : 0;

  // Auto-hide when keyboard opens
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (isKeyboardVisible) {
    return null;
  }

  const getBadgeContent = (routeName) => {
    if (routeName === 'chat' && unreadCount > 0) {
      return unreadCount > 99 ? '99+' : String(unreadCount);
    }
    if (routeName === 'tasks' && pendingTasksCount > 0) {
      return pendingTasksCount > 99 ? '99+' : String(pendingTasksCount);
    }
    return null;
  };

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
        className="w-[95%] flex-row items-center justify-around rounded-2xl px-2 py-2 border"
        style={{
          backgroundColor: colors.tabBar,
          borderColor: colors.tabBarBorder,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.shadowOpacity,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 16,
          zIndex: 100,
          elevation: 20,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;
          const cfg = tabConfig[route.name] || { icon: 'ellipse-outline', activeIcon: 'ellipse', label };
          const badge = getBadgeContent(route.name);

          const onPress = () => {
            // Tactile Haptic Feedback
            if (HapticsModule?.impactAsync) {
              if (isFocused) {
                // Firmer medium pulse on re-tap (triggers scroll-to-top)
                HapticsModule.impactAsync(
                  HapticsModule.ImpactFeedbackStyle?.Medium ?? 'medium'
                ).catch(() => {});
              } else {
                // Subtle light click for tab change
                HapticsModule.impactAsync(
                  HapticsModule.ImpactFeedbackStyle?.Light ?? 'light'
                ).catch(() => {});
              }
            }

            // Standard tab press / scroll to top event
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
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              layout={LinearTransition.springify().mass(0.5)}
              onPress={onPress}
              className="flex-row items-center gap-x-1.5 rounded-xl px-2.5 py-1.5"
              style={{
                backgroundColor: isFocused ? colors.tabBarActiveBg : 'transparent',
              }}
            >
              <View className="relative items-center justify-center">
                <Ionicons
                  size={18}
                  name={isFocused ? cfg.activeIcon : cfg.icon}
                  color={isFocused ? colors.tabBarActiveText : colors.tabBarInactive}
                />
                {badge ? (
                  <View
                    className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] items-center justify-center rounded-full px-0.5 border"
                    style={{
                      backgroundColor: colors.primary || '#0284c7',
                      borderColor: colors.tabBar,
                    }}
                  >
                    <Text className="text-[9px] font-black text-white leading-none text-center">
                      {badge}
                    </Text>
                  </View>
                ) : route.name === 'copilot' ? (
                  <View
                    className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full border"
                    style={{
                      backgroundColor: '#a855f7',
                      borderColor: colors.tabBar,
                    }}
                  />
                ) : null}
              </View>

              {isFocused ? (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  numberOfLines={1}
                  className="text-[11px] font-bold tracking-tight max-w-[80px]"
                  style={{ color: colors.tabBarActiveText }}
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
