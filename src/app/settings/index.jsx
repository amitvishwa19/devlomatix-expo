import React, { useState, useEffect, useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import AppScreen from '~/components/AppScreen';
import { useCrmTheme } from '~/utils/crm/colors';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';
import { clearSession, getSession } from '~/utils/authStorage';
import { fetchAccessData } from '~/services/access-management';
import { usePermissions } from '~/hooks/usePermissions';
import { useWidgets } from '~/contexts/WidgetContext';
import { PermissionGate } from '~/components/PermissionGate';
import { hasCompletedOnboarding, resetOnboarding, completeOnboarding } from '~/utils/onboardingStorage';
import { getPreferences, savePreferences, DEFAULT_PREFERENCES } from '~/utils/preferences';
import Toast from 'react-native-toast-message';

const ECOSYSTEM_MODULES = [
  {
    id: 'konnectx',
    name: 'KonnectX',
    tagline: 'WhatsApp Cloud API & Campaigns',
    badge: 'WhatsApp',
    route: '/(modules)/konnectx',
    icon: 'logo-whatsapp',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.12)',
  },
  {
    id: 'hireflow',
    name: 'HireFlow (ATS)',
    tagline: 'Recruitment & Candidate Tracking',
    badge: 'Recruiting',
    route: '/(modules)/hireflow',
    icon: 'briefcase-outline',
    color: '#4f46e5',
    bg: 'rgba(79, 70, 229, 0.12)',
  },
  {
    id: 'kabadx',
    name: 'KabadX',
    tagline: 'Doorstep Scrap & Eco Recycling',
    badge: 'Recycling',
    route: '/(modules)/kabadx',
    icon: 'leaf-outline',
    color: '#0d9488',
    bg: 'rgba(13, 148, 136, 0.12)',
  },
  {
    id: 'crystalaura',
    name: 'CrystalAura',
    tagline: 'E-Commerce Store & Order Suite',
    badge: 'E-Commerce',
    route: '/(modules)/crystalaura',
    icon: 'storefront-outline',
    color: '#9333ea',
    bg: 'rgba(147, 51, 234, 0.12)',
  },
  {
    id: 'curexa',
    name: 'Curexa',
    tagline: 'Hospital & Healthcare Intelligence',
    badge: 'Healthcare',
    route: '/(modules)/curexa',
    icon: 'medkit-outline',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
  },
  {
    id: 'solarbright',
    name: 'SolarBright',
    tagline: 'Solar Panel Cleaning & Maintenance',
    badge: 'Solar Energy',
    route: '/(modules)/solarbright',
    icon: 'sunny-outline',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
  },
];

const DASHBOARD_WIDGETS = [
  { key: 'dashKpis', label: 'KPI Grid', desc: 'Pipeline value, forecast, win rate & follow-ups' },
  { key: 'dashFunnel', label: 'Sales Funnel', desc: 'Stage distribution across the active pipeline' },
  { key: 'dashStalled', label: 'AI Stalled Deals', desc: 'High-risk deals that need re-engagement' },
  { key: 'dashActions', label: 'Quick Actions', desc: 'New deal, contact and task shortcuts' },
  { key: 'dashShortcuts', label: 'Operations Hub', desc: 'Copilot, DCR, quotations, mailbox & analytics' },
  { key: 'dashLocation', label: 'Field Movement Tracker', desc: 'Live GPS trail and movement map shortcut' },
  { key: 'dashPipeline', label: 'High-Value Opportunities', desc: 'Top deals list on the dashboard' },
];

