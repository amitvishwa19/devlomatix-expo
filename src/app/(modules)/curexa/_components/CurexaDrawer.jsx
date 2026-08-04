import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, usePathname } from 'expo-router';
import { createContext, useContext, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

const CurexaDrawerContext = createContext(null);

export function useCurexaDrawer() {
  const ctx = useContext(CurexaDrawerContext);
  if (!ctx) {
    throw new Error('useCurexaDrawer must be used within CurexaDrawerProvider');
  }
  return ctx;
}

export function CurexaDrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const toggleDrawer = () => setIsOpen((prev) => !prev);

  return (
    <CurexaDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
      <CurexaDrawerModal visible={isOpen} onClose={closeDrawer} />
    </CurexaDrawerContext.Provider>
  );
}

const menuCategories = [
  {
    title: 'CLINICAL OPERATIONS',
    items: [
      { route: '/(modules)/curexa/(tabs)', label: 'Overview', icon: 'pulse-outline', activeIcon: 'pulse' },
      { route: '/(modules)/curexa/(tabs)/patients', label: 'Patient EHR Directory', icon: 'people-outline', activeIcon: 'people' },
      { route: '/(modules)/curexa/(tabs)/appointments', label: 'OPD Visits & Scheduler', icon: 'calendar-outline', activeIcon: 'calendar' },
    ],
  },
  {
    title: 'INPATIENT & DIAGNOSTICS',
    items: [
      { route: '/(modules)/curexa/beds', label: 'Wards & Bed Grid', icon: 'bed-outline', activeIcon: 'bed' },
      { route: '/(modules)/curexa/laboratory', label: 'Diagnostics & Lab', icon: 'flask-outline', activeIcon: 'flask' },
    ],
  },
  {
    title: 'PHARMACY & FINANCE',
    items: [
      { route: '/(modules)/curexa/pharmacy', label: 'Pharmacy & Stock', icon: 'medkit-outline', activeIcon: 'medkit' },
      { route: '/(modules)/curexa/billing', label: 'Billing & Invoices', icon: 'receipt-outline', activeIcon: 'receipt' },
    ],
  },
  {
    title: 'HOSPITAL ADMIN',
    items: [
      { route: '/(modules)/curexa/departments', label: 'Departments & Roster', icon: 'business-outline', activeIcon: 'business' },
      { route: '/(modules)/curexa/crm', label: 'Health CRM Pipeline', icon: 'sparkles-outline', activeIcon: 'sparkles' },
      { route: '/(modules)/curexa/(tabs)/settings', label: 'System Settings', icon: 'settings-outline', activeIcon: 'settings' },
    ],
  },
];

function CurexaDrawerModal({ visible, onClose }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  if (!visible) return null;

  const navigateTo = (route) => {
    onClose();
    router.push(route);
  };

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
          className={`w-[82%] max-w-[320px] flex-1 border-r ${palette.surface} ${palette.border}`}
          style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {/* Header Badge */}
          <View className="px-5 pb-4 border-b border-gray-200/15 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600">
                <Ionicons name="medical" size={22} color="#ffffff" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className={`text-[17px] font-bold ${palette.text}`}>Curexa HMS</Text>
                  <View className="rounded-full bg-emerald-500/20 px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold text-emerald-600">PRO</Text>
                  </View>
                </View>
                <Text className={`text-[11px] ${palette.textMuted}`}>Hospital Command Center</Text>
              </View>
            </View>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={18} color={palette.textMutedColor} />
            </Pressable>
          </View>

          {/* Nav Categories */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-3 pt-3">
            {menuCategories.map((cat, idx) => (
              <View key={cat.title} className="mb-4">
                <Text className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[1.2px] text-emerald-600">
                  {cat.title}
                </Text>
                <View className="gap-1">
                  {cat.items.map((item) => {
                    const isActive =
                      pathname === item.route ||
                      (item.route === '/(modules)/curexa' && (pathname === '/(modules)/curexa' || pathname === '/(modules)/curexa/'));

                    return (
                      <Pressable
                        key={item.route}
                        onPress={() => navigateTo(item.route)}
                        className={`flex-row items-center gap-3 rounded-2xl px-3.5 py-2.5 ${
                          isActive ? 'bg-emerald-600' : 'transparent'
                        }`}
                      >
                        <Ionicons
                          name={isActive ? item.activeIcon : item.icon}
                          size={18}
                          color={isActive ? '#ffffff' : palette.textMutedColor}
                        />
                        <Text
                          className={`text-[13px] font-semibold ${
                            isActive ? 'text-white font-bold' : palette.text
                          }`}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer Return Button */}
          <View className="px-4 pt-3 border-t border-gray-200/15">
            <Pressable
              onPress={() => {
                onClose();
                router.replace('/(tabs)/home');
              }}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-gray-500/15 py-3"
            >
              <Ionicons name="home-outline" size={16} color={palette.textColor} />
              <Text className={`text-[12px] font-bold ${palette.text}`}>Return to Main App</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
