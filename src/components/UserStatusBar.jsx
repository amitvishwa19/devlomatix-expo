import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';

export default function UserStatusBar({ scrollY }) {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { unreadCount } = useNotificationStore();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getSession().then((s) => setUser(s?.user ?? null));
  }, []);

  const offsetAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scrollTimer = useRef(null);

  useEffect(() => {
    if (!scrollY) return;
    const listener = scrollY.addListener(({ value }) => {
      const clampedOffset = Math.max(-60, Math.min(0, -value * 0.2));
      const clampedOpacity = Math.max(0, Math.min(1, 1 - value / 300));
      offsetAnim.setValue(clampedOffset);
      opacityAnim.setValue(clampedOpacity);

      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(offsetAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }, 200);
    });
    return () => {
      scrollY.removeListener(listener);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [scrollY]);

  if (!user) return null;

  const avatarUri = user.avatar || user.photo;

  return (
    <Animated.View className={`flex-row items-center gap-2 px-4 py-2 border-b ${palette.border}`}
      style={{ backgroundColor: palette.colors.surface, transform: [{ translateY: offsetAnim }], opacity: opacityAnim }}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} className="h-10 w-10 rounded-full" />
      ) : (
        <View className="h-7 w-7 items-center justify-center rounded-full bg-teal-600">
          <Text className="text-sm font-bold text-white">
            {(user.displayName || user.name || user.email)?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className={`text-lg font-semibold ${palette.text}`} numberOfLines={1}>
          {user.displayName || user.name || 'User'}
        </Text>
        <Text className={`text-sm ${palette.textMuted}`} numberOfLines={1}>
          {user.email || ''}
        </Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/(misc)/notifications')} className="relative p-1">
        <Ionicons name="notifications-outline" size={24} color={palette.textMutedColor} />
        {unreadCount > 0 && (
          <View className="absolute -right-0.5 -top-0.5 h-3.5 min-w-[14px] items-center justify-center rounded-full bg-teal-600 px-0.5">
            <Text className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
