import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserStatusBar from '~/components/UserStatusBar';
import { useAppTheme } from '~/theme/AppTheme';

const tools = [
  {
    id: 'notes',
    name: 'Quick Notes',
    icon: 'document-text-outline',
    color: '#0284c7',
    bg: 'bg-sky-500/15',
    description: 'Capture ideas, meeting notes, and to-dos on the fly.',
  },
  {
    id: 'timer',
    name: 'Pomodoro Timer',
    icon: 'timer-outline',
    color: '#16a34a',
    bg: 'bg-emerald-500/15',
    description: 'Stay focused with 25-minute work sprints and breaks.',
  },
  {
    id: 'habit',
    name: 'Habit Tracker',
    icon: 'analytics-outline',
    color: '#9333ea',
    bg: 'bg-purple-500/15',
    description: 'Track daily habits and build consistent routines.',
  },
  {
    id: 'calendar',
    name: 'Daily Planner',
    icon: 'calendar-outline',
    color: '#d97706',
    bg: 'bg-amber-500/15',
    description: 'Plan your day with time-blocked scheduling.',
  },
  {
    id: 'mood',
    name: 'Mood Diary',
    icon: 'happy-outline',
    color: '#ec4899',
    bg: 'bg-pink-500/15',
    description: 'Log your mood and spot patterns over time.',
  },
  {
    id: 'focus',
    name: 'Focus Music',
    icon: 'musical-notes-outline',
    color: '#14b8a6',
    bg: 'bg-teal-500/15',
    description: 'Ambient sounds and lo-fi beats for deep work.',
  },
];

export default function ProductivityScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <UserStatusBar />
      <ScrollView className={`flex-1 ${palette.page}`} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-28 pt-5">
          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              PRODUCTIVITY
            </Text>
            <Text className={`mt-2.5 text-3xl font-bold leading-[38px] ${palette.text}`}>
              Tools & utilities
            </Text>
            <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
              A growing set of productivity tools to help you work better.
            </Text>
          </View>

          <View className="mb-4 flex-row flex-wrap gap-3">
            {tools.map((tool) => (
              <Pressable
                key={tool.id}
                className={`w-[48%] rounded-[20px] border p-4 ${palette.surface} ${palette.border}`}
              >
                <View className={`mb-3 h-12 w-12 items-center justify-center rounded-2xl ${tool.bg}`}>
                  <Ionicons name={tool.icon} size={22} color={tool.color} />
                </View>
                <Text className={`text-[15px] font-bold ${palette.text}`}>{tool.name}</Text>
                <Text className={`mt-1 text-[12px] leading-4 ${palette.textSoft}`}>
                  {tool.description}
                </Text>
                <View className="mt-3 self-start rounded-full border px-3 py-1" style={{ borderColor: tool.color }}>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px]" style={{ color: tool.color }}>
                    Coming soon
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}