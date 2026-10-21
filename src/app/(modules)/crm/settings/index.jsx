import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
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
import { useCrmTheme } from '../utils/colors';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import * as crmService from '~/services/crm';
import { fetchAccessData } from '~/services/access-management';
import { clearSession, getSession } from '~/utils/authStorage';

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

export default function CrmSettingsScreen({ isTab = false }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useCrmTheme();
  const { themeMode, setThemeMode } = useAppTheme();
  const crm = useCrm();
  const activePipeline = crm?.activePipeline;
  const refreshAll = crm?.refreshAll || (() => {});
  const refreshing = crm?.refreshing || false;

  const [user, setUser] = useState(null);
  const [permModules, setPermModules] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Preference switches
  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    emailUpdates: false,
    autoSyncDrafts: true,
    teamVisibility: true,
    usageAnalytics: false,
    experimentalFeatures: false,
  });

  const togglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
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
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primaryBorder,
                }}
              >
                <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                  Pro
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

        {/* 4. Active Deal Pipeline & Stage Config */}
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
          <View className="flex-row items-center gap-x-2.5 mb-2">
            <View
              className="h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.whatsapp }}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
            </View>
            <View>
              <Text className="text-sm font-bold" style={{ color: colors.whatsapp }}>
                KonnectX WhatsApp Bridge
              </Text>
              <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                Auto-scan conversations & sync contacts
              </Text>
            </View>
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
            onPress={handleSyncWhatsApp}
            disabled={syncingWa}
            className="mt-3.5 flex-row items-center justify-center gap-x-2 rounded-xl py-3 shadow-xs active:opacity-80 min-h-[46px]"
            style={{
              backgroundColor: colors.whatsapp,
              opacity: syncingWa ? 0.5 : 1,
            }}
          >
            {syncingWa ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="sync" size={16} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Sync WhatsApp Chats Now</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* 6. DCR (Daily Call Records) Card */}
        <Pressable
          className="rounded-2xl border p-4 shadow-xs mb-4 active:opacity-75"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          onPress={() => router.push('/(modules)/crm/dcr')}
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
                className="rounded-lg px-2.5 py-1 border"
                style={{
                  backgroundColor: colors.cardAlt,
                  borderColor: colors.borderLight,
                }}
              >
                <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                  Open DCR
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
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
          <View
            className="flex-row items-center justify-between py-3 border-b"
            style={{ borderBottomColor: colors.borderLight }}
          >
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.cardAlt }}
              >
                <Ionicons name="card-outline" size={17} color={colors.copilot} />
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
              className="rounded-full px-2.5 py-1 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.success }}>
                Connected
              </Text>
            </View>
          </View>

          {/* FlowGenix Bridge */}
          <View
            className="flex-row items-center justify-between py-3 border-b"
            style={{ borderBottomColor: colors.borderLight }}
          >
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Ionicons name="sparkles-outline" size={17} color={colors.primary} />
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
              className="rounded-full px-2.5 py-1 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.success }}>
                Active
              </Text>
            </View>
          </View>

          {/* Hireflow Bridge */}
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.infoSoft || colors.cardAlt }}
              >
                <Ionicons name="briefcase-outline" size={17} color={colors.info} />
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
              className="rounded-full px-2.5 py-1 border"
              style={{
                backgroundColor: colors.successSoft,
                borderColor: colors.successBorder,
              }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.success }}>
                Connected
              </Text>
            </View>
          </View>
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
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Real-time call alerts & deals' },
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
        </View>

        {/* 9. Access Management & RBAC Permissions */}
        <Pressable
          className="rounded-2xl border p-4 shadow-xs mb-4"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          onPress={() => router.push('/(modules)/access-management')}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Ionicons name="shield-checkmark-outline" size={17} color={colors.primary} />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Access Management
                </Text>
                <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                  Role-based permissions & security policies
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>

          {/* User Roles */}
          {user?.roles?.length > 0 && (
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
          )}

          {/* User Permissions Preview */}
          {permModules.length > 0 && (
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
          )}
        </Pressable>

        {/* 10. Shared Preferences */}
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
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                Shared Preferences
              </Text>
              <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                Inspect local cache, tokens and device keys
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

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
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                {ECOSYSTEM_MODULES.length} Modules
              </Text>
            </View>
          </View>

          {/* Module List */}
          {ECOSYSTEM_MODULES.map((mod, idx) => (
            <Pressable
              key={mod.id}
              className={`flex-row items-center justify-between py-3.5 active:opacity-70 ${
                idx > 0 ? 'border-t' : ''
              }`}
              style={{ borderTopColor: colors.borderLight }}
              onPress={() => router.push(mod.route)}
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
                  className="rounded-lg px-2.5 py-1.5 border"
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
                    Open
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}

          {/* Productivity Tools Shortcut */}
          <Pressable
            className="mt-3.5 flex-row items-center justify-center gap-x-2 rounded-xl py-3 border active:opacity-70 min-h-[46px]"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.borderLight,
            }}
            onPress={() => router.push('/(tabs)/apps')}
          >
            <Ionicons name="apps-outline" size={16} color={colors.textSecondary} />
            <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
              View All Productivity Tools
            </Text>
          </Pressable>
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
