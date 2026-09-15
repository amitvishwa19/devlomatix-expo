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

export default CurexaDrawerProvider;

const menuCategories = [
  {
    title: 'CLINICAL OPERATIONS',
    items: [
      { route: '/(modules)/curexa/(tabs)', label: 'Overview Command Center', icon: 'pulse-outline', activeIcon: 'pulse' },
      { route: '/(modules)/curexa/(tabs)/patients', label: 'Patient EMR Directory', icon: 'people-outline', activeIcon: 'people' },
      { route: '/(modules)/curexa/(tabs)/appointments', label: 'OPD Scheduler & Queue', icon: 'calendar-outline', activeIcon: 'calendar' },
      { route: '/(modules)/curexa/prescriptions', label: 'e-Prescriptions (e-Rx)', icon: 'document-text-outline', activeIcon: 'document-text' },
      { route: '/(modules)/curexa/workflow', label: 'Clinical Workflow Kanban', icon: 'git-network-outline', activeIcon: 'git-network' },
    ],
  },
  {
    title: 'INPATIENT & DIAGNOSTICS',
    items: [
      { route: '/(modules)/curexa/beds', label: 'Wards & Bed Matrix (IPD)', icon: 'bed-outline', activeIcon: 'bed' },
      { route: '/(modules)/curexa/laboratory', label: 'Diagnostics & Lab Tests', icon: 'flask-outline', activeIcon: 'flask' },
    ],
  },
  {
    title: 'PHARMACY & FINANCE',
    items: [
      { route: '/(modules)/curexa/pharmacy', label: 'Pharmacy & Drug Stock', icon: 'medkit-outline', activeIcon: 'medkit' },
      { route: '/(modules)/curexa/billing', label: 'Invoices & Payments', icon: 'receipt-outline', activeIcon: 'receipt' },
    ],
  },
  {
    title: 'HOSPITAL ADMIN & ANALYTICS',
    items: [
      { route: '/(modules)/curexa/departments', label: 'Departments & Doctors', icon: 'business-outline', activeIcon: 'business' },
      { route: '/(modules)/curexa/reports', label: 'Reports & Hospital Stats', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
      { route: '/(modules)/curexa/crm', label: 'Patient Care CRM', icon: 'sparkles-outline', activeIcon: 'sparkles' },
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
          className={`w-[84%] max-w-[320px] flex-1 border-r ${palette.surface} ${palette.border}`}
          style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {/* Header Badge */}
          <View className="px-4 pb-3 border-b border-gray-200/15 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-[14px] bg-emerald-600 shadow-sm">
                <Ionicons name="medical" size={20} color="#ffffff" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className={`text-[16px] font-bold ${palette.text}`}>Curexa HMS</Text>
                  <View className="rounded-full bg-emerald-500/20 px-1.5 py-0.5">
                    <Text className="text-[9px] font-bold text-emerald-600">PRO</Text>
                  </View>
                </View>
                <Text className={`text-[11px] ${palette.textMuted}`}>Hospital Command Center</Text>
              </View>
            </View>
            <Pressable onPress={onClose} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
              <Ionicons name="close" size={16} color={palette.textMutedColor} />
            </Pressable>
          </View>

          {/* Nav Categories */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-3 pt-2">
            {menuCategories.map((cat) => (
              <View key={cat.title} className="mb-3">
                <Text className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[1.2px] text-emerald-600">
                  {cat.title}
                </Text>
                <View className="gap-1">
                  {cat.items.map((item) => {
                    const isActive =
                      pathname === item.route ||
                      (item.route === '/(modules)/curexa/(tabs)' &&
                        (pathname === '/(modules)/curexa' ||
                          pathname === '/(modules)/curexa/' ||
                          pathname === '/(modules)/curexa/(tabs)/index'));

                    return (
                      <Pressable
                        key={item.route}
                        onPress={() => navigateTo(item.route)}
                        className={`flex-row items-center gap-2.5 rounded-[14px] px-3 py-2 ${
                          isActive ? 'bg-emerald-600' : 'transparent'
                        }`}
                      >
                        <Ionicons
                          name={isActive ? item.activeIcon : item.icon}
                          size={17}
                          color={isActive ? '#ffffff' : palette.textMutedColor}
                        />
                        <Text
                          className={`text-[13px] font-medium ${
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
          <View className="px-3 pt-2 border-t border-gray-200/15">
            <Pressable
              onPress={() => {
                onClose();
                router.replace('/(tabs)/home');
              }}
              className="flex-row items-center justify-center gap-2 rounded-[14px] bg-gray-500/15 py-2.5"
            >
              <Ionicons name="home-outline" size={15} color={palette.textColor} />
              <Text className={`text-[12px] font-bold ${palette.text}`}>Return to Main App</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
