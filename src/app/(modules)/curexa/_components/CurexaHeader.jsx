import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { useCurexaDrawer } from './CurexaDrawer';

export default function CurexaHeader({ title = 'Curexa HMS', rightAction, showBack = false }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { openDrawer } = useCurexaDrawer();

  return (
    <View
      className={`border-b ${palette.surface} ${palette.border}`}
      style={{ paddingTop: Math.max(insets.top, 12), paddingBottom: 10, paddingHorizontal: 16 }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Drawer Toggle or Back */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={showBack ? () => router.back() : openDrawer}
            className={`h-10 w-10 items-center justify-center rounded-2xl ${palette.surfaceAlt}`}
          >
            <Ionicons
              name={showBack ? 'arrow-back-outline' : 'menu-outline'}
              size={22}
              color={palette.textColor}
            />
          </Pressable>

          <View>
            <View className="flex-row items-center gap-2">
              <Text className={`text-[17px] font-bold ${palette.text}`}>{title}</Text>
              <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                <Text className="text-[9px] font-bold text-emerald-600">LIVE HMS</Text>
              </View>
            </View>
            <Text className={`text-[11px] ${palette.textMuted}`}>Curexa Medical Operations</Text>
          </View>
        </View>

        {/* Right: Custom Action or Default Add Button */}
        {rightAction ? (
          rightAction
        ) : (
          <Pressable
            onPress={openDrawer}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 py-1.5"
          >
            <Ionicons name="apps-outline" size={16} color="#059669" />
            <Text className="text-[11px] font-bold text-emerald-600">Modules</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
