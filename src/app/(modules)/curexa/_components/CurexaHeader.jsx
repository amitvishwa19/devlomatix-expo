import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useCurexaDrawer } from './CurexaDrawer';

export default function CurexaHeader({
  title = 'Curexa HMS',
  subtitle = 'Hospital Command Center',
  rightAction,
  showBack = false,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { openDrawer } = useCurexaDrawer();

  return (
    <View
      className={`border-b ${palette.surface} ${palette.border}`}
      style={{ paddingTop: Math.max(insets.top, 10), paddingBottom: 8, paddingHorizontal: 12 }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Drawer Toggle or Back */}
        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={showBack ? () => router.back() : openDrawer}
            className={`h-9 w-9 items-center justify-center rounded-[14px] ${palette.surfaceAlt}`}
          >
            <Ionicons
              name={showBack ? 'arrow-back-outline' : 'menu-outline'}
              size={20}
              color={palette.textColor}
            />
          </Pressable>

          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className={`text-[15px] font-bold ${palette.text}`} numberOfLines={1}>
                {title}
              </Text>
              <View className="rounded-full bg-emerald-500/20 px-1.5 py-0.2">
                <Text className="text-[9px] font-bold text-emerald-600">HMS</Text>
              </View>
            </View>
            <Text className={`text-[11px] ${palette.textMuted}`} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right Action */}
        {rightAction ? (
          rightAction
        ) : (
          <Pressable
            onPress={openDrawer}
            className="flex-row items-center gap-1 rounded-[12px] bg-emerald-500/15 px-2.5 py-1.5"
          >
            <Ionicons name="grid-outline" size={15} color="#059669" />
            <Text className="text-[11px] font-bold text-emerald-600">Hub</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
