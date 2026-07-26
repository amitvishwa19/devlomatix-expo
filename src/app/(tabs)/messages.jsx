import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserStatusBar from '~/components/UserStatusBar';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useAppTheme } from '~/theme/AppTheme';

const MODULE_COLORS = {
  solarbright: '#d97706',
  curexa: '#059669',
  konnectx: '#0284c7',
  crystalaura: '#9333ea',
};

export default function MessagesScreen() {
  const { palette } = useAppTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <UserStatusBar scrollY={scrollY} />
      <Animated.ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}>
        <View className="px-5 pb-28 pt-5">
          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
                  INBOX
                </Text>
                <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
                  Messages
                </Text>
                <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
                  Notifications and updates from across your workspace.
                </Text>
              </View>
              {unreadCount > 0 && (
                <View className="items-center justify-center rounded-full bg-teal-600 px-3 py-1">
                  <Text className="text-[13px] font-bold text-white">{unreadCount}</Text>
                </View>
              )}
            </View>
          </View>

          {notifications.length > 0 ? (
            <>
              <View className="mb-3 flex-row gap-2">
                {unreadCount > 0 && (
                  <Pressable
                    onPress={markAllAsRead}
                    className="flex-row items-center gap-1.5 rounded-full bg-teal-700/10 px-4 py-2"
                  >
                    <Ionicons name="checkmark-done" size={16} color="#0d9488" />
                    <Text className="text-[12px] font-bold text-teal-700">Mark all read</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={clearAll}
                  className="flex-row items-center gap-1.5 rounded-full bg-rose-500/10 px-4 py-2"
                >
                  <Ionicons name="trash-outline" size={16} color="#e11d48" />
                  <Text className="text-[12px] font-bold text-rose-600">Clear all</Text>
                </Pressable>
              </View>

              {notifications.map((item) => {
                const color = MODULE_COLORS[item.module] || item.color || '#6b7280';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    className={`mb-3 rounded-[24px] p-4 flex-row items-center gap-4 ${palette.surface} ${!item.read ? 'border-l-4' : ''}`}
                    style={!item.read ? { borderLeftColor: color } : undefined}
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Ionicons
                        name={item.icon || 'notifications'}
                        size={18}
                        color={color}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className={`text-[15px] font-bold flex-1 ${palette.text}`}>
                          {item.title}
                        </Text>
                        {!item.read && (
                          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                        )}
                      </View>
                      {item.description ? (
                        <Text className={`mt-0.5 text-[13px] leading-[18px] ${palette.textSoft}`}>
                          {item.description}
                        </Text>
                      ) : null}
                      <Text className={`mt-1 text-[11px] ${palette.textMuted}`}>
                        {item.module ? `${item.module.charAt(0).toUpperCase() + item.module.slice(1)} · ` : ''}
                        {formatRelativeTime(item.time)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </>
          ) : (
            <View className={`rounded-[24px] p-8 items-center ${palette.surface}`}>
              <Ionicons name="notifications-off-outline" size={40} color={palette.textMutedColor} />
              <Text className={`mt-4 text-[16px] font-bold ${palette.text}`}>All caught up</Text>
              <Text className={`mt-1 text-[13px] text-center ${palette.textSoft}`}>
                No new notifications. Activity from your apps will appear here.
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return `${days} day ago`;
  return new Date(isoString).toLocaleDateString();
}
