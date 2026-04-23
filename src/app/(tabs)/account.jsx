import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';
import { clearSession, getSession } from '~/utils/authStorage';

const settingsGroups = [
    { title: 'Workspace email', value: 'hello@devlomatix.com' },
    { title: 'Notifications', value: 'Product updates, comments, mentions' },
    { title: 'Security', value: '2-step verification enabled' },
    { title: 'Subscription', value: 'Studio plan - 12 seats' }];


export default function AccountScreen() {
    const router = useRouter();
    const { palette } = useAppTheme();
    const [user, setUser] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadSession = async () => {
            const session = await getSession();

            if (!isMounted) {
                return;
            }

            setUser(session?.user ?? null);
        };

        loadSession();

        return () => {
            isMounted = false;
        };
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

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
            <StatusBar style={palette.statusBar} />
            <ScrollView className="flex-1" style={{ backgroundColor: palette.colors.page }} showsVerticalScrollIndicator={false}>
                <View className="px-5 pb-8 pt-5">
                    <View className="mb-4 rounded-xl p-5 shadow-xl" style={{ backgroundColor: palette.colors.surface, shadowColor: palette.colors.shadow }}>


                        <Text className="mt-5 text-3xl font-bold leading-9" style={{ color: palette.textColor }}>
                            Profile & settings
                        </Text>
                        <Text className="mt-2.5 text-[15px] leading-6" style={{ color: palette.textSoftColor }}>
                            UI preview for account, team, and workspace preferences. Replace the placeholder
                            data later.
                        </Text>
                    </View>

                    <View className="rounded-xl px-5" style={{ backgroundColor: palette.colors.surface }}>
                        {settingsGroups.map((item, index) =>
                            <View
                                key={item.title}
                                className={`py-[18px] ${index < settingsGroups.length - 1 ? 'border-b' : ''}`}
                                style={index < settingsGroups.length - 1 ? { borderColor: palette.colors.border } : undefined}>
                                <Text className="text-[13px] font-bold uppercase tracking-[0.3px]" style={{ color: palette.textSoftColor }}>
                                    {item.title}
                                </Text>
                                <Text className="mt-2 text-base leading-6" style={{ color: palette.textColor }}>{item.value}</Text>
                            </View>
                        )}
                    </View>

                    <View className="mt-4">
                        <Pressable
                            className="h-14 items-center justify-center rounded-xl bg-teal-700"
                            onPress={() => router.replace('/(tabs)/home')}>
                            <Text className="text-base font-bold text-slate-50">Back to dashboard</Text>
                        </Pressable>

                        <Pressable
                            className="mt-3 h-14 items-center justify-center rounded-xl border"
                            style={{ borderColor: palette.secondaryButtonBorderColor, backgroundColor: palette.colors.secondaryButton }}
                            onPress={handleSignOut}>
                            <Text className="text-base font-bold" style={{ color: palette.secondaryButtonTextColor }}>Sign out</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>);

}
