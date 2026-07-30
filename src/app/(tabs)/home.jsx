import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { Animated, Modal, Pressable, Switch, Text, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';
import { useNotificationStore } from '~/contexts/NotificationStore';
import { useWidgets } from '~/contexts/WidgetContext';
import { useAppTheme } from '~/theme/AppTheme';
import { resolveWorkspaceId } from '~/utils/workspace';
import { getSession } from '~/utils/authStorage';
import * as hireflowService from '~/services/hireflow';
import * as campaignsService from '~/services/konnectx/campaigns';
import * as analyticsService from '~/services/konnectx/analytics';

const appMeta = {
    solarbright: {
        name: 'SolarBright',
        badge: 'Solar Panel Cleaning',
        route: '/solarbright',
        accentBg: 'bg-amber-600',
        accentBgLight: 'bg-amber-500/15',
        accentText: 'text-amber-600',
        dot: 'bg-amber-500',
        stats: [
            { label: 'Cities Served', value: '50+' },
            { label: 'Panels Cleaned', value: '10K+' },
            { label: 'Efficiency Boost', value: '30%' },
        ],
        description: 'Premium solar panel cleaning and maintenance service.',
    },
    curexa: {
        name: 'Curexa',
        badge: 'Hospital Management',
        route: '/(modules)/curexa',
        accentBg: 'bg-emerald-600',
        accentBgLight: 'bg-emerald-500/15',
        accentText: 'text-emerald-600',
        dot: 'bg-emerald-500',
        stats: [
            { label: 'Active Beds', value: '218' },
            { label: "Today's Appointments", value: '146' },
            { label: 'CRM Automations', value: '32' },
        ],
        description: 'Complete hospital management system with AI powered CRM.',
    },
    konnectx: {
        name: 'KonnectX',
        badge: 'WhatsApp Platform',
        route: '/(modules)/konnectx',
        accentBg: 'bg-sky-600',
        accentBgLight: 'bg-sky-500/15',
        accentText: 'text-sky-600',
        dot: 'bg-sky-500',
        stats: [
            { label: 'Total Campaigns', value: '--' },
            { label: 'Messages Sent', value: '--' },
            { label: 'Active Contacts', value: '--' },
            { label: 'Approved Templates', value: '--' },
        ],
        description: 'WhatsApp Cloud API management for messaging, campaigns, and contacts.',
    },
    crystalaura: {
        name: 'CrystalAura',
        badge: 'E-Commerce Admin',
        route: '/(modules)/crystalaura',
        accentBg: 'bg-purple-600',
        accentBgLight: 'bg-purple-500/15',
        accentText: 'text-purple-600',
        dot: 'bg-purple-500',
        stats: [
            { label: 'Total Revenue', value: '$12.4K' },
            { label: 'Orders', value: '89' },
            { label: 'Products', value: '156' },
            { label: 'Stores', value: '3' },
        ],
        description: 'E-commerce admin for managing products, orders, and connected stores.',
    },
    hireflow: {
        name: 'HireFlow',
        badge: 'ATS Platform',
        route: '/(modules)/hireflow',
        accentBg: 'bg-indigo-600',
        accentBgLight: 'bg-indigo-500/15',
        accentText: 'text-indigo-600',
        dot: 'bg-indigo-500',
        stats: [
            { label: 'Active Jobs', value: '--' },
            { label: 'Candidates', value: '--' },
            { label: 'Interviews', value: '--' },
        ],
        description: 'Full-featured applicant tracking and recruitment management system.',
    },
    kabadx: {
        name: 'KabadX',
        badge: 'Scrap & Recycling',
        route: '/(modules)/kabadx',
        accentBg: 'bg-teal-600',
        accentBgLight: 'bg-teal-500/15',
        accentText: 'text-teal-600',
        dot: 'bg-teal-500',
        stats: [
            { label: 'Scrap Pickups', value: '42' },
            { label: 'Recycled Today', value: '1.2 Tons' },
            { label: 'Active Collectors', value: '18' },
        ],
        description: 'Doorstep scrap pickup & eco-friendly recycling management for kabadi walas & households.',
    },
};

const widgetColors = {
    solarbright: { label: 'SolarBright', color: '#d97706' },
    curexa: { label: 'Curexa', color: '#059669' },
    konnectx: { label: 'KonnectX', color: '#0284c7' },
    crystalaura: { label: 'CrystalAura', color: '#9333ea' },
    hireflow: { label: 'HireFlow', color: '#6366f1' },
    kabadx: { label: 'KabadX', color: '#0d9488' },
};

export default function HomeScreen() {
    const router = useRouter();
    const { palette } = useAppTheme();
    const { widgets, toggleWidget, setAll } = useWidgets();
    const { notifications, unreadCount } = useNotificationStore();
    const [showCustomize, setShowCustomize] = useState(false);
    const [hireflowStats, setHireflowStats] = useState(null);
    const [konnectxStats, setKonnectxStats] = useState(null);

    const scrollY = useRef(new Animated.Value(0)).current;
    const enabledKeys = Object.entries(widgets).filter(([, v]) => v).map(([k]) => k);
    const allEnabled = enabledKeys.length === Object.keys(widgets).length;

    useEffect(() => {
        let mounted = true;

        async function fetchWidgetData() {
            try {
                const wsId = await resolveWorkspaceId();
                if (wsId) {
                    const res = await hireflowService.getSummary(wsId).catch(() => null);
                    if (mounted && res?.data) {
                        const s = res.data;
                        setHireflowStats([
                            { label: 'Active Jobs', value: String(s.activeJobs ?? s.stats?.[1]?.value ?? 0) },
                            { label: 'Candidates', value: String(s.totalCandidates ?? s.stats?.[0]?.value ?? 0) },
                            { label: 'Interviews', value: String(s.upcomingInterviews ?? s.interviews?.length ?? 0) },
                        ]);
                    }
                }
            } catch (e) {
                // Silently handle unauthorized/network errors for widget background fetch
            }

            try {
                const session = await getSession();
                const userId = session?.user?.userId || session?.user?.id;
                const [camps, statsRes] = await Promise.all([
                    campaignsService.getCampaigns(userId).catch(() => []),
                    analyticsService.getStats(userId).catch(() => null)
                ]);
                if (mounted) {
                    const campsList = Array.isArray(camps) ? camps : camps?.campaigns ?? [];
                    const st = statsRes?.stats ?? statsRes;
                    setKonnectxStats([
                        { label: 'Total Campaigns', value: String(campsList.length) },
                        { label: 'Messages Sent', value: String(st?.messages?.sent ?? 0) },
                        { label: 'Active Contacts', value: String(st?.contacts?.total ?? 0) },
                        { label: 'Approved Templates', value: String(st?.templates?.approved ?? 0) },
                    ]);
                }
            } catch (e) {
                console.error('Error fetching KonnectX widget data:', e);
            }
        }

        fetchWidgetData();
        return () => { mounted = false; };
    }, []);

    return (
        <AppScreen>
            <View className="flex-1">
                <UserStatusBar scrollY={scrollY} />

                <Animated.ScrollView className="flex-1" showsVerticalScrollIndicator={false}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                    scrollEventThrottle={16}>
                    <View className="px-5 pb-44 pt-5">
                        <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
                                        DASHBOARD
                                    </Text>
                                    <Text className={`mt-2.5 text-[32px] font-bold leading-[38px] ${palette.text}`}>
                                        Your team command center
                                    </Text>
                                    <Text className={`mt-2.5 text-[15px] leading-6 ${palette.textSoft}`}>
                                        Overview of all active products, key metrics, and quick access to every module.
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => setShowCustomize(true)}
                                    className={`rounded-2xl p-3 ${palette.surfaceAlt}`}
                                >
                                    <Ionicons name="options-outline" size={22} color={palette.textColor} />
                                </Pressable>
                            </View>
                        </View>

                        {enabledKeys.length === 0 && (
                            <View className={`mb-4 rounded-[24px] p-6 items-center ${palette.surface}`}>
                                <Ionicons name="eye-off-outline" size={36} color={palette.textMutedColor} />
                                <Text className={`mt-3 text-[16px] font-bold ${palette.text}`}>No widgets visible</Text>
                                <Text className={`mt-1 text-[13px] text-center ${palette.textSoft}`}>
                                    Tap the customize button above to show app widgets on your dashboard.
                                </Text>
                            </View>
                        )}

                        {unreadCount > 0 && (
                            <Pressable
                                onPress={() => router.push('/(tabs)/messages')}
                                className={`mb-4 rounded-[24px] p-5 ${palette.surface}`}
                            >
                                <View className="mb-3 flex-row items-center justify-between">
                                    <Text className={`text-[16px] font-bold ${palette.text}`}>Recent activity</Text>
                                    <View className="items-center justify-center rounded-full bg-teal-600 px-2.5 py-0.5">
                                        <Text className="text-[11px] font-bold text-white">{unreadCount} new</Text>
                                    </View>
                                </View>
                                {notifications.filter((n) => !n.read).slice(0, 3).map((n) => (
                                    <View key={n.id} className={`mb-2 flex-row items-center gap-3 rounded-[16px] p-3 ${palette.surfaceInset}`}>
                                        <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${n.color || '#6b7280'}20` }}>
                                            <Ionicons name={n.icon || 'notifications'} size={14} color={n.color || '#6b7280'} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`text-[13px] font-semibold ${palette.text}`}>{n.title}</Text>
                                            <Text className={`text-[11px] ${palette.textMuted}`}>{n.description}</Text>
                                        </View>
                                    </View>
                                ))}
                                <Text className={`mt-1 text-[12px] font-semibold text-teal-600`}>View all →</Text>
                            </Pressable>
                        )}

                        {enabledKeys.map((key) => {
                            const app = appMeta[key];
                            if (!app) return null;

                            let statsToDisplay = app.stats;
                            if (key === 'hireflow' && hireflowStats) statsToDisplay = hireflowStats;
                            if (key === 'konnectx' && konnectxStats) statsToDisplay = konnectxStats;

                            const onPress = async () => {
                                if (key === 'hireflow') {
                                    const workspaceId = await resolveWorkspaceId();
                                    if (workspaceId) {
                                        router.push({ pathname: app.route, params: { workspaceId } });
                                    } else {
                                        router.push(app.route);
                                    }
                                } else {
                                    router.push(app.route);
                                }
                            };

                            return (
                                <Pressable
                                    key={key}
                                    className={`mb-4 rounded-[24px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}
                                    onPress={onPress}
                                >
                                    <View className="mb-3.5 flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-2.5">
                                            <View className={`h-2.5 w-2.5 rounded-full ${app.dot}`} />
                                            <Text className={`text-[18px] font-bold ${palette.text}`}>{app.name}</Text>
                                        </View>
                                        <View className={`rounded-full px-3 py-1.5 ${app.accentBg}`}>
                                            <Text className="text-[11px] font-bold uppercase tracking-[1px] text-white">
                                                {app.badge}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="mb-3 flex-row flex-wrap gap-2">
                                        {statsToDisplay.map((stat) => (
                                            <View
                                                key={stat.label}
                                                className={`flex-1 rounded-[16px] p-3 ${app.accentBgLight}`}
                                            >
                                                <Text className={`text-[18px] font-bold ${palette.text}`}>{stat.value}</Text>
                                                <Text className={`text-[11px] ${palette.textMuted}`}>{stat.label}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <Text className={`text-[13px] leading-5 ${palette.textSoft}`}>{app.description}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.ScrollView>

                {/* Customize Modal */}
                <Modal visible={showCustomize} transparent animationType="slide">
                    <View className="flex-1 justify-end bg-black/50">
                        <View className={`rounded-t-[32px] p-6 ${palette.surface}`}>
                            <View className="mb-4 flex-row items-center justify-between">
                                <Text className={`text-[20px] font-bold ${palette.text}`}>Customize Widgets</Text>
                                <Pressable onPress={() => setShowCustomize(false)}>
                                    <Ionicons name="close-circle" size={26} color={palette.textMutedColor} />
                                </Pressable>
                            </View>

                            <Text className={`mb-4 text-[13px] ${palette.textSoft}`}>
                                Choose which app widgets appear on your home screen.
                            </Text>

                            <View className="mb-4 flex-row gap-2">
                                <Pressable
                                    onPress={() => setAll(!allEnabled)}
                                    className={`rounded-xl px-4 py-2 bg-indigo-600`}
                                >
                                    <Text className="text-[12px] font-bold text-white">
                                        {allEnabled ? 'Hide All' : 'Show All'}
                                    </Text>
                                </Pressable>
                            </View>

                            {Object.entries(widgetColors).map(([key, meta]) => (
                                <View key={key} className={`mb-2 flex-row items-center justify-between rounded-2xl p-4 ${palette.surfaceAlt}`}>
                                    <View className="flex-row items-center gap-3">
                                        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
                                        <Text className={`text-[15px] font-semibold ${palette.text}`}>{meta.label}</Text>
                                    </View>
                                    <Switch
                                        value={widgets[key]}
                                        onValueChange={() => toggleWidget(key)}
                                        trackColor={{ false: '#d1d5db', true: meta.color }}
                                    />
                                </View>
                            ))}

                            <Pressable
                                onPress={() => setShowCustomize(false)}
                                className="mt-4 rounded-2xl bg-indigo-600 py-3.5 items-center"
                            >
                                <Text className="text-[14px] font-bold text-white">Done</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </View>
        </AppScreen>
    );
}
