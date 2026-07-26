import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Modal, Pressable, Switch, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useWidgets } from '~/contexts/WidgetContext';
import { useAppTheme } from '~/theme/AppTheme';

const appMeta = {
  solarbright: {
    name: 'SolarBright',
    badge: 'Solar Panel Cleaning',
    route: '/solarbright',
    accentBg: 'bg-amber-600',
    accentBgLight: 'bg-amber-500/15',
    accentText: 'text-amber-600',
    dot: 'bg-amber-500',
    stats: [
      { label: 'Cities Served', value: '50+' },
      { label: 'Panels Cleaned', value: '10K+' },
      { label: 'Efficiency Boost', value: '30%' },
    ],
    description: 'Premium solar panel cleaning and maintenance service.',
  },
  curexa: {
    name: 'Curexa',
    badge: 'Hospital Management',
    route: '/(modules)/curexa',
    accentBg: 'bg-emerald-600',
    accentBgLight: 'bg-emerald-500/15',
    accentText: 'text-emerald-600',
    dot: 'bg-emerald-500',
    stats: [
      { label: 'Active Beds', value: '218' },
      { label: "Today's Appointments", value: '146' },
      { label: 'CRM Automations', value: '32' },
    ],
    description: 'Complete hospital management system with AI powered CRM.',
  },
  konnectx: {
    name: 'KonnectX',
    badge: 'WhatsApp Platform',
    route: '/(modules)/konnectx',
    accentBg: 'bg-sky-600',
    accentBgLight: 'bg-sky-500/15',
    accentText: 'text-sky-600',
    dot: 'bg-sky-500',
    stats: [
      { label: 'Total Campaigns', value: '12' },
      { label: 'Messages Sent', value: '48.2K' },
      { label: 'Active Contacts', value: '8.1K' },
      { label: 'Templates', value: '6' },
    ],
    description: 'WhatsApp Cloud API management for messaging, campaigns, and contacts.',
  },
  crystalaura: {
    name: 'CrystalAura',
    badge: 'E-Commerce Admin',
    route: '/(modules)/crystalaura',
    accentBg: 'bg-purple-600',
    accentBgLight: 'bg-purple-500/15',
    accentText: 'text-purple-600',
    dot: 'bg-purple-500',
    stats: [
      { label: 'Total Revenue', value: '$12.4K' },
      { label: 'Orders', value: '89' },
      { label: 'Products', value: '156' },
      { label: 'Stores', value: '3' },
    ],
    description: 'E-commerce admin for managing products, orders, and connected stores.',
  },
};