export default function CrmSettingsScreen({ isTab = false }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { widgets, toggleWidget } = useWidgets();
  const { colors, isDark } = useCrmTheme();
  const { themeMode, setThemeMode } = useAppTheme();
  const crm = useCrm();
  const activePipeline = crm?.activePipeline;
  const refreshAll = crm?.refreshAll || (() => {});
  const refreshing = crm?.refreshing || false;

  const {
    isSuperAdmin,
    isAdmin,
    roles: userRoles,
    permissions: userPerms,
    canAccessModule,
    hasPermission,
  } = usePermissions();
  const [user, setUser] = useState(null);
  const [permModules, setPermModules] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Compute accessible module count in Devlomatix Suite
  const accessibleModulesCount = useMemo(() => {
    return ECOSYSTEM_MODULES.filter(
      (mod) => canAccessModule(mod.id) || canAccessModule(mod.name)
    ).length;
  }, [canAccessModule]);

  // Ecosystem bridge authorizations
  const konnectxAllowed = useMemo(
    () => canAccessModule('konnectx') || isSuperAdmin,
    [canAccessModule, isSuperAdmin]
  );
  const dcrAllowed = useMemo(
    () => canAccessModule('dcr') || canAccessModule('crm') || hasPermission('read:dcr') || isSuperAdmin,
    [canAccessModule, hasPermission, isSuperAdmin]
  );
  const payflowAllowed = useMemo(
    () => canAccessModule('payflow') || isSuperAdmin,
    [canAccessModule, isSuperAdmin]
  );
  const flowgenixAllowed = useMemo(
    () => canAccessModule('flowgenix') || isSuperAdmin,
    [canAccessModule, isSuperAdmin]
  );
  const hireflowAllowed = useMemo(
    () => canAccessModule('hireflow') || isSuperAdmin,
    [canAccessModule, isSuperAdmin]
  );

  // Preference switches
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    let isMounted = true;
    getPreferences().then((stored) => {
      if (isMounted) setPreferences((prev) => ({ ...prev, ...stored }));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const togglePreference = (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    savePreferences(next);
  };

  // Onboarding Preference
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    hasCompletedOnboarding()
      .then((completed) => {
        if (isMounted) {
          setShowOnboarding(!completed);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleOnboarding = async (value) => {
    setShowOnboarding(value);
    if (value) {
      await resetOnboarding();
      Toast.show({
        type: 'info',
        text1: 'Onboarding Enabled',
        text2: 'The onboarding walkthrough will be shown on next app launch.',
      });
    } else {
      await completeOnboarding();
      Toast.show({
        type: 'info',
        text1: 'Onboarding Disabled',
        text2: 'The onboarding walkthrough will be skipped on launch.',
      });
    }
  };

  // WhatsApp sync state
  const [syncingWa, setSyncingWa] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Load User Profile and Permissions
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      const session = await getSession();
      const sessionUser = session?.user ?? null;
      if (!isMounted) return;
      setUser(sessionUser);

      const roleLabels = (sessionUser?.roles || [])
        .map((role) =>
          typeof role === 'string' ? role : role.title || role.name || role.id
        )
        .filter(Boolean);

      try {
        const res = await fetchAccessData();
        const body = res?.data || res;
        const allRoles = body?.roles || [];
        const allPerms = body?.permissions || [];

        const roleKeys = roleLabels.map((label) => String(label).toLowerCase());
        const matchedRoles = allRoles.filter((role) => {
          const keys = [role.title, role.name, role.id]
            .filter(Boolean)
            .map((key) => String(key).toLowerCase());
          return keys.some((key) => roleKeys.includes(key));
        });

        const resolved = [];
        matchedRoles.forEach((role) => {
          (role.permissions || []).forEach((perm) => {
            let label = null;
            if (typeof perm === 'object' && perm !== null) {
              label = perm.module || perm.title || perm.name || perm.category;
            } else {
              const match = allPerms.find(
                (ap) =>
                  ap.id === perm ||
                  ap._id === perm ||
                  ap.category === perm ||
                  [ap.module, ap.title, ap.name].includes(perm)
              );
              label = match ? match.module || match.title || match.name : perm;
            }
            if (label && !resolved.some((item) => item.module === label)) {
              resolved.push({ module: label });
            }
          });
        });

        if (isMounted) setPermModules(resolved);
      } catch {
        // fallback to session info
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSyncWhatsApp = async () => {
    try {
      setSyncingWa(true);
      setSyncResult(null);
      const res = await crmService.syncWhatsAppChats();
      if (res.success) {
        setSyncResult({
          type: 'success',
          text: `WhatsApp Synced! ${res.data?.newContactsCreated || 0} contacts created, ${res.data?.messagesLinked || 0} messages attached to CRM timeline.`,
        });
        refreshAll();
      } else {
        setSyncResult({ type: 'error', text: res.error || 'Failed to sync WhatsApp chats' });
      }
    } catch (e) {
      setSyncResult({ type: 'error', text: e.message || 'Sync error' });
    } finally {
      setSyncingWa(false);
    }
  };

  const performLogout = async () => {
    try {
      await GoogleSignin.disconnect();
    } catch {
      try {
        await GoogleSignin.signOut();
      } catch {}
    }
    await clearSession();
    router.replace('/(auth)/login');
  };

  const stages = activePipeline?.stages || [];

  const accountDetails = [
    { title: 'Workspace Email', value: user?.email || 'hello@devlomatix.com' },
    { title: 'Notifications', value: 'Instant alerts, CRM leads, messages' },
    { title: 'Security', value: '2-step verification enabled' },
    { title: 'Subscription', value: 'Enterprise CRM Plan' },
  ];

  return (
    <AppScreen style={{ backgroundColor: colors.background }}>
      <CrmHeader
        title="Settings & Workspace"
        subtitle="Account, Appearance & Bridges"
        showBack={!isTab}
        showSettings={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 90, 120) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
        className="px-4 pt-4"
      >
        {/* 1. User Profile Header Card */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4 flex-row items-center gap-x-3.5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          {user?.avatar || user?.photo ? (
            <Image
              source={{ uri: user.avatar || user.photo }}
              className="h-14 w-14 rounded-full"
            />
          ) : (
            <View
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xl font-bold text-white">
                {user?.displayName?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase() ||
                  'U'}
              </Text>
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-x-2">
              <Text
                className="text-base font-bold tracking-tight"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {user?.displayName || 'CRM Operator'}
              </Text>
              <View
                className="rounded-full px-2.5 py-0.5 border"
                style={{
                  backgroundColor:
                    userRoles?.length > 0 || isSuperAdmin
                      ? colors.primarySoft
                      : isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#fee2e2',
                  borderColor:
                    userRoles?.length > 0 || isSuperAdmin
                      ? colors.primaryBorder
                      : isDark
                      ? 'rgba(239, 68, 68, 0.3)'
                      : '#fca5a5',
                }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color:
                      userRoles?.length > 0 || isSuperAdmin ? colors.primary : '#ef4444',
                  }}
                >
                  {isSuperAdmin
                    ? 'Super Admin'
                    : userRoles?.length > 0
                    ? userRoles[0]
                    : 'Restricted'}
                </Text>
              </View>
            </View>
            <Text
              className="text-xs font-medium mt-1"
              style={{ color: colors.textMuted }}
              numberOfLines={1}
            >
              {user?.email || 'No email configured'}
            </Text>
          </View>
        </View>

        {/* 2. Appearance Card */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-wider mb-1.5"
            style={{ color: colors.textMuted }}
          >
            Appearance
          </Text>
          <Text className="text-xs leading-5 mb-3.5" style={{ color: colors.textSecondary }}>
            Choose between dark mode and clean light theme for CRM.
          </Text>

          <View
            className="flex-row rounded-xl p-1.5 border"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.borderLight,
            }}
          >
            {['light', 'dark'].map((mode) => {
              const selected = themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  className="flex-1 items-center justify-center py-2.5 rounded-lg"
                  style={{
                    backgroundColor: selected ? colors.primary : 'transparent',
                  }}
                  onPress={() => setThemeMode(mode)}
                >
                  <View className="flex-row items-center gap-x-2">
                    <Ionicons
                      name={mode === 'dark' ? 'moon' : 'sunny'}
                      size={15}
                      color={selected ? '#ffffff' : colors.textMuted}
                    />
                    <Text
                      className="text-xs font-bold capitalize"
                      style={{ color: selected ? '#ffffff' : colors.text }}
                    >
                      {mode}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Account Details */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-wider mb-2.5"
            style={{ color: colors.textMuted }}
          >
            Account Details
          </Text>
          {accountDetails.map((item, index) => (
            <View
              key={item.title}
              className={`py-3 ${index < accountDetails.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: colors.borderLight }}
            >
              <Text
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                {item.title}
              </Text>
              <Text className="mt-1 text-xs font-semibold" style={{ color: colors.text }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* 4. Location Tracking */}
        <Pressable
          onPress={() => router.push('/location')}
          className="rounded-2xl border p-4 shadow-xs mb-4 flex-row items-center gap-x-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(2, 132, 199, 0.12)' }}
          >
            <Ionicons name="map" size={20} color="#0284c7" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Location Trail
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              View your movement path on a live map
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        {/* 5. Active Deal Pipeline & Stage Config */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Active Deal Pipeline
              </Text>
              <Text className="text-sm font-bold mt-1" style={{ color: colors.text }}>
                {activePipeline?.name || 'Default Sales Pipeline'}
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1 border"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                {stages.length} Stages
              </Text>
            </View>
          </View>

          {/* Stages List */}
          {stages.map((stage, idx) => (
            <View
              key={stage.id}
              className="flex-row items-center justify-between py-2.5"
              style={{
                borderTopWidth: idx !== 0 ? 1 : 0,
                borderTopColor: colors.borderLight,
              }}
            >
              <View className="flex-row items-center gap-x-2.5">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color || colors.primary }}
                />
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  {idx + 1}. {stage.name}
                </Text>
              </View>
              <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>
                {stage.probability}% win probability
              </Text>
            </View>
          ))}
        </View>

        {/* 5. 1-Click WhatsApp Chat Sync Card */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{
            backgroundColor: colors.whatsappSoft,
            borderColor: colors.whatsappBorder,
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: konnectxAllowed ? colors.whatsapp : (isDark ? '#334155' : '#94a3b8') }}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: konnectxAllowed ? colors.whatsapp : colors.text }}>
                  KonnectX WhatsApp Bridge
                </Text>
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                  Auto-scan conversations & sync contacts
                </Text>
              </View>
            </View>
            {!konnectxAllowed && (
              <View
                className="rounded-full px-2 py-0.5 border flex-row items-center gap-x-1"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5',
                }}
              >
                <Ionicons name="lock-closed" size={9} color="#ef4444" />
                <Text className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Locked</Text>
              </View>
            )}
          </View>

          <Text className="text-xs mt-1.5 leading-5" style={{ color: colors.textSecondary }}>
            Scans your KonnectX WhatsApp Cloud inbox, auto-registers new client profiles into CRM, and links full chat history to contact dossiers.
          </Text>

          {syncResult && (
            <View
              className="mt-3 rounded-xl p-3 border"
              style={{
                backgroundColor: syncResult.type === 'success' ? colors.successSoft : colors.dangerSoft,
                borderColor: syncResult.type === 'success' ? colors.successBorder : colors.dangerBorder,
              }}
            >
              <Text
                className="text-xs font-bold leading-relaxed"
                style={{
                  color: syncResult.type === 'success' ? colors.success : colors.danger,
                }}
              >
                {syncResult.text}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              if (!konnectxAllowed) {
                Alert.alert(
                  'Access Restricted',
                  'You do not have authorization to access the KonnectX module. Contact your administrator to grant permissions.',
                  [{ text: 'OK', style: 'default' }]
                );
                return;
              }
              handleSyncWhatsApp();
            }}
            disabled={syncingWa}
            className="mt-3.5 flex-row items-center justify-center gap-x-2 rounded-xl py-3 shadow-xs active:opacity-80 min-h-[46px]"
            style={{
              backgroundColor: konnectxAllowed ? colors.whatsapp : (isDark ? '#334155' : '#94a3b8'),
              opacity: syncingWa || !konnectxAllowed ? 0.6 : 1,
            }}
          >
            {syncingWa ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name={konnectxAllowed ? "sync" : "lock-closed"} size={16} color="#ffffff" />
                <Text className="text-xs font-bold text-white">
                  {konnectxAllowed ? 'Sync WhatsApp Chats Now' : 'KonnectX Locked'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* 6. DCR (Daily Call Records) Card */}
        <Pressable
          className="rounded-2xl border p-4 shadow-xs mb-4 active:opacity-75"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: dcrAllowed ? 1 : 0.6,
          }}
          onPress={() => {
            if (dcrAllowed) {
              router.push('/dcr');
            } else {
              Alert.alert(
                'Access Restricted',
                'You do not have authorization to access Daily Call Records (DCR). Please contact your administrator to grant permissions.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.info || '#0ea5e9' }}
              >
                <Ionicons name="call" size={16} color="#ffffff" />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Daily Call Records (DCR)
                </Text>
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                  Field visits, meetings & client call logs
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-x-1">
              <View
                className="rounded-lg px-2.5 py-1 border flex-row items-center gap-x-1"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.borderLight,
                }}
              >
                {!dcrAllowed && <Ionicons name="lock-closed" size={10} color={colors.textMuted} />}
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: dcrAllowed ? colors.primary : colors.textMuted }}
                >
                  {dcrAllowed ? 'Open DCR' : 'Locked'}
                </Text>
              </View>
              <Ionicons
                name={dcrAllowed ? "chevron-forward" : "lock-closed-outline"}
                size={15}
                color={colors.textMuted}
              />
            </View>
          </View>
          <Text className="text-xs leading-5 mt-1.5" style={{ color: colors.textSecondary }}>
            Track sales activity, field visits, demos, and follow-ups with team call metrics and instant call logging.
          </Text>
        </Pressable>

        {/* 7. Cross-Module Bridges Overview */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-wider mb-2.5"
            style={{ color: colors.textMuted }}
          >
            Active Ecosystem Bridges
          </Text>

          {/* PayFlow Bridge */}
          <Pressable
            className="flex-row items-center justify-between py-3 border-b active:opacity-70"
            style={{
              borderBottomColor: colors.borderLight,
              opacity: payflowAllowed ? 1 : 0.6,
            }}
            onPress={() => {
              if (!payflowAllowed) {
                Alert.alert(
                  'Access Restricted',
                  'You do not have authorization to access the PayFlow Billing Bridge. Please contact your workspace administrator.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            }}
          >
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.cardAlt }}
              >
                <Ionicons
                  name="card-outline"
                  size={17}
                  color={payflowAllowed ? colors.copilot : colors.textMuted}
                />
              </View>
              <View>
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  PayFlow Billing Bridge
                </Text>
                <Text className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                  1-Click Invoice & Quotations
                </Text>
              </View>
            </View>
            <View
              className="rounded-full px-2.5 py-1 border flex-row items-center gap-x-1"
              style={{
                backgroundColor: payflowAllowed
                  ? colors.successSoft
                  : isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#fee2e2',
                borderColor: payflowAllowed
                  ? colors.successBorder
                  : isDark
                  ? 'rgba(239, 68, 68, 0.3)'
                  : '#fca5a5',
              }}
            >
              {!payflowAllowed && <Ionicons name="lock-closed" size={9} color="#ef4444" />}
              <Text
                className="text-[10px] font-bold"
                style={{ color: payflowAllowed ? colors.success : '#ef4444' }}
              >
                {payflowAllowed ? 'Connected' : 'Locked'}
              </Text>
            </View>
          </Pressable>

          {/* FlowGenix Bridge */}
          <Pressable
            className="flex-row items-center justify-between py-3 border-b active:opacity-70"
            style={{
              borderBottomColor: colors.borderLight,
              opacity: flowgenixAllowed ? 1 : 0.6,
            }}
            onPress={() => {
              if (!flowgenixAllowed) {
                Alert.alert(
                  'Access Restricted',
                  'You do not have authorization to access the FlowGenix AI Agent bridge. Please contact your workspace administrator.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            }}
          >
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={17}
                  color={flowgenixAllowed ? colors.primary : colors.textMuted}
                />
              </View>
              <View>
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  FlowGenix AI Agent
                </Text>
                <Text className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                  Sales Intelligence & Health Scoring
                </Text>
              </View>
            </View>
            <View
              className="rounded-full px-2.5 py-1 border flex-row items-center gap-x-1"
              style={{
                backgroundColor: flowgenixAllowed
                  ? colors.successSoft
                  : isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#fee2e2',
                borderColor: flowgenixAllowed
                  ? colors.successBorder
                  : isDark
                  ? 'rgba(239, 68, 68, 0.3)'
                  : '#fca5a5',
              }}
            >
              {!flowgenixAllowed && <Ionicons name="lock-closed" size={9} color="#ef4444" />}
              <Text
                className="text-[10px] font-bold"
                style={{ color: flowgenixAllowed ? colors.success : '#ef4444' }}
              >
                {flowgenixAllowed ? 'Active' : 'Locked'}
              </Text>
            </View>
          </Pressable>

          {/* Hireflow Bridge */}
          <Pressable
            className="flex-row items-center justify-between py-3 active:opacity-70"
            style={{ opacity: hireflowAllowed ? 1 : 0.6 }}
            onPress={() => {
              if (!hireflowAllowed) {
                Alert.alert(
                  'Access Restricted',
                  'You do not have authorization to access the Hireflow ATS bridge. Please contact your workspace administrator.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            }}
          >
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.infoSoft || colors.cardAlt }}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={17}
                  color={hireflowAllowed ? colors.info : colors.textMuted}
                />
              </View>
              <View>
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  Hireflow ATS Bridge
                </Text>
                <Text className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                  Candidate ⇄ Lead Conversion
                </Text>
              </View>
            </View>
            <View
              className="rounded-full px-2.5 py-1 border flex-row items-center gap-x-1"
              style={{
                backgroundColor: hireflowAllowed
                  ? colors.successSoft
                  : isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#fee2e2',
                borderColor: hireflowAllowed
                  ? colors.successBorder
                  : isDark
                  ? 'rgba(239, 68, 68, 0.3)'
                  : '#fca5a5',
              }}
            >
              {!hireflowAllowed && <Ionicons name="lock-closed" size={9} color="#ef4444" />}
              <Text
                className="text-[10px] font-bold"
                style={{ color: hireflowAllowed ? colors.success : '#ef4444' }}
              >
                {hireflowAllowed ? 'Connected' : 'Locked'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 8. Experience & Notifications Preferences */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: colors.textMuted }}
          >
            Experience Preferences
          </Text>

          {[
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Master switch for all push alerts' },
            { key: 'callAlerts', label: 'Call Alerts', desc: 'Incoming voice & video call notifications' },
            { key: 'messageAlerts', label: 'Message & Email Alerts', desc: 'WhatsApp, chat and mailbox notifications' },
            { key: 'dealAlerts', label: 'Deal & Task Alerts', desc: 'Pipeline updates, reminders and tasks' },
            { key: 'emailUpdates', label: 'Email Digest', desc: 'Daily summary of pipeline activity' },
            { key: 'autoSyncDrafts', label: 'Auto Sync Drafts', desc: 'Save offline changes automatically' },
            { key: 'teamVisibility', label: 'Team Pipeline Visibility', desc: 'Share activity feed with team' },
            { key: 'usageAnalytics', label: 'Usage Analytics', desc: 'Help improve Devlomatix CRM' },
          ].map((item, index) => (
            <View
              key={item.key}
              className={`flex-row items-center justify-between py-3.5 ${index > 0 ? 'border-t' : ''}`}
              style={{ borderTopColor: colors.borderLight }}
            >
              <View className="flex-1 mr-3">
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  {item.label}
                </Text>
                <Text className="text-[11px] mt-1 leading-4" style={{ color: colors.textMuted }}>
                  {item.desc}
                </Text>
              </View>
              <Switch
                value={preferences[item.key]}
                onValueChange={() => togglePreference(item.key)}
                trackColor={{
                  false: isDark ? '#334155' : '#cbd5e1',
                  true: colors.primary,
                }}
                thumbColor={isDark ? '#f8fafc' : '#ffffff'}
              />
            </View>
          ))}

          {/* Show Onboarding Toggle */}
          <View
            className="flex-row items-center justify-between py-3.5 border-t"
            style={{ borderTopColor: colors.borderLight }}
          >
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold" style={{ color: colors.text }}>
                Show Onboarding
              </Text>
              <Text className="text-[11px] mt-1 leading-4" style={{ color: colors.textMuted }}>
                Show introductory walkthrough tour on next app launch
              </Text>
            </View>
            <Switch
              value={showOnboarding}
              onValueChange={handleToggleOnboarding}
              trackColor={{
                false: isDark ? '#334155' : '#cbd5e1',
                true: colors.primary,
              }}
              thumbColor={isDark ? '#f8fafc' : '#ffffff'}
            />
          </View>

          {showOnboarding && (
            <Pressable
              onPress={() => router.push('/(misc)/onboarding')}
              className="mt-2 flex-row items-center justify-center py-2 px-3 rounded-xl border border-dashed active:opacity-75"
              style={{ borderColor: colors.primary, backgroundColor: colors.primarySoft }}
            >
              <Ionicons name="play-outline" size={13} color={colors.primary} />
              <Text className="text-xs font-bold ml-1.5" style={{ color: colors.primary }}>
                Preview Onboarding Walkthrough
              </Text>
            </Pressable>
          )}
        </View>

        {/* 8b. Dashboard Widgets */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              Dashboard Widgets
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)')}
              className="flex-row items-center gap-x-1"
            >
              <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
                Preview
              </Text>
              <Ionicons name="chevron-forward" size={12} color={colors.primary} />
            </Pressable>
          </View>

          {DASHBOARD_WIDGETS.map((item, index) => (
            <View
              key={item.key}
              className={`flex-row items-center justify-between py-3 ${index > 0 ? 'border-t' : ''}`}
              style={{ borderTopColor: colors.borderLight }}
            >
              <View className="flex-1 mr-3">
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  {item.label}
                </Text>
                <Text className="text-[11px] mt-1 leading-4" style={{ color: colors.textMuted }}>
                  {item.desc}
                </Text>
              </View>
              <Switch
                value={widgets[item.key] !== false}
                onValueChange={() => toggleWidget(item.key)}
                trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: colors.primary }}
                thumbColor={isDark ? '#f8fafc' : '#ffffff'}
              />
            </View>
          ))}
        </View>

        {/* 9. Access Management & RBAC Permissions */}
        <Pressable
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          onPress={() => {
            if (isAdmin || isSuperAdmin) {
              router.push('/(modules)/access-management');
            } else {
              Alert.alert('Access Restricted', 'Access Management requires Administrator privileges.');
            }
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: (isAdmin || isSuperAdmin) ? colors.primarySoft : 'rgba(239, 68, 68, 0.12)' }}
              >
                <Ionicons
                  name={(isAdmin || isSuperAdmin) ? "shield-checkmark-outline" : "lock-closed-outline"}
                  size={17}
                  color={(isAdmin || isSuperAdmin) ? colors.primary : '#ef4444'}
                />
              </View>
              <View>
                <View className="flex-row items-center gap-x-1.5">
                  <Text className="text-sm font-bold" style={{ color: colors.text }}>
                    Access Management
                  </Text>
                  {!(isAdmin || isSuperAdmin) && (
                    <View className="rounded px-1.5 py-0.5 bg-rose-500/15">
                      <Text className="text-[9px] font-bold text-rose-500">ADMIN ONLY</Text>
                    </View>
                  )}
                </View>
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                  Role-based permissions & security policies
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>

          {/* User Roles */}
          {user?.roles?.length > 0 ? (
            <View className="pt-3 mt-3 border-t" style={{ borderColor: colors.borderLight }}>
              <Text
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: colors.textMuted }}
              >
                Assigned Roles
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {user.roles.map((role) => {
                  const label =
                    typeof role === 'string'
                      ? role
                      : role.title || role.name || 'User';
                  return (
                    <View
                      key={label}
                      className="rounded-full px-3 py-1.5 border"
                      style={{
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primaryBorder,
                      }}
                    >
                      <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View className="pt-3 mt-3 border-t" style={{ borderColor: colors.borderLight }}>
              <Text
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: colors.textMuted }}
              >
                Assigned Roles
              </Text>
              <View
                className="rounded-xl p-3 border flex-row items-center gap-x-2.5"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca',
                }}
              >
                <Ionicons name="alert-circle-outline" size={17} color="#ef4444" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-rose-500">
                    No Roles Assigned · Restricted User
                  </Text>
                  <Text className="text-[11px] mt-0.5 leading-4" style={{ color: colors.textMuted }}>
                    No role or module permissions have been assigned to your workspace profile ({user?.email || 'devlomatixsolutions@gmail.com'}). All enterprise tools remain locked.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* User Permissions Preview */}
          {permModules.length > 0 ? (
            <View className="pt-3 mt-3 border-t" style={{ borderColor: colors.borderLight }}>
              <Text
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: colors.textMuted }}
              >
                Module Authorizations
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {permModules.map((mod) => (
                  <View
                    key={mod.module}
                    className="rounded-lg px-2.5 py-1 border"
                    style={{
                      backgroundColor: colors.cardAlt,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                      {mod.module}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="pt-3 mt-3 border-t" style={{ borderColor: colors.borderLight }}>
              <Text
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: colors.textMuted }}
              >
                Module Authorizations
              </Text>
              <View
                className="rounded-lg p-2.5 border flex-row items-center gap-x-2"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.borderLight,
                }}
              >
                <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  0 module permissions granted · All enterprise suite tools are locked
                </Text>
              </View>
            </View>
          )}
        </Pressable>

        {/* 10. Shared Preferences (Super Admin Only) */}
        {isSuperAdmin && (
          <Pressable
            className="rounded-2xl border p-4 shadow-xs mb-4 flex-row items-center justify-between active:opacity-75"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            onPress={() => router.push('/(misc)/sharedpref')}
          >
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.cardAlt }}
              >
                <Ionicons name="file-tray-full-outline" size={17} color={colors.textSecondary} />
              </View>
              <View>
                <View className="flex-row items-center gap-x-1.5">
                  <Text className="text-sm font-bold" style={{ color: colors.text }}>
                    Shared Preferences
                  </Text>
                  <View className="rounded px-1.5 py-0.5 bg-indigo-500/15">
                    <Text className="text-[9px] font-bold text-indigo-500">SUPER ADMIN</Text>
                  </View>
                </View>
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                  Inspect local cache, tokens and device keys
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        )}

        {/* 11. Devlomatix Modules & Suite Navigation */}
        <View
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Ionicons name="grid-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Devlomatix Suite Modules
                </Text>
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                  Tap to launch any workspace application
                </Text>
              </View>
            </View>
            <View
              className="rounded-full px-2.5 py-1 border"
              style={{
                backgroundColor:
                  accessibleModulesCount > 0
                    ? colors.primarySoft
                    : isDark
                    ? 'rgba(239, 68, 68, 0.15)'
                    : '#fee2e2',
                borderColor:
                  accessibleModulesCount > 0
                    ? colors.primaryBorder
                    : isDark
                    ? 'rgba(239, 68, 68, 0.3)'
                    : '#fca5a5',
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: accessibleModulesCount > 0 ? colors.primary : '#ef4444' }}
              >
                {accessibleModulesCount === 0
                  ? 'All Locked'
                  : `${accessibleModulesCount} / ${ECOSYSTEM_MODULES.length} Accessible`}
              </Text>
            </View>
          </View>

          {/* Notice Banner when all modules are locked */}
          {accessibleModulesCount === 0 && (
            <View
              className="mb-3 rounded-xl p-3 border flex-row items-start gap-x-2.5"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca',
              }}
            >
              <Ionicons name="lock-closed" size={16} color="#ef4444" style={{ marginTop: 1 }} />
              <View className="flex-1">
                <Text className="text-xs font-bold text-rose-500">
                  Modules Locked & Disabled
                </Text>
                <Text className="text-[11px] mt-0.5 leading-4" style={{ color: colors.textMuted }}>
                  Your account ({user?.email || 'devlomatixsolutions@gmail.com'}) has no active roles or module permissions assigned. All enterprise suite modules are locked.
                </Text>
              </View>
            </View>
          )}

          {/* Module List */}
          {ECOSYSTEM_MODULES.map((mod, idx) => {
            const isAllowed = canAccessModule(mod.id) || canAccessModule(mod.name);
            return (
              <Pressable
                key={mod.id}
                className={`flex-row items-center justify-between py-3.5 active:opacity-70 ${
                  idx > 0 ? 'border-t' : ''
                }`}
                style={{
                  borderTopColor: colors.borderLight,
                  opacity: isAllowed ? 1 : 0.55,
                }}
                onPress={() => {
                  if (isAllowed) {
                    router.push(mod.route);
                  } else {
                    Alert.alert(
                      'Access Restricted',
                      `You do not have authorization to access ${mod.name}. Please contact your workspace administrator to assign the required permissions.`,
                      [{ text: 'OK', style: 'default' }]
                    );
                  }
                }}
              >
                <View className="flex-row items-center gap-x-3 flex-1 mr-2">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: mod.bg }}
                  >
                    <Ionicons name={mod.icon} size={18} color={mod.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-x-2">
                      <Text
                        className="text-xs font-bold tracking-tight"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {mod.name}
                      </Text>
                      <View
                        className="rounded-full px-2 py-0.5 border"
                        style={{
                          backgroundColor: colors.cardAlt,
                          borderColor: colors.borderLight,
                        }}
                      >
                        <Text
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: mod.color }}
                        >
                          {mod.badge}
                        </Text>
                      </View>
                      {!isAllowed && (
                        <View
                          className="rounded-full px-1.5 py-0.5 border flex-row items-center gap-x-1"
                          style={{
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5',
                          }}
                        >
                          <Ionicons name="lock-closed" size={9} color="#ef4444" />
                          <Text className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">
                            Locked
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-[11px] mt-1 leading-4"
                      style={{ color: colors.textMuted }}
                      numberOfLines={1}
                    >
                      {mod.tagline}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-x-1">
                  <View
                    className="rounded-lg px-2.5 py-1.5 border flex-row items-center gap-x-1"
                    style={{
                      backgroundColor: isAllowed
                        ? colors.cardAlt
                        : isDark
                        ? 'rgba(51, 65, 85, 0.4)'
                        : '#f1f5f9',
                      borderColor: isAllowed
                        ? colors.borderLight
                        : isDark
                        ? '#334155'
                        : '#e2e8f0',
                    }}
                  >
                    {!isAllowed && <Ionicons name="lock-closed" size={10} color={colors.textMuted} />}
                    <Text
                      className="text-[11px] font-bold"
                      style={{ color: isAllowed ? colors.primary : colors.textMuted }}
                    >
                      {isAllowed ? 'Open' : 'Locked'}
                    </Text>
                  </View>
                  <Ionicons
                    name={isAllowed ? 'chevron-forward' : 'lock-closed-outline'}
                    size={15}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* 12. Sign Out Button */}
        <Pressable
          className="h-12 flex-row items-center justify-center rounded-xl shadow-xs mb-10 active:opacity-80"
          style={{ backgroundColor: colors.danger || '#ef4444' }}
          onPress={() => setShowLogoutModal(true)}
        >
          <Ionicons name="log-out-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text className="text-xs font-bold text-white">Log Out of Workspace</Text>
        </Pressable>
      </ScrollView>

      {/* Logout Confirmation Sheet Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60 p-4"
          style={{ paddingBottom: Math.max(insets.bottom + 20, 30) }}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable className="w-full gap-2" onPress={(e) => e.stopPropagation()}>
            <View
              className="overflow-hidden rounded-2xl border"
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: colors.border,
              }}
            >
              <View
                className="items-center px-4 py-3.5 border-b"
                style={{ borderBottomColor: colors.borderLight }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.text }}>
                  Log Out of Devlomatix CRM?
                </Text>
                <Text className="mt-0.5 text-[11px]" style={{ color: colors.textMuted }}>
                  You will need to sign back in to access your sales workspace.
                </Text>
              </View>

              <Pressable
                className="items-center py-3 active:opacity-70"
                onPress={async () => {
                  setShowLogoutModal(false);
                  await performLogout();
                }}
              >
                <Text className="text-sm font-bold text-rose-500">
                  Log Out
                </Text>
              </Pressable>
            </View>

            <Pressable
              className="items-center rounded-2xl py-3 border active:opacity-70"
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: colors.border,
              }}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}
