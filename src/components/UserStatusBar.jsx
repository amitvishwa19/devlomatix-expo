import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '~/contexts/LanguageContext';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';

export default function UserStatusBar({ scrollY }) {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { t } = useLanguage();
  const { unreadCount } = useNotificationStore();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getSession().then((s) => setUser(s?.user ?? null));
  }, []);

  const offsetAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const animRef = useRef(null);
  const settleTimer = useRef(null);

  const settleTo = (show) => {
    if (animRef.current) animRef.current.stop();
    animRef.current = Animated.parallel([
      Animated.timing(offsetAnim, {
        toValue: show ? 0 : -84,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: show ? 1 : 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);
    animRef.current.start();
  };

  useEffect(() => {
    if (!scrollY) return;
    const listener = scrollY.addListener(({ value }) => {
      const rawOffset = -value * 0.35;
      offsetAnim.setValue(Math.max(-84, Math.min(0, rawOffset)));
      opacityAnim.setValue(Math.max(0, Math.min(1, 1 - value / 260)));

      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        settleTo(value < 160);
      }, 140);
    });
    return () => {
      scrollY.removeListener(listener);
      if (settleTimer.current) clearTimeout(settleTimer.current);
      if (animRef.current) animRef.current.stop();
    };
  }, [scrollY]);

  const avatarUri = user?.avatar || user?.photo;
  const userInitial = (user?.displayName || user?.name || user?.email)?.[0]?.toUpperCase() || 'U';

  return (
    <Animated.View className={`flex-row items-center gap-2 px-4 py-2 border-b ${palette.border}`}
      style={{
        backgroundColor: palette.colors.surface,
        transform: scrollY ? [{ translateY: offsetAnim }] : undefined,
        opacity: scrollY ? opacityAnim : 1,
      }}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} className="h-10 w-10 rounded-full" />
      ) : (
        <View className="h-7 w-7 items-center justify-center rounded-full bg-teal-600">
          <Text className="text-sm font-bold text-white">
            {userInitial}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text
          className="text-lg font-semibold"
          style={{ color: palette.colors.text }}
          numberOfLines={1}>
          {user?.displayName || user?.name || t('user')}
        </Text>
        <Text
          className="text-sm"
          style={{ color: palette.colors.textMuted || palette.colors.subtext }}
          numberOfLines={1}>
          {user?.email || ''}
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