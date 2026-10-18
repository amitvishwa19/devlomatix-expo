import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, usePathname } from 'expo-router';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  Image,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmTheme } from '../utils/colors';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';

const CrmDrawerContext = createContext(null);

export function useCrmDrawer() {
  const ctx = useContext(CrmDrawerContext);
  return ctx || { isOpen: false, openDrawer: () => {}, closeDrawer: () => {}, toggleDrawer: () => {} };
}

export function CrmDrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const { width } = useWindowDimensions();

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const toggleDrawer = () => setIsOpen((prev) => !prev);

  // Left swipe detection zone: touch starts in the left ~25% (at least 80px)
  const edgeThreshold = Math.max(80, width * 0.25);

  const getStartX = (evt, gestureState) => {
    if (gestureState.x0 != null && gestureState.x0 > 0) {
      return gestureState.x0;
    }
    const pageX = evt?.nativeEvent?.pageX ?? 0;
    const dx = gestureState.dx ?? 0;
    return pageX - dx;
  };

  const isSwipeFromLeft = (evt, gestureState) => {
    const startX = getStartX(evt, gestureState);
    const dx = gestureState.dx ?? 0;
    const dy = gestureState.dy ?? 0;
    return (
      !isOpen &&
      startX <= edgeThreshold &&
      dx > 20 &&
      Math.abs(dx) > Math.abs(dy) * 1.1
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => isSwipeFromLeft(evt, gestureState),
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => isSwipeFromLeft(evt, gestureState),
        onPanResponderMove: (evt, gestureState) => {
          if (!isOpen && ((gestureState.dx ?? 0) > 40 || (gestureState.vx ?? 0) > 0.3)) {
            openDrawer();
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (!isOpen && ((gestureState.dx ?? 0) > 25 || (gestureState.vx ?? 0) > 0.2)) {
            openDrawer();
          }
        },
      }),
    [isOpen, edgeThreshold]
  );

  return (
    <CrmDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        {children}
      </View>
      <CrmDrawerModal visible={isOpen} onClose={closeDrawer} />
    </CrmDrawerContext.Provider>
  );
}

export default CrmDrawerProvider;

/**
 * CRM Navigation Children matching Web App DevX(CRM) Sidebar:
 * Dashboard, DCR, Chat & Calls, AI Copilot, Pipelines & Deals,
 * Quotations, 360° Contacts, Candidates, Companies, Tasks, Analytics, Settings
 */
const crmNavigationCategories = [
  {
    title: 'CORE SALES & DEALS',
    items: [
      {
        route: '/(modules)/crm/(tabs)',
        label: 'Dashboard',
        badge: 'Main',
        icon: 'grid-outline',
        activeIcon: 'grid',
      },
      {
        route: '/(modules)/crm/(tabs)/pipeline',
        label: 'Pipelines & Deals',
        icon: 'funnel-outline',
        activeIcon: 'funnel',
      },
      {
        route: '/(modules)/crm/(tabs)/contacts',
        label: '360° Contacts',
        icon: 'people-outline',
        activeIcon: 'people',
      },
      {
        route: '/(modules)/crm/quotations',
        label: 'Quotations & Invoices',
        icon: 'receipt-outline',
        activeIcon: 'receipt',
      },
      {
        route: '/(modules)/crm/tasks',
        label: 'Tasks & Follow-ups',
        icon: 'checkbox-outline',
        activeIcon: 'checkbox',
      },
    ],
  },
  {
    title: 'FIELD & COMMUNICATIONS',
    items: [
      {
        route: '/(modules)/crm/dcr',
        label: 'Daily Call Record (DCR)',
        badge: 'Field',
        icon: 'call-outline',
        activeIcon: 'call',
      },
      {
        route: '/(modules)/crm/chat',
        label: 'Chat & VoIP Calls',
        icon: 'chatbubbles-outline',
        activeIcon: 'chatbubbles',
      },
      {
        route: '/(modules)/crm/(tabs)/copilot',
        label: 'FlowGenix AI Copilot',
        badge: 'AI',
        icon: 'sparkles-outline',
        activeIcon: 'sparkles',
      },
    ],
  },
  {
    title: 'INTELLIGENCE & ADMIN',
    items: [
      {
        route: '/(modules)/crm/candidates',
        label: 'Candidates (HireFlow)',
        icon: 'briefcase-outline',
        activeIcon: 'briefcase',
      },
      {
        route: '/(modules)/crm/analytics',
        label: 'Forecast & Leaderboard',
        icon: 'bar-chart-outline',
        activeIcon: 'bar-chart',
      },
      {
        route: '/(modules)/crm/settings',
        label: 'Settings & Workspace',
        icon: 'settings-outline',
        activeIcon: 'settings',
      },
    ],
  },
];

const suiteModules = [
  { name: 'KonnectX', route: '/(modules)/konnectx', color: '#16a34a', icon: 'logo-whatsapp' },
  { name: 'HireFlow', route: '/(modules)/hireflow', color: '#4f46e5', icon: 'briefcase-outline' },
  { name: 'KabadX', route: '/(modules)/kabadx', color: '#0d9488', icon: 'leaf-outline' },
  { name: 'CrystalAura', route: '/(modules)/crystalaura', color: '#9333ea', icon: 'storefront-outline' },
  { name: 'Curexa', route: '/(modules)/curexa', color: '#059669', icon: 'medkit-outline' },
  { name: 'SolarBright', route: '/(modules)/solarbright', color: '#d97706', icon: 'sunny-outline' },
];

