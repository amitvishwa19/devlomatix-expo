import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';
import { useAppTheme } from '~/theme/AppTheme';

const activities = [
  { icon: 'leaf', text: 'Crop protection schedule generated for Wheat plot', time: '10 min ago', color: '#10b981' },
  { icon: 'shield-checkmark', text: 'Homeopathic pest repellent dosage applied', time: '25 min ago', color: '#059669' },
  { icon: 'water', text: 'Soil bio-enhancement remedy dispatched', time: '1 hr ago', color: '#047857' },
  { icon: 'person-add', text: 'New field manager added to KrishiMitra', time: '2 hrs ago', color: '#0d9488' },
  { icon: 'checkmark-circle', text: 'Field diagnosis analysis completed', time: '4 hrs ago', color: '#10b981' },
  { icon: 'receipt', text: 'Order for bio-fertilizer confirmed', time: '1 day ago', color: '#6b7280' },
];

export default function ActivityScreen() {
  const { palette } = useAppTheme();
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <AppScreen>
      <UserStatusBar scrollY={scrollY} />
      <Animated.ScrollView className="flex-1" showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}>
        <View className="px-5 pb-28 pt-5">
          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              RECENT
            </Text>
            <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
              Activity
            </Text>
            <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
              Cross-module audit trail of key events and actions.
            </Text>
          </View>

          {activities.map((item, idx) => (
            <View key={idx} className={`mb-3 rounded-[24px] p-4 flex-row items-center gap-4 ${palette.surface}`}>
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${item.color}15` }}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className={`text-[14px] leading-5 ${palette.text}`}>{item.text}</Text>
                <Text className={`mt-1 text-[11px] ${palette.textSoft}`}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.ScrollView>
    </AppScreen>
  );
}
