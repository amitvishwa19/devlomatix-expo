import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, TouchableOpacity, View } from 'react-native';
import { useCrmDrawer } from '~/app/(modules)/crm/_components/CrmDrawer';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';

export default function UserStatusBar({
  scrollY,
  onPressUser,
  showMenu = true,
  showNotifications = true,
  showAnalytics = true,
  showSettings = true,
  rightActions,
}) {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { unreadCount } = useNotificationStore();
  const [user, setUser] = useState(null);
  const { openDrawer } = useCrmDrawer();

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

  const handleUserPress = () => {
    if (onPressUser) {
      onPressUser();
    } else {
      router.push('/(modules)/crm/settings');
    }
  };

  const avatarUri = user?.avatar || user?.photo;
  const userInitial = (user?.displayName || user?.name || user?.email)?.[0]?.toUpperCase() || 'U';

  const actionBtnBg = palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const actionBtnBorder = palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  return (
    <Animated.View className={`flex-row items-center gap-2 px-3 py-2 ${palette.border} border-b`}
      style={{
        backgroundColor: palette.colors.surface,
        transform: scrollY ? [{ translateY: offsetAnim }] : undefined,
        opacity: scrollY ? opacityAnim : 1,
      }}>
      {/* Menu / Drawer Toggle */}
      {showMenu && (
        <TouchableOpacity
          onPress={openDrawer}
          className="h-8 w-8 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: actionBtnBg,
            borderColor: actionBtnBorder,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={18} color={palette.textColor} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={handleUserPress}
        className="flex-1 flex-row items-center gap-2"
        activeOpacity={0.7}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} className="h-8 w-8 rounded-full" />
        ) : (
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-600">
            <Text className="text-xs font-bold text-white">
              {userInitial}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className={`text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
            {user?.displayName || user?.name || 'User'}
          </Text>
          <Text className={`text-[10px] ${palette.textMuted}`} numberOfLines={1}>
            {user?.email || ''}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right Side: Action Shortcuts */}
      <View className="flex-row items-center gap-x-1.5">


        {/* Analytics */}
        {showAnalytics && (
          <TouchableOpacity
            onPress={() => router.push('/(modules)/crm/analytics')}
            className="h-8 w-8 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: actionBtnBg,
              borderColor: actionBtnBorder,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="bar-chart-outline" size={15} color={palette.textSoftColor} />
          </TouchableOpacity>
        )}

        {/* Notifications */}
        {showNotifications && (
          <TouchableOpacity
            onPress={() => router.push('/(misc)/notifications')}
            className="h-8 w-8 items-center justify-center rounded-xl border relative"
            style={{
              backgroundColor: actionBtnBg,
              borderColor: actionBtnBorder,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={15} color={palette.textSoftColor} />
            {unreadCount > 0 && (
              <View className="absolute -right-0.5 -top-0.5 h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-0.5">
                <Text className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}


        {rightActions}
      </View>
    </Animated.View>
  );
}