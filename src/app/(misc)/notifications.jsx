import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useAppTheme } from '~/theme/AppTheme';
import { handleNotificationData } from '~/utils/notificationRouter';

const SWIPE_THRESHOLD = -80;

function relativeTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return '';
  const diff = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(value).toLocaleDateString();
}

function SwipeableRow({ item, onDelete, onPress, palette }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) translateX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -500,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDelete(item.id));
  };

  return (
    <View className="mb-2 overflow-hidden rounded-[16px]">
      <View className="absolute right-0 top-0 bottom-0 w-20 items-center justify-center bg-red-500/20 rounded-r-[16px]">
        <TouchableOpacity onPress={handleDelete} className="items-center">
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text className="text-[10px] font-bold text-red-500 mt-0.5">Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          className={`flex-row items-center gap-3 border p-3 ${
            !item.read ? palette.surfaceInset : palette.surface
          } ${palette.border}`}
          style={
            !item.read
              ? { borderLeftWidth: 3, borderLeftColor: '#0d9488', borderRadius: 16 }
              : { borderRadius: 16 }
          }
        >
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${item.color || '#6b7280'}20` }}
          >
            <Ionicons name={item.icon || 'notifications'} size={16} color={item.color || '#6b7280'} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className={`flex-1 text-[13px] font-semibold ${palette.text}`} numberOfLines={1}>
                {item.title}
              </Text>
              <Text className={`ml-2 text-[10px] ${palette.textMuted}`}>{relativeTime(item.time)}</Text>
            </View>
            <Text className={`text-[11px] ${palette.textMuted}`} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          {!item.read && <View className="h-2 w-2 rounded-full bg-teal-500" />}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
  } = useNotificationStore();
  const [activeModule, setActiveModule] = useState('all');

  const modules = useMemo(() => {
    const set = new Set(notifications.map((n) => n.module).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [notifications]);

  const filtered = useMemo(
    () =>
      activeModule === 'all'
        ? notifications
        : notifications.filter((n) => n.module === activeModule),
    [notifications, activeModule]
  );

  const handlePress = (item) => {
    if (!item.read) markAsRead(item.id);
    if (item.route) {
      router.push(item.route);
      return;
    }
    handleNotificationData(item.data || {}, router, null);
  };

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View
        className={`flex-row items-center justify-between px-4 py-3 border-b ${palette.border}`}
        style={{ backgroundColor: palette.colors.surface }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={palette.textColor} />
        </TouchableOpacity>
        <Text className={`text-[16px] font-bold ${palette.text}`}>Notifications</Text>
        <View className="flex-row gap-2">
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} className="p-1">
              <Text className="text-[12px] font-bold text-sky-500">Read all</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={clearAll} className="p-1">
            <Text className="text-[12px] font-bold text-red-400">Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {modules.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-[46px] px-3 py-2"
          contentContainerStyle={{ gap: 6 }}
        >
          {modules.map((module) => {
            const active = activeModule === module;
            return (
              <Pressable
                key={module}
                onPress={() => setActiveModule(module)}
                className="rounded-full border px-3 py-1.5"
                style={{
                  backgroundColor: active ? palette.colors.tabBar : palette.colors.surface,
                  borderColor: palette.colors.border,
                }}
              >
                <Text
                  className="text-[11px] font-bold capitalize"
                  style={{ color: active ? '#ffffff' : palette.textMutedColor }}
                >
                  {module}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Ionicons name="notifications-off-outline" size={40} color={palette.textMutedColor} />
            <Text className={`mt-3 text-[15px] font-bold ${palette.text}`}>No notifications</Text>
            <Text className={`mt-1 text-[12px] ${palette.textSoft}`}>
              You're all caught up!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableRow
            item={item}
            palette={palette}
            onPress={() => handlePress(item)}
            onDelete={removeNotification}
          />
        )}
      />
    </SafeAreaView>
  );
}
