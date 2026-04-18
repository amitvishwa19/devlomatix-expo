import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';

const settingGroups = [
  {
    title: 'Experience',
    items: [
      { label: 'Push notifications', value: true },
      { label: 'Email updates', value: false },
      { label: 'Auto sync drafts', value: true },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Team visibility', value: true },
      { label: 'Usage analytics', value: false },
      { label: 'Experimental features', value: false },
    ],
  },
];

type ThemeMode = 'light' | 'dark';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, isDark, palette } = useAppTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <StatusBar style={palette.statusBar} />
      <ScrollView className="flex-1" style={{ backgroundColor: palette.colors.page }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8 pt-5">
          <View className="mb-4 rounded-3xl p-5 shadow-xl" style={{ backgroundColor: palette.colors.surface, shadowColor: palette.colors.shadow }}>
            <Text className="text-xs font-bold uppercase tracking-[1.8px]" style={{ color: palette.accentTextColor }}>
              SETTINGS
            </Text>
            <Text className="mt-2.5 text-3xl font-bold leading-9" style={{ color: palette.textColor }}>
              Manage app and workspace preferences
            </Text>
            <Text className="mt-2.5 text-base leading-6" style={{ color: palette.textSoftColor }}>
              Centralized controls for notifications, sync behavior, and feature access.
            </Text>
          </View>

          <View className="mb-4 rounded-3xl px-5 py-5" style={{ backgroundColor: palette.colors.surface }}>
            <Text className="text-sm font-bold uppercase tracking-[0.3px]" style={{ color: palette.textColor }}>
              Appearance
            </Text>
            <Text className="mt-2 text-sm leading-6" style={{ color: palette.textMutedColor }}>
              Switch between light and dark mode for the settings experience.
            </Text>

            <View className={`mt-4 flex-row rounded-2xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {(['light', 'dark'] as ThemeMode[]).map((mode) => {
                const selected = themeMode === mode;

                return (
                  <Pressable
                    key={mode}
                    className={`flex-1 rounded-xl px-4 py-3 ${selected ? 'bg-teal-700' : ''}`}
                    onPress={() => setThemeMode(mode)}>
                    <Text
                      className="text-center text-sm font-bold"
                      style={{ color: selected ? '#ffffff' : palette.textColor }}>
                      {mode === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {settingGroups.map((group) => (
            <View key={group.title} className="mb-4 rounded-3xl px-5 py-2" style={{ backgroundColor: palette.colors.surfaceAlt }}>
              <Text className="py-4 text-sm font-bold uppercase tracking-[0.3px]" style={{ color: palette.textColor }}>
                {group.title}
              </Text>
              {group.items.map((item, index) => (
                <View
                  key={item.label}
                  className={`flex-row items-center justify-between py-4 ${index < group.items.length - 1 ? 'border-b' : ''}`}
                  style={index < group.items.length - 1 ? { borderColor: palette.colors.border } : undefined}>
                  <View className="mr-4 flex-1">
                    <Text className="text-base font-bold" style={{ color: palette.textColor }}>{item.label}</Text>
                    <Text className="mt-1 text-sm" style={{ color: palette.textMutedColor }}>
                      Placeholder control for the settings tab preview.
                    </Text>
                  </View>
                  <Switch
                    value={item.value}
                    trackColor={{
                      false: palette.mode === 'dark' ? '#334155' : '#cbd5e1',
                      true: '#14b8a6',
                    }}
                    thumbColor={palette.mode === 'dark' ? '#f8fafc' : '#ffffff'}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
