import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchAccessData } from '~/services/access-management';
import { useAppTheme } from '~/theme/AppTheme';
import { clearSession, getSession } from '~/utils/authStorage';

const settingGroups = [
  {
    title: 'Experience',
    items: [
      { label: 'Push notifications', value: true },
      { label: 'Email updates', value: false },
      { label: 'Auto sync drafts', value: true }
    ]
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Team visibility', value: true },
      { label: 'Usage analytics', value: false },
      { label: 'Experimental features', value: false }
    ]
  }
];

export default function SettingsScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode, isDark, palette } = useAppTheme();
  const [user, setUser] = useState(null);
  const [permModules, setPermModules] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      const session = await getSession();
      if (!isMounted) return;
      setUser(session?.user ?? null);
    };
    loadSession();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPerms = async () => {
      try {
        const res = await fetchAccessData();
        const body = res?.data || res;
        if (body?.permissions && isMounted) {
          setPermModules(body.permissions);
        }
      } catch {
        // fallback to user session data
      }
    };
    loadPerms();
    return () => { isMounted = false; };
  }, []);

  const handleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore when the current session was not created with Google Sign-In.
    }
    await clearSession();
    router.replace('/(auth)/login');
  };

  const settingsGroups = [
    { title: 'Workspace email', value: user?.email || 'hello@devlomatix.com' },
    { title: 'Notifications', value: 'Product updates, comments, mentions' },
    { title: 'Security', value: '2-step verification enabled' },
    { title: 'Subscription', value: 'Studio plan - 12 seats' }
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
      <StatusBar style={palette.statusBar} />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: palette.colors.page }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-5">
          {/* User Profile Header Card */}
          <View className="mb-4 rounded-3xl p-5 shadow-xl flex-row items-center gap-4" style={{ backgroundColor: palette.colors.surface, shadowColor: palette.colors.shadow }}>
            {user?.avatar || user?.photo ? (
              <Image source={{ uri: user.avatar || user.photo }} className="h-16 w-16 rounded-full" />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-full bg-teal-700">
                <Text className="text-[24px] font-bold text-white">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xl font-bold" style={{ color: palette.textColor }}>
                {user?.displayName || 'User'}
              </Text>
              <Text className="text-sm mt-0.5" style={{ color: palette.textSoftColor }}>
                {user?.email || 'No email configured'}
              </Text>
            </View>
          </View>

          {/* Account details */}
          <View className="mb-4 rounded-3xl px-5 py-2" style={{ backgroundColor: palette.colors.surface }}>
            <Text className="py-4 text-sm font-bold uppercase tracking-[0.3px]" style={{ color: palette.textColor }}>
              Account Details
            </Text>
            {settingsGroups.map((item, index) => (
              <View
                key={item.title}
                className={`py-4 ${index < settingsGroups.length - 1 ? 'border-b' : ''}`}
                style={index < settingsGroups.length - 1 ? { borderColor: palette.colors.border } : undefined}>
                <Text className="text-[13px] font-bold uppercase tracking-[0.3px]" style={{ color: palette.textSoftColor }}>
                  {item.title}
                </Text>
                <Text className="mt-1 text-base leading-6" style={{ color: palette.textColor }}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Appearance setting */}
          <View className="mb-4 rounded-3xl px-5 py-5" style={{ backgroundColor: palette.colors.surface }}>
            <Text className="text-sm font-bold uppercase tracking-[0.3px]" style={{ color: palette.textColor }}>
              Appearance
            </Text>
            <Text className="mt-2 text-sm leading-6" style={{ color: palette.textMutedColor }}>
              Switch between light and dark mode for the settings experience.
            </Text>

            <View className={`mt-4 flex-row rounded-2xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {['light', 'dark'].map((mode) => {
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

          {/* Experience and Workspace Switch Groups */}
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
                      true: '#14b8a6'
                    }}
                    thumbColor={palette.mode === 'dark' ? '#f8fafc' : '#ffffff'}
                  />
                </View>
              ))}
            </View>
          ))}

          {/* Access Management */}
          <Pressable
            className="mb-4 rounded-3xl px-5 py-2"
            style={{ backgroundColor: palette.colors.surface }}
            onPress={() => router.push('/(modules)/access-management')}
          >
            <Text className="py-4 text-sm font-bold uppercase tracking-[0.3px]" style={{ color: palette.textColor }}>
              Access Management
            </Text>

            {user?.roles?.length > 0 && (
              <View className="py-4 border-b" style={{ borderColor: palette.colors.border }}>
                <Text className="text-[13px] font-bold uppercase tracking-[0.3px]" style={{ color: palette.textSoftColor }}>
                  Roles
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {user.roles.map((role) => {
                    const label = typeof role === 'string' ? role : role.title || role.name || 'User';
                    return (
                      <View key={label} className="rounded-full bg-teal-600 px-3 py-1.5">
                        <Text className="text-[12px] font-bold text-white">{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {permModules.length > 0 && (
              <View className="py-4 border-b" style={{ borderColor: palette.colors.border }}>
                <Text className="text-[13px] font-bold uppercase tracking-[0.3px]" style={{ color: palette.textSoftColor }}>
                  Permissions
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {permModules.map((mod) => {
                 
                  
                  return (
                    <View key={mod.category || mod.id} className="flex-row items-center justify-between py-3">        
                      <View key={'label'} className="rounded-full bg-teal-600 px-3 py-1.5">
                        <Text className="text-[12px] font-bold text-white" >{mod.module}</Text>
                      </View>
                    </View>
                  );
                })}
                </View>
              </View>
            )}

            {user?.permissions?.length > 0 && (
              <View className="py-4">
                <Text className="text-[13px] font-bold uppercase tracking-[0.3px]" style={{ color: palette.textSoftColor }}>
                  Permissions
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {user.permissions.map((perm) => {
                    const label = typeof perm === 'string' ? perm : perm.title || perm.name || perm.key || perm.action || perm.category || '—';
                    return (
                      <View key={label} className="rounded-lg px-2.5 py-1" style={{ backgroundColor: palette.colors.surfaceAlt }}>
                        <Text className="text-[12px]" style={{ color: palette.textMutedColor }}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Pressable>

          {/* Logout */}
          <Pressable
            className="h-12 flex-row items-center justify-center rounded-2xl bg-rose-600"
            onPress={handleSignOut}>
            <Text className="text-base font-bold text-slate-50">Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}