const widgetColors = {
  solarbright: { label: 'SolarBright', color: '#d97706' },
  curexa: { label: 'Curexa', color: '#059669' },
  konnectx: { label: 'KonnectX', color: '#0284c7' },
  crystalaura: { label: 'CrystalAura', color: '#9333ea' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { widgets, toggleWidget, setAll } = useWidgets();
  const { notifications, unreadCount } = useNotificationStore();
  const [showCustomize, setShowCustomize] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const enabledKeys = Object.entries(widgets).filter(([, v]) => v).map(([k]) => k);
  const allEnabled = enabledKeys.length === Object.keys(widgets).length;

  return (
    <AppScreen>
      <View className="flex-1">
        <UserStatusBar scrollY={scrollY} />

        <Animated.ScrollView className="flex-1" showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}>
          <View className="px-5 pb-8 pt-5">
            <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
                    DASHBOARD
                  </Text>
                  <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
                    Your team command center
                  </Text>
                  <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
                    Overview of all active products, key metrics, and quick access to every module.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowCustomize(true)}
                  className={`rounded-2xl p-3 ${palette.surfaceAlt}`}
                >
                  <Ionicons name="options-outline" size={22} color={palette.textColor} />
                </Pressable>
              </View>
            </View>

            {enabledKeys.length === 0 && (
              <View className={`mb-4 rounded-[24px] p-6 items-center ${palette.surface}`}>
                <Ionicons name="eye-off-outline" size={36} color={palette.textMutedColor} />
                <Text className={`mt-3 text-[16px] font-bold ${palette.text}`}>No widgets visible</Text>
                <Text className={`mt-1 text-[13px] text-center ${palette.textSoft}`}>
                  Tap the customize button above to show app widgets on your dashboard.
                </Text>
              </View>
            )}

            {unreadCount > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/messages')}
                className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}
              >
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className={`text-[16px] font-bold ${palette.text}`}>Recent activity</Text>
                  <View className="items-center justify-center rounded-full bg-teal-600 px-2.5 py-0.5">
                    <Text className="text-[11px] font-bold text-white">{unreadCount} new</Text>
                  </View>
                </View>
                {notifications.filter((n) => !n.read).slice(0, 3).map((n) => (
                  <View key={n.id} className={`mb-2 flex-row items-center gap-3 rounded-[16px] p-3 ${palette.surfaceInset}`}>
                    <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${n.color || '#6b7280'}20` }}>
                      <Ionicons name={n.icon || 'notifications'} size={14} color={n.color || '#6b7280'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-[13px] font-semibold ${palette.text}`}>{n.title}</Text>
                      <Text className={`text-[11px] ${palette.textMuted}`}>{n.description}</Text>
                    </View>
                  </View>
                ))}
                <Text className={`mt-1 text-[12px] font-semibold text-teal-600`}>View all →</Text>
              </Pressable>
            )}

            {enabledKeys.map((key) => {
              const app = appMeta[key];
              if (!app) return null;

              return (
                <Pressable
                  key={key}
                  className={`mb-4 rounded-[24px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}
                  onPress={() => router.push(app.route)}
                >
                  <View className="mb-3.5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className={`h-2.5 w-2.5 rounded-full ${app.dot}`} />
                      <Text className={`text-[18px] font-bold ${palette.text}`}>{app.name}</Text>
                    </View>
                    <View className={`rounded-full px-3 py-1.5 ${app.accentBg}`}>
                      <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">
                        {app.badge}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-3 flex-row flex-wrap gap-2">
                    {app.stats.map((stat) => (
                      <View
                        key={stat.label}
                        className={`flex-1 rounded-[16px] p-3 ${app.accentBgLight}`}
                      >
                        <Text className={`text-[18px] font-bold ${palette.text}`}>{stat.value}</Text>
                        <Text className={`mt-0.5 text-[11px] leading-[14px] ${palette.textSoft}`}>
                          {stat.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className={`mb-3 h-px ${palette.border}`} />

                  <View className="flex-row items-center justify-between">
                    <Text className={`flex-1 text-[13px] leading-[18px] ${palette.textSoft}`}>
                      {app.description}
                    </Text>
                    <Text className={`ml-2 text-[13px] font-bold ${app.accentText}`}>Open →</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.ScrollView>
      </View>

      <Modal
        visible={showCustomize}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomize(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowCustomize(false)}>
          <Pressable className={`rounded-t-[28px] p-5 pb-10 ${palette.surface}`}>
            <View className="mb-2 items-center">
              <View className={`mb-4 h-1 w-10 rounded-full ${palette.surfaceAlt}`} />
              <Text className={`text-[20px] font-bold ${palette.text}`}>Customize Dashboard</Text>
              <Text className={`mt-1 text-[13px] ${palette.textSoft}`}>
                Choose which app widgets appear on your home screen.
              </Text>
            </View>

            <Pressable
              className={`mx-4 mb-4 mt-2 flex-row items-center justify-between rounded-[16px] border p-4 ${palette.border}`}
              onPress={() => setAll(!allEnabled)}
            >
              <Text className={`text-[15px] font-bold ${palette.text}`}>
                {allEnabled ? 'Hide All' : 'Show All'}
              </Text>
              <View
                className={`rounded-full px-3 py-1 ${allEnabled ? 'bg-teal-600' : 'bg-slate-500'}`}
              >
                <Text className="text-[11px] font-bold text-white">
                  {allEnabled ? 'ON' : 'OFF'}
                </Text>
              </View>
            </Pressable>

            {Object.entries(widgetColors).map(([key, meta]) => (
              <View
                key={key}
                className={`mx-4 mb-2 flex-row items-center justify-between rounded-[16px] border p-4 ${palette.border}`}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    <Text
                      className="text-[10px] font-bold uppercase"
                      style={{ color: meta.color }}
                    >
                      {meta.label.slice(0, 2)}
                    </Text>
                  </View>
                  <Text className={`text-[15px] font-semibold ${palette.text}`}>{meta.label}</Text>
                </View>
                <Switch
                  value={widgets[key]}
                  onValueChange={() => toggleWidget(key)}
                  trackColor={{ false: '#475569', true: meta.color }}
                  thumbColor="#f8fafc"
                />
              </View>
            ))}

            <Pressable
              className="mx-4 mt-4 items-center rounded-2xl bg-teal-700 py-4"
              onPress={() => setShowCustomize(false)}
            >
              <Text className="text-[15px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}