function CrmDrawerModal({ visible, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useCrmTheme();
  const { palette } = useAppTheme();

  const [user, setUser] = useState(null);

  const drawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          return (
            (gestureState.dx ?? 0) < -20 &&
            Math.abs(gestureState.dx ?? 0) > Math.abs(gestureState.dy ?? 0) * 1.2
          );
        },
        onPanResponderMove: (_, gestureState) => {
          if ((gestureState.dx ?? 0) < -45 || (gestureState.vx ?? 0) < -0.35) {
            onClose();
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if ((gestureState.dx ?? 0) < -25 || (gestureState.vx ?? 0) < -0.2) {
            onClose();
          }
        },
      }),
    [onClose]
  );

  useEffect(() => {
    if (visible) {
      getSession().then((s) => setUser(s?.user ?? null));
    }
  }, [visible]);

  if (!visible) return null;

  const navigateTo = (route) => {
    onClose();
    router.push(route);
  };

  const avatarUri = user?.avatar || user?.photo;
  const userInitial = (user?.displayName || user?.name || user?.email)?.[0]?.toUpperCase() || 'U';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        {/* Backdrop Overlay */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/60"
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Side Drawer Panel */}
        <Animated.View
          entering={SlideInLeft.duration(250)}
          exiting={SlideOutLeft.duration(200)}
          className="w-[84%] max-w-[320px] flex-1 border-r shadow-2xl"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingTop: Math.max(insets.top, 14),
            paddingBottom: Math.max(insets.bottom, 14),
          }}
          {...drawerPanResponder.panHandlers}
        >
          {/* User Quick Profile Row */}
          <Pressable
            className="mx-3 mt-1 p-2.5 rounded-xl border flex-row items-center gap-2.5 active:opacity-80"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.borderLight,
            }}
            onPress={() => navigateTo('/(modules)/crm/settings')}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="h-8 w-8 rounded-full" />
            ) : (
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-xs font-bold text-white">{userInitial}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xs font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {user?.displayName || user?.name || 'CRM Operator'}
              </Text>
              <Text className="text-[10px]" style={{ color: colors.textMuted }} numberOfLines={1}>
                {user?.email || 'Logged in'}
              </Text>
            </View>
            <Ionicons name="settings-outline" size={14} color={colors.textMuted} />
          </Pressable>

          {/* Navigation Categories & Children */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-3 pt-3">
            {crmNavigationCategories.map((cat) => (
              <View key={cat.title} className="mb-3.5">
                <Text
                  className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-[1.2px]"
                  style={{ color: colors.primary }}
                >
                  {cat.title}
                </Text>
                <View className="gap-y-1">
                  {cat.items.map((item) => {
                    const isActive =
                      pathname === item.route ||
                      (item.route === '/(modules)/crm/(tabs)' &&
                        (pathname === '/(modules)/crm' ||
                          pathname === '/(modules)/crm/' ||
                          pathname === '/(modules)/crm/(tabs)/index'));

                    return (
                      <Pressable
                        key={item.route}
                        onPress={() => navigateTo(item.route)}
                        className="flex-row items-center justify-between rounded-xl px-3 py-2 active:opacity-75"
                        style={{
                          backgroundColor: isActive ? colors.primary : 'transparent',
                        }}
                      >
                        <View className="flex-row items-center gap-x-2.5 flex-1 mr-2">
                          <Ionicons
                            name={isActive ? item.activeIcon : item.icon}
                            size={16}
                            color={isActive ? '#ffffff' : colors.textSecondary}
                          />
                          <Text
                            className="text-[12px]"
                            style={{
                              color: isActive ? '#ffffff' : colors.text,
                              fontWeight: isActive ? '800' : '600',
                            }}
                            numberOfLines={1}
                          >
                            {item.label}
                          </Text>
                        </View>

                        {item.badge && !isActive && (
                          <View
                            className="rounded-full px-1.5 py-0.2 border"
                            style={{
                              backgroundColor: colors.cardAlt,
                              borderColor: colors.borderLight,
                            }}
                          >
                            <Text className="text-[8px] font-bold" style={{ color: colors.primary }}>
                              {item.badge}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Quick Ecosystem Apps */}
            <View className="mb-4 pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
              <Text
                className="mb-2 px-2 text-[10px] font-black uppercase tracking-[1.2px]"
                style={{ color: colors.textMuted }}
              >
                Devlomatix Apps
              </Text>
              <View className="flex-row flex-wrap gap-1.5 px-1">
                {suiteModules.map((mod) => (
                  <Pressable
                    key={mod.name}
                    onPress={() => navigateTo(mod.route)}
                    className="flex-row items-center gap-x-1.5 rounded-lg px-2.5 py-1.5 border active:opacity-75"
                    style={{
                      backgroundColor: colors.cardAlt,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <Ionicons name={mod.icon} size={12} color={mod.color} />
                    <Text className="text-[11px] font-semibold" style={{ color: colors.text }}>
                      {mod.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Return / Apps Catalog */}
          <View className="px-3 pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
            <Pressable
              onPress={() => navigateTo('/(tabs)/apps')}
              className="flex-row items-center justify-center gap-x-1.5 rounded-xl py-2 active:opacity-75"
              style={{ backgroundColor: colors.cardAlt }}
            >
              <Ionicons name="grid-outline" size={14} color={colors.textSecondary} />
              <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                All Tools & Modules Catalog
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